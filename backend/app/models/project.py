import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Survey/Onboarding data
    industry = Column(String(100))
    company_size = Column(String(50))
    target_audience = Column(Text)
    primary_goals = Column(ARRAY(Text))
    
    # Prompt strategy customization (optional)
    prompt_distribution = Column(JSONB)  # e.g., {"informational": 0.40, "comparison": 0.35, ...}
    
    status = Column(String(50), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    brands = relationship("Brand", back_populates="project", cascade="all, delete-orphan")
    prompts = relationship("Prompt", back_populates="project", cascade="all, delete-orphan")
    analysis_jobs = relationship("AnalysisJob", back_populates="project", cascade="all, delete-orphan")
    metrics_cache = relationship("MetricsCache", back_populates="project", cascade="all, delete-orphan")
