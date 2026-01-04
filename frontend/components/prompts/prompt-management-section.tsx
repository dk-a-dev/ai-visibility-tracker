"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptStrategySelector } from "./prompt-strategy-selector";
import { PromptList } from "./prompt-list";
import { PromptModal } from "./prompt-modal";
import { usePromptManagement } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Plus } from "lucide-react";
import { Prompt } from "@/types/models";

interface PromptManagementSectionProps {
  projectId: string;
  prompts: Prompt[];
  currentStrategy?: string;
  onUpdate?: () => void;
}

export function PromptManagementSection({
  projectId,
  prompts,
  currentStrategy,
  onUpdate,
}: PromptManagementSectionProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const {
    updateDistribution,
    regeneratePrompts,
    createPrompt,
    isLoading,
  } = usePromptManagement(projectId);
  const { toast } = useToast();

  const handleStrategyChange = async (strategyKey: string) => {
    try {
      await updateDistribution(strategyKey);
      toast({
        title: "Strategy Updated",
        description: "Prompt distribution strategy has been updated successfully.",
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update strategy",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("This will delete all generated prompts and create new ones based on your current strategy. Custom prompts will be preserved. Continue?")) {
      return;
    }

    setIsRegenerating(true);
    try {
      const result = await regeneratePrompts();
      toast({
        title: "Prompts Regenerated",
        description: `Deleted ${result.deleted_count} generated prompts and created ${result.generated_count} new ones.`,
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate prompts",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCreatePrompt = async (text: string, category: string) => {
    try {
      await createPrompt(text, category);
      toast({
        title: "Success",
        description: "Custom prompt created successfully",
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      });
      throw error;
    }
  };

  const generatedCount = prompts.filter(p => p.source === "generated").length;
  const customCount = prompts.filter(p => p.source === "custom").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prompt Strategy</CardTitle>
              <CardDescription>
                Choose a preset strategy or customize your prompt distribution
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PromptStrategySelector
            currentStrategy={currentStrategy}
            onStrategyChange={handleStrategyChange}
            disabled={isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prompts ({prompts.length})</CardTitle>
              <CardDescription>
                {generatedCount} generated • {customCount} custom
              </CardDescription>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Prompt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PromptList
            prompts={prompts}
            projectId={projectId}
            onUpdate={onUpdate}
          />
        </CardContent>
      </Card>

      <PromptModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreatePrompt}
        mode="create"
      />
    </div>
  );
}
