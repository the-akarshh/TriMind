import { describe, it, expect, beforeEach } from "vitest";
import { MultiplayerGameEngine } from "../src/lib/engine/multiplayer-engine";

describe("MultiplayerGameEngine — Full Real-Time Engine Suite", () => {
  let engine: MultiplayerGameEngine;
  let broadcastEvents: { roomCode: string; event: string; payload: any }[] = [];
  let directMessages: { socketId: string; event: string; payload: any }[] = [];

  beforeEach(() => {
    broadcastEvents = [];
    directMessages = [];
    engine = new MultiplayerGameEngine(
      (roomCode, event, payload) => {
        broadcastEvents.push({ roomCode, event, payload });
      },
      (socketId, event, payload) => {
        directMessages.push({ socketId, event, payload });
      }
    );
  });

  it("1. Room Initialization & Waiting State", async () => {
    const room = await engine.initRoom("TEST01", "sock-host", "usr-host", "qs-quant-101", 50);

    expect(room.code).toBe("TEST01");
    expect(room.status).toBe("WAITING");
    expect(room.questions.length).toBeGreaterThan(0);
    expect(room.players.size).toBe(0);
  });

  it("2. Player Joining, Reconnect Token & Duplicate Name Check", async () => {
    await engine.initRoom("TEST02", "sock-host", "usr-host", "qs-quant-101", 50);

    const { player, reconnectToken } = engine.joinRoom("TEST02", "sock-p1", "Arjun Sharma");
    expect(player.id).toBeDefined();
    expect(player.displayName).toBe("Arjun Sharma");
    expect(reconnectToken).toBeDefined();
    expect(player.connected).toBe(true);

    // Duplicate name rejected
    expect(() => {
      engine.joinRoom("TEST02", "sock-p2", "Arjun Sharma");
    }).toThrow("Display name is already taken");
  });

  it("3. Spectator Mode Registration", async () => {
    await engine.initRoom("TEST03", "sock-host", "usr-host", "qs-quant-101", 50);

    const success = engine.joinSpectator("TEST03", "sock-spec-1");
    expect(success).toBe(true);

    const room = engine.getRoom("TEST03")!;
    expect(room.spectators.has("sock-spec-1")).toBe(true);
  });

  it("4. Host Controls & Starting Validation", async () => {
    await engine.initRoom("TEST04", "sock-host", "usr-host", "qs-quant-101", 50);

    // Cannot start with 0 players
    expect(() => {
      engine.startGame("TEST04", "sock-host");
    }).toThrow("at least 1 player must join");

    // Add player
    engine.joinRoom("TEST04", "sock-p1", "P1");

    // Unauthorized non-host cannot start
    expect(() => {
      engine.startGame("TEST04", "sock-p1");
    }).toThrow("Only host can start game");

    // Host starts successfully
    engine.startGame("TEST04", "sock-host");
    const room = engine.getRoom("TEST04")!;
    expect(room.status).toBe("STARTING");
  });

  it("5. Option Shuffling & Secrecy", async () => {
    const room = await engine.initRoom("TEST05", "sock-host", "usr-host", "qs-quant-101", 50);
    engine.joinRoom("TEST05", "sock-p1", "Player A");
    engine.joinRoom("TEST05", "sock-p2", "Player B");

    // Launch Q0 directly
    engine.launchQuestion(room, 0);

    expect(room.status).toBe("QUESTION_ACTIVE");

    // Check message sent to Player A
    const msgA = directMessages.find((m) => m.socketId === "sock-p1" && m.event === "question:start");
    const msgB = directMessages.find((m) => m.socketId === "sock-p2" && m.event === "question:start");

    expect(msgA).toBeDefined();
    expect(msgB).toBeDefined();

    // Verify isCorrect is never sent
    msgA?.payload.options.forEach((opt: any) => {
      expect(opt.isCorrect).toBeUndefined();
    });

    // Verify option mappings are tracked per player
    const p1 = Array.from(room.players.values())[0];
    const mapA = room.playerOptionMaps.get(p1.id);
    expect(mapA).toBeDefined();
    expect(mapA?.size).toBe(4);
  });

  it("6. Correct vs Incorrect Answer Scoring & Speed Bonus", async () => {
    const room = await engine.initRoom("TEST06", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player: p1 } = engine.joinRoom("TEST06", "sock-p1", "Player 1");
    const { player: p2 } = engine.joinRoom("TEST06", "sock-p2", "Player 2");

    engine.launchQuestion(room, 0);

    const q = room.questions[0];
    const correctOpt = q.options.find((o) => o.isCorrect)!;
    const wrongOpt = q.options.find((o) => !o.isCorrect)!;

    // Find displayed ID for player 1's correct option
    const p1Map = room.playerOptionMaps.get(p1.id)!;
    let p1CorrectDispId = "";
    for (const [dispId, origId] of Array.from(p1Map.entries())) {
      if (origId === correctOpt.id) p1CorrectDispId = dispId;
    }

    // Find displayed ID for player 2's wrong option
    const p2Map = room.playerOptionMaps.get(p2.id)!;
    let p2WrongDispId = "";
    for (const [dispId, origId] of Array.from(p2Map.entries())) {
      if (origId === wrongOpt.id) p2WrongDispId = dispId;
    }

    // P1 submits correct answer fast
    const res1 = engine.submitAnswer("TEST06", "sock-p1", q.id, p1CorrectDispId);
    expect(res1.isCorrect).toBe(true);
    expect(res1.pointsAwarded).toBeGreaterThanOrEqual(100);
    expect(res1.pointsAwarded).toBeLessThanOrEqual(200);
    expect(p1.score).toBe(res1.pointsAwarded);
    expect(p1.streak).toBe(1);

    // P2 submits wrong answer
    const res2 = engine.submitAnswer("TEST06", "sock-p2", q.id, p2WrongDispId);
    expect(res2.isCorrect).toBe(false);
    expect(res2.pointsAwarded).toBe(0);
    expect(p2.score).toBe(0);
    expect(p2.streak).toBe(0);
  });

  it("7. Duplicate & Late Answer Rejection", async () => {
    const room = await engine.initRoom("TEST07", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player: p1 } = engine.joinRoom("TEST07", "sock-p1", "Player 1");
    const { player: p2 } = engine.joinRoom("TEST07", "sock-p2", "Player 2");

    engine.launchQuestion(room, 0);
    const q = room.questions[0];
    const dispId1 = Array.from(room.playerOptionMaps.get(p1.id)!.keys())[0];
    const dispId2 = Array.from(room.playerOptionMaps.get(p2.id)!.keys())[0];

    // Player 1's first answer succeeds
    engine.submitAnswer("TEST07", "sock-p1", q.id, dispId1);

    // Player 1 duplicate submission throws error while room is still QUESTION_ACTIVE
    expect(() => {
      engine.submitAnswer("TEST07", "sock-p1", q.id, dispId1);
    }).toThrow("Duplicate answer");

    // Manually advance room endTime past grace window to simulate late submission for Player 2
    room.serverEndTime = Date.now() - 5000;

    expect(() => {
      engine.submitAnswer("TEST07", "sock-p2", q.id, dispId2);
    }).toThrow("Late answer");
  });

  it("8. Early Question End when All Connected Players Answer", async () => {
    const room = await engine.initRoom("TEST08", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player: p1 } = engine.joinRoom("TEST08", "sock-p1", "P1");
    const { player: p2 } = engine.joinRoom("TEST08", "sock-p2", "P2");

    engine.launchQuestion(room, 0);
    expect(room.status).toBe("QUESTION_ACTIVE");

    const p1Disp = Array.from(room.playerOptionMaps.get(p1.id)!.keys())[0];
    const p2Disp = Array.from(room.playerOptionMaps.get(p2.id)!.keys())[0];

    engine.submitAnswer("TEST08", "sock-p1", room.questions[0].id, p1Disp);
    expect(room.status).toBe("QUESTION_ACTIVE"); // P2 still hasn't answered

    // P2 answers -> All connected active players have answered!
    engine.submitAnswer("TEST08", "sock-p2", room.questions[0].id, p2Disp);

    // Should immediately transition to QUESTION_REVEAL without waiting for timer!
    expect(room.status).toBe("QUESTION_REVEAL");
    expect(room.revealedQuestionData?.allAnsweredEarly).toBe(true);
  });

  it("9. Live Leaderboard Rank Movement Calculation (up, down, same)", async () => {
    const room = await engine.initRoom("TEST09", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player: p1 } = engine.joinRoom("TEST09", "sock-p1", "P1");
    const { player: p2 } = engine.joinRoom("TEST09", "sock-p2", "P2");

    // Set initial ranks: P1 is rank 1, P2 is rank 2
    room.previousRanks.set(p1.id, 1);
    room.previousRanks.set(p2.id, 2);

    // Now P2 scores higher: P2 has 200, P1 has 100
    p1.score = 100;
    p2.score = 200;

    const entries = engine.computeLeaderboard(room);

    expect(entries[0].playerId).toBe(p2.id); // P2 became #1
    expect(entries[0].movement).toBe("up");
    expect(entries[0].rankDelta).toBe(1); // 2 -> 1 (+1 rank)

    expect(entries[1].playerId).toBe(p1.id); // P1 dropped to #2
    expect(entries[1].movement).toBe("down");
    expect(entries[1].rankDelta).toBe(1); // 1 -> 2 (-1 rank)
  });

  it("10. Player Disconnect & Seamless Reconnection", async () => {
    const room = await engine.initRoom("TEST10", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player, reconnectToken } = engine.joinRoom("TEST10", "sock-orig", "Cadet X");

    player.score = 350;

    // Simulate socket disconnect
    engine.handleDisconnect("sock-orig");
    expect(player.connected).toBe(false);

    // Other players would continue normally; room is not paused.
    // Now Cadet X reconnects with new socket ID:
    const restored = engine.reconnectPlayer("TEST10", "sock-new", player.id, reconnectToken);

    expect(restored.connected).toBe(true);
    expect(restored.socketId).toBe("sock-new");
    expect(restored.score).toBe(350); // score preserved!
  });

  it("11. Final Results & Topic-Wise Diagnostic Breakdown", async () => {
    const room = await engine.initRoom("TEST11", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player: p1 } = engine.joinRoom("TEST11", "sock-p1", "Candidate A");

    // Simulate completing questions
    p1.score = 520;
    p1.correctAnswers = 3;
    p1.wrongAnswers = 1;
    p1.answers.set(0, {
      questionIndex: 0,
      displayedOptionId: "opt-1",
      originalOptionId: "opt-1",
      isCorrect: true,
      pointsAwarded: 180,
      responseTimeMs: 2500,
      submittedAt: Date.now(),
    });

    engine.finishGame(room);

    expect(room.status).toBe("FINISHED");

    // Verify game:end message was sent with topic breakdown
    const endMsg = directMessages.find((m) => m.socketId === "sock-p1" && m.event === "game:end");
    expect(endMsg).toBeDefined();
    expect(endMsg?.payload.topicBreakdown).toBeDefined();
    expect(endMsg?.payload.finalScore).toBe(520);
    expect(endMsg?.payload.accuracy).toBe(75);
  });
});
