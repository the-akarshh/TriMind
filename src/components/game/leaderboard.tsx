"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Flame } from "lucide-react";
import { Avatar } from "../ui/avatar";

export interface LeaderboardPlayerItem {
  rank: number;
  id: string;
  displayName: string;
  score: number;
  accuracy?: number;
  streak?: number;
}

export interface LeaderboardProps {
  players: LeaderboardPlayerItem[];
  currentUserId?: string;
  showPodium?: boolean;
  className?: string;
}

export function Leaderboard({
  players,
  currentUserId,
  showPodium = true,
  className,
}: LeaderboardProps) {
  const top3 = showPodium ? players.slice(0, 3) : [];

  return (
    <div className={cn("flex flex-col space-y-6 w-full", className)}>
      {/* Top 3 Podium for esports excitement */}
      {showPodium && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2 px-2">
          {/* 2nd Place */}
          {top3[1] ? (
            <div className="flex flex-col items-center bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 text-center order-1 transform translate-y-2">
              <div className="relative mb-2">
                <Avatar name={top3[1].displayName} size="md" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-extrabold text-xs flex items-center justify-center border-2 border-slate-900">
                  2
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate max-w-[90px]">
                {top3[1].displayName}
              </p>
              <p className="text-xs font-mono font-extrabold text-slate-300 mt-0.5">
                {top3[1].score} pts
              </p>
            </div>
          ) : (
            <div className="order-1" />
          )}

          {/* 1st Place (Center & Elevated) */}
          {top3[0] && (
            <div className="flex flex-col items-center bg-gradient-to-b from-amber-950/40 to-slate-900/90 border-2 border-amber-500/60 rounded-2xl p-4 text-center order-2 shadow-xl shadow-amber-500/10">
              <Trophy className="w-6 h-6 text-amber-400 mb-1" />
              <div className="relative mb-2">
                <Avatar name={top3[0].displayName} size="lg" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-slate-900">
                  1
                </span>
              </div>
              <p className="text-sm font-black text-amber-200 truncate max-w-[100px]">
                {top3[0].displayName}
              </p>
              <p className="text-sm font-mono font-black text-amber-400 mt-0.5">
                {top3[0].score} pts
              </p>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] ? (
            <div className="flex flex-col items-center bg-slate-900/80 border border-amber-800/40 rounded-2xl p-3 text-center order-3 transform translate-y-3">
              <div className="relative mb-2">
                <Avatar name={top3[2].displayName} size="md" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-extrabold text-xs flex items-center justify-center border-2 border-slate-900">
                  3
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate max-w-[90px]">
                {top3[2].displayName}
              </p>
              <p className="text-xs font-mono font-extrabold text-amber-500 mt-0.5">
                {top3[2].score} pts
              </p>
            </div>
          ) : (
            <div className="order-3" />
          )}
        </div>
      )}

      {/* Full Leaderboard List (Handles 50+ players) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto">
        {players.map((player) => {
          const isSelf = currentUserId === player.id;
          return (
            <div
              key={player.id}
              className={cn(
                "flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 transition-colors",
                isSelf ? "bg-violet-950/40 border-l-4 border-l-violet-500" : "hover:bg-slate-800/40"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    "w-6 text-center font-mono font-bold text-sm",
                    player.rank === 1
                      ? "text-amber-400"
                      : player.rank === 2
                      ? "text-slate-300"
                      : player.rank === 3
                      ? "text-amber-600"
                      : "text-slate-400"
                  )}
                >
                  {player.rank}
                </span>
                <Avatar name={player.displayName} size="sm" />
                <div className="truncate">
                  <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {player.displayName}
                    {isSelf && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-violet-600 text-white rounded">
                        YOU
                      </span>
                    )}
                  </p>
                  {player.streak && player.streak > 1 ? (
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {player.streak} Streak!
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="text-right shrink-0 ml-4">
                <span className="text-sm sm:text-base font-black font-mono text-violet-400">
                  {player.score.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-1">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
