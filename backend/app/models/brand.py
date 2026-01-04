import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    website = Column(String(500))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="brands")
    mentions = relationship("Mention", back_populates="brand", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="brand")
    metrics_cache = relationship("MetricsCache", back_populates="brand", cascade="all, delete-orphan")
