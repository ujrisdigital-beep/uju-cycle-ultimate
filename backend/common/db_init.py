from common.database import engine, Base
from common.models import (
    Methodology, MethodologyEvolution, Session,
    SessionCheckpoint, Output, UserFeedback, AuditLog
)

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

if __name__ == "__main__":
    init_db()
