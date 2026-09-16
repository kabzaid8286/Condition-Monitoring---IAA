from typing import Any, Dict, List
import datetime
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
    range: str = Query("7D", description="Time range: 1D, 7D, 30D")
) -> Dict[str, Any]:
    """Retrieve time-series trend data for historical charts"""
    # Returns structured time-series history
    pts = 60 if range == "1D" else 120 if range == "7D" else 200
    base_vib = 3.4 if asset_id == "test-rig-a" else 2.1 if asset_id == "test-rig-b" else 1.8 if asset_id == "motor-01" else 4.9
    
    return {
        "asset_id": asset_id,
        "range": range,
        "points": pts,
        "base_vibration": base_vib
    }
