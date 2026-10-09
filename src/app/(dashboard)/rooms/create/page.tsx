"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { QuestionSetDTO, GameMode } from "@/types";
import {
  Tv,
  Users,
  AlertCircle,
  ArrowRight,
  Zap,
  Shield,
  BookOpen,
  Clock,
  Sparkles,
} from "lucide-react";

const GAME_MODES: {
  id: GameMode;
  name: string;
  description: string;
  icon: any;
  color: string;
}[] = [
  {
    id: "CLASSIC",
    name: "Classic Synchronized",
    description: "Standard arena format: synchronized clock with speed bonus decay for quick answers.",
    icon: Tv,
    color: "border-violet-500/50 text-violet-400 bg-violet-950/20",
  },
  {
    id: "SPEED",
    name: "Speed Blitz",
    description: "Ultra-fast rounds: 10-15s per question, strict buzzers, high adrenaline leaderboard swings.",
    icon: Zap,
    color: "border-amber-500/50 text-amber-400 bg-amber-950/20",
  },
  {
    id: "TEAM_BATTLE",
    name: "Campus Team Battle",
    description: "Branch vs Branch or College vs College. Scores aggregate into team standings in real time.",
    icon: Shield,
    color: "border-blue-500/50 text-blue-400 bg-blue-950/20",
  },
  {
    id: "PRACTICE",
    name: "Coached Practice",
    description: "Low-pressure test mode: instant solution explanations after every question attempt.",
    icon: BookOpen,
    color: "border-emerald-500/50 text-emerald-400 bg-emerald-950/20",
  },
];

function CreateRoomForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSetId = searchParams.get("setId");

  const [sets, setSets] = React.useState<QuestionSetDTO[]>([]);
  const [selectedSetId, setSelectedSetId] = React.useState<string>(preselectedSetId || "");
  const [gameMode, setGameMode] = React.useState<GameMode>("CLASSIC");
  const [maxPlayers, setMaxPlayers] = React.useState<number>(50);
  const [questionCountOverride, setQuestionCountOverride] = React.useState<number | "all">("all");
  const [timeOverride, setTimeOverride] = React.useState<number | "default">("default");

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSets() {
      try {
        const res = await fetch("/api/questions");
        if (res.ok) {
          const data = await res.json();
          const loadedSets = data.sets || [];
          setSets(loadedSets);
          if (!selectedSetId && loadedSets.length > 0) {
            setSelectedSetId(loadedSets[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSets();
  }, [selectedSetId]);

  const selectedSet = sets.find((s) => s.id === selectedSetId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetId) {
      setError("Please select a question set.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        questionSetId: selectedSetId,
        maxPlayers: Number(maxPlayers) || 50,
        gameMode,
        timePerQuestion: timeOverride === "default" ? null : Number(timeOverride),
        questionCount: questionCountOverride === "all" ? null : Number(questionCountOverride),
      };

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create room.");
      }

      router.push(`/rooms/${data.room.code}/lobby`);
    } catch (err: any) {
      setError(err.message || "Failed to create competition room.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Configuring competition parameters..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Configure Live Arena Room
          </h1>
          <Badge variant="warning">HOST CONTROLS</Badge>
        </div>
        <p className="text-xs text-slate-400">
          Set up a synchronized multiplayer match with authoritative timers, option shuffling, and anti-cheat protection.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Game Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              1. Choose Game Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GAME_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = gameMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setGameMode(mode.id)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      isSelected
                        ? `${mode.color} shadow-lg ring-1 ring-violet-500`
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-bold text-sm text-white">{mode.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {mode.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Question Set Selection & Sizing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              2. Syllabus & Question Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Question Set *
              </label>
              <select
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.questionCount || 0} Questions) - {s.topic || "QUANTITATIVE"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Questions to Play
                </label>
                <select
                  value={questionCountOverride}
                  onChange={(e) =>
                    setQuestionCountOverride(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white"
                >
                  <option value="all">
                    All Questions ({selectedSet?.questionCount || "Available"})
                  </option>
                  <option value="5">First 5 Questions (Quick Sprint)</option>
                  <option value="10">First 10 Questions (Standard)</option>
                  <option value="20">First 20 Questions (Marathon)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Time Limit Per Question
                </label>
                <select
                  value={timeOverride}
                  onChange={(e) =>
                    setTimeOverride(
                      e.target.value === "default" ? "default" : Number(e.target.value)
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white"
                >
                  <option value="default">Use Question Default (30s)</option>
                  <option value="15">15 Seconds (Fast Blitz)</option>
                  <option value="25">25 Seconds (Competitive)</option>
                  <option value="45">45 Seconds (Deep Calculation)</option>
                  <option value="60">60 Seconds (Complex DI / Geometry)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Capacity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              3. Room Capacity & Concurrency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-slate-300">Max Players Allowed</span>
                <span className="font-mono text-violet-400">{maxPlayers} Concurrent Players</span>
              </div>
              <input
                type="range"
                min={2}
                max={100}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>2 (Duel)</span>
                <span>25 (Classroom)</span>
                <span>50+ (Hall / Auditorium)</span>
                <span>100 (Grand Final)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            className="px-8 shadow-violet-500/20"
          >
            Generate PIN & Open Arena Lobby
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <React.Suspense fallback={<LoadingState message="Configuring competition room..." />}>
      <CreateRoomForm />
    </React.Suspense>
  );
}
