from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    runs = relationship("Run", back_populates="experiment")

class Run(Base):
    __tablename__ = "runs"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"))
    name = Column(String, index=True) # e.g. "Run 1" or "ResNet-50-v1"
    status = Column(String, default="running") # running, completed, failed
    parameters = Column(JSON) # {"learning_rate": 0.01, "batch_size": 32}
    metrics = Column(JSON, nullable=True) # Final metrics {"accuracy": 0.95}
    tags = Column(JSON, default=list) # ["v1", "best-candidate"]
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    experiment = relationship("Experiment", back_populates="runs")
    metric_history = relationship("MetricHistory", back_populates="run")

class MetricHistory(Base):
    __tablename__ = "metric_history"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("runs.id"))
    step = Column(Integer) # Epoch or Step number
    name = Column(String) # e.g. "loss", "accuracy"
    value = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

    run = relationship("Run", back_populates="metric_history")
