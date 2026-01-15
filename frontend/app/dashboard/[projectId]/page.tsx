"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { brandsApi, analysisApi, dashboardApi } from "@/services/api";
import { cn } from "@/lib/utils";
import { 
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import {
  BrandComparisonList,
  JobStatusBanner,
  MetricCard,
  PlatformCard,
  PositionCard,
  CitationList,
  MentionList,
  PlatformComparisonChart,
} from "@/components/dashboard";
import { Brand, PlatformBreakdown, Citation, Mention, Metrics } from "@/types/models";
import { DashboardResponse } from "@/types";
import { useJobPolling } from "@/hooks";
import ChartLineIcon from "@/components/ui/chart-line-icon";
import MessageCircleIcon from "@/components/ui/message-circle-icon";
import TargetIcon from "@/components/ui/target-icon";
import ChartHistogramIcon from "@/components/ui/chart-histogram-icon";
import WorldIcon from "@/components/ui/world-icon";
import LinkIcon from "@/components/ui/link-icon";
import RosetteDiscountCheckIcon from "@/components/ui/rosette-discount-check-icon";

export default function ProjectDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const brandIdParam = searchParams.get("brand_id");
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(brandIdParam);
  const [platformData, setPlatformData] = useState<PlatformBreakdown[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [promptCount, setPromptCount] = useState<number>(0);

  // Poll for active analysis jobs
  const { activeJob, hasActiveJobs } = useJobPolling({
    projectId,
    enabled: !isLoading,
    onJobComplete: () => {
      // Refetch dashboard when job completes
      fetchDashboard();
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    fetchDashboard();
    fetchBrands();
  }, [projectId]);

  useEffect(() => {
    if (selectedBrandId) {
      fetchDashboard();
    }
  }, [selectedBrandId]);

  const fetchBrands = async () => {
    try {
      const brands = await brandsApi.list(projectId);
      setBrands(brands);
      
      // Also check prompt count
      try {
        const prompts = await analysisApi.getPrompts(projectId);
        setPromptCount(prompts.length);
      } catch (err) {
        console.warn("Failed to fetch prompts:", err);
      }
    } catch (error: any) {
      console.warn("Failed to fetch brands:", error.message);
    }
  };

  const fetchDashboard = async () => {
    try {
      // Fetch main dashboard data first
      console.log("Fetching dashboard for project:", projectId);
      console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL);
      console.log("Token:", localStorage.getItem("token") ? "exists" : "missing");
      
      const dashboardData = await dashboardApi.get(projectId, selectedBrandId || undefined);
      console.log("Dashboard response:", dashboardData);
      setData(dashboardData);

      // Fetch additional data independently, don't fail if they error
      Promise.all([
        analysisApi.getPlatformBreakdown(projectId)
          .then(data => {
            console.log("Platform data loaded:", data.length);
            setPlatformData(data);
          })
          .catch(err => console.warn("Failed to fetch platform data:", err.message)),
        analysisApi.getCitations(projectId, 10)
          .then(data => {
            console.log("Citations loaded:", data.length);
            setCitations(data);
          })
          .catch(err => console.warn("Failed to fetch citations:", err.message)),
        analysisApi.getMentions(projectId, 20)
          .then(data => {
            console.log("Mentions loaded:", data.length);
            setMentions(data);
          })
          .catch(err => console.warn("Failed to fetch mentions:", err.message))
      ]);
    } catch (error: any) {
      console.error("Failed to fetch dashboard:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Link
            href="/dashboard"
            className="text-primary-500 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { project_name, category, metrics } = data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ChartHistogramIcon size={24} />
              {project_name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/${projectId}/analysis`}
              className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-accent rounded-md transition-colors"
            >
              <MessageCircleIcon size={16} />
              Analysis
            </Link>
            <button
              onClick={() => fetchDashboard()}
              disabled={hasActiveJobs}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border border-border rounded-md transition-colors",
                hasActiveJobs
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-accent"
              )}
              title={hasActiveJobs ? "Wait for analysis to complete" : "Refresh dashboard"}
            >
              <RefreshCw className={cn("w-4 h-4", hasActiveJobs && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Prompt Setup Banner */}
        {promptCount === 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <MessageCircleIcon size={20} />
                  Set Up Your Prompts
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                  Before running analysis, you need to configure your prompts. This helps us know what questions
                  to ask AI platforms about your brand.
                </p>
                <Link
                  href={`/dashboard/${projectId}/analysis`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Configure Prompts (15 minutes)
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Job Status Banner */}
        {activeJob && <JobStatusBanner job={activeJob} />}

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{metrics.brand_name}</h2>
          <p className="text-muted-foreground mb-4">
            Last updated:{" "}
            {metrics.calculated_at
              ? new Date(metrics.calculated_at).toLocaleString()
              : "Never"}
          </p>
          {brands.length > 1 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Filter by Brand:</h3>
              <BrandComparisonList
                brands={brands}
                selectedBrandId={selectedBrandId}
                onBrandSelect={setSelectedBrandId}
              />
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<ChartLineIcon size={20} />}
            title="Visibility Score"
            value={
              metrics.visibility_score !== null
                ? `${metrics.visibility_score.toFixed(1)}%`
                : "N/A"
            }
            description="Overall visibility across AI platforms"
          />
          <MetricCard
            icon={<MessageCircleIcon size={20} />}
            title="Mentions"
            value={
              metrics.answers_mentioned !== null
                ? `${metrics.answers_mentioned}/${metrics.total_answers}`
                : "N/A"
            }
            description="Times mentioned in AI responses"
          />
          <MetricCard
            icon={<TargetIcon size={20} />}
            title="Avg Position"
            value={
              metrics.avg_position !== null
                ? metrics.avg_position.toFixed(1)
                : "N/A"
            }
            description="Average ranking position"
          />
          <MetricCard
            icon={<WorldIcon size={20} />}
            title="Market Share"
            value={
              metrics.market_share !== null
                ? `${metrics.market_share.toFixed(1)}%`
                : "N/A"
            }
            description="Share of total mentions"
          />
        </div>

        {/* Platform Visibility */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Platform Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <PlatformCard
              name="ChatGPT"
              visibility={metrics.chatgpt_visibility}
            />
            <PlatformCard name="Claude" visibility={metrics.claude_visibility} />
            <PlatformCard name="Gemini" visibility={metrics.gemini_visibility} />
            <PlatformCard
              name="Perplexity"
              visibility={metrics.perplexity_visibility}
            />
          </div>
        </div>

        {/* Position Distribution */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <RosetteDiscountCheckIcon size={20} />
            Position Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PositionCard
              position="1st"
              count={metrics.first_position_count || 0}
            />
            <PositionCard
              position="2nd"
              count={metrics.second_position_count || 0}
            />
            <PositionCard
              position="3rd"
              count={metrics.third_position_count || 0}
            />
          </div>
        </div>

        {/* Platform Comparison Chart */}
        {platformData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <WorldIcon size={20} />
              Platform Comparison
            </h3>
            <PlatformComparisonChart data={platformData} />
          </div>
        )}

        {/* Recent Mentions */}
        {mentions.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageCircleIcon size={20} />
              Recent Mentions
            </h3>
            <MentionList mentions={mentions} limit={5} />
          </div>
        )}

        {/* Top Citations */}
        {citations.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <LinkIcon size={20} />
              Top Citations
            </h3>
            <CitationList citations={citations} />
          </div>
        )}

        {/* Citations Summary */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LinkIcon size={20} />
            Citation Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              icon={<LinkIcon size={20} />}
              title="Total Citations"
              value={metrics.total_citations?.toString() || "0"}
              description="Total citation count"
            />
            <MetricCard
              icon={<WorldIcon size={20} />}
              title="Unique Domains"
              value={metrics.unique_domains_cited?.toString() || "0"}
              description="Different sources cited"
            />
            <MetricCard
              icon={<RosetteDiscountCheckIcon size={20} />}
              title="Brand-Owned"
              value={metrics.brand_owned_citations?.toString() || "0"}
              description="Citations from your domain"
            />
          </div>
        </div>
      </main>
    </div>
  );
}