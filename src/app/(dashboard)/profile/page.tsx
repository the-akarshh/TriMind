"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LoadingState } from "@/components/ui/loading-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PlayerProfileAnalyticsDTO } from "@/types";
import { ProgressionDTO } from "@/lib/services/progression-service";
import {
  Mail,
  GraduationCap,
  Trophy,
  BarChart3,
  Flame,
  Award,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<PlayerProfileAnalyticsDTO | null>(null);
  const [progression, setProgression] = React.useState<ProgressionDTO | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, progRes] = await Promise.all([
          fetch("/api/analytics/player"),
          fetch("/api/progression"),
        ]);

        if (profileRes.ok) {
          const json = await profileRes.json();
          setProfile(json.profile);
        }

        if (progRes.ok) {
          const pJson = await progRes.json();
          setProgression(pJson.progression);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Cadet Profile & Placement Stats..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Cadet Profile & Progression
        </h1>
        <p className="text-xs text-slate-400">
          Competitive XP progression, unlocked achievement medals, and cognitive topic mastery for campus placements.
        </p>
      </div>

      {/* User & Progression Hero Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-800">
            <Avatar
              name={user?.name || "Cadet"}
              size="xl"
              className="border-4 border-violet-500/40"
            />
            <div className="text-center sm:text-left space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-white">{user?.name || "Player Cadet"}</h2>
                <Badge variant="primary">{user?.role || "PLAYER"}</Badge>
                {progression && (
                  <Badge variant="warning" className="font-mono font-bold">
                    {progression.rankTier} TIER
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email || "student@apex.edu"}
              </p>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
                {user?.collegeName || "Apex Institute of Technology"}
              </p>
            </div>
          </div>

          {/* XP & Level Progression Bar */}
          {progression && (
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-400 text-sm">
                    LEVEL {progression.level}
                  </span>
                  <span className="text-slate-400 font-semibold">•</span>
                  <span className="text-slate-300 font-bold">{progression.rankTier} CADET</span>
                </div>
                <span className="font-mono font-bold text-violet-300 text-xs">
                  {progression.xpCurrentLevel} / {progression.xpNextLevel} XP ({progression.levelProgressPercent}%)
                </span>
              </div>
              <ProgressBar value={progression.levelProgressPercent} />
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Total XP Earned: {progression.xp.toLocaleString()} XP</span>
                <span>Next Tier: Level {progression.level + 1}</span>
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Total Battles</p>
              <p className="text-2xl font-black font-mono text-white">
                {profile?.totalGames || 18}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Victories</p>
              <p className="text-2xl font-black font-mono text-amber-400">
                {profile?.totalWins || 5} 🏆
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Overall Accuracy</p>
              <p className="text-2xl font-black font-mono text-emerald-400">
                {profile?.overallAccuracy || 78.5}%
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-[11px] font-bold uppercase text-slate-400 mb-1">Daily Streak</p>
              <p className="text-2xl font-black font-mono text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/40" />
                {progression?.streak || 4}d
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Medals Grid */}
      {progression && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-base font-bold">Placement Medals & Achievements</CardTitle>
              </div>
              <Badge variant="outline">
                {(progression.achievements || []).filter((a) => a.unlocked).length} / {(progression.achievements || []).length} Unlocked
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(progression.achievements || []).map((ach) => (
                <div
                  key={ach.code}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                    ach.unlocked
                      ? "bg-slate-900/90 border-violet-500/30"
                      : "bg-slate-950/40 border-slate-800/60 opacity-60"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.unlocked
                        ? "bg-violet-600/20 border border-violet-500/40 text-violet-400"
                        : "bg-slate-800/40 border border-slate-700/40 text-slate-600"
                    }`}
                  >
                    {ach.unlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold truncate ${ach.unlocked ? "text-white" : "text-slate-400"}`}>
                        {ach.title}
                      </p>
                      {ach.unlocked && (
                        <span className="text-[10px] text-emerald-400 font-bold">UNLOCKED</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {ach.description}
                    </p>
                    {!ach.unlocked && (
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                          <span>Progress</span>
                          <span>{ach.progress} / {ach.targetValue}</span>
                        </div>
                        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-violet-500"
                            style={{ width: `${Math.min(100, Math.round((ach.progress / ach.targetValue) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Strengths Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            Topic Cognitive Mastery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(profile?.topicStrengths || []).map((t) => (
            <div key={t.topic} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-200">{t.topic.replace(/_/g, " ")}</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {t.accuracy}% ({t.attempts} attempts)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${t.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
