"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LobbyDisplay } from "@/components/game/lobby-display";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { RoomDTO, RoomPlayerDTO } from "@/types";

export default function RoomLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = String(params.code || "").toUpperCase();
  const { user } = useAuth();

  const [room, setRoom] = React.useState<RoomDTO | null>(null);
  const [players, setPlayers] = React.useState<RoomPlayerDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isStarting, setIsStarting] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<"alpha" | "beta">("alpha");

  const fetchRoomState = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`);
      if (!res.ok) {
        throw new Error("Room not found or expired.");
      }
      const data = await res.json();
      if (data.room.status !== "LOBBY") {
        router.push(`/rooms/${roomCode}/play`);
        return;
      }
      setRoom(data.room);
      setPlayers(data.room.players || []);
    } catch (err: any) {
      setError(err.message || "Failed to load room lobby.");
    } finally {
      setLoading(false);
    }
  }, [roomCode, router]);

  React.useEffect(() => {
    fetchRoomState();
    // Refresh room state interval for lobby updates
    const interval = setInterval(fetchRoomState, 2000);
    return () => clearInterval(interval);
  }, [fetchRoomState]);

  const handleStartGame = async () => {
    if (!room) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to start room.");
      }
      router.push(`/rooms/${roomCode}/play`);
    } catch (err: any) {
      alert(err.message || "Failed to start game.");
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Connecting to room lobby..." />;
  }

  if (error || !room) {
    return (
      <div className="py-12">
        <ErrorState
          title="Lobby Unavailable"
          message={error || "This competition room does not exist or has concluded."}
          onRetry={() => router.push("/join")}
        />
      </div>
    );
  }

  const isHost = user?.id === room.hostId || user?.role === "HOST" || user?.role === "SUPER_ADMIN";
  const isTeamBattle = room.gameMode === "TEAM_BATTLE";

  return (
    <div className="flex-1 flex flex-col justify-center py-6 space-y-6">
      {isTeamBattle && (
        <div className="max-w-2xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-violet-400 tracking-wider">
                Game Mode Active
              </span>
              <h3 className="text-sm font-black text-white">Team Battle Squadron Assignment</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Teams of 3–5 players</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedTeam("alpha")}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedTeam === "alpha"
                  ? "bg-violet-950/60 border-violet-500 shadow-lg shadow-violet-500/10 text-white"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">Team Alpha</span>
                <span className="text-[10px] font-mono bg-violet-900/60 text-violet-300 px-2 py-0.5 rounded-full">
                  CS & IT Squadron
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Aggregates combined player scores in real time
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTeam("beta")}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedTeam === "beta"
                  ? "bg-cyan-950/60 border-cyan-500 shadow-lg shadow-cyan-500/10 text-white"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">Team Beta</span>
                <span className="text-[10px] font-mono bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded-full">
                  Mech & ECE Squadron
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Aggregates combined player scores in real time
              </p>
            </button>
          </div>
        </div>
      )}

      <LobbyDisplay
        roomCode={room.code}
        questionSetTitle={room.questionSetTitle || "Synchronized Aptitude Qualifier"}
        players={players}
        maxPlayers={room.maxPlayers}
        isHost={Boolean(isHost)}
        onStartGame={handleStartGame}
        isStarting={isStarting}
      />
    </div>
  );
}
