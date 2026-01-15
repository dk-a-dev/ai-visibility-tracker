import { useState, useEffect } from "react";
import { analysisApi } from "@/services/api";
import { Prompt, AnalysisJob } from "@/types/models";

export function useAnalysis(projectId: string) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      const prompts = await analysisApi.getPrompts(projectId);
      setPrompts(prompts);
    } catch (err: any) {
      console.error("Failed to fetch prompts:", err);
      setError(err.message || "Failed to fetch prompts");
    }
  };

  const fetchJobs = async () => {
    try {
      const jobs = await analysisApi.getJobs(projectId);
      setJobs(jobs);
    } catch (err: any) {
      console.error("Failed to fetch jobs:", err);
      setError(err.message || "Failed to fetch jobs");
    }
  };

  const startAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await analysisApi.analyze(projectId);
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
