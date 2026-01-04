import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";

export interface AnalysisJob {
  id: string;
  project_id: string;
  status: "pending" | "running" | "completed" | "failed";
  job_type: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  progress_percentage: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface UseJobPollingOptions {
  projectId: string;
  enabled?: boolean;
  pollInterval?: number;
  onJobComplete?: () => void;
}

export function useJobPolling({
  projectId,
  enabled = true,
  pollInterval = 5000,
  onJobComplete,
}: UseJobPollingOptions) {
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldPoll, setShouldPoll] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousJobsRef = useRef<AnalysisJob[]>([]);

  const fetchJobs = useCallback(async () => {
    if (!enabled || !projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/analysis/projects/${projectId}/jobs`);
      const newJobs = response.data as AnalysisJob[];
      setJobs(newJobs);

      // Check if there are any active jobs
      const hasActive = newJobs.some(
        (j) => j.status === "running" || j.status === "pending"
      );

      // Stop polling if no active jobs
      if (!hasActive && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setShouldPoll(false);
      }

      // Check if any job just completed
      if (onJobComplete && previousJobsRef.current.length > 0) {
        const previouslyRunning = previousJobsRef.current.filter(
          (j) => j.status === "running" || j.status === "pending"
        );
        const nowCompleted = newJobs.filter(
          (j) =>
            (j.status === "completed" || j.status === "failed") &&
            previouslyRunning.some((prev) => prev.id === j.id)
        );

        if (nowCompleted.length > 0) {
          onJobComplete();
        }
      }

      previousJobsRef.current = newJobs;
    } catch (err: any) {
      console.error("Failed to fetch jobs:", err);
      setError(err.message || "Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled, onJobComplete]);

  useEffect(() => {
    if (!enabled || !shouldPoll) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fetch immediately on mount
    fetchJobs();

    // Only set up polling if enabled and should poll
    intervalRef.current = setInterval(() => {
      fetchJobs();
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, shouldPoll, pollInterval, projectId]);

  const hasActiveJobs = jobs.some(
    (job) => job.status === "running" || job.status === "pending"
  );

  const activeJob = jobs.find(
    (job) => job.status === "running" || job.status === "pending"
  );

  return {
    jobs,
    isLoading,
    error,
    hasActiveJobs,
    activeJob,
    refetch: fetchJobs,
    startPolling: () => setShouldPoll(true),
  };
}
