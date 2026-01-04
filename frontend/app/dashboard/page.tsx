"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { api } from "../../lib/api";
import TrashIcon from "@/components/ui/trash-icon";

interface Project {
  id: string;
  name: string;
  category: string;
  status: string;
  created_at: string;
  brand_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to project page
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      // Remove the project from the list
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Visibility Tracker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.full_name}
            </span>
            <button
              onClick={() => {
                useAuthStore.getState().clearAuth();
                router.push("/auth/login");
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Projects</h2>
            <p className="text-muted-foreground">
              Manage and track your brand visibility
            </p>
          </div>
          <Link
            href="/onboarding"
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
          >
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first project to start tracking
            </p>
            <Link
              href="/onboarding"
              className="inline-block px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
            >
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="relative bg-card border border-border rounded-lg hover:border-primary-500 transition-colors group"
              >
                <Link
                  href={`/dashboard/${project.id}`}
                  className="block p-6"
                >
                  <div className="flex items-start justify-between mb-4 pr-8">
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        project.status === "active"
                          ? "bg-primary-500/20 text-primary-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.category}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {project.brand_count} brand
                      {project.brand_count !== 1 ? "s" : ""}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all duration-200 z-10"
                  title="Delete project"
                >
                  <TrashIcon size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
