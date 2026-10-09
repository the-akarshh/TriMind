"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Gamepad2,
  Trophy,
  Target,
  Zap,
  Flame,
  Award,
  TrendingUp,
  AlertCircle,
  Play,
  ArrowRight,
} from "lucide-react";
import { PlayerDashboardStats } from "@/lib/services/stats-service";

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<PlayerDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/users/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <LoadingState message="Loading your placement metrics..." />;
  }

  if (!stats) {
    return (
      <div className="py-12">
        <ErrorState
          title="Placement Metrics Unavailable"
          message="Could not load your placement statistics at this time."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {user ? user.name : "Cadet"}
            </h1>
            <Badge variant="primary" className="text-[10px]">
              {user ? user.role : "PLAYER"}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {stats.collegeName || "Collegiate Placement Arena"} • Placement Prep Season
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/daily">
            <Button size="md" variant="secondary" className="border-amber-500/40 text-amber-300 hover:text-white">
              <Flame className="w-4 h-4 mr-1.5 text-amber-400 fill-amber-400/40" />
              Daily Challenge
            </Button>
          </Link>
          <Link href="/join">
            <Button size="md" variant="primary" className="shadow-lg shadow-violet-500/20">
              <Zap className="w-4 h-4 mr-1.5 fill-white" />
              Join Live Round
            </Button>
          </Link>
          <Link href="/questions">
            <Button size="md" variant="secondary">
              Practice Solo
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label="Total Games"
          value={stats.totalGames}
          subValue="Completed rounds"
          icon={Gamepad2}
          variant="default"
        />
        <StatCard
          label="Avg Score"
          value={stats.averageScore}
          subValue="Points / game"
          icon={Trophy}
          variant="violet"
        />
        <StatCard
          label="Accuracy"
          value={`${stats.accuracy}%`}
          subValue="High precision"
          icon={Target}
          variant="emerald"
        />
        <StatCard
          label="Avg Speed"
          value={`${stats.averageResponseTime}s`}
          subValue="Per question"
          icon={Zap}
          variant="amber"
        />
        <StatCard
          label="Campus Rank"
          value={`#${stats.collegeRank}`}
          subValue="Top 5% of cohort"
          icon={Award}
          variant="violet"
        />
        <StatCard
          label="Daily Streak"
          value={`${stats.streak} Days`}
          subValue="Keep momentum"
          icon={Flame}
          variant="rose"
        />
      </div>

      {/* Daily Challenge Banner */}
      <div id="daily" className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/60 via-indigo-950/40 to-slate-900 border border-violet-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-[10px]">
              DAILY BLITZ CHALLENGE
            </Badge>
            <span className="text-xs text-amber-400 font-bold font-mono">
              +{stats.dailyChallenge?.points || 250} BONUS PTS
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            {stats.dailyChallenge?.title || "Daily Speed Math & Reasoning Sprint"}
          </h3>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Quick 5-question speed trial designed to evaluate rapid pattern recognition and calculation agility.
          </p>
        </div>
        <Link href="/join">
          <Button variant="primary" size="md" className="shrink-0 gap-2">
            <Play className="w-4 h-4 fill-white" />
            Start Daily Blitz
          </Button>
        </Link>
      </div>

      {/* Diagnostic Topic Breakdown: Strengths vs Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <CardTitle className="text-base font-bold">Topic Strengths</CardTitle>
              </div>
              <Badge variant="success">Placement Ready</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats.topicStrengths || []).map((item) => (
              <div key={item.topic} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{item.topic}</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {item.accuracy}% • {item.speed}
                  </span>
                </div>
                <ProgressBar value={item.accuracy} variant="success" size="sm" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weaknesses & Focus Areas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-base font-bold">Areas for Improvement</CardTitle>
              </div>
              <Badge variant="warning">Recommended Focus</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(stats.topicWeaknesses || []).map((item) => (
              <div key={item.topic} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>{item.topic}</span>
                  <span className="text-amber-400 font-mono font-bold">{item.accuracy}%</span>
                </div>
                <ProgressBar value={item.accuracy} variant="warning" size="sm" />
                <p className="text-[11px] text-slate-400">
                  💡 Recommended Practice: <span className="text-violet-300 font-medium">{item.recommendedSets}</span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Games Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Recent Arena Matches</CardTitle>
            <Link
              href="/questions"
              className="text-xs font-bold text-violet-400 hover:underline flex items-center gap-1"
            >
              Browse Question Sets
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Competition Round</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-center">Rank</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(stats.recentGames || []).map((game) => (
                  <tr key={game.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-white max-w-xs truncate">
                      {game.title}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{game.date}</td>
                    <td className="px-4 py-3.5 font-mono font-black text-violet-400 text-right">
                      {game.score} pts
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold font-mono">
                        #{game.rank} / {game.totalPlayers || 50}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                      {game.accuracy}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
