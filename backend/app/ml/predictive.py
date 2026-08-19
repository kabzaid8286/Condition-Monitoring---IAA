import numpy as np

class HealthScorePredictor:
    def __init__(self):
        pass
        
    def calculate_health_score(self, sensor_readings_with_thresholds):
        """
        Rule-based health score calculation.
        sensor_readings_with_thresholds: list of dicts with 'value', 'normal_min', 'normal_max', 'critical_min', 'critical_max', 'weight'
        """
        if not sensor_readings_with_thresholds:
            return 100.0
            
        total_weight = 0
        total_score = 0
        
        for data in sensor_readings_with_thresholds:
            val = data.get('value', 0)
            weight = data.get('weight', 1.0)
            norm_min = data.get('normal_min', 0)
            norm_max = data.get('normal_max', 100)
            crit_min = data.get('critical_min', -50)
            crit_max = data.get('critical_max', 150)
            
            # Simple heuristic
            if norm_min <= val <= norm_max:
                score = 100.0
            elif val > crit_max or val < crit_min:
                score = 0.0
            else:
                score = 50.0  # Warning zone
                
            total_score += score * weight
            total_weight += weight
            
        if total_weight == 0:
            return 100.0
            
        return total_score / total_weight
        
    def detect_trend(self, history):
        if len(history) < 2:
            return "stable"
        diff = history[-1] - history[0]
        if diff > 5:
            return "improving"
        elif diff < -5:
            return "degrading"
        return "stable"

class RULEstimator:
    def __init__(self, decay_rate=0.01):
        self.decay_rate = decay_rate
        
    def estimate_rul(self, health_scores_history):
        if not health_scores_history or len(health_scores_history) < 2:
            return -1.0 # Unknown
            
        current_score = health_scores_history[-1]
        
        if current_score <= 0:
            return 0.0
            
        # Simple exponential degradation
        # Assuming failure at score = 0, we estimate hours remaining based on slope
        trend = np.polyfit(range(len(health_scores_history)), health_scores_history, 1)[0]
        
        if trend >= 0:
            return 9999.0 # Practically infinite if stable/improving
            
        hours_to_failure = -current_score / trend
        return max(0.0, hours_to_failure)
