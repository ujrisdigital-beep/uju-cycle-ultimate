from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON, BigInteger
from sqlalchemy.dialects.postgresql import UUID, INET, VECTOR
from sqlalchemy.sql import func
from common.database import Base
import uuid

class Methodology(Base):
    __tablename__ = "methodologies"
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    json_schema = Column(JSON, nullable=False)
    embedding_vector = Column(VECTOR(1536))
    version = Column(Integer, default=1)
    is_builtin = Column(Boolean, default=True)
    created_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True)
    password_hash = Column(String(255))
    tier = Column(String(20), default="free")
    stripe_customer_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ApiKey(Base):
    __tablename__ = "api_keys"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    key_hash = Column(String(64), unique=True, nullable=False)
    key_prefix = Column(String(12))
    tier = Column(String(20), default="free")
    monthly_limit = Column(Integer, default=1000)
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="SET NULL"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    endpoint = Column(String(100))
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    ip_address = Column(INET)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255))
    raw_input = Column(Text)
    compressed_signal = Column(JSON)
    lens_outputs = Column(JSON)
    critic_output = Column(JSON)
    explainer_output = Column(JSON)
    mode = Column(String(20), default="fast")
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

class SessionCheckpoint(Base):
    __tablename__ = "session_checkpoints"
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    stage = Column(String(50), nullable=False)
    state = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Output(Base):
    __tablename__ = "outputs"
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    format = Column(String(20))
    content = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserFeedback(Base):
    __tablename__ = "user_feedback"
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(BigInteger, primary_key=True)
    user_id = Column(String(255))
    action = Column(String(100), nullable=False)
    resource = Column(String(100))
    resource_id = Column(String(255))
    ip_address = Column(INET)
    user_agent = Column(Text)
    checksum = Column(String(64))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CalibrationDataset(Base):
    __tablename__ = "calibration_dataset"
    id = Column(Integer, primary_key=True)
    problem_id = Column(String(50), unique=True, nullable=False)
    domain = Column(String(100))
    query_text = Column(Text, nullable=False)
    expert_answer = Column(Text)
    ground_truth_confidence = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CalibrationRun(Base):
    __tablename__ = "calibration_runs"
    id = Column(Integer, primary_key=True)
    run_date = Column(DateTime(timezone=True), server_default=func.now())
    total_problems = Column(Integer)
    avg_confidence = Column(Float)
    avg_accuracy = Column(Float)
    calibration_error = Column(Float)
    report_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SessionPattern(Base):
    __tablename__ = "session_patterns"
    id = Column(Integer, primary_key=True)
    pattern_type = Column(String(50))
    pattern_data = Column(JSON, nullable=False)
    occurrence_count = Column(Integer, default=1)
    confidence = Column(Float)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())

class MethodologyEvolution(Base):
    __tablename__ = "methodology_evolution"
    id = Column(Integer, primary_key=True)
    methodology_id = Column(Integer, ForeignKey("methodologies.id", ondelete="CASCADE"))
    version = Column(Integer, nullable=False)
    json_schema = Column(JSON, nullable=False)
    diff_summary = Column(Text)
    user_feedback_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MarketplaceItem(Base):
    __tablename__ = "marketplace_items"
    id = Column(Integer, primary_key=True)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    item_type = Column(String(20))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    json_schema = Column(JSON, nullable=False)
    price_usd = Column(Float, default=0.0)
    revenue_share_creator = Column(Float, default=0.70)
    is_approved = Column(Boolean, default=False)
    download_count = Column(Integer, default=0)
    rating_avg = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
