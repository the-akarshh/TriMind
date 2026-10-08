"use client";

import * as React from "react";
import { Modal } from "../ui/modal";
import { QuestionCard } from "../game/question-card";
import { OptionCard } from "../game/option-card";
import { Button } from "../ui/button";
import { QuestionFormItem } from "./types";
import { Eye, RotateCcw, CheckCircle, HelpCircle } from "lucide-react";

export interface QuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: {
    text: string;
    explanation?: string | null;
    topic: string;
    difficulty: string;
    points: number;
    timeLimit: number;
    imageUrl?: string | null;
    tableData?: string | null;
    options: {
      text: string;
      imageUrl?: string | null;
      isCorrect: boolean;
    }[];
  };
}

export function QuestionPreviewModal({
  isOpen,
  onClose,
  question,
}: QuestionPreviewModalProps) {
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(question.timeLimit || 30);

  // Reset state on open or question change
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIdx(null);
      setRevealed(false);
      setTimeLeft(question.timeLimit || 30);
    }
  }, [isOpen, question]);

  // Countdown timer simulation
  React.useEffect(() => {
    if (!isOpen || revealed || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, revealed, timeLeft]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelectedIdx(idx);
    setRevealed(true);
  };

  const handleReset = () => {
    setSelectedIdx(null);
    setRevealed(false);
    setTimeLeft(question.timeLimit || 30);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive Gameplay Test & Preview"
      className="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Simulating Arena Timer Bar */}
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Live Simulator</span>
            <span className="font-mono text-violet-400 font-bold">
              Time: {timeLeft}s / {question.timeLimit}s
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs h-7 gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRevealed(!revealed)}
              className="text-xs h-7 gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-violet-400" />
              {revealed ? "Hide Solution" : "Reveal Solution"}
            </Button>
          </div>
        </div>

        {/* Live Question Card */}
        <QuestionCard
          currentIndex={1}
          totalQuestions={1}
          text={question.text || "Question Text"}
          topic={question.topic}
          difficulty={question.difficulty}
          points={question.points || 100}
          imageUrl={question.imageUrl}
          tableData={question.tableData}
          explanation={question.explanation}
          showExplanation={revealed}
        />

        {/* Interactive Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((opt, oIdx) => (
            <OptionCard
              key={oIdx}
              index={oIdx}
              text={opt.text || `Option ${String.fromCharCode(65 + oIdx)}`}
              imageUrl={opt.imageUrl}
              isCorrect={opt.isCorrect}
              isSelected={selectedIdx === oIdx}
              showResult={revealed}
              disabled={revealed}
              onSelect={() => handleSelect(oIdx)}
            />
          ))}
        </div>

        {revealed && (
          <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs text-violet-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                {selectedIdx !== null
                  ? question.options[selectedIdx]?.isCorrect
                    ? "Great job! Selected option is correct (+speed bonus)."
                    : "Incorrect option selected."
                  : "Time elapsed. Solution revealed."}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Done Testing
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
