-- AI Visibility Tracker Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table (tracking campaigns)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Survey/Onboarding data
    industry VARCHAR(100),
    company_size VARCHAR(50),
    target_audience TEXT,
    primary_goals TEXT[],
    
    -- Prompt strategy customization (optional)
    -- Allows brands to customize prompt distribution based on their goals
    -- e.g., startups focus on discovery, competitive brands focus on comparison
    prompt_distribution JSONB,
    
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Brands being tracked
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,  -- User's brand vs competitors
    website VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prompts (generated or custom)
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    category VARCHAR(100),  -- informational, comparison, problem_solving, feature
    intent_type VARCHAR(50), -- discovery, evaluation, decision
    source VARCHAR(50) DEFAULT 'generated',  -- generated, custom, imported
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Platform responses
CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,  -- chatgpt, claude, perplexity
    model VARCHAR(100),  -- gpt-4-turbo, claude-3-5-sonnet
    response_text TEXT NOT NULL,
    response_time_ms INTEGER,
    tokens_used INTEGER,
    error_message TEXT,
    status VARCHAR(50) DEFAULT 'success',  -- success, failed, timeout
    created_at TIMESTAMP DEFAULT NOW()
);

-- Brand mentions in responses
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID REFERENCES ai_responses(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    position INTEGER,  -- 1st, 2nd, 3rd mention in response
    context TEXT,  -- Surrounding text (±100 chars)
    sentiment VARCHAR(20) DEFAULT 'neutral',  -- positive, neutral, negative
    sentiment_score DECIMAL(3,2),  -- -1.0 to 1.0
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Citations/Sources mentioned in responses
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID REFERENCES ai_responses(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(500),
    domain VARCHAR(255),
    position INTEGER,  -- Citation number [1], [2], [3]
    is_brand_owned BOOLEAN DEFAULT FALSE,  -- Is it from tracked brand's domain?
    brand_id UUID REFERENCES brands(id),  -- If brand-owned
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pre-calculated metrics (cached)
CREATE TABLE metrics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    
    -- Core visibility metrics
    visibility_score DECIMAL(5,2),  -- Percentage (0-100)
    answers_mentioned INTEGER DEFAULT 0,
    total_answers INTEGER DEFAULT 0,
    avg_position DECIMAL(3,2),
    sentiment_score DECIMAL(5,2),  -- Percentage positive
    market_share DECIMAL(5,2),  -- Share of voice
    
    -- Mention breakdown
    first_position_count INTEGER DEFAULT 0,
    second_position_count INTEGER DEFAULT 0,
    third_position_count INTEGER DEFAULT 0,
    
    -- Citation metrics
    total_citations INTEGER DEFAULT 0,
    unique_domains_cited INTEGER DEFAULT 0,
    brand_owned_citations INTEGER DEFAULT 0,
    
    -- Platform-specific visibility
    chatgpt_visibility DECIMAL(5,2),
    claude_visibility DECIMAL(5,2),
    perplexity_visibility DECIMAL(5,2),
    
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(project_id, brand_id)
);

-- Analysis jobs (for tracking progress)
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, running, completed, failed
    job_type VARCHAR(50),  -- prompt_generation, ai_query, analysis
    
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0,
    
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User API keys (encrypted)
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,  -- openai, anthropic, perplexity
    encrypted_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

CREATE INDEX idx_brands_project ON brands(project_id);
CREATE INDEX idx_brands_primary ON brands(is_primary);

CREATE INDEX idx_prompts_project ON prompts(project_id);
CREATE INDEX idx_prompts_category ON prompts(category);

CREATE INDEX idx_responses_prompt ON ai_responses(prompt_id);
CREATE INDEX idx_responses_platform ON ai_responses(platform);
CREATE INDEX idx_responses_status ON ai_responses(status);
CREATE INDEX idx_responses_created ON ai_responses(created_at DESC);

CREATE INDEX idx_mentions_response ON mentions(response_id);
CREATE INDEX idx_mentions_brand ON mentions(brand_id);
CREATE INDEX idx_mentions_position ON mentions(position);
CREATE INDEX idx_mentions_sentiment ON mentions(sentiment);

CREATE INDEX idx_citations_response ON citations(response_id);
CREATE INDEX idx_citations_domain ON citations(domain);
CREATE INDEX idx_citations_brand ON citations(brand_id);

CREATE INDEX idx_metrics_project ON metrics_cache(project_id);
CREATE INDEX idx_metrics_brand ON metrics_cache(brand_id);

CREATE INDEX idx_jobs_project ON analysis_jobs(project_id);
CREATE INDEX idx_jobs_status ON analysis_jobs(status);

-- Create views for common queries

-- Brand visibility summary
CREATE VIEW brand_visibility_summary AS
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    b.project_id,
    p.name as project_name,
    COUNT(DISTINCT m.response_id) as mentions_count,
    COUNT(DISTINCT r.id) as total_responses,
    ROUND(COUNT(DISTINCT m.response_id)::numeric / NULLIF(COUNT(DISTINCT r.id), 0) * 100, 2) as visibility_percentage,
    AVG(m.position) as avg_position,
    COUNT(CASE WHEN m.sentiment = 'positive' THEN 1 END)::float / NULLIF(COUNT(m.id), 0) * 100 as positive_sentiment_pct
FROM brands b
JOIN projects p ON b.project_id = p.id
LEFT JOIN mentions m ON b.id = m.brand_id
LEFT JOIN ai_responses r ON m.response_id = r.id AND r.status = 'success'
WHERE p.status = 'active'
GROUP BY b.id, b.name, b.project_id, p.name;

-- Platform performance view
CREATE VIEW platform_performance AS
SELECT 
    r.platform,
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT CASE WHEN r.status = 'success' THEN r.id END) as successful_responses,
    AVG(r.response_time_ms) as avg_response_time,
    AVG(r.tokens_used) as avg_tokens,
    COUNT(DISTINCT m.id) as total_mentions
FROM ai_responses r
LEFT JOIN mentions m ON r.id = m.response_id
GROUP BY r.platform;

-- Citation sources view
CREATE VIEW citation_sources AS
SELECT 
    c.domain,
    COUNT(DISTINCT c.id) as citation_count,
    COUNT(DISTINCT c.response_id) as responses_cited_in,
    COUNT(DISTINCT c.brand_id) as brands_mentioned,
    BOOL_OR(c.is_brand_owned) as has_brand_content
FROM citations c
GROUP BY c.domain
ORDER BY citation_count DESC;

-- Prompt performance view  
CREATE VIEW prompt_performance AS
SELECT 
    pr.id as prompt_id,
    pr.text as prompt_text,
    pr.category,
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT m.brand_id) as brands_mentioned,
    COUNT(DISTINCT c.id) as citations_count
FROM prompts pr
LEFT JOIN ai_responses r ON pr.id = r.prompt_id
LEFT JOIN mentions m ON r.id = m.response_id
LEFT JOIN citations c ON r.id = c.response_id
GROUP BY pr.id, pr.text, pr.category;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
