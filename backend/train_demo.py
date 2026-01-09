import requests
import time
import random

API_URL = "http://localhost:8000"

def train_model(experiment_id=1, run_name="Demo Run"):
    # 1. Ensure experiment exists (usually you'd check or creat one once)
    try:
        requests.post(f"{API_URL}/experiments/", json={"name": "Iris Classification", "description": "Demo Experiment"})
    except:
        pass # Created already?

    # 2. Start Run
    params = {"learning_rate": 0.01, "batch_size": 32, "model_type": "CNN"}
    response = requests.post(f"{API_URL}/runs/", json={
        "experiment_id": experiment_id,
        "name": run_name,
        "parameters": params,
        "tags": ["demo", "v1"]
    })
    run_data = response.json()
    run_id = run_data["id"] 
    print(f"🚀 Started Run ID: {run_id}")

    # 3. Simulate Training Loop
    epochs = 20
    accuracy = 0.5
    loss = 1.0

    for epoch in range(1, epochs + 1):
        # Update fake metrics
        loss = loss * 0.9 + random.uniform(-0.05, 0.05)
        accuracy = min(0.99, accuracy + 0.02 + random.uniform(-0.01, 0.01))
        
        # Log to Backend
        requests.post(f"{API_URL}/runs/{run_id}/metrics", json={
            "name": "loss", "value": loss, "step": epoch
        })
        requests.post(f"{API_URL}/runs/{run_id}/metrics", json={
            "name": "accuracy", "value": accuracy, "step": epoch
        })

        print(f"Epoch {epoch}/{epochs}: loss={loss:.4f}, acc={accuracy:.4f}")
        time.sleep(0.5) # Simulate work

    # 4. Finish Run
    requests.put(f"{API_URL}/runs/{run_id}", json={
        "status": "completed",
        "metrics": {"final_accuracy": accuracy, "final_loss": loss}
    })
    print("✅ Training Complete!")

if __name__ == "__main__":
    train_model(run_name=f"Run_{int(time.time())}")
