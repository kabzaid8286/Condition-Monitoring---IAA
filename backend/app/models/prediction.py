import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class MLModel(Base):
    __tablename__ = "ml_models"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    model_type = Column(String(100), nullable=False)  # isolation_forest, lstm_autoencoder, rul_predictor
    version = Column(String(50), nullable=False)
    file_path = Column(Text, nullable=False)
    metrics = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    
    predictions = relationship("Prediction", back_populates="model")
    __table_args__ = (UniqueConstraint("name", "version"),)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipment_id = Column(UUID(as_uuid=True), ForeignKey("equipment.id"), nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey("ml_models.id"), nullable=False)
    prediction_type = Column(String(100), nullable=False)  # anomaly, rul, health_score
    score = Column(Float, nullable=False)
    confidence = Column(Float)
    is_anomaly = Column(Boolean)
    input_features = Column(JSON)
    details = Column(JSON, default={})
    predicted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    equipment = relationship("Equipment", back_populates="predictions")
    model = relationship("MLModel", back_populates="predictions")
