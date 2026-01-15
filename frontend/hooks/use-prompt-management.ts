import { useState } from "react";
import { projectsApi, analysisApi } from "@/services/api";
import { PROMPT_STRATEGIES } from "@/lib/constants/prompts";

export function usePromptManagement(projectId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDistribution = async (strategyKey: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const strategy = PROMPT_STRATEGIES[strategyKey as keyof typeof PROMPT_STRATEGIES];
      if (!strategy) {
        throw new Error("Invalid strategy");
      }

      await projectsApi.patch(projectId, {
        prompt_distribution: strategy.distribution,
      });
    } catch (err: any) {
      console.error("Failed to update distribution:", err);
      setError(err.message || "Failed to update distribution");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const regeneratePrompts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await analysisApi.regeneratePrompts(projectId);
    } catch (err: any) {
      console.error("Failed to regenerate prompts:", err);
      setError(err.message || "Failed to regenerate prompts");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createPrompt = async (text: string, category: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await analysisApi.createCustomPrompt(projectId, text, category);
    } catch (err: any) {
      console.error("Failed to create prompt:", err);
      setError(err.message || "Failed to create prompt");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrompt = async (
    promptId: string,
    data: { text?: string; category?: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      return await analysisApi.updatePrompt(promptId, data);
    } catch (err: any) {
      console.error("Failed to update prompt:", err);
      setError(err.message || "Failed to update prompt");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePrompt = async (promptId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await analysisApi.deletePrompt(promptId);
    } catch (err: any) {
      console.error("Failed to delete prompt:", err);
      setError(err.message || "Failed to delete prompt");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    updateDistribution,
    regeneratePrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
