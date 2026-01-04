interface PositionCardProps {
  position: string;
  count: number;
}

export function PositionCard({ position, count }: PositionCardProps) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold mb-2">{count}</div>
      <div className="text-sm text-muted-foreground">{position} Position</div>
    </div>
  );
}
