"""Initialize database tables on startup"""
from app.core.database import engine, Base
from app.models.user import User
from app.models.project import Project
from app.models.brand import Brand
from app.models.prompt import Prompt
from app.models.ai_response import AIResponse
from app.models.mention import Mention
from app.models.citation import Citation
from app.models.metrics import MetricsCache
from app.models.analysis_job import AnalysisJob


def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_db()
