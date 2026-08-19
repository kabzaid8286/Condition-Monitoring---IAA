from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import get_settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    environment: str


class Measurement(BaseModel):
    sensor_key: str = Field(examples=["motor_drive_end_vibration_rms"])
    value: float
    unit: str = Field(examples=["mm/s"])
    observed_at: datetime


class IngestionBatch(BaseModel):
    gateway_id: str = Field(examples=["iaa-gateway-01"])
    asset_key: str = Field(examples=["test-rig-a"])
    measurements: list[Measurement] = Field(min_length=1, max_length=5_000)


@router.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", environment=settings.app_env)


@router.post("/ingestion/measurements", status_code=202, tags=["ingestion"])
def ingest_measurements(batch: IngestionBatch) -> dict[str, int | str]:
    """Validate an incoming gateway batch. Persistence is added with the first migration."""
    return {"status": "accepted", "measurement_count": len(batch.measurements)}
