from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.equipment import Equipment
from app.models.alert import Alert
from app.models.sensor import Sensor
from app.models.prediction import Prediction
from app.models.user import User
from app.utils.dependencies import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/overview")
async def get_overview_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    # Dummy implementation for system overview stats
    return {
        "total_equipment": 12,
        "online_count": 10,
        "warning_count": 1,
        "critical_count": 1,
        "offline_count": 0,
        "active_alerts_count": 3,
        "total_sensors": 45,
        "avg_health_score": 92.5
    }

@router.get("/equipment-status")
async def get_equipment_status_dist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    return {"online": 10, "warning": 1, "critical": 1, "offline": 0}

@router.get("/recent-alerts")
async def get_recent_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Alert).order_by(desc(Alert.created_at)).limit(20)
    )
    return result.scalars().all()

@router.get("/sensor-summary")
async def get_sensor_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    return []

@router.get("/health-trends")
async def get_health_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    return []
