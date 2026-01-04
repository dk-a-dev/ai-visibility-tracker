from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class PromptBase(BaseModel):
    text: str
    category: Optional[str] = None
    intent_type: Optional[str] = None


class PromptCreate(PromptBase):
    pass


class PromptResponse(PromptBase):
    id: UUID
    project_id: UUID
    source: str
    created_at: datetime
    response_count: int = 0
    mentioned_count: int = 0
    
    class Config:
        from_attributes = True


class MentionResponse(BaseModel):
    id: UUID
    brand_id: UUID
    brand_name: str
    position: Optional[int]
    context: Optional[str]
    sentiment: str
    platform: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class CitationResponse(BaseModel):
    id: UUID
    url: str
    title: Optional[str]
    domain: str
    position: Optional[int]
    is_brand_owned: bool
    platform: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnalysisJobResponse(BaseModel):
    id: UUID
    project_id: UUID
    status: str
    job_type: str
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    progress_percentage: float
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PlatformBrandBreakdown(BaseModel):
    platform: str
    brand_name: str
    total_responses: int
    mentions: int
    avg_position: Optional[float]
    avg_sentiment: Optional[float]
    recommended_count: int
    visibility_pct: float
    
    class Config:
        from_attributes = True
