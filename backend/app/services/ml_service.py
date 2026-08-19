import numpy as np

class ModelManager:
    def load_models(self, db):
        pass
        
    def predict_anomaly(self, features):
        return {"is_anomaly": False, "score": 0.05}
        
    def predict_health_score(self, equipment_id, features):
        return 95.0
        
    def predict_rul(self, features):
        return 500.0

def calculate_health_score(sensor_readings):
    if not sensor_readings:
        return 100.0
    # Rule-based logic placeholder
    return 85.0

def extract_features(readings, window_size=60):
    if not readings:
        return {}
    values = [r.value for r in readings]
    return {
        "mean": np.mean(values),
        "std": np.std(values),
        "min": np.min(values),
        "max": np.max(values),
        "rms": np.sqrt(np.mean(np.square(values))),
        "kurtosis": 0.0, # Placeholder
        "skewness": 0.0, # Placeholder
        "peak_to_peak": np.max(values) - np.min(values)
    }
