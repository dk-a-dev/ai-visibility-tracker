import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { projectsApi } from "@/services/api";
import { Project } from "@/types";

export function useProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projects = await projectsApi.list();
      setProjects(projects);
    } catch (err: any) {
      console.error("Failed to fetch projects:", err);
      setError(err.message || "Failed to fetch projects");
      
      if (err.response?.status === 401) {
        router.push("/auth/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await projectsApi.delete(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      throw new Error(err.message || "Failed to delete project");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
    deleteProject,
  };
}
