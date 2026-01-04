import { Brand } from "@/types/models";
import { ExternalLink } from "lucide-react";

interface BrandComparisonListProps {
  brands: Brand[];
  selectedBrandId?: string | null;
  onBrandSelect?: (brandId: string | null) => void;
}

export function BrandComparisonList({
  brands,
  selectedBrandId,
  onBrandSelect,
}: BrandComparisonListProps) {
  if (brands.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No brands in this project
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {onBrandSelect && (
        <button
          onClick={() => onBrandSelect(null)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            !selectedBrandId
              ? "bg-primary-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          All Brands
        </button>
      )}
      {brands.map((brand) => (
        <div key={brand.id} className="inline-flex items-center gap-1.5">
          <button
            onClick={() => onBrandSelect?.(brand.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedBrandId === brand.id
                ? "bg-primary-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            <span>{brand.name}</span>
            {brand.is_primary && (
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                Primary
              </span>
            )}
          </button>
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Visit website"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
