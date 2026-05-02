from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from common.database import get_db
from common.models import Session as SessionModel, SessionCheckpoint, UserFeedback
from common.config import get_settings
import json
import uuid
import asyncio
import redis
import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta

app = FastAPI(title="UJU Critic (Tyler Wise Protocol)", version="4.0")
settings = get_settings()
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

def run_ach_matrix(lens_outputs: List[Dict], compressed_signal: Dict) -> Dict:
    """
    Analysis of Competing Hypotheses (ACH) Matrix.
    Evaluates multiple hypotheses against evidence from all lenses.
    """
    # Extract key hypotheses from lens outputs
    hypotheses = []
    for lens in lens_outputs:
        insights = lens.get("key_insights", [])
        for i, insight in enumerate(insights[:2]):  # Max 2 per lens
            hypotheses.append({
                "id": f"H{len(hypotheses)+1}",
                "text": insight,
                "source_lens": lens.get("lens_name", lens.get("lens", "")),
                "confidence": lens.get("confidence", 0.5)
            })
    
    # If too few hypotheses, add defaults
    if len(hypotheses) < 3:
        hypotheses.append({"id": "H_default_1", "text": "Signal is genuine and actionable", "source_lens": "Default", "confidence": 0.6})
        hypotheses.append({"id": "H_default_2", "text": "Signal is noise or artifact", "source_lens": "Default", "confidence": 0.4})
        hypotheses.append({"id": "H_default_3", "text": "Missing critical context/confounder", "source_lens": "Default", "confidence": 0.5})
    
    # Evidence items from all lenses
    evidence = []
    for lens in lens_outputs:
        evidence.extend(lens.get("key_insights", []))
        evidence.extend(lens.get("contrary_evidence", []))
    evidence = list(set(evidence))[:10]  # Deduplicate, max 10
    
    # Build consistency matrix (hypothesis x evidence)
    matrix = []
    for h in hypotheses:
        row = []
        for e in evidence:
            # Simple consistency scoring: check keyword overlap
            h_words = set(h["text"].lower().split())
            e_words = set(e.lower().split())
            overlap = len(h_words.intersection(e_words))
            consistency = min(1.0, overlap / max(len(h_words), 1))
            row.append(round(consistency, 2))
        matrix.append(row)
    
    # Find most consistent hypothesis
    scores = [sum(row) / len(row) if row else 0 for row in matrix]
    best_idx = int(np.argmax(scores)) if scores else 0
    
    return {
        "hypotheses": hypotheses,
        "evidence": evidence,
        "consistency_matrix": matrix,
        "scores": [round(s, 3) for s in scores],
        "most_likely": hypotheses[best_idx]["text"] if hypotheses else "Unknown",
        "confidence": round(scores[best_idx], 3) if scores else 0.0
    }

def run_pre_mortem(session_data: Dict) -> Dict:
    """Pre-Mortem simulation: imagine the project has failed in 2 years."""
    failure_modes = [
        {"mode": "Compression loses critical nuance", "probability": 0.3, "mitigation": "Depth Mode toggle"},
        {"mode": "Competitor releases slower but more accurate tool", "probability": 0.25, "mitigation": "Add confidence intervals, explainability"},
        {"mode": "User churn due to complexity", "probability": 0.2, "mitigation": "PWA, offline mode, progressive disclosure"},
        {"mode": "Adversarial gaming of outputs", "probability": 0.15, "mitigation": "Input sanitization, diversity score"},
        {"mode": "Model drift / API cost overrun", "probability": 0.1, "mitigation": "Local Ollama fallback, circuit breaker"},
    ]
    return {
        "scenario": "2 years post-launch: user satisfaction has dropped to 60%",
        "failure_modes": failure_modes,
        "top_risk": max(failure_modes, key=lambda x: x["probability"])["mode"]
    }

def detect_confounders(compressed_signal: Dict, lens_outputs: List[Dict]) -> Dict:
    """Pearl-style confounder detection via sensitivity analysis."""
    uncertainty_flags = compressed_signal.get("uncertainty_flags", [])
    relationships = compressed_signal.get("relationships", [])
    
    # Look for potential confounders: relationships without clear causal mechanism
    potential_confounders = []
    for rel in relationships:
        if rel.get("confidence", 1.0) < 0.7:
            potential_confounders.append({
                "variable": f"{rel.get('subject', '?')} ↔ {rel.get('object', '?')}",
                "type": "unobserved_confounding_suspected",
                "confidence_drop": round(1.0 - rel.get("confidence", 0.5), 2)
            })
    
    # Add from uncertainty flags
    for flag in uncertainty_flags:
        potential_confounders.append({
            "variable": flag,
            "type": "uncertainty_flag",
            "confidence_drop": 0.3
        })
    
    return {
        "confounders_detected": len(potential_confounders),
        "potential_confounders": potential_confounders[:5],
        "sensitivity_note": "High confounder load reduces causal claim strength"
    }

def bayesian_update(session_id: uuid.UUID, db: Session, current_confidence: float) -> float:
    """Update confidence using Bayesian posterior from prior session feedback."""
    past_feedback = db.query(UserFeedback).join(SessionModel).filter(
        SessionModel.user_id == db.query(SessionModel).filter(SessionModel.id == session_id).first().user_id if db.query(SessionModel).filter(SessionModel.id == session_id).first() else ""
    ).all()
    
    if not past_feedback:
        return current_confidence
    
    # Prior = current_confidence, Likelihood = avg past rating / 5
    ratings = [f.rating for f in past_feedback if f.rating]
    if not ratings:
        return current_confidence
    
    avg_rating = sum(ratings) / len(ratings)
    likelihood = avg_rating / 5.0
    
    # Simple Bayesian update: weighted average
    prior_weight = 0.4
    likelihood_weight = 0.6
    posterior = (current_confidence * prior_weight) + (likelihood * likelihood_weight)
    return round(posterior, 3)

async def process_critic(session_id: str, db: Session):
    session = db.query(SessionModel).filter(SessionModel.id == uuid.UUID(session_id)).first()
    if not session or not session.lens_outputs:
        return
    
    lens_data = session.lens_outputs
    lens_outputs = lens_data.get("lens_outputs", [])
    compressed = session.compressed_signal or {}
    
    ach = run_ach_matrix(lens_outputs, compressed)
    pre_mortem = run_pre_mortem(lens_data)
    confounders = detect_confounders(compressed, lens_outputs)
    
    # Bayesian update on ACH best hypothesis confidence
    current_conf = ach.get("confidence", 0.5)
    updated_conf = bayesian_update(uuid.UUID(session_id), db, current_conf)
    
    result = {
        "ach_matrix": ach,
        "pre_mortem": pre_mortem,
        "confounder_analysis": confounders,
        "bayesian_posterior": updated_conf,
        "original_confidence": current_conf,
        "critic_status": "complete"
    }
    
    session.critic_output = result
    session.status = "critiqued"
    db.commit()
    
    cp = SessionCheckpoint(session_id=session.id, stage="critic", state=result)
    db.add(cp)
    db.commit()
    
    # Enqueue next stage: Explainer
    job = json.dumps({"session_id": session_id, "stage": "explain"})
    redis_client.lpush("uju:explainer_queue", job)

async def worker():
    while True:
        try:
            _, job_data = redis_client.brpop("uju:critic_queue", timeout=5)
            if not job_data:
                await asyncio.sleep(1)
                continue
            job = json.loads(job_data)
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            engine = create_engine(settings.database_url)
            SessionLocal = sessionmaker(bind=engine)
            db = SessionLocal()
            await process_critic(job["session_id"], db)
            db.close()
        except Exception as e:
            await asyncio.sleep(2)

@app.on_event("startup")
async def startup():
    asyncio.create_task(worker())

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "critic", "protocol": "Tyler Wise"}

@app.post("/critic/{session_id}")
async def manual_critic(session_id: str, db: Session = Depends(get_db)):
    await process_critic(session_id, db)
    return {"status": "critiqued", "session_id": session_id}
