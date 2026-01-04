# AI Visibility Tracker

Track your brand's visibility across AI platforms (ChatGPT, Claude, Perplexity) and understand how AI models recommend you compared to competitors.

## 📋 What It Does

- **AI Visibility Tracking:** See how often your brand gets mentioned by AI platforms
- **Competitor Analysis:** Compare your visibility against competitors
- **Citation Tracking:** Monitor which sources AI models cite
- **Multi-Platform:** Test across ChatGPT, Claude, and Perplexity
- **Metrics Dashboard:** Visualize visibility scores, market share, sentiment, and more

## 🏗️ Architecture

### Tech Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy
- **Workers:** Celery + Redis
- **Database:** PostgreSQL 15
- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **AI Platforms:** OpenAI API, Anthropic API
- **Bonus:** Playwright for ChatGPT web scraping

### System Design
```
Frontend (Next.js) → API (FastAPI) → Workers (Celery) → AI Platforms
                          ↓                    ↓
                    PostgreSQL            Redis Queue
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ai-visibility-tracker
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

3. **Start the application**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Celery Flower: http://localhost:5555

### Without Docker (Local Development)

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up database
createdb ai_visibility
psql ai_visibility < ../database/schema.sql

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload

# In another terminal, start Celery worker
celery -A app.worker.celery_app worker --loglevel=info
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📖 Usage Guide

### 1. Onboarding
1. Create an account
2. Fill out the onboarding survey:
   - Company name and category (e.g., "CRM Software")
   - List of brands to track (your brand + competitors)
   - Target audience and goals

### 2. Analysis Process
1. System generates 30-50 relevant prompts based on your category
2. Prompts are queried across AI platforms (ChatGPT, Claude)
3. Responses are analyzed for brand mentions
4. Citations are extracted and categorized
5. Metrics are calculated and displayed

### 3. Dashboard Overview

**Key Metrics:**
- **Visibility Score:** % of responses mentioning your brand
- **Answers Mentioned:** Total count of mentions
- **Average Position:** Your typical ranking (1st, 2nd, 3rd)
- **Sentiment Score:** % of positive mentions
- **Market Share:** Your visibility vs all tracked brands

**Views:**
- **Leaderboard:** Compare all tracked brands
- **Prompts:** See which queries mention you (or don't)
- **Citations:** Top cited domains and your cited pages
- **Competitor Mode (Bonus):** Switch to any competitor's view

## 🎯 Key Features

### Prompt Generation
- Template-based approach using proven patterns
- Covers multiple intent types:
  - Informational: "What are the best..."
  - Comparison: "X vs Y for..."
  - Problem-solving: "How to solve..."
  - Feature-specific: "Which tool has..."

### AI Platform Integration
- **OpenAI (ChatGPT):** Via official API
- **Anthropic (Claude):** Via official API
- **Web Scraping (Bonus):** Direct ChatGPT UI scraping for exact citations

### Metrics Calculation
```
Visibility Score = (Mentions / Total Responses) × 100
Market Share = (Your Visibility / Sum of All Visibilities) × 100
Average Position = Sum(Positions) / Total Mentions
Sentiment = (Positive Mentions / Total Mentions) × 100
```

## 📊 Database Schema

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

## 🔧 Configuration

### API Rate Limits
- OpenAI: 60 requests/min (Tier 1)
- Anthropic: 50 requests/min
- Configurable via environment variables

### Worker Concurrency
```bash
# Adjust based on your API limits
celery -A app.worker.celery_app worker --concurrency=10
```

### Caching Strategy
- Dashboard data: 5 min TTL
- Metrics: Cached until new analysis
- Prompts: 1 hour TTL

## 🧪 Testing

```bash
cd backend
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

## 📁 Project Structure

```
ai-visibility-tracker/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Config, security, database
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── workers/      # Celery tasks
│   │   └── main.py       # FastAPI app
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utils, API client
│   │   └── hooks/        # Custom hooks
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── schema.sql
├── docker-compose.yml
├── ARCHITECTURE.md
└── README.md
```

## 🚢 Deployment

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Vercel (Frontend) + Render (Backend)
- Frontend: Deploy to Vercel
- Backend + Workers: Deploy to Render
- Database: Railway PostgreSQL or Supabase
- Redis: Upstash

### Option 3: Docker on VPS
```bash
# On your server
docker-compose -f docker-compose.prod.yml up -d
```

## 🎨 Design Decisions

### Why Python over Node.js?
- Superior AI/ML ecosystem
- Better web scraping libraries
- More robust async processing with Celery
- Easier to implement future RAG features

### Why Celery + Redis?
- Robust distributed task queue
- Retry logic and error handling
- Easy to scale workers independently
- Real-time progress tracking

### Why PostgreSQL?
- Complex relational data (projects, brands, mentions)
- JSONB support for flexible data
- Excellent indexing and performance
- Materialized views for metrics

### Why Template-Based Prompts?
- Fast and predictable (no API calls for generation)
- Based on proven patterns from Writesonic research
- Easy to customize and extend
- Sufficient for MVP timeframe

## 🔮 Future Improvements

### Short Term
- [ ] More AI platforms (Gemini, Perplexity)
- [ ] Historical trend tracking
- [ ] Email reports
- [ ] Custom prompt builder
- [ ] Export reports (PDF, CSV)

### Long Term
- [ ] ML-based prompt generation using RAG
- [ ] Advanced sentiment analysis with NLP models
- [ ] Automated SEO recommendations
- [ ] Competitive intelligence alerts
- [ ] Integration with analytics tools
- [ ] Citation gap analysis with actionable insights
- [ ] A/B testing for content optimization

## 🐛 Known Limitations

1. **Rate Limits:** Free tier API keys have strict limits
2. **Web Scraping:** ChatGPT UI changes frequently
3. **Citation Extraction:** Not all AI platforms provide citations
4. **Real-time:** Analysis takes time (not instant)
5. **Cost:** API calls can get expensive at scale

## 🤝 Contributing

This is a challenge project, but suggestions are welcome!

## 📝 License

MIT

## 🙏 Acknowledgments

- Writesonic for the challenge and AI visibility insights
- OpenAI and Anthropic for their APIs
- The open-source community

## 📧 Contact

Built by [Your Name]
- GitHub: [@yourusername]
- Email: your.email@example.com

---

**Note:** This project was built in 3-4 hours as part of Writesonic's Fullstack Engineer Challenge. Focus was on demonstrating product thinking, clean architecture, and production-ready practices within time constraints.
