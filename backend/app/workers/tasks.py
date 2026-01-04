"""Celery tasks for background processing"""
import asyncio
from datetime import datetime
from uuid import UUID
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from celery import group, chord

from app.worker import celery_app
from app.core.database import SessionLocal
from app.models.project import Project
from app.models.brand import Brand
from app.models.prompt import Prompt
from app.models.ai_response import AIResponse
from app.models.mention import Mention
from app.models.citation import Citation
from app.models.metrics import MetricsCache
from app.models.analysis_job import AnalysisJob
from app.services.prompt_generator import generate_prompts
from app.services.ai_service import ai_service
from app.services.analysis_service import analysis_service


@celery_app.task(name="start_analysis_pipeline")
def start_analysis_pipeline(project_id: str):
    """
    Start the complete analysis pipeline for a project
    
    Pipeline:
    1. Generate prompts
    2. Query AI platforms for each prompt
    3. Analyze responses for mentions and citations
    4. Calculate metrics
    """
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"error": "Project not found"}
        
        # Create analysis job
        job = AnalysisJob(
            project_id=project_id,
            status="running",
            job_type="full_analysis",
            started_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Step 1: Generate prompts
        generate_prompts_task.delay(project_id, str(job.id))
        
        return {"status": "started", "job_id": str(job.id)}
    
    finally:
        db.close()


@celery_app.task(name="generate_prompts_task")
def generate_prompts_task(project_id: str, job_id: str):
    """Generate prompts for a project"""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"error": "Project not found"}
        
        # Get brand names
        brands = db.query(Brand).filter(Brand.project_id == project_id).all()
        brand_names = [b.name for b in brands]
        
        # Generate prompts with custom distribution if provided
        prompt_data_list = generate_prompts(
            category=project.category,
            brands=brand_names,
            count=40,
            distribution=project.prompt_distribution  # Use custom strategy if set
        )
        
        # Save prompts
        prompt_ids = []
        for prompt_data in prompt_data_list:
            prompt = Prompt(
                project_id=project_id,
                text=prompt_data['text'],
                category=prompt_data['category'],
                intent_type=prompt_data['intent_type'],
                source="generated"
            )
            db.add(prompt)
            db.flush()
            prompt_ids.append(str(prompt.id))
        
        db.commit()
        
        # Update job
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.total_tasks = len(prompt_ids)
            db.commit()
        
        # Step 2: Query AI platforms for each prompt
        # Use Celery group to process prompts in parallel
        query_tasks = group(
            query_ai_platforms_task.s(prompt_id, project_id, job_id)
            for prompt_id in prompt_ids
        )
        
        # Use chord to calculate metrics after all queries complete
        chord(query_tasks)(calculate_all_metrics_task.s(project_id, job_id))
        
        return {"status": "prompts_generated", "count": len(prompt_ids)}
    
    except Exception as e:
        # Update job status
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
        raise
    
    finally:
        db.close()


@celery_app.task(name="query_ai_platforms_task")
def query_ai_platforms_task(prompt_id: str, project_id: str, job_id: str):
    """Query AI platforms for a single prompt"""
    db = SessionLocal()
    try:
        prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if not prompt:
            return {"error": "Prompt not found"}
        
        # Query all platforms
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        responses = loop.run_until_complete(
            ai_service.query_all_platforms(prompt.text)
        )
        loop.close()
        
        # Save responses and their metadata (including citations from Gemini)
        response_ids = []
        response_metadata = {}  # Store citations data
        for response_data in responses:
            ai_response = AIResponse(
                prompt_id=prompt_id,
                platform=response_data['platform'],
                model=response_data['model'],
                response_text=response_data['response_text'],
                response_time_ms=response_data['response_time_ms'],
                tokens_used=response_data['tokens_used'],
                status=response_data['status'],
                error_message=response_data.get('error_message')
            )
            db.add(ai_response)
            db.flush()
            response_ids.append(str(ai_response.id))
            
            # Store citations from Gemini's grounding metadata
            if response_data.get('citations'):
                response_metadata[str(ai_response.id)] = {
                    'grounding_citations': response_data['citations']
                }
        
        db.commit()
        
        # Step 3: Analyze each response, passing metadata
        for response_id in response_ids:
            metadata = response_metadata.get(response_id, {})
            analyze_response_task.delay(response_id, project_id, metadata)
        
        # Update job progress
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.completed_tasks += 1
            db.commit()
        
        return {"status": "completed", "response_count": len(response_ids)}
    
    except Exception as e:
        # Update job
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.failed_tasks += 1
            db.commit()
        raise
    
    finally:
        db.close()


@celery_app.task(name="analyze_response_task")
def analyze_response_task(response_id: str, project_id: str, metadata: dict = None):
    """Analyze a single AI response for mentions and citations"""
    db = SessionLocal()
    try:
        response = db.query(AIResponse).filter(AIResponse.id == response_id).first()
        if not response or response.status != "success":
            return {"error": "Response not found or failed"}
        
        # Get brands for this project
        brands = db.query(Brand).filter(Brand.project_id == project_id).all()
        brand_dicts = [
            {
                'id': str(b.id),
                'name': b.name,
                'website': b.website
            }
            for b in brands
        ]
        
        # Extract mentions
        mentions = analysis_service.extract_brand_mentions(
            response.response_text,
            brand_dicts
        )
        
        # Save mentions
        for mention_data in mentions:
            mention = Mention(
                response_id=response_id,
                brand_id=mention_data['brand_id'],
                position=mention_data['position'],
                context=mention_data['context'],
                sentiment=mention_data['sentiment'],
                sentiment_score=mention_data['sentiment_score'],
                is_recommended=mention_data['is_recommended']
            )
            db.add(mention)
        
        # Extract citations from response text
        citations = analysis_service.extract_citations(
            response.response_text,
            brand_dicts
        )
        
        # Add grounding citations from Gemini if available
        if metadata and metadata.get('grounding_citations'):
            for grounding_cite in metadata['grounding_citations']:
                # Check if already exists
                if not any(c['url'] == grounding_cite['url'] for c in citations):
                    # Match to brand if applicable
                    is_brand_owned = False
                    brand_id = None
                    cite_domain = urlparse(grounding_cite['url']).netloc
                    
                    for brand in brand_dicts:
                        if brand.get('website'):
                            brand_domain = urlparse(brand['website']).netloc
                            if cite_domain == brand_domain or cite_domain.endswith('.' + brand_domain):
                                is_brand_owned = True
                                brand_id = brand['id']
                                break
                    
                    citations.append({
                        'url': grounding_cite['url'],
                        'domain': cite_domain,
                        'position': len(citations) + 1,
                        'is_brand_owned': is_brand_owned,
                        'brand_id': brand_id
                    })
        
        # Save citations
        for citation_data in citations:
            citation = Citation(
                response_id=response_id,
                url=citation_data['url'],
                domain=citation_data['domain'],
                position=citation_data['position'],
                is_brand_owned=citation_data['is_brand_owned'],
                brand_id=citation_data['brand_id']
            )
            db.add(citation)
        
        db.commit()
        
        return {
            "status": "completed",
            "mentions": len(mentions),
            "citations": len(citations)
        }
    
    finally:
        db.close()


@celery_app.task(name="calculate_all_metrics_task")
def calculate_all_metrics_task(results, project_id: str, job_id: str):
    """Calculate metrics for all brands in a project"""
    db = SessionLocal()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"error": "Project not found"}
        
        brands = db.query(Brand).filter(Brand.project_id == project_id).all()
        
        # Get total responses for this project
        total_responses = db.query(AIResponse).join(
            Prompt, AIResponse.prompt_id == Prompt.id
        ).filter(
            Prompt.project_id == project_id,
            AIResponse.status == "success"
        ).count()
        
        # Calculate metrics for each brand
        for brand in brands:
            calculate_brand_metrics_task.delay(str(brand.id), project_id, total_responses)
        
        # Update job
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            db.commit()
        
        return {"status": "metrics_calculation_started"}
    
    finally:
        db.close()


@celery_app.task(name="calculate_brand_metrics_task")
def calculate_brand_metrics_task(brand_id: str, project_id: str, total_responses: int):
    """Calculate metrics for a single brand"""
    db = SessionLocal()
    try:
        brand = db.query(Brand).filter(Brand.id == brand_id).first()
        if not brand:
            return {"error": "Brand not found"}
        
        # Get all mentions for this brand
        mentions = db.query(Mention).join(
            AIResponse, Mention.response_id == AIResponse.id
        ).join(
            Prompt, AIResponse.prompt_id == Prompt.id
        ).filter(
            Prompt.project_id == project_id,
            Mention.brand_id == brand_id
        ).all()
        
        mention_dicts = [
            {
                'position': m.position,
                'sentiment': m.sentiment
            }
            for m in mentions
        ]
        
        # Calculate basic metrics
        metrics = analysis_service.calculate_metrics(mention_dicts, total_responses)
        
        # Platform-specific visibility
        for platform in ['chatgpt', 'claude', 'perplexity']:
            platform_responses = db.query(AIResponse).join(
                Prompt, AIResponse.prompt_id == Prompt.id
            ).filter(
                Prompt.project_id == project_id,
                AIResponse.platform == platform,
                AIResponse.status == "success"
            ).count()
            
            if platform_responses > 0:
                platform_mentions = db.query(Mention).join(
                    AIResponse, Mention.response_id == AIResponse.id
                ).join(
                    Prompt, AIResponse.prompt_id == Prompt.id
                ).filter(
                    Prompt.project_id == project_id,
                    AIResponse.platform == platform,
                    Mention.brand_id == brand_id
                ).count()
                
                platform_visibility = (platform_mentions / platform_responses) * 100
                metrics[f'{platform}_visibility'] = round(platform_visibility, 2)
        
        # Citation metrics
        total_citations = db.query(Citation).join(
            AIResponse, Citation.response_id == AIResponse.id
        ).join(
            Prompt, AIResponse.prompt_id == Prompt.id
        ).filter(
            Prompt.project_id == project_id,
            Citation.brand_id == brand_id
        ).count()
        
        unique_domains = db.query(Citation.domain).join(
            AIResponse, Citation.response_id == AIResponse.id
        ).join(
            Prompt, AIResponse.prompt_id == Prompt.id
        ).filter(
            Prompt.project_id == project_id,
            Citation.brand_id == brand_id
        ).distinct().count()
        
        brand_owned_citations = db.query(Citation).join(
            AIResponse, Citation.response_id == AIResponse.id
        ).join(
            Prompt, AIResponse.prompt_id == Prompt.id
        ).filter(
            Prompt.project_id == project_id,
            Citation.brand_id == brand_id,
            Citation.is_brand_owned == True
        ).count()
        
        metrics['total_citations'] = total_citations
        metrics['unique_domains_cited'] = unique_domains
        metrics['brand_owned_citations'] = brand_owned_citations
        
        # Calculate market share
        all_brands = db.query(Brand).filter(Brand.project_id == project_id).all()
        total_visibility = 0
        for b in all_brands:
            b_mentions = db.query(Mention).join(
                AIResponse, Mention.response_id == AIResponse.id
            ).join(
                Prompt, AIResponse.prompt_id == Prompt.id
            ).filter(
                Prompt.project_id == project_id,
                Mention.brand_id == b.id
            ).count()
            b_visibility = (b_mentions / total_responses * 100) if total_responses > 0 else 0
            total_visibility += b_visibility
        
        if total_visibility > 0:
            market_share = (metrics['visibility_score'] / total_visibility) * 100
            metrics['market_share'] = round(market_share, 2)
        
        # Save or update metrics cache
        cache = db.query(MetricsCache).filter(
            MetricsCache.project_id == project_id,
            MetricsCache.brand_id == brand_id
        ).first()
        
        if cache:
            # Update existing
            for key, value in metrics.items():
                setattr(cache, key, value)
            cache.calculated_at = datetime.utcnow()
        else:
            # Create new
            cache = MetricsCache(
                project_id=project_id,
                brand_id=brand_id,
                **metrics,
                calculated_at=datetime.utcnow()
            )
            db.add(cache)
        
        db.commit()
        
        return {"status": "completed", "brand_id": brand_id}
    
    finally:
        db.close()
