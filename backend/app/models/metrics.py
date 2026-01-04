import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class MetricsCache(Base):
    __tablename__ = "metrics_cache"
    __table_args__ = (
        UniqueConstraint('project_id', 'brand_id', name='uq_project_brand_metrics'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    
    # Core visibility metrics
    visibility_score = Column(Numeric(5, 2))  # Percentage (0-100)
    answers_mentioned = Column(Integer, default=0)
    total_answers = Column(Integer, default=0)
    avg_position = Column(Numeric(3, 2))
    sentiment_score = Column(Numeric(5, 2))  # Percentage positive
    market_share = Column(Numeric(5, 2))  # Share of voice
    
    # Mention breakdown
    first_position_count = Column(Integer, default=0)
    second_position_count = Column(Integer, default=0)
    third_position_count = Column(Integer, default=0)
    
    # Citation metrics
    total_citations = Column(Integer, default=0)
    unique_domains_cited = Column(Integer, default=0)
    brand_owned_citations = Column(Integer, default=0)
    
    # Platform-specific visibility
    chatgpt_visibility = Column(Numeric(5, 2))
    claude_visibility = Column(Numeric(5, 2))
    perplexity_visibility = Column(Numeric(5, 2))
    
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="metrics_cache")
    brand = relationship("Brand", back_populates="metrics_cache")
