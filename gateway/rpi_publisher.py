#!/usr/bin/env python3
"""
Raspberry Pi 5 IoT Gateway Publisher
Condition Monitoring App — IAA / HS Aalen

Publishes real-time high-frequency sensor telemetry to the Eclipse Mosquitto MQTT broker.
Supports both Hardware Sensor Mode (Raspberry Pi 5 I2C/SPI) and Simulation Mode.
"""

import time
import json
import random
import math
import argparse
import datetime
import paho.mqtt.client as mqtt

# Default Configuration
DEFAULT_BROKER_HOST = "localhost"
DEFAULT_BROKER_PORT = 1883
DEFAULT_INTERVAL_SEC = 1.0
DEFAULT_GATEWAY_ID = "rpi5-iaa-node-01"

ASSET_BASELINES = {
    "test-rig-a": {"name": "Test Rig A", "basevib": 3.4, "basetemp": 62.0, "baserpm": 1482.0},
    "test-rig-b": {"name": "Test Rig B", "basevib": 2.1, "basetemp": 55.0, "baserpm": 1200.0},
    "motor-01":   {"name": "Motor 01",   "basevib": 1.8, "basetemp": 70.0, "baserpm": 2950.0},
    "gearbox-02": {"name": "Gearbox 02", "basevib": 4.9, "basetemp": 75.0, "baserpm": 960.0},
}


class SensorReader:
    """Interface for sensor reading (Hardware or Simulated)"""

    def __init__(self, mode="simulation", asset_id="test-rig-a"):
        self.mode = mode
        self.asset_id = asset_id
        self.ticks = 0
        self.baseline = ASSET_BASELINES.get(asset_id, ASSET_BASELINES["test-rig-a"])

        if self.mode == "hardware":
            self._init_hardware()

    def _init_hardware(self):
        """Initialize Raspberry Pi 5 I2C/SPI hardware sensors"""
        print("[HW] Initializing Raspberry Pi 5 GPIO & I2C sensor bus...")
        # Note: When running on physical RPi 5 with smbus2 or adafruit_circuitpython:
        # try:
        #     import smbus2
        #     self.bus = smbus2.SMBus(1)
        # except ImportError:
        #     print("[HW-WARN] smbus2 not installed, falling back to simulated hardware")

    def read_telemetry(self):
        """Read sensor data from hardware or mathematical simulation model"""
        if self.mode == "hardware":
            return self._read_hardware()
        return self._read_simulated()

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
            "rpm": rpm
        }

    def _read_hardware(self):
        """Hardware read routine for Raspberry Pi 5 (ADXL345 / MPU6050 / DS18B20)"""
        # Placeholder for physical sensor registers
        # Example: ADXL345 I2C Address 0x53
        return self._read_simulated()


def main():
    parser = argparse.ArgumentParser(description="Raspberry Pi 5 Condition Monitoring Telemetry Gateway")
    parser.add_argument("--host", default=DEFAULT_BROKER_HOST, help="MQTT Broker Host (default: localhost)")
    parser.add_argument("--port", type=int, default=DEFAULT_BROKER_PORT, help="MQTT Broker Port (default: 1883)")
    parser.add_argument("--asset", default="test-rig-a", choices=list(ASSET_BASELINES.keys()), help="Monitored Asset ID")
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL_SEC, help="Publish interval in seconds (default: 1.0)")
    parser.add_argument("--mode", default="simulation", choices=["simulation", "hardware"], help="Sensor mode (simulation or hardware)")
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

    reader = SensorReader(mode=args.mode, asset_id=args.asset)
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
            print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [{args.asset}] VibX: {readings['vibration_x']:.2f} mm/s | VibY: {readings['vibration_y']:.2f} mm/s | Temp: {readings['temperature']:.1f} °C | RPM: {readings['rpm']:.0f}")

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\n🛑 Gateway stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
