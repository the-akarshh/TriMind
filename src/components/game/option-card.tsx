"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

export interface OptionCardProps {
  index: number;
  text: string;
  imageUrl?: string | null;
  isSelected?: boolean;
  isCorrect?: boolean | null; // null if not revealed yet
  showResult?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];
const ACCENT_COLORS = [
  "from-rose-600/20 border-rose-500/40 text-rose-400 group-hover:border-rose-400",
  "from-blue-600/20 border-blue-500/40 text-blue-400 group-hover:border-blue-400",
  "from-amber-600/20 border-amber-500/40 text-amber-400 group-hover:border-amber-400",
  "from-emerald-600/20 border-emerald-500/40 text-emerald-400 group-hover:border-emerald-400",
  "from-violet-600/20 border-violet-500/40 text-violet-400 group-hover:border-violet-400",
  "from-cyan-600/20 border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400",
];

export function OptionCard({
  index,
  text,
  imageUrl,
  isSelected = false,
  isCorrect = null,
  showResult = false,
  disabled = false,
  onSelect,
  className,
}: OptionCardProps) {
  const letter = OPTION_KEYS[index] || String(index + 1);

  let stateClasses = "bg-slate-900/90 border-slate-800 hover:border-violet-500/50 hover:bg-slate-850";

  if (isSelected && !showResult) {
    stateClasses = "bg-violet-950/40 border-violet-500 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/50";
  }

  if (showResult) {
    if (isCorrect) {
      stateClasses = "bg-emerald-950/50 border-emerald-500 text-white shadow-lg shadow-emerald-500/20";
    } else if (isSelected && !isCorrect) {
      stateClasses = "bg-rose-950/50 border-rose-500 text-slate-300 opacity-90";
    } else {
      stateClasses = "bg-slate-900/40 border-slate-800/60 opacity-40";
    }
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative flex items-center w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 select-none",
        stateClasses,
        disabled && !isSelected && "cursor-not-allowed",
        className
      )}
    >
      {/* Option Key Badge */}
      <div
        className={cn(
          "w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-extrabold text-base sm:text-lg border transition-all mr-4 shrink-0 bg-slate-800/90",
          ACCENT_COLORS[index % ACCENT_COLORS.length]
        )}
      >
        {letter}
      </div>

      {/* Option Text and Media */}
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug break-words">
          {text}
        </p>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Option ${letter}`}
            className="mt-2 max-h-32 rounded-lg border border-slate-700 object-contain"
          />
        )}
      </div>

      {/* Result Indicator Icon & Accessibility Text */}
      {showResult && (
        <div className="shrink-0 ml-2 flex items-center gap-1.5">
          {isCorrect ? (
            <>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
              <span className="sr-only">Correct Answer</span>
            </>
          ) : isSelected ? (
            <>
              <XCircle className="w-6 h-6 text-rose-400" aria-hidden="true" />
              <span className="sr-only">Incorrect Selection</span>
            </>
          ) : null}
        </div>
      )}
    </button>
  );
}
