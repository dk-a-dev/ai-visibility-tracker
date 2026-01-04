export interface Metrics {
  brand_id: string;
  brand_name: string;
  visibility_score: string | null;
  answers_mentioned: number | null;
  total_answers: number | null;
  avg_position: string | null;
  sentiment_score: string | null;
  market_share: string | null;
  first_position_count: number | null;
  second_position_count: number | null;
  third_position_count: number | null;
  total_citations: number | null;
  unique_domains_cited: number | null;
  brand_owned_citations: number | null;
  chatgpt_visibility: string | null;
  claude_visibility: string | null;
  gemini_visibility: string | null;
  perplexity_visibility: string | null;
  calculated_at: string;
}

export interface DashboardData {
  project_id: string;
  project_name: string;
  category: string;
  metrics: Metrics;
  leaderboard?: any[];
  total_prompts?: number;
  total_responses?: number;
  platform_breakdown?: PlatformBreakdown[];
}

export interface PlatformBreakdown {
  platform: string;
  brand_name: string;
  total_responses: number;
  mentions: number;
  avg_position: number | null;
  avg_sentiment: number | null;
  recommended_count: number;
  visibility_pct: number;
}

export interface Citation {
  id: string;
  url: string;
  title: string | null;
  domain: string;
  is_brand_owned: boolean;
  platform: string;
}

export interface Mention {
  id: string;
  brand_name: string;
  position: number | null;
  context: string | null;
  sentiment: string;
  platform: string;
}
