"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
  WS_EVENTS,
  QuestionStartPayload,
  TimerTickPayload,
  AnswerResultPayload,
  QuestionRevealPayload,
  LeaderboardEntry,
  GameFinishedPayload,
  RoomLifecycleStatus,
} from "./events";

export interface ArenaSocketState {
  isConnected: boolean;
  status: RoomLifecycleStatus;
  roomCode: string;
  playerId: string | null;
  displayName: string | null;
  currentQuestion: QuestionStartPayload | null;
  timer: TimerTickPayload | null;
  hasAnswered: boolean;
  selectedOptionId: string | null;
  personalResult: AnswerResultPayload | null;
  revealData: QuestionRevealPayload | null;
  leaderboard: LeaderboardEntry[];
  finalResult: GameFinishedPayload | null;
  playersCount: number;
  playersList: { id: string; displayName: string; score: number; connected: boolean }[];
  errorMessage: string | null;
  isSpectator: boolean;
  answerProgress: { answeredCount: number; totalConnected: number } | null;
  secondsUntilStart: number | null;
}

export function useArenaSocket(roomCode: string) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<ArenaSocketState>({
    isConnected: false,
    status: "WAITING",
    roomCode: roomCode.toUpperCase(),
    playerId: null,
    displayName: null,
    currentQuestion: null,
    timer: null,
    hasAnswered: false,
    selectedOptionId: null,
    personalResult: null,
    revealData: null,
    leaderboard: [],
    finalResult: null,
    playersCount: 0,
    playersList: [],
    errorMessage: null,
    isSpectator: false,
    answerProgress: null,
    secondsUntilStart: null,
  });

  // Connect Socket
  useEffect(() => {
    if (!roomCode) return;

    // Prioritize dedicated persistent WebSocket server (NEXT_PUBLIC_SOCKET_URL), then legacy NEXT_PUBLIC_WS_URL
    const configuredSocketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_WS_URL;

    // Detect if running on Vercel without a configured persistent socket host
    const isVercelHost =
      typeof window !== "undefined" &&
      window.location.hostname.includes("vercel.app");

    if (isVercelHost && !configuredSocketUrl) {
      // Vercel serverless functions do not support persistent WebSockets.
      // Inform the client with a bounded, clear notification rather than attempting invalid handshakes.
      setState((prev) => ({
        ...prev,
        isConnected: false,
        errorMessage:
          "Multiplayer sync server (NEXT_PUBLIC_SOCKET_URL) is not configured. Real-time synchronization requires a persistent host (e.g. Render/Railway).",
      }));
      return;
    }

    const socketUrl =
      configuredSocketUrl ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    const socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1500,
      timeout: 8000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setState((prev) => ({ ...prev, isConnected: true, errorMessage: null }));

      // Check if we have stored reconnect tokens
      try {
        const storedToken = sessionStorage.getItem(`arena_reconnect_${roomCode}`);
        const storedPlayerId = sessionStorage.getItem(`arena_playerId_${roomCode}`);

        if (storedToken && storedPlayerId) {
          socket.emit(WS_EVENTS.ROOM_RECONNECT, {
            roomCode,
            playerId: storedPlayerId,
            reconnectToken: storedToken,
          });
        }
      } catch {
        // Ignore storage errors in restricted contexts
      }
    });

    socket.on("connect_error", (err: any) => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        errorMessage: `Multiplayer connection error: ${err.message || "Failed to reach server"}`,
      }));
    });

    if (socket.io) {
      socket.io.on("reconnect_failed", () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          errorMessage:
            "Multiplayer server unreachable after 3 attempts. Please verify NEXT_PUBLIC_SOCKET_URL.",
        }));
      });
    }

    socket.on("disconnect", () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    // Handle full Room State Sync
    socket.on(WS_EVENTS.ROOM_STATE, (snapshot: any) => {
      setState((prev) => ({
        ...prev,
        status: snapshot.status,
        playersCount: snapshot.playerCount,
        playersList: snapshot.players || [],
        currentQuestion: snapshot.currentQuestion || null,
        hasAnswered: snapshot.hasAnsweredCurrentQuestion || false,
        revealData: snapshot.lastReveal || null,
        leaderboard: snapshot.leaderboard || prev.leaderboard,
        timer: snapshot.currentQuestionRemainingMs
          ? {
              remainingSeconds: Math.ceil(snapshot.currentQuestionRemainingMs / 1000),
              remainingMs: snapshot.currentQuestionRemainingMs,
              totalMs: (snapshot.currentQuestion?.timeLimit || 20) * 1000,
            }
          : null,
      }));
    });

    // Player Joined / Left
    socket.on(WS_EVENTS.PLAYER_JOINED, (data: any) => {
      setState((prev) => ({
        ...prev,
        playersCount: data.playerCount || prev.playersCount + 1,
      }));
    });

    socket.on(WS_EVENTS.PLAYER_LEFT, (data: any) => {
      setState((prev) => ({
        ...prev,
        playersList: prev.playersList.map((p) =>
          p.id === data.id ? { ...p, connected: false } : p
        ),
      }));
    });

    // Game starting countdown
    socket.on(WS_EVENTS.GAME_STARTING, (data: any) => {
      setState((prev) => ({
        ...prev,
        status: "STARTING",
        secondsUntilStart: data.secondsUntilStart,
      }));
    });

    // Question start
    socket.on(WS_EVENTS.QUESTION_START, (questionData: QuestionStartPayload) => {
      setState((prev) => ({
        ...prev,
        status: "QUESTION_ACTIVE",
        currentQuestion: questionData,
        hasAnswered: false,
        selectedOptionId: null,
        personalResult: null,
        revealData: null,
        secondsUntilStart: null,
        timer: {
          remainingSeconds: questionData.timeLimit,
          remainingMs: questionData.timeLimit * 1000,
          totalMs: questionData.timeLimit * 1000,
        },
      }));
    });

    // Timer tick
    socket.on(WS_EVENTS.QUESTION_TIMER, (tick: TimerTickPayload) => {
      setState((prev) => ({ ...prev, timer: tick }));
    });

    // Answer Result (Direct)
    socket.on(WS_EVENTS.ANSWER_RESULT, (result: AnswerResultPayload) => {
      setState((prev) => ({
        ...prev,
        personalResult: result,
      }));
    });

    // Answer Progress (Broadcast)
    socket.on("room:answer_progress", (data: any) => {
      setState((prev) => ({ ...prev, answerProgress: data }));
    });

    // Question Reveal (Broadcast)
    socket.on(WS_EVENTS.QUESTION_REVEAL, (reveal: QuestionRevealPayload) => {
      setState((prev) => ({
        ...prev,
        status: "QUESTION_REVEAL",
        revealData: reveal,
      }));
    });

    // Leaderboard Update (Broadcast)
    socket.on(WS_EVENTS.LEADERBOARD_UPDATE, (data: any) => {
      setState((prev) => ({
        ...prev,
        status: "LEADERBOARD",
        leaderboard: data.leaderboard || [],
      }));
    });

    // Game Finished (Broadcast / Direct)
    socket.on(WS_EVENTS.GAME_FINISHED, (finalData: any) => {
      setState((prev) => ({
        ...prev,
        status: "FINISHED",
        finalResult: finalData.topicBreakdown ? finalData : null,
        leaderboard: finalData.finalLeaderboard || prev.leaderboard,
      }));
    });

    // Arena Error
    socket.on(WS_EVENTS.ERROR, (err: { code: string; message: string }) => {
      setState((prev) => ({ ...prev, errorMessage: err.message }));
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode]);

  // Actions
  const join = useCallback(
    (displayName: string, userId?: string | null) => {
      if (!socketRef.current) return;
      socketRef.current.emit(
        WS_EVENTS.ROOM_JOIN,
        { roomCode, displayName, userId },
        (res: any) => {
          if (res?.success) {
            try {
              sessionStorage.setItem(`arena_reconnect_${roomCode}`, res.reconnectToken);
              sessionStorage.setItem(`arena_playerId_${roomCode}`, res.playerId);
            } catch {
              // Ignore storage errors
            }
            setState((prev) => ({
              ...prev,
              playerId: res.playerId,
              displayName,
            }));
          } else {
            setState((prev) => ({ ...prev, errorMessage: res?.error }));
          }
        }
      );
    },
    [roomCode]
  );

  const joinAsSpectator = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit(WS_EVENTS.SPECTATOR_JOIN, { roomCode }, (res: any) => {
      if (res?.success) {
        setState((prev) => ({ ...prev, isSpectator: true }));
      }
    });
  }, [roomCode]);

  const startGame = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit(WS_EVENTS.GAME_START, { roomCode });
  }, [roomCode]);

  const submitAnswer = useCallback(
    (displayedOptionId: string) => {
      if (!socketRef.current || !state.currentQuestion) return;
      setState((prev) => ({
        ...prev,
        hasAnswered: true,
        selectedOptionId: displayedOptionId,
      }));

      socketRef.current.emit(
        WS_EVENTS.ANSWER_SUBMIT,
        {
          roomCode,
          gameQuestionId: state.currentQuestion.gameQuestionId,
          displayedOptionId,
          clientTimestamp: Date.now(),
        },
        (res: any) => {
          if (!res?.success) {
            setState((prev) => ({ ...prev, errorMessage: res?.error }));
          }
        }
      );
    },
    [roomCode, state.currentQuestion]
  );

  return {
    state,
    join,
    joinAsSpectator,
    startGame,
    submitAnswer,
  };
}
