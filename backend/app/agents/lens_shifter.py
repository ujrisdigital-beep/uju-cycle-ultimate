import subprocess
import json
import statistics
from typing import Dict, List, Any

class LensShifterAgent:
    """
    UJU Lens Shifter - 6 Analytical Perspectives
    Applies multiple cognitive lenses to the same compressed data
    Returns insights + confidence scores for each lens
    """
    
    LENSES = {
        "causal": {
            "name": "Causal (Pearl)",
            "description": "Identify causal DAG, confounders, interventions",
            "weight": 0.33
        },
        "institutional": {
            "name": "Institutional (Ostrom)",
            "description": "Design principles, common-pool resources, governance",
            "weight": 0.33
        },
        "cognitive": {
            "name": "Cognitive (Kahneman)",
            "description": "Dual-process, biases, heuristics, System 1/2",
            "weight": 0.34
        },
        "signal_detection": {
            "name": "Signal Detection",
            "description": "ROC analysis, sensitivity/specificity, threshold optimization",
            "weight": 0.0
        },
        "fault_tree": {
            "name": "Fault-Tree",
            "description": "Failure modes, error propagation, root cause analysis",
            "weight": 0.0
        },
        "linguistic": {
            "name": "Linguistic",
            "description": "Pattern recognition, semantic analysis, discourse structure",
            "weight": 0.0
        }
    }
    
    def __init__(self, model: str = "mixtral:8x7b"):
        self.model = model
        self.bayesian_weights = self._load_weights()
        
    def analyze(self, compressed_signal: str) -> Dict[str, Any]:
        results = {}
        
        for lens_key, lens_config in self.LENSES.items():
            prompt = f"""
            Apply the {lens_config['name']} lens to this analysis.
            
            LENS: {lens_config['description']}
            WEIGHT: {self.bayesian_weights.get(lens_key, lens_config['weight'])}
            
            COMPRESSED SIGNAL: {compressed_signal}
            
            OUTPUT (JSON):
            {{
              "insight": "key finding from this perspective",
              "confidence": 0-100,
              "signal_quality": "HIGH/MEDIUM/LOW",
              "alternative_explanation": "what else could explain this?",
              "confidence_factors": ["factor1", "factor2"]
            }}
            """
            
            result = subprocess.run(
                ["ollama", "run", self.model, prompt],
                capture_output=True, text=True
            )
            
            results[lens_key] = json.loads(result.stdout)
        
        results["cross_lens_agreement"] = self._calculate_agreement(results)
        
        return results
    
    def _calculate_agreement(self, results: Dict) -> float:
        confidences = [r["confidence"] for r in results.values() if isinstance(r, dict) and "confidence" in r]
        if len(confidences) < 2:
            return 0.0
        std_dev = statistics.stdev(confidences) if len(confidences) > 1 else 0
        return max(0, 1 - (std_dev / 100))
    
    def _load_weights(self) -> Dict:
        import os
        weights_file = "weights.json"
        if os.path.exists(weights_file):
            with open(weights_file, 'r') as f:
                return json.load(f)
        return {lens: config['weight'] for lens, config in self.LENSES.items()}
