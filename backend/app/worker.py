import pandas as pd
import time
import traceback
from sqlalchemy.orm import Session
from . import models, database
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, log_loss, precision_score, recall_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import numpy as np

# Map string names to SKLearn classes
MODEL_REGISTRY = {
    "RandomForest": RandomForestClassifier,
    "LogisticRegression": LogisticRegression,
    "MLPClassifier": MLPClassifier,
    "SVM": SVC,
    "GradientBoosting": GradientBoostingClassifier,
    "DecisionTree": DecisionTreeClassifier,
    "KNN": KNeighborsClassifier,
    "NaiveBayes": GaussianNB,
    "AdaBoost": AdaBoostClassifier
}

DEFAULT_PARAMS = {
    "RandomForest": {"n_estimators": 100, "max_depth": 10},
    "LogisticRegression": {"C": 1.0},
    "MLPClassifier": {"hidden_layer_sizes": (64, 32), "learning_rate_init": 0.001, "max_iter": 500, "batch_size": 32, "activation": "relu"},
    "SVM": {"C": 1.0, "kernel": "rbf", "probability": True}, 
    "GradientBoosting": {"n_estimators": 100, "learning_rate": 0.1},
    "DecisionTree": {"max_depth": 10},
    "KNN": {"n_neighbors": 5, "weights": "uniform"},
    "NaiveBayes": {"var_smoothing": 1e-9},
    "AdaBoost": {"n_estimators": 50, "learning_rate": 1.0}
}

def train_background_task(run_id: int, dataset_path: str, model_type: str, hyperparams: dict):
    """
    Background worker that loads data, trains model, logs metrics Live to DB.
    """
    db = database.SessionLocal()
    run = db.query(models.Run).filter(models.Run.id == run_id).first()
    
    try:
        print(f"worker: starting run {run_id} with {model_type} on {dataset_path}")
        
        # 1. Load Data
        df = pd.read_csv(dataset_path)
        
        # Assume last column is target for simplicity in this MVP
        X = df.iloc[:, :-1]
        y = df.iloc[:, -1]
        
        # Preprocessing (Simple Auto-ML)
        # Handle Categorical
        for col in X.select_dtypes(include=['object']).columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col])
            
        # Target Encoding if needed
        if y.dtype == 'object':
            le_y = LabelEncoder()
            y = le_y.fit_transform(y)

        # Impute Missing
        imputer = SimpleImputer(strategy='mean')
        X = imputer.fit_transform(X)
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale
        scaler = StandardScaler()
        X = scaler.fit_transform(X) # Scale everything upfront
        
        # 3-Way Split: Train (70%), Validation (15%), Test (15%)
        X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42)
        X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42)
        
        # 2. Init Model
        if model_type not in MODEL_REGISTRY:
            raise ValueError(f"Unknown model type: {model_type}")
            
        ModelClass = MODEL_REGISTRY[model_type]
        
        # Merge defaults with user params
        final_params = DEFAULT_PARAMS.get(model_type, {}).copy()
        if hyperparams:
            final_params.update(hyperparams)

        # Special casing for partial_fit/warm_start support
        supports_iterative = model_type in ["MLPClassifier", "SGDClassifier"]
        
        # Helper to log all metrics
        def log_step(m_model, m_step, X_t, y_t, X_tr, y_tr):
            # Val Accuracy
            val_acc = m_model.score(X_t, y_t)
            train_acc = m_model.score(X_tr, y_tr)
            
            db.add(models.MetricHistory(run_id=run_id, step=m_step, name="test_accuracy", value=val_acc))
            db.add(models.MetricHistory(run_id=run_id, step=m_step, name="train_accuracy", value=train_acc))
            
            # F1 Score, Precision, Recall
            y_pred = m_model.predict(X_t)
            s_f1 = f1_score(y_t, y_pred, average='weighted')
            s_prec = precision_score(y_t, y_pred, average='weighted', zero_division=0)
            s_rec = recall_score(y_t, y_pred, average='weighted', zero_division=0)
            
            db.add(models.MetricHistory(run_id=run_id, step=m_step, name="f1_score", value=s_f1))
            db.add(models.MetricHistory(run_id=run_id, step=m_step, name="precision", value=s_prec))
            db.add(models.MetricHistory(run_id=run_id, step=m_step, name="recall", value=s_rec))

            # Loss
            if hasattr(m_model, "predict_proba"):
                try:
                    y_prob_bg = m_model.predict_proba(X_t)
                    val_loss = log_loss(y_t, y_prob_bg)
                    db.add(models.MetricHistory(run_id=run_id, step=m_step, name="test_loss", value=val_loss))
                    
                    y_prob_tr = m_model.predict_proba(X_tr)
                    train_loss = log_loss(y_tr, y_prob_tr)
                    db.add(models.MetricHistory(run_id=run_id, step=m_step, name="train_loss", value=train_loss))
                except: pass
            
            db.commit()

        if supports_iterative:
            # Enforce warm_start for iterative updates
            final_params['warm_start'] = True
            final_params['max_iter'] = 1
            final_params['verbose'] = False
            
            model = ModelClass(**final_params)
            classes = list(set(y))
            
            # Use user-defined Epochs if available, else 50
            total_epochs = hyperparams.get("max_iter", 50)
            
            for epoch in range(1, total_epochs + 1):
                model.fit(X_train, y_train)
                
                log_step(model, epoch, X_val, y_val, X_train, y_train)
                
                time.sleep(0.2) 
        else:
            # Standard "One-Shot" models (RandomForest, SVM)
            # We will simulate "epochs" by either growing the model (RF) or training on increasing subsets (SVM)
            # This gives the user the visual satisfaction of "training" happening live.
            
            steps = 20

            if model_type in ["RandomForest", "GradientBoosting","AdaBoost"]:
                # Incremental Tree Growth
                final_n_estimators = final_params.pop("n_estimators", 100)
                final_params["warm_start"] = True
                final_params["n_estimators"] = 0 
                
                model = ModelClass(**final_params)
                trees_per_step = max(1, final_n_estimators // steps)
                
                for i in range(1, steps + 1):
                    model.n_estimators += trees_per_step
                    model.fit(X_train, y_train)
                    
                    # Log against Validation
                    log_step(model, i, X_val, y_val, X_train, y_train)
                    time.sleep(0.5)
                    
            else:
                # Learning Curve Strategy
                n_samples = X_train.shape[0]
                
                for i in range(1, steps + 1):
                    subset_size = int(n_samples * (i / steps))
                    if subset_size < 10: subset_size = 10 
                    
                    # Create fresh model instance
                    step_model = ModelClass(**final_params)
                    
                    # Train on subset
                    X_sub = X_train[:subset_size]
                    y_sub = y_train[:subset_size]
                    
                    if len(set(y_sub)) < 2: continue 
                        
                    step_model.fit(X_sub, y_sub)
                    # Log against usage subset vs Val
                    log_step(step_model, i, X_val, y_val, X_sub, y_sub)
                    time.sleep(0.5) 
                
                model = step_model

        # 3. Finish & Final "Production" Evaluation on Test Set
        run.status = "completed"
        
        # We calculate the FINAL "Gold Standard" score on the held-out Test set
        final_score = model.score(X_test, y_test)
        val_score = model.score(X_val, y_val)
        
        run.metrics = {
            "final_accuracy": final_score, 
            "validation_accuracy": val_score
        }
        db.commit()
        print(f"worker: run {run_id} completed successfully")

    except Exception as e:
        print(f"worker: run {run_id} failed: {e}")
        traceback.print_exc()
        run.status = "failed"
        run.notes = str(e)
        db.commit()
    finally:
        db.close()
