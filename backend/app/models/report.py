import uuid
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Report(Base):
    __tablename__ = "reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)  # equipment_health, alert_summary, prediction, custom
    format = Column(String(10), default="pdf")  # pdf, csv, xlsx
    parameters = Column(JSON, nullable=False)
    file_path = Column(Text)
    file_size_bytes = Column(BigInteger)
    status = Column(String(50), default="pending")  # pending, generating, completed, failed
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    created_by_user = relationship("User", back_populates="reports")
