from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class MLModelBase(BaseModel):
    name: str
    model_type: str
    version: str
    metrics: Dict[str, Any] = {}

class MLModelCreate(MLModelBase):
    file_path: str

class MLModelResponse(MLModelBase):
    id: UUID
    is_active: bool
    trained_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PredictionBase(BaseModel):
    equipment_id: UUID
    model_id: UUID
    prediction_type: str
    score: float
    confidence: Optional[float] = None
    is_anomaly: Optional[bool] = None
    input_features: Optional[Dict[str, Any]] = None
    details: Dict[str, Any] = {}

class PredictionResponse(PredictionBase):
    id: UUID
    predicted_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PredictionRequest(BaseModel):
    equipment_id: UUID
    prediction_type: str

class HealthScoreResponse(BaseModel):
    equipment_id: UUID
    score: float
    trend: str
    component_scores: Dict[str, float] = {}
