from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from decimal import Decimal


class MetricsResponse(BaseModel):
    brand_id: UUID
    brand_name: str
    visibility_score: Optional[Decimal] = None
    answers_mentioned: int = 0
    total_answers: int = 0
    avg_position: Optional[Decimal] = None
    sentiment_score: Optional[Decimal] = None
    market_share: Optional[Decimal] = None
    first_position_count: int = 0
    second_position_count: int = 0
    third_position_count: int = 0
    total_citations: int = 0
    unique_domains_cited: int = 0
    brand_owned_citations: int = 0
    chatgpt_visibility: Optional[Decimal] = None
    claude_visibility: Optional[Decimal] = None
    gemini_visibility: Optional[Decimal] = None
    perplexity_visibility: Optional[Decimal] = None
    calculated_at: datetime
    
    class Config:
        from_attributes = True


class LeaderboardItem(BaseModel):
    rank: int
    brand_id: UUID
    brand_name: str
    is_primary: bool
    visibility_score: Decimal
    avg_position: Decimal
    sentiment_score: Decimal
    market_share: Decimal


class DashboardResponse(BaseModel):
    project_id: UUID
    project_name: str
    category: str
    metrics: MetricsResponse
    leaderboard: list[LeaderboardItem]
    total_prompts: int
    total_responses: int
    platform_breakdown: dict
