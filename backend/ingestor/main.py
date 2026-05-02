from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from common.database import get_db
from common.models import Session as SessionModel, SessionCheckpoint, AuditLog, ApiKey, UsageLog
from common.config import get_settings
from common.auth import get_api_key_from_header, verify_api_key, check_rate_limit, UsageTracker
import json
import uuid
from datetime import datetime
import asyncio
import redis
import httpx
import hashlib
import time

app = FastAPI(title="UJU Ingestor", version="4.0")
settings = get_settings()

# Redis connection
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

# Prometheus metrics
try:
    from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
    REQUEST_COUNT = Counter('uju_ingest_requests_total', 'Total ingest requests', ['status'])
    REQUEST_LATENCY = Histogram('uju_ingest_latency_seconds', 'Ingest latency')
    TOKEN_USAGE = Counter('uju_ingest_tokens_total', 'Total tokens processed')
    metrics_available = True
except ImportError:
    metrics_available = False

def sanitize_input(text: str) -> str:
    """Anti-prompt injection: strip control chars, block injection patterns."""
    import re
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    injection_patterns = [
        r'ignore (all )?(previous|above|prior) instructions',
        r'you are now',
        r'act as (a|an)',
        r'system prompt',
        r'<\|.*?\|>',
    ]
    for pat in injection_patterns:
        text = re.sub(pat, '[REDACTED]', text, flags=re.IGNORECASE)
    return text[:50000]

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"

    def record_success(self):
        self.failure_count = 0
        self.state = "closed"

    def record_failure(self):
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            self.last_failure_time = datetime.utcnow()

    def can_execute(self) -> bool:
        if self.state == "closed":
            return True
        if self.state == "open":
            if (datetime.utcnow() - self.last_failure_time).seconds > self.recovery_timeout:
                self.state = "half-open"
                return True
            return False
        return True

breaker = CircuitBreaker()

async def save_checkpoint(db: Session, session_id: uuid.UUID, stage: str, state: dict):
    cp = SessionCheckpoint(session_id=session_id, stage=stage, state=state)
    db.add(cp)
    db.commit()

async def enqueue_compression(session_id: str, mode: str):
    """Push to Redis queue for Diviner (Compressor) to pick up."""
    job = json.dumps({"session_id": session_id, "mode": mode, "stage": "compress"})
    redis_client.lpush("uju:compress_queue", job)

@app.post("/ingest")
async def ingest(request: Request, db: Session = Depends(get_db)):
    start = time.time() if metrics_available else None
    if not breaker.can_execute():
        if metrics_available:
            REQUEST_COUNT.labels(status='circuit_open').inc()
        raise HTTPException(503, "Circuit breaker open — service temporarily unavailable")

    # API Key auth
    key_str = get_api_key_from_header(request)
    if not key_str:
        raise HTTPException(401, "Missing API key. Use: Authorization: Bearer <key>")
    try:
        api_key = verify_api_key(key_str, db)
        await check_rate_limit(api_key, db)
    except HTTPException:
        if metrics_available:
            REQUEST_COUNT.labels(status='auth_fail').inc()
        raise

    try:
        body = await request.json()
    except Exception:
        breaker.record_failure()
        if metrics_available:
            REQUEST_COUNT.labels(status='invalid_json').inc()
        raise HTTPException(400, "Invalid JSON body")

    raw_input = body.get("input", "")
    user_id = body.get("user_id", str(api_key.user_id))
    mode = body.get("mode", "fast")

    if not raw_input or len(raw_input.strip()) < 10:
        raise HTTPException(400, "Input too short (min 10 chars)")

    sanitized = sanitize_input(raw_input)

    session = SessionModel(
        id=uuid.uuid4(),
        user_id=user_id,
        raw_input=sanitized,
        mode=mode,
        status="ingested"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    db.add(AuditLog(user_id=user_id, action="ingest_start", resource="session", resource_id=str(session.id)))
    db.commit()

    await save_checkpoint(db, session.id, "ingest", {"raw_input_length": len(sanitized)})

    await enqueue_compression(str(session.id), mode)

    # Log usage
    UsageTracker.log(db, str(api_key.id), user_id, "/ingest", tokens=len(sanitized.split()), cost=0.0, request=request)

    breaker.record_success()
    if metrics_available:
        REQUEST_COUNT.labels(status='success').inc()
        if start:
            REQUEST_LATENCY.observe(time.time() - start)
        TOKEN_USAGE.inc(len(sanitized.split()))

    return JSONResponse({
        "session_id": str(session.id),
        "status": "ingested",
        "input_length": len(sanitized),
        "mode": mode,
        "next_stage": "compress"
    })

@app.get("/stream/{session_id}")
async def stream_ingest(session_id: str, db: Session = Depends(get_db)):
    async def event_generator():
        yield f"data: {json.dumps({'stage': 'init', 'session_id': session_id})}\n\n"
        await asyncio.sleep(0.3)
        yield f"data: {json.dumps({'stage': 'sanitized', 'status': 'ok'})}\n\n"
        await asyncio.sleep(0.3)
        yield f"data: {json.dumps({'stage': 'queued_for_compress', 'status': 'ok'})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/health")
async def health():
    try:
        redis_client.ping()
        return {"status": "healthy", "circuit_breaker": breaker.state, "redis": "connected"}
    except Exception:
        return {"status": "degraded", "circuit_breaker": breaker.state, "redis": "disconnected"}

@app.get("/metrics")
async def prometheus_metrics():
    if metrics_available:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        from fastapi.responses import Response
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
    return {"error": "prometheus_client not installed"}
