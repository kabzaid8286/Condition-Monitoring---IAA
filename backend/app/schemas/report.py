from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

class ReportBase(BaseModel):
    title: str
    report_type: str
    format: str = "pdf"
    parameters: Dict[str, Any]

class ReportCreate(ReportBase):
    created_by_id: UUID

class ReportResponse(ReportBase):
    id: UUID
    created_by_id: UUID
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class ReportGenerateRequest(BaseModel):
    report_type: str
    format: str = "pdf"
    parameters: Dict[str, Any]
