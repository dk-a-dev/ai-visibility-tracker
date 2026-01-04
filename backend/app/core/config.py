import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "AI Visibility Tracker"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/ai_visibility"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # AI Platform APIs
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    PERPLEXITY_API_KEY: Optional[str] = os.getenv("PERPLEXITY_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    PERPLEXITY_MODEL: str = os.getenv("PERPLEXITY_MODEL", "sonar")
    
    # Rate Limits (requests per minute)
    OPENAI_RPM: int = int(os.getenv("OPENAI_RPM", "60"))
    ANTHROPIC_RPM: int = int(os.getenv("ANTHROPIC_RPM", "50"))
    GEMINI_RPM: int = int(os.getenv("GEMINI_RPM", "60"))
    PERPLEXITY_RPM: int = int(os.getenv("PERPLEXITY_RPM", "50"))
    
    # ChatGPT Web Scraping (Bonus)
    CHATGPT_SESSION_TOKEN: Optional[str] = os.getenv("CHATGPT_SESSION_TOKEN")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://ai-visibility-tracker.vercel.app"
    ]
    
    # Cache TTL (seconds)
    CACHE_TTL_DASHBOARD: int = 300  # 5 minutes
    CACHE_TTL_METRICS: int = 300  # 5 minutes
    CACHE_TTL_PROMPTS: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
