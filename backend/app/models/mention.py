import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, func, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Mention(Base):
    __tablename__ = "mentions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    response_id = Column(UUID(as_uuid=True), ForeignKey("ai_responses.id", ondelete="CASCADE"), nullable=False)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer)  # 1st, 2nd, 3rd mention
    context = Column(Text)  # Surrounding text
    sentiment = Column(String(20), default="neutral")  # positive, neutral, negative
    sentiment_score = Column(Numeric(3, 2))  # -1.0 to 1.0
    is_recommended = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    response = relationship("AIResponse", back_populates="mentions")
    brand = relationship("Brand", back_populates="mentions")
