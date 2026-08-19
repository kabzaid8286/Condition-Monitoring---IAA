import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

class AnomalyDetector:
    def __init__(self, contamination=0.05):
        self.contamination = contamination
        self.model = IsolationForest(contamination=self.contamination, random_state=42)
        
    def train(self, data):
        self.model.fit(data)
        
    def predict(self, features):
        if not hasattr(self.model, "estimators_") or len(self.model.estimators_) == 0:
            return {"score": 0.0, "is_anomaly": False}
        
        # Isolation Forest returns 1 for inliers, -1 for outliers
        pred = self.model.predict([features])[0]
        # score_samples returns negative anomaly score, lower is more abnormal
        score = self.model.score_samples([features])[0]
        
        return {
            "score": float(-score),  # Convert to positive where higher = more anomalous
            "is_anomaly": bool(pred == -1)
        }
        
    def save(self, path):
        joblib.dump(self.model, path)
        
    def load(self, path):
        self.model = joblib.load(path)
