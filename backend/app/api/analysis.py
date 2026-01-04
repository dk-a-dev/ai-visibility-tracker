from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.prompt import Prompt
from app.models.ai_response import AIResponse
from app.models.mention import Mention
from app.models.citation import Citation
from app.models.brand import Brand
from app.models.analysis_job import AnalysisJob
from app.schemas.analysis import (
    PromptResponse, MentionResponse, CitationResponse, AnalysisJobResponse,
    PlatformBrandBreakdown, PromptCreate, PromptUpdate, PromptSetupRequest
)

router = APIRouter()


@router.post("/projects/{project_id}/analyze", status_code=status.HTTP_202_ACCEPTED)
async def trigger_analysis(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger a new analysis for a project"""
    
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
    
    # Check if prompts exist
    prompt_count = db.query(Prompt).filter(
        Prompt.project_id == project_id
    ).count()
    
    if prompt_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No prompts configured. Please set up prompts before running analysis."
        )
    
    # Check if brands exist
    brand_count = db.query(Brand).filter(
        Brand.project_id == project_id
    ).count()
    
    if brand_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No brands configured. Please add at least one brand before running analysis."
        )
    
    # Trigger analysis pipeline
    from app.workers.tasks import start_analysis_pipeline
    job = start_analysis_pipeline.delay(str(project_id))
    
    return {
        "message": "Analysis started",
        "project_id": str(project_id),
        "job_id": job.id
    }


@router.get("/projects/{project_id}/prompts", response_model=List[PromptResponse])
async def get_prompts(
    project_id: UUID,
    brand_id: Optional[UUID] = None,
    mentioned: Optional[bool] = None,  # Filter by mentioned/not mentioned
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get prompts for a project"""
    
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
    
    # Base query
    query = db.query(Prompt).filter(Prompt.project_id == project_id)
    
    # Get prompts
    prompts = query.order_by(Prompt.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for prompt in prompts:
        # Count responses
        response_count = db.query(AIResponse).filter(
            AIResponse.prompt_id == prompt.id,
            AIResponse.status == "success"
        ).count()
        
        # Count mentions for specific brand
        mentioned_count = 0
        if brand_id:
            mentioned_count = db.query(Mention).join(
                AIResponse, Mention.response_id == AIResponse.id
            ).filter(
                AIResponse.prompt_id == prompt.id,
                Mention.brand_id == brand_id
            ).count()
        
        # Filter by mentioned status if requested
        if mentioned is not None and brand_id:
            if mentioned and mentioned_count == 0:
                continue
            if not mentioned and mentioned_count > 0:
                continue
        
        result.append(PromptResponse(
            id=prompt.id,
            project_id=prompt.project_id,
            text=prompt.text,
            category=prompt.category,
            intent_type=prompt.intent_type,
            source=prompt.source,
            created_at=prompt.created_at,
            response_count=response_count,
            mentioned_count=mentioned_count
        ))
    
    return result


@router.get("/projects/{project_id}/mentions", response_model=List[MentionResponse])
async def get_mentions(
    project_id: UUID,
    brand_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get mentions for a project"""
    
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
    
    # Build query
    query = db.query(Mention, Brand, AIResponse).join(
        Brand, Mention.brand_id == Brand.id
    ).join(
        AIResponse, Mention.response_id == AIResponse.id
    ).join(
        Prompt, AIResponse.prompt_id == Prompt.id
    ).filter(
        Prompt.project_id == project_id
    )
    
    if brand_id:
        query = query.filter(Mention.brand_id == brand_id)
    
    mentions = query.order_by(Mention.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for mention, brand, response in mentions:
        result.append(MentionResponse(
            id=mention.id,
            brand_id=brand.id,
            brand_name=brand.name,
            position=mention.position,
            context=mention.context,
            sentiment=mention.sentiment,
            platform=response.platform,
            created_at=mention.created_at
        ))
    
    return result


@router.get("/projects/{project_id}/citations", response_model=List[CitationResponse])
async def get_citations(
    project_id: UUID,
    brand_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get citations for a project"""
    
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
    
    # Build query
    query = db.query(Citation, AIResponse).join(
        AIResponse, Citation.response_id == AIResponse.id
    ).join(
        Prompt, AIResponse.prompt_id == Prompt.id
    ).filter(
        Prompt.project_id == project_id
    )
    
    if brand_id:
        query = query.filter(Citation.brand_id == brand_id)
    
    citations = query.order_by(Citation.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for citation, response in citations:
        result.append(CitationResponse(
            id=citation.id,
            url=citation.url,
            title=citation.title,
            domain=citation.domain or "",
            position=citation.position,
            is_brand_owned=citation.is_brand_owned,
            platform=response.platform,
            created_at=citation.created_at
        ))
    
    return result


@router.get("/projects/{project_id}/jobs", response_model=List[AnalysisJobResponse])
async def get_analysis_jobs(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis jobs for a project"""
    
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
    
    jobs = db.query(AnalysisJob).filter(
        AnalysisJob.project_id == project_id
    ).order_by(AnalysisJob.created_at.desc()).limit(10).all()
    
    result = []
    for job in jobs:
        progress = 0
        if job.total_tasks > 0:
            progress = (job.completed_tasks / job.total_tasks) * 100
        
        result.append(AnalysisJobResponse(
            id=job.id,
            project_id=job.project_id,
            status=job.status,
            job_type=job.job_type,
            total_tasks=job.total_tasks,
            completed_tasks=job.completed_tasks,
            failed_tasks=job.failed_tasks,
            progress_percentage=round(progress, 2),
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at
        ))
    
    return result


@router.get("/projects/{project_id}/platform-breakdown", response_model=List[PlatformBrandBreakdown])
async def get_platform_breakdown(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get platform-by-brand breakdown showing which AI mentioned which brand"""
    
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
    
    # Complex query to get platform-by-brand metrics
    from sqlalchemy import func, case, Float, Numeric
    
    query = db.query(
        AIResponse.platform,
        Brand.name.label('brand_name'),
        func.count(func.distinct(AIResponse.id)).label('total_responses'),
        func.count(func.distinct(Mention.id)).label('mentions'),
        func.round(func.cast(func.avg(Mention.position), Numeric), 2).label('avg_position'),
        func.round(func.cast(func.avg(Mention.sentiment_score), Numeric), 1).label('avg_sentiment'),
        func.count(func.distinct(
            case((Mention.is_recommended == True, Mention.id), else_=None)
        )).label('recommended_count'),
        func.round(
            func.cast(
                (func.cast(func.count(func.distinct(Mention.id)), Float) / 
                func.nullif(func.count(func.distinct(AIResponse.id)), 0) * 100), 
                Numeric
            ), 
            1
        ).label('visibility_pct')
    ).select_from(AIResponse) \
    .join(Prompt, AIResponse.prompt_id == Prompt.id) \
    .outerjoin(Mention, AIResponse.id == Mention.response_id) \
    .outerjoin(Brand, Mention.brand_id == Brand.id) \
    .filter(
        Prompt.project_id == project_id,
        AIResponse.status == 'success'
    ).group_by(AIResponse.platform, Brand.name) \
    .order_by(AIResponse.platform, func.count(func.distinct(Mention.id)).desc())
    
    results = query.all()
    
    breakdown = []
    for row in results:
        breakdown.append(PlatformBrandBreakdown(
            platform=row.platform,
            brand_name=row.brand_name or "Unknown",
            total_responses=row.total_responses,
            mentions=row.mentions,
            avg_position=float(row.avg_position) if row.avg_position else None,
            avg_sentiment=float(row.avg_sentiment) if row.avg_sentiment else None,
            recommended_count=row.recommended_count,
            visibility_pct=float(row.visibility_pct) if row.visibility_pct else 0.0
        ))
    
    return breakdown


@router.post("/projects/{project_id}/prompts/create", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    project_id: UUID,
    prompt_data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a custom prompt"""
    
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
    
    # Create prompt
    prompt = Prompt(
        project_id=project_id,
        text=prompt_data.text,
        category=prompt_data.category,
        intent_type=prompt_data.intent_type,
        source="custom"  # Mark as user-created
    )
    
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    
    return PromptResponse(
        id=prompt.id,
        project_id=prompt.project_id,
        text=prompt.text,
        category=prompt.category,
        intent_type=prompt.intent_type,
        source=prompt.source,
        created_at=prompt.created_at,
        response_count=0,
        mentioned_count=0
    )


@router.patch("/prompts/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: UUID,
    prompt_data: PromptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a prompt"""
    
    prompt = db.query(Prompt).join(Project).filter(
        Prompt.id == prompt_id,
        Project.user_id == current_user.id
    ).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Only allow editing custom prompts
    if prompt.source != "custom":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit generated prompts"
        )
    
    # Update fields
    update_data = prompt_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prompt, field, value)
    
    db.commit()
    db.refresh(prompt)
    
    # Get response count
    response_count = db.query(AIResponse).filter(
        AIResponse.prompt_id == prompt.id,
        AIResponse.status == "success"
    ).count()
    
    return PromptResponse(
        id=prompt.id,
        project_id=prompt.project_id,
        text=prompt.text,
        category=prompt.category,
        intent_type=prompt.intent_type,
        source=prompt.source,
        created_at=prompt.created_at,
        response_count=response_count,
        mentioned_count=0
    )


@router.delete("/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a prompt"""
    
    prompt = db.query(Prompt).join(Project).filter(
        Prompt.id == prompt_id,
        Project.user_id == current_user.id
    ).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    db.delete(prompt)
    db.commit()
    
    return None


@router.post("/projects/{project_id}/prompts/regenerate")
async def regenerate_prompts(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate prompts using current distribution settings"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Delete old generated prompts (keep custom ones)
    deleted_count = db.query(Prompt).filter(
        Prompt.project_id == project_id,
        Prompt.source == "generated"
    ).delete()
    
    # Generate new prompts using current distribution
    from app.services.prompt_generator import generate_prompts
    
    brand_names = [b.name for b in project.brands]
    prompts_data = generate_prompts(
        category=project.category,
        brands=brand_names,
        count=40,
        distribution=project.prompt_distribution  # Use saved distribution
    )
    
    # Save to database
    for p_data in prompts_data:
        prompt = Prompt(
            project_id=project_id,
            text=p_data["text"],
            category=p_data["category"],
            intent_type=p_data.get("intent_type"),
            source="generated"
        )
        db.add(prompt)
    
    db.commit()
    
    return {
        "message": "Prompts regenerated successfully",
        "deleted_count": deleted_count,
        "generated_count": len(prompts_data)
    }


@router.post("/projects/{project_id}/prompts/complete-setup")
async def complete_prompt_setup(
    project_id: UUID,
    setup: PromptSetupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete the prompt setup wizard.
    - Keeps only approved prompts
    - Updates edited prompts
    - Creates custom prompts
    - Deletes rejected prompts
    """
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all generated prompts for this project
    all_generated = db.query(Prompt).filter(
        Prompt.project_id == project_id,
        Prompt.source == "generated"
    ).all()
    
    approved_ids_set = set(setup.approved_prompt_ids)
    deleted_count = 0
    updated_count = 0
    
    # Process generated prompts
    for prompt in all_generated:
        if prompt.id in approved_ids_set:
            # Check if it needs editing
            if prompt.id in setup.edited_prompts:
                prompt.text = setup.edited_prompts[prompt.id]
                updated_count += 1
        else:
            # Not approved = delete
            db.delete(prompt)
            deleted_count += 1
    
    # Create custom prompts
    created_count = 0
    for custom in setup.custom_prompts:
        prompt = Prompt(
            project_id=project_id,
            text=custom.text,
            category=custom.category,
            intent_type=custom.intent_type,
            source="custom"
        )
        db.add(prompt)
        created_count += 1
    
    db.commit()
    
    # Count final prompts
    final_count = db.query(Prompt).filter(
        Prompt.project_id == project_id
    ).count()
    
    return {
        "message": "Prompt setup completed successfully",
        "approved_count": len(approved_ids_set),
        "edited_count": updated_count,
        "deleted_count": deleted_count,
        "created_count": created_count,
        "final_count": final_count
    }

