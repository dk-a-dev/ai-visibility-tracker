# AI Visibility Tracker

Track your brand's visibility across AI platforms (ChatGPT, Claude, Gemini, Perplexity) and understand how AI models recommend you compared to competitors.

## What It Does

- **AI Visibility Tracking:** See how often your brand gets mentioned across 4 AI platforms
- **Competitor Analysis:** Compare your visibility against competitors
- **Citation Tracking:** Monitor which sources AI models cite
- **Multi-Platform:** Test across ChatGPT, Claude, Gemini, and Perplexity
- **Prompt Management:** Configure 15+ prompts with strategies (balanced, competitive, etc.)
- **Metrics Dashboard:** Visualize visibility scores, market share, sentiment, and more

## Architecture

### Tech Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Celery
- **Workers:** Celery + Redis (background job processing)
- **Database:** PostgreSQL 15
- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS, Shadcn/ui
- **AI Platforms:** OpenAI API, Anthropic API, Google Gemini API, Perplexity API

### System Design
```
Frontend (Next.js) → API (FastAPI) → Workers (Celery) → AI Platforms
                          ↓                    ↓
                    PostgreSQL            Redis Queue
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ and npm
- API Keys:
  - OpenAI API key ([Get one](https://platform.openai.com/api-keys))
  - Anthropic API key ([Get one](https://console.anthropic.com/))
  - Google Gemini API key ([Get one](https://ai.google.dev/))
  - Perplexity API key ([Get one](https://www.perplexity.ai/settings/api))

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-visibility-tracker.git
cd ai-visibility-tracker
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
PERPLEXITY_API_KEY=pplx-...
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

3. **Start the backend services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- FastAPI backend (port 8000)
- Celery worker (background jobs)
- Celery beat (scheduler)
- Flower monitoring (port 5555)

4. **Initialize the database**

The database tables are created automatically on first startup via `app/init_db.py`.

To verify tables were created:
```bash
docker-compose exec postgres psql -U postgres -d ai_visibility -c "\dt"
```

5. **Set up the frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

6. **Start the frontend**
```bash
npm run dev
```

7. **Access the application**
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Celery Flower:** http://localhost:5555

## Development Setup

### Backend (without Docker)

```bash
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
createdb ai_visibility
psql ai_visibility < ../database/schema.sql

# Initialize tables
python -m app.init_db

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Celery Worker (separate terminal)
```bash
cd backend
source venv/bin/activate
celery -A app.worker.celery_app worker --loglevel=info --concurrency=4
```

### Start Celery Beat (optional - for scheduled tasks)
```bash
cd backend
source venv/bin/activate
celery -A app.worker.celery_app beat --loglevel=info
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Usage Guide

### 1. Create Account & Project
1. Register at http://localhost:3000
2. Create a new project
3. Add your brand and competitor brands

### 2. Configure Prompts
The app provides a 3-step prompt configuration wizard:

**Step 1: Choose Strategy**
- Balanced (recommended)
- Startup Focus
- Competitive Analysis
- Feature-Rich
- Solution-Focused

**Step 2: Review & Edit**
- Review generated prompts
- Edit or reject any prompts
- Must have minimum 15 prompts

**Step 3: Add Custom Prompts**
- Add your own custom prompts
- Target specific use cases

### 3. Run Analysis
1. Click "Start Analysis" button
2. Worker processes prompts across all 4 AI platforms:
   - ChatGPT (OpenAI GPT-4)
   - Claude (Anthropic Claude 3)
   - Gemini (Google Gemini 2.5 Flash)
   - Perplexity (Sonar)
3. Real-time progress tracking
4. Results appear as they complete

### 4. View Results

**Dashboard Metrics:**
- **Visibility Score:** % of responses mentioning your brand (per platform)
- **Answers Mentioned:** Total mentions count
- **Average Position:** Typical ranking when mentioned
- **Market Share:** Your visibility vs competitors

**Analysis Views:**
- **Platform Breakdown:** Compare visibility across ChatGPT, Claude, Gemini, Perplexity
- **Brand Comparison:** Filter and compare specific brands
- **Response Details:** See exact AI responses and mentions

## Key Features

### Multi-Platform Tracking
- **ChatGPT:** OpenAI GPT-4 via official API
- **Claude:** Anthropic Claude 3 via official API  
- **Gemini:** Google Gemini 2.5 Flash via official API
- **Perplexity:** Sonar model via official API

### Rate Limiting
Built-in rate limiting per platform:
- OpenAI: 60 requests/minute
- Anthropic: 50 requests/minute
- Gemini: 30 requests/minute
- Perplexity: 30 requests/minute

### Prompt Strategies
Pre-configured prompt generation strategies:
- **Balanced:** Mix of direct, comparison, problem-solving (40%/30%/30%)
- **Startup:** Feature-focused for new products (50%/30%/20%)
- **Competitive:** Heavy comparison focus (30%/50%/20%)
- **Feature-Rich:** Showcase capabilities (60%/20%/20%)
- **Solution-Focused:** Problem-solving emphasis (25%/25%/50%)

### Metrics Calculation
```
Visibility Score = (Mentions / Total Responses) × 100
Market Share = (Your Visibility / Sum of All Visibilities) × 100
Average Position = Sum(Positions) / Total Mentions
Sentiment = (Positive Mentions / Total Mentions) × 100
```

## Database Schema

Main tables:
- `users` - User accounts
- `projects` - Tracking campaigns
- `brands` - Brands being tracked
- `prompts` - Generated/custom prompts
- `ai_responses` - Raw AI responses
- `mentions` - Extracted brand mentions
- `citations` - Source URLs cited by AI
- `metrics_cache` - Pre-calculated metrics

See [database/schema.sql](./database/schema.sql) for complete schema.

## Configuration

### Environment Variables

**Backend (.env):**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_visibility

# Redis
REDIS_URL=redis://redis:6379/0

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
PERPLEXITY_API_KEY=pplx-...

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Optional: AI Models
GEMINI_MODEL=gemini-2.5-flash
PERPLEXITY_MODEL=sonar

# Optional: Rate Limits (requests per minute)
OPENAI_RPM=60
ANTHROPIC_RPM=50
GEMINI_RPM=30
PERPLEXITY_RPM=30
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Worker Concurrency
Adjust based on your API rate limits:
```bash
# High concurrency (requires higher rate limits)
celery -A app.worker.celery_app worker --concurrency=10

# Conservative (default)
celery -A app.worker.celery_app worker --concurrency=4
```

## Testing

```bash
cd backend
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

## Project Structure

```
ai-visibility-tracker/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── projects.py   # Project management
│   │   │   ├── dashboard.py  # Dashboard data
│   │   │   └── analysis.py   # Analysis & prompts
│   │   ├── core/             # Core functionality
│   │   │   ├── config.py     # Settings
│   │   │   ├── security.py   # JWT auth
│   │   │   └── database.py   # DB connection
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic
│   │   │   ├── ai_service.py         # AI platform integrations
│   │   │   ├── analysis_service.py   # Response analysis
│   │   │   └── prompt_generator.py   # Prompt generation
│   │   ├── workers/          # Background jobs
│   │   │   └── tasks.py      # Celery tasks
│   │   ├── worker.py         # Celery config
│   │   ├── init_db.py        # Database initialization
│   │   └── main.py           # FastAPI app entry
│   ├── migrations/           # SQL migrations
│   ├── requirements.txt
│   ├── Dockerfile            # API container
│   └── Dockerfile.worker     # Worker container
├── frontend/
│   ├── app/                  # Next.js 14 app router
│   │   ├── auth/             # Login/register pages
│   │   ├── dashboard/        # Main dashboard
│   │   └── layout.tsx
│   ├── components/           # React components
│   │   ├── analysis/         # Analysis views
│   │   ├── brands/           # Brand management
│   │   ├── dashboard/        # Dashboard cards
│   │   ├── prompts/          # Prompt wizard
│   │   └── ui/               # Shadcn/ui components
│   ├── lib/                  # Utilities
│   ├── services/             # API client
│   ├── store/                # Zustand state management
│   ├── hooks/                # Custom React hooks
│   ├── package.json
│   └── next.config.ts
├── database/
│   └── schema.sql            # PostgreSQL schema
├── docker-compose.yml        # Local dev environment
├── ARCHITECTURE.md           # Technical documentation
├── DEPLOYMENT.md             # Production deployment guide
└── README.md                 # This file
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment guide covering:
- Render (API + Worker + PostgreSQL)
- Redis Cloud
- Vercel (Frontend)
- Environment configuration
- Database migrations

### Quick Deploy Summary

1. **Database:** Create PostgreSQL on Render
2. **Redis:** Create free instance on Redis Cloud
3. **Backend API:** Deploy with Dockerfile on Render
4. **Worker:** Deploy with Dockerfile.worker on Render
5. **Frontend:** Deploy to Vercel with API URL configured

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose logs api

# Verify database connection
docker-compose exec api python -c "from app.core.database import engine; print(engine.url)"
```

### Worker not processing jobs
```bash
# Check worker logs
docker-compose logs worker

# Verify Redis connection
docker-compose exec worker python -c "from app.core.config import settings; print(settings.REDIS_URL)"

# Check Flower monitoring
open http://localhost:5555
```

### Database tables not created
```bash
# Manually initialize database
docker-compose exec api python -m app.init_db

# Or run SQL directly
docker-compose exec postgres psql -U postgres -d ai_visibility -f /docker-entrypoint-initdb.d/schema.sql
```


### Frontend API connection issues
- Verify `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Check CORS settings in backend/app/core/config.py
- Ensure backend is running: `curl http://localhost:8000`

### Rate limit errors (429)
- Check your API tier limits
- Reduce worker concurrency
- Adjust RPM limits in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Frontend powered by [Next.js](https://nextjs.org/) and [Shadcn/ui](https://ui.shadcn.com/)
- Background processing with [Celery](https://docs.celeryproject.org/)

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup

---

**Made for understanding AI visibility**
- GitHub: [@yourusername]
- Email: your.email@example.com

---

**Note:** This project was built in 3-4 hours as part of Writesonic's Fullstack Engineer Challenge. Focus was on demonstrating product thinking, clean architecture, and production-ready practices within time constraints.
