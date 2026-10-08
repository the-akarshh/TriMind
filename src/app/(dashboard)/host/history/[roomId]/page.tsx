"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { GameSessionDetailDTO } from "@/types";
import {
  ArrowLeft,
  Download,
  Trophy,
  Users,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Tv,
} from "lucide-react";

export default function GameSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = String(params.roomId);

  const [detail, setDetail] = React.useState<GameSessionDetailDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    async function loadDetail() {
      try {
        const res = await fetch(`/api/analytics/history/${roomId}`);
        if (res.ok) {
          const json = await res.json();
          setDetail(json.session);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [roomId]);

  const handleExportCSV = () => {
    setExporting(true);
    window.open(`/api/export?roomId=${roomId}`, "_blank");
    setTimeout(() => setExporting(false), 1000);
  };

  if (loading) {
    return <LoadingState message="Loading game session breakdown..." />;
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Match session not found.</p>
        <Button onClick={() => router.push("/host")} className="mt-4">
          Back to Host Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sessions
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {detail.room.questionSetTitle || "Aptitude Battle Session"}
            </h1>
            <Badge variant="primary" className="font-mono">
              PIN: {detail.room.code}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Host: {detail.room.hostName || "Host"} • Played: {new Date(detail.room.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={exporting}
            onClick={handleExportCSV}
            className="gap-2 text-xs shadow-violet-500/20"
          >
            <Download className="w-4 h-4" />
            Export Results CSV
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-400">Total Competitors</p>
          <p className="text-2xl font-black text-white">{detail.leaderboard.length} Players</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-400">Session Winner</p>
          <p className="text-xl font-black text-amber-400 truncate">
            {detail.leaderboard[0]?.displayName || "None"}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-400">Winning Score</p>
          <p className="text-2xl font-black text-violet-400">
            {detail.leaderboard[0]?.score || 0} pts
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-400">Avg Accuracy</p>
          <p className="text-2xl font-black text-emerald-400">
            {Math.round(
              detail.leaderboard.reduce((a, b) => a + b.accuracy, 0) /
                (detail.leaderboard.length || 1)
            )}
            %
          </p>
        </div>
      </div>

      {/* Official Standings / Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Final Match Standings
            </CardTitle>
            <Badge variant="secondary">{detail.leaderboard.length} Verified Entries</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Rank</th>
                  <th className="px-4 py-3">Player Name</th>
                  <th className="px-4 py-3 text-center">Final Score</th>
                  <th className="px-4 py-3 text-center">Accuracy</th>
                  <th className="px-4 py-3 text-center">Avg Speed</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {detail.playerResults.map((p) => (
                  <tr key={p.playerId} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5 font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs ${
                          p.rank === 1
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : p.rank === 2
                            ? "bg-slate-400/20 text-slate-300 border border-slate-400/40"
                            : p.rank === 3
                            ? "bg-amber-700/20 text-amber-600 border border-amber-700/40"
                            : "text-slate-400"
                        }`}
                      >
                        #{p.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      {p.displayName}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-violet-400">
                      {p.score.toLocaleString()} pts
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-emerald-400">
                      {p.accuracy}%
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-300">
                      {p.avgResponseTime}s
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-amber-400">
                      {detail.leaderboard.find((l) => l.playerId === p.playerId)?.streak || 0} 🔥
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Question Performance Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {detail.questionAnalytics.map((q, idx) => (
            <Card key={idx} className="border-slate-800 bg-slate-900/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                <Badge variant={q.correctPercent > 60 ? "success" : "danger"} className="text-[10px]">
                  {q.correctPercent}% Correct
                </Badge>
              </div>
              <p className="text-xs font-semibold text-white line-clamp-2 mb-3">
                {q.text}
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span>Avg Speed: {q.averageResponseTime}s</span>
                <span>{q.attempts} Attempts</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
