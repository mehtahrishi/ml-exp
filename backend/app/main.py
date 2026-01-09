from fastapi import FastAPI, Depends, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
import json

from . import models, schemas, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ML Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Experiments ---
@app.post("/experiments/", response_model=schemas.ExperimentOut)
def create_experiment(experiment: schemas.ExperimentCreate, db: Session = Depends(get_db)):
    db_exp = models.Experiment(**experiment.dict())
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp

@app.get("/experiments/", response_model=List[schemas.ExperimentOut])
def list_experiments(db: Session = Depends(get_db)):
    return db.query(models.Experiment).all()

# --- Runs ---
@app.post("/runs/", response_model=schemas.RunOut)
def create_run(run: schemas.RunCreate, db: Session = Depends(get_db)):
    db_run = models.Run(**run.dict())
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

@app.put("/runs/{run_id}", response_model=schemas.RunOut)
def update_run(run_id: int, updates: schemas.RunUpdate, db: Session = Depends(get_db)):
    db_run = db.query(models.Run).filter(models.Run.id == run_id).first()
    if not db_run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_run, key, value)
    
    db.commit()
    db.refresh(db_run)
    return db_run

@app.get("/runs/", response_model=List[schemas.RunOut])
def list_runs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Run).offset(skip).limit(limit).all()

@app.get("/runs/{run_id}", response_model=schemas.RunOut)
def get_run(run_id: int, db: Session = Depends(get_db)):
    return db.query(models.Run).filter(models.Run.id == run_id).first()

# --- Metrics (Live Updates) ---
@app.post("/runs/{run_id}/metrics")
def log_metrics(run_id: int, metric: schemas.MetricData, db: Session = Depends(get_db)):
    # Verify run exists
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    db_metric = models.MetricHistory(run_id=run_id, **metric.dict())
    db.add(db_metric)
    db.commit()
    return {"status": "ok"}

@app.get("/runs/{run_id}/metrics", response_model=List[schemas.MetricHistoryOut])
def get_run_metrics(run_id: int, db: Session = Depends(get_db)):
    return db.query(models.MetricHistory).filter(models.MetricHistory.run_id == run_id).all()

# --- Files & Training ---
from fastapi import UploadFile, File, BackgroundTasks
import shutil
import os
from . import worker

DATA_DIR = "./datasets"
os.makedirs(DATA_DIR, exist_ok=True)

@app.post("/upload/")
def upload_dataset(file: UploadFile = File(...)):
    file_path = os.path.join(DATA_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "filepath": file_path}

@app.get("/datasets/")
def list_datasets():
    files = []
    if os.path.exists(DATA_DIR):
        files = os.listdir(DATA_DIR)
    return {"datasets": files}

class TrainRequest(BaseModel):
    experiment_id: int
    dataset_filename: str
    model: str
    params: Dict[str, Any] = {}

class TrainRequest2(BaseModel):
     experiment_id: int
     dataset_filename: str
     model: str
     params: Dict[str, Any]

@app.post("/jobs/start", response_model=schemas.RunOut)
def start_training_job(req: TrainRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Validate Dataset
    file_path = os.path.join(DATA_DIR, req.dataset_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset not found")

    # 2. Create Run Entry
    run_name = f"{req.model} on {req.dataset_filename}"
    db_run = models.Run(
        experiment_id=req.experiment_id,
        name=run_name,
        status="running",
        parameters={"model": req.model, "dataset": req.dataset_filename, **req.params},
        tags=["auto-web", req.model]
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    
    # 3. Spawn Worker
    background_tasks.add_task(worker.train_background_task, db_run.id, file_path, req.model, req.params)
    
    return db_run

@app.delete("/clear_data")
def clear_data(db: Session = Depends(get_db)):
    # Delete from leaves to roots to avoid foreign key constraint errors
    db.query(models.MetricHistory).delete()
    db.query(models.Run).delete()
    db.query(models.Experiment).delete()
    db.commit()
    return {"status": "cleared"}
