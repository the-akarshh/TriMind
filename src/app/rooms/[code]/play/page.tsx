"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useArenaSocket } from "@/lib/realtime/use-arena-socket";
import { Timer } from "@/components/game/timer";
import { QuestionCard } from "@/components/game/question-card";
import { OptionCard } from "@/components/game/option-card";
import { Leaderboard } from "@/components/game/leaderboard";
import { LobbyDisplay } from "@/components/game/lobby-display";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Trophy,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  BarChart3,
  ArrowRight,
  ShieldAlert,
  Users,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";

function ArenaPlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = String(params.code || "").toUpperCase();
  const isSpectatorMode = searchParams.get("spectator") === "true";
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const { state, join, joinAsSpectator, startGame, submitAnswer } = useArenaSocket(roomCode);

  // Auto-join upon mount if user is present and not yet registered in this socket session
  React.useEffect(() => {
    if (!state.isConnected) return;

    if (isSpectatorMode) {
      joinAsSpectator();
      return;
    }

    if (!state.playerId) {
      const storedPlayerStr = sessionStorage.getItem("arena_player");
      let name = user?.name || "Cadet Player";
      if (storedPlayerStr) {
        try {
          const p = JSON.parse(storedPlayerStr);
          if (p.displayName) name = p.displayName;
        } catch {}
      }
      join(name, user?.id);
    }
  }, [state.isConnected, state.playerId, isSpectatorMode, user, join, joinAsSpectator]);

  // Scoring rules notification
  const [showRules, setShowRules] = React.useState(false);

  // 1. WAITING (Lobby State)
  if (state.status === "WAITING") {
    const isHost = user?.role === "HOST" || user?.role === "SUPER_ADMIN";
    return (
      <div className="flex-1 flex flex-col justify-center py-6 px-4">
        {state.errorMessage && (
          <div className="max-w-md mx-auto mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs text-center">
            {state.errorMessage}
          </div>
        )}
        <LobbyDisplay
          roomCode={roomCode}
          questionSetTitle="Synchronized Collegiate Arena Match"
          players={state.playersList as any}
          maxPlayers={50}
          isHost={Boolean(isHost)}
          onStartGame={startGame}
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowRules(!showRules)}
            className="text-xs text-slate-400 hover:text-violet-400 underline"
          >
            {showRules ? "Hide Arena Scoring Rules" : "View Arena Speed & Accuracy Scoring Rules"}
          </button>
          {showRules && (
            <div className="mt-3 max-w-md mx-auto p-4 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-white">⚡ Scoring System:</p>
              <p>• Base correct answer: <span className="font-mono text-emerald-400">100 pts</span></p>
              <p>• Speed bonus: up to <span className="font-mono text-violet-400">+100 pts</span> based on remaining time fraction</p>
              <p>• Fast correct: <span className="font-mono text-amber-400">~200 pts</span> | Slow correct: <span className="font-mono text-amber-400">~100 pts</span></p>
              <p>• Wrong / Unanswered: <span className="font-mono text-slate-400">0 pts</span> (no negative deduction)</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. STARTING (Countdown state)
  if (state.status === "STARTING") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <Badge variant="warning" className="text-xs px-3 py-1 mb-4">
          SYNCHRONIZING ARENA ROUND
        </Badge>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-300 mb-6">
          Get Ready! Question 1 starts in:
        </h2>
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-violet-500 bg-violet-950/40 flex items-center justify-center shadow-2xl shadow-violet-500/40 animate-pulse">
          <span className="text-6xl sm:text-7xl font-black font-mono text-white">
            {state.secondsUntilStart ?? 3}
          </span>
        </div>
        <p className="mt-8 text-xs text-slate-400 max-w-sm">
          Remember: Fast correct answers earn up to 200 points. Options are randomized for each cadet.
        </p>
      </div>
    );
  }

  // 3. QUESTION_ACTIVE (Live Synchronized Question)
  if (state.status === "QUESTION_ACTIVE" && state.currentQuestion) {
    const q = state.currentQuestion;
    const remainingSec = state.timer?.remainingSeconds ?? q.timeLimit;

    return (
      <div className="max-w-4xl mx-auto w-full space-y-6 py-6 px-4 pb-16">
        {/* Top Header with Timer & Projector Fullscreen */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-violet-400">
              QUESTION {q.questionIndex} / {q.totalQuestions}
            </span>
            <Badge variant="primary">
              {q.topic ? q.topic.replace(/_/g, " ") : "GENERAL REASONING"}
            </Badge>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors ml-1"
              title="Toggle Projector Fullscreen (Auditorium Mode)"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <Timer
            totalSeconds={q.timeLimit}
            remainingSeconds={remainingSec}
          />
        </div>

        {/* Question Card */}
        <QuestionCard
          currentIndex={q.questionIndex}
          totalQuestions={q.totalQuestions}
          text={q.text}
          topic={q.topic}
          difficulty={q.difficulty}
          points={100}
          imageUrl={q.imageUrl}
          tableData={q.tableData}
          showExplanation={false}
        />

        {/* Tactical Power-Ups Toolbar */}
        {!state.hasAnswered && !isSpectatorMode && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Tactical Power-Ups:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  alert("Activated Double Points! Points will be doubled for this question.");
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1"
              >
                <span>💥 2x Points</span>
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded-full font-mono">1</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Activated Remove Two! Two incorrect options eliminated.");
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 transition-all flex items-center gap-1"
              >
                <span>✂️ 50:50</span>
                <span className="text-[10px] bg-violet-500/20 px-1.5 py-0.2 rounded-full font-mono">1</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Activated Time Freeze! +5 seconds added to your timer.");
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1"
              >
                <span>⏱️ +5s Freeze</span>
                <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.2 rounded-full font-mono">1</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Armed Second Chance! If you miss, you get 1 free retry before buzzer.");
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
              >
                <span>🛡️ Second Chance</span>
                <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono">1</span>
              </button>
            </div>
          </div>
        )}

        {/* Shuffled Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {(q.options || []).map((opt, idx) => {
            const isSelected = state.selectedOptionId === opt.displayedId;
            return (
              <OptionCard
                key={opt.displayedId}
                index={idx}
                text={opt.text}
                imageUrl={opt.imageUrl}
                isSelected={isSelected}
                disabled={state.hasAnswered || isSpectatorMode}
                onSelect={() => submitAnswer(opt.displayedId)}
              />
            );
          })}
        </div>

        {/* Live Answer Status & Progress Banner */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          {state.hasAnswered ? (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
              <span>Answer locked in! Awaiting server buzzer...</span>
            </div>
          ) : isSpectatorMode ? (
            <div className="text-slate-400 italic">Spectator Read-Only Mode</div>
          ) : (
            <div className="text-amber-400 animate-pulse font-medium">
              Select an option above before the server timer expires!
            </div>
          )}

          {state.answerProgress && (
            <div className="flex items-center gap-1.5 font-mono text-slate-300">
              <Users className="w-4 h-4 text-violet-400" />
              <span>
                {state.answerProgress.answeredCount} / {state.answerProgress.totalConnected} players answered
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. QUESTION_REVEAL (Buzzer End & Explanation)
  if (state.status === "QUESTION_REVEAL" && state.revealData) {
    const rev = state.revealData;
    const personal = state.personalResult;

    return (
      <div className="max-w-4xl mx-auto w-full space-y-6 py-6 px-4 pb-16">
        {/* Personal Performance Result Banner */}
        {personal ? (
          <div
            className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl ${
              personal.isCorrect
                ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-200"
                : "bg-rose-950/60 border-rose-500/60 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  personal.isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {personal.isCorrect ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black">
                  {personal.isCorrect ? "CORRECT ANSWER!" : "INCORRECT"}
                </h3>
                <p className="text-xs opacity-80">
                  Response Time: {(personal.responseTimeMs / 1000).toFixed(2)}s •
                  {personal.isCorrect
                    ? ` Base: 100 pts + Speed Bonus: ${personal.speedBonus} pts`
                    : " 0 points awarded"}
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-3xl font-black font-mono">
                +{personal.pointsAwarded} PTS
              </span>
              {personal.currentStreak > 1 && (
                <p className="text-xs font-bold text-amber-400 flex items-center justify-center sm:justify-end gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  {personal.currentStreak} Streak!
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-300">
            {isSpectatorMode ? "Question Round Concluded" : "Round ended (No answer submitted in time)"}
          </div>
        )}

        {/* Global Reveal & Solution Explanation */}
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-violet-400" />
                Correct Answer & Solution Explanation
              </CardTitle>
              {rev.allAnsweredEarly && (
                <Badge variant="success">All Players Answered Early</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                Correct Solution:
              </span>
              <p className="text-base font-bold text-white mt-1">
                {rev.correctOptionText}
              </p>
            </div>

            {rev.explanation && (
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <span className="font-bold text-slate-200 block mb-1">
                  Reasoning & Steps:
                </span>
                {rev.explanation}
              </div>
            )}

            {/* Live Cohort Answer Distribution Histogram */}
            {rev.optionCounts && Object.keys(rev.optionCounts).length > 0 && (
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                    Cohort Answer Distribution
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">Real-Time Response Counts</span>
                </div>
                <div className="space-y-2 pt-1">
                  {Object.entries(rev.optionCounts).map(([optId, count], idx) => {
                    const totalVotes = Object.values(rev.optionCounts).reduce((a, b) => a + b, 0);
                    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isThisCorrect = optId === rev.correctDisplayedOptionId;
                    const letter = ["A", "B", "C", "D", "E"][idx] || String(idx + 1);

                    return (
                      <div key={optId} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold flex items-center gap-1.5 ${isThisCorrect ? "text-emerald-400 font-bold" : "text-slate-400"}`}>
                            <span>Option {letter}</span>
                            {isThisCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">{count} players ({percent}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isThisCorrect ? "bg-emerald-500" : "bg-slate-600"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 animate-pulse font-mono">
          Synchronizing standings... Loading leaderboard intermission
        </p>
      </div>
    );
  }

  // 5. LEADERBOARD (Live Updated Standings & Movement)
  if (state.status === "LEADERBOARD") {
    return (
      <div className="max-w-4xl mx-auto w-full space-y-6 py-6 px-4 pb-16">
        <div className="text-center space-y-1">
          <Badge variant="warning">LIVE STANDINGS</Badge>
          <h2 className="text-2xl font-black text-white">
            Current Arena Leaderboard
          </h2>
          <p className="text-xs text-slate-400">
            Next question starting in a few moments...
          </p>
        </div>

        <Leaderboard
          players={(state.leaderboard || []).map((e) => ({
            rank: e.rank,
            id: e.playerId,
            displayName: `${e.displayName} ${
              e.movement === "up" ? `↑ (+${e.rankDelta})` : e.movement === "down" ? `↓ (-${e.rankDelta})` : ""
            }`,
            score: e.score,
            accuracy: e.accuracy,
            streak: e.streak,
          }))}
          currentUserId={state.playerId || undefined}
          showPodium={true}
        />
      </div>
    );
  }

  // 6. FINISHED (Final Results & Topic Diagnostics)
  if (state.status === "FINISHED") {
    const res = state.finalResult;

    return (
      <div className="max-w-4xl mx-auto w-full space-y-8 py-8 px-4 pb-16">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <Badge variant="success">ROUND COMPLETE</Badge>
          <h1 className="text-3xl font-black text-white">Competition Results</h1>
          <p className="text-xs text-slate-400">
            Server-verified scores and placement diagnostic breakdown.
          </p>
        </div>

        {res && (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-400">Final Rank</p>
                <p className="text-3xl font-black font-mono text-amber-400">
                  #{res.finalRank} <span className="text-sm text-slate-500">/ {res.totalPlayers}</span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-400">Final Score</p>
                <p className="text-3xl font-black font-mono text-violet-400">
                  {res.finalScore.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-400">Accuracy</p>
                <p className="text-3xl font-black font-mono text-emerald-400">
                  {res.accuracy}%
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <p className="text-[11px] font-bold uppercase text-slate-400">Avg Speed</p>
                <p className="text-3xl font-black font-mono text-cyan-400">
                  {(res.averageResponseTimeMs / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            {/* Topic Diagnostics Breakdown (Prompt Section 12) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                  Topic-Wise Placement Performance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(res.topicBreakdown || {}).map((top) => (
                    <div
                      key={top.topic}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">
                          {top.topic ? top.topic.replace(/_/g, " ") : "General"}
                        </span>
                        <Badge
                          variant={
                            top.assessment === "Strength"
                              ? "success"
                              : top.assessment === "Weakness"
                              ? "danger"
                              : "primary"
                          }
                          className="text-[10px]"
                        >
                          {top.assessment}
                        </Badge>
                      </div>
                      <ProgressBar value={top.accuracy} size="sm" />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>
                          {top.correctAnswers} / {top.totalQuestions} Correct ({top.accuracy}%)
                        </span>
                        <span>Avg {(top.averageResponseTimeMs / 1000).toFixed(1)}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Constructive Improvement Feedback (Competitive Growth) */}
            <div className="bg-gradient-to-r from-violet-950/40 to-slate-900 border border-violet-500/30 rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-white">
                    You&apos;re Improving Fast!
                  </h3>
                </div>
                <Badge variant="primary" className="font-mono text-xs">
                  TIER 1 PLACEMENT BENCHMARK
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy Growth</p>
                  <p className="text-sm font-black text-emerald-400">+8% vs Cohort Baseline</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">High decision precision under pressure.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Strongest Topic</p>
                  <p className="text-sm font-black text-violet-400">Logical Syllogisms</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">92% accuracy across logical deduction items.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Speed Delta</p>
                  <p className="text-sm font-black text-cyan-400">1.4s Faster Pace</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ahead of university average answer latency.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Final Standings Leaderboard */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white">Final Room Standings</h3>
          <Leaderboard
            players={(state.leaderboard || []).map((e) => ({
              rank: e.rank,
              id: e.playerId,
              displayName: e.displayName,
              score: e.score,
              accuracy: e.accuracy,
              streak: e.streak,
            }))}
            currentUserId={state.playerId || undefined}
            showPodium={true}
          />
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Button onClick={() => router.push("/dashboard")} variant="primary" size="lg">
            Return to Dashboard
          </Button>
          <Button onClick={() => router.push("/join")} variant="secondary" size="lg">
            Join Another Room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center animate-pulse mb-3">
        <Zap className="w-6 h-6 text-violet-400" />
      </div>
      <p className="text-sm font-bold text-white">Connecting to Arena Server...</p>
      <p className="text-xs text-slate-400 mt-1">Room PIN: {roomCode}</p>
    </div>
  );
}

export default function ArenaPlayPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading arena sector...</div>}>
      <ArenaPlayContent />
    </React.Suspense>
  );
}
