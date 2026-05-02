import subprocess
import json
from typing import Dict, Any, List

class TylerWiseCritic:
    """
    UJU Critic - Military-Grade Red Team Analysis
    ACH Matrix + Pre-Mortem + Confirmation Bias Detection
    """
    
    def __init__(self, model: str = "mixtral:8x7b"):
        self.model = model
        
    def critique(self, cmo_configurations: Dict, design_principles: List[str]) -> Dict[str, Any]:
        prompt = f"""
        You are Tyler Wise - Defense-Grade Red Team Analyst.
        
        CRITIQUE the following analysis:
        
        CMO CONFIGURATIONS:
        {json.dumps(cmo_configurations, indent=2)}
        
        DESIGN PRINCIPLES:
        {json.dumps(design_principles, indent=2)}
        
        PERFORM:
        
        1. ACH MATRIX (Analysis of Competing Hypotheses):
           - List 3-5 alternative explanations
           - Rate evidence for each (0-100%)
           - Rate evidence against each (0-100%)
           - Identify most/least likely alternatives
        
        2. PRE-MORTEM:
           - Imagine this solution failed catastrophically
           - List 5 reasons why with probability estimates
           - Identify most likely failure mode
        
        3. CONFIRMATION BIAS CHECK:
           - What evidence would disprove these conclusions?
           - What assumptions need validation?
           - What information is missing?
        
        OUTPUT JSON:
        {{
          "ach_matrix": [
            {{
              "hypothesis": "string",
              "supporting_evidence": 0-100,
              "disconfirming_evidence": 0-100
            }}
          ],
          "pre_mortem": [
            {{
              "failure_mode": "string",
              "probability": 0-100,
              "mitigation": "string"
            }}
          ],
          "bias_checks": {{
            "falsifying_evidence": "string list",
            "hidden_assumptions": ["assumption1", "assumption2"],
            "information_gaps": ["gap1", "gap2"]
          }},
          "final_critic_score": 0-100,
          "recommendation": "PROCEED/REVISE/REJECT"
        }}
        """
        
        result = subprocess.run(
            ["ollama", "run", self.model, prompt],
            capture_output=True, text=True
        )
        
        return json.loads(result.stdout)
