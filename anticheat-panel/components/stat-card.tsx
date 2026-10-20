import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  accent?: "red" | "green" | "yellow" | "blue" | "default";
}

const accentMap = {
  red:     "text-red-400 bg-red-600/10 border-red-600/20",
  green:   "text-green-400 bg-green-600/10 border-green-600/20",
  yellow:  "text-yellow-400 bg-yellow-600/10 border-yellow-600/20",
  blue:    "text-blue-400 bg-blue-600/10 border-blue-600/20",
  default: "text-muted-foreground bg-accent border-border",
};

export function StatCard({ label, value, icon: Icon, sub, accent = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border", accentMap[accent])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
