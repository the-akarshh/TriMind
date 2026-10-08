"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Save,
  HelpCircle,
  Table as TableIcon,
  Upload,
  Eye,
  FileSpreadsheet,
  Clock,
  Tag,
} from "lucide-react";
import { Topic, Difficulty, Visibility } from "@/types";
import { QuestionFormItem } from "@/components/question/types";
import { TableBuilder } from "@/components/question/table-builder";
import { ImageUploader } from "@/components/question/image-uploader";
import { CSVImporter } from "@/components/question/csv-importer";
import { QuestionPreviewModal } from "@/components/question/question-preview-modal";

export default function CreateQuestionSetPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [topic, setTopic] = React.useState<Topic>("QUANTITATIVE");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("MEDIUM");
  const [estimatedDuration, setEstimatedDuration] = React.useState<number>(15);
  const [tags, setTags] = React.useState<string>("placement, aptiquiz");
  const [visibility, setVisibility] = React.useState<Visibility>("PUBLIC");
  const [isPublished, setIsPublished] = React.useState<boolean>(true);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Modals state
  const [isImporterOpen, setIsImporterOpen] = React.useState(false);
  const [previewQuestion, setPreviewQuestion] = React.useState<QuestionFormItem | null>(null);
  const [openTableBuilders, setOpenTableBuilders] = React.useState<Record<string, boolean>>({});

  const [questions, setQuestions] = React.useState<QuestionFormItem[]>([
    {
      id: "q-initial-1",
      text: "",
      explanation: "",
      topic: "QUANTITATIVE",
      difficulty: "MEDIUM",
      timeLimit: 30,
      points: 100,
      imageUrl: null,
      tableData: null,
      tags: "",
      options: [
        { id: "opt-1", text: "", imageUrl: null, isCorrect: true },
        { id: "opt-2", text: "", imageUrl: null, isCorrect: false },
        { id: "opt-3", text: "", imageUrl: null, isCorrect: false },
        { id: "opt-4", text: "", imageUrl: null, isCorrect: false },
      ],
    },
  ]);

  const addQuestion = () => {
    const newId = `q-${Date.now()}`;
    setQuestions((prev) => [
      ...prev,
      {
        id: newId,
        text: "",
        explanation: "",
        topic: topic,
        difficulty: difficulty,
        timeLimit: 30,
        points: 100,
        imageUrl: null,
        tableData: null,
        tags: "",
        options: [
          { id: `opt-${Date.now()}-1`, text: "", imageUrl: null, isCorrect: true },
          { id: `opt-${Date.now()}-2`, text: "", imageUrl: null, isCorrect: false },
          { id: `opt-${Date.now()}-3`, text: "", imageUrl: null, isCorrect: false },
          { id: `opt-${Date.now()}-4`, text: "", imageUrl: null, isCorrect: false },
        ],
      },
    ]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      alert("A question set must have at least one question.");
      return;
    }
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const updateQuestionField = (
    qIndex: number,
    field: keyof QuestionFormItem,
    value: any
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], [field]: value };
      return copy;
    });
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      const opts = [...q.options];
      opts[oIndex] = { ...opts[oIndex], text };
      q.options = opts;
      copy[qIndex] = q;
      return copy;
    });
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = { ...copy[qIndex] };
      q.options = q.options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIndex,
      }));
      copy[qIndex] = q;
      return copy;
    });
  };

  const handleBulkImport = (importedList: any[]) => {
    const converted: QuestionFormItem[] = importedList.map((item, idx) => ({
      id: `q-imp-${Date.now()}-${idx}`,
      text: item.text,
      explanation: item.explanation || "",
      topic: item.topic,
      difficulty: item.difficulty,
      timeLimit: item.timeLimit || 30,
      points: item.points || 100,
      imageUrl: item.imageUrl || null,
      tableData: item.tableData || null,
      tags: item.tags || "",
      options: item.options.map((opt: any, oIdx: number) => ({
        id: `opt-${Date.now()}-${idx}-${oIdx}`,
        text: opt.text,
        imageUrl: opt.imageUrl || null,
        isCorrect: opt.isCorrect,
      })),
    }));

    // If initial question was completely blank, replace it
    if (
      questions.length === 1 &&
      !questions[0].text.trim() &&
      questions[0].options.every((o) => !o.text.trim())
    ) {
      setQuestions(converted);
    } else {
      setQuestions((prev) => [...prev, ...converted]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide a title for this question set.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question #${i + 1} has empty question text.`);
        return;
      }
      const filledOptions = q.options.filter((o) => o.text.trim().length > 0);
      if (filledOptions.length < 2) {
        setError(`Question #${i + 1} must have at least 2 non-empty options.`);
        return;
      }
      if (!q.options.some((o) => o.isCorrect)) {
        setError(`Question #${i + 1} must have at least one marked correct option.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        topic,
        difficulty,
        estimatedDuration: Number(estimatedDuration) || 15,
        tags,
        isPublished,
        visibility,
        questions: questions.map((q, idx) => ({
          text: q.text,
          explanation: q.explanation || null,
          topic: q.topic,
          difficulty: q.difficulty,
          timeLimit: Number(q.timeLimit) || 30,
          points: Number(q.points) || 100,
          imageUrl: q.imageUrl || null,
          tableData: q.tableData || null,
          tags: q.tags || null,
          order: idx + 1,
          options: q.options.map((opt) => ({
            text: opt.text,
            imageUrl: opt.imageUrl || null,
            isCorrect: opt.isCorrect,
          })),
        })),
      };

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save question set.");
      }

      router.push("/host");
    } catch (err: any) {
      setError(err.message || "Failed to save question set.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Author Question Set
          </h1>
          <p className="text-xs text-slate-400">
            Author aptitude questions with diagrams, tabular data, timers, and test preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsImporterOpen(true)}
            className="gap-1.5 text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Bulk CSV/JSON Import
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Set Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Set Metadata & Syllabus Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Set Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. TCS NQT & Infosys Quantitative Sprint"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of concepts covered in this round..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Primary Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as Topic)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white"
                >
                  <option value="QUANTITATIVE">Quantitative</option>
                  <option value="LOGICAL">Logical</option>
                  <option value="VERBAL">Verbal</option>
                  <option value="DATA_INTERPRETATION">Data Interpretation</option>
                  <option value="GENERAL_REASONING">General Reasoning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Set Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Estimated Duration (mins)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. tcs, infosys, speed-math"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as Visibility)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white"
                >
                  <option value="PUBLIC">Public (All colleges)</option>
                  <option value="COLLEGE_ONLY">College Only (Campus cohort)</option>
                  <option value="PRIVATE">Private (Only you)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List & Reordering */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Questions</span>
              <span className="text-xs font-mono text-slate-400">({questions.length})</span>
            </h2>
            <Button
              type="button"
              onClick={addQuestion}
              variant="outline"
              size="sm"
              className="gap-1.5 border-violet-500/40"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>

          {questions.map((q, qIndex) => (
            <Card key={q.id} className="border-slate-800 bg-slate-900/90 relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-violet-600/30 text-violet-400 font-mono font-bold text-xs flex items-center justify-center">
                    {qIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Question #{qIndex + 1}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {q.topic}
                  </Badge>
                </div>

                {/* Actions: Reordering, Preview, Delete */}
                <div className="flex items-center gap-1.5">
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
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIndex, "up")}
                    disabled={qIndex === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                    title="Move Question Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIndex, "down")}
                    disabled={qIndex === questions.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                    title="Move Question Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 ml-1"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Question Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Question Text *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={q.text}
                    onChange={(e) => updateQuestionField(qIndex, "text", e.target.value)}
                    placeholder="e.g. A train running at 54 km/h takes 20 seconds to pass a pole..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Topic, Difficulty, Time Limit, Points row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Topic
                    </label>
                    <select
                      value={q.topic}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "topic", e.target.value as Topic)
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white"
                    >
                      <option value="QUANTITATIVE">Quantitative</option>
                      <option value="LOGICAL">Logical</option>
                      <option value="VERBAL">Verbal</option>
                      <option value="DATA_INTERPRETATION">Data Interp</option>
                      <option value="GENERAL_REASONING">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={q.difficulty}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "difficulty", e.target.value as Difficulty)
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Time Limit (sec)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "timeLimit", Number(e.target.value))
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={q.points}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "points", Number(e.target.value))
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Image Upload Component */}
                <ImageUploader
                  value={q.imageUrl}
                  onChange={(url) => updateQuestionField(qIndex, "imageUrl", url)}
                />

                {/* Collapsible Table Builder for Data Interpretation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenTableBuilders((prev) => ({
                          ...prev,
                          [q.id]: !prev[q.id],
                        }))
                      }
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>
                        {openTableBuilders[q.id]
                          ? "Hide Table Builder"
                          : q.tableData
                          ? "Edit Tabular Data (Active Table Attached)"
                          : "+ Attach Structured Data Table"}
                      </span>
                    </button>
                    {q.tableData && (
                      <button
                        type="button"
                        onClick={() => updateQuestionField(qIndex, "tableData", null)}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remove Table
                      </button>
                    )}
                  </div>

                  {(openTableBuilders[q.id] || q.tableData) && (
                    <TableBuilder
                      initialData={q.tableData}
                      onChange={(json) => updateQuestionField(qIndex, "tableData", json)}
                    />
                  )}
                </div>

                {/* Options List */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Answer Options (Click letter to mark correct)
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const letter = ["A", "B", "C", "D", "E", "F"][oIdx];
                      return (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectOption(qIndex, oIdx)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border transition-colors shrink-0 ${
                              opt.isCorrect
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30 shadow-md"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                            }`}
                            title={opt.isCorrect ? "Correct Option" : "Click to mark as correct"}
                          >
                            {opt.isCorrect ? <CheckCircle className="w-4 h-4" /> : letter}
                          </button>
                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) =>
                              updateOptionText(qIndex, oIdx, e.target.value)
                            }
                            placeholder={`Option ${letter} text`}
                            className={`flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border text-xs text-white focus:outline-none focus:ring-1 ${
                              opt.isCorrect
                                ? "border-emerald-500/60 focus:ring-emerald-500"
                                : "border-slate-700 focus:ring-violet-500"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Solution Explanation */}
                <div className="pt-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                    Explanation & Shortcut Steps
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) =>
                      updateQuestionField(qIndex, "explanation", e.target.value)
                    }
                    placeholder="Explain the shortcut, formula, or deductive steps..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
            isLoading={loading}
            className="gap-2 px-8 shadow-violet-500/20"
          >
            <Save className="w-4 h-4" />
            Publish Question Set
          </Button>
        </div>
      </form>

      {/* CSV / JSON Importer Modal */}
      <CSVImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={handleBulkImport}
      />

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
