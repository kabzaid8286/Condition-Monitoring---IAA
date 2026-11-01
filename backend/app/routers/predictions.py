from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.prediction import Prediction, MLModel
from app.schemas.prediction import PredictionResponse, PredictionRequest, HealthScoreResponse, MLModelResponse, MLModelCreate
from app.models.user import User
from app.utils.dependencies import get_current_active_user, require_role

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.get("/", response_model=List[PredictionResponse])
async def list_predictions(
    equipment_id: Optional[UUID] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    query = select(Prediction).order_by(desc(Prediction.predicted_at))
    if equipment_id:
        query = query.where(Prediction.equipment_id == equipment_id)
        
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/equipment/{equipment_id}", response_model=List[PredictionResponse])
async def get_equipment_predictions(
    equipment_id: UUID,
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.equipment_id == equipment_id)
        .order_by(desc(Prediction.predicted_at))
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/equipment/{equipment_id}/health-score", response_model=HealthScoreResponse)
async def get_health_score(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(
        select(Prediction)
        .where(Prediction.equipment_id == equipment_id)
        .order_by(desc(Prediction.predicted_at))
        .limit(1)
    )
    prediction = result.scalar_one_or_none()
    if not prediction:
        raise HTTPException(status_code=404, detail="No health score available")
        
    details = prediction.details or {}
    return {
        "equipment_id": equipment_id, 
        "score": prediction.score, 
        "trend": details.get("trend", "stable"),
        "component_scores": details.get("component_scores", {})
    }

@router.post("/run", response_model=PredictionResponse)
async def run_prediction(
    req: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["engineer", "admin"]))
) -> Any:
    # Trigger Celery task here or run synchronously for simple requests
    raise HTTPException(status_code=501, detail="Not implemented")

@router.get("/models", response_model=List[MLModelResponse])
async def list_models(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    result = await db.execute(select(MLModel))
    return result.scalars().all()

@router.post("/models", response_model=MLModelResponse, status_code=status.HTTP_201_CREATED)
async def register_model(
    model_in: MLModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
) -> Any:
    model = MLModel(**model_in.model_dump())
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return model
