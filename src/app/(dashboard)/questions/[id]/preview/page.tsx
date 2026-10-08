"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/game/question-card";
import { OptionCard } from "@/components/game/option-card";
import { LoadingState } from "@/components/ui/loading-state";
import { QuestionSetDTO } from "@/types";
import { Play, ArrowLeft } from "lucide-react";

export default function QuestionSetPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const setId = String(params.id);

  const [set, setSet] = React.useState<QuestionSetDTO | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadSet() {
      try {
        const res = await fetch(`/api/questions/${setId}`);
        if (res.ok) {
          const data = await res.json();
          setSet(data.questionSet);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSet();
  }, [setId]);

  if (loading) {
    return <LoadingState message="Loading question set preview..." />;
  }

  if (!set) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Question set not found.</p>
        <Button onClick={() => router.push("/questions")} className="mt-4">
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <h1 className="text-2xl font-black text-white">{set.title}</h1>
          <p className="text-xs text-slate-400">{set.description}</p>
        </div>

        <Link href={`/rooms/create?setId=${set.id}`}>
          <Button variant="primary" size="md" className="gap-2">
            <Play className="w-4 h-4 fill-white" />
            Launch Live Arena
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {(set.questions || []).map((q, idx) => (
          <div key={q.id || idx} className="space-y-3">
            <QuestionCard
              currentIndex={idx + 1}
              totalQuestions={set.questions?.length || 0}
              text={q.text}
              topic={q.topic}
              difficulty={q.difficulty}
              points={q.points}
              imageUrl={q.imageUrl}
              tableData={q.tableData}
              explanation={q.explanation}
              showExplanation={true}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, oIdx) => (
                <OptionCard
                  key={opt.id || oIdx}
                  index={oIdx}
                  text={opt.text}
                  imageUrl={opt.imageUrl}
                  isCorrect={opt.isCorrect}
                  showResult={true}
                  disabled={true}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
