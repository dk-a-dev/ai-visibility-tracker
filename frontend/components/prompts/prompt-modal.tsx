"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROMPT_CATEGORIES } from "@/lib/constants/prompts";

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (text: string, category: string) => Promise<void>;
  prompt?: {
    id: string;
    text: string;
    category: string;
  };
  mode?: "create" | "edit";
}

export function PromptModal({
  open,
  onOpenChange,
  onSubmit,
  prompt,
  mode = "create",
}: PromptModalProps) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && prompt) {
        setText(prompt.text);
        setCategory(prompt.category);
      } else {
        setText("");
        setCategory("");
      }
    }
  }, [open, mode, prompt]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!text.trim() || !category) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim(), category);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit prompt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Custom Prompt" : "Edit Prompt"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a custom prompt to analyze your brand visibility."
              : "Update the text or category of your custom prompt."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROMPT_CATEGORIES).map(([key, data]) => (
                    <SelectItem key={key} value={key}>
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${data.color}`} />
                      {data.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="text">Prompt Text</Label>
              <Input
                id="text"
                placeholder="e.g., What are the best features of [brand]?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="col-span-3"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use [brand] as a placeholder for the brand name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !text.trim() || !category}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
