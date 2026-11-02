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
    "test-rig-a": {"name": "Test Rig A", "basevib": 2.4, "basetemp": 45.0, "baserpm": 1480.0},
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

                    if "vibration_x" in data or "vib_x" in data:
                        asset_id = str(data.get("asset_id") or self.asset_id).strip()
                        asset_name = str(data.get("name") or data.get("asset_name") or asset_id.replace('-', ' ').title()).strip()
                        reading = {
                            "vibration_x": float(data.get("vibration_x", data.get("vib_x", 0.0))),
                            "vibration_y": float(data.get("vibration_y", data.get("vib_y", 0.0))),
                            "temperature": float(data.get("temperature", data.get("temp", 0.0))),
                            "rpm": float(data.get("rpm", 1480.0)),
                            "battery_pct": int(data.get("battery_pct", data.get("battery", 100))),
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

        vib_x = round(max(0.1, base["basevib"] + math.sin(t * 0.05) * 0.4 + (8.0 if is_spike else 0.0) + random.uniform(-0.15, 0.15)), 3)
        vib_y = round(max(0.1, (base["basevib"] * 0.55) + math.cos(t * 0.04) * 0.25 + (4.5 if is_spike else 0.0) + random.uniform(-0.1, 0.1)), 3)
        temp = round(max(15.0, base["basetemp"] + math.sin(t * 0.02) * 1.5 + (2.0 if is_spike else 0.0) + random.uniform(-0.3, 0.3)), 2)
        rpm = round(max(100.0, base["baserpm"] + math.sin(t * 0.03) * 12.0 + random.uniform(-3.0, 3.0)), 1)

        return {
            "vibration_x": vib_x,
            "vibration_y": vib_y,
            "temperature": temp,
            "rpm": rpm,
            "battery_pct": 98,
            "burst_state": "active"
        }


async def run_ble_mode(mqtt_client, args):
    """
    Asynchronous Bluetooth Low Energy (BLE) ingestion loop.
    Scans for nearby Seeed Studio XIAO sensor nodes advertising Nordic UART Service (NUS),
    connects wirelessly, and publishes live telemetry packets to Mosquitto MQTT.
    """
    from bleak import BleakScanner, BleakClient

    print("📡 [BLE Gateway] Starting Bluetooth LE wireless receiver...")
    print(f"Targeting devices advertising 'IAA-*' or Nordic UART Service ({NUS_SERVICE_UUID})")

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
                        print("💤 [BLE] Sensor entering low-power sleep for duty cycle.")
                        continue

                    asset_id = str(payload_json.get("asset_id") or args.asset).strip()
                    asset_name = str(payload_json.get("name") or payload_json.get("asset_name") or asset_id.replace("-", " ").title()).strip()
                    readings = {
                        "vibration_x": float(payload_json.get("vibration_x", 0.0)),
                        "vibration_y": float(payload_json.get("vibration_y", 0.0)),
                        "temperature": float(payload_json.get("temperature", 0.0)),
                        "rpm": float(payload_json.get("rpm", 1480.0)),
                        "battery_pct": int(payload_json.get("battery_pct", 100)),
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
                    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [BLE-WIRELESS] [{asset_id} ({asset_name})] VibX: {readings['vibration_x']:.2f} mm/s | VibY: {readings['vibration_y']:.2f} mm/s | Temp: {readings['temperature']:.1f} °C | RPM: {readings['rpm']:.0f} | Battery: {readings['battery_pct']}%")
                except Exception as err:
                    print(f"[BLE-WARN] Incomplete JSON packet ({err}): {line}")
            else:
                print(f"[BLE LOG] {line}")

    while True:
        try:
            print("🔍 [BLE] Scanning for nearby Seeed Studio XIAO nodes...")
            devices = await BleakScanner.discover(timeout=5.0, return_adv=True)
            target_device = None
            for d, adv in devices.values():
                name = d.name or adv.local_name or ""
                uuids = [u.lower() for u in (adv.service_uuids or [])]
                if name.startswith("IAA-") or NUS_SERVICE_UUID in uuids:
                    target_device = d
                    print(f"🎯 [BLE] Discovered wireless sensor: '{name}' ({d.address}) RSSI: {adv.rssi} dBm")
                    break

            if not target_device:
                print("⏳ [BLE] No XIAO node in advertising range. Retrying scan in 3s...")
                await asyncio.sleep(3)
                continue

            print(f"🔗 [BLE] Connecting wirelessly to {target_device.name or target_device.address}...")
            async with BleakClient(target_device.address) as client:
                print(f"✅ [BLE] Connected wirelessly to {target_device.name}!")
                await client.start_notify(NUS_TX_CHAR_UUID, handle_rx)
                print("📥 [BLE] Subscribed to Nordic UART stream. Streaming live wireless telemetry to MQTT...")

                while client.is_connected:
                    await asyncio.sleep(1)

            print("⚠️ [BLE] Disconnected from wireless node. Rescanning...")
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[BLE-ERR] Communication error: {e}. Retrying in 3s...")
            await asyncio.sleep(3)


def main():
    parser = argparse.ArgumentParser(description="Raspberry Pi 5 / PC Condition Monitoring Telemetry Gateway")
    parser.add_argument("--host", default=DEFAULT_BROKER_HOST, help="MQTT Broker Host (default: localhost)")
    parser.add_argument("--port", type=int, default=DEFAULT_BROKER_PORT, help="MQTT Broker Port (default: 1883)")
    parser.add_argument("--asset", default="test-rig-a", help="Monitored Asset ID fallback (default: test-rig-a or auto-detected from microcontroller)")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL_SEC, help="Publish interval in seconds (default: 1.0)")
    parser.add_argument("--mode", default="simulation", choices=["simulation", "serial", "ble"], help="Data mode: 'simulation', 'serial' (USB Seeed Studio XIAO), or 'ble' (Wireless Bluetooth)")
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
    try:
        client.connect(args.host, args.port, keepalive=60)
        client.loop_start()
    except Exception as e:
        print(f"⚠️ Connection error: {e}")
        print("💡 Make sure Mosquitto container is running (docker compose up -d)")

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
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [{current_asset_id} ({current_asset_name})] VibX: {readings['vibration_x']:.2f} mm/s | VibY: {readings['vibration_y']:.2f} mm/s | Temp: {readings['temperature']:.1f} °C | RPM: {readings['rpm']:.0f} | Battery: {readings.get('battery_pct', 100)}%")

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n🛑 Gateway stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
