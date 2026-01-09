from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Metric Schemas ---
class MetricData(BaseModel):
    name: str
    value: float
    step: int

class MetricHistoryOut(MetricData):
    timestamp: datetime
    class Config:
        orm_mode = True

# --- Run Schemas ---
class RunBase(BaseModel):
    name: str = "Run"
    parameters: Dict[str, Any]
    tags: List[str] = []
    notes: Optional[str] = None

class RunCreate(RunBase):
    experiment_id: int

class RunUpdate(BaseModel):
    status: Optional[str] = None
    metrics: Optional[Dict[str, float]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class RunOut(RunBase):
    id: int
    experiment_id: int
    status: str
    metrics: Optional[Dict[str, float]]
    created_at: datetime
    class Config:
        orm_mode = True

# --- Experiment Schemas ---
class ExperimentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ExperimentOut(ExperimentCreate):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True
