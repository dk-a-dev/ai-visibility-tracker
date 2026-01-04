from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.brand import Brand
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate, ProjectListResponse
from app.schemas.project import BrandResponse

router = APIRouter()


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project"""
    
    # Create project
    project = Project(
        user_id=current_user.id,
        name=project_data.name,
        category=project_data.category,
        description=project_data.description,
        industry=project_data.industry,
        company_size=project_data.company_size,
        target_audience=project_data.target_audience,
        primary_goals=project_data.primary_goals,
        prompt_distribution=project_data.prompt_distribution,  # Custom prompt strategy
        status="active"
    )
    
    db.add(project)
    db.flush()  # Get project.id
    
    # Create brands
    for brand_data in project_data.brands:
        brand = Brand(
            project_id=project.id,
            name=brand_data.name,
            website=brand_data.website,
            description=brand_data.description,
            is_primary=brand_data.is_primary
        )
        db.add(brand)
    
    db.commit()
    db.refresh(project)
    
    # Trigger prompt generation and analysis (Celery task)
    from app.workers.tasks import start_analysis_pipeline
    start_analysis_pipeline.delay(str(project.id))
    
    return ProjectResponse.model_validate(project)


@router.get("", response_model=List[ProjectListResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all projects for the current user"""
    
    projects = db.query(Project).filter(
        Project.user_id == current_user.id
    ).order_by(Project.created_at.desc()).all()
    
    result = []
    for project in projects:
        result.append(ProjectListResponse(
            id=project.id,
            name=project.name,
            category=project.category,
            status=project.status,
            created_at=project.created_at,
            brand_count=len(project.brands)
        ))
    
    return result


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    
    return None


@router.get("/{project_id}/brands", response_model=List[BrandResponse])
async def get_project_brands(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all brands for a project"""
    
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return [BrandResponse.model_validate(brand) for brand in project.brands]
