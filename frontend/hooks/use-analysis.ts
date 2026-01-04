import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Prompt, AnalysisJob } from "@/types/models";

export function useAnalysis(projectId: string) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      const response = await api.get(`/analysis/projects/${projectId}/prompts`);
      setPrompts(response.data);
    } catch (err: any) {
      console.error("Failed to fetch prompts:", err);
      setError(err.message || "Failed to fetch prompts");
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get(`/analysis/projects/${projectId}/jobs`);
      setJobs(response.data);
    } catch (err: any) {
      console.error("Failed to fetch jobs:", err);
      setError(err.message || "Failed to fetch jobs");
    }
  };

  const startAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post(`/analysis/projects/${projectId}/analyze`);
      await fetchJobs();
    } catch (err: any) {
      console.error("Failed to start analysis:", err);
      setError(err.message || "Failed to start analysis");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchPrompts();
      fetchJobs();
    }
  }, [projectId]);

  return {
    prompts,
    jobs,
    isLoading,
    error,
    startAnalysis,
    refetch: () => {
      fetchPrompts();
      fetchJobs();
    },
  };
}
