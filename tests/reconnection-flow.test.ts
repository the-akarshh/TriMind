import { describe, it, expect, beforeEach } from "vitest";
import { MultiplayerGameEngine } from "../src/lib/engine/multiplayer-engine";

describe("Real-Time Reconnection Flow Suite", () => {
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

  it("Full Reconnection Cycle: Join -> Score Q1 -> Drop -> Advance to Q2 -> Reconnect -> Score Q2", async () => {
    const room = await engine.initRoom("RECONN1", "sock-host", "usr-host", "qs-quant-101", 50);

    // 1. Players join (Rohan + a peer)
    const { player, reconnectToken } = engine.joinRoom("RECONN1", "sock-p1", "Rohan Mehta");
    engine.joinRoom("RECONN1", "sock-p2", "Cadet 2");
    expect(player.connected).toBe(true);
    expect(player.score).toBe(0);
    expect(reconnectToken).toBeDefined();

    // 2. Launch Question 1 & Submit Answer
    engine.launchQuestion(room, 0);
    const q1 = room.questions[0];
    const correctOpt1 = q1.options.find((o) => o.isCorrect)!;
    const pMap1 = room.playerOptionMaps.get(player.id)!;
    let dispId1 = "";
    for (const [dId, origId] of Array.from(pMap1.entries())) {
      if (origId === correctOpt1.id) dispId1 = dId;
    }

    const ansResult1 = engine.submitAnswer("RECONN1", "sock-p1", q1.id, dispId1);
    expect(ansResult1.isCorrect).toBe(true);
    expect(player.score).toBeGreaterThan(0);
    const q1Score = player.score;
    expect(player.streak).toBe(1);

    // 3. Player Abruptly Disconnects (socket drops)
    engine.handleDisconnect("sock-p1");
    expect(player.connected).toBe(false);
    expect(room.socketToPlayer.has("sock-p1")).toBe(false);

    // Verify room state is active and unaffected
    expect(room.status).toBe("QUESTION_ACTIVE");

    // 4. Server advances to Question 2 while player is offline
    engine.launchQuestion(room, 1);
    expect(room.currentQuestionIndex).toBe(1);
    expect(player.answers.has(1)).toBe(false);

    // 5. Player Reconnects with New Socket and Token
    const newSocketId = "sock-p1-reconnected-99";
    const restoredPlayer = engine.reconnectPlayer("RECONN1", newSocketId, player.id, reconnectToken);

    expect(restoredPlayer.connected).toBe(true);
    expect(restoredPlayer.socketId).toBe(newSocketId);
    expect(restoredPlayer.score).toBe(q1Score);
    expect(restoredPlayer.streak).toBe(1);
    expect(room.socketToPlayer.get(newSocketId)).toBe(player.id);

    // 6. Verify Player Snapshot reflects active Q2 and preserved score
    const snapshot = engine.getRoomSnapshotForPlayer("RECONN1", player.id);
    expect(snapshot.status).toBe("QUESTION_ACTIVE");
    expect(snapshot.currentQuestionIndex).toBe(2); // 1-based
    expect(snapshot.hasAnsweredCurrentQuestion).toBe(false);
    expect(snapshot.currentQuestion).toBeDefined();
    expect(snapshot.currentQuestion.options.length).toBe(4);

    // 7. Reconnected Player Answers Question 2 on the NEW socket
    const q2 = room.questions[1];
    const correctOpt2 = q2.options.find((o) => o.isCorrect)!;
    const pMap2 = room.playerOptionMaps.get(player.id)!;
    let dispId2 = "";
    for (const [dId, origId] of Array.from(pMap2.entries())) {
      if (origId === correctOpt2.id) dispId2 = dId;
    }

    const ansResult2 = engine.submitAnswer("RECONN1", newSocketId, q2.id, dispId2);
    expect(ansResult2.isCorrect).toBe(true);
    expect(player.score).toBeGreaterThan(q1Score);
    expect(player.streak).toBe(2);

    // 8. Verify Leaderboard contains the reconnected player's updated score
    const leaderboard = engine.computeLeaderboard(room);
    const entry = leaderboard.find((e) => e.playerId === player.id);
    expect(entry).toBeDefined();
    expect(entry?.connected).toBe(true);
    expect(entry?.score).toBe(player.score);
  });

  it("Should reject reconnection with forged or invalid token", async () => {
    await engine.initRoom("RECONN2", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player } = engine.joinRoom("RECONN2", "sock-p1", "Sneha Rao");

    engine.handleDisconnect("sock-p1");

    expect(() => {
      engine.reconnectPlayer("RECONN2", "sock-p1-new", player.id, "forged-fake-token-1234");
    }).toThrow("Invalid reconnection token");
  });

  it("Should reject reconnection for non-existent player or wrong room code", async () => {
    await engine.initRoom("RECONN3", "sock-host", "usr-host", "qs-quant-101", 50);

    expect(() => {
      engine.reconnectPlayer("RECONN3", "sock-random", "ply-nonexistent", "token-xyz");
    }).toThrow("Player record not found");

    expect(() => {
      engine.reconnectPlayer("INVALID_ROOM", "sock-random", "ply-123", "token-xyz");
    }).toThrow("Room not found");
  });
});
