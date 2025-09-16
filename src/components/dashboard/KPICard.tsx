import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: ReactNode;
  trend?: "up" | "down";
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = "up",
}: KPICardProps) {
  const isPositive = change > 0;
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="glass-card p-6 hover:shadow-apple-lg transition-apple group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-500"
            )}
          >
            <TrendIcon className="h-4 w-4" />
            {Math.abs(change)}%
          </div>
          <p className="text-xs text-muted-foreground">{changeLabel}</p>
        </div>
      </div>
      
      {/* Subtle gradient indicator */}
      <div className="mt-4 h-1 w-full rounded-full bg-surface-tertiary overflow-hidden">
        <div 
          className="h-full bg-gradient-primary transition-apple-long"
          style={{ width: `${Math.min(Math.abs(change) * 5, 100)}%` }}
        />
      </div>
    </div>
  );
}