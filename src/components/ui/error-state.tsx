import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this view.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-900/50 bg-rose-950/20 max-w-md mx-auto my-6">
      <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-rose-300/80 mb-5">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
