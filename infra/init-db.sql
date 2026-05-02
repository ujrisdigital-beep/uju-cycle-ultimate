-- UJU Cycle Live v4.0 — Complete DB Schema (with monetization, audit, calibration)
-- Requires pgvector extension

CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- CORE TABLES (existing)
-- =============================================

-- Methodologies table (7 base + user-contributed)
CREATE TABLE IF NOT EXISTS methodologies (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    json_schema     JSONB NOT NULL,
    embedding_vector VECTOR(1536),
    version         INT DEFAULT 1,
    is_builtin      BOOLEAN DEFAULT TRUE,
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Methodology evolution / versioning
CREATE TABLE IF NOT EXISTS methodology_evolution (
    id              SERIAL PRIMARY KEY,
    methodology_id  INT REFERENCES methodologies(id) ON DELETE CASCADE,
    version         INT NOT NULL,
    json_schema     JSONB NOT NULL,
    diff_summary    TEXT,
    user_feedback_score DECIMAL(3,2) DEFAULT 0.0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         VARCHAR(255),
    raw_input       TEXT,
    compressed_signal JSONB,
    lens_outputs    JSONB,
    critic_output   JSONB,
    explainer_output JSONB,
    mode            VARCHAR(20) DEFAULT 'fast',
    status          VARCHAR(20) DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- Session checkpoints (crash recovery every 30s)
CREATE TABLE IF NOT EXISTS session_checkpoints (
    id              SERIAL PRIMARY KEY,
    session_id      UUID REFERENCES sessions(id) ON DELETE CASCADE,
    stage           VARCHAR(50) NOT NULL,
    state           JSONB NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Output layer results
CREATE TABLE IF NOT EXISTS outputs (
    id              SERIAL PRIMARY KEY,
    session_id      UUID REFERENCES sessions(id) ON DELETE CASCADE,
    format          VARCHAR(20),
    content         JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User feedback (for RL / Bayesian updating)
CREATE TABLE IF NOT EXISTS user_feedback (
    id              SERIAL PRIMARY KEY,
    session_id      UUID REFERENCES sessions(id) ON DELETE CASCADE,
    rating          INT CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MONETIZATION TABLES
-- =============================================

-- Users (for auth & tier management)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255),
    tier            VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys (hashed storage)
CREATE TABLE IF NOT EXISTS api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash        VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hex
    key_prefix      VARCHAR(12), -- e.g., "uju_live_"
    tier            VARCHAR(20) DEFAULT 'free',
    monthly_limit   INT DEFAULT 1000, -- API calls per month
    usage_count     INT DEFAULT 0,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs (for billing & rate limiting)
CREATE TABLE IF NOT EXISTS usage_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id      UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint        VARCHAR(100),
    tokens_used     INT DEFAULT 0,
    cost_usd        DECIMAL(10,6) DEFAULT 0.0,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace: user-contributed methodologies/lenses
CREATE TABLE IF NOT EXISTS marketplace_items (
    id              SERIAL PRIMARY KEY,
    creator_id      UUID REFERENCES users(id),
    item_type       VARCHAR(20) CHECK (item_type IN ('methodology', 'lens')),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    json_schema     JSONB NOT NULL,
    price_usd       DECIMAL(10,2) DEFAULT 0.0,
    revenue_share_creator DECIMAL(3,2) DEFAULT 0.70, -- 70% to creator
    is_approved    BOOLEAN DEFAULT FALSE,
    download_count  INT DEFAULT 0,
    rating_avg      DECIMAL(2,1) DEFAULT 0.0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT & COMPLIANCE (immutable)
-- =============================================

-- Immutable audit log (append-only via trigger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(255),
    action          VARCHAR(100) NOT NULL,
    resource        VARCHAR(100),
    resource_id     VARCHAR(255),
    ip_address      INET,
    user_agent      TEXT,
    checksum        VARCHAR(64), -- hash of row content for tamper detection
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent UPDATE/DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only. INSERT only.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_no_update ON audit_logs;
CREATE TRIGGER audit_no_update
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Function to compute checksum on insert
CREATE OR REPLACE FUNCTION set_audit_checksum()
RETURNS TRIGGER AS $$
BEGIN
    NEW.checksum = encode(
        digest(
            COALESCE(NEW.user_id,'') || COALESCE(NEW.action,'') ||
            COALESCE(NEW.resource,'') || COALESCE(NEW.resource_id,'') ||
            NEW.created_at::text,
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_checksum ON audit_logs;
CREATE TRIGGER audit_checksum
    BEFORE INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION set_audit_checksum();

-- =============================================
-- CALIBRATION & BENCHMARKS
-- =============================================

CREATE TABLE IF NOT EXISTS calibration_dataset (
    id              SERIAL PRIMARY KEY,
    problem_id      VARCHAR(50) UNIQUE NOT NULL,
    domain          VARCHAR(100),
    query_text      TEXT NOT NULL,
    expert_answer   TEXT,
    ground_truth_confidence DECIMAL(3,2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_runs (
    id              SERIAL PRIMARY KEY,
    run_date        DATE DEFAULT CURRENT_DATE,
    total_problems  INT,
    avg_confidence  DECIMAL(3,2),
    avg_accuracy    DECIMAL(3,2),
    calibration_error DECIMAL(4,3), -- Brier score or similar
    report_json     JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CROSS-SESSION LEARNING
-- =============================================

CREATE TABLE IF NOT EXISTS session_patterns (
    id              SERIAL PRIMARY KEY,
    pattern_type    VARCHAR(50), -- e.g., 'topic_cluster', 'lens_preference'
    pattern_data    JSONB NOT NULL,
    occurrence_count INT DEFAULT 1,
    confidence      DECIMAL(3,2),
    first_seen      TIMESTAMPTZ DEFAULT NOW(),
    last_seen       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_methodologies_embedding ON methodologies USING ivfflat (embedding_vector vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_checkpoints_session ON session_checkpoints(session_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_usage_logs_key ON usage_logs(api_key_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_checksum ON audit_logs(checksum);
CREATE INDEX IF NOT EXISTS idx_calibration_runs_date ON calibration_runs(run_date);

-- =============================================
-- INITIAL DATA: 7 BASE METHODOLOGIES
-- =============================================

INSERT INTO methodologies (name, description, json_schema, is_builtin, version)
VALUES
('Braun (Thematic Analysis)', '6-phase thematic analysis framework', '{"phases": ["familiarization", "coding", "theme generation", "review", "define", "report"]}', TRUE, 1),
('Ritchie (Framework Analysis)', '5-stage framework analysis with matrix output', '{"stages": ["familiarization", "identifying framework", "indexing", "charting", "mapping"]}', TRUE, 1),
('Noblit (Meta-Ethnography)', 'Synthesis of qualitative research through translation', '{"steps": ["reading", "determining relationship", "translating", "synthesizing"]}', TRUE, 1),
('Dixon-Woods (Critical Interpretive Synthesis)', 'CIS approach for integrative review', '{"elements": ["sampling", "synthesis", "lines of argument"]}', TRUE, 1),
('Pawson (Realist Evaluation)', 'Context-Mechanism-Outcome configuration', '{"components": ["context", "mechanism", "outcome"]}', TRUE, 1),
('Thomas (Interpretive Synthesis)', 'Meta-interpretation and thematic synthesis', '{"phases": ["line of argument", "synthesis", "generalization"]}', TRUE, 1),
('Miles (Qualitative Data Analysis)', 'Matrix, network, and cross-case analysis', '{"tools": ["matrices", "networks", "case order"]}', TRUE, 1)
ON CONFLICT DO NOTHING;
