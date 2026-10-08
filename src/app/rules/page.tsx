import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Timer,
  Trophy,
  Users,
  Flame,
  Award,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Scale,
  Brain,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Arena Rules & Fair Play | APTITUDE ARENA",
  description:
    "Official competitive rules, scoring formulas, tactical power-ups, league standings, and anti-cheat policies of Aptitude Arena.",
};

export default function GameRulesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-violet-500/30">
      {/* Header Banner */}
      <div className="border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/40 backdrop-blur-xl pt-12 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            Official Platform Competition Regulations
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Arena Rules & Fair Play Charter
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-3xl leading-relaxed">
            Aptitude Arena operates on a <strong className="text-white">server-authoritative game engine</strong>. 
            All scores, timers, option shuffles, and league standings are validated and awarded strictly on the server 
            to guarantee 100% fair collegiate competition.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* Section 1: Server Is The Referee */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                1. Server-Authoritative Referee Architecture
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Why client-side tampering is technically impossible
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Unlike casual web quizzes, the Aptitude Arena browser client is strictly an input terminal. 
            The central server decides when questions start, when questions expire, whether answers are submitted 
            before the cutoff, and calculates all score points.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950/80 border border-rose-900/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <XCircle className="w-4 h-4" />
                Never Trusted From Client:
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Browser clocks and local timers</li>
                <li>Reported answer latency or speed</li>
                <li>Calculated scores or point requests</li>
                <li>Question order or correct option identifiers</li>
                <li>Leaderboard standings and rank requests</li>
              </ul>
            </div>

            <div className="bg-slate-950/80 border border-emerald-900/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Determined Authoritatively By Server:
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Synchronized epoch timestamps (T_start and T_end)</li>
                <li>Exact network packet arrival timestamps</li>
                <li>Per-player option permutation shuffling</li>
                <li>Instant score calculation & speed bonus curves</li>
                <li>Immutable league records and tiebreaks</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Synchronized Scoring & Speed Bonus */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                2. Real-Time Scoring Formula
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Speed rewards accuracy, but never compensates for reckless guessing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correct Answer</span>
              <p className="text-2xl font-black text-emerald-400">+100 Base Pts</p>
              <p className="text-[11px] text-slate-500">Fixed foundation for accuracy</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Speed Bonus</span>
              <p className="text-2xl font-black text-amber-400">Up to +100 Pts</p>
              <p className="text-[11px] text-slate-500">Dynamic linear decay curve</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Incorrect Answer</span>
              <p className="text-2xl font-black text-rose-400">0 Pts & Reset</p>
              <p className="text-[11px] text-slate-500">Streak resets to 0 instantly</p>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs text-slate-300">
            <p className="font-semibold text-violet-400 font-sans text-sm">Official Speed Ratio & Point Formula:</p>
            <div className="p-3 bg-slate-900 rounded-lg text-emerald-300 overflow-x-auto">
              SpeedRatio = max(0, min(1, RemainingTimeMs / TotalQuestionDurationMs))<br />
              SpeedBonus = round(100 * SpeedRatio)<br />
              TotalPoints = isCorrect ? (100 + SpeedBonus) : 0
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              <strong>Example:</strong> In a 20-second question, answering correctly in 5 seconds leaves 15 seconds remaining. 
              Speed ratio = 15/20 = 0.75. Speed bonus = 75 points. Total score awarded = 175 points.
            </p>
          </div>

          {/* Tiebreaker Hierarchy */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Leaderboard Tie-Breakers:</h3>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <li><strong className="text-white">Total Match Points:</strong> Higher score always wins.</li>
              <li><strong className="text-white">Accuracy Count:</strong> Most correct questions answered correctly breaks ties.</li>
              <li><strong className="text-white">Cumulative Time:</strong> Lowest sum of answer submission latencies across all questions.</li>
            </ol>
          </div>
        </section>

        {/* Section 3: Tactical Power-Ups */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                3. Tactical Power-Ups & Quotas
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Fair tactical abilities balanced for competitive integrity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-amber-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-300">Double Points (2x)</span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">1 use / match</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Doubles all points earned on the active question (base + speed bonus, up to 400 total pts). Only applies if your answer is correct.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-blue-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-blue-300">Remove Two (50:50)</span>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">1 use / match</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eliminates two incorrect options from your screen, narrowing your choices to 2 candidate options.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-cyan-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-cyan-300">Time Freeze (+5s)</span>
                <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">1 use / match</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Grants +5 seconds of additional server grace time to analyze complex quantitative or data interpretation problems.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-emerald-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-300">Second Chance</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">1 use / match</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Shields your streak and grants one instant retry if your initial selected answer is incorrect.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-white">Match Quota Policy:</p>
            <p>
              Each player can activate at most <strong className="text-white">3 power-ups total per match</strong>, 
              and at most <strong className="text-white">1 activation per question</strong>. 
              Power-ups cannot be activated after submitting an answer or after time has expired.
            </p>
          </div>
        </section>

        {/* Section 4: Team Battles & College Leagues */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                4. Team Battles & Fair College Leagues
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Anti-grinding logarithmic league scoring formula
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Team Battle Rules:</h3>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <li>Squads consist of <strong className="text-white">3 to 5 players</strong> per team.</li>
                <li>Team score equals the <strong className="text-white">sum of valid player scores</strong>.</li>
                <li>Spectator screen and host dashboard display dual team and individual leaderboards.</li>
                <li>Team battle disconnects do not pause the match; reconnected teammates rejoin immediately.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Fair League Ranking Formula:</h3>
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl font-mono text-xs text-purple-300 space-y-2">
                <p className="text-[11px] text-slate-400 font-sans">Preventing single players from winning through spam:</p>
                <div className="overflow-x-auto">
                  Score = sum(Top20Scores[i] * 0.95^(i-1)) + 150 * ln(1 + GamesPlayed) * sqrt(Accuracy / 100)
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Only your <strong className="text-white">top 20 games</strong> count with a decaying weight. High accuracy always triumphs over volume grinding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Anti-Cheat & Security Policy */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                5. Anti-Cheat & Security Protections
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Active automated defenses against bots, packet spoofing, and cheating
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="font-bold text-white text-sm">Bot & Script Detection</p>
                <p className="text-slate-400">
                  Submissions with an impossible reaction time under <strong className="text-rose-400">120 milliseconds</strong> are automatically flagged as scripted bot activity.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="font-bold text-white text-sm">Option Permutation Shuffling</p>
                <p className="text-slate-400">
                  Every player in the arena receives options in a unique randomized sequence. Option A for Player 1 is not Option A for Player 2.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="font-bold text-white text-sm">Answer Replay Protection</p>
                <p className="text-slate-400">
                  Duplicate answer submissions for the same question are rejected at the server engine level.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="font-bold text-white text-sm">Session Validation & Token Auth</p>
                <p className="text-slate-400">
                  Reconnections require the player’s cryptographically issued token. Duplicate concurrent sessions on the same account are kicked.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-slate-900 border border-violet-500/30 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Ready to test your aptitude under pressure?</h3>
            <p className="text-xs text-slate-400">Join a live room or challenge college peers today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/join">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2">
                Join Match <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
