export interface Project {
  id: string;
  name: string;
  category: string;
  status: string;
  created_at: string;
  brand_count: number;
}

export interface Brand {
  id: string;
  name: string;
  website?: string;
  description?: string;
  is_primary: boolean;
  project_id: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  text: string;
  category: string | null;
  source: "generated" | "custom";
  response_count: number;
  created_at: string;
}

export interface AnalysisJob {
  id: string;
  status: string;
  progress: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  total_tasks: number;
  completed_tasks: number;
}
