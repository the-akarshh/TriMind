"use client";

import * as React from "react";
import { BracketRoundDTO, TournamentMatchDTO } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Swords, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface BracketViewerProps {
  bracket: BracketRoundDTO[];
  onAdvanceMatch?: (matchId: string, winnerCollegeId: string, score1: number, score2: number) => Promise<void>;
  isAdmin?: boolean;
}

export function BracketViewer({ bracket, onAdvanceMatch, isAdmin = false }: BracketViewerProps) {
  const [selectedMatch, setSelectedMatch] = React.useState<TournamentMatchDTO | null>(null);
  const [winnerId, setWinnerId] = React.useState<string>("");
  const [score1, setScore1] = React.useState<number>(0);
  const [score2, setScore2] = React.useState<number>(0);
  const [submitting, setSubmitting] = React.useState(false);

  const openAdvanceModal = (match: TournamentMatchDTO) => {
    setSelectedMatch(match);
    setWinnerId(match.college1Id || "");
    setScore1(match.score1 || 0);
    setScore2(match.score2 || 0);
  };

  const handleAdvanceSubmit = async () => {
    if (!selectedMatch || !winnerId || !onAdvanceMatch) return;
    setSubmitting(true);
    try {
      await onAdvanceMatch(selectedMatch.id, winnerId, Number(score1), Number(score2));
      setSelectedMatch(null);
    } catch (err) {
      console.error("Failed to advance match", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!bracket || bracket.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
        No active elimination brackets found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scrollable Horizontal Bracket Canvas */}
      <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex items-stretch gap-8 min-w-[750px] md:min-w-[900px] py-4">
          {bracket.map((round, rIdx) => (
            <div key={round.round} className="flex-1 flex flex-col">
              {/* Round Header */}
              <div className="text-center mb-6">
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-400 bg-violet-950/60 border border-violet-800/40 px-3 py-1 rounded-full">
                  Round {round.round}
                </span>
                <h3 className="text-sm font-black text-white mt-1.5">{round.name}</h3>
              </div>

              {/* Match Nodes */}
              <div className="flex flex-col justify-around flex-1 gap-6">
                {round.matches.map((match) => {
                  const isLive = match.status === "LIVE";
                  const isCompleted = match.status === "COMPLETED";
                  const hasWinner = Boolean(match.winnerCollegeId);

                  return (
                    <div
                      key={match.id}
                      className={`relative bg-slate-900/90 border rounded-2xl p-3.5 shadow-lg transition-all ${
                        isLive
                          ? "border-emerald-500 shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                          : isCompleted
                          ? "border-slate-800 bg-slate-900/60"
                          : "border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      {/* Top Match Metadata */}
                      <div className="flex items-center justify-between text-[10px] mb-2.5 pb-1.5 border-b border-slate-800/60">
                        <span className="text-slate-400 font-mono font-bold">
                          Match #{match.matchNumber}
                        </span>
                        {isLive && (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            LIVE
                          </span>
                        )}
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-slate-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            FINAL
                          </span>
                        )}
                        {match.status === "PENDING" && (
                          <span className="flex items-center gap-1 text-amber-400 font-semibold">
                            <Clock className="w-3 h-3" />
                            READY
                          </span>
                        )}
                        {match.status === "SCHEDULED" && (
                          <span className="text-slate-500">AWAITING WINNER</span>
                        )}
                      </div>

                      {/* Team 1 Slot */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          match.winnerCollegeId === match.college1Id
                            ? "bg-amber-500/10 border border-amber-500/30 text-white font-bold"
                            : match.college1Id
                            ? "bg-slate-800/40 text-slate-200"
                            : "bg-slate-950/40 text-slate-600 italic"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {match.winnerCollegeId === match.college1Id && (
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className="text-xs truncate font-semibold">
                            {match.college1Name || "TBD"}
                          </span>
                          {match.college1Short && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({match.college1Short})
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-black ml-2">
                          {isCompleted ? match.score1.toLocaleString() : "-"}
                        </span>
                      </div>

                      {/* VS Divider */}
                      <div className="text-center my-1">
                        <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase">
                          VS
                        </span>
                      </div>

                      {/* Team 2 Slot */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          match.winnerCollegeId === match.college2Id
                            ? "bg-amber-500/10 border border-amber-500/30 text-white font-bold"
                            : match.college2Id
                            ? "bg-slate-800/40 text-slate-200"
                            : "bg-slate-950/40 text-slate-600 italic"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {match.winnerCollegeId === match.college2Id && (
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className="text-xs truncate font-semibold">
                            {match.college2Name || "TBD"}
                          </span>
                          {match.college2Short && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({match.college2Short})
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-black ml-2">
                          {isCompleted ? match.score2.toLocaleString() : "-"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        {match.roomId ? (
                          <Link
                            href={`/rooms/${match.roomId}/lobby`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300"
                          >
                            <span>Join Arena</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-[10px] text-slate-500">Arena TBD</span>
                        )}

                        {isAdmin && !isCompleted && match.college1Id && match.college2Id && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[10px] px-2 py-0"
                            onClick={() => openAdvanceModal(match)}
                          >
                            Record Result
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Match Result Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-5">
            <div>
              <h3 className="text-lg font-black text-white">Record Match Outcome</h3>
              <p className="text-xs text-slate-400 mt-1">
                Advance the winner to the next round of {selectedMatch.roundName}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Select Winner
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWinnerId(selectedMatch.college1Id || "")}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      winnerId === selectedMatch.college1Id
                        ? "bg-violet-600/20 border-violet-500 text-white"
                        : "bg-slate-800/60 border-slate-700 text-slate-300"
                    }`}
                  >
                    {selectedMatch.college1Name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinnerId(selectedMatch.college2Id || "")}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      winnerId === selectedMatch.college2Id
                        ? "bg-violet-600/20 border-violet-500 text-white"
                        : "bg-slate-800/60 border-slate-700 text-slate-300"
                    }`}
                  >
                    {selectedMatch.college2Name}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    {selectedMatch.college1Short} Score
                  </label>
                  <input
                    type="number"
                    value={score1}
                    onChange={(e) => setScore1(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    {selectedMatch.college2Short} Score
                  </label>
                  <input
                    type="number"
                    value={score2}
                    onChange={(e) => setScore2(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedMatch(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdvanceSubmit}
                disabled={submitting}
              >
                {submitting ? "Advancing..." : "Confirm & Advance Winner"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
