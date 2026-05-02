import subprocess
import json
from typing import Dict, List, Any

class PatternWeaverAgent:
    """
    UJU Pattern Weaver - Synthesizes patterns across lenses
    Produces CMO (Context-Mechanism-Outcome) configurations
    Calculates transferability scores
    """
    
    def __init__(self, model: str = "llama3.1:70b"):
        self.model = model
        
    def synthesize(self, lens_results: Dict) -> Dict[str, Any]:
        prompt = f"""
        You are UJU Pattern Weaver - Synthesis Expert.
        
        TASK: Find patterns and intersections across ALL 6 lens analyses.
        
        LENS RESULTS:
        {json.dumps(lens_results, indent=2)}
        
        SYNTHESIZE INTO:
        
        1. CMO CONFIGURATIONS (Context-Mechanism-Outcome):
           - Context: When/where does this pattern appear?
           - Mechanism: What causal process drives it?
           - Outcome: What results from this configuration?
           - Confidence: 0-100 with uncertainty bounds
        
        2. DESIGN PRINCIPLES:
           - Actionable rules derived from patterns (3-5 bullets)
           - Each principle must be implementable
        
        3. TRANSFERABILITY SCORING:
           - Score: 0-100% (how well this applies to other domains)
           - Reasoning: Why this score?
           - Caveats: When does this NOT apply?
        
        OUTPUT JSON:
        {{
          "cmo_configurations": [
            {{
              "context": "string",
              "mechanism": "string", 
              "outcome": "string",
              "confidence": 0-100,
              "confidence_interval": [lower, upper]
            }}
          ],
          "design_principles": ["principle1", "principle2", "principle3"],
          "transferability": {{
            "score": 0-100,
            "reasoning": "string",
            "caveats": ["caveat1", "caveat2"]
          }},
          "krippendorff_alpha": float,
          "agreement_across_lenses": "HIGH/MEDIUM/LOW"
        }}
        """
        
        result = subprocess.run(
            ["ollama", "run", self.model, prompt],
            capture_output=True, text=True
        )
        
        return json.loads(result.stdout)
