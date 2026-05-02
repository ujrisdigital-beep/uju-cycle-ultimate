from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid

from agents.diviner import DivinerAgent
from agents.lens_shifter import LensShifterAgent
from agents.pattern_weaver import PatternWeaverAgent
from agents.critic import TylerWiseCritic
from agents.explainer import ExplainerAgent
from agents.self_improve import SelfImprovementAgent

app = FastAPI(title="UJU Cycle Marvel v5.0", version="5.0.0")

diviner = DivinerAgent()
lens_shifter = LensShifterAgent()
weaver = PatternWeaverAgent()
critic = TylerWiseCritic()
explainer = ExplainerAgent()
self_improver = SelfImprovementAgent()

class AnalyzeRequest(BaseModel):
    query: str
    lenses: List[str]
    user_id: str
    privacy_budget: float = 2.0

class AnalyzeResponse(BaseModel):
    analysis_id: str
    executive_summary: List[str]
    cmo_configurations: List[Dict[str, Any]]
    actionable_recommendations: List[str]
    confidence_calibration: Dict[str, Any]
    security: Dict[str, Any]

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    analysis_id = str(uuid.uuid4())
    
    try:
        compressed = diviner.compress(request.query, request.user_id)
        
        lens_results = lens_shifter.analyze(compressed["compressed"])
        
        synthesized = weaver.synthesize(lens_results)
        
        critique = critic.critique(
            synthesized["cmo_configurations"],
            synthesized["design_principles"]
        )
        
        explained = explainer.explain(critique, synthesized["cmo_configurations"])
        
        return AnalyzeResponse(
            analysis_id=analysis_id,
            executive_summary=explained.get("executive_summary", []),
            cmo_configurations=synthesized.get("cmo_configurations", []),
            actionable_recommendations=explained.get("actionable_recommendations", []),
            confidence_calibration=explained.get("confidence_calibration", {}),
            security=explained.get("security", {})
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def feedback(analysis_id: str, user_rating: int):
    return self_improver.update({}, user_rating)

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "5.0.0", "agents": 6}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
