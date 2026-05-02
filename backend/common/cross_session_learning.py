"""
Cross-session pattern detection.
Runs weekly as a batch job to find trending topics, lens preferences,
and emergent patterns across all users.
"""
from sqlalchemy.orm import Session
from common.models import Session, SessionPattern, UserFeedback
from common.database import get_db
import json
from datetime import datetime, timedelta
from collections import Counter
import re

def extract_topics(text: str, max_topics: int = 3) -> list:
    """Simple keyword extraction for topic clustering."""
    words = re.findall(r'\b[a-z]{4,}\b', text.lower())
    stop_words = {'that', 'with', 'this', 'from', 'have', 'they', 'will', 'been', 'were', 'what', 'when', 'which', 'would', 'could', 'should'}
    filtered = [w for w in words if w not in stop_words]
    return [w for w, _ in Counter(filtered).most_common(max_topics)]

def detect_lens_preferences(db: Session) -> dict:
    """Find which lenses are most commonly used/preferred per domain."""
    sessions = db.query(Session).filter(Session.lens_outputs.isnot(None)).all()
    lens_counts = Counter()
    domain_lens = {}
    
    for s in sessions:
        if not s.lens_outputs:
            continue
        domain = (s.raw_input or "")[:50].lower()
        lenses = s.lens_outputs.get("lens_outputs", [])
        for l in lenses:
            lens_name = l.get("lens_name") or l.get("lens", "unknown")
            lens_counts[lens_name] += 1
            if domain not in domain_lens:
                domain_lens[domain] = Counter()
            domain_lens[domain][lens_name] += 1
    
    return {
        "overall_ranking": lens_counts.most_common(6),
        "by_domain": {k: v.most_common(3) for k, v in domain_lens.items() if len(v) > 0}
    }

def detect_trending_topics(db: Session, days: int = 7) -> list:
    """Detect trending topics in recent sessions."""
    cutoff = datetime.utcnow() - timedelta(days=days)
    sessions = db.query(Session).filter(Session.created_at >= cutoff).all()
    
    all_topics = []
    for s in sessions:
        if s.raw_input:
            topics = extract_topics(s.raw_input)
            all_topics.extend(topics)
    
    return Counter(all_topics).most_common(10)

def update_session_patterns(db: Session):
    """Main function: run all detectors and update session_patterns table."""
    # Trending topics
    topics = detect_trending_topics(db)
    for topic, count in topics:
        existing = db.query(SessionPattern).filter(
            SessionPattern.pattern_type == "trending_topic",
            SessionPattern.pattern_data.contains({"topic": topic})
        ).first()
        
        if existing:
            existing.occurrence_count += count
            existing.last_seen = datetime.utcnow()
            existing.confidence = min(0.99, existing.confidence + (count * 0.01))
        else:
            db.add(SessionPattern(
                pattern_type="trending_topic",
                pattern_data={"topic": topic},
                occurrence_count=count,
                confidence=min(0.99, count * 0.05),
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow()
            ))
    
    # Lens preferences
    lens_prefs = detect_lens_preferences(db)
    for lens_name, count in lens_prefs["overall_ranking"]:
        existing = db.query(SessionPattern).filter(
            SessionPattern.pattern_type == "lens_preference",
            SessionPattern.pattern_data.contains({"lens": lens_name})
        ).first()
        
        if existing:
            existing.occurrence_count += count
            existing.last_seen = datetime.utcnow()
        else:
            db.add(SessionPattern(
                pattern_type="lens_preference",
                pattern_data={"lens": lens_name, "count": count},
                occurrence_count=count,
                confidence=min(0.99, count / 100.0),
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow()
            ))
    
    db.commit()
    return {"trending_topics": len(topics), "lens_preferences_updated": len(lens_prefs["overall_ranking"])}

if __name__ == "__main__":
    db = next(get_db())
    result = update_session_patterns(db)
    print(f"✅ Cross-session learning update complete:")
    print(f"   Trending topics: {result['trending_topics']}")
    print(f"   Lens preferences: {result['lens_preferences_updated']}")
