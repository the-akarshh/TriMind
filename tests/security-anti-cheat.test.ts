import { describe, it, expect, beforeEach } from "vitest";
import { MultiplayerGameEngine, MAX_NETWORK_GRACE_MS } from "../src/lib/engine/multiplayer-engine";
import {
  createDefaultPlayerInventory,
  activatePowerUpServerAuthoritative,
  MAX_TOTAL_POWER_UPS_PER_MATCH,
} from "../src/lib/engine/power-ups";

describe("Server-Authoritative Anti-Cheat & Security Audit Suite", () => {
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

  it("1. Server Ignores Client Timers & Scores (Server-Authoritative Calculation)", async () => {
    const room = await engine.initRoom("SEC01", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player } = engine.joinRoom("SEC01", "sock-p1", "Aditya");

    engine.launchQuestion(room, 0);
    const q = room.questions[0];
    const correctOpt = q.options.find((o) => o.isCorrect)!;
    const pMap = room.playerOptionMaps.get(player.id)!;
    let dispId = "";
    for (const [dId, origId] of Array.from(pMap.entries())) {
      if (origId === correctOpt.id) dispId = dId;
    }

    // Engine's submitAnswer only accepts roomCode, socketId, questionId, and displayedOptionId.
    // There is no parameter for score or timer; server calculates everything.
    const result = engine.submitAnswer("SEC01", "sock-p1", q.id, dispId);
    expect(result.pointsAwarded).toBeGreaterThanOrEqual(100);
    expect(result.pointsAwarded).toBeLessThanOrEqual(200);
    expect(player.score).toBe(result.pointsAwarded);
  });

  it("2. Rejection of Duplicate Answers (Answer Replay Protection)", async () => {
    const room = await engine.initRoom("SEC02", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player } = engine.joinRoom("SEC02", "sock-p1", "Aarav");
    engine.joinRoom("SEC02", "sock-p2", "Peer Player");

    engine.launchQuestion(room, 0);
    const q = room.questions[0];
    const pMap = room.playerOptionMaps.get(player.id)!;
    const dispId = Array.from(pMap.keys())[0];

    // First submission succeeds
    engine.submitAnswer("SEC02", "sock-p1", q.id, dispId);

    // Second duplicate submission must be rejected
    expect(() => {
      engine.submitAnswer("SEC02", "sock-p1", q.id, dispId);
    }).toThrow("Duplicate answer: You have already submitted an answer for this question.");
  });

  it("3. Rejection of Late Answers Arriving After Question Deadline", async () => {
    const room = await engine.initRoom("SEC03", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player } = engine.joinRoom("SEC03", "sock-p1", "Pooja");

    engine.launchQuestion(room, 0);
    const q = room.questions[0];
    const pMap = room.playerOptionMaps.get(player.id)!;
    const dispId = Array.from(pMap.keys())[0];

    // Simulate time passing beyond deadline + network grace window
    room.serverEndTime = Date.now() - 500; // Expired 500ms ago

    expect(() => {
      engine.submitAnswer("SEC03", "sock-p1", q.id, dispId);
    }).toThrow("Late answer: Submission arrived after server question deadline.");
  });

  it("4. Rejection of Premature Submissions Arriving Before Question Start", async () => {
    const room = await engine.initRoom("SEC04", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player } = engine.joinRoom("SEC04", "sock-p1", "Vikram");

    engine.launchQuestion(room, 0);
    const q = room.questions[0];
    const pMap = room.playerOptionMaps.get(player.id)!;
    const dispId = Array.from(pMap.keys())[0];

    // Simulate clock drift / packet arriving before server question start
    room.serverStartTime = Date.now() + 5000;

    expect(() => {
      engine.submitAnswer("SEC04", "sock-p1", q.id, dispId);
    }).toThrow("Invalid submission timing: submission arrived before question start time.");
  });

  it("5. Bot Detection: Rejection of Impossible Human Reaction Times (< 120ms) When Strict Mode Enabled", async () => {
    const room = await engine.initRoom("SEC05", "sock-host", "usr-host", "qs-quant-101", 50);
    room.strictReactionTimeValidation = true;
    const { player } = engine.joinRoom("SEC05", "sock-p1", "Bot_Automaton");

    engine.launchQuestion(room, 0);
    const q = room.questions[0];
    const pMap = room.playerOptionMaps.get(player.id)!;
    const dispId = Array.from(pMap.keys())[0];

    // Simulate response received 50ms after question start (superhuman/automated script)
    room.serverStartTime = Date.now() - 50;

    expect(() => {
      engine.submitAnswer("SEC05", "sock-p1", q.id, dispId);
    }).toThrow("Impossible reaction time detected (< 120ms): Automated bot script detected.");
  });

  it("6. Rejection of Wrong Question ID", async () => {
    const room = await engine.initRoom("SEC06", "sock-host", "usr-host", "qs-quant-101", 50);
    const { player } = engine.joinRoom("SEC06", "sock-p1", "Dev");

    engine.launchQuestion(room, 0);
    const pMap = room.playerOptionMaps.get(player.id)!;
    const dispId = Array.from(pMap.keys())[0];

    expect(() => {
      engine.submitAnswer("SEC06", "sock-p1", "wrong-question-id-999", dispId);
    }).toThrow("Answer submitted for incorrect question.");
  });

  it("7. Rejection of Forged Option ID", async () => {
    const room = await engine.initRoom("SEC07", "sock-host", "usr-host", "qs-quant-101", 50);
    engine.joinRoom("SEC07", "sock-p1", "Kavya");

    engine.launchQuestion(room, 0);
    const q = room.questions[0];

    expect(() => {
      engine.submitAnswer("SEC07", "sock-p1", q.id, "fake-fabricated-option-xyz");
    }).toThrow("Selected option does not belong to this question.");
  });

  it("8. Rejection of Unauthorized Host Commands", async () => {
    await engine.initRoom("SEC08", "sock-host-legit", "usr-host", "qs-quant-101", 50);
    engine.joinRoom("SEC08", "sock-cadet-1", "Cadet Impersonator");

    // Impersonator socket tries to start match
    expect(() => {
      engine.startGame("SEC08", "sock-cadet-1");
    }).toThrow("Unauthorized: Only host can start game.");
  });

  it("9. Tactical Power-Up Anti-Cheat: Quotas, Duplication & Timing Enforcement", () => {
    const inventory = createDefaultPlayerInventory();
    const fakeOptions = [
      { id: "opt-1", isCorrect: true },
      { id: "opt-2", isCorrect: false },
      { id: "opt-3", isCorrect: false },
      { id: "opt-4", isCorrect: false },
    ];

    // Cannot activate when question is not active
    const inactiveAttempt = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: false,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 15000,
    });
    expect(inactiveAttempt.success).toBe(false);
    expect(inactiveAttempt.error).toContain("only be activated during an active question");

    // Cannot activate after answering
    const postAnswerAttempt = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: true,
      serverTimeRemainingMs: 15000,
    });
    expect(postAnswerAttempt.success).toBe(false);
    expect(postAnswerAttempt.error).toContain("Cannot use power-up after submitting an answer");

    // Valid activation succeeds
    const validActivation = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 15000,
    });
    expect(validActivation.success).toBe(true);
    expect(inventory.remainingUses.get("DOUBLE_POINTS")).toBe(0);

    // Duplicate activation of same power-up on same question fails
    const duplicateAttempt = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 10000,
    });
    expect(duplicateAttempt.success).toBe(false);
    expect(duplicateAttempt.error).toContain("already active on this question");

    // Reset question active state for next question
    inventory.activeOnCurrentQuestion.clear();

    // Activating when quota is 0 fails
    const exhaustedAttempt = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 15000,
    });
    expect(exhaustedAttempt.success).toBe(false);
    expect(exhaustedAttempt.error).toContain("No remaining uses");

    // Use REMOVE_TWO (use 2)
    const use2 = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "REMOVE_TWO",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 15000,
      questionOptions: fakeOptions,
    });
    expect(use2.success).toBe(true);
    expect(use2.removedOptionIds?.length).toBe(2);

    inventory.activeOnCurrentQuestion.clear();

    // Use TIME_FREEZE (use 3, reaches match maximum of 3)
    const use3 = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "TIME_FREEZE",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 15000,
    });
    expect(use3.success).toBe(true);

    inventory.activeOnCurrentQuestion.clear();

    // Attempting a 4th power-up in match must be rejected by match quota limit
    const use4 = activatePowerUpServerAuthoritative({
      inventory,
      powerUpType: "SECOND_CHANCE",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 15000,
    });
    expect(use4.success).toBe(false);
    expect(use4.error).toContain(`Maximum match power-up limit (${MAX_TOTAL_POWER_UPS_PER_MATCH}) reached`);
  });
});
