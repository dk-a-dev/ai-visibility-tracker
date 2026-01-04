import { Citation } from "@/types/models";
import LinkIcon from "@/components/ui/link-icon";

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  return (
    <div className="space-y-3">
      {citations.map((citation) => (
        <div
          key={citation.id}
          className="flex items-start gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
        >
          <LinkIcon size={16} className="mt-1 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-500 hover:underline block truncate"
            >
              {citation.title || citation.url}
            </a>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {citation.domain}
              </span>
              <span className="text-xs px-2 py-0.5 bg-accent rounded">
                {citation.platform}
              </span>
              {citation.is_brand_owned && (
                <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-500 rounded">
                  Brand Owned
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
