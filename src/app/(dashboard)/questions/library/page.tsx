"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { QuestionDTO, QuestionSetDTO, Topic, Difficulty } from "@/types";
import { QuestionPreviewModal } from "@/components/question/question-preview-modal";
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  Eye,
  CheckSquare,
  Square,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

export default function QuestionLibraryPage() {
  const router = useRouter();
  const [questions, setQuestions] = React.useState<QuestionDTO[]>([]);
  const [mySets, setMySets] = React.useState<QuestionSetDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedTopic, setSelectedTopic] = React.useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>("ALL");
  const [selectedTag, setSelectedTag] = React.useState<string>("");

  // Multi-select for batch bundling into sets
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [targetSetId, setTargetSetId] = React.useState<string>("");
  const [previewQuestion, setPreviewQuestion] = React.useState<any | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [qRes, sRes] = await Promise.all([
          fetch("/api/questions/library"),
          fetch("/api/questions"),
        ]);
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestions(qData.questions);
        }
        if (sRes.ok) {
          const sData = await sRes.json();
          setMySets(sData.sets);
          if (sData.sets.length > 0) {
            setTargetSetId(sData.sets[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const matchesTopic = selectedTopic === "ALL" || q.topic === selectedTopic;
    const matchesDiff = selectedDifficulty === "ALL" || q.difficulty === selectedDifficulty;
    const matchesSearch =
      !search ||
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      (q.explanation && q.explanation.toLowerCase().includes(search.toLowerCase())) ||
      (q.tags && q.tags.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !selectedTag || (q.tags && q.tags.toLowerCase().includes(selectedTag.toLowerCase()));

    return matchesTopic && matchesDiff && matchesSearch && matchesTag;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id || q.text)));
    }
  };

  const handleAddToSet = async () => {
    if (!targetSetId) {
      alert("Please select a target question set.");
      return;
    }
    if (selectedIds.size === 0) {
      alert("Please select at least one question to add.");
      return;
    }

    const chosenQuestions = questions.filter((q) => selectedIds.has(q.id || q.text));

    try {
      const setRes = await fetch(`/api/questions/${targetSetId}`);
      if (!setRes.ok) throw new Error("Failed to fetch target set.");
      const setData = await setRes.json();
      const currentSet: QuestionSetDTO = setData.questionSet;

      const combinedQuestions = [
        ...(currentSet.questions || []),
        ...chosenQuestions.map((q, idx) => ({
          ...q,
          order: (currentSet.questions?.length || 0) + idx + 1,
        })),
      ];

      const updateRes = await fetch(`/api/questions/${targetSetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentSet.title,
          description: currentSet.description,
          topic: currentSet.topic || "QUANTITATIVE",
          difficulty: currentSet.difficulty || "MEDIUM",
          estimatedDuration: currentSet.estimatedDuration || 15,
          tags: currentSet.tags,
          visibility: currentSet.visibility,
          questions: combinedQuestions as any,
        }),
      });

      if (updateRes.ok) {
        alert(`Successfully added ${selectedIds.size} questions to '${currentSet.title}'!`);
        setSelectedIds(new Set());
        router.push(`/questions/${targetSetId}/edit`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to add questions to set.");
    }
  };

  const getDifficultyVariant = (d: string) => {
    switch (d.toUpperCase()) {
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

  if (loading) {
    return <LoadingState message="Loading Question Library..." />;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Aptitude Question Bank & Library
            </h1>
            <Badge variant="primary">GLOBAL REPOSITORY</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Search, preview, and assemble questions across Quantitative, Logical, Verbal, and Data Interpretation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/questions/new">
            <Button size="md" variant="primary" className="gap-2 shadow-violet-500/20">
              <Plus className="w-4 h-4" />
              Author New Set
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question text, formulas, tags (e.g. speed, work, seating)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              <option value="ALL">All Topics</option>
              <option value="QUANTITATIVE">Quantitative</option>
              <option value="LOGICAL">Logical</option>
              <option value="VERBAL">Verbal</option>
              <option value="DATA_INTERPRETATION">Data Interpretation</option>
              <option value="GENERAL_REASONING">General Reasoning</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
        </div>

        {/* Batch Assembly Action Bar */}
        {selectedIds.size > 0 && (
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-violet-950/20 p-2.5 rounded-xl border border-violet-500/30">
            <div className="flex items-center gap-2 text-xs text-violet-300 font-semibold">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>{selectedIds.size} questions selected for assembly</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Target Set:</span>
              <select
                value={targetSetId}
                onChange={(e) => setTargetSetId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white max-w-[200px]"
              >
                {mySets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddToSet}
                className="text-xs"
              >
                Add to Set
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Select All and Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <button
          type="button"
          onClick={selectAllFiltered}
          className="flex items-center gap-1.5 hover:text-white font-medium"
        >
          {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-violet-400" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          <span>Select All Filtered ({filteredQuestions.length})</span>
        </button>

        <span>Showing {filteredQuestions.length} questions in bank</span>
      </div>

      {/* Question Cards Grid */}
      <div className="space-y-4">
        {filteredQuestions.map((q, idx) => {
          const qKey = q.id || `${q.text}-${idx}`;
          const isSelected = selectedIds.has(qKey);

          return (
            <Card
              key={qKey}
              className={`border-slate-800 transition-all ${
                isSelected ? "border-violet-500/80 bg-violet-950/15" : "bg-slate-900/80"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleSelect(qKey)}
                  className="mt-1 text-slate-400 hover:text-violet-400 shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-violet-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getDifficultyVariant(q.difficulty)}>
                        {q.difficulty}
                      </Badge>
                      <Badge variant="secondary">
                        {q.topic.replace(/_/g, " ")}
                      </Badge>
                      {q.tags && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          #{q.tags}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {q.timeLimit}s
                      </span>
                      <span>+{q.points} PTS</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewQuestion(q)}
                        className="text-xs h-7 gap-1 text-slate-300 hover:text-white"
                      >
                        <Eye className="w-3.5 h-3.5 text-violet-400" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {q.text}
                  </p>

                  {/* Options row preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt.id || oIdx}
                        className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          opt.isCorrect
                            ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-medium"
                            : "bg-slate-950 border border-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="truncate">
                          <strong className="mr-1">{String.fromCharCode(65 + oIdx)}.</strong>
                          {opt.text}
                        </span>
                        {opt.isCorrect && <span className="text-[10px] text-emerald-400 font-bold shrink-0">✓ Correct</span>}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-slate-400 line-clamp-1 italic pt-1">
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Interactive Gameplay Preview Modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          isOpen={!!previewQuestion}
          onClose={() => setPreviewQuestion(null)}
          question={previewQuestion}
        />
      )}
    </div>
  );
}
