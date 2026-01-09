import requests
import time
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import log_loss

API_URL = "http://localhost:8000"

def train_real_model():
    print("🧠 Loading Digits dataset (Real Machine Learning)...")
    # 1. Load Real Data
    digits = load_digits()
    X, y = digits.data, digits.target
    
    # Preprocessing
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"📊 Data loaded: {len(X_train)} training samples, {len(X_test)} test samples")

    # 2. Register Experiment & Run
    run_name = f"MLP_Digits_{int(time.time())}"
    print(f"🚀 Starting Run: {run_name}")
    
    # Create Experiment if needed
    try:
        requests.post(f"{API_URL}/experiments/", json={
            "name": "Handwritten Digits Classif.", 
            "description": "Classifying 8x8 images of digits using MLP"
        })
    except:
        pass

    # Create Run
    params = {
        "model": "MLPClassifier",
        "hidden_layers": "(64, 32)",
        "learning_rate": 0.001,
        "batch_size": "auto",
        "dataset": "sklearn.digits"
    }
    
    res = requests.post(f"{API_URL}/runs/", json={
        "experiment_id": 1, 
        "name": run_name,
        "parameters": params,
        "tags": ["real-data", "neural-network", "sklearn"]
    })
    run_id = res.json()["id"]

    # 3. Train Model (Iterative to show live curves)
    # Using warm_start=True allows us to train epoch by epoch and track progress
    clf = MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation='relu',
        solver='adam',
        alpha=0.0001,
        batch_size='auto',
        learning_rate_init=0.001,
        max_iter=1,  # Train one step at a time
        warm_start=True, # Keep memory of previous steps
        random_state=42,
        verbose=False
    )

    epochs = 50
    classes = np.unique(y)

    print("⚡ Training started... check the dashboard for live curves!")
    
    for epoch in range(1, epochs + 1):
        # Train for one epoch
        clf.fit(X_train, y_train)
        
        # Calculate Real Metrics
        train_loss = clf.loss_
        test_acc = clf.score(X_test, y_test)
        
        # Log to Backend
        requests.post(f"{API_URL}/runs/{run_id}/metrics", json={
            "name": "loss", "value": train_loss, "step": epoch
        })
        requests.post(f"{API_URL}/runs/{run_id}/metrics", json={
            "name": "val_accuracy", "value": test_acc, "step": epoch
        })

        print(f"Step {epoch}/{epochs} - Loss: {train_loss:.4f} - Val Acc: {test_acc:.4f}")
        
        # Slow down slightly just so the user can enjoy the visual updates
        time.sleep(0.5)

    # 4. Finalize Run
    final_acc = clf.score(X_test, y_test)
    requests.put(f"{API_URL}/runs/{run_id}", json={
        "status": "completed",
        "metrics": {"final_accuracy": final_acc, "final_loss": clf.loss_}
    })
    print(f"✅ Training Done! Final Accuracy: {final_acc:.4f}")

if __name__ == "__main__":
    train_real_model()
