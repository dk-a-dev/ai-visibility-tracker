import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Citation(Base):
    __tablename__ = "citations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    response_id = Column(UUID(as_uuid=True), ForeignKey("ai_responses.id", ondelete="CASCADE"), nullable=False)
    url = Column(Text, nullable=False)
    title = Column(String(500))
    domain = Column(String(255))
    position = Column(Integer)  # Citation number [1], [2], [3]
    is_brand_owned = Column(Boolean, default=False)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    response = relationship("AIResponse", back_populates="citations")
    brand = relationship("Brand", back_populates="citations")
