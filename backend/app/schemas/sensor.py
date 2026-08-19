from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class SensorBase(BaseModel):
    sensor_name: str
    sensor_type: str
    unit: str
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    mqtt_topic: Optional[str] = None

class SensorCreate(SensorBase):
    equipment_id: UUID

class SensorUpdate(BaseModel):
    sensor_name: Optional[str] = None
    sensor_type: Optional[str] = None
    unit: Optional[str] = None
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    mqtt_topic: Optional[str] = None
    is_active: Optional[bool] = None

class SensorResponse(SensorBase):
    id: UUID
    equipment_id: UUID
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SensorReadingBase(BaseModel):
    value: float
    quality: int = 100

class SensorReadingCreate(SensorReadingBase):
    sensor_id: UUID
    time: datetime

class SensorReadingResponse(SensorReadingBase):
    time: datetime
    sensor_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class SensorDataQuery(BaseModel):
    sensor_id: UUID
    start_time: datetime
    end_time: datetime
    interval: Optional[str] = None

class AggregatedReading(BaseModel):
    bucket: datetime
    avg_value: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    sample_count: int
