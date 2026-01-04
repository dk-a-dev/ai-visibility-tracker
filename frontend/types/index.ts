export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface Brand {
  id?: string;
  name: string;
  website?: string;
  description?: string;
  is_primary: boolean;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description?: string;
  industry?: string;
  company_size?: string;
  target_audience?: string;
  primary_goals?: string[];
  prompt_distribution?: string;
  status: string;
  created_at: string;
  brand_count?: number;
  brands?: Brand[];
}

export interface ProjectCreateRequest {
  name: string;
  category: string;
  description?: string;
  industry?: string;
  company_size?: string;
  target_audience?: string;
  primary_goals?: string[];
  prompt_distribution?: string;
  brands: Brand[];
}

export interface Metrics {
  brand_id: string;
  brand_name: string;
  visibility_score: number | null;
  answers_mentioned: number | null;
  total_answers: number | null;
  avg_position: number | null;
  sentiment_score: number | null;
  market_share: number | null;
  first_position_count: number | null;
  second_position_count: number | null;
  third_position_count: number | null;
  total_citations: number | null;
  unique_domains_cited: number | null;
  brand_owned_citations: number | null;
  chatgpt_visibility: number | null;
  claude_visibility: number | null;
  perplexity_visibility: number | null;
  calculated_at: string;
}

export interface DashboardResponse {
  project: Project;
  metrics: Metrics;
}

export interface LeaderboardItem {
  brand_id: string;
  brand_name: string;
  visibility_score: number;
  mentions: number;
  avg_position: number;
}

export interface AnalysisJob {
  id: string;
  project_id: string;
  status: string;
  progress: number;
  total_prompts: number;
  completed_prompts: number;
  created_at: string;
  updated_at: string;
}
