"use client";

import * as React from "react";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { HelpCircle } from "lucide-react";

export interface QuestionCardProps {
  currentIndex: number;
  totalQuestions: number;
  text: string;
  topic: string;
  difficulty: string;
  points: number;
  imageUrl?: string | null;
  tableData?: string | null;
  explanation?: string | null;
  showExplanation?: boolean;
}

export function QuestionCard({
  currentIndex,
  totalQuestions,
  text,
  topic,
  difficulty,
  points,
  imageUrl,
  tableData,
  explanation,
  showExplanation = false,
}: QuestionCardProps) {
  let parsedTable: any[] | null = null;
  if (tableData) {
    try {
      parsedTable = JSON.parse(tableData);
    } catch {
      parsedTable = null;
    }
  }

  const getDifficultyVariant = (d?: string) => {
    switch ((d || "MEDIUM").toUpperCase()) {
      case "EASY":
        return "success";
      case "MEDIUM":
        return "primary";
      case "HARD":
        return "warning";
      case "EXPERT":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/95 shadow-2xl relative overflow-hidden">
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Question {currentIndex} of {totalQuestions}
          </span>
          <Badge variant={getDifficultyVariant(difficulty)}>
            {difficulty || "MEDIUM"}
          </Badge>
          <Badge variant="secondary">
            {topic ? String(topic).replace(/_/g, " ") : "GENERAL REASONING"}
          </Badge>
        </div>
        <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-mono text-xs font-bold">
          +{points} PTS
        </div>
      </div>

      {/* Question Text */}
      <div className="my-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed">
          {text}
        </h2>
      </div>

      {/* Render Data Interpretation Table if present */}
      {parsedTable && Array.isArray(parsedTable) && parsedTable.length > 0 && (
        <div className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-2">
          <table className="w-full text-xs sm:text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/80 text-slate-300">
              <tr>
                {Object.keys(parsedTable[0]).map((col) => (
                  <th key={col} className="px-4 py-2 font-bold tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {parsedTable.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/30">
                  {Object.values(row).map((val: any, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 font-medium">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Render Image if present */}
      {imageUrl && (
        <div className="my-4 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Question illustration"
            className="max-h-64 rounded-xl border border-slate-800 object-contain shadow-lg"
          />
        </div>
      )}

      {/* Explanation when revealed */}
      {showExplanation && explanation && (
        <div className="mt-5 p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 text-sm text-violet-200">
          <div className="flex items-center gap-2 font-bold mb-1 text-violet-300">
            <HelpCircle className="w-4 h-4" />
            <span>Explanation & Solution:</span>
          </div>
          <p className="leading-relaxed">{explanation}</p>
        </div>
      )}
    </Card>
  );
}
