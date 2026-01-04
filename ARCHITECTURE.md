# AI Visibility Tracker - Technical Architecture

## Overview
A tool to track brand visibility across AI platforms (ChatGPT, Claude, Perplexity) by querying them with category-specific prompts and analyzing which brands get mentioned.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  - Onboarding Survey  - Dashboard  - Leaderboard  - Analytics   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────────────────┐
│                     API Server (FastAPI)                         │
│  - Authentication  - Project CRUD  - Metrics API  - Job Queue   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───┴────┐      ┌──────┴──────┐    ┌─────┴──────┐
│  DB    │      │   Redis     │    │  Workers   │
│PostGres│      │- Cache      │    │  (Celery)  │
│        │      │- Job Queue  │    │            │
└────────┘      └─────────────┘    └────────────┘
                                          │
                    ┌─────────────────────┼─────────────────┐
                    │                     │                 │
            ┌───────┴────────┐   ┌────────┴─────┐   ┌──────┴────────┐
            │ Prompt Generator│   │ AI Query     │   │ Web Scraper   │
            │ Worker          │   │ Worker       │   │ Worker        │
            └─────────────────┘   └──────────────┘   └───────────────┘
                                          │
                    ┌─────────────────────┼─────────────────┐
                    │                     │                 │
            ┌───────┴────────┐   ┌────────┴─────┐   ┌──────┴────────┐
            │ OpenAI API     │   │ Anthropic    │   │ ChatGPT Web   │
            │ (GPT-4)        │   │ (Claude)     │   │ Scraping      │
            └────────────────┘   └──────────────┘   └───────────────┘
```

## Tech Stack

### Backend
- **Python 3.11+** - Core language
- **FastAPI** - API framework (async, fast, modern)
- **SQLAlchemy** - ORM for PostgreSQL
- **Celery** - Distributed task queue for workers
- **Redis** - Message broker + caching layer
- **Pydantic** - Data validation

### Frontend
- **React 18** with **TypeScript**
- **Next.js 14** - SSR, routing, API routes
- **TailwindCSS** - Styling
- **Recharts** - Data visualization
- **Zustand** - State management
- **React Query** - API data fetching

### Database
- **PostgreSQL 15+** - Main database
- **Redis 7+** - Caching & job queue

### AI Integration
- **OpenAI API** (GPT-4)
- **Anthropic API** (Claude 3.5 Sonnet)
- **Playwright** - ChatGPT web scraping (bonus)

### DevOps
- **Docker** & **Docker Compose** - Containerization
- **pytest** - Testing
- **Alembic** - Database migrations

## Core Components

### 1. API Server (FastAPI)

**Responsibilities:**
- Handle user authentication (simple JWT)
- Project/company CRUD operations
- Trigger analysis jobs
- Serve dashboard metrics
- WebSocket updates for real-time progress

**Key Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login

POST   /api/projects              - Create new tracking project
GET    /api/projects              - List projects
GET    /api/projects/:id          - Get project details

POST   /api/projects/:id/analyze  - Trigger analysis job
GET    /api/projects/:id/metrics  - Get calculated metrics
GET    /api/projects/:id/mentions - Get all mentions
GET    /api/projects/:id/prompts  - Get tracked prompts

GET    /api/dashboard/:id         - Dashboard data
```

### 2. Background Workers (Celery)

**Worker Types:**

#### A. Prompt Generator Worker
**Task:** Generate relevant prompts for a category
**Input:** Category name (e.g., "CRM software")
**Output:** List of 20-50 prompts
**Strategy:**
- Template-based generation (fast, predictable)
- Templates cover different intent types:
  - Informational: "What are the best {category}?"
  - Comparison: "Compare {brand1} vs {brand2} for {use_case}"
  - Problem-solving: "How to solve {problem} with {category}?"
  - Feature-specific: "Which {category} has {feature}?"
  
**Example Templates:**
```python
TEMPLATES = [
    "What are the best {category} for {persona}?",
    "Compare top {category} tools for {use_case}",
    "{category} with {feature} - which is best?",
    "How to choose {category} for {company_size}",
    "Free vs paid {category} comparison",
    "{brand} alternatives for {category}",
    # ... 20-30 more templates
]
```

#### B. AI Query Worker
**Task:** Query AI platforms with prompts
**Input:** Prompt + list of platforms
**Output:** Raw AI responses with metadata
**Platforms:**
- OpenAI ChatGPT (via API)
- Anthropic Claude (via API)
- Optional: Perplexity (via API if available)

**Process:**
1. Receive prompt from queue
2. Query each platform API
3. Store raw response with:
   - Platform name
   - Response text
   - Timestamp
   - Model version
   - Response time

**Rate Limiting:**
- OpenAI: 60 req/min (Tier 1)
- Claude: 50 req/min
- Implement exponential backoff

#### C. Analysis Worker
**Task:** Parse responses and extract insights
**Input:** Raw AI response
**Output:** Structured mention data
**Process:**
1. Extract brand mentions using regex + fuzzy matching
2. Determine mention position (1st, 2nd, 3rd...)
3. Extract sentiment (positive/neutral/negative) using simple keyword analysis
4. Extract citations (URLs mentioned)
5. Calculate metrics

**Mention Detection:**
```python
# Check if brand name appears in response
# Handle variations: "HubSpot", "Hubspot", "Hub Spot"
# Extract surrounding context (±50 chars)
# Determine position based on first mention
```

**Sentiment Analysis (Simple):**
```python
POSITIVE_WORDS = ["best", "excellent", "recommended", "top choice", "leading"]
NEGATIVE_WORDS = ["limited", "expensive", "complex", "lacking", "poor"]
# Count positive/negative words near brand mention
```

#### D. Web Scraper Worker (BONUS)
**Task:** Scrape ChatGPT web UI for actual responses
**Input:** Prompt
**Output:** Response with inline citations
**Tools:** Playwright
**Process:**
1. Launch headless browser
2. Navigate to chat.openai.com
3. Input prompt
4. Wait for response
5. Extract:
   - Full response text
   - Citation numbers [1], [2]
   - Citation URLs from sidebar
6. Store with richer citation data

**Challenge:** Requires authentication, rate limiting
**Solution:** Use session cookies, rotate if needed

### 3. Database Schema (PostgreSQL)

```sql
-- Core Tables

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Survey data
    industry VARCHAR(100),
    company_size VARCHAR(50),
    target_audience TEXT,
    
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,  -- User's brand vs competitors
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    category VARCHAR(100),  -- informational, comparison, etc.
    source VARCHAR(50) DEFAULT 'generated',  -- generated, custom
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,  -- chatgpt, claude, perplexity
    model VARCHAR(100),  -- gpt-4, claude-3-5-sonnet
    response_text TEXT NOT NULL,
    response_time_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES ai_responses(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    position INTEGER,  -- 1st, 2nd, 3rd mention
    context TEXT,  -- Surrounding text
    sentiment VARCHAR(20),  -- positive, neutral, negative
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES ai_responses(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(500),
    domain VARCHAR(255),
    position INTEGER,  -- Citation number [1], [2]
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE metrics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id),
    
    -- Core metrics
    visibility_score DECIMAL(5,2),  -- Percentage
    answers_mentioned INTEGER,
    total_answers INTEGER,
    avg_position DECIMAL(3,2),
    sentiment_score DECIMAL(5,2),
    market_share DECIMAL(5,2),
    
    -- Citation metrics
    total_citations INTEGER,
    unique_domains INTEGER,
    
    -- Platform breakdown
    chatgpt_visibility DECIMAL(5,2),
    claude_visibility DECIMAL(5,2),
    perplexity_visibility DECIMAL(5,2),
    
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(project_id, brand_id)
);

-- Indexes for performance
CREATE INDEX idx_brands_project ON brands(project_id);
CREATE INDEX idx_prompts_project ON prompts(project_id);
CREATE INDEX idx_responses_prompt ON ai_responses(prompt_id);
CREATE INDEX idx_responses_platform ON ai_responses(platform);
CREATE INDEX idx_mentions_brand ON mentions(brand_id);
CREATE INDEX idx_mentions_response ON mentions(response_id);
CREATE INDEX idx_citations_response ON citations(response_id);
CREATE INDEX idx_metrics_project ON metrics_cache(project_id);
```

### 4. Redis Cache Strategy

**Cache Keys:**
```
project:{project_id}:metrics          - TTL: 5 minutes
project:{project_id}:leaderboard      - TTL: 5 minutes
project:{project_id}:prompts          - TTL: 1 hour
dashboard:{project_id}                - TTL: 5 minutes
```

**Job Queue:**
```
Queue: prompts_generation
Queue: ai_queries
Queue: analysis
Queue: web_scraping
```

## Data Flow

### 1. Onboarding Flow
```
User fills survey
    ↓
POST /api/projects
    ↓
Store: project, brands
    ↓
Trigger: prompt_generation task
    ↓
Generate 30-50 prompts
    ↓
Store prompts in DB
    ↓
Trigger: ai_query tasks (batch)
    ↓
Query each platform
    ↓
Store responses
    ↓
Trigger: analysis tasks
    ↓
Extract mentions & citations
    ↓
Calculate metrics
    ↓
Cache results
    ↓
Dashboard ready
```

### 2. Metrics Calculation

**Visibility Score:**
```python
visibility = (answers_with_mention / total_answers) * 100
```

**Market Share:**
```python
market_share = (brand_visibility / sum_all_brand_visibility) * 100
```

**Average Position:**
```python
avg_position = sum(positions) / count(mentions)
```

**Sentiment Score:**
```python
sentiment = (positive_mentions / total_mentions) * 100
```

## Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── onboarding/
│   │   │   └── page.tsx          # Survey form
│   │   ├── dashboard/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Main dashboard
│   │   │   │   ├── prompts/
│   │   │   │   ├── citations/
│   │   │   │   └── competitors/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── VisibilityChart.tsx
│   │   │   ├── PromptList.tsx
│   │   │   └── CitationTable.tsx
│   │   ├── onboarding/
│   │   │   └── SurveyForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Chart.tsx
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── types.ts             # TypeScript types
│   └── hooks/
│       ├── useProject.ts
│       └── useMetrics.ts
```

## Dashboard Features

### 1. Overview Page
- **Key Metrics Cards:**
  - AI Visibility Score (with trend)
  - Answers Mentioned / Total
  - Average Position
  - Sentiment Score
  - Market Share
  
- **Platform Breakdown:**
  - Bar chart showing visibility per platform
  - ChatGPT: 60%, Claude: 55%, Perplexity: 45%

- **Visibility Trend:**
  - Line chart (if we track over time)

### 2. Leaderboard
Table comparing all tracked brands:
```
Rank | Brand     | Visibility | Avg Position | Sentiment | Market Share
-----|-----------|------------|--------------|-----------|-------------
  1  | HubSpot   | 68%        | 1.8          | 85%       | 28.5%
  2  | Salesforce| 62%        | 2.1          | 82%       | 26.0%
  3  | Pipedrive | 57%        | 2.5          | 78%       | 23.9%
```

### 3. Prompts Analysis
Two tabs:
- **Mentioned:** Prompts where your brand appears
- **Not Mentioned:** Opportunities

For each prompt:
- Prompt text
- Platforms tested
- Which brands were mentioned
- Your position (if mentioned)
- Citation links

### 4. Citations
- Top cited domains
- Your pages that got cited
- Citation opportunities (domains citing competitors)

### 5. Competitor Mode (BONUS)
- Switch view to any tracked brand
- See metrics from their perspective
- Same dashboard, different data source

## API Integration Strategy

### OpenAI (ChatGPT)
```python
import openai

async def query_chatgpt(prompt: str) -> dict:
    response = await openai.ChatCompletion.acreate(
        model="gpt-4-turbo-preview",
        messages=[{
            "role": "user", 
            "content": prompt
        }],
        temperature=0.7
    )
    return {
        "platform": "chatgpt",
        "model": "gpt-4-turbo",
        "response": response.choices[0].message.content,
        "tokens": response.usage.total_tokens
    }
```

### Anthropic (Claude)
```python
import anthropic

async def query_claude(prompt: str) -> dict:
    client = anthropic.AsyncAnthropic(api_key=API_KEY)
    response = await client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )
    return {
        "platform": "claude",
        "model": "claude-3-5-sonnet",
        "response": response.content[0].text,
        "tokens": response.usage.input_tokens + response.usage.output_tokens
    }
```

## Web Scraping Strategy (Bonus)

### ChatGPT Web Scraper
```python
from playwright.async_api import async_playwright

async def scrape_chatgpt(prompt: str, session_cookie: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        
        # Set authentication cookie
        await context.add_cookies([{
            "name": "__Secure-next-auth.session-token",
            "value": session_cookie,
            "domain": ".chat.openai.com",
            "path": "/"
        }])
        
        page = await context.new_page()
        await page.goto("https://chat.openai.com")
        
        # Type prompt
        await page.fill("textarea", prompt)
        await page.press("textarea", "Enter")
        
        # Wait for response
        await page.wait_for_selector("[data-message-author-role='assistant']")
        
        # Extract response
        response_element = await page.query_selector(
            "[data-message-author-role='assistant']"
        )
        response_text = await response_element.inner_text()
        
        # Extract citations
        citations = await page.query_selector_all("a[data-citation]")
        citation_urls = []
        for citation in citations:
            url = await citation.get_attribute("href")
            citation_urls.append(url)
        
        await browser.close()
        
        return {
            "response": response_text,
            "citations": citation_urls
        }
```

**Challenges:**
- Requires valid session
- Rate limiting
- UI changes frequently
- Slower than API

**When to Use:**
- To show "exact" ChatGPT UI experience
- When API responses differ from UI
- For citation-rich responses

## Deployment Strategy

### Development (Docker Compose)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_visibility
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  api:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/ai_visibility
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
  
  worker:
    build: ./backend
    command: celery -A app.worker worker --loglevel=info
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/ai_visibility
      REDIS_URL: redis://redis:6379
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api
```

### Production (Railway/Render/Vercel)
- Frontend: Vercel
- Backend API: Railway/Render
- Database: Railway PostgreSQL
- Redis: Upstash
- Workers: Railway (separate service)

## Performance Considerations

### 1. Batch Processing
- Queue 50 prompts at once
- Process 10 parallel API calls
- Use asyncio for concurrent requests

### 2. Caching Strategy
- Cache dashboard data (5 min TTL)
- Cache calculated metrics
- Invalidate on new analysis

### 3. Rate Limiting
- Track API usage per platform
- Implement exponential backoff
- Show progress to user (WebSocket)

### 4. Database Optimization
- Index foreign keys
- Use materialized views for metrics
- Batch inserts for responses

## Security

- JWT authentication
- API key encryption in DB
- Rate limiting per user
- Input validation (Pydantic)
- SQL injection protection (SQLAlchemy)

## Testing Strategy

```
backend/tests/
├── test_api/
│   ├── test_projects.py
│   └── test_metrics.py
├── test_workers/
│   ├── test_prompt_generation.py
│   ├── test_ai_queries.py
│   └── test_analysis.py
└── test_integration/
    └── test_full_flow.py
```

## Timeline (3-4 hours)

### Hour 1: Setup & Core Backend
- Project setup
- Database schema
- FastAPI basic endpoints
- Project CRUD

### Hour 2: Workers & AI Integration
- Prompt generation templates
- OpenAI integration
- Basic mention extraction
- Celery setup

### Hour 3: Metrics & Frontend Basics
- Metrics calculation
- Dashboard API
- React setup
- Basic dashboard UI

### Hour 4: Polish & Bonus
- Styling
- Web scraping (if time)
- Testing
- Deployment

## Key Simplifications for Time Constraint

1. **Prompt Generation:** Use templates, not ML
2. **Sentiment Analysis:** Simple keyword matching
3. **Authentication:** Basic JWT, no OAuth
4. **Frontend:** Minimal styling, focus on data
5. **Testing:** Core flows only
6. **Deployment:** Docker Compose for demo

## What Makes This Production-Ready

1. **Scalability:**
   - Worker-based architecture
   - Can scale workers independently
   - Redis for distributed queue

2. **Reliability:**
   - Retry logic in workers
   - Error tracking
   - Rate limiting

3. **Maintainability:**
   - Clean separation of concerns
   - Type hints (Python)
   - TypeScript (Frontend)

4. **Monitoring:**
   - Celery flower for worker monitoring
   - API logging
   - Performance metrics

## Future Enhancements

- Real-time analysis updates (WebSocket)
- Custom prompt builder
- Historical trend tracking
- Email reports
- More AI platforms (Gemini, Perplexity)
- Advanced sentiment analysis (ML model)
- Automated competitive intelligence
- Citation gap analysis
- SEO recommendations based on AI visibility
