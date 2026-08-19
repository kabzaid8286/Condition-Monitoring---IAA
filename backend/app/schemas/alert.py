from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class AlertRuleBase(BaseModel):
    sensor_id: UUID
    condition: str
    threshold_value: Optional[float] = None
    severity: str
    cooldown_seconds: int = 300

class AlertRuleCreate(AlertRuleBase):
    pass

class AlertRuleUpdate(BaseModel):
    condition: Optional[str] = None
    threshold_value: Optional[float] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    cooldown_seconds: Optional[int] = None

class AlertRuleResponse(AlertRuleBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AlertBase(BaseModel):
    equipment_id: UUID
    sensor_id: Optional[UUID] = None
    alert_rule_id: Optional[UUID] = None
    trigger_value: Optional[float] = None
    severity: str
    title: str
    message: Optional[str] = None
    metadata_info: Dict[str, Any] = {}

class AlertResponse(AlertBase):
    id: UUID
    status: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_id: Optional[UUID] = None
    resolved_at: Optional[datetime] = None
    resolved_by_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

class AlertUpdate(BaseModel):
    status: str
    # Set automatically via logic, but can be passed
    acknowledged_by_id: Optional[UUID] = None
    resolved_by_id: Optional[UUID] = None

class AlertListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    size: int
