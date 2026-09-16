"""
MQTT Telemetry Consumer & WebSocket Live Stream Service
Condition Monitoring App — IAA / HS Aalen
"""

import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Any
import paho.mqtt.client as mqtt
from fastapi import WebSocket

logger = logging.getLogger("mqtt_service")

class TelemetryHub:
    """Manages real-time telemetry cache and active WebSocket connections"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.latest_readings: Dict[str, Dict[str, Any]] = {
            "test-rig-a": {"vibX": 3.42, "vibY": 1.88, "temp": 62.1, "rpm": 1482.0, "time": datetime.now(timezone.utc).isoformat()},
            "test-rig-b": {"vibX": 2.10, "vibY": 1.15, "temp": 55.0, "rpm": 1200.0, "time": datetime.now(timezone.utc).isoformat()},
            "motor-01":   {"vibX": 1.80, "vibY": 0.99, "temp": 70.2, "rpm": 2950.0, "time": datetime.now(timezone.utc).isoformat()},
            "gearbox-02": {"vibX": 4.90, "vibY": 2.69, "temp": 75.1, "rpm": 960.0,  "time": datetime.now(timezone.utc).isoformat()},
        }
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
            sensors = payload.get("sensors", {})

            data_item = {
                "asset_id": asset_id,
                "vibX": sensors.get("vibration_x", 0.0),
                "vibY": sensors.get("vibration_y", 0.0),
                "temp": sensors.get("temperature", 0.0),
                "rpm": sensors.get("rpm", 0.0),
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

        self.mqtt_client.on_connect = on_connect

        try:
            self.mqtt_client.connect(broker_host, broker_port, keepalive=60)
            self.mqtt_client.loop_start()
            logger.info("MQTT loop started successfully")
        except Exception as e:
            logger.warning(f"Could not connect to MQTT broker ({e}). Will retry automatically when available.")

    def stop_mqtt(self):
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()


hub = TelemetryHub()
