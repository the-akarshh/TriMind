"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { FacultyAnalyticsDTO, QuestionPerformanceDTO } from "@/types";
import {
  GraduationCap,
  Download,
  Users,
  Tv,
  Clock,
  Target,
  BarChart3,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle,
} from "lucide-react";

export default function FacultyAnalyticsPage() {
  const [data, setData] = React.useState<FacultyAnalyticsDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch("/api/analytics/faculty");
        if (res.ok) {
          const json = await res.json();
          setData(json.analytics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      window.open("/api/export?type=faculty", "_blank");
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  if (loading) {
    return <LoadingState message="Aggregating Campus Faculty Analytics..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Faculty & Institutional Analytics
            </h1>
            <Badge variant="success">CAMPUS PERFORMANCE</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Identify student aptitude struggle areas, topic accuracy trends, and high-yield placement readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={exporting}
            onClick={handleExportCSV}
            className="gap-2 text-xs shadow-violet-500/20"
          >
            <Download className="w-4 h-4" />
            Export Analytics to CSV
          </Button>
        </div>
      </div>

      {/* Campus-Level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
            <Tv className="w-3.5 h-3.5 text-violet-400" />
            <span>Total Battles</span>
          </div>
          <p className="text-2xl font-black text-white">{data.totalGames}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Completed Sessions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Students Tested</span>
          </div>
          <p className="text-2xl font-black text-white">{data.totalStudents}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Campus Cohort</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Average Accuracy</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">{data.averageAccuracy}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Overall Precision</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Average Score</span>
          </div>
          <p className="text-2xl font-black text-white">{data.averageScore} pts</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Per Candidate</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>Avg Response Time</span>
          </div>
          <p className="text-2xl font-black text-white">{data.averageResponseTime}s</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Per Question</p>
        </div>
      </div>

      {/* Topic Accuracy Breakdown Charts & Difficulty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Accuracy Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              Syllabus Accuracy by Topic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data.topicBreakdown || []).map((t) => {
              const cleanTopic = t.topic.replace(/_/g, " ");
              const isLow = t.accuracy < 60;
              return (
                <div key={t.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">{cleanTopic}</span>
                    <span className={isLow ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                      {t.accuracy}% ({t.totalAttempts} attempts)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow
                          ? "bg-gradient-to-r from-amber-500 to-rose-500"
                          : "bg-gradient-to-r from-violet-600 to-emerald-500"
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Difficulty Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Performance by Question Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data.difficultyBreakdown || []).map((d) => (
              <div key={d.difficulty} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200">{d.difficulty}</span>
                  <span className="text-slate-300 font-mono font-bold">
                    {d.accuracy}% Accuracy ({d.totalAttempts} attempts)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${d.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Critical Struggle Areas: Most Difficult & Most Incorrect Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white">
              Placement Struggle Analysis (Lowest Accuracy Questions)
            </h2>
          </div>
          <Badge variant="danger">NEEDS REMEDIATION</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.mostDifficultQuestions || []).map((q, idx) => (
            <Card key={q.questionId || idx} className="border-rose-500/30 bg-rose-950/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant="danger" className="text-[10px]">
                    {q.correctPercent}% Correct
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {q.topic}
                  </Badge>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {q.attempts} Attempts
                </span>
              </div>

              <p className="text-xs font-semibold text-white leading-relaxed mb-3">
                {q.text}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-center">
                <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-400">
                  Correct: {q.correctCount}
                </div>
                <div className="p-1.5 rounded bg-rose-950/30 border border-rose-500/20 text-rose-400">
                  Wrong: {q.wrongCount}
                </div>
                <div className="p-1.5 rounded bg-slate-800 text-slate-300">
                  Speed: {q.averageResponseTime}s
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Fastest and Slowest Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-400">
              <Zap className="w-4 h-4" />
              Fastest Answered Questions (High Fluency)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.fastestQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="max-w-[70%]">
                  <p className="font-semibold text-white truncate">{q.text}</p>
                  <p className="text-[11px] text-slate-400">{q.topic} • {q.difficulty}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-emerald-400 font-bold">{q.averageResponseTime}s avg</span>
                  <p className="text-[10px] text-slate-400">{q.correctPercent}% correct</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-400">
              <Clock className="w-4 h-4" />
              Slowest Answered Questions (High Friction)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.slowestQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="max-w-[70%]">
                  <p className="font-semibold text-white truncate">{q.text}</p>
                  <p className="text-[11px] text-slate-400">{q.topic} • {q.difficulty}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-amber-400 font-bold">{q.averageResponseTime}s avg</span>
                  <p className="text-[10px] text-slate-400">{q.correctPercent}% correct</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
