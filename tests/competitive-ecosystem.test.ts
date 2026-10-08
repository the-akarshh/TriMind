import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateFairLeagueScore,
  getCurrentSeason,
  freezeSeason,
  rolloverNewSeason,
} from "../src/lib/services/season-service";
import {
  calculateStreakUpdate,
  getTodayDailyChallenge,
  submitDailyChallengeAttempt,
  getDailyChallengeLeaderboard,
} from "../src/lib/services/daily-challenge-service";
import {
  TeamBattleManager,
} from "../src/lib/engine/team-engine";
import {
  createDefaultPlayerInventory,
  activatePowerUpServerAuthoritative,
  MAX_TOTAL_POWER_UPS_PER_MATCH,
} from "../src/lib/engine/power-ups";
import {
  calculateNextAdaptiveDifficulty,
} from "../src/lib/engine/adaptive-difficulty";
import {
  calculateLevelFromXP,
  getXPForLevel,
  getRankTierFromLevel,
  calculateMatchXP,
  awardMatchProgression,
  getUserProgression,
} from "../src/lib/services/progression-service";
import {
  generateMatchFeedback,
} from "../src/lib/services/feedback-service";
import {
  getTopicLeaderboard,
  calculateTopicEloDelta,
} from "../src/lib/services/topic-league-service";

describe("Fair League Scoring & Season Rollover", () => {
  it("should reward high accuracy over volume spam in fair league scoring", () => {
    // Player A: 20 high quality games (average 2500 score, 95% accuracy)
    const playerAGames = Array.from({ length: 20 }, () => ({ score: 2500, accuracy: 95 }));
    const playerAScore = calculateFairLeagueScore(playerAGames);

    // Player B: 100 spammed games with poor accuracy (average 1000 score, 35% accuracy)
    const playerBGames = Array.from({ length: 100 }, () => ({ score: 1000, accuracy: 35 }));
    const playerBScore = calculateFairLeagueScore(playerBGames);

    // Skill & precision must dominate over spam!
    expect(playerAScore.finalScore).toBeGreaterThan(playerBScore.finalScore);
    expect(playerAScore.accuracyFactor).toBeGreaterThan(playerBScore.accuracyFactor);
  });

  it("should freeze season standings into permanent historical snapshots", async () => {
    const current = await getCurrentSeason();
    expect(current.isActive).toBe(true);

    const freezeResult = await freezeSeason(current.id);
    expect(freezeResult.success).toBe(true);
    expect(freezeResult.season.isFrozen).toBe(true);
    expect(freezeResult.snapshotsCount).toBeGreaterThan(0);
  });

  it("should rollover to a brand new season cleanly", async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 86400000 * 90);
    const newSeason = await rolloverNewSeason("Season 2 (Winter 2026)", startDate, endDate);

    expect(newSeason.id).toBeDefined();
    expect(newSeason.name).toBe("Season 2 (Winter 2026)");
    expect(newSeason.isActive).toBe(true);
    expect(newSeason.isFrozen).toBe(false);
  });
});

describe("Team Battle Engine", () => {
  let teamManager: TeamBattleManager;

  beforeEach(() => {
    teamManager = new TeamBattleManager();
  });

  it("should allow players to join teams within capacity (max 5)", () => {
    expect(teamManager.joinTeam("p1", "team-alpha")).toBe(true);
    expect(teamManager.joinTeam("p2", "team-alpha")).toBe(true);
    expect(teamManager.joinTeam("p3", "team-alpha")).toBe(true);
    expect(teamManager.joinTeam("p4", "team-alpha")).toBe(true);
    expect(teamManager.joinTeam("p5", "team-alpha")).toBe(true);

    // 6th player should be rejected (capacity 5 reached)
    expect(teamManager.joinTeam("p6", "team-alpha")).toBe(false);

    // Can join team-beta instead
    expect(teamManager.joinTeam("p6", "team-beta")).toBe(true);
  });

  it("should auto-balance players evenly across squads", () => {
    const players = ["c1", "c2", "c3", "c4", "c5", "c6"];
    teamManager.autoBalance(players);

    const teams = teamManager.getTeams();
    expect(teams[0].memberPlayerIds.size).toBe(3);
    expect(teams[1].memberPlayerIds.size).toBe(3);
  });

  it("should compute live team score as the sum of member scores", () => {
    teamManager.joinTeam("p1", "team-alpha");
    teamManager.joinTeam("p2", "team-alpha");
    teamManager.joinTeam("p3", "team-beta");
    teamManager.joinTeam("p4", "team-beta");

    const playerScores = new Map([
      ["p1", { displayName: "Alice", score: 450, accuracy: 90 }],
      ["p2", { displayName: "Bob", score: 550, accuracy: 95 }],
      ["p3", { displayName: "Charlie", score: 300, accuracy: 80 }],
      ["p4", { displayName: "Dave", score: 400, accuracy: 85 }],
    ]);

    const leaderboard = teamManager.computeTeamLeaderboard(playerScores);
    expect(leaderboard[0].teamId).toBe("team-alpha");
    expect(leaderboard[0].totalScore).toBe(1000); // 450 + 550
    expect(leaderboard[1].teamId).toBe("team-beta");
    expect(leaderboard[1].totalScore).toBe(700); // 300 + 400
  });
});

describe("Daily Placement Challenge & Consecutive Streak System", () => {
  it("should correctly update streaks on consecutive days and reset on missed days", () => {
    const today = new Date("2026-10-08T12:00:00Z");
    const yesterday = new Date("2026-10-07T12:00:00Z");
    const threeDaysAgo = new Date("2026-10-05T12:00:00Z");

    // Consecutive day -> streak increments
    const consecutive = calculateStreakUpdate(5, yesterday, today);
    expect(consecutive.newStreak).toBe(6);
    expect(consecutive.streakMaintained).toBe(true);

    // Same day -> maintains current streak
    const sameDay = calculateStreakUpdate(5, today, today);
    expect(sameDay.newStreak).toBe(5);
    expect(sameDay.isNewDay).toBe(false);

    // Missed day (> 48h) -> resets to 1
    const missed = calculateStreakUpdate(5, threeDaysAgo, today);
    expect(missed.newStreak).toBe(1);
    expect(missed.streakMaintained).toBe(false);
  });

  it("should record 1st daily attempt as ranked and subsequent as practice", async () => {
    const testUserId = `test-user-${Date.now()}`;

    // First attempt -> Official Ranked
    const firstAttempt = await submitDailyChallengeAttempt({
      userId: testUserId,
      displayName: "Test Cadet",
      score: 850,
      accuracy: 90,
      timeTakenSec: 45,
    });
    expect(firstAttempt.success).toBe(true);
    expect(firstAttempt.isRanked).toBe(true);

    // Second attempt on same day -> Practice Only
    const secondAttempt = await submitDailyChallengeAttempt({
      userId: testUserId,
      displayName: "Test Cadet",
      score: 950,
      accuracy: 100,
      timeTakenSec: 35,
    });
    expect(secondAttempt.success).toBe(true);
    expect(secondAttempt.isRanked).toBe(false);
  });

  it("should return daily leaderboard sorted by score, accuracy, and speed", async () => {
    const lb = await getDailyChallengeLeaderboard();
    expect(lb.length).toBeGreaterThan(0);
    // Leaderboard must be strictly ordered
    for (let i = 0; i < lb.length - 1; i++) {
      expect(lb[i].score).toBeGreaterThanOrEqual(lb[i + 1].score);
    }
  });
});

describe("Server-Authoritative Tactical Power-Ups", () => {
  it("should activate REMOVE_TWO (50:50) and return 2 incorrect option IDs", () => {
    const inv = createDefaultPlayerInventory();
    const options = [
      { id: "opt-1", isCorrect: true },
      { id: "opt-2", isCorrect: false },
      { id: "opt-3", isCorrect: false },
      { id: "opt-4", isCorrect: false },
    ];

    const result = activatePowerUpServerAuthoritative({
      inventory: inv,
      powerUpType: "REMOVE_TWO",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 15000,
      questionOptions: options,
    });

    expect(result.success).toBe(true);
    expect(result.removedOptionIds?.length).toBe(2);
    expect(result.removedOptionIds).not.toContain("opt-1"); // Never removes correct option!
    expect(inv.remainingUses.get("REMOVE_TWO")).toBe(0); // Quota deducted
  });

  it("should activate TIME_FREEZE and add +5s grace period", () => {
    const inv = createDefaultPlayerInventory();
    const result = activatePowerUpServerAuthoritative({
      inventory: inv,
      powerUpType: "TIME_FREEZE",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 10000,
    });

    expect(result.success).toBe(true);
    expect(result.addedTimeMs).toBe(5000);
    expect(inv.extraTimeGraceMs).toBe(5000);
  });

  it("should reject power-ups after answer submission or timeout", () => {
    const inv = createDefaultPlayerInventory();

    // Already answered
    const res1 = activatePowerUpServerAuthoritative({
      inventory: inv,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: true,
      serverTimeRemainingMs: 12000,
    });
    expect(res1.success).toBe(false);

    // Expired
    const res2 = activatePowerUpServerAuthoritative({
      inventory: inv,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 0,
    });
    expect(res2.success).toBe(false);
  });

  it("should enforce match power-up limits and prevent quota exhaustion abuse", () => {
    const inv = createDefaultPlayerInventory();

    // Consume double points
    activatePowerUpServerAuthoritative({
      inventory: inv,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 10000,
    });

    // Try again -> should fail (0 remaining)
    const duplicate = activatePowerUpServerAuthoritative({
      inventory: inv,
      powerUpType: "DOUBLE_POINTS",
      isQuestionActive: true,
      hasAlreadyAnswered: false,
      serverTimeRemainingMs: 8000,
    });
    expect(duplicate.success).toBe(false);
  });
});

describe("Adaptive Difficulty Engine", () => {
  it("should escalate difficulty when cohort performs with high accuracy and speed", () => {
    const result = calculateNextAdaptiveDifficulty({
      currentDifficulty: "MEDIUM",
      rollingAccuracy: 85,
      avgResponseTimeRatio: 0.40,
      totalAnswersInWindow: 10,
    });

    expect(result.nextDifficulty).toBe("HARD");
    expect(result.direction).toBe("UP");
    expect(result.changed).toBe(true);
  });

  it("should reduce difficulty when cohort struggles under time pressure", () => {
    const result = calculateNextAdaptiveDifficulty({
      currentDifficulty: "HARD",
      rollingAccuracy: 32,
      avgResponseTimeRatio: 0.90,
      totalAnswersInWindow: 10,
    });

    expect(result.nextDifficulty).toBe("MEDIUM");
    expect(result.direction).toBe("DOWN");
    expect(result.changed).toBe(true);
  });

  it("should maintain stability when sample size is too low", () => {
    const result = calculateNextAdaptiveDifficulty({
      currentDifficulty: "MEDIUM",
      rollingAccuracy: 100,
      avgResponseTimeRatio: 0.10,
      totalAnswersInWindow: 1, // Only 1 answer
    });

    expect(result.nextDifficulty).toBe("MEDIUM");
    expect(result.direction).toBe("STABLE");
    expect(result.changed).toBe(false);
  });
});

describe("Player Progression, XP Formulas & Achievements", () => {
  it("should calculate levels smoothly from XP", () => {
    expect(calculateLevelFromXP(0)).toBe(1);
    expect(calculateLevelFromXP(100)).toBe(2);
    expect(calculateLevelFromXP(400)).toBe(3);
    expect(calculateLevelFromXP(900)).toBe(4);
    expect(calculateLevelFromXP(2500)).toBe(6);

    expect(getXPForLevel(2)).toBe(100);
    expect(getXPForLevel(3)).toBe(400);
  });

  it("should assign correct rank tiers from levels", () => {
    expect(getRankTierFromLevel(2)).toBe("BRONZE");
    expect(getRankTierFromLevel(7)).toBe("SILVER");
    expect(getRankTierFromLevel(15)).toBe("GOLD");
    expect(getRankTierFromLevel(25)).toBe("PLATINUM");
    expect(getRankTierFromLevel(35)).toBe("DIAMOND");
    expect(getRankTierFromLevel(50)).toBe("ARENA_MASTER");
  });

  it("should calculate match XP rewarding accuracy and podium finish", () => {
    const winnerXP = calculateMatchXP({
      questionsAnswered: 10,
      correctAnswers: 10,
      accuracy: 100,
      rank: 1,
      totalPlayers: 20,
    });

    const lastPlaceXP = calculateMatchXP({
      questionsAnswered: 10,
      correctAnswers: 3,
      accuracy: 30,
      rank: 20,
      totalPlayers: 20,
    });

    expect(winnerXP).toBeGreaterThan(lastPlaceXP);
    expect(winnerXP).toBeGreaterThanOrEqual(200);
  });

  it("should unlock achievements upon meeting criteria", async () => {
    const testUserId = `ach-user-${Date.now()}`;
    const result = await awardMatchProgression(testUserId, {
      score: 2000,
      accuracy: 100,
      questionsAnswered: 8,
      correctAnswers: 8,
      rank: 1,
      totalPlayers: 15,
      fastestAnswerSec: 2.1,
    });

    expect(result.unlockedAchievements).toContain("FIRST_WIN");
    expect(result.unlockedAchievements).toContain("PERFECT_GAME");
    expect(result.unlockedAchievements).toContain("SPEED_DEMON");
  });
});

describe("Constructive Feedback & Topic Leagues", () => {
  it("should generate personalized positive feedback with readiness benchmarks", () => {
    const feedback = generateMatchFeedback({
      currentAccuracy: 88,
      historicalAccuracy: 80,
      currentAvgTimeSec: 5.2,
      historicalAvgTimeSec: 6.8,
      topicAccuracies: [
        { topic: "LOGICAL", accuracy: 95, count: 5 },
        { topic: "QUANTITATIVE", accuracy: 75, count: 5 },
      ],
      rank: 2,
      totalPlayers: 20,
    });

    expect(feedback.headline).toContain("improving");
    expect(feedback.insights.some((i) => i.type === "IMPROVEMENT")).toBe(true);
    expect(feedback.insights.some((i) => i.type === "SPEED")).toBe(true);
    expect(feedback.insights.some((i) => i.type === "STRENGTH")).toBe(true);
    expect(feedback.placementReadinessRating).toBe("TIER_1_READY");
  });

  it("should calculate topic Elo deltas based on difficulty", () => {
    const eloWin = calculateTopicEloDelta(1500, true, "HARD");
    const eloLoss = calculateTopicEloDelta(1500, false, "HARD");

    expect(eloWin).toBeGreaterThan(1500);
    expect(eloLoss).toBeLessThan(1500);
  });

  it("should fetch topic leaderboard for Quantitative and Logical leagues", async () => {
    const quantLb = await getTopicLeaderboard("QUANTITATIVE");
    expect(quantLb.length).toBeGreaterThan(0);
    expect(quantLb[0].topic).toBe("QUANTITATIVE");

    const logicLb = await getTopicLeaderboard("LOGICAL");
    expect(logicLb.length).toBeGreaterThan(0);
    expect(logicLb[0].topic).toBe("LOGICAL");
  });
});
