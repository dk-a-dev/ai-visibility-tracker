"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { PROMPT_STRATEGIES, PROMPT_CATEGORIES } from "../../lib/constants/prompts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, Edit2, Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratedPrompt {
  id: string;  // Add prompt ID
  text: string;
  category: string;
  status: "pending" | "approved" | "rejected" | "editing";
  editedText?: string;
}

interface PromptSetupWizardProps {
  projectId: string;
  onComplete: (finalCount: number) => void;
}

export function PromptSetupWizard({ projectId, onComplete }: PromptSetupWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"strategy" | "review" | "custom">("strategy");
  const [selectedStrategy, setSelectedStrategy] = useState("balanced");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [customPrompts, setCustomPrompts] = useState<Array<{ text: string; category: string }>>([]);
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const generatePrompts = async () => {
    setIsGenerating(true);
    try {
      // First update the project with the selected strategy
      await api.patch(`/projects/${projectId}`, {
        prompt_distribution: PROMPT_STRATEGIES[selectedStrategy as keyof typeof PROMPT_STRATEGIES].distribution,
      });

      // Generate prompts (this will create 15 prompts based on strategy)
      const response = await api.post(`/analysis/projects/${projectId}/prompts/regenerate`);
      
      // Fetch the generated prompts
      const promptsRes = await api.get(`/analysis/projects/${projectId}/prompts`);
      const prompts = promptsRes.data;
      
      // Convert to review format
      const reviewPrompts = prompts
        .filter((p: any) => p.source === "generated")
        .map((p: any) => ({
          id: p.id,  // Store the prompt ID
          text: p.text,
          category: p.category || "informational",
          status: "pending" as const,
        }));
      
      setGeneratedPrompts(reviewPrompts);
      setStep("review");
      
      toast({
        title: "Prompts Generated",
        description: `${reviewPrompts.length} prompts ready for review`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate prompts",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const approvePrompt = (index: number) => {
    const updated = [...generatedPrompts];
    updated[index].status = "approved";
    setGeneratedPrompts(updated);
  };

  const rejectPrompt = (index: number) => {
    const updated = [...generatedPrompts];
    updated[index].status = "rejected";
    setGeneratedPrompts(updated);
  };

  const editPrompt = (index: number) => {
    const updated = [...generatedPrompts];
    updated[index].status = "editing";
    updated[index].editedText = updated[index].text;
    setGeneratedPrompts(updated);
  };

  const saveEdit = (index: number) => {
    const updated = [...generatedPrompts];
    if (updated[index].editedText) {
      updated[index].text = updated[index].editedText;
      updated[index].status = "approved";
    }
    setGeneratedPrompts(updated);
  };

  const addCustomPrompt = () => {
    if (!newPromptText.trim() || !newPromptCategory) {
      toast({
        title: "Error",
        description: "Please enter prompt text and select a category",
        variant: "destructive",
      });
      return;
    }

    setCustomPrompts([...customPrompts, { text: newPromptText.trim(), category: newPromptCategory }]);
    setNewPromptText("");
    setNewPromptCategory("");
  };

  const removeCustomPrompt = (index: number) => {
    setCustomPrompts(customPrompts.filter((_, i) => i !== index));
  };

  const finishSetup = async () => {
    setIsSaving(true);
    try {
      // Collect approved prompt IDs
      const approvedPromptIds = generatedPrompts
        .filter((p) => p.status === "approved")
        .map((p) => p.id);
      
      // Collect edited prompts (id -> new text)
      const editedPrompts: Record<string, string> = {};
      generatedPrompts.forEach((p) => {
        if (p.status === "approved" && p.editedText && p.editedText !== p.text) {
          editedPrompts[p.id] = p.editedText;
        }
      });
      
      // Debug logging
      console.log("📊 Wizard Completion Data:");
      console.log(`  Total generated: ${generatedPrompts.length}`);
      console.log(`  Approved: ${approvedPromptIds.length}`);
      console.log(`  Rejected: ${generatedPrompts.filter(p => p.status === "rejected").length}`);
      console.log(`  Pending: ${generatedPrompts.filter(p => p.status === "pending").length}`);
      console.log(`  Custom: ${customPrompts.length}`);
      console.log(`  Approved IDs:`, approvedPromptIds);
      
      // Call the backend endpoint to complete setup
      const response = await api.post(`/analysis/projects/${projectId}/prompts/complete-setup`, {
        approved_prompt_ids: approvedPromptIds,
        edited_prompts: editedPrompts,
        custom_prompts: customPrompts.map((c) => ({
          text: c.text,
          category: c.category,
        })),
      });

      console.log("✅ Backend Response:", response.data);

      toast({
        title: "Setup Complete!",
        description: `${response.data.final_count} prompts configured (${response.data.approved_count} approved, ${response.data.created_count} custom, ${response.data.deleted_count} rejected)`,
      });

      onComplete(response.data.final_count);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to save prompts",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const approvedCount = generatedPrompts.filter((p) => p.status === "approved").length;
  const totalPrompts = approvedCount + customPrompts.length;
  const targetTotal = 20;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {step === "strategy" && "Step 1: Select Strategy"}
            {step === "review" && "Step 2: Review Prompts"}
            {step === "custom" && "Step 3: Add Custom Prompts"}
          </span>
          <span className="text-sm text-muted-foreground">
            {totalPrompts} / {targetTotal} prompts
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ 
              width: `${step === "strategy" ? 33 : step === "review" ? 66 : 100}%` 
            }}
          />
        </div>
      </div>

      {/* Strategy Selection */}
      {step === "strategy" && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Prompt Strategy</CardTitle>
            <CardDescription>
              This determines the types of questions that will be asked to AI platforms.
              We'll generate 15 prompts based on your selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PROMPT_STRATEGIES).map(([key, strategy]) => (
                <button
                  key={key}
                  onClick={() => setSelectedStrategy(key)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedStrategy === key
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-border hover:border-primary-500/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{strategy.icon}</div>
                  <h3 className="font-semibold mb-1">{strategy.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                  <div className="space-y-1">
                    {Object.entries(strategy.distribution).map(([cat, val]) => (
                      <div key={cat} className="flex items-center gap-2 text-xs">
                        <div className="w-20 capitalize">{cat.replace("_", " ")}</div>
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary-500 h-1.5 rounded-full"
                            style={{ width: `${(val as number) * 100}%` }}
                          />
                        </div>
                        <div className="w-10 text-right">{Math.round((val as number) * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={generatePrompts}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating 15 Prompts...
                </>
              ) : (
                <>
                  Generate Prompts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Generated Prompts */}
      {step === "review" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Generated Prompts</CardTitle>
              <CardDescription>
                Approve, edit, or reject each prompt. Approved prompts will be used in analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {generatedPrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      prompt.status === "approved"
                        ? "border-green-500 bg-green-500/10"
                        : prompt.status === "rejected"
                        ? "border-red-500 bg-red-500/10 opacity-50"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        {prompt.status === "editing" ? (
                          <Input
                            value={prompt.editedText}
                            onChange={(e) => {
                              const updated = [...generatedPrompts];
                              updated[index].editedText = e.target.value;
                              setGeneratedPrompts(updated);
                            }}
                            className="mb-2"
                          />
                        ) : (
                          <p className="text-sm mb-2">{prompt.text}</p>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          PROMPT_CATEGORIES[prompt.category as keyof typeof PROMPT_CATEGORIES]?.color || "bg-gray-500"
                        } text-white`}>
                          {PROMPT_CATEGORIES[prompt.category as keyof typeof PROMPT_CATEGORIES]?.name || prompt.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {prompt.status === "editing" ? (
                          <Button size="sm" variant="ghost" onClick={() => saveEdit(index)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            {prompt.status !== "approved" && (
                              <Button size="sm" variant="ghost" onClick={() => approvePrompt(index)}>
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            {prompt.status !== "rejected" && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => editPrompt(index)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => rejectPrompt(index)}>
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("strategy")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setStep("custom")} disabled={approvedCount === 0}>
              Continue to Custom Prompts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Custom Prompts */}
      {step === "custom" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Prompts</CardTitle>
              <CardDescription>
                Add 5 custom prompts specific to your brand or industry. These will be used alongside the generated prompts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Prompt Text</Label>
                  <Input
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="e.g., What are the best features of [brand]?"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use [brand] as a placeholder for the brand name
                  </p>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newPromptCategory} onValueChange={setNewPromptCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROMPT_CATEGORIES).map(([key, data]) => (
                        <SelectItem key={key} value={key}>
                          {data.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addCustomPrompt} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Prompt
                </Button>
              </div>

              {customPrompts.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Custom Prompts ({customPrompts.length})</h4>
                  {customPrompts.map((prompt, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm mb-1">{prompt.text}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          PROMPT_CATEGORIES[prompt.category as keyof typeof PROMPT_CATEGORIES]?.color || "bg-gray-500"
                        } text-white`}>
                          {PROMPT_CATEGORIES[prompt.category as keyof typeof PROMPT_CATEGORIES]?.name || prompt.category}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCustomPrompt(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("review")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={finishSetup}
              disabled={isSaving || totalPrompts < 15}
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup ({totalPrompts} prompts)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
