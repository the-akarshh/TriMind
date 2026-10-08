"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { Leaderboard } from "@/components/game/leaderboard";
import { BracketViewer } from "@/components/tournament/bracket-viewer";
import { CreateTournamentModal } from "@/components/tournament/create-tournament-modal";
import { ChallengeModal } from "@/components/tournament/challenge-modal";
import {
  Trophy,
  Shield,
  Calendar,
  Award,
  Swords,
  RefreshCw,
  Plus,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
  BookOpen,
  Lock,
  Archive,
} from "lucide-react";
import { LeagueDTO, TournamentDTO, BracketRoundDTO, CollegeChallengeDTO, Topic } from "@/types";
import { TopicLeaderboardEntry } from "@/lib/services/topic-league-service";
import { SeasonDTO } from "@/lib/services/season-service";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";

export default function LeagueDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<"standings" | "topics" | "tournaments" | "clashes" | "seasons">("standings");
  const [divisionFilter, setDivisionFilter] = React.useState<string>("ALL");
  const [selectedTopic, setSelectedTopic] = React.useState<Topic>("QUANTITATIVE");

  const [leagues, setLeagues] = React.useState<LeagueDTO[]>([]);
  const [standings, setStandings] = React.useState<any>(null);
  const [topicStandings, setTopicStandings] = React.useState<TopicLeaderboardEntry[]>([]);
  const [tournaments, setTournaments] = React.useState<TournamentDTO[]>([]);
  const [activeTournament, setActiveTournament] = React.useState<TournamentDTO | null>(null);
  const [bracket, setBracket] = React.useState<BracketRoundDTO[]>([]);
  const [challenges, setChallenges] = React.useState<CollegeChallengeDTO[]>([]);
  const [seasons, setSeasons] = React.useState<SeasonDTO[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);

  const [isCreateTournOpen, setIsCreateTournOpen] = React.useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const isFacultyOrAdmin = user?.role === "FACULTY" || user?.role === "COLLEGE_ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "HOST";

  const loadAllData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [leaguesRes, tournRes, chalRes, topicRes, seasonRes] = await Promise.all([
        fetch(`/api/leagues?division=${divisionFilter}`),
        fetch("/api/tournaments"),
        fetch("/api/challenges"),
        fetch(`/api/leagues/topics?topic=${selectedTopic}`),
        fetch("/api/seasons"),
      ]);

      if (leaguesRes.ok) {
        const lData = await leaguesRes.json();
        setLeagues(lData.leagues || []);
        setStandings(lData.standings || null);
      }

      if (tournRes.ok) {
        const tData = await tournRes.json();
        const tList: TournamentDTO[] = tData.tournaments || [];
        setTournaments(tList);
        if (tList.length > 0) {
          const firstId = tList[0].id;
          const detailRes = await fetch(`/api/tournaments/${firstId}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setActiveTournament(detailData.tournament);
            setBracket(detailData.bracket || []);
          }
        }
      }

      if (chalRes.ok) {
        const cData = await chalRes.json();
        setChallenges(cData.challenges || []);
      }

      if (topicRes.ok) {
        const topData = await topicRes.json();
        setTopicStandings(topData.leaderboard || []);
      }

      if (seasonRes.ok) {
        const sData = await seasonRes.json();
        setSeasons(sData.seasons || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [divisionFilter, selectedTopic]);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleTopicChange = async (t: Topic) => {
    setSelectedTopic(t);
    try {
      const res = await fetch(`/api/leagues/topics?topic=${t}`);
      if (res.ok) {
        const d = await res.json();
        setTopicStandings(d.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncSeason = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/leagues/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Synced ${data.result?.collegesSynced} colleges and ${data.result?.playersSynced} cadets!`);
        setTimeout(() => setSyncMessage(null), 4000);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleFreezeSeason = async (seasonId: string) => {
    try {
      const res = await fetch("/api/seasons/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId }),
      });
      if (res.ok) {
        setSyncMessage("Season successfully frozen! Permanent snapshots recorded.");
        setTimeout(() => setSyncMessage(null), 4000);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdvanceMatch = async (matchId: string, winnerCollegeId: string, score1: number, score2: number) => {
    if (!activeTournament) return;
    try {
      const res = await fetch(`/api/tournaments/${activeTournament.id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, winnerCollegeId, score1, score2 }),
      });
      if (res.ok) {
        const detailRes = await fetch(`/api/tournaments/${activeTournament.id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          setActiveTournament(detailData.tournament);
          setBracket(detailData.bracket || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespondChallenge = async (challengeId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const chalRes = await fetch("/api/challenges");
        if (chalRes.ok) {
          const cData = await chalRes.json();
          setChallenges(cData.challenges || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading) {
    return <LoadingState message="Loading collegiate league standings and brackets..." />;
  }

  const currentLeague = leagues[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Collegiate Placement Arena
            </h1>
            <Badge variant="warning">SEASON 1 ACTIVE</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Institutional league ladders, specialized topic rankings, single-elimination championships, and campus clashes.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSyncSeason}
            disabled={syncing}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Season Data"}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsChallengeOpen(true)}
            className="text-xs border-violet-500/40 text-violet-300 hover:text-white"
          >
            <Swords className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
            Issue Campus Clash
          </Button>

          {isFacultyOrAdmin && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateTournOpen(true)}
              className="text-xs shadow-lg shadow-violet-500/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Tournament
            </Button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("standings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "standings"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Shield className="w-4 h-4" />
          League Standings
        </button>

        <button
          onClick={() => setActiveTab("topics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "topics"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Topic Leagues
        </button>

        <button
          onClick={() => setActiveTab("tournaments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "tournaments"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Championships
          <span className="bg-violet-900/60 text-violet-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {tournaments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("clashes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "clashes"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Swords className="w-4 h-4" />
          Campus Clashes
          <span className="bg-amber-900/60 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {challenges.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("seasons")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "seasons"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Archive className="w-4 h-4" />
          Seasons & Freeze
        </button>
      </div>

      {/* TAB 1: LEAGUE STANDINGS & DIVISIONS */}
      {activeTab === "standings" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Divisions:</span>
              <button
                onClick={() => setDivisionFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  divisionFilter === "ALL"
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Campuses
              </button>
              <button
                onClick={() => setDivisionFilter("DIAMOND")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  divisionFilter === "DIAMOND"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-cyan-300"
                }`}
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Diamond Tier ({standings?.divisions?.diamond || 0})
              </button>
              <button
                onClick={() => setDivisionFilter("GOLD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  divisionFilter === "GOLD"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-amber-300"
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-400" />
                Gold Tier ({standings?.divisions?.gold || 0})
              </button>
              <button
                onClick={() => setDivisionFilter("SILVER")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  divisionFilter === "SILVER"
                    ? "bg-slate-400/20 text-slate-300 border border-slate-400/40"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Shield className="w-3 h-3 text-slate-400" />
                Silver Tier ({standings?.divisions?.silver || 0})
              </button>
            </div>

            {currentLeague && (
              <span className="text-xs font-mono text-slate-500">
                Season Window: {currentLeague.season}
              </span>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <CardTitle className="text-base font-bold">Collegiate Division Ladder</CardTitle>
                </div>
                <Badge variant="primary">Campus Rankings</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg text-center w-12">Rank</th>
                      <th className="px-4 py-3">College / Institute</th>
                      <th className="px-4 py-3 text-center">Division</th>
                      <th className="px-4 py-3 text-center">MMR / Elo</th>
                      <th className="px-4 py-3 text-center">Matches</th>
                      <th className="px-4 py-3 text-center">Win Rate</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Arena Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {standings?.colleges?.map((col: any) => (
                      <tr key={col.collegeId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 text-center font-bold font-mono text-sm">
                          {col.rank === 1 ? (
                            <span className="text-amber-400 font-black">#1</span>
                          ) : col.rank === 2 ? (
                            <span className="text-slate-300 font-black">#2</span>
                          ) : col.rank === 3 ? (
                            <span className="text-amber-600 font-black">#3</span>
                          ) : (
                            <span className="text-slate-500 font-bold">#{col.rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-violet-400 shrink-0" />
                          <span>{col.collegeName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({col.shortName})
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {col.division === "DIAMOND" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              💎 DIAMOND
                            </span>
                          ) : col.division === "GOLD" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🥇 GOLD
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/30">
                              🥈 SILVER
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-violet-400">
                          {col.eloRating || 1500}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-300">
                          {col.gamesPlayed}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-300">
                          {Math.round((col.winRate || 0.5) * 100)}%
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-black text-amber-400 text-sm">
                          {col.score.toLocaleString()} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Top Individual Cadets Leaderboard</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Fair weighted scoring active</span>
            </div>

            {standings?.players && (
              <Leaderboard
                players={standings.players.map((p: any) => ({
                  rank: p.rank,
                  id: p.playerId,
                  displayName: `${p.displayName} (${p.college})`,
                  score: p.score,
                  accuracy: p.accuracy,
                }))}
                showPodium={true}
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SPECIALIZED TOPIC LEAGUES */}
      {activeTab === "topics" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: "QUANTITATIVE", label: "Quantitative Aptitude" },
              { id: "LOGICAL", label: "Logical Reasoning" },
              { id: "VERBAL", label: "Verbal Ability" },
              { id: "DATA_INTERPRETATION", label: "Data Interpretation" },
              { id: "GENERAL_REASONING", label: "General Reasoning" },
            ].map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicChange(topic.id as Topic)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedTopic === topic.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <CardTitle className="text-base font-bold">
                    {selectedTopic.replace(/_/g, " ")} Mastery Leaderboard
                  </CardTitle>
                </div>
                <Badge variant="outline">Filtered by Topic Questions Only</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg text-center w-12">Rank</th>
                      <th className="px-4 py-3">Cadet</th>
                      <th className="px-4 py-3">College</th>
                      <th className="px-4 py-3 text-center">Topic MMR</th>
                      <th className="px-4 py-3 text-center">Drills Attempted</th>
                      <th className="px-4 py-3 text-center">Accuracy</th>
                      <th className="px-4 py-3 text-right rounded-r-lg">Topic Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topicStandings.map((entry) => (
                      <tr key={entry.playerId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 text-center font-bold font-mono">
                          {entry.rank === 1 ? (
                            <span className="text-amber-400 font-black">#1</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-slate-300 font-black">#2</span>
                          ) : (
                            <span className="text-amber-600 font-black">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-white">
                          {entry.displayName}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono">
                          {entry.college}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-violet-400">
                          {entry.topicElo}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-300">
                          {entry.questionsAttempted}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400">
                          {entry.accuracy}%
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
      )}

      {/* TAB 3: CHAMPIONSHIP TOURNAMENTS & BRACKETS */}
      {activeTab === "tournaments" && (
        <div className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                Active Championship
              </span>
              <h2 className="text-lg font-black text-white">
                {activeTournament?.title || "Collegiate Championship"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTournament?.description} • {activeTournament?.prizePool}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="warning">
                {activeTournament?.status === "IN_PROGRESS" ? "IN PROGRESS" : activeTournament?.status}
              </Badge>
              <Badge variant="outline">
                {activeTournament?.participantCount} CAMPUSES
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <CardTitle className="text-base font-bold">Single Elimination Bracket</CardTitle>
                </div>
                <span className="text-xs text-slate-400">
                  {isFacultyOrAdmin ? "Faculty controls enabled" : "Spectate matches live"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <BracketViewer
                bracket={bracket}
                onAdvanceMatch={handleAdvanceMatch}
                isAdmin={isFacultyOrAdmin}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: CAMPUS CLASHES & MATCHMAKING */}
      {activeTab === "clashes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Inter-Collegiate Direct Duels</h2>
              <p className="text-xs text-slate-400">
                Live challenges issued between campus faculties and cadet clubs.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsChallengeOpen(true)}
              className="text-xs"
            >
              <Swords className="w-3.5 h-3.5 mr-1.5" />
              Issue Duel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((ch) => {
              const isAccepted = ch.status === "ACCEPTED";
              const isPending = ch.status === "PENDING";
              const isCompleted = ch.status === "COMPLETED";

              return (
                <div
                  key={ch.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </span>
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        ACCEPTED & ACTIVE
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        PENDING RESPONSE
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                        DUEL COMPLETED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                    <div className="text-left">
                      <p className="text-xs font-black text-white">{ch.challengerShortName}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {ch.challengerCollegeName}
                      </p>
                      {isCompleted && (
                        <p className="text-xs font-mono font-black text-amber-400 mt-1">
                          {ch.challengerScore} pts
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-center px-3">
                      <Swords className="w-4 h-4 text-violet-400" />
                      <span className="text-[9px] font-black text-slate-500 mt-0.5">VS</span>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-white">{ch.opponentShortName}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {ch.opponentCollegeName}
                      </p>
                      {isCompleted && (
                        <p className="text-xs font-mono font-black text-amber-400 mt-1">
                          {ch.opponentScore} pts
                        </p>
                      )}
                    </div>
                  </div>

                  {ch.message && (
                    <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                      &quot;{ch.message}&quot;
                    </p>
                  )}

                  {isAccepted && ch.roomCode && (
                    <div className="bg-violet-950/30 border border-violet-800/40 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-violet-300 block">
                          Clash Arena Code
                        </span>
                        <span className="text-sm font-mono font-black text-white">
                          {ch.roomCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={() => copyRoomCode(ch.roomCode!)}
                        >
                          {copiedCode === ch.roomCode ? (
                            <>
                              <Check className="w-3 h-3 mr-1 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Link href={`/rooms/${ch.roomCode}/lobby`}>
                          <Button size="sm" variant="primary" className="h-8 text-xs">
                            Enter Arena
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs text-rose-400 hover:text-rose-300"
                        onClick={() => handleRespondChallenge(ch.id, "DECLINE")}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs"
                        onClick={() => handleRespondChallenge(ch.id, "ACCEPT")}
                      >
                        Accept & Deploy Arena
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SEASONS & FREEZE ARCHIVE */}
      {activeTab === "seasons" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Placement Seasons & Historical Archives</h2>
              <p className="text-xs text-slate-400">
                Seasonal resets preserve past standings as permanent snapshots.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-bold text-white">{season.name}</h3>
                  </div>
                  {season.isActive ? (
                    <Badge variant="warning">ACTIVE SEASON</Badge>
                  ) : (
                    <Badge variant="outline">ARCHIVED / FROZEN</Badge>
                  )}
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>Start Date: {new Date(season.startDate).toLocaleDateString()}</p>
                  <p>End Date: {new Date(season.endDate).toLocaleDateString()}</p>
                </div>

                {isFacultyOrAdmin && season.isActive && (
                  <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs text-amber-400 hover:text-amber-300"
                      onClick={() => handleFreezeSeason(season.id)}
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" />
                      Freeze & Create Snapshot
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTournamentModal
        isOpen={isCreateTournOpen}
        onClose={() => setIsCreateTournOpen(false)}
        onCreated={() => loadAllData()}
      />

      <ChallengeModal
        isOpen={isChallengeOpen}
        onClose={() => setIsChallengeOpen(false)}
        onCreated={() => loadAllData()}
      />
    </div>
  );
}
