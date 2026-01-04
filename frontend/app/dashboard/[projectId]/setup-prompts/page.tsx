"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { PromptSetupWizard } from "@/components/prompts";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function PromptSetupPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProjectName(response.data.name);
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push(`/dashboard/${projectId}/analysis`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Configure Your Prompts</h1>
          <p className="text-muted-foreground">
            Set up prompts for <span className="font-semibold">{projectName}</span> before running your first analysis
          </p>
        </div>

        <PromptSetupWizard projectId={projectId} onComplete={handleComplete} />
      </main>
    </div>
  );
}
