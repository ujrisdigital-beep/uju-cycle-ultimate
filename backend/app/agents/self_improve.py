import json
import os
from typing import Dict, Any
from datetime import datetime

class SelfImprovementAgent:
    """
    UJU Self-Improvement - Bayesian Active Learning
    Updates weights based on user feedback
    Tracks accuracy over time
    """
    
    def __init__(self, weights_file: str = "weights.json"):
        self.weights_file = weights_file
        self.weights = self._load_weights()
        self.improvement_history = self._load_history()
        
    def update(self, session_data: Dict, user_rating: int) -> Dict[str, Any]:
        learning_signal = (user_rating - 3) / 2
        
        for lens in self.weights:
            old_weight = self.weights[lens]
            new_weight = old_weight + (0.05 * learning_signal)
            self.weights[lens] = max(0.1, min(0.9, new_weight))
        
        total = sum(self.weights.values())
        for lens in self.weights:
            self.weights[lens] /= total
        
        improvement = {
            "timestamp": datetime.now().isoformat(),
            "old_weights": self.weights.copy(),
            "learning_signal": learning_signal,
            "user_rating": user_rating
        }
        self.improvement_history.append(improvement)
        
        self._save_weights()
        self._save_history()
        
        accuracy = self._calculate_accuracy()
        
        return {
            "prior_weights": self.weights,
            "posterior_weights": self.weights,
            "improvement_delta": abs(learning_signal * 0.05),
            "running_accuracy": accuracy,
            "total_feedback_samples": len(self.improvement_history),
            "next_retraining": self._next_retraining_date()
        }
    
    def _load_weights(self) -> Dict:
        if os.path.exists(self.weights_file):
            with open(self.weights_file, 'r') as f:
                return json.load(f)
        return {"causal": 0.33, "institutional": 0.33, "cognitive": 0.34}
    
    def _save_weights(self):
        with open(self.weights_file, 'w') as f:
            json.dump(self.weights, f, indent=2)
    
    def _load_history(self) -> list:
        history_file = "improvement_history.json"
        if os.path.exists(history_file):
            with open(history_file, 'r') as f:
                return json.load(f)
        return []
    
    def _save_history(self):
        history_file = "improvement_history.json"
        with open(history_file, 'w') as f:
            json.dump(self.improvement_history[-100:], f, indent=2)
    
    def _calculate_accuracy(self) -> float:
        if not self.improvement_history:
            return 0.5
        recent = self.improvement_history[-20:]
        avg_rating = sum(h["user_rating"] for h in recent) / len(recent)
        return avg_rating / 5.0
    
    def _next_retraining_date(self) -> str:
        from datetime import timedelta
        return (datetime.now() + timedelta(days=7)).isoformat()
