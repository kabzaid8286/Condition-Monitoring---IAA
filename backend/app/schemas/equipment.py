from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class EquipmentTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_thresholds: Dict[str, Any] = {}

class EquipmentTypeCreate(EquipmentTypeBase):
    pass

class EquipmentTypeResponse(EquipmentTypeBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class EquipmentBase(BaseModel):
    name: str
    serial_number: Optional[str] = None
    equipment_type_id: Optional[UUID] = None
    location: Optional[str] = None
    department: Optional[str] = None
    status: str = "operational"

class EquipmentCreate(EquipmentBase):
    metadata_info: Dict[str, Any] = {}
    installed_at: Optional[datetime] = None

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    equipment_type_id: Optional[UUID] = None
    location: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = None
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None

class EquipmentResponse(EquipmentBase):
    id: UUID
    metadata_info: Dict[str, Any]
    installed_at: Optional[datetime]
    last_maintenance: Optional[datetime]
    next_maintenance: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    sensors_count: int = 0
    active_alerts_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class EquipmentListResponse(BaseModel):
    items: List[EquipmentResponse]
    total: int
    page: int
    size: int
