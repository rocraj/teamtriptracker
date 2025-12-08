from sqlmodel import create_engine, Session
from app.core.config import get_settings

settings = get_settings()

# Fix PostgreSQL URL format for SQLAlchemy 2.0+
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)

# Create database engine
engine = create_engine(
    database_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
)


def create_db_and_tables():
    """Create all database tables."""
    from app.models.schemas import SQLModel, SettlementRequest  # Import all models
    SQLModel.metadata.create_all(engine)


def get_session():
    """Get database session for dependency injection."""
    with Session(engine) as session:
        yield session
