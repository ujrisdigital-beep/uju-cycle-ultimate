from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from common.database import get_db
from common.models import Session as SessionModel, SessionCheckpoint, Methodology
from common.config import get_settings
import json
import uuid
import asyncio
import redis
from datetime import datetime
import openai

app = FastAPI(title="UJU Diviner (Compressor v2)", version="4.0")
settings = get_settings()
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

# 7 Base Methodologies (Pearl, Ostrom, Gawande, Kahneman, Klein + 2 more)
BASE_METHODOLOGIES = [
    {"name": "Causal Inference (Pearl)", "key": "pearl_causal"},
    {"name": "Commons Governance (Ostrom)", "key": "ostrom_commons"},
    {"name": "Checklist Manifesto (Gawande)", "key": "gawande_checklist"},
    {"name": "Dual-Process Theory (Kahneman)", "key": "kahneman_dualprocess"},
    {"name": "RPD Decision Making (Klein)", "key": "klein_rpd"},
    {"name": "Signal Detection Theory", "key": "signal_detection"},
    {"name": "Fault Tree Analysis", "key": "fault_tree"},
]

def get_compression_prompt(text: str, mode: str, ratio: float) -> str:
    target_len = int(len(text) * (1 - ratio))
    mode_note = "PRIORITY: Maximum compression, speed matters." if mode == "fast" else "PRIORITY: Preserve nuance and edge cases, higher fidelity."
    return f"""
You are the Diviner — UJU Cycle Compressor v2.

TASK: Compress the following input into a structured JSON-LD signal.
Target compression: {int(ratio*100)}% (reduce to ~{target_len} chars)
Mode: {mode.upper()}
{mode_note}

INPUT:
{text}

OUTPUT FORMAT (JSON-LD):
{{
  "compressed_signal": "<concise summary preserving key entities, relationships, and uncertainties>",
  "entities": [{{"name": "...", "type": "...", "confidence": 0.0-1.0}}],
  "relationships": [{{"subject": "...", "predicate": "...", "object": "...", "confidence": 0.0-1.0}}],
  "uncertainty_flags": ["list of what might be missing or ambiguous"],
  "methodology_hints": ["which of the 7 base methodologies best apply"],
  "confidence_interval": {{"lower": 0.0, "upper": 1.0}}
}}

Return ONLY valid JSON.
"""

async def compress_with_openai(text: str, mode: str, ratio: float) -> dict:
    prompt = get_compression_prompt(text, mode, ratio)
    try:
        client = openai.OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2 if mode == "fast" else 0.1,
            response_format={"type": "json_object"}
        )
        content = resp.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        # Fallback: rule-based compression
        return {
            "compressed_signal": text[:int(len(text) * (1 - ratio))] + "... [truncated]",
            "entities": [],
            "relationships": [],
            "uncertainty_flags": ["OpenAI unavailable — using fallback truncation"],
            "methodology_hints": [],
            "confidence_interval": {"lower": 0.3, "upper": 0.6}
        }

async def process_compression(session_id: str, mode: str, db: Session):
    session = db.query(SessionModel).filter(SessionModel.id == uuid.UUID(session_id)).first()
    if not session:
        return

    ratio = settings.compressor_fast_ratio if mode == "fast" else settings.compressor_depth_ratio
    result = await compress_with_openai(session.raw_input, mode, ratio)

    session.compressed_signal = result
    session.status = "compressed"
    db.commit()

    cp = SessionCheckpoint(session_id=session.id, stage="compress", state=result)
    db.add(cp)
    db.commit()

    # Enqueue next stage: Lens Shifter
    job = json.dumps({"session_id": session_id, "stage": "lens_shift"})
    redis_client.lpush("uju:lens_queue", job)
    redis_client.lpush("uju:weaver_queue", job)

async def worker():
    """Background worker: pull from compress_queue and process."""
    while True:
        try:
            _, job_data = redis_client.brpop("uju:compress_queue", timeout=5)
            if not job_data:
                await asyncio.sleep(1)
                continue
            job = json.loads(job_data)
            # Need a db session per job — simplified here
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            engine = create_engine(settings.database_url)
            SessionLocal = sessionmaker(bind=engine)
            db = SessionLocal()
            await process_compression(job["session_id"], job.get("mode", "fast"), db)
            db.close()
        except Exception as e:
            await asyncio.sleep(2)

@app.on_event("startup")
async def startup():
    asyncio.create_task(worker())

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "diviner"}

@app.post("/compress/{session_id}")
async def manual_compress(session_id: str, mode: str = "fast", db: Session = Depends(get_db)):
    await process_compression(session_id, mode, db)
    return {"status": "compressed", "session_id": session_id}
