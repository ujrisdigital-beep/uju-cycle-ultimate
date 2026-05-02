from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from common.database import get_db
from common.models import ApiKey, User
from functools import lru_cache
import hashlib
import time
from typing import Optional

# Rate limit: {tier: (requests_per_minute, monthly_limit)}
TIER_LIMITS = {
    "free": (10, 1000),
    "pro": (100, 50000),
    "enterprise": (1000, 999999),
}

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def verify_api_key(key: str, db: Session) -> tuple[ApiKey, User]:
    """Verify API key and return key + user if valid."""
    key_hash = hash_key(key)
    api_key = db.query(ApiKey).filter(ApiKey.key_hash == key_hash).first()
    if not api_key:
        raise HTTPException(401, "Invalid API key")
    
    if api_key.expires_at and api_key.expires_at < __import__('datetime').datetime.utcnow():
        raise HTTPException(401, "API key expired")
    
    user = db.query(User).filter(User.id == api_key.user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    
    return api_key, user

async def check_rate_limit(api_key: ApiKey, db: Session):
    """Check monthly usage limit."""
    if api_key.usage_count >= api_key.monthly_limit:
        raise HTTPException(429, "Monthly usage limit exceeded")
    
    # Update usage
    api_key.usage_count += 1
    api_key.last_used_at = __import__('datetime').datetime.utcnow()
    db.commit()

class UsageTracker:
    """Track API usage and cost."""
    @staticmethod
    def log(
        db: Session,
        api_key_id: str,
        user_id: str,
        endpoint: str,
        tokens: int = 0,
        cost: float = 0.0,
        request: Request = None
    ):
        from common.models import UsageLog
        log = UsageLog(
            api_key_id=api_key_id,
            user_id=user_id,
            endpoint=endpoint,
            tokens_used=tokens,
            cost_usd=cost,
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
        db.add(log)
        db.commit()

def get_api_key_from_header(request: Request) -> Optional[str]:
    """Extract API key from Authorization header."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None

class RequireAPIKey:
    """Dependency for endpoints requiring API key auth."""
    async def __call__(self, request: Request, db: Session = Depends(get_db)):
        key_str = get_api_key_from_header(request)
        if not key_str:
            raise HTTPException(401, "Missing API key. Use: Authorization: Bearer <key>")
        api_key, user = verify_api_key(key_str, db)
        await check_rate_limit(api_key, db)
        return {"api_key": api_key, "user": user, "db": db}
