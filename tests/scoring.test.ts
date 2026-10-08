import { describe, it, expect } from "vitest";
import {
  calculateQuestionScore,
  sortLeaderboard,
} from "../src/lib/engine/scoring";

describe("Scoring & Leaderboard Engine", () => {
  it("should award 0 points for incorrect answers and reset streak", () => {
    const res = calculateQuestionScore({
      isCorrect: false,
      basePoints: 100,
      responseTimeSeconds: 2,
      timeLimitSeconds: 30,
      currentStreak: 4,
    });

    expect(res.points).toBe(0);
    expect(res.newStreak).toBe(0);
    expect(res.streakBonus).toBe(0);
  });

  it("should award higher points for faster answers", () => {
    const fastAnswer = calculateQuestionScore({
      isCorrect: true,
      basePoints: 100,
      responseTimeSeconds: 1, // answered in 1s
      timeLimitSeconds: 30,
      currentStreak: 0,
    });

    const slowAnswer = calculateQuestionScore({
      isCorrect: true,
      basePoints: 100,
      responseTimeSeconds: 29, // answered at buzzer
      timeLimitSeconds: 30,
      currentStreak: 0,
    });

    expect(fastAnswer.points).toBeGreaterThan(slowAnswer.points);
  });

  it("should increment streak and award bonus points", () => {
    const res = calculateQuestionScore({
      isCorrect: true,
      basePoints: 100,
      responseTimeSeconds: 10,
      timeLimitSeconds: 30,
      currentStreak: 2,
    });

    expect(res.newStreak).toBe(3);
    expect(res.streakBonus).toBe(60); // 3 * 20
  });

  it("should double points when double points powerup is active", () => {
    const normal = calculateQuestionScore({
      isCorrect: true,
      basePoints: 100,
      responseTimeSeconds: 15,
      timeLimitSeconds: 30,
      currentStreak: 0,
      isDoublePointsActive: false,
    });

    const doubled = calculateQuestionScore({
      isCorrect: true,
      basePoints: 100,
      responseTimeSeconds: 15,
      timeLimitSeconds: 30,
      currentStreak: 0,
      isDoublePointsActive: true,
    });

    expect(doubled.points).toBe(normal.points * 2);
  });

  it("should accurately sort leaderboard by score, correct answers, and speed", () => {
    const players = [
      { id: "1", displayName: "A", score: 500, correctAnswers: 4, totalAnswerTime: 20 },
      { id: "2", displayName: "B", score: 800, correctAnswers: 6, totalAnswerTime: 15 },
      { id: "3", displayName: "C", score: 500, correctAnswers: 5, totalAnswerTime: 25 }, // same score as A, but more correct
      { id: "4", displayName: "D", score: 500, correctAnswers: 4, totalAnswerTime: 12 }, // same score & correct as A, but faster
    ];

    const sorted = sortLeaderboard(players);

    expect(sorted[0].id).toBe("2"); // 800 pts -> Rank 1
    expect(sorted[1].id).toBe("3"); // 500 pts, 5 correct -> Rank 2
    expect(sorted[2].id).toBe("4"); // 500 pts, 4 correct, 12s -> Rank 3
    expect(sorted[3].id).toBe("1"); // 500 pts, 4 correct, 20s -> Rank 4
  });
});
