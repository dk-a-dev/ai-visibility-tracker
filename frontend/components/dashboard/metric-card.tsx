import React from "react";

interface MetricCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string;
  description: string;
}

export function MetricCard({ icon, title, value, description }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-primary-500">{icon}</div>}
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
