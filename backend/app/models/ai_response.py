import uuid
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class AIResponse(Base):
    __tablename__ = "ai_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)  # chatgpt, claude, gemini, perplexity
    model = Column(String(100))  # gpt-4-turbo, claude-3-5-sonnet
    response_text = Column(Text, nullable=False)
    response_time_ms = Column(Integer)
    tokens_used = Column(Integer)
    error_message = Column(Text)
    status = Column(String(50), default="success")  # success, failed, timeout
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    prompt = relationship("Prompt", back_populates="responses")
    mentions = relationship("Mention", back_populates="response", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="response", cascade="all, delete-orphan")
