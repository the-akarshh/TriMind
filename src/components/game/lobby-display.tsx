"use client";

import * as React from "react";
import { Copy, Check, Users, Shield, Play } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { RoomPlayerDTO } from "@/types";

export interface LobbyDisplayProps {
  roomCode: string;
  questionSetTitle: string;
  players: RoomPlayerDTO[];
  maxPlayers: number;
  isHost: boolean;
  onStartGame?: () => void;
  isStarting?: boolean;
}

export function LobbyDisplay({
  roomCode,
  questionSetTitle,
  players,
  maxPlayers,
  isHost,
  onStartGame,
  isStarting = false,
}: LobbyDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safePlayers = Array.isArray(players) ? players : [];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 py-6 px-4">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <Badge variant="primary" className="text-xs px-3 py-1">
          COMPETITION LOBBY
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {questionSetTitle}
        </h1>
        <p className="text-sm text-slate-400">
          Share the room PIN with your college peers to join this synchronized round.
        </p>
      </div>

      {/* Prominent Room PIN Hero Card */}
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-violet-500/50 rounded-3xl p-6 shadow-2xl shadow-violet-500/10 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-2">
          JOIN AT APTITUDEARENA / JOIN WITH PIN
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white selection:bg-violet-600">
            {roomCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 border border-slate-700"
            title="Copy Room PIN"
            aria-label="Copy Room PIN"
          >
            {copied ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        {copied && (
          <p className="text-xs text-emerald-400 font-semibold mt-2 animate-pulse">
            PIN copied to clipboard!
          </p>
        )}
      </div>

      {/* Players Joined Status Bar */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-bold text-white">
            Players Joined ({safePlayers.length}/{maxPlayers})
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Synchronized Lobby
        </div>
      </div>

      {/* Live Players Grid (Handles 50+ players) */}
      <div className="w-full min-h-[180px] max-h-[360px] overflow-y-auto p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        {safePlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-center">
            <p className="text-sm">Waiting for players to enter the PIN...</p>
            <p className="text-xs text-slate-400 mt-1">
              Ask students to go to <span className="font-mono text-violet-400">/join</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {safePlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 shadow"
              >
                <Avatar name={p.displayName} size="sm" />
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  {p.displayName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Host Controls vs Player Waiting Status */}
      <div className="w-full flex justify-center pt-2">
        {isHost ? (
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={onStartGame}
              size="lg"
              variant="primary"
              isLoading={isStarting}
              disabled={players.length === 0}
              className="px-8 text-base shadow-xl"
            >
              <Play className="w-5 h-5 mr-1 fill-white" />
              Launch Arena Round
            </Button>
            {players.length === 0 && (
              <p className="text-xs text-amber-400">
                At least 1 player must join before starting the round.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700">
            <Shield className="w-5 h-5 text-violet-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">
              Waiting for the host to launch the round... Get ready!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
