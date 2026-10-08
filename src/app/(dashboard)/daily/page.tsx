"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { OptionCard } from "@/components/game/option-card";
import {
  Flame,
  Trophy,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { DailyChallengeDTO, DailyLeaderboardEntry } from "@/lib/services/daily-challenge-service";
import { useAuth } from "@/components/providers/auth-provider";

export default function DailyChallengePage() {
  const { user } = useAuth();
  const [challenge, setChallenge] = React.useState<DailyChallengeDTO | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<DailyLeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Active quiz playing state
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOptionId, setSelectedOptionId] = React.useState<string | null>(null);
  const [score, setScore] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [startTime, setStartTime] = React.useState(0);
  const [timeRemaining, setTimeRemaining] = React.useState(25);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [completionResult, setCompletionResult] = React.useState<any>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [chalRes, lbRes] = await Promise.all([
        fetch("/api/daily"),
        fetch("/api/daily/leaderboard"),
      ]);

      if (chalRes.ok) {
        const cData = await chalRes.json();
        setChallenge(cData.challenge);
      }

      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData.leaderboard || []);
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

  // Timer countdown while playing
  React.useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timeout on current question -> auto advance
          handleNextQuestion(false);
          return 25;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, currentIndex]);

  const startQuiz = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setScore(0);
    setCorrectCount(0);
    setTimeRemaining(25);
    setStartTime(Date.now());
    setCompletionResult(null);
  };

  const handleSelectOption = (optId: string) => {
    if (selectedOptionId !== null) return; // Already selected
    setSelectedOptionId(optId);

    const currQ = challenge?.questions[currentIndex];
    const chosenOpt = currQ?.options.find((o) => o.id === optId);
    const isCorrect = Boolean(chosenOpt?.isCorrect);

    if (isCorrect) {
      const speedBonus = Math.floor(timeRemaining * 4);
      setScore((s) => s + 100 + speedBonus);
      setCorrectCount((c) => c + 1);
    }

    setTimeout(() => {
      handleNextQuestion(isCorrect);
    }, 800);
  };

  const handleNextQuestion = async (lastWasCorrect: boolean) => {
    setSelectedOptionId(null);
    setTimeRemaining(25);

    if (challenge && currentIndex + 1 < challenge.questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Completed all questions!
      setIsPlaying(false);
      setIsSubmitting(true);

      const totalTimeSec = Math.round((Date.now() - startTime) / 1000);
      const totalQuestions = challenge?.questions.length || 10;
      const finalAccuracy = Math.round(((correctCount + (lastWasCorrect ? 1 : 0)) / totalQuestions) * 100);
      const finalScore = score + (lastWasCorrect ? 100 : 0);

      try {
        const res = await fetch("/api/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: finalScore,
            accuracy: finalAccuracy,
            timeTakenSec: totalTimeSec,
          }),
        });
        const data = await res.json();
        setCompletionResult({
          score: finalScore,
          accuracy: finalAccuracy,
          timeTaken: totalTimeSec,
          ...data,
        });
        await loadData();
      } catch (err) {
        console.error("Failed to submit daily attempt", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) {
    return <LoadingState message="Loading today's placement challenge..." />;
  }

  const currentQ = challenge?.questions[currentIndex];

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Daily Placement Challenge
            </h1>
            <Badge variant="warning" className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              24H EXPIRES DAILY
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {challenge?.description}
          </p>
        </div>

        {/* Streak Flame Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-950/40 to-orange-950/40 border border-amber-500/30 rounded-2xl p-3 px-4 shadow-lg shadow-amber-500/5">
          <Flame className="w-6 h-6 text-amber-400 fill-amber-400/30 animate-bounce" />
          <div>
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Active Streak</p>
            <p className="text-sm font-black text-white">4 Consecutive Days</p>
          </div>
        </div>
      </div>

      {/* ACTIVE QUIZ PLAYING RUNNER */}
      {isPlaying && currentQ && (
        <Card className="border-violet-500/40 bg-slate-900/90 shadow-xl shadow-violet-500/10">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-violet-400 bg-violet-950/60 px-3 py-1 rounded-full border border-violet-800/40">
                  Question {currentIndex + 1} of {challenge?.questions.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentQ.topic}
                </span>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1.5 font-mono text-sm font-black text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-xl">
                <Clock className="w-4 h-4 animate-spin" />
                <span>{timeRemaining}s</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <h3 className="text-base sm:text-lg font-black text-white leading-relaxed">
              {currentQ.text}
            </h3>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, idx) => (
                <OptionCard
                  key={opt.id || idx}
                  index={idx}
                  text={opt.text}
                  isSelected={selectedOptionId === opt.id}
                  disabled={selectedOptionId !== null}
                  onSelect={() => opt.id && handleSelectOption(opt.id)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-400">
              <span>Points Earned: <strong className="text-amber-400 font-mono">{score}</strong></span>
              <span>Correct: <strong className="text-emerald-400 font-mono">{correctCount}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* COMPLETION SUMMARY CARD */}
      {!isPlaying && completionResult && (
        <div className="bg-gradient-to-br from-violet-950/40 to-slate-900 border border-violet-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Daily Challenge Completed!</h2>
                <p className="text-xs text-slate-400">
                  {completionResult.isRanked ? "Official ranked score submitted." : "Practice attempt completed."}
                </p>
              </div>
            </div>

            <Badge variant="primary" className="text-xs font-mono font-bold">
              +{completionResult.xpEarned} XP EARNED
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Final Score</p>
              <p className="text-lg font-black text-amber-400 font-mono">{completionResult.score} pts</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{completionResult.accuracy}%</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Time Taken</p>
              <p className="text-lg font-black text-cyan-400 font-mono">{completionResult.timeTaken}s</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Rank</p>
              <p className="text-lg font-black text-violet-400 font-mono">#{completionResult.rank}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button size="sm" variant="secondary" onClick={startQuiz}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Practice Again
            </Button>
          </div>
        </div>
      )}

      {/* START CHALLENGE HERO (When not currently playing and hasn't just completed) */}
      {!isPlaying && !completionResult && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-base font-bold">{challenge?.title}</CardTitle>
              </div>
              <Badge variant="outline">10 Questions • 4 Mins</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-xs font-bold text-white">Daily Ranked Podium</p>
                  <p className="text-[11px] text-slate-400">1st official attempt scores on campus ladder</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-white">Maintain Streak</p>
                  <p className="text-[11px] text-slate-400">Unlock milestone badges at 7, 14, and 30 days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-xs font-bold text-white">+150 Placement XP</p>
                  <p className="text-[11px] text-slate-400">Fast progression toward Gold & Diamond rank tiers</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {challenge?.hasAttempted ? "You have already completed your ranked attempt today." : "You have not attempted today's challenge yet."}
              </span>

              <Button size="md" variant="primary" onClick={startQuiz} className="shadow-lg shadow-violet-500/20">
                <Play className="w-4 h-4 mr-1.5 fill-white" />
                {challenge?.hasAttempted ? "Practice Solo" : "Start Ranked Challenge"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DAILY LEADERBOARD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Today&apos;s Cadet Leaderboard</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {leaderboard.length} submissions today
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg text-center w-12">Rank</th>
                    <th className="px-4 py-3">Cadet Name</th>
                    <th className="px-4 py-3">College</th>
                    <th className="px-4 py-3 text-center">Accuracy</th>
                    <th className="px-4 py-3 text-center">Time</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 text-center font-bold font-mono">
                        {entry.rank === 1 ? (
                          <span className="text-amber-400 font-black">#1</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-slate-300 font-black">#2</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-600 font-black">#3</span>
                        ) : (
                          <span className="text-slate-500">#{entry.rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-white">
                        {entry.displayName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono">
                        {entry.collegeName}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400">
                        {entry.accuracy}%
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono text-slate-400">
                        {entry.timeTaken}s
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-black text-amber-400 text-sm">
                        {entry.score.toLocaleString()} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
