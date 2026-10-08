import {
  RoomLifecycleStatus,
  QuestionStartPayload,
  ShuffledOptionDTO,
  LeaderboardEntry,
  QuestionRevealPayload,
  GameFinishedPayload,
  TopicPerformance,
  AnswerResultPayload,
} from "../realtime/events";
import { Topic, Difficulty, SafeUser } from "@/types";
import { getQuestionSetById } from "../services/question-service";
import { SeedQuestion } from "../seed-data";
import { logger } from "../logger";

export interface EnginePlayer {
  id: string;
  socketId: string;
  displayName: string;
  userId?: string | null;
  reconnectToken: string;
  score: number;
  scoreBeforeQuestion: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalAnswerTimeMs: number;
  streak: number;
  connected: boolean;
  isSpectator: boolean;
  lastActiveAt: number;
  answers: Map<
    number,
    {
      questionIndex: number;
      displayedOptionId: string;
      originalOptionId: string;
      isCorrect: boolean;
      pointsAwarded: number;
      responseTimeMs: number;
      submittedAt: number;
    }
  >;
}

export interface EngineQuestion {
  id: string;
  text: string;
  explanation: string;
  topic: Topic;
  difficulty: Difficulty;
  timeLimit: number; // seconds
  points: number;
  imageUrl?: string | null;
  tableData?: string | null;
  options: {
    id: string;
    text: string;
    imageUrl?: string | null;
    isCorrect: boolean;
  }[];
}

export interface EngineRoom {
  code: string;
  hostSocketId: string;
  hostId: string;
  questionSetId: string;
  questionSetTitle: string;
  status: RoomLifecycleStatus;
  maxPlayers: number;
  currentQuestionIndex: number; // 0-based
  questions: EngineQuestion[];
  players: Map<string, EnginePlayer>; // key: playerId
  socketToPlayer: Map<string, string>; // key: socketId -> playerId
  spectators: Set<string>; // socketIds

  // Active question runtime
  serverStartTime: number;
  serverEndTime: number;
  questionTimer: any; // NodeJS.Timeout | null
  tickInterval: any; // NodeJS.Timeout | null
  revealedQuestionData: QuestionRevealPayload | null;

  // Option shuffle mappings: playerId -> Map<displayedOptionId, originalOptionId>
  playerOptionMaps: Map<string, Map<string, string>>;

  // Previous ranks for movement tracking
  previousRanks: Map<string, number>;

  // Rate-limiting / anti-spam stamps
  lastAnswerTimestamp: Map<string, number>;
  strictReactionTimeValidation?: boolean;
}

// Bounded network jitter grace window (Prompt Section 7)
export const MAX_NETWORK_GRACE_MS = 250;

// Fisher-Yates array shuffling
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class MultiplayerGameEngine {
  private rooms = new Map<string, EngineRoom>();
  private onBroadcast: (roomCode: string, event: string, payload: any) => void;
  private onDirectMessage: (socketId: string, event: string, payload: any) => void;

  constructor(
    broadcastFn: (roomCode: string, event: string, payload: any) => void = () => {},
    directMsgFn: (socketId: string, event: string, payload: any) => void = () => {}
  ) {
    this.onBroadcast = broadcastFn;
    this.onDirectMessage = directMsgFn;
  }

  public setEmitters(
    broadcastFn: (roomCode: string, event: string, payload: any) => void,
    directMsgFn: (socketId: string, event: string, payload: any) => void
  ) {
    this.onBroadcast = broadcastFn;
    this.onDirectMessage = directMsgFn;
  }

  public getRoom(code: string): EngineRoom | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  /**
   * Initialize a room inside the game engine
   */
  public async initRoom(
    code: string,
    hostSocketId: string,
    hostId: string,
    questionSetId: string,
    maxPlayers = 50
  ): Promise<EngineRoom> {
    const upperCode = code.toUpperCase().trim();
    const qSet = await getQuestionSetById(questionSetId);
    if (!qSet) {
      throw new Error(`Question set ${questionSetId} not found.`);
    }

    const engineQuestions: EngineQuestion[] = (qSet.questions || []).map((q, idx) => ({
      id: q.id || `q-${idx}`,
      text: q.text,
      explanation: q.explanation || "No explanation provided.",
      topic: q.topic,
      difficulty: q.difficulty,
      timeLimit: Math.max(5, q.timeLimit || 20),
      points: q.points || 100,
      imageUrl: q.imageUrl,
      tableData: q.tableData,
      options: q.options.map((opt, oIdx) => ({
        id: opt.id || `opt-${idx}-${oIdx}`,
        text: opt.text,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
      })),
    }));

    if (engineQuestions.length === 0) {
      throw new Error("Question set contains no questions.");
    }

    const room: EngineRoom = {
      code: upperCode,
      hostSocketId,
      hostId,
      questionSetId,
      questionSetTitle: qSet.title,
      status: "WAITING",
      maxPlayers,
      currentQuestionIndex: 0,
      questions: engineQuestions,
      players: new Map(),
      socketToPlayer: new Map(),
      spectators: new Set(),
      serverStartTime: 0,
      serverEndTime: 0,
      questionTimer: null,
      tickInterval: null,
      revealedQuestionData: null,
      playerOptionMaps: new Map(),
      previousRanks: new Map(),
      lastAnswerTimestamp: new Map(),
    };

    this.rooms.set(upperCode, room);
    return room;
  }

  /**
   * Player Joins Room
   */
  public joinRoom(
    roomCode: string,
    socketId: string,
    displayName: string,
    userId?: string | null
  ): { player: EnginePlayer; reconnectToken: string } {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error(`Room code ${roomCode} not found.`);
    }

    if (room.status === "FINISHED") {
      throw new Error("This competition round has already concluded.");
    }

    if (room.players.size >= room.maxPlayers) {
      throw new Error(`Room has reached maximum capacity of ${room.maxPlayers} players.`);
    }

    const cleanName = displayName.trim();
    for (const existing of Array.from(room.players.values())) {
      if (existing.displayName.toLowerCase() === cleanName.toLowerCase() && existing.connected) {
        throw new Error("Display name is already taken in this room.");
      }
    }

    const playerId = `ply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const reconnectToken = `rec-${Math.random().toString(36).substring(2)}${Date.now()}`;

    const player: EnginePlayer = {
      id: playerId,
      socketId,
      displayName: cleanName,
      userId: userId || null,
      reconnectToken,
      score: 0,
      scoreBeforeQuestion: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      totalAnswerTimeMs: 0,
      streak: 0,
      connected: true,
      isSpectator: false,
      lastActiveAt: Date.now(),
      answers: new Map(),
    };

    room.players.set(playerId, player);
    room.socketToPlayer.set(socketId, playerId);

    this.onBroadcast(room.code, "room:player_joined", {
      id: player.id,
      displayName: player.displayName,
      playerCount: room.players.size,
    });

    return { player, reconnectToken };
  }

  /**
   * Player Reconnects (Prompt Section 13)
   */
  public reconnectPlayer(
    roomCode: string,
    newSocketId: string,
    playerId: string,
    reconnectToken: string
  ): EnginePlayer {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error("Room not found.");
    }

    const player = room.players.get(playerId);
    if (!player) {
      throw new Error("Player record not found.");
    }

    if (player.reconnectToken !== reconnectToken) {
      logger.security("INVALID_RECONNECT_TOKEN", {
        actorId: playerId,
        socketId: newSocketId,
        roomCode,
        reason: "Invalid reconnection token presented for player reconnect.",
      });
      throw new Error("Invalid reconnection token.");
    }

    // Unmap old socket if present
    if (player.socketId) {
      room.socketToPlayer.delete(player.socketId);
    }

    player.socketId = newSocketId;
    player.connected = true;
    player.lastActiveAt = Date.now();
    room.socketToPlayer.set(newSocketId, playerId);

    this.onBroadcast(room.code, "room:player_reconnected", {
      id: player.id,
      displayName: player.displayName,
    });

    return player;
  }

  /**
   * Spectator Joins (Prompt Section 16)
   */
  public joinSpectator(roomCode: string, socketId: string) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error("Room not found.");
    room.spectators.add(socketId);
    return true;
  }

  /**
   * Player or Spectator Disconnects (Prompt Section 14)
   */
  public handleDisconnect(socketId: string) {
    for (const room of Array.from(this.rooms.values())) {
      if (room.spectators.has(socketId)) {
        room.spectators.delete(socketId);
        return;
      }

      const playerId = room.socketToPlayer.get(socketId);
      if (playerId) {
        const player = room.players.get(playerId);
        if (player) {
          player.connected = false;
          room.socketToPlayer.delete(socketId);

          this.onBroadcast(room.code, "room:player_left", {
            id: player.id,
            displayName: player.displayName,
          });

          // Check if game is in progress and all remaining connected players have answered
          if (room.status === "QUESTION_ACTIVE") {
            this.checkEarlyQuestionEnd(room);
          }
        }
        return;
      }
    }
  }

  /**
   * Host starts game (Prompt Section 2 & 15)
   */
  public startGame(roomCode: string, requesterSocketId: string) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error("Room not found.");

    if (room.hostSocketId && room.hostSocketId !== requesterSocketId) {
      logger.security("UNAUTHORIZED_START", {
        actorId: requesterSocketId,
        roomCode,
        reason: "Non-host socket attempted to trigger match start.",
      });
      throw new Error("Unauthorized: Only host can start game.");
    }

    if (room.players.size === 0) {
      throw new Error("Cannot start game: at least 1 player must join.");
    }

    if (room.status !== "WAITING") {
      throw new Error(`Cannot start game: Room is already in ${room.status} state.`);
    }

    room.status = "STARTING";
    room.currentQuestionIndex = 0;

    // Snapshot initial rankings (everyone 0 points)
    this.recordRankSnapshot(room);

    // 4-second synchronized starting countdown
    let countdown = 4;
    this.onBroadcast(room.code, "game:starting", {
      secondsUntilStart: countdown,
      totalQuestions: room.questions.length,
    });

    const countdownTimer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.onBroadcast(room.code, "game:starting", {
          secondsUntilStart: countdown,
          totalQuestions: room.questions.length,
        });
      } else {
        clearInterval(countdownTimer);
        this.launchQuestion(room, 0);
      }
    }, 1000);
  }

  /**
   * Launch Synchronized Question with Per-Player Shuffled Options (Prompt Section 4 & 5)
   */
  public launchQuestion(room: EngineRoom, questionIndex: number) {
    if (questionIndex >= room.questions.length) {
      this.finishGame(room);
      return;
    }

    const question = room.questions[questionIndex];
    room.status = "QUESTION_ACTIVE";
    room.currentQuestionIndex = questionIndex;
    room.revealedQuestionData = null;

    const now = Date.now();
    const durationMs = question.timeLimit * 1000;
    room.serverStartTime = now;
    room.serverEndTime = now + durationMs;

    // Reset scoreBeforeQuestion for change delta
    for (const player of Array.from(room.players.values())) {
      player.scoreBeforeQuestion = player.score;
    }
    room.lastAnswerTimestamp.clear();

    // Build unique shuffled options for each player (Prompt Section 5)
    for (const player of Array.from(room.players.values())) {
      const shuffled = shuffleArray(question.options);
      const optionMap = new Map<string, string>(); // displayedId -> originalId

      const playerOptionsDTO: ShuffledOptionDTO[] = shuffled.map((opt, sIdx) => {
        const displayedId = `disp-${sIdx}-${opt.id.substring(0, 8)}`;
        optionMap.set(displayedId, opt.id);
        return {
          displayedId,
          text: opt.text,
          imageUrl: opt.imageUrl,
          // CRITICAL: NEVER include isCorrect
        };
      });

      room.playerOptionMaps.set(player.id, optionMap);

      const playerPayload: QuestionStartPayload = {
        gameQuestionId: question.id,
        questionIndex: questionIndex + 1,
        totalQuestions: room.questions.length,
        text: question.text,
        topic: question.topic,
        difficulty: question.difficulty,
        timeLimit: question.timeLimit,
        serverStartTime: room.serverStartTime,
        serverEndTime: room.serverEndTime,
        imageUrl: question.imageUrl,
        tableData: question.tableData,
        options: playerOptionsDTO,
      };

      if (player.connected && player.socketId) {
        this.onDirectMessage(player.socketId, "question:start", playerPayload);
      }
    }

    // Also send un-shuffled / reference view to host and spectators
    const spectatorOptions: ShuffledOptionDTO[] = question.options.map((opt) => ({
      displayedId: opt.id,
      text: opt.text,
      imageUrl: opt.imageUrl,
    }));

    const spectatorPayload: QuestionStartPayload = {
      gameQuestionId: question.id,
      questionIndex: questionIndex + 1,
      totalQuestions: room.questions.length,
      text: question.text,
      topic: question.topic,
      difficulty: question.difficulty,
      timeLimit: question.timeLimit,
      serverStartTime: room.serverStartTime,
      serverEndTime: room.serverEndTime,
      imageUrl: question.imageUrl,
      tableData: question.tableData,
      options: spectatorOptions,
    };

    if (room.hostSocketId) {
      this.onDirectMessage(room.hostSocketId, "question:start", spectatorPayload);
    }
    for (const specSocketId of Array.from(room.spectators)) {
      this.onDirectMessage(specSocketId, "question:start", spectatorPayload);
    }

    // Start server ticker every 1000ms
    if (room.tickInterval) clearInterval(room.tickInterval);
    room.tickInterval = setInterval(() => {
      const remainingMs = Math.max(0, room.serverEndTime - Date.now());
      this.onBroadcast(room.code, "question:timer", {
        remainingSeconds: Math.ceil(remainingMs / 1000),
        remainingMs,
        totalMs: durationMs,
      });

      if (remainingMs <= 0) {
        clearInterval(room.tickInterval);
      }
    }, 1000);

    // Schedule question expiration
    if (room.questionTimer) clearTimeout(room.questionTimer);
    room.questionTimer = setTimeout(() => {
      this.endQuestion(room, false);
    }, durationMs);
  }

  /**
   * Submit Answer (Prompt Section 6, 7 & 8)
   */
  public submitAnswer(
    roomCode: string,
    socketId: string,
    gameQuestionId: string,
    displayedOptionId: string
  ): AnswerResultPayload {
    const serverReceivedAt = Date.now();
    const room = this.getRoom(roomCode);
    if (!room) throw new Error("Room not found.");

    const playerId = room.socketToPlayer.get(socketId);
    if (!playerId) throw new Error("Player not recognized.");

    const player = room.players.get(playerId);
    if (!player) throw new Error("Player not found in room.");

    // Rule 2: Game is active
    if (room.status !== "QUESTION_ACTIVE") {
      logger.security("INACTIVE_QUESTION_SUBMISSION", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: `Answer submitted while room is in ${room.status} state.`,
      });
      throw new Error(`Cannot submit answer: question is not active (state: ${room.status}).`);
    }

    // Rule 3: Question matches current question
    const currentQ = room.questions[room.currentQuestionIndex];
    if (currentQ.id !== gameQuestionId) {
      logger.security("WRONG_QUESTION_ID", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: `Answer submitted for question ${gameQuestionId}, active is ${currentQ.id}.`,
      });
      throw new Error("Answer submitted for incorrect question.");
    }

    // Rule 4: Answer not already submitted
    if (player.answers.has(room.currentQuestionIndex)) {
      logger.security("DUPLICATE_ANSWER", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: `Duplicate answer submitted for question index ${room.currentQuestionIndex}.`,
      });
      throw new Error("Duplicate answer: You have already submitted an answer for this question.");
    }

    // Rule 5: Timing verification with small bounded grace (Prompt Section 7)
    if (serverReceivedAt > room.serverEndTime + MAX_NETWORK_GRACE_MS) {
      logger.security("LATE_ANSWER", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: `Late answer: Arrived at ${serverReceivedAt}, deadline was ${room.serverEndTime}.`,
      });
      throw new Error("Late answer: Submission arrived after server question deadline.");
    }

    // Timing check: submission cannot arrive before question start
    if (serverReceivedAt < room.serverStartTime) {
      logger.security("PREMATURE_SUBMISSION", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: "Answer arrived before server question start time.",
      });
      throw new Error("Invalid submission timing: submission arrived before question start time.");
    }

    // Anti-bot / impossible human reaction time (< 120ms human physiological threshold)
    if (room.strictReactionTimeValidation && serverReceivedAt - room.serverStartTime < 120) {
      logger.security("IMPOSSIBLE_REACTION_TIME", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: `Impossible reaction time (< 120ms): Response took ${serverReceivedAt - room.serverStartTime}ms. Possible automated script.`,
      });
      throw new Error("Impossible reaction time detected (< 120ms): Automated bot script detected.");
    }

    // Rate-limiting check: at least 150ms between actions
    const lastAns = room.lastAnswerTimestamp.get(playerId) || 0;
    if (serverReceivedAt - lastAns < 150) {
      logger.security("RATE_LIMIT_EXCEEDED", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: `Submissions arriving too quickly (${serverReceivedAt - lastAns}ms since last action).`,
      });
      throw new Error("Rate limit exceeded: Submissions arriving too quickly.");
    }
    room.lastAnswerTimestamp.set(playerId, serverReceivedAt);

    // Rule 6: Map displayed option back to original option (Prompt Section 5)
    const playerMap = room.playerOptionMaps.get(playerId);
    const originalOptionId = playerMap?.get(displayedOptionId) || displayedOptionId;

    const matchingOption = currentQ.options.find((opt) => opt.id === originalOptionId);
    if (!matchingOption) {
      logger.security("INVALID_OPTION", {
        actorId: playerId,
        socketId,
        roomCode,
        reason: `Selected option ${displayedOptionId} does not belong to active question.`,
      });
      throw new Error("Selected option does not belong to this question.");
    }

    // Scoring Engine (Prompt Section 8):
    // Formula:
    // speedRatio = remainingTime / totalQuestionTime
    // score = 100 + round(100 * speedRatio)
    const responseTimeMs = Math.max(10, serverReceivedAt - room.serverStartTime);
    const totalQuestionTimeMs = currentQ.timeLimit * 1000;
    const remainingTimeMs = Math.max(0, room.serverEndTime - serverReceivedAt);

    const isCorrect = Boolean(matchingOption.isCorrect);
    let pointsAwarded = 0;
    let speedBonus = 0;

    if (isCorrect) {
      const speedRatio = Math.max(0, Math.min(1, remainingTimeMs / totalQuestionTimeMs));
      speedBonus = Math.round(100 * speedRatio);
      pointsAwarded = 100 + speedBonus;
      player.streak++;
      player.correctAnswers++;
    } else {
      player.streak = 0;
      player.wrongAnswers++;
    }

    player.score += pointsAwarded;
    player.totalAnswerTimeMs += responseTimeMs;

    player.answers.set(room.currentQuestionIndex, {
      questionIndex: room.currentQuestionIndex,
      displayedOptionId,
      originalOptionId,
      isCorrect,
      pointsAwarded,
      responseTimeMs,
      submittedAt: serverReceivedAt,
    });

    const resultPayload: AnswerResultPayload = {
      isCorrect,
      pointsAwarded,
      speedBonus,
      newScore: player.score,
      currentStreak: player.streak,
      responseTimeMs,
    };

    // Acknowledge back to user
    this.onDirectMessage(socketId, "answer:result", resultPayload);

    // Broadcast answer count progress to lobby/host
    const answeredCount = this.getAnsweredCountForCurrentQuestion(room);
    this.onBroadcast(room.code, "room:answer_progress", {
      answeredCount,
      totalConnected: this.getConnectedPlayerCount(room),
    });

    // Check if EVERY connected active player has answered (Prompt Section 9)
    this.checkEarlyQuestionEnd(room);

    return resultPayload;
  }

  /**
   * Check Early Question End (Prompt Section 9)
   */
  private checkEarlyQuestionEnd(room: EngineRoom) {
    if (room.status !== "QUESTION_ACTIVE") return;

    const connectedPlayers = Array.from(room.players.values()).filter((p) => p.connected);
    if (connectedPlayers.length === 0) return;

    const allAnswered = connectedPlayers.every((p) =>
      p.answers.has(room.currentQuestionIndex)
    );

    if (allAnswered) {
      // End question early!
      if (room.questionTimer) clearTimeout(room.questionTimer);
      if (room.tickInterval) clearInterval(room.tickInterval);
      this.endQuestion(room, true);
    }
  }

  /**
   * End Question & Reveal (Prompt Section 10)
   */
  public endQuestion(room: EngineRoom, allAnsweredEarly = false) {
    if (room.status !== "QUESTION_ACTIVE") return;

    if (room.questionTimer) clearTimeout(room.questionTimer);
    if (room.tickInterval) clearInterval(room.tickInterval);

    room.status = "QUESTION_REVEAL";
    const currentQ = room.questions[room.currentQuestionIndex];
    const correctOpt = currentQ.options.find((o) => o.isCorrect);

    // Distribution of options selected
    const optionCounts: Record<string, number> = {};
    for (const opt of currentQ.options) {
      optionCounts[opt.id] = 0;
    }

    for (const player of Array.from(room.players.values())) {
      const ans = player.answers.get(room.currentQuestionIndex);
      if (ans && optionCounts[ans.originalOptionId] !== undefined) {
        optionCounts[ans.originalOptionId]++;
      }
    }

    const revealPayload: QuestionRevealPayload = {
      questionIndex: room.currentQuestionIndex + 1,
      correctDisplayedOptionId: correctOpt?.id || "",
      correctOptionText: correctOpt?.text || "",
      explanation: currentQ.explanation,
      optionCounts,
      allAnsweredEarly,
    };

    room.revealedQuestionData = revealPayload;

    this.onBroadcast(room.code, "question:reveal", revealPayload);

    // After 4.5 seconds of reveal examination, show Leaderboard (Prompt Section 11)
    setTimeout(() => {
      this.showLeaderboard(room);
    }, 4500);
  }

  /**
   * Calculate Standings & Show Leaderboard (Prompt Section 11)
   */
  public showLeaderboard(room: EngineRoom) {
    room.status = "LEADERBOARD";

    const entries = this.computeLeaderboard(room);

    // Update previous ranks for next question delta
    for (const entry of entries) {
      room.previousRanks.set(entry.playerId, entry.rank);
    }

    const isLastQuestion = room.currentQuestionIndex >= room.questions.length - 1;

    this.onBroadcast(room.code, "leaderboard:update", {
      questionIndex: room.currentQuestionIndex + 1,
      totalQuestions: room.questions.length,
      leaderboard: entries,
      isLastQuestion,
      nextQuestionInMs: isLastQuestion ? 3000 : 4000,
    });

    // After intermission: proceed to next question or end game
    setTimeout(() => {
      if (isLastQuestion) {
        this.finishGame(room);
      } else {
        this.launchQuestion(room, room.currentQuestionIndex + 1);
      }
    }, 4000);
  }

  /**
   * Final Game Results & Topic Diagnostics (Prompt Section 12)
   */
  public finishGame(room: EngineRoom) {
    room.status = "FINISHED";
    const finalLeaderboard = this.computeLeaderboard(room);

    for (const player of Array.from(room.players.values())) {
      const playerRank = finalLeaderboard.find((l) => l.playerId === player.id)?.rank || 1;

      // Topic performance calculation
      const topicStats: Record<
        string,
        { total: number; correct: number; totalTimeMs: number }
      > = {};

      for (let i = 0; i < room.questions.length; i++) {
        const q = room.questions[i];
        if (!topicStats[q.topic]) {
          topicStats[q.topic] = { total: 0, correct: 0, totalTimeMs: 0 };
        }
        topicStats[q.topic].total++;

        const ans = player.answers.get(i);
        if (ans) {
          topicStats[q.topic].totalTimeMs += ans.responseTimeMs;
          if (ans.isCorrect) {
            topicStats[q.topic].correct++;
          }
        }
      }

      const topicBreakdown: Record<string, TopicPerformance> = {};
      for (const [top, stats] of Object.entries(topicStats)) {
        const acc = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        let assessment: TopicPerformance["assessment"] = "Proficient";
        if (acc >= 85) assessment = "Strength";
        else if (acc <= 50) assessment = "Weakness";
        else if (acc < 75) assessment = "Needs Practice";

        topicBreakdown[top] = {
          topic: top as Topic,
          totalQuestions: stats.total,
          correctAnswers: stats.correct,
          accuracy: Number(acc.toFixed(1)),
          averageResponseTimeMs:
            stats.total > 0 ? Math.round(stats.totalTimeMs / stats.total) : 0,
          assessment,
        };
      }

      const totalAns = player.correctAnswers + player.wrongAnswers;
      const overallAccuracy = totalAns > 0 ? (player.correctAnswers / totalAns) * 100 : 0;
      const avgTimeMs =
        totalAns > 0 ? Math.round(player.totalAnswerTimeMs / totalAns) : 0;

      const playerResult: GameFinishedPayload = {
        finalRank: playerRank,
        totalPlayers: room.players.size,
        finalScore: player.score,
        accuracy: Number(overallAccuracy.toFixed(1)),
        correctAnswers: player.correctAnswers,
        wrongAnswers: player.wrongAnswers,
        averageResponseTimeMs: avgTimeMs,
        topicBreakdown,
        finalLeaderboard,
      };

      if (player.connected && player.socketId) {
        this.onDirectMessage(player.socketId, "game:end", playerResult);
      }
    }

    // Broadcast generic end to host & spectators
    this.onBroadcast(room.code, "game:end", {
      finalLeaderboard,
      totalPlayers: room.players.size,
    });
  }

  /**
   * Compute Live Standings & Movement Delta (Prompt Section 11)
   */
  public computeLeaderboard(room: EngineRoom): LeaderboardEntry[] {
    const sorted = Array.from(room.players.values()).sort((a, b) => {
      // Primary: Score descending
      if (b.score !== a.score) return b.score - a.score;
      // Secondary: More correct answers
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      // Tertiary: Faster cumulative answer time
      return a.totalAnswerTimeMs - b.totalAnswerTimeMs;
    });

    return sorted.map((player, idx) => {
      const currentRank = idx + 1;
      const prevRank = room.previousRanks.get(player.id) ?? currentRank;

      let movement: "up" | "down" | "same" = "same";
      let rankDelta = 0;

      if (currentRank < prevRank) {
        movement = "up";
        rankDelta = prevRank - currentRank; // e.g. was 3 now 1 -> +2
      } else if (currentRank > prevRank) {
        movement = "down";
        rankDelta = currentRank - prevRank; // e.g. was 1 now 3 -> -2
      }

      const totalAns = player.correctAnswers + player.wrongAnswers;
      const accuracy = totalAns > 0 ? (player.correctAnswers / totalAns) * 100 : 0;

      return {
        rank: currentRank,
        playerId: player.id,
        displayName: player.displayName,
        score: player.score,
        scoreChange: player.score - player.scoreBeforeQuestion,
        accuracy: Number(accuracy.toFixed(1)),
        movement,
        rankDelta,
        streak: player.streak,
        connected: player.connected,
      };
    });
  }

  private recordRankSnapshot(room: EngineRoom) {
    const list = Array.from(room.players.values());
    list.forEach((p, idx) => {
      room.previousRanks.set(p.id, idx + 1);
    });
  }

  private getAnsweredCountForCurrentQuestion(room: EngineRoom): number {
    let count = 0;
    for (const p of Array.from(room.players.values())) {
      if (p.answers.has(room.currentQuestionIndex)) count++;
    }
    return count;
  }

  private getConnectedPlayerCount(room: EngineRoom): number {
    let count = 0;
    for (const p of Array.from(room.players.values())) {
      if (p.connected) count++;
    }
    return count;
  }

  /**
   * Build State Snapshot for Reconnection or Joining
   */
  public getRoomSnapshotForPlayer(
    roomCode: string,
    playerId?: string
  ): any {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = playerId ? room.players.get(playerId) : null;
    const hasAnswered = player ? player.answers.has(room.currentQuestionIndex) : false;

    let customizedQuestion: QuestionStartPayload | null = null;
    if (room.status === "QUESTION_ACTIVE") {
      const q = room.questions[room.currentQuestionIndex];
      const playerMap = playerId ? room.playerOptionMaps.get(playerId) : null;

      const opts: ShuffledOptionDTO[] = q.options.map((opt, idx) => {
        let dispId = opt.id;
        if (playerMap) {
          // Find matching displayedId
          for (const [dId, origId] of Array.from(playerMap.entries())) {
            if (origId === opt.id) {
              dispId = dId;
              break;
            }
          }
        }
        return {
          displayedId: dispId,
          text: opt.text,
          imageUrl: opt.imageUrl,
        };
      });

      customizedQuestion = {
        gameQuestionId: q.id,
        questionIndex: room.currentQuestionIndex + 1,
        totalQuestions: room.questions.length,
        text: q.text,
        topic: q.topic,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit,
        serverStartTime: room.serverStartTime,
        serverEndTime: room.serverEndTime,
        imageUrl: q.imageUrl,
        tableData: q.tableData,
        options: opts,
      };
    }

    return {
      code: room.code,
      status: room.status,
      questionSetTitle: room.questionSetTitle,
      currentQuestionIndex: room.currentQuestionIndex + 1,
      totalQuestions: room.questions.length,
      playerCount: room.players.size,
      connectedCount: this.getConnectedPlayerCount(room),
      currentQuestion: customizedQuestion,
      currentQuestionRemainingMs: Math.max(0, room.serverEndTime - Date.now()),
      hasAnsweredCurrentQuestion: hasAnswered,
      lastReveal: room.revealedQuestionData,
      leaderboard: this.computeLeaderboard(room),
      players: Array.from(room.players.values()).map((p) => ({
        id: p.id,
        displayName: p.displayName,
        score: p.score,
        connected: p.connected,
        hasAnsweredCurrent: p.answers.has(room.currentQuestionIndex),
      })),
    };
  }

  public endRoom(roomCode: string) {
    const room = this.getRoom(roomCode);
    if (!room) return;
    if (room.questionTimer) clearTimeout(room.questionTimer);
    if (room.tickInterval) clearInterval(room.tickInterval);
    room.status = "FINISHED";
    this.rooms.delete(room.code);
  }
}

// Global Singleton Engine
declare global {
  // eslint-disable-next-line no-var
  var arenaEngine: MultiplayerGameEngine | undefined;
}

export const gameEngine = globalThis.arenaEngine || new MultiplayerGameEngine();

if (process.env.NODE_ENV !== "production") {
  globalThis.arenaEngine = gameEngine;
}
