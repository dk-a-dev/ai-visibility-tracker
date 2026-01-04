from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.brand import Brand
from app.models.metrics import MetricsCache
from app.models.prompt import Prompt
from app.models.ai_response import AIResponse
from app.models.mention import Mention
from app.schemas.metrics import DashboardResponse, MetricsResponse, LeaderboardItem

router = APIRouter()


@router.get("/{project_id}", response_model=DashboardResponse)
async def get_dashboard(
    project_id: UUID,
    brand_id: Optional[UUID] = None,  # For competitor impersonation mode
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard data for a project"""
    
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get primary brand or specified brand
    if brand_id:
        target_brand = db.query(Brand).filter(
            Brand.id == brand_id,
            Brand.project_id == project_id
        ).first()
    else:
        target_brand = db.query(Brand).filter(
            Brand.project_id == project_id,
            Brand.is_primary == True
        ).first()
    
    if not target_brand:
        # Fallback to first brand
        target_brand = db.query(Brand).filter(
            Brand.project_id == project_id
        ).first()
    
    if not target_brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No brands found for this project"
        )
    
    # Get metrics from cache
    metrics = db.query(MetricsCache).filter(
        MetricsCache.project_id == project_id,
        MetricsCache.brand_id == target_brand.id
    ).first()
    
    if not metrics:
        # Return empty metrics if not calculated yet
        metrics_response = MetricsResponse(
            brand_id=target_brand.id,
            brand_name=target_brand.name,
            calculated_at=datetime.utcnow()
        )
    else:
        metrics_response = MetricsResponse(
            brand_id=metrics.brand_id,
            brand_name=target_brand.name,
            visibility_score=metrics.visibility_score,
            answers_mentioned=metrics.answers_mentioned,
            total_answers=metrics.total_answers,
            avg_position=metrics.avg_position,
            sentiment_score=metrics.sentiment_score,
            market_share=metrics.market_share,
            first_position_count=metrics.first_position_count,
            second_position_count=metrics.second_position_count,
            third_position_count=metrics.third_position_count,
            total_citations=metrics.total_citations,
            unique_domains_cited=metrics.unique_domains_cited,
            brand_owned_citations=metrics.brand_owned_citations,
            chatgpt_visibility=metrics.chatgpt_visibility,
            claude_visibility=metrics.claude_visibility,
            gemini_visibility=metrics.gemini_visibility,
            perplexity_visibility=metrics.perplexity_visibility,
            calculated_at=metrics.calculated_at
        )
    
    # Build leaderboard
    leaderboard = []
    all_metrics = db.query(MetricsCache, Brand).join(
        Brand, MetricsCache.brand_id == Brand.id
    ).filter(
        MetricsCache.project_id == project_id
    ).order_by(MetricsCache.visibility_score.desc()).all()
    
    for rank, (metric, brand) in enumerate(all_metrics, start=1):
        leaderboard.append(LeaderboardItem(
            rank=rank,
            brand_id=brand.id,
            brand_name=brand.name,
            is_primary=brand.is_primary,
            visibility_score=metric.visibility_score or Decimal(0),
            avg_position=metric.avg_position or Decimal(0),
            sentiment_score=metric.sentiment_score or Decimal(0),
            market_share=metric.market_share or Decimal(0)
        ))
    
    # Get total prompts and responses
    total_prompts = db.query(func.count(Prompt.id)).filter(
        Prompt.project_id == project_id
    ).scalar() or 0
    
    total_responses = db.query(func.count(AIResponse.id)).join(
        Prompt, AIResponse.prompt_id == Prompt.id
    ).filter(
        Prompt.project_id == project_id,
        AIResponse.status == "success"
    ).scalar() or 0
    
    # Platform breakdown
    platform_stats = db.query(
        AIResponse.platform,
        func.count(AIResponse.id).label("total"),
        func.count(case((Mention.id.isnot(None), 1))).label("mentioned")
    ).join(
        Prompt, AIResponse.prompt_id == Prompt.id
    ).outerjoin(
        Mention,
        (Mention.response_id == AIResponse.id) & (Mention.brand_id == target_brand.id)
    ).filter(
        Prompt.project_id == project_id,
        AIResponse.status == "success"
    ).group_by(AIResponse.platform).all()
    
    platform_breakdown = {}
    for platform, total, mentioned in platform_stats:
        visibility = (mentioned / total * 100) if total > 0 else 0
        platform_breakdown[platform] = {
            "total_responses": total,
            "mentioned_count": mentioned,
            "visibility": round(visibility, 2)
        }
    
    return DashboardResponse(
        project_id=project.id,
        project_name=project.name,
        category=project.category,
        metrics=metrics_response,
        leaderboard=leaderboard,
        total_prompts=total_prompts,
        total_responses=total_responses,
        platform_breakdown=platform_breakdown
    )
