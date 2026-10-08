"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { QuestionSetDTO, Topic } from "@/types";
import {
  Plus,
  Play,
  Search,
  BookOpen,
  Filter,
  Layers,
  Edit,
  Eye,
} from "lucide-react";
import { canCreateQuestionSets } from "@/lib/auth/rbac";

export default function QuestionsLibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sets, setSets] = React.useState<QuestionSetDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState<string>("ALL");

  React.useEffect(() => {
    async function loadSets() {
      try {
        const res = await fetch("/api/questions");
        if (res.ok) {
          const data = await res.json();
          setSets(data.sets);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSets();
  }, []);

  const filteredSets = sets.filter((s) => {
    const matchesTopic = selectedTopic === "ALL" || s.topic === selectedTopic;
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
      (s.tags && s.tags.toLowerCase().includes(search.toLowerCase()));
    return matchesTopic && matchesSearch;
  });

  if (loading) {
    return <LoadingState message="Loading question library..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Question Sets & Syllabus Library
          </h1>
          <p className="text-xs text-slate-400">
            High-yield placement aptitude sets authored by faculty and campus quizmasters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/questions/library">
            <Button size="md" variant="secondary" className="gap-2 text-xs">
              <Layers className="w-4 h-4 text-violet-400" />
              Question Bank
            </Button>
          </Link>

          {user && canCreateQuestionSets(user.role) && (
            <Link href="/questions/new">
              <Button size="md" variant="primary" className="gap-2 text-xs shadow-violet-500/20">
                <Plus className="w-4 h-4" />
                Create Question Set
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by keyword, topic, or company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
        >
          <option value="ALL">All Topics</option>
          <option value="QUANTITATIVE">Quantitative</option>
          <option value="LOGICAL">Logical</option>
          <option value="VERBAL">Verbal</option>
          <option value="DATA_INTERPRETATION">Data Interpretation</option>
          <option value="GENERAL_REASONING">General Reasoning</option>
        </select>
      </div>

      {/* Grid of Question Sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSets.map((set) => (
          <Card key={set.id} hoverEffect className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant="primary" className="text-[10px]">
                    {set.visibility}
                  </Badge>
                  {set.isArchived && <Badge variant="danger" className="text-[10px]">Archived</Badge>}
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {set.questionCount || 0} Questions
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                {set.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {set.description || "Core logical and numerical aptitude practice."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[140px]">Author: {set.ownerName}</span>
                <span>{new Date(set.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/rooms/create?setId=${set.id}`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full gap-1 text-xs">
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Host Room
                  </Button>
                </Link>
                {user && canCreateQuestionSets(user.role) && (
                  <Button
                    onClick={() => router.push(`/questions/${set.id}/edit`)}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2.5"
                    title="Edit Question Set"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-300" />
                  </Button>
                )}
                <Button
                  onClick={() => router.push(`/questions/${set.id}/preview`)}
                  variant="secondary"
                  size="sm"
                  className="text-xs px-2.5"
                  title="Inspect Question Set"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
