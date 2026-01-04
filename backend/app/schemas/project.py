from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class BrandBase(BaseModel):
    name: str
    website: Optional[str] = None
    description: Optional[str] = None
    is_primary: bool = False


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    target_audience: Optional[str] = None
    primary_goals: Optional[List[str]] = None
    
    # Prompt distribution strategy (optional customization based on brand goals)
    # Default: {"informational": 0.35, "comparison": 0.30, "problem_solving": 0.20, "feature": 0.15}
    # 
    # Strategies by brand type:
    # - Startup (awareness): {"informational": 0.50, "comparison": 0.20, "problem_solving": 0.20, "feature": 0.10}
    # - Competitive brand: {"informational": 0.25, "comparison": 0.45, "problem_solving": 0.20, "feature": 0.10}
    # - Feature-rich product: {"informational": 0.30, "comparison": 0.25, "problem_solving": 0.15, "feature": 0.30}
    # - Solution-focused: {"informational": 0.25, "comparison": 0.25, "problem_solving": 0.40, "feature": 0.10}
    prompt_distribution: Optional[dict] = None


class ProjectCreate(ProjectBase):
    brands: List[BrandCreate]


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(ProjectBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    brands: List[BrandResponse] = []
    
    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    id: UUID
    name: str
    category: str
    status: str
    created_at: datetime
    brand_count: int = 0
    
    class Config:
        from_attributes = True
