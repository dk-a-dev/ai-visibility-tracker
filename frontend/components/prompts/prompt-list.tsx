import { Prompt } from "@/types/models";
import { PROMPT_CATEGORIES } from "@/lib/constants/prompts";
import { Trash2, Edit2 } from "lucide-react";

interface PromptListProps {
  prompts: Prompt[];
  projectId?: string;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
  onUpdate?: () => void;
}

export function PromptList({ prompts, projectId, onEdit, onDelete, onUpdate }: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No prompts found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map((prompt) => {
        const category = prompt.category
          ? PROMPT_CATEGORIES[prompt.category as keyof typeof PROMPT_CATEGORIES]
          : null;

        return (
          <div
            key={prompt.id}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary-500/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {category && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded text-white ${category.color}`}
                    >
                      {category.name}
                    </span>
                  )}
                  {prompt.source === "custom" && (
                    <span className="text-xs px-2 py-0.5 rounded bg-accent">
                      Custom
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {prompt.response_count} responses
                  </span>
                </div>
                <p className="text-sm">{prompt.text}</p>
              </div>

              {prompt.source === "custom" && (onEdit || onDelete) && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(prompt)}
                      className="p-1.5 text-muted-foreground hover:text-primary-500 transition-colors"
                      title="Edit prompt"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(prompt.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete prompt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
