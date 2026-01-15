import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardApi, analysisApi } from "@/services/api";
import { DashboardResponse } from "@/types";
import { Citation, Mention, PlatformBreakdown } from "@/types/models";

export function useDashboard(projectId: string, brandId?: string | null) {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [platformData, setPlatformData] = useState<PlatformBreakdown[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Fetching dashboard for project:", projectId, "brand:", brandId);
      console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL);
      console.log("Token:", localStorage.getItem("token") ? "exists" : "missing");

      // Build query params
      const params = brandId ? { brand_id: brandId } : {};

      // Fetch main dashboard data
      const data = await dashboardApi.get(projectId, brandId || undefined);
      setData(data);

      // Fetch additional data independently
      try {
        const platformData = await analysisApi.getPlatformBreakdown(projectId);
        setPlatformData(platformData);
      } catch (err) {
        console.error("Failed to fetch platform breakdown:", err);
      }

      try {
        const citations = await analysisApi.getCitations(projectId);
        setCitations(citations);
      } catch (err) {
        console.error("Failed to fetch citations:", err);
      }

      try {
        const mentions = await analysisApi.getMentions(projectId);
        setMentions(mentions);
      } catch (err) {
        console.error("Failed to fetch mentions:", err);
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      setError(err.message || "Failed to fetch dashboard");
      
      if (err.response?.status === 401) {
        router.push("/auth/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchDashboard();
    }
  }, [projectId, brandId]);

  return {
    data,
    platformData,
    citations,
    mentions,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
