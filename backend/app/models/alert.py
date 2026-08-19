import uuid
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sensor_id = Column(UUID(as_uuid=True), ForeignKey("sensors.id"), nullable=False)
    condition = Column(String(50), nullable=False)  # gt, lt, gte, lte, eq, anomaly
    threshold_value = Column(Float)
    severity = Column(String(50), nullable=False)  # info, warning, critical
    is_active = Column(Boolean, default=True)
    cooldown_seconds = Column(Integer, default=300)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    sensor = relationship("Sensor", back_populates="alert_rules")
    alerts = relationship("Alert", back_populates="alert_rule")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_rule_id = Column(UUID(as_uuid=True), ForeignKey("alert_rules.id"))
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False)
    sensor_id = Column(UUID(as_uuid=True), ForeignKey("sensors.id"))
    trigger_value = Column(Float)
    severity = Column(String(50), nullable=False)
    status = Column(String(50), default="active")  # active, acknowledged, resolved
    title = Column(String(255), nullable=False)
    message = Column(Text)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    acknowledged_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    resolved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    metadata_info = Column(JSON, default={})
    
    # Relationships
    alert_rule = relationship("AlertRule", back_populates="alerts")
    equipment = relationship("Equipment", back_populates="alerts")
