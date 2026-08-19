from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.sensor import Sensor, SensorReading
from app.schemas.sensor import SensorCreate, SensorResponse, SensorReadingResponse, AggregatedReading
from app.models.user import User
from app.utils.dependencies import get_current_active_user, require_role

router = APIRouter(prefix="/sensors", tags=["sensors"])

@router.post("/", response_model=SensorResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor(
    sensor_in: SensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["engineer", "admin"]))
) -> Any:
    sensor = Sensor(**sensor_in.model_dump())
    db.add(sensor)
    await db.commit()
    await db.refresh(sensor)
    return sensor

@router.get("/{sensor_id}", response_model=SensorResponse)
async def get_sensor(
    sensor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(select(Sensor).where(Sensor.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor

@router.put("/{sensor_id}", response_model=SensorResponse)
async def update_sensor(
    sensor_id: int,
    sensor_in: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["engineer", "admin"]))
) -> Any:
    result = await db.execute(select(Sensor).where(Sensor.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    
    for field, value in sensor_in.items():
        if hasattr(sensor, field):
            setattr(sensor, field, value)
            
    await db.commit()
    await db.refresh(sensor)
    return sensor

@router.delete("/{sensor_id}")
async def delete_sensor(
    sensor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Any:
    result = await db.execute(select(Sensor).where(Sensor.id == sensor_id))
    sensor = result.scalar_one_or_none()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor not found")
    
    await db.delete(sensor)
    await db.commit()
    return {"message": "Sensor deleted successfully"}

@router.get("/{sensor_id}/readings", response_model=List[SensorReadingResponse])
async def get_sensor_readings(
    sensor_id: int,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = Query(1000, ge=1, le=5000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    query = select(SensorReading).where(SensorReading.sensor_id == sensor_id)
    if start_time:
        query = query.where(SensorReading.timestamp >= start_time)
    if end_time:
        query = query.where(SensorReading.timestamp <= end_time)
    
    query = query.order_by(SensorReading.timestamp.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{sensor_id}/readings/aggregated", response_model=List[AggregatedReading])
async def get_aggregated_readings(
    sensor_id: int,
    interval: str = Query(..., description="1h, 6h, 1d, 1w"),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    # This is a simplified placeholder. Actual implementation depends on DB dialect (e.g., PostgreSQL date_trunc)
    # Using python to group if simple DB dialect, but ideally done in SQL
    return []

@router.get("/{sensor_id}/readings/latest", response_model=List[SensorReadingResponse])
async def get_latest_readings(
    sensor_id: int,
    n: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.sensor_id == sensor_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(n)
    )
    return result.scalars().all()

@router.post("/readings/batch")
async def bulk_insert_readings(
    readings: List[dict],
    db: AsyncSession = Depends(get_db),
    # In a real app, this might use an API key instead of standard user auth
    current_user: User = Depends(get_current_active_user)
) -> Any:
    objects = [SensorReading(**r) for r in readings]
    db.add_all(objects)
    await db.commit()
    return {"message": f"Successfully inserted {len(objects)} readings"}
