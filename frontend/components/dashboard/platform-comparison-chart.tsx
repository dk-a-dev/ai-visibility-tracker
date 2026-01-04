import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PlatformBreakdown } from "@/types/models";

interface PlatformComparisonChartProps {
  data: PlatformBreakdown[];
}

export function PlatformComparisonChart({ data }: PlatformComparisonChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="platform" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="visibility_pct" fill="#8b5cf6" name="Visibility %" />
          <Bar dataKey="mentions" fill="#10b981" name="Mentions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
