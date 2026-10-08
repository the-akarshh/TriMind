import { Topic, Difficulty } from "@/types";

export type RoomLifecycleStatus =
  | "WAITING"
  | "STARTING"
  | "QUESTION_ACTIVE"
  | "QUESTION_REVEAL"
  | "LEADERBOARD"
  | "FINISHED";

export const WS_EVENTS = {
  // Client -> Server
  ROOM_JOIN: "room:join",
  ROOM_RECONNECT: "room:reconnect",
  SPECTATOR_JOIN: "spectator:join",
  ROOM_LEAVE: "room:leave",
  GAME_START: "game:start",
  GAME_PAUSE: "game:pause",
  GAME_END: "game:end",
  ANSWER_SUBMIT: "answer:submit",

  // Server -> Client
  ROOM_STATE: "room:state",
  PLAYER_JOINED: "room:player_joined",
  PLAYER_LEFT: "room:player_left",
  PLAYER_RECONNECTED: "room:player_reconnected",
  GAME_STARTING: "game:starting",
  QUESTION_START: "question:start",
  QUESTION_TIMER: "question:timer",
  QUESTION_END: "question:end",
  ANSWER_RESULT: "answer:result",
  QUESTION_REVEAL: "question:reveal",
  LEADERBOARD_UPDATE: "leaderboard:update",
  GAME_FINISHED: "game:end",
  ERROR: "arena:error",
} as const;

export type WsEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

// Client Payload interfaces
export interface ClientJoinRoomPayload {
  roomCode: string;
  displayName: string;
  userId?: string | null;
}

export interface ClientReconnectPayload {
  roomCode: string;
  playerId: string;
  reconnectToken: string;
}

export interface ClientSpectatorJoinPayload {
  roomCode: string;
}

export interface ClientSubmitAnswerPayload {
  roomCode: string;
  gameQuestionId: string;
  displayedOptionId: string; // The ID of the option selected from the player's shuffled view
  clientTimestamp?: number;
}

// Server Broadcast / Direct Payload interfaces
export interface ShuffledOptionDTO {
  displayedId: string;
  text: string;
  imageUrl?: string | null;
  // NEVER send isCorrect before reveal!
}

export interface QuestionStartPayload {
  gameQuestionId: string;
  questionIndex: number;
  totalQuestions: number;
  text: string;
  topic: Topic;
  difficulty: Difficulty;
  timeLimit: number; // in seconds
  serverStartTime: number; // epoch ms
  serverEndTime: number; // epoch ms
  imageUrl?: string | null;
  tableData?: string | null;
  options: ShuffledOptionDTO[]; // Shuffled specifically for the receiving player
}

export interface TimerTickPayload {
  remainingSeconds: number;
  remainingMs: number;
  totalMs: number;
}

export interface AnswerResultPayload {
  isCorrect: boolean;
  pointsAwarded: number;
  speedBonus: number;
  newScore: number;
  currentStreak: number;
  responseTimeMs: number;
}

export interface QuestionRevealPayload {
  questionIndex: number;
  correctDisplayedOptionId: string; // or original ID
  correctOptionText: string;
  explanation?: string | null;
  optionCounts: Record<string, number>; // distribution of players across options
  allAnsweredEarly: boolean;
}

export type RankMovement = "up" | "down" | "same";

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  scoreChange: number;
  accuracy: number;
  movement: RankMovement;
  rankDelta: number; // e.g. +2 (climbed 2 ranks), -1 (dropped 1 rank)
  streak: number;
  connected: boolean;
}

export interface LeaderboardUpdatePayload {
  questionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  nextQuestionInMs?: number;
}

export interface TopicPerformance {
  topic: Topic;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseTimeMs: number;
  assessment: "Strength" | "Proficient" | "Needs Practice" | "Weakness";
}

export interface GameFinishedPayload {
  finalRank: number;
  totalPlayers: number;
  finalScore: number;
  accuracy: number;
  correctAnswers: number;
  wrongAnswers: number;
  averageResponseTimeMs: number;
  topicBreakdown: Record<string, TopicPerformance>;
  finalLeaderboard: LeaderboardEntry[];
}

export interface RoomStateSnapshot {
  code: string;
  status: RoomLifecycleStatus;
  questionSetTitle: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerCount: number;
  connectedCount: number;
  players: {
    id: string;
    displayName: string;
    score: number;
    connected: boolean;
    hasAnsweredCurrent: boolean;
  }[];
  // If in active question, includes the active question payload customized for caller
  currentQuestion?: QuestionStartPayload | null;
  currentQuestionRemainingMs?: number;
  hasAnsweredCurrentQuestion?: boolean;
  lastReveal?: QuestionRevealPayload | null;
  lastLeaderboard?: LeaderboardEntry[] | null;
}
