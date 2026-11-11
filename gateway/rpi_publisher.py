#!/usr/bin/env python3
"""
Raspberry Pi 5 / PC Condition Monitoring Telemetry Gateway
Condition Monitoring App — IAA / HS Aalen

Publishes real-time high-frequency sensor telemetry to the Eclipse Mosquitto MQTT broker.
Supports:
  1. Serial USB Mode (Seeed Studio XIAO with Vibration + Temp Probe + Coin-Cell Battery)
  2. Bluetooth Low Energy (BLE) Wireless Mode (Seeed Studio XIAO over Nordic UART Service)
  3. Mathematical Simulation Mode (Offline / Testing fallback)
"""

import time
import json
import random
import math
import argparse
import datetime
import glob
import asyncio
import paho.mqtt.client as mqtt

# Nordic UART Service (NUS) UUIDs
NUS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
NUS_TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

# Default Configuration
DEFAULT_BROKER_HOST = "localhost"
DEFAULT_BROKER_PORT = 1883
DEFAULT_INTERVAL_SEC = 1.0
DEFAULT_GATEWAY_ID = "rpi5-iaa-node-01"
DEFAULT_BAUD_RATE = 115200

ASSET_BASELINES = {
    "test-rig-a": {"name": "Test Rig A", "basevib": 0.0024, "basetemp": 45.0, "baserpm": 1480.0},
}

# Per-sensor velocity tracking for numerical derivative (acceleration a = dv / dt)
_velocity_history = {}

def process_sensor_kinematics(asset_id, raw_vx, raw_vy, explicit_ax=None, explicit_ay=None, sample_rate_hz=12800):
    """
    Standardize vibration kinematics:
    1. Converts velocity from mm/s to m/s (if incoming value > 0.05, it is in mm/s -> divide by 1000).
    2. Computes acceleration as the numerical derivative of velocity: a = dv/dt (in m/s^2).
    3. Retains 12.8 kHz sampling rate capability metadata.
    """
    now = time.time()
    
    # Unit conversion: mm/s -> m/s
    vx_ms = (float(raw_vx) / 1000.0) if float(raw_vx) > 0.05 else float(raw_vx)
    vy_ms = (float(raw_vy) / 1000.0) if float(raw_vy) > 0.05 else float(raw_vy)
    
    # Derivative of velocity with respect to time to get acceleration
    hist = _velocity_history.get(asset_id)
    if explicit_ax is not None and explicit_ay is not None:
        ax = float(explicit_ax)
        ay = float(explicit_ay)
    elif hist:
        dt = max(0.005, now - hist["timestamp"])
        ax = (vx_ms - hist["vx"]) / dt
        ay = (vy_ms - hist["vy"]) / dt
    else:
        # Initial estimate based on 1X harmonic acceleration: a = v * 2*pi*f (~25 Hz fundamental)
        ax = vx_ms * 2.0 * math.pi * 25.0
        ay = vy_ms * 2.0 * math.pi * 25.0
        
    _velocity_history[asset_id] = {"vx": vx_ms, "vy": vy_ms, "timestamp": now}
    
    return {
        "vibration_x": round(vx_ms, 6),
        "vibration_y": round(vy_ms, 6),
        "accel_x": round(ax, 3),
        "accel_y": round(ay, 3),
        "accel_g": round(ax / 9.80665, 3),
        "sample_rate_hz": sample_rate_hz
    }


def find_serial_port():
    """Auto-detect connected USB microcontroller ports across macOS and Linux"""
    patterns = [
        "/dev/cu.usbmodem*",
        "/dev/tty.usbmodem*",
        "/dev/cu.usbserial*",
        "/dev/ttyACM*",
        "/dev/ttyUSB*"
    ]
    detected = []
    for pattern in patterns:
        detected.extend(glob.glob(pattern))
    return detected[0] if detected else None


class SensorReader:
    """Interface for sensor reading (Serial USB from XIAO, or Simulated)"""

    def __init__(self, mode="simulation", asset_id="test-rig-a", port=None, baud=DEFAULT_BAUD_RATE):
        self.mode = mode
        self.asset_id = asset_id
        self.port = port
        self.baud = baud
        self.ticks = 0
        self.baseline = ASSET_BASELINES.get(asset_id, ASSET_BASELINES["test-rig-a"])
        self.serial_conn = None
        self.last_reading = None

        if self.mode == "serial":
            self._init_serial()

    def _init_serial(self):
        """Initialize USB serial connection to Seeed Studio XIAO with resilient auto-reconnect"""
        import serial
        while True:
            target_port = self.port or find_serial_port()
            if not target_port:
                print("Waiting for Seeed Studio XIAO USB connection (retrying in 2s)...")
                time.sleep(2)
                continue
            
            try:
                print(f"Opening USB Serial port: {target_port} at {self.baud} baud...")
                self.serial_conn = serial.Serial(target_port, self.baud, timeout=2.0)
                time.sleep(1.5)  # Allow DTR / board reset to stabilize
                print(f"Connected to Seeed Studio XIAO on {target_port}")
                return
            except Exception as err:
                print(f"Unable to open {target_port}: {err}. Retrying in 2s...")
                time.sleep(2)

    def read_telemetry(self):
        """Read sensor data from Serial hardware or simulation model"""
        if self.mode == "serial":
            return self._read_serial()
        return self._read_simulated()

    def _read_serial(self):
        """Read and parse line-by-line JSON payload from Seeed Studio XIAO"""
        while True:
            try:
                line = self.serial_conn.readline().decode('utf-8', errors='replace').strip()
                if not line:
                    continue
                if line.startswith("{") and line.endswith("}"):
                    data = json.loads(line)
                    if data.get("burst_state") == "sleep":
                        if self.last_reading:
                            sleep_reading = dict(self.last_reading)
                            sleep_reading["burst_state"] = "sleep"
                            return sleep_reading
                        continue

                    if "vibration_x" in data or "vib_x" in data or "vx" in data:
                        asset_id = str(data.get("asset_id") or data.get("id") or self.asset_id).strip()
                        asset_name = str(data.get("name") or data.get("asset_name") or asset_id.replace('-', ' ').title()).strip()
                        raw_vx = float(data.get("vibration_x") if data.get("vibration_x") is not None else data.get("vx", data.get("vib_x", 0.0)))
                        raw_vy = float(data.get("vibration_y") if data.get("vibration_y") is not None else data.get("vy", data.get("vib_y", 0.0)))
                        explicit_ax = data.get("accel_x") or data.get("ax")
                        explicit_ay = data.get("accel_y") or data.get("ay")
                        kinematics = process_sensor_kinematics(asset_id, raw_vx, raw_vy, explicit_ax, explicit_ay)

                        reading = {
                            "vibration_x": kinematics["vibration_x"],
                            "vibration_y": kinematics["vibration_y"],
                            "accel_x": kinematics["accel_x"],
                            "accel_y": kinematics["accel_y"],
                            "accel_g": kinematics["accel_g"],
                            "temperature": float(data.get("temperature") if data.get("temperature") is not None else data.get("temp", data.get("t", 0.0))),
                            "rpm": float(data["rpm"]) if "rpm" in data else 0.0,
                            "battery_pct": int(data.get("battery_pct") if data.get("battery_pct") is not None else data.get("bat", data.get("battery", 100))),
                            "sample_rate_hz": kinematics["sample_rate_hz"],
                            "burst_state": str(data.get("burst_state", "active")),
                            "_asset_id": asset_id,
                            "_asset_name": asset_name
                        }
                        self.last_reading = reading
                        return reading
                else:
                    print(f"[XIAO LOG] {line}")
            except (json.JSONDecodeError, ValueError) as err:
                print(f"[SERIAL-WARN] Incomplete packet ({err}): {line}")
            except Exception as e:
                print(f"[SERIAL-ERR] Connection lost: {e}")
                time.sleep(2)
                self._init_serial()

    def _read_simulated(self):
        self.ticks += 1
        t = self.ticks
        base = self.baseline

        # Trigger occasional intermittent vibration spike for anomaly testing
        is_spike = (t % 120 >= 115)

        vib_x_ms = round(max(0.0001, base["basevib"] + math.sin(t * 0.05) * 0.0004 + (0.008 if is_spike else 0.0) + random.uniform(-0.00015, 0.00015)), 6)
        vib_y_ms = round(max(0.0001, (base["basevib"] * 0.55) + math.cos(t * 0.04) * 0.00025 + (0.0045 if is_spike else 0.0) + random.uniform(-0.0001, 0.0001)), 6)
        kinematics = process_sensor_kinematics(self.asset_id, vib_x_ms, vib_y_ms)
        temp = round(max(15.0, base["basetemp"] + math.sin(t * 0.02) * 1.5 + (2.0 if is_spike else 0.0) + random.uniform(-0.3, 0.3)), 2)
        rpm = round(max(100.0, base["baserpm"] + math.sin(t * 0.03) * 12.0 + random.uniform(-3.0, 3.0)), 1)

        return {
            "vibration_x": kinematics["vibration_x"],
            "vibration_y": kinematics["vibration_y"],
            "accel_x": kinematics["accel_x"],
            "accel_y": kinematics["accel_y"],
            "accel_g": kinematics["accel_g"],
            "temperature": temp,
            "rpm": rpm,
            "battery_pct": 98,
            "sample_rate_hz": kinematics["sample_rate_hz"],
            "burst_state": "active"
        }


async def run_ble_mode(mqtt_client, args):
    """
    Asynchronous Bluetooth Low Energy (BLE) ingestion loop.
    Scans for nearby Seeed Studio XIAO sensor nodes advertising Nordic UART Service (NUS),
    connects wirelessly, and publishes live telemetry packets to Mosquitto MQTT.
    """
    from bleak import BleakScanner, BleakClient

    print("📡 [BLE Gateway] Starting Bluetooth LE multi-node wireless receiver...")
    print(f"Targeting devices advertising 'IAA-*' or Nordic UART Service ({NUS_SERVICE_UUID})")

    connected_addresses = set()

    async def handle_device_connection(device):
        address = device.address
        name = device.name or "IAA-Sensor"
        connected_addresses.add(address)
        line_buffer = ""

        def handle_rx(_: int, data: bytearray):
            nonlocal line_buffer
            text = data.decode("utf-8", errors="replace")
            line_buffer += text
            while "\n" in line_buffer:
                line, line_buffer = line_buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue
                if line.startswith("{") and line.endswith("}"):
                    try:
                        payload_json = json.loads(line)
                        if payload_json.get("burst_state") == "sleep":
                            print(f"💤 [BLE] {name} entering low-power sleep for duty cycle.")
                            continue

                        asset_id = str(payload_json.get("asset_id") or payload_json.get("id") or args.asset).strip()
                        asset_name = str(payload_json.get("name") or payload_json.get("asset_name") or asset_id.replace("-", " ").title()).strip()
                        raw_vx = float(payload_json.get("vibration_x") if payload_json.get("vibration_x") is not None else payload_json.get("vx", payload_json.get("vib_x", 0.0)))
                        raw_vy = float(payload_json.get("vibration_y") if payload_json.get("vibration_y") is not None else payload_json.get("vy", payload_json.get("vib_y", 0.0)))
                        explicit_ax = payload_json.get("accel_x") or payload_json.get("ax")
                        explicit_ay = payload_json.get("accel_y") or payload_json.get("ay")
                        kinematics = process_sensor_kinematics(asset_id, raw_vx, raw_vy, explicit_ax, explicit_ay)

                        readings = {
                            "vibration_x": kinematics["vibration_x"],
                            "vibration_y": kinematics["vibration_y"],
                            "accel_x": kinematics["accel_x"],
                            "accel_y": kinematics["accel_y"],
                            "accel_g": kinematics["accel_g"],
                            "temperature": float(payload_json.get("temperature") if payload_json.get("temperature") is not None else payload_json.get("temp", payload_json.get("t", 0.0))),
                            "rpm": float(payload_json["rpm"]) if "rpm" in payload_json else 0.0,
                            "battery_pct": int(payload_json.get("battery_pct") if payload_json.get("battery_pct") is not None else payload_json.get("bat", payload_json.get("b", 100))),
                            "sample_rate_hz": kinematics["sample_rate_hz"],
                            "burst_state": str(payload_json.get("burst_state", "active"))
                        }

                        topic = f"sensors/{asset_id}/telemetry"
                        msg = {
                            "asset_id": asset_id,
                            "asset_name": asset_name,
                            "name": asset_name,
                            "gateway_id": args.gateway_id,
                            "transport": "ble",
                            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                            "sensors": readings,
                            "quality": 100
                        }
                        mqtt_client.publish(topic, json.dumps(msg), qos=0)
                        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [BLE-WIRELESS] [{asset_id} ({asset_name})] VelX: {readings['vibration_x']:.4f} m/s | AccelX: {readings['accel_x']:.2f} m/s² | Temp: {readings['temperature']:.1f} °C | RPM: {readings['rpm']:.0f} | Battery: {readings['battery_pct']}% (12.8 kHz)")
                    except Exception as err:
                        print(f"[BLE-WARN] Incomplete JSON packet ({err}): {line}")
                else:
                    print(f"[BLE LOG] {line}")

        try:
            print(f"🔗 [BLE] Connecting wirelessly to {name} ({address})...")
            async with BleakClient(address) as client:
                print(f"✅ [BLE] Connected wirelessly to {name}!")
                await client.start_notify(NUS_TX_CHAR_UUID, handle_rx)
                print(f"📥 [BLE] Subscribed to {name} Nordic UART stream. Streaming live...")

                while client.is_connected:
                    await asyncio.sleep(1)

            print(f"⚠️ [BLE] Disconnected from wireless node {name}.")
        except Exception as e:
            print(f"[BLE-ERR] Connection error on {name}: {e}")
        finally:
            connected_addresses.discard(address)

    tasks = set()
    while True:
        try:
            # Clean up finished tasks
            tasks = {t for t in tasks if not t.done()}

            # Scan for advertising sensor nodes not yet connected
            devices = await BleakScanner.discover(timeout=4.0, return_adv=True)
            for d, adv in devices.values():
                name = d.name or adv.local_name or ""
                uuids = [u.lower() for u in (adv.service_uuids or [])]
                if (name.startswith("IAA-") or NUS_SERVICE_UUID in uuids) and d.address not in connected_addresses:
                    print(f"🎯 [BLE] Discovered new wireless sensor: '{name}' ({d.address}) RSSI: {adv.rssi} dBm")
                    task = asyncio.create_task(handle_device_connection(d))
                    tasks.add(task)

            await asyncio.sleep(2)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[BLE-SCAN-ERR] Scan loop error: {e}. Retrying in 3s...")
            await asyncio.sleep(3)


async def run_serial_worker(mqtt_client, args):
    """
    Asynchronous USB Serial ingestion worker.
    Continuously checks for connected Seeed Studio XIAO microcontrollers on USB,
    reads line-by-line JSON telemetry, processes kinematics, and publishes to MQTT.
    """
    import serial
    print("🔌 [Serial Gateway] Monitoring for Seeed Studio XIAO USB connections...")
    
    while True:
        target_port = args.serial_port or find_serial_port()
        if not target_port:
            await asyncio.sleep(2)
            continue

        try:
            print(f"🔌 [Serial Gateway] Detected microcontroller on {target_port}. Connecting at {args.baud} baud...")
            ser = serial.Serial(target_port, args.baud, timeout=1.0)
            await asyncio.sleep(1.0)
            print(f"✅ [Serial Gateway] Connected to Seeed Studio XIAO on {target_port}!")

            loop = asyncio.get_running_loop()
            while True:
                line = await loop.run_in_executor(None, ser.readline)
                if not line:
                    await asyncio.sleep(0.01)
                    continue

                line_str = line.decode('utf-8', errors='replace').strip()
                if not line_str:
                    continue

                if line_str.startswith("{") and line_str.endswith("}"):
                    try:
                        data = json.loads(line_str)
                        if data.get("burst_state") == "sleep":
                            continue

                        asset_id = str(data.get("asset_id") or data.get("id") or args.asset).strip()
                        asset_name = str(data.get("name") or data.get("asset_name") or asset_id.replace('-', ' ').title()).strip()
                        raw_vx = float(data.get("vibration_x") if data.get("vibration_x") is not None else data.get("vx", data.get("vib_x", 0.0)))
                        raw_vy = float(data.get("vibration_y") if data.get("vibration_y") is not None else data.get("vy", data.get("vib_y", 0.0)))
                        explicit_ax = data.get("accel_x") or data.get("ax")
                        explicit_ay = data.get("accel_y") or data.get("ay")
                        kinematics = process_sensor_kinematics(asset_id, raw_vx, raw_vy, explicit_ax, explicit_ay)

                        readings = {
                            "vibration_x": kinematics["vibration_x"],
                            "vibration_y": kinematics["vibration_y"],
                            "accel_x": kinematics["accel_x"],
                            "accel_y": kinematics["accel_y"],
                            "accel_g": kinematics["accel_g"],
                            "temperature": float(data.get("temperature") if data.get("temperature") is not None else data.get("temp", data.get("t", 0.0))),
                            "rpm": float(data["rpm"]) if "rpm" in data else 0.0,
                            "battery_pct": int(data.get("battery_pct") if data.get("battery_pct") is not None else data.get("bat", data.get("battery", 100))),
                            "sample_rate_hz": kinematics["sample_rate_hz"],
                            "burst_state": str(data.get("burst_state", "active"))
                        }

                        topic = f"sensors/{asset_id}/telemetry"
                        payload = {
                            "asset_id": asset_id,
                            "asset_name": asset_name,
                            "name": asset_name,
                            "gateway_id": args.gateway_id,
                            "transport": "usb_serial",
                            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                            "sensors": readings,
                            "quality": 100
                        }
                        mqtt_client.publish(topic, json.dumps(payload), qos=0)
                        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [USB-SERIAL] [{asset_id} ({asset_name})] VelX: {readings['vibration_x']:.4f} m/s | AccelX: {readings['accel_x']:.2f} m/s² | Temp: {readings['temperature']:.1f} °C | RPM: {readings['rpm']:.0f} | Battery: {readings['battery_pct']}% (12.8 kHz)")
                    except Exception as err:
                        print(f"[SERIAL-WARN] Incomplete packet ({err}): {line_str}")
                else:
                    print(f"[XIAO LOG] {line_str}")
        except Exception as e:
            print(f"[SERIAL-ERR] Connection lost on {target_port}: {e}. Retrying in 2s...")
            await asyncio.sleep(2)


async def run_auto_mode(mqtt_client, args):
    """
    Concurrent Auto Mode: Runs both USB Serial detection and BLE Wireless ingestion simultaneously.
    Allows zero-configuration hardware connectivity (cable or battery).
    """
    print("🚀 [Gateway] Starting Auto Dual Mode (USB Serial + BLE Wireless Ingestion)...")
    await asyncio.gather(
        run_serial_worker(mqtt_client, args),
        run_ble_mode(mqtt_client, args)
    )


def main():
    parser = argparse.ArgumentParser(description="Raspberry Pi 5 / PC Condition Monitoring Telemetry Gateway")
    parser.add_argument("--host", default=DEFAULT_BROKER_HOST, help="MQTT Broker Host (default: localhost)")
    parser.add_argument("--port", type=int, default=DEFAULT_BROKER_PORT, help="MQTT Broker Port (default: 1883)")
    parser.add_argument("--asset", default="", help="Monitored Asset ID fallback (auto-detected from microcontroller)")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL_SEC, help="Publish interval in seconds (default: 1.0)")
    parser.add_argument("--mode", default="auto", choices=["auto", "ble", "serial", "simulation"], help="Data mode: 'auto' (Concurrent USB Serial + BLE), 'ble' (Wireless Bluetooth), 'serial' (USB only), or 'simulation'")
    parser.add_argument("--serial-port", default=None, help="Explicit USB serial port (e.g. /dev/cu.usbmodem1101 or /dev/ttyACM0). Auto-detects if omitted.")
    parser.add_argument("--baud", type=int, default=DEFAULT_BAUD_RATE, help="Serial baud rate (default: 115200)")
    parser.add_argument("--gateway-id", default=DEFAULT_GATEWAY_ID, help="Gateway identifier")

    args = parser.parse_args()

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"{args.gateway_id}-{args.asset}")

    def on_connect(c, userdata, flags, rc, properties=None):
        if rc == 0:
            print(f"✅ Connected to MQTT Broker at {args.host}:{args.port}")
        else:
            print(f"❌ Failed to connect to MQTT broker, return code: {rc}")

    client.on_connect = on_connect

    print(f"🔌 Connecting to MQTT Broker at {args.host}:{args.port}...")
    connected = False
    while not connected:
        try:
            client.connect(args.host, args.port, keepalive=60)
            client.loop_start()
            connected = True
        except Exception as e:
            print(f"⚠️ Waiting for Mosquitto broker ({e}). Retrying in 2s...")
            time.sleep(2)

    # Dispatch to Auto Dual Mode (Concurrent Serial + BLE)
    if args.mode == "auto":
        try:
            asyncio.run(run_auto_mode(client, args))
        except KeyboardInterrupt:
            print("\n🛑 Gateway stopped by user.")
        finally:
            client.loop_stop()
            client.disconnect()
        return

    # Dispatch to Bluetooth Low Energy async mode
    if args.mode == "ble":
        print(f"🚀 Gateway started [BLE WIRELESS mode]")
        try:
            asyncio.run(run_ble_mode(client, args))
        except KeyboardInterrupt:
            print("\n🛑 Gateway stopped by user.")
        finally:
            client.loop_stop()
            client.disconnect()
        return

    # Standard Serial USB or Simulation mode
    try:
        reader = SensorReader(mode=args.mode, asset_id=args.asset, port=args.serial_port, baud=args.baud)
    except ConnectionError:
        print("\n🔄 Falling back to simulation mode so testing can continue uninterrupted...")
        reader = SensorReader(mode="simulation", asset_id=args.asset)
        args.mode = "simulation"

    print(f"🚀 Gateway started [{args.mode.upper()} mode]")
    print(f"📡 Dynamic MQTT Telemetry publishing at {1.0 / args.interval:.1f} Hz")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            readings = reader.read_telemetry()
            current_asset_id = readings.pop("_asset_id", args.asset)
            current_asset_name = readings.pop("_asset_name", current_asset_id.replace('-', ' ').title())

            topic = f"sensors/{current_asset_id}/telemetry"
            payload = {
                "asset_id": current_asset_id,
                "asset_name": current_asset_name,
                "name": current_asset_name,
                "gateway_id": args.gateway_id,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "sensors": readings,
                "quality": 100
            }

            msg_str = json.dumps(payload)
            client.publish(topic, msg_str, qos=0)
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [{current_asset_id} ({current_asset_name})] VelX: {readings['vibration_x']:.4f} m/s | AccelX: {readings.get('accel_x', 0.0):.2f} m/s² | Temp: {readings['temperature']:.1f} °C | RPM: {readings['rpm']:.0f} | Battery: {readings.get('battery_pct', 100)}% (12.8 kHz)")

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n🛑 Gateway stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
