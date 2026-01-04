import { Mention } from "@/types/models";
import { cn } from "@/lib/utils";

interface MentionListProps {
  mentions: Mention[];
  limit?: number;
}

export function MentionList({ mentions, limit = 5 }: MentionListProps) {
  const displayedMentions = limit ? mentions.slice(0, limit) : mentions;

  return (
    <div className="space-y-4">
      {displayedMentions.map((mention) => (
        <div
          key={mention.id}
          className="border-b border-border pb-4 last:border-0"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{mention.brand_name}</span>
              <span className="text-xs px-2 py-1 bg-accent rounded">
                {mention.platform}
              </span>
            </div>
            {mention.position && (
              <span className="text-sm text-muted-foreground">
                Position #{mention.position}
              </span>
            )}
          </div>
          {mention.context && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {mention.context}
            </p>
          )}
          <span
            className={cn(
              "text-xs mt-2 inline-block px-2 py-1 rounded",
              mention.sentiment === "positive" &&
                "bg-green-500/10 text-green-500",
              mention.sentiment === "negative" && "bg-red-500/10 text-red-500",
              mention.sentiment === "neutral" && "bg-gray-500/10 text-gray-500"
            )}
          >
            {mention.sentiment}
          </span>
        </div>
      ))}
    </div>
  );
}
