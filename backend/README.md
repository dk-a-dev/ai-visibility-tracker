# AI Visibility Tracker - Backend

FastAPI backend with Celery workers for AI visibility tracking across multiple platforms.

## Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- API keys for AI platforms

### Setup

1. **Configure environment variables**

From the project root directory:
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
PERPLEXITY_API_KEY=pplx-...
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

2. **Start all services**

From the project root:
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- FastAPI API server (port 8000)
- Celery worker (background jobs)
- Celery beat (scheduler)
- Flower monitoring (port 5555)

3. **Verify services are running**
```bash
docker-compose ps
```

4. **Check logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
```

5. **Access services**
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Celery Flower: http://localhost:5555

## Common Docker Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### Restart a specific service
```bash
docker-compose restart api
docker-compose restart worker
```

### View logs
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f api
docker-compose logs -f worker

# Last 100 lines
docker-compose logs --tail=100 api
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Database operations
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d ai_visibility

# List tables
docker-compose exec postgres psql -U postgres -d ai_visibility -c "\dt"

# Run migrations
docker-compose exec api python -m app.init_db
```

### Redis operations
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Check Redis keys
docker-compose exec redis redis-cli KEYS "*"

# Monitor Redis
docker-compose exec redis redis-cli MONITOR
```

## Architecture

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py       # Authentication
│   │   ├── projects.py   # Project CRUD
│   │   ├── dashboard.py  # Dashboard metrics
│   │   └── analysis.py   # Prompts, mentions, citations
│   ├── core/             # Core utilities
│   │   ├── config.py     # Settings
│   │   ├── database.py   # Database connection
│   │   └── security.py   # JWT & password hashing
│   ├── models/           # SQLAlchemy models
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── brand.py
│   │   ├── prompt.py
│   │   ├── ai_response.py
│   │   ├── mention.py
│   │   ├── citation.py
│   │   ├── metrics.py
│   │   └── analysis_job.py
│   ├── schemas/          # Pydantic schemas
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── metrics.py
│   │   └── analysis.py
│   ├── services/         # Business logic
│   │   ├── prompt_generator.py  # Template-based prompt generation
│   │   ├── ai_service.py        # OpenAI & Anthropic integration
│   │   └── analysis_service.py  # Mention & sentiment extraction
│   ├── workers/          # Celery tasks
│   │   └── tasks.py      # Background processing
│   ├── main.py           # FastAPI application
│   └── worker.py         # Celery configuration
├── scripts/
│   ├── init_db.py        # Database initialization
│   └── test_setup.py     # Setup verification
└── requirements.txt
```

## Development Setup (Without Docker)

### Prerequisites
- Python 3.11
- PostgreSQL 15
- Redis

### 1. Set up virtual environment

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment variables

From project root, copy and edit `.env`:

```bash
cp ../.env.example ../.env
```

Edit with your settings:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_visibility

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=your-super-secret-key-change-this

# AI Platform APIs (required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
PERPLEXITY_API_KEY=pplx-...
```

### 3. Initialize database

```bash
# Create database
createdb ai_visibility

# Load schema
psql ai_visibility < ../database/schema.sql

# Initialize tables
python -m app.init_db
```

### 4. Start the API server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at:
- API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 5. Start Celery worker (separate terminal)

```bash
cd backend
source venv/bin/activate
celery -A app.worker.celery_app worker --loglevel=info --concurrency=4
```

### 6. (Optional) Start Celery beat (separate terminal)

```bash
cd backend
source venv/bin/activate
celery -A app.worker.celery_app beat --loglevel=info
```

### 7. (Optional) Start Flower for monitoring

```bash
celery -A app.worker.celery_app flower --port=5555
```

Visit http://localhost:5555 to monitor workers.

## API Endpoints

### Authentication

```
POST   /api/auth/register   - Register new user
POST   /api/auth/login      - Login user
GET    /api/auth/me         - Get current user
```

### Projects

```
POST   /api/projects        - Create project (triggers analysis)
GET    /api/projects        - List user's projects
GET    /api/projects/{id}   - Get project details
PATCH  /api/projects/{id}   - Update project
DELETE /api/projects/{id}   - Delete project
GET    /api/projects/{id}/brands - Get project brands
```

### Dashboard

```
GET    /api/dashboard/{project_id}?brand_id={id}
       - Get dashboard data (with competitor impersonation)
```

### Analysis

```
POST   /api/analysis/projects/{id}/analyze
       - Trigger new analysis
GET    /api/analysis/projects/{id}/prompts
       - Get prompts (filter by mentioned/not mentioned)
GET    /api/analysis/projects/{id}/mentions
       - Get brand mentions
GET    /api/analysis/projects/{id}/citations
       - Get citations
GET    /api/analysis/projects/{id}/jobs
       - Get analysis job status
```

## 🔧 How It Works

### 1. Project Creation

When a user creates a project:

1. Project and brands are saved to database
2. Celery task `start_analysis_pipeline` is triggered
3. Returns immediately with job ID

### 2. Analysis Pipeline

The pipeline runs in background:

```
1. Generate Prompts (template-based)
   └─ 40 prompts across different categories
      
2. Query AI Platforms (parallel)
   ├─ ChatGPT (via OpenAI API)
   └─ Claude (via Anthropic API)
   
3. Analyze Responses (parallel)
   ├─ Extract brand mentions
   ├─ Determine position (1st, 2nd, 3rd)
   ├─ Analyze sentiment
   └─ Extract citations
   
4. Calculate Metrics
   ├─ Visibility score
   ├─ Average position
   ├─ Sentiment score
   ├─ Market share
   └─ Platform-specific visibility
```

### 3. Prompt Generation

Uses 50+ templates across categories:

- **Informational** (35%): "What are the best {category}?"
- **Comparison** (30%): "{brand1} vs {brand2} for {use_case}"
- **Problem-solving** (20%): "How to solve {problem} with {category}?"
- **Feature-specific** (15%): "Which {category} has {feature}?"

### 4. Mention Extraction

```python
# For each brand:
1. Find brand name in response (case-insensitive, word boundaries)
2. Extract position based on location (1st third = 1, etc.)
3. Get context (±100 chars around mention)
4. Analyze sentiment:
   - Count positive keywords (best, excellent, recommended...)
   - Count negative keywords (limited, expensive, complex...)
   - Calculate score: (positive - negative) / total
5. Check if explicitly recommended
```

### 5. Sentiment Analysis

Simple keyword-based approach:

```python
Positive keywords: best, excellent, top, recommended, etc.
Negative keywords: limited, expensive, complex, etc.

Sentiment score = (positive_count - negative_count) / total_keywords
Sentiment label:
  > 0.2  = positive
  < -0.2 = negative
  else   = neutral
```

### 6. Metrics Calculation

```python
Visibility Score = (Mentions / Total Responses) × 100
Market Share = (Your Visibility / Sum All Visibility) × 100
Average Position = Sum(Positions) / Total Mentions
Sentiment Score = (Positive Mentions / Total Mentions) × 100
```

## 🗄️ Database Schema

Key tables:

- `users` - User accounts
- `projects` - Tracking campaigns
- `brands` - Brands being tracked (primary + competitors)
- `prompts` - Generated/custom prompts
- `ai_responses` - Raw AI responses
- `mentions` - Brand mentions with sentiment
- `citations` - Source URLs cited
- `metrics_cache` - Pre-calculated metrics
- `analysis_jobs` - Job progress tracking

## 🧪 Testing

Run the test suite:

```bash
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

## 🐛 Debugging

### Check if services are running

```bash
# PostgreSQL
psql -U postgres -c "SELECT version();"

# Redis
redis-cli ping

# API
curl http://localhost:8000/health
```

### View Celery tasks

```bash
celery -A app.worker.celery_app inspect active
celery -A app.worker.celery_app inspect stats
```

### Database reset

```bash
python scripts/init_db.py reset
```

### Check logs

```bash
# API logs (if running with uvicorn)
tail -f logs/api.log

# Celery worker logs
celery -A app.worker.celery_app worker --loglevel=debug
```

## 📦 Dependencies

### Core
- FastAPI - API framework
- Uvicorn - ASGI server
- SQLAlchemy - ORM
- Pydantic - Data validation

### Database
- PostgreSQL (via asyncpg, psycopg2)
- Redis (for Celery & caching)

### Workers
- Celery - Task queue
- Flower - Worker monitoring

### AI Platforms
- OpenAI - ChatGPT API
- Anthropic - Claude API

### Authentication
- python-jose - JWT
- passlib - Password hashing

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- API keys encrypted in database
- CORS configured
- Input validation with Pydantic
- SQL injection protection via SQLAlchemy

## ⚡ Performance

### Rate Limiting
- OpenAI: 60 req/min (configurable)
- Anthropic: 50 req/min (configurable)
- Automatic exponential backoff on errors

### Caching
- Dashboard metrics: 5 min TTL
- Prompts list: 1 hour TTL
- Calculated metrics: Until new analysis

### Optimization
- Parallel prompt processing with Celery groups
- Batch database operations
- Database indexes on foreign keys
- Connection pooling (10 connections, 20 overflow)

## 🚢 Production Deployment

### Environment Variables

Set these in production:

```env
ENVIRONMENT=production
DEBUG=False
JWT_SECRET=<long-random-string>
DATABASE_URL=<production-postgres-url>
REDIS_URL=<production-redis-url>
OPENAI_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
```

### Run with Gunicorn

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Scale Celery Workers

```bash
# Start multiple workers
celery -A app.worker.celery_app worker --concurrency=10 --pool=prefork
```

## 🤝 Contributing

1. Keep business logic in `services/`
2. Keep database operations in models
3. Keep validation in schemas
4. Keep routing in `api/`
5. Use type hints everywhere
6. Write docstrings
7. Test before committing

## 📝 License

MIT
