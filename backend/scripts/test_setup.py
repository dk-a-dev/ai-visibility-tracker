#!/usr/bin/env python3
"""
Quick test script to verify backend setup
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_imports():
    """Test if all modules can be imported"""
    print("Testing imports...")
    
    try:
        from app.core.config import settings
        print("✅ Config loaded")
        print(f"   Database: {settings.DATABASE_URL}")
        print(f"   Redis: {settings.REDIS_URL}")
        print(f"   OpenAI API Key: {'Set' if settings.OPENAI_API_KEY else 'Not set'}")
        print(f"   Anthropic API Key: {'Set' if settings.ANTHROPIC_API_KEY else 'Not set'}")
    except Exception as e:
        print(f"❌ Config failed: {e}")
        return False
    
    try:
        from app.core.database import Base, engine
        print("✅ Database connection ready")
    except Exception as e:
        print(f"❌ Database failed: {e}")
        return False
    
    try:
        from app.models.user import User
        from app.models.project import Project
        from app.models.brand import Brand
        print("✅ Models loaded")
    except Exception as e:
        print(f"❌ Models failed: {e}")
        return False
    
    try:
        from app.schemas.user import UserCreate, UserResponse
        from app.schemas.project import ProjectCreate, ProjectResponse
        print("✅ Schemas loaded")
    except Exception as e:
        print(f"❌ Schemas failed: {e}")
        return False
    
    try:
        from app.services.prompt_generator import generate_prompts
        from app.services.ai_service import ai_service
        from app.services.analysis_service import analysis_service
        print("✅ Services loaded")
    except Exception as e:
        print(f"❌ Services failed: {e}")
        return False
    
    try:
        from app.worker import celery_app
        print("✅ Celery app loaded")
    except Exception as e:
        print(f"❌ Celery failed: {e}")
        return False
    
    print("\n✅ All imports successful!")
    return True


def test_prompt_generation():
    """Test prompt generation"""
    print("\nTesting prompt generation...")
    
    try:
        from app.services.prompt_generator import generate_prompts
        
        prompts = generate_prompts(
            category="CRM software",
            brands=["Salesforce", "HubSpot", "Pipedrive"],
            count=10
        )
        
        print(f"✅ Generated {len(prompts)} prompts")
        print("\nSample prompts:")
        for i, prompt in enumerate(prompts[:3], 1):
            print(f"\n{i}. [{prompt['category']}] {prompt['text']}")
        
        return True
    except Exception as e:
        print(f"❌ Prompt generation failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("AI Visibility Tracker - Backend Test")
    print("=" * 60)
    print()
    
    success = True
    success = test_imports() and success
    success = test_prompt_generation() and success
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed!")
        print("\nNext steps:")
        print("1. Set up environment variables (.env file)")
        print("2. Initialize database: python scripts/init_db.py init")
        print("3. Start API server: uvicorn app.main:app --reload")
        print("4. Start Celery worker: celery -A app.worker.celery_app worker --loglevel=info")
    else:
        print("❌ Some tests failed. Check errors above.")
        sys.exit(1)
    print("=" * 60)
