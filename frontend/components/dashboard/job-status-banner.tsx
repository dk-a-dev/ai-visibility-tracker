"use client";

import { AnalysisJob } from "@/hooks/use-job-polling";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface JobStatusBannerProps {
  job: AnalysisJob;
}

export function JobStatusBanner({ job }: JobStatusBannerProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case "running":
        return "Analysis in progress...";
      case "completed":
        return "Analysis completed!";
      case "failed":
        return "Analysis failed";
      case "pending":
        return "Analysis queued...";
      default:
        return "Processing...";
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case "running":
      case "pending":
        return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
      case "completed":
        return "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300";
      case "failed":
        return "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300";
      default:
        return "bg-muted border-border";
    }
  };

  const shouldShow = job.status === "running" || job.status === "pending";

  if (!shouldShow) return null;

  return (
    <div
      className={`border rounded-lg p-4 mb-6 ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className="font-medium">{getStatusText()}</p>
            {job.total_tasks > 0 && (
              <p className="text-sm opacity-80 mt-1">
                {job.completed_tasks} of {job.total_tasks} tasks completed
                {job.failed_tasks > 0 && (
                  <span className="ml-2 text-red-500">
                    ({job.failed_tasks} failed)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        {job.progress_percentage > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold">
              {Math.round(job.progress_percentage)}%
            </p>
          </div>
        )}
      </div>
      {job.total_tasks > 0 && (
        <div className="mt-3 w-full bg-black/10 dark:bg-white/10 rounded-full h-2">
          <div
            className="bg-current h-2 rounded-full transition-all duration-500"
            style={{ width: `${job.progress_percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
