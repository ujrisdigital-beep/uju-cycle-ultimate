from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from common.database import get_db
from common.models import Session as SessionModel, SessionCheckpoint
from common.config import get_settings
import json
import uuid
import asyncio
import redis
from datetime import datetime
from typing import List, Dict, Any

app = FastAPI(title="UJU Lens Shifter", version="4.0")
settings = get_settings()
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

# The 6 Lenses
LENSES = [
    {"name": "Causal", "key": "causal", "prompt": "Analyze causal relationships, confounding variables, and intervention points."},
    {"name": "Dual-Process", "key": "dual_process", "prompt": "Map System 1 (intuition) vs System 2 (analytical) reasoning patterns."},
    {"name": "Institutional", "key": "institutional", "prompt": "Examine rules, norms, incentives, and institutional constraints."},
    {"name": "Signal Detection", "key": "signal", "prompt": "Identify signal vs noise, false positives/negatives, and detection thresholds."},
    {"name": "Fault-Tree", "key": "fault_tree", "prompt": "Build fault tree: root causes, failure modes, and cascading risks."},
    {"name": "Linguistic", "key": "linguistic", "prompt": "Analyze language patterns, framing, jargon, and communication gaps."},
]

def calculate_diversity_score(lens_outputs: List[Dict]) -> float:
    """Calculate diversity score (0-1) to ensure no single lens dominates."""
    if not lens_outputs:
        return 0.0
    # Simple entropy-based diversity: compare output lengths and confidence distributions
    lengths = [len(json.dumps(o.get("output", ""))) for o in lens_outputs]
    confidences = [o.get("confidence", 0.5) for o in lens_outputs]
    
    import numpy as np
    from scipy.stats import entropy
    
    # Normalize lengths to probabilities
    len_arr = np.array(lengths, dtype=float)
    if len_arr.sum() > 0:
        len_probs = len_arr / len_arr.sum()
    else:
        len_probs = np.ones(len(lengths)) / len(lengths)
    
    # Normalize confidences to probabilities
    conf_arr = np.array(confidences, dtype=float)
    if conf_arr.sum() > 0:
        conf_probs = conf_arr / conf_arr.sum()
    else:
        conf_probs = np.ones(len(confidences)) / len(confidences)
    
    # Average entropy of both distributions
    e1 = entropy(len_probs)
    e2 = entropy(conf_probs)
    max_entropy = entropy(np.ones(len(lengths)) / len(lengths))
    
    if max_entropy == 0:
        return 1.0
    return float((e1 + e2) / (2 * max_entropy))

async def run_single_lens(lens: Dict, compressed_signal: Dict, session_id: str) -> Dict:
    """Run a single lens analysis on the compressed signal."""
    prompt = f"""
You are the Lens Shifter ({lens['name']} Lens).

CONTEXT (Compressed Signal):
{json.dumps(compressed_signal, indent=2)}

LENS INSTRUCTION:
{lens['prompt']}

OUTPUT FORMAT (JSON):
{{
  "lens": "{lens['key']}",
  "output": "<analysis from this lens perspective>",
  "confidence": 0.0-1.0,
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "contrary_evidence": ["what this lens might miss"]
}}

Return ONLY valid JSON.
"""
    try:
        import openai
        client = openai.OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        result = json.loads(resp.choices[0].message.content)
        result["lens_name"] = lens["name"]
        return result
    except Exception as e:
        return {
            "lens": lens["key"],
            "lens_name": lens["name"],
            "output": f"[Lens unavailable: {str(e)}]",
            "confidence": 0.3,
            "key_insights": [],
            "contrary_evidence": ["Lens execution failed"]
        }

async def run_all_lenses(compressed_signal: Dict, session_id: str) -> List[Dict]:
    """Run all 6 lenses in parallel."""
    tasks = [run_single_lens(lens, compressed_signal, session_id) for lens in LENSES]
    results = await asyncio.gather(*tasks)
    return results

async def process_lens_shift(session_id: str, db: Session):
    session = db.query(SessionModel).filter(SessionModel.id == uuid.UUID(session_id)).first()
    if not session or not session.compressed_signal:
        return

    lens_outputs = await run_all_lenses(session.compressed_signal, session_id)
    diversity_score = calculate_diversity_score(lens_outputs)

    # Enforce diversity: warn if too low
    diversity_warning = None
    if diversity_score < settings.diversity_score_min:
        diversity_warning = f"Diversity score {diversity_score:.2f} below minimum {settings.diversity_score_min}. Consider broadening analysis."

    result = {
        "lens_outputs": lens_outputs,
        "diversity_score": diversity_score,
        "diversity_warning": diversity_warning,
        "lens_count": len(lens_outputs)
    }

    session.lens_outputs = result
    session.status = "lens_shifted"
    db.commit()

    cp = SessionCheckpoint(session_id=session.id, stage="lens_shift", state=result)
    db.add(cp)
    db.commit()

    # Enqueue next stage: Pattern Weaver
    job = json.dumps({"session_id": session_id, "stage": "weave"})
    redis_client.lpush("uju:weaver_queue", job)

async def worker():
    while True:
        try:
            _, job_data = redis_client.brpop("uju:lens_queue", timeout=5)
            if not job_data:
                await asyncio.sleep(1)
                continue
            job = json.loads(job_data)
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            engine = create_engine(settings.database_url)
            SessionLocal = sessionmaker(bind=engine)
            db = SessionLocal()
            await process_lens_shift(job["session_id"], db)
            db.close()
        except Exception as e:
            await asyncio.sleep(2)

@app.on_event("startup")
async def startup():
    asyncio.create_task(worker())

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "lens-shifter", "lens_count": len(LENSES)}

@app.post("/lens_shift/{session_id}")
async def manual_lens_shift(session_id: str, db: Session = Depends(get_db)):
    await process_lens_shift(session_id, db)
    return {"status": "lens_shifted", "session_id": session_id}
