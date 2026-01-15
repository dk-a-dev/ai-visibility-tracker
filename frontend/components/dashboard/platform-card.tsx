interface PlatformCardProps {
  name: string;
  visibility: number | null;
}

export function PlatformCard({ name, visibility }: PlatformCardProps) {
  const score = visibility !== null ? visibility : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{name}</span>
        <span className="text-sm text-muted-foreground">
          {visibility !== null ? `${score.toFixed(1)}%` : "N/A"}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
