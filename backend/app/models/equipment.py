import uuid
from sqlalchemy import Column, String, Text, JSON, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class EquipmentType(Base):
    __tablename__ = "equipment_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    default_thresholds = Column(JSON, default={})
    
    equipment = relationship("Equipment", back_populates="equipment_type_rel")

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    serial_number = Column(String(255), unique=True)
    equipment_type_id = Column(UUID(as_uuid=True), ForeignKey("equipment_types.id"))
    location = Column(String(255))
    department = Column(String(100))
    status = Column(String(50), default="operational")  # operational, warning, critical, maintenance, offline
    metadata_info = Column(JSON, default={})
    installed_at = Column(DateTime(timezone=True))
    last_maintenance = Column(DateTime(timezone=True))
    next_maintenance = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    equipment_type_rel = relationship("EquipmentType", back_populates="equipment")
    sensors = relationship("Sensor", back_populates="equipment", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="equipment")
    predictions = relationship("Prediction", back_populates="equipment")
