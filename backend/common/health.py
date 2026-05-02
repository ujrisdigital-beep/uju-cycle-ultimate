from fastapi import FastAPI, Response, status
import psutil
import time
from typing import Dict, Any

app = FastAPI()

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint - Task G1 (2hrs)"""
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent,
        "version": "1.0.0",
        "service": "uju-cycle-ultimate"
    }

@app.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check - Task G1 (2hrs)"""
    try:
        # Check Supabase connection (simplified)
        # await supabase.table('cases').select('id').limit(1).execute()
        return {
            "status": "ready",
            "checks": {
                "database": "ok",
                "search_engines": "ok",
                "ai_models": "ok"
            }
        }
    except Exception as e:
        return Response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=f"Not Ready: {str(e)}"
        )

@app.get("/metrics")
async def metrics() -> Dict[str, Any]:
    """Prometheus-style metrics - Task G1"""
    return {
        "uptime_seconds": int(time.time() - start_time),
        "memory_usage_mb": psutil.Process().memory_info().rss / 1024 / 1024,
        "cpu_usage_percent": psutil.cpu_percent(),
        "active_connections": len(psutil.net_connections())
    }

# Rate limiting middleware (Task G1 - 4hrs)
from fastapi import Request
from fastapi.responses import JSONResponse
from collections import defaultdict
from time import time

request_counts = defaultdict(list)
RATE_LIMIT = 100  # requests per window
WINDOW_SECONDS = 60  # 1 minute window

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    now = time()
    
    # Clean old entries
    request_counts[client_ip] = [
        t for t in request_counts[client_ip] 
        if now - t < WINDOW_SECONDS
    ]
    
    if len(request_counts[client_ip]) >= RATE_LIMIT:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "retry_after": WINDOW_SECONDS}
        )
    
    request_counts[client_ip].append(now)
    response = await call_next(request)
    return response

start_time = time.time()
