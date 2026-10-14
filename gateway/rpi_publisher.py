#!/usr/bin/env python3
"""
Raspberry Pi 5 / PC Condition Monitoring Telemetry Gateway
Condition Monitoring App — IAA / HS Aalen

Publishes real-time high-frequency sensor telemetry to the Eclipse Mosquitto MQTT broker.
Supports:
  1. Serial USB Mode (Seeed Studio XIAO with Vibration + Temp Probe + Coin-Cell Battery)
  2. Mathematical Simulation Mode (Offline / Testing fallback)
"""

import time
import json
import random
import math
import argparse
import datetime
import glob
import paho.mqtt.client as mqtt

# Default Configuration
DEFAULT_BROKER_HOST = "localhost"
DEFAULT_BROKER_PORT = 1883
DEFAULT_INTERVAL_SEC = 1.0
DEFAULT_GATEWAY_ID = "rpi5-iaa-node-01"
DEFAULT_BAUD_RATE = 115200

ASSET_BASELINES = {
    "test-rig-a": {"name": "Test Rig A", "basevib": 3.4, "basetemp": 62.0, "baserpm": 1482.0},
    "test-rig-b": {"name": "Test Rig B", "basevib": 2.1, "basetemp": 55.0, "baserpm": 1200.0},
    "motor-01":   {"name": "Motor 01",   "basevib": 1.8, "basetemp": 70.0, "baserpm": 2950.0},
    "gearbox-02": {"name": "Gearbox 02", "basevib": 4.9, "basetemp": 75.0, "baserpm": 960.0},
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

        if self.mode == "serial":
            self._init_serial()

    def _init_serial(self):
        """Initialize USB serial connection to Seeed Studio XIAO"""
        import serial
        target_port = self.port or find_serial_port()
        if not target_port:
            print("⚠️ No USB microcontroller port detected automatically.")
            print("   Available ports:", glob.glob("/dev/cu.*")[:4] or "None")
            print("   Please check USB-C connection or specify --serial-port manually.")
            raise ConnectionError("USB Serial port not found")
        
        print(f"🔌 Opening USB Serial port: {target_port} at {self.baud} baud...")
        self.serial_conn = serial.Serial(target_port, self.baud, timeout=2.0)
        time.sleep(1.5)  # Allow DTR / board reset to stabilize
        print(f"✅ Connected to Seeed Studio XIAO on {target_port}")

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
                    return {
                        "vibration_x": float(data.get("vibration_x", data.get("vib_x", 0.0))),
                        "vibration_y": float(data.get("vibration_y", data.get("vib_y", 0.0))),
                        "temperature": float(data.get("temperature", data.get("temp", 0.0))),
                        "rpm": float(data.get("rpm", 1500.0)),
                        "battery_pct": int(data.get("battery_pct", data.get("battery", 100))),
                        "burst_state": str(data.get("burst_state", "active"))
                    }
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


def main():
    parser = argparse.ArgumentParser(description="Raspberry Pi 5 / PC Condition Monitoring Telemetry Gateway")
    parser.add_argument("--host", default=DEFAULT_BROKER_HOST, help="MQTT Broker Host (default: localhost)")
    parser.add_argument("--port", type=int, default=DEFAULT_BROKER_PORT, help="MQTT Broker Port (default: 1883)")
    parser.add_argument("--asset", default="test-rig-a", choices=list(ASSET_BASELINES.keys()), help="Monitored Asset ID")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL_SEC, help="Publish interval in seconds (default: 1.0)")
    parser.add_argument("--mode", default="simulation", choices=["simulation", "serial"], help="Data mode: 'simulation' or 'serial' (USB Seeed Studio XIAO)")
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

    try:
        reader = SensorReader(mode=args.mode, asset_id=args.asset, port=args.serial_port, baud=args.baud)
    except ConnectionError:
        print("\n🔄 Falling back to simulation mode so testing can continue uninterrupted...")
        reader = SensorReader(mode="simulation", asset_id=args.asset)
        args.mode = "simulation"

    topic = f"sensors/{args.asset}/telemetry"

    print(f"🚀 Gateway started [{args.mode.upper()} mode]")
    print(f"📡 Publishing to topic: {topic} at {1.0 / args.interval:.1f} Hz")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            readings = reader.read_telemetry()
            payload = {
                "asset_id": args.asset,
                "gateway_id": args.gateway_id,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "sensors": readings,
                "quality": 100
            }

            msg_str = json.dumps(payload)
            client.publish(topic, msg_str, qos=0)
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [{args.asset}] VibX: {readings['vibration_x']:.2f} mm/s | VibY: {readings['vibration_y']:.2f} mm/s | Temp: {readings['temperature']:.1f} °C | RPM: {readings['rpm']:.0f} | Battery: {readings.get('battery_pct', 100)}%")

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n🛑 Gateway stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
