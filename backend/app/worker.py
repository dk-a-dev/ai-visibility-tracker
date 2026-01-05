"""Celery application configuration"""
import ssl
from celery import Celery
from app.core.config import settings

# Configure Redis SSL if using rediss://
redis_url = settings.REDIS_URL
broker_use_ssl = None
redis_backend_use_ssl = None

if redis_url.startswith('rediss://'):
    # Redis Cloud SSL configuration
    broker_use_ssl = {
        'ssl_cert_reqs': ssl.CERT_NONE
    }
    redis_backend_use_ssl = {
        'ssl_cert_reqs': ssl.CERT_NONE
    }

# Create Celery app
celery_app = Celery(
    "ai_visibility_tracker",
    broker=redis_url,
    backend=redis_url,
    include=['app.workers.tasks']
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    broker_use_ssl=broker_use_ssl,
    redis_backend_use_ssl=redis_backend_use_ssl,
)
