import { api } from "@/lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  Project,
  ProjectCreateRequest,
  DashboardResponse,
} from "@/types";

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const response = await api.get("/projects");
    return response.data;
  },

  create: async (data: ProjectCreateRequest): Promise<Project> => {
    const response = await api.post("/projects", data);
    return response.data;
  },

  get: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  update: async (projectId: string, data: Partial<ProjectCreateRequest>): Promise<Project> => {
    const response = await api.put(`/projects/${projectId}`, data);
    return response.data;
  },

  patch: async (projectId: string, data: any): Promise<Project> => {
    const response = await api.patch(`/projects/${projectId}`, data);
    return response.data;
  },

  delete: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}`);
  },
};

export const dashboardApi = {
  get: async (projectId: string, brandId?: string): Promise<DashboardResponse> => {
    const params = brandId ? { brand_id: brandId } : {};
    const response = await api.get(`/dashboard/${projectId}`, { params });
    return response.data;
  },
};

export const analysisApi = {
  getStatus: async (projectId: string) => {
    const response = await api.get(`/analysis/${projectId}/status`);
    return response.data;
  },

  retry: async (projectId: string) => {
    const response = await api.post(`/analysis/${projectId}/retry`);
    return response.data;
  },

  getPrompts: async (projectId: string) => {
    const response = await api.get(`/analysis/projects/${projectId}/prompts`);
    return response.data;
  },

  createPrompt: async (projectId: string, data: any) => {
    const response = await api.post(`/analysis/projects/${projectId}/prompts`, data);
    return response.data;
  },

  updatePrompt: async (promptId: string, data: any) => {
    const response = await api.patch(`/analysis/prompts/${promptId}`, data);
    return response.data;
  },

  deletePrompt: async (promptId: string) => {
    await api.delete(`/analysis/prompts/${promptId}`);
  },

  regeneratePrompts: async (projectId: string) => {
    const response = await api.post(`/analysis/projects/${projectId}/prompts/regenerate`);
    return response.data;
  },

  createCustomPrompt: async (projectId: string, text: string, category: string) => {
    const response = await api.post(`/analysis/projects/${projectId}/prompts/create`, {
      text,
      category,
    });
    return response.data;
  },

  getJobs: async (projectId: string) => {
    const response = await api.get(`/analysis/projects/${projectId}/jobs`);
    return response.data;
  },

  analyze: async (projectId: string) => {
    const response = await api.post(`/analysis/projects/${projectId}/analyze`);
    return response.data;
  },

  getPlatformBreakdown: async (projectId: string) => {
    const response = await api.get(`/analysis/projects/${projectId}/platform-breakdown`);
    return response.data;
  },

  getCitations: async (projectId: string, limit?: number) => {
    const response = await api.get(`/analysis/projects/${projectId}/citations`, {
      params: limit ? { limit } : {},
    });
    return response.data;
  },

  getMentions: async (projectId: string, limit?: number) => {
    const response = await api.get(`/analysis/projects/${projectId}/mentions`, {
      params: limit ? { limit } : {},
    });
    return response.data;
  },
};

export const brandsApi = {
  list: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/brands`);
    return response.data;
  },
};
