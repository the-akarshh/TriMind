"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionSetDTO, GameHistoryDTO } from "@/types";
import {
  Plus,
  Play,
  Copy,
  Trash2,
  Tv,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Edit,
  Archive,
  BarChart2,
  ExternalLink,
} from "lucide-react";

export default function HostDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sets, setSets] = React.useState<QuestionSetDTO[]>([]);
  const [history, setHistory] = React.useState<GameHistoryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [setsRes, histRes] = await Promise.all([
        fetch("/api/questions"),
        fetch("/api/analytics/history"),
      ]);
      if (setsRes.ok) {
        const data = await setsRes.json();
        setSets(data.sets);
      }
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDuplicate = async (id: string) => {
    setActionLoading(`dup-${id}`);
    try {
      const res = await fetch(`/api/questions/${id}?action=duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleArchive = async (id: string, currentlyArchived: boolean) => {
    setActionLoading(`arch-${id}`);
    try {
      const action = currentlyArchived ? "unarchive" : "archive";
      const res = await fetch(`/api/questions/${id}?action=${action}`, {
        method: "POST",
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question set?")) return;
    setActionLoading(`del-${id}`);
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSets((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRoom = (setId: string) => {
    router.push(`/rooms/create?setId=${setId}`);
  };

  if (loading) {
    return <LoadingState message="Loading Host Management Portal..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Host Management Portal
            </h1>
            <Badge variant="warning">HOST CONTROLS</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Create question sets, host synchronized room battles, and analyze cohort results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/questions/library">
            <Button size="md" variant="secondary" className="gap-2 text-xs">
              <Layers className="w-4 h-4 text-violet-400" />
              Question Bank
            </Button>
          </Link>
          <Link href="/questions/new">
            <Button size="md" variant="primary" className="gap-2 shadow-violet-500/20 text-xs">
              <Plus className="w-4 h-4" />
              New Question Set
            </Button>
          </Link>
          <Link href="/rooms/create">
            <Button size="md" variant="secondary" className="gap-2 text-xs">
              <Tv className="w-4 h-4 text-violet-400" />
              Create Arena Room
            </Button>
          </Link>
        </div>
      </div>

      {/* Host Quick Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Question Sets</p>
            <p className="text-2xl font-black text-white">{sets.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Recent Competitors</p>
            <p className="text-2xl font-black text-white">142 Students</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Total Rounds Hosted</p>
            <p className="text-2xl font-black text-white">{history.length} Battles</p>
          </div>
        </div>
      </div>

      {/* Question Sets Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Your Question Sets</span>
            <span className="text-xs font-mono font-bold text-slate-400">({sets.length})</span>
          </h2>
          <Link href="/questions" className="text-xs font-bold text-violet-400 hover:underline">
            View Public Library →
          </Link>
        </div>

        {sets.length === 0 ? (
          <EmptyState
            title="No Question Sets Created"
            description="Create your first question set to start hosting live competitive rounds for your college cohort."
            actionLabel="Create Question Set"
            onAction={() => router.push("/questions/new")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sets.map((set) => (
              <Card key={set.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="primary" className="text-[10px]">
                        {set.visibility}
                      </Badge>
                      {set.isArchived && <Badge variant="danger" className="text-[10px]">Archived</Badge>}
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-bold">
                      {set.questionCount || 0} Questions
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug mb-1">
                    {set.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {set.description || "Comprehensive placement preparation test set."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[150px]">Author: {set.ownerName}</span>
                    <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={() => handleCreateRoom(set.id)}
                      variant="primary"
                      size="sm"
                      className="flex-1 gap-1 text-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Host Room
                    </Button>
                    <Link href={`/questions/${set.id}/edit`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="px-2.5 text-xs"
                        title="Edit Question Set"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleDuplicate(set.id)}
                      variant="secondary"
                      size="sm"
                      className="px-2 text-xs"
                      title="Duplicate Question Set"
                      isLoading={actionLoading === `dup-${set.id}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleToggleArchive(set.id, !!set.isArchived)}
                      variant="outline"
                      size="sm"
                      className="px-2 text-xs text-slate-400 hover:text-white"
                      title={set.isArchived ? "Unarchive Set" : "Archive Set"}
                      isLoading={actionLoading === `arch-${set.id}`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(set.id)}
                      variant="danger"
                      size="sm"
                      className="px-2 text-xs"
                      title="Delete Question Set"
                      isLoading={actionLoading === `del-${set.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Previous Arena Games / Results Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Tv className="w-4 h-4 text-violet-400" />
              Previous Host Sessions & Historical Leaderboards
            </CardTitle>
            <Badge variant="secondary">Archive</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Session Title</th>
                  <th className="px-4 py-3">Room PIN</th>
                  <th className="px-4 py-3 text-center">Players</th>
                  <th className="px-4 py-3 text-center">Top Scorer</th>
                  <th className="px-4 py-3 text-center">Avg Accuracy</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5 font-bold text-white">
                      {h.questionSetTitle}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-violet-400">
                      {h.code}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-300 font-mono">
                      {h.playerCount}
                    </td>
                    <td className="px-4 py-3.5 text-center text-amber-400 font-bold">
                      {h.winnerName || "Pending"} ({h.winnerScore || 0} pts)
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-emerald-400">
                      {h.averageAccuracy}%
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/host/history/${h.id || h.code}`}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                          View & Export
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
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
