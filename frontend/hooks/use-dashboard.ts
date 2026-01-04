import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { DashboardData, Citation, Mention, PlatformBreakdown } from "@/types/models";

export function useDashboard(projectId: string, brandId?: string | null) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
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
      const response = await api.get(`/dashboard/${projectId}`, { params });
      setData(response.data);

      // Fetch additional data independently
      try {
        const platformResponse = await api.get(
          `/analysis/projects/${projectId}/platform-breakdown`
        );
        setPlatformData(platformResponse.data);
      } catch (err) {
        console.error("Failed to fetch platform breakdown:", err);
      }

      try {
        const citationsResponse = await api.get(
          `/analysis/projects/${projectId}/citations`
        );
        setCitations(citationsResponse.data);
      } catch (err) {
        console.error("Failed to fetch citations:", err);
      }

      try {
        const mentionsResponse = await api.get(
          `/analysis/projects/${projectId}/mentions`
        );
        setMentions(mentionsResponse.data);
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
