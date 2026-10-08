import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/layout/footer";
import {
  Users,
  Trophy,
  BarChart3,
  Flame,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-[#0e1424] to-[#080c14]">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Collegiate Aptitude & Reasoning Arena</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Practice aptitude. <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Compete live.
            </span> <br />
            Get placement-ready.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
            A real-time multiplayer aptitude arena engineered for college placement prep.
            Compete synchronously with 50+ batchmates in high-pressure speed and accuracy rounds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/join" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto text-base px-8 py-4 shadow-violet-500/20">
                <Zap className="w-5 h-5 mr-1.5 fill-white" />
                Join Game Room
              </Button>
            </Link>
            <Link href="/rooms/create" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8 py-4 border-slate-700">
                Create Room
                <ArrowRight className="w-4 h-4 ml-2 text-slate-400" />
              </Button>
            </Link>
          </div>

          {/* Key Quick Stats */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left border-t border-slate-800/80 mt-10">
            <div>
              <p className="text-2xl font-black text-white font-mono">50+ Players</p>
              <p className="text-xs text-slate-400">Concurrent room scale</p>
            </div>
            <div>
              <p className="text-2xl font-black text-violet-400 font-mono">&lt; 50ms</p>
              <p className="text-xs text-slate-400">Server-authoritative sync</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400 font-mono">5 Core Topics</p>
              <p className="text-xs text-slate-400">Placement exam syllabus</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-400 font-mono">Collegiate Leagues</p>
              <p className="text-xs text-slate-400">Campus vs Campus rankings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge variant="primary">ENGINEERED FOR PLACEMENTS</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything you need to master competitive recruitment tests
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Replace boring solitary MCQ practice with live, synchronized gaming dynamics that simulate real high-stakes campus placement drives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Live Multiplayer */}
          <Card hoverEffect className="relative">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg">Live Multiplayer Battles</CardTitle>
            </CardHeader>
            <CardDescription className="text-sm">
              Synchronize up to 50+ students in one room with countdown timers and instant question delivery. No client-side cheating or desynchronization.
            </CardDescription>
          </Card>

          {/* Card 2: Real-Time Leaderboard */}
          <Card hoverEffect className="relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg">Real-Time Leaderboard</CardTitle>
            </CardHeader>
            <CardDescription className="text-sm">
              Live rank calculation based on response speed, accuracy, and answer streaks. Experience the adrenaline of a competitive esports podium.
            </CardDescription>
          </Card>

          {/* Card 3: College Leagues */}
          <Card hoverEffect className="relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg">Inter-College Leagues</CardTitle>
            </CardHeader>
            <CardDescription className="text-sm">
              Represent your institution in seasonal leagues. Track college vs college overall scores and climb the university leaderboard.
            </CardDescription>
          </Card>

          {/* Card 4: Placement Analytics */}
          <Card hoverEffect className="relative">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg">Placement Diagnostic Analytics</CardTitle>
            </CardHeader>
            <CardDescription className="text-sm">
              Deep dive into speed-versus-accuracy metrics, topic strengths, and identified weak areas across Quantitative, Logical, and Verbal reasoning.
            </CardDescription>
          </Card>

          {/* Card 5: Daily Challenges */}
          <Card hoverEffect className="relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg">Daily Aptitude Sprint</CardTitle>
            </CardHeader>
            <CardDescription className="text-sm">
              A daily 5-minute timed challenge to maintain student consistency and build continuous streak momentum leading up to placement season.
            </CardDescription>
          </Card>

          {/* Card 6: Question Authoring */}
          <Card hoverEffect className="relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-lg">Faculty Question Authoring</CardTitle>
            </CardHeader>
            <CardDescription className="text-sm">
              Comprehensive question sets creator for instructors: custom time limits, tabular data interpretation tables, and detailed solution explanations.
            </CardDescription>
          </Card>
        </div>
      </section>

      {/* The Competition System Explained */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-slate-900/30">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <Badge variant="warning">HOW IT WORKS</Badge>
            <h2 className="text-3xl font-black text-white">
              The Server-Authoritative Competition System
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              How Aptitude Arena guarantees competitive fairness and maximum learning retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="w-8 h-8 rounded-xl bg-violet-600/30 text-violet-400 flex items-center justify-center font-black text-sm">
                1
              </span>
              <h3 className="font-bold text-white text-base">Room Code & Quick Lobby</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The host creates a competition room with a 6-character room PIN (e.g. <span className="font-mono text-violet-300">A7K9P2</span>). Students join from mobile or desktop in seconds without app downloads.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="w-8 h-8 rounded-xl bg-violet-600/30 text-violet-400 flex items-center justify-center font-black text-sm">
                2
              </span>
              <h3 className="font-bold text-white text-base">Synchronized Speed Scoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Questions unlock simultaneously for all players. Fast correct answers award up to 100 bonus speed points, while consecutive correct answers build multiplier streaks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <span className="w-8 h-8 rounded-xl bg-violet-600/30 text-violet-400 flex items-center justify-center font-black text-sm">
                3
              </span>
              <h3 className="font-bold text-white text-base">Instant Explanations & Ranks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As the countdown ends, the server securely reveals the correct answer and comprehensive explanation, recalculating the live podium standings instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
