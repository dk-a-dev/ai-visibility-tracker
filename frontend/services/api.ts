import { api } from "../lib/api";
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
};
