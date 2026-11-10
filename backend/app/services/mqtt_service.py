"""
MQTT Telemetry Consumer & WebSocket Live Stream Service
Condition Monitoring App — IAA / HS Aalen
"""

import json
import time
import asyncio
import logging
import threading
from datetime import datetime, timezone
from typing import Dict, Set, Any
import paho.mqtt.client as mqtt
from fastapi import WebSocket

logger = logging.getLogger("mqtt_service")

class TelemetryHub:
    """Manages real-time telemetry cache and active WebSocket connections"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.latest_readings: Dict[str, Dict[str, Any]] = {}
        self.mqtt_client: mqtt.Client = None
        self._loop = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send current snapshot on connect
        await websocket.send_text(json.dumps({
            "type": "SNAPSHOT",
            "data": self.latest_readings
        }))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        msg_json = json.dumps(message)
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_text(msg_json)
            except Exception:
                dead.append(ws)
        for d in dead:
            self.active_connections.discard(d)

    def handle_mqtt_message(self, client, userdata, msg):
        """Called when an MQTT message arrives from Raspberry Pi 5"""
        try:
            payload = json.loads(msg.payload.decode('utf-8'))
            asset_id = payload.get("asset_id", "test-rig-a")
            asset_name = payload.get("name") or payload.get("asset_name") or asset_id.replace('-', ' ').title()
            sensors = payload.get("sensors", {})

            previous = self.latest_readings.get(asset_id, {})
            raw_vx = float(sensors.get("vibration_x", 0.0))
            raw_temp = float(sensors.get("temperature", 0.0))
            burst_st = str(sensors.get("burst_state", "active"))

            # Retain last valid readings during duty-cycle sleep so dashboard never zeroes out
            if raw_vx == 0.0 and raw_temp == 0.0 and burst_st == "sleep" and float(previous.get("vibX", 0.0)) > 0.0:
                vx = previous.get("vibX", 0.0)
                vy = previous.get("vibY", 0.0)
                ax = previous.get("accelX", 0.0)
                ay = previous.get("accelY", 0.0)
                tp = previous.get("temp", 0.0)
                rp = previous.get("rpm", 1480.0)
            else:
                vx = raw_vx
                vy = float(sensors.get("vibration_y", 0.0))
                ax = float(sensors.get("accel_x", 0.0))
                ay = float(sensors.get("accel_y", 0.0))
                tp = raw_temp
                rp = float(sensors.get("rpm", 1480.0))

            data_item = {
                "asset_id": asset_id,
                "name": asset_name,
                "asset_name": asset_name,
                "vibX": vx,
                "vibY": vy,
                "accelX": ax,
                "accelY": ay,
                "temp": tp,
                "rpm": rp,
                "battery_pct": sensors.get("battery_pct", 100),
                "sample_rate_hz": sensors.get("sample_rate_hz", 12800),
                "burst_state": burst_st,
                "time": payload.get("timestamp", datetime.now(timezone.utc).isoformat())
            }

            self.latest_readings[asset_id] = data_item

            # Schedule broadcast in the running asyncio loop
            if self._loop and not self._loop.is_closed():
                asyncio.run_coroutine_threadsafe(
                    self.broadcast({"type": "TELEMETRY", "data": data_item}),
                    self._loop
                )
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")

    def start_mqtt(self, broker_host="localhost", broker_port=1883, loop=None):
        """Initialize and connect MQTT client"""
        self._loop = loop or asyncio.get_event_loop()
        self.mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="fastapi-backend-consumer")
        self.mqtt_client.on_message = self.handle_mqtt_message

        def on_connect(c, userdata, flags, rc, properties=None):
            if rc == 0:
                logger.info(f"Connected to Mosquitto MQTT broker at {broker_host}:{broker_port}")
                c.subscribe("sensors/+/telemetry")
                logger.info("Subscribed to topic: sensors/+/telemetry")
            else:
                logger.warning(f"MQTT connection failed with code {rc}")

        def on_disconnect(c, userdata, flags, rc, properties=None):
            if rc != 0:
                logger.warning(f"Unexpected MQTT disconnection (code {rc}). Reconnecting...")

        self.mqtt_client.on_connect = on_connect
        self.mqtt_client.on_disconnect = on_disconnect
        self.mqtt_client.reconnect_delay_set(min_delay=1, max_delay=10)

        def connection_worker():
            connected = False
            while not connected:
                try:
                    self.mqtt_client.connect(broker_host, broker_port, keepalive=60)
                    self.mqtt_client.loop_start()
                    connected = True
                    logger.info("MQTT connection established and background loop running")
                except Exception as e:
                    logger.warning(f"Waiting for Mosquitto broker ({e}). Retrying in 2s...")
                    time.sleep(2)

        thread = threading.Thread(target=connection_worker, daemon=True)
        thread.start()

    def stop_mqtt(self):
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()


hub = TelemetryHub()
