from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from common.database import get_db
from common.models import Session as SessionModel, SessionCheckpoint
from common.config import get_settings
import json
import uuid
import asyncio
import redis
import numpy as np
from typing import List, Dict, Any

app = FastAPI(title="UJU Pattern Weaver", version="4.0")
settings = get_settings()
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

def krippendorff_alpha(lens_outputs: List[Dict]) -> float:
    """
    Calculate Krippendorff's Alpha for inter-lens agreement.
    Uses confidence scores and output length as proxy for categorical agreement.
    """
    if len(lens_outputs) < 2:
        return 1.0
    
    confidences = [o.get("confidence", 0.5) for o in lens_outputs]
    n = len(confidences)
    
    # Observed disagreement: mean pairwise squared difference
    observed = 0.0
    pairs = 0
    for i in range(n):
        for j in range(i + 1, n):
            observed += (confidences[i] - confidences[j]) ** 2
            pairs += 1
    observed = observed / pairs if pairs > 0 else 0.0
    
    # Expected disagreement: variance-based
    mean_conf = np.mean(confidences)
    expected = np.var(confidences)
    
    if expected == 0:
        return 1.0
    alpha = 1.0 - (observed / expected)
    return max(0.0, min(1.0, alpha))

def extract_cmo(lens_outputs: List[Dict], compressed_signal: Dict) -> Dict:
    """
    Generate CMO (Causal Model Output) from lens outputs.
    Uses Ostrom's design principles + Klein's RPD patterns.
    """
    entities = compressed_signal.get("entities", [])
    relationships = compressed_signal.get("relationships", [])
    
    # Design Principles (Ostrom)
    design_principles = [
        {"principle": "Clearly defined boundaries", "score": 0.0, "evidence": ""},
        {"principle": "Congruence between rules and local conditions", "score": 0.0, "evidence": ""},
        {"principle": "Collective-choice arrangements", "score": 0.0, "evidence": ""},
        {"principle": "Monitoring", "score": 0.0, "evidence": ""},
        {"principle": "Graduated sanctions", "score": 0.0, "evidence": ""},
        {"principle": "Conflict-resolution mechanisms", "score": 0.0, "evidence": ""},
        {"principle": "Minimal recognition of rights", "score": 0.0, "evidence": ""},
        {"principle": "Nested enterprises", "score": 0.0, "evidence": ""},
    ]
    
    # RPD patterns (Klein)
    rpd_patterns = [
        {"pattern": "Recognition of typicality", "detected": False, "confidence": 0.0},
        {"pattern": "Mental simulation", "detected": False, "confidence": 0.0},
        {"pattern": "Diagnosis of causal mechanism", "detected": False, "confidence": 0.0},
        {"pattern": "Expectation failure", "detected": False, "confidence": 0.0},
    ]
    
    # Score based on lens insights
    all_insights = []
    for lens in lens_outputs:
        all_insights.extend(lens.get("key_insights", []))
    
    insights_text = " ".join(all_insights).lower()
    
    # Simple keyword matching for design principles
    for dp in design_principles:
        keywords = dp["principle"].lower().split()
        matches = sum(1 for kw in keywords if kw in insights_text)
        dp["score"] = min(1.0, matches / max(len(keywords), 1))
        dp["evidence"] = "; ".join([i for i in all_insights if any(kw in i.lower() for kw in keywords)][:2])
    
    # RPD pattern detection
    rpd_keywords = {
        "Recognition of typicality": ["typical", "pattern", "similar", "expected"],
        "Mental simulation": ["simulate", "imagine", "what if", "scenario"],
        "Diagnosis of causal mechanism": ["cause", "because", "mechanism", "drives"],
        "Expectation failure": ["unexpected", "surprise", "contradiction", "anomaly"],
    }
    for rp in rpd_patterns:
        kws = rpd_keywords.get(rp["pattern"], [])
        hits = sum(1 for kw in kws if kw in insights_text)
        rp["detected"] = hits > 0
        rp["confidence"] = min(1.0, hits / max(len(kws), 1))
    
    # Build causal graph from relationships
    causal_graph = {
        "nodes": [{"id": e["name"], "type": e.get("type", "entity"), "confidence": e.get("confidence", 0.5)} for e in entities],
        "edges": [{"source": r["subject"], "target": r["object"], "label": r["predicate"], "confidence": r.get("confidence", 0.5)} for r in relationships]
    }
    
    return {
        "design_principles": design_principles,
        "rpd_patterns": rpd_patterns,
        "causal_graph": causal_graph,
        "entity_count": len(entities),
        "relationship_count": len(relationships)
    }

async def process_weave(session_id: str, db: Session):
    session = db.query(SessionModel).filter(SessionModel.id == uuid.UUID(session_id)).first()
    if not session or not session.lens_outputs:
        return
    
    lens_data = session.lens_outputs
    lens_outputs = lens_data.get("lens_outputs", [])
    
    alpha = krippendorff_alpha(lens_outputs)
    cmo = extract_cmo(lens_outputs, session.compressed_signal or {})
    
    result = {
        "krippendorff_alpha": alpha,
        "cmo": cmo,
        "lens_count": len(lens_outputs),
        "weave_status": "complete"
    }
    
    session.lens_outputs = {**lens_data, **result}
    session.status = "woven"
    db.commit()
    
    cp = SessionCheckpoint(session_id=session.id, stage="weave", state=result)
    db.add(cp)
    db.commit()
    
    # Enqueue next stage: Critic
    job = json.dumps({"session_id": session_id, "stage": "critic"})
    redis_client.lpush("uju:critic_queue", job)

async def worker():
    while True:
        try:
            _, job_data = redis_client.brpop("uju:weaver_queue", timeout=5)
            if not job_data:
                await asyncio.sleep(1)
                continue
            job = json.loads(job_data)
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            engine = create_engine(settings.database_url)
            SessionLocal = sessionmaker(bind=engine)
            db = SessionLocal()
            await process_weave(job["session_id"], db)
            db.close()
        except Exception as e:
            await asyncio.sleep(2)

@app.on_event("startup")
async def startup():
    asyncio.create_task(worker())

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "pattern-weaver"}

@app.post("/weave/{session_id}")
async def manual_weave(session_id: str, db: Session = Depends(get_db)):
    await process_weave(session_id, db)
    return {"status": "woven", "session_id": session_id}
