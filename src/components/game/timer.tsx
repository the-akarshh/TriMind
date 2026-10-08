"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export interface TimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  onTimeUp?: () => void;
  className?: string;
}

export function Timer({
  totalSeconds,
  remainingSeconds,
  className,
}: TimerProps) {
  const fraction = Math.max(0, remainingSeconds / totalSeconds);
  const isUrgent = remainingSeconds <= 5;
  const isWarning = remainingSeconds <= 10 && remainingSeconds > 5;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-md",
        isUrgent
          ? "bg-rose-950/40 border-rose-500 text-rose-400 animate-pulse"
          : isWarning
          ? "bg-amber-950/40 border-amber-500 text-amber-400"
          : "bg-slate-900/80 border-slate-700 text-slate-200",
        className
      )}
    >
      <Clock className={cn("w-5 h-5", isUrgent && "text-rose-400 animate-spin")} />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wider font-semibold opacity-75">
          Time Remaining
        </span>
        <span className="text-xl font-black font-mono leading-none">
          {remainingSeconds}s
        </span>
      </div>
      <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden ml-2 hidden sm:block">
        <div
          className={cn(
            "h-full transition-all duration-1000 rounded-full",
            isUrgent ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-violet-500"
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
