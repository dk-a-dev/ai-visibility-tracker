"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { analysisApi } from "@/services/api";
import { PromptSetupWizard } from "@/components/prompts/prompt-setup-wizard";
import { useJobPolling } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Play, 
  RefreshCw, 
  FileText, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

interface Prompt {
  id: string;
  text: string;
  category: string | null;
  intent_type: string | null;
  source: "generated" | "custom";
  created_at: string;
  response_count: number;
  mentioned_count: number;
}

interface AnalysisJob {
  id: string;
  status: string;
  job_type: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  progress_percentage: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export default function AnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Use job polling hook
  const { jobs, startPolling } = useJobPolling({
    projectId,
    enabled: !isLoading,
    pollInterval: 5000,
    onJobComplete: () => {
      fetchData();
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const prompts = await analysisApi.getPrompts(projectId);
      setPrompts(prompts);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startAnalysis = async () => {
    if (prompts.length < 15) {
      toast({
        title: "Not Enough Prompts",
        description: `You need at least 15 prompts to run analysis. You have ${prompts.length}.`,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      await analysisApi.analyze(projectId);
      // Start polling for job updates
      startPolling();
      toast({
        title: "Analysis Started",
        description: "Your brand visibility analysis has been queued.",
      });
      setIsAnalyzing(false);
    } catch (error: any) {
      console.error("Failed to start analysis:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to start analysis";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  const handleWizardComplete = async (finalCount: number) => {
    // Check if we have enough prompts
    if (finalCount < 15) {
      toast({
        title: "Not Enough Prompts",
        description: `You need at least 15 prompts. You have ${finalCount}. Please add more prompts.`,
        variant: "destructive",
      });
      // Refresh to show updated count
      await fetchData();
      return;
    }
    
    // Refresh prompts to get the full list
    await fetchData();
    
    // Automatically start analysis after setup
    toast({
      title: "Setup Complete!",
      description: "Starting analysis...",
    });
    
    // Small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Start analysis
    startAnalysis();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/${projectId}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          {prompts.length >= 15 && (
            <button
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Analysis ({prompts.length} prompts)
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Prompt Setup Wizard - Configure before running analysis */}
        {prompts.length < 15 ? (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-700 dark:text-blue-300 text-2xl mb-3">
                🎯 Set Up Your Analysis Prompts
              </h3>
              <p className="text-blue-600 dark:text-blue-400 mb-2">
                Configure your prompts to determine what questions will be asked to AI platforms about your brand.
                This is a one-time setup that takes about 15 minutes.
              </p>
              <p className="text-sm text-blue-500 dark:text-blue-300">
                After setup, analysis will start automatically.
              </p>
            </div>
            
            <PromptSetupWizard 
              projectId={projectId} 
              onComplete={handleWizardComplete}
            />
          </div>
        ) : null}

        {/* Analysis Jobs */}
        {prompts.length >= 15 && (
          <div className="mb-8">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Prompts Configured ({prompts.length} prompts)
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Your prompts are ready. Run analysis to query AI platforms and track brand visibility.
              </p>
            </div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Recent Analysis Jobs
            </h2>
            
            {jobs.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No analysis jobs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your first analysis to track brand visibility
                </p>
                <button
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Run Analysis
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {job.status === "completed" && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {job.status === "failed" && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        {job.status === "running" && (
                          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                        )}
                        <div>
                          <h3 className="font-semibold capitalize">{job.job_type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        job.status === "completed" ? "bg-green-500/10 text-green-500" :
                        job.status === "failed" ? "bg-red-500/10 text-red-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{job.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${job.progress_percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{job.completed_tasks} / {job.total_tasks} tasks completed</span>
                        {job.failed_tasks > 0 && (
                          <span className="text-red-500">{job.failed_tasks} failed</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prompts List - View all prompts */}
        {prompts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              All Prompts ({prompts.length})
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              These prompts will be used in the next analysis run. Generated prompts come from your selected strategy,
              while custom prompts are ones you've added manually.
            </p>
            
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary-500 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <p className="flex-1 text-sm">{prompt.text}</p>
                    <div className="flex items-center gap-2 ml-4">
                      {prompt.category && (
                        <span className="text-xs px-2 py-1 bg-primary-500/10 text-primary-500 rounded">
                          {prompt.category}
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 bg-accent rounded">
                        {prompt.source}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{prompt.response_count} responses</span>
                    <span>•</span>
                    <span>{prompt.mentioned_count} mentions</span>
                    {prompt.intent_type && (
                      <>
                        <span>•</span>
                        <span>{prompt.intent_type}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
