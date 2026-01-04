import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Brand } from "@/types/models";

export function useBrands(projectId: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/projects/${projectId}/brands`);
      setBrands(response.data);
    } catch (err: any) {
      console.error("Failed to fetch brands:", err);
      setError(err.message || "Failed to fetch brands");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchBrands();
    }
  }, [projectId]);

  return {
    brands,
    isLoading,
    error,
    refetch: fetchBrands,
  };
}
