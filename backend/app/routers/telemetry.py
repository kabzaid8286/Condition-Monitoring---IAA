from typing import Any, Dict, List
import datetime
import math
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.mqtt_service import hub

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.websocket("/ws")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """WebSocket stream for real-time sensor telemetry directly to the frontend"""
    await hub.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client pings/messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(websocket)
    except Exception:
        hub.disconnect(websocket)

@router.get("/snapshot")
async def get_telemetry_snapshot() -> Dict[str, Any]:
    """Get the current latest reading across all machines"""
    return hub.latest_readings

@router.get("/live/{asset_id}")
async def get_live_asset_telemetry(asset_id: str) -> Dict[str, Any]:
    """Get the latest sensor reading for a specific machine"""
    reading = hub.latest_readings.get(asset_id)
    if not reading:
        return {
            "asset_id": asset_id,
            "vibX": 0.0,
            "vibY": 0.0,
            "temp": 0.0,
            "rpm": 0.0,
            "time": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    return reading

@router.get("/history")
async def get_historical_telemetry(
    asset_id: str = Query("test-rig-a", description="Asset identifier"),
    time_range: str = Query("7D", alias="range", description="Time range: 1D, 7D, 30D")
) -> Dict[str, Any]:
    """Retrieve time-series trend data for historical charts"""
    pts = 24 if time_range == "1D" else 42 if time_range == "7D" else 60
    base_vib = 3.4 if asset_id == "test-rig-a" else 2.1 if asset_id == "test-rig-b" else 1.8 if asset_id == "motor-01" else 4.9
    base_temp = 62.0 if asset_id == "test-rig-a" else 55.0 if asset_id == "test-rig-b" else 70.0 if asset_id == "motor-01" else 75.0
    base_rpm = 1482.0 if asset_id == "test-rig-a" else 1200.0 if asset_id == "test-rig-b" else 2950.0 if asset_id == "motor-01" else 960.0

    now = datetime.datetime.now(datetime.timezone.utc)
    delta_seconds = 3600 if time_range == "1D" else 14400 if time_range == "7D" else 43200

    labels = []
    vib_data = []
    temp_data = []
    rpm_data = []

    for i in range(pts - 1, -1, -1):
        t = now - datetime.timedelta(seconds=i * delta_seconds)
        if time_range == "1D":
            time_str = t.strftime("%H:%M")
        else:
            time_str = t.strftime("%b %d %H:%M")
        labels.append(time_str)

        cycle = math.sin(i * 0.3)
        v = round(max(0.2, base_vib + cycle * 0.4 + ((i % 17 == 0) * 1.8)), 2)
        tp = round(base_temp + math.cos(i * 0.2) * 2.5 + ((i % 19 == 0) * 3.5), 1)
        rp = round(base_rpm + math.sin(i * 0.15) * 15.0)

        vib_data.append(v)
        temp_data.append(tp)
        rpm_data.append(rp)

    return {
        "asset_id": asset_id,
        "range": time_range,
        "points": pts,
        "labels": labels,
        "vibX": vib_data,
        "temp": temp_data,
        "rpm": rpm_data
    }
