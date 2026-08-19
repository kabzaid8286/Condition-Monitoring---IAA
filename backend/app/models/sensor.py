import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, SmallInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Sensor(Base):
    __tablename__ = "sensors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    sensor_name = Column(String(255), nullable=False)
    sensor_type = Column(String(100), nullable=False)  # vibration, temperature, pressure, current, rpm
    unit = Column(String(50), nullable=False)  # mm/s, °C, bar, A, rpm
    min_threshold = Column(Float)
    max_threshold = Column(Float)
    warning_threshold = Column(Float)
    critical_threshold = Column(Float)
    mqtt_topic = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    equipment = relationship("Equipment", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor")
    alert_rules = relationship("AlertRule", back_populates="sensor")

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    sensor_id = Column(UUID(as_uuid=True), ForeignKey("sensors.id"), primary_key=True, nullable=False)
    value = Column(Float, nullable=False)
    quality = Column(SmallInteger, default=100)
    
    # Relationships
    sensor = relationship("Sensor", back_populates="readings")
