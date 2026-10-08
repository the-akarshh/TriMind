import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  variant?: "default" | "violet" | "emerald" | "amber" | "rose";
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  const iconBgClasses = {
    default: "bg-slate-800 text-slate-300",
    violet: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  };

  return (
    <div
      className={cn(
        "bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-start justify-between transition-all hover:border-slate-700",
        className
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{subValue}</p>
        )}
      </div>
      <div className={cn("p-3 rounded-xl", iconBgClasses[variant])}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );
}
