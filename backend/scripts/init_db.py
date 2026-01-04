"""Database initialization and utilities"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    """Initialize database - create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


def drop_db():
    """Drop all tables (use with caution!)"""
    print("⚠️  Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Database tables dropped!")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database utilities")
    parser.add_argument(
        "command",
        choices=["init", "drop", "reset"],
        help="Command to run: init (create tables), drop (remove tables), reset (drop + init)"
    )
    
    args = parser.parse_args()
    
    if args.command == "init":
        init_db()
    elif args.command == "drop":
        confirm = input("Are you sure you want to drop all tables? (yes/no): ")
        if confirm.lower() == "yes":
            drop_db()
        else:
            print("Cancelled")
    elif args.command == "reset":
        confirm = input("Are you sure you want to reset the database? (yes/no): ")
        if confirm.lower() == "yes":
            drop_db()
            init_db()
        else:
            print("Cancelled")
