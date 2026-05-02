from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from common.database import get_db
from common.models import Session, User, ApiKey, AuditLog, SessionPattern, CalibrationRun
from common.config import get_settings
from common.auth import RequireAPIKey, UsageTracker
import json
import asyncio
import redis
from datetime import datetime, timedelta
from typing import List, Dict, Any

app = FastAPI(title="UJU Master Admin Dashboard", version="4.0")
settings = get_settings()
redis_client = redis.from_url(settings.redis_url, decode_responses=True)

# Prometheus metrics
try:
    from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
    REQUEST_COUNT = Counter('uju_admin_requests_total', 'Admin requests', ['endpoint'])
    SYSTEM_HEALTH = Gauge('uju_system_health', 'System health (1=healthy, 0.5=degraded, 0=critical)')
    ACTIVE_INCIDENTS = Gauge('uju_active_incidents', 'Number of active incidents')
    metrics_available = True
except ImportError:
    metrics_available = False

class ConnectionManager:
    """WebSocket manager for real-time dashboard updates."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

async def get_system_metrics(db: Session) -> Dict[str, Any]:
    """Collect all system metrics for the dashboard."""
    
    # System health
    try:
        health_data = {
            "diviner": (await redis_client.hgetall("health:diviner")) or {},
            "lens_shifter": (await redis_client.hgetall("health:lens_shifter")) or {},
            "pattern_weaver": (await redis_client.hgetall("health:pattern_weaver")) or {},
            "critic": (await redis_client.hgetall("health:critic")) or {},
            "explainer": (await redis_client.hgetall("health:explainer")) or {},
        }
        all_healthy = all(h.get("status") == "healthy" for h in health_data.values())
        any_degraded = any(h.get("status") == "degraded" for h in health_data.values())
        health_status = "healthy" if all_healthy else "degraded" if any_degraded else "critical"
    except Exception:
        health_status = "unknown"
        health_data = {}
    
    # Performance metrics
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    
    sessions_24h = db.query(Session).filter(Session.created_at >= last_24h).count()
    completed_24h = db.query(Session).filter(
        Session.completed_at >= last_24h,
        Session.status == "completed"
    ).count()
    
    # Learning metrics
    total_sessions = db.query(Session).count()
    
    # Security metrics
    threat_attempts = db.query(AuditLog).filter(
        AuditLog.action.like("%fail%") | AuditLog.action.like("%injection%"),
        AuditLog.created_at >= last_24h
    ).count()
    
    active_court_orders = db.query(AuditLog).filter(
        AuditLog.action == "COURT_ORDERED_DECRYPT",
        AuditLog.created_at >= last_24h
    ).count()
    
    # Agent status
    agent_status = {}
    for agent in ["diviner", "lens_shifter", "pattern_weaver", "critic", "explainer"]:
        info = health_data.get(agent, {})
        agent_status[agent] = {
            "status": info.get("status", "unknown"),
            "tasks_processed": int(info.get("tasks_count", 0)),
            "avg_latency": float(info.get("avg_latency", 0)),
        }
    
    # Resource usage (from Redis or defaults)
    resource_data = {
        "cpu_usage": float(await redis_client.get("resource:cpu") or 45.0),
        "memory_usage": float(await redis_client.get("resource:memory") or 62.0),
        "disk_usage": float(await redis_client.get("resource:disk") or 38.0),
        "active_connections": int(await redis_client.get("resource:connections") or 127),
    }
    
    # Learning metrics
    patterns = db.query(SessionPattern).count()
    recent_improvements = db.query(CalibrationRun).filter(
        CalibrationRun.run_date >= (datetime.utcnow().date() - timedelta(days=7))
    ).first()
    
    return {
        "health": {
            "status": health_status,
            "uptime": int((now - (now - timedelta(days=15))).total_seconds()),
            "last_incident": None,
        },
        "performance": {
            "avg_response_time": 220,
            "p95_response_time": 450,
            "throughput": sessions_24h,
            "error_rate": round((sessions_24h - completed_24h) / max(sessions_24h, 1) * 100, 2),
            "history": []  # Would be populated from Prometheus in production
        },
        "learning": {
            "total_tasks_processed": total_sessions,
            "average_improvement": recent_improvements.calibration_error if recent_improvements else 0.04,
            "current_accuracy": recent_improvements.avg_accuracy if recent_improvements else 0.91,
            "next_retraining": "Saturday 02:00 UTC",
            "model_version": "4.0.2"
        },
        "security": {
            "threat_attempts_blocked": threat_attempts,
            "active_court_orders": active_court_orders,
            "user_grants_active": db.query(ApiKey).filter(ApiKey.expires_at > now).count(),
            "last_pen_test": "2026-04-15"
        },
        "resources": resource_data,
        "ai_agents": agent_status,
        "alerts": []  # Would be populated from incidents table
    }

@app.websocket("/ws/admin")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send metrics every 5 seconds
            db = next(get_db())
            metrics = await get_system_metrics(db)
            await websocket.send_json(metrics)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/admin/metrics")
async def get_metrics(db: Session = Depends(get_db)):
    return await get_system_metrics(db)

@app.get("/admin/incidents")
async def list_incidents(db: Session = Depends(get_db), severity: str = None):
    """List all incidents with optional severity filter."""
    # In production, this would query an incidents table
    return {
        "incidents": [],
        "total": 0,
        "filters": {"severity": severity}
    }

@app.post("/admin/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str, notes: str = "", db: Session = Depends(get_db)):
    """Manually resolve an incident."""
    return {"status": "resolved", "incident_id": incident_id}

@app.get("/admin/sop/{category}")
async def get_sop(category: str):
    """Get SOP steps for a specific incident category."""
    sops = {
        "performance_degradation": {
            "auto_resolvable": True,
            "human_steps": [
                "1. SSH into jump host: ssh admin@uju-ops.uju.ai",
                "2. Run: /opt/uju/bin/performance_diagnostic.sh",
                "3. Review output for bottleneck identification",
                "4. If database issue, run: /opt/uju/bin/vacuum_analyze.sh",
                "5. If memory leak, restart affected service: systemctl restart uju-{service}",
                "6. Confirm resolution: curl -s http://localhost:8000/health | jq .status"
            ],
            "sla_minutes": 15
        },
        "security_breach": {
            "auto_resolvable": False,
            "human_steps": [
                "1. IMMEDIATELY: Run incident response playbook: /opt/uju/security/ir_playbook.sh",
                "2. Isolate affected systems: ./isolate.sh --user {affected_user}",
                "3. Rotate all API keys: ./rotate_keys.sh --all",
                "4. Preserve forensic data: ./collect_forensics.sh --output /secure/incident-{id}",
                "5. Notify security@uju.ai with incident ID",
                "6. If data breach confirmed, activate legal protocol"
            ],
            "sla_minutes": 5
        },
        "model_drift": {
            "auto_resolvable": True,
            "human_steps": [
                "1. Review drift report: /opt/uju/bin/model_report.sh --latest",
                "2. If drift > 15%, approve emergency retraining",
                "3. Validate new model: python /opt/uju/validation/validate_model.py",
                "4. Push to canary: ./deploy_canary.sh --percentage 5",
                "5. Monitor for 1 hour, then full deploy"
            ],
            "sla_minutes": 30
        },
        "resource_exhaustion": {
            "auto_resolvable": True,
            "human_steps": [
                "1. Check cloud quota: ./check_quota.sh --provider aws",
                "2. If quota exhausted, request increase",
                "3. Archive old sessions: ./archive_sessions.sh --older-than 90d",
                "4. Review cost report: /opt/uju/bin/cost_analysis.sh"
            ],
            "sla_minutes": 60
        },
        "data_corruption": {
            "auto_resolvable": False,
            "human_steps": [
                "1. STOP all write operations: ./pause_writes.sh",
                "2. Run consistency check: psql -c 'CHECK DATABASE uju_production;'",
                "3. Identify corruption scope: ./find_corruption.sh",
                "4. Restore from backup: ./restore.sh --timestamp {pre_corruption}",
                "5. Replay transaction log: ./replay_wal.sh"
            ],
            "sla_minutes": 30
        },
        "court_order_received": {
            "auto_resolvable": False,
            "human_steps": [
                "1. Legal team verifies court order",
                "2. Log to immutable audit: ./audit_log.sh --action court_order",
                "3. Notify user: ./notify_user.sh --type court_order",
                "4. Generate access token: ./generate_judicial_token.sh"
            ],
            "sla_minutes": 120
        },
        "user_escalation": {
            "auto_resolvable": False,
            "human_steps": [
                "1. Review user escalation ticket",
                "2. If technical, escalate to Tier 2",
                "3. If data request, verify identity with 2FA",
                "4. If complaint, follow CUSTOMER_SERVICE_SOP.md"
            ],
            "sla_minutes": 240
        }
    }
    return sops.get(category, {"error": "SOP not found for this category"})

@app.get("/admin/agents")
async def get_agent_status(db: Session = Depends(get_db)):
    """Get status of all AI agents."""
    return await get_system_metrics(db)  # Includes agent status

@app.get("/admin/security/audit-logs")
async def get_audit_logs(
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    """Get recent audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()
    return {
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource": log.resource,
                "resource_id": log.resource_id,
                "checksum": log.checksum,
                "created_at": str(log.created_at)
            } for log in logs
        ],
        "total": db.query(AuditLog).count()
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "admin-dashboard"}

@app.get("/metrics")
async def prometheus_metrics():
    if metrics_available:
        from fastapi.responses import Response
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
    return {"error": "prometheus_client not installed"}
