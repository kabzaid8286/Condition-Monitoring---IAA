import numpy as np
from app.ml.anomaly_detector import AnomalyDetector
from app.services.ml_service import extract_features

def load_data():
    # Placeholder for database load
    return []

def train():
    data = load_data()
    # Mock data if empty
    if not data:
        X_train = np.random.randn(100, 8)
    else:
        # Process into features
        X_train = [list(extract_features(window).values()) for window in data]
        
    detector = AnomalyDetector(contamination=0.05)
    detector.train(X_train)
    
    # Save model
    # detector.save('anomaly_model.joblib')
    print("Anomaly detection model trained and saved.")

if __name__ == "__main__":
    train()
