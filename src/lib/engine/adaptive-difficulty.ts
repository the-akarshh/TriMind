import { Difficulty } from "@/types";

export interface AdaptiveRoomPerformance {
  currentDifficulty: Difficulty;
  rollingAccuracy: number; // percentage (0 - 100)
  avgResponseTimeRatio: number; // avg response time / time limit (0.0 - 1.0)
  totalAnswersInWindow: number;
}

const DIFFICULTY_LADDER: Difficulty[] = ["EASY", "MEDIUM", "HARD", "EXPERT"];

export const DIFFICULTY_POINT_MULTIPLIERS: Record<Difficulty, number> = {
  EASY: 100,
  MEDIUM: 150,
  HARD: 200,
  EXPERT: 300,
};

/**
 * ADAPTIVE DIFFICULTY SCALING ALGORITHM
 *
 * Rules:
 * - Room Accuracy >= 75% AND Response Time Ratio <= 0.50 (Room is dominating)
 *   -> Escalate difficulty up one tier.
 * - Room Accuracy <= 40% OR Response Time Ratio >= 0.85 (Room is struggling)
 *   -> De-escalate difficulty down one tier.
 * - Otherwise: Stable equilibrium, maintain current tier.
 */
export function calculateNextAdaptiveDifficulty(performance: AdaptiveRoomPerformance): {
  nextDifficulty: Difficulty;
  changed: boolean;
  direction: "UP" | "DOWN" | "STABLE";
  reason: string;
} {
  const currentIndex = DIFFICULTY_LADDER.indexOf(performance.currentDifficulty);

  // Require minimum sample size to avoid abrupt jumps
  if (performance.totalAnswersInWindow < 3) {
    return {
      nextDifficulty: performance.currentDifficulty,
      changed: false,
      direction: "STABLE",
      reason: "Insufficient answer sample size; maintaining current difficulty.",
    };
  }

  // 1. High Mastery -> Scale Up
  if (performance.rollingAccuracy >= 75 && performance.avgResponseTimeRatio <= 0.55) {
    if (currentIndex < DIFFICULTY_LADDER.length - 1) {
      const nextDifficulty = DIFFICULTY_LADDER[currentIndex + 1];
      return {
        nextDifficulty,
        changed: true,
        direction: "UP",
        reason: `High cohort accuracy (${performance.rollingAccuracy.toFixed(0)}%) and swift speed. Escalating challenge to ${nextDifficulty}.`,
      };
    }
  }

  // 2. High Struggle -> Scale Down
  if (performance.rollingAccuracy <= 40 || performance.avgResponseTimeRatio >= 0.85) {
    if (currentIndex > 0) {
      const nextDifficulty = DIFFICULTY_LADDER[currentIndex - 1];
      return {
        nextDifficulty,
        changed: true,
        direction: "DOWN",
        reason: `Cohort struggle detected (${performance.rollingAccuracy.toFixed(0)}% accuracy). Adjusting difficulty to ${nextDifficulty} to reinforce fundamentals.`,
      };
    }
  }

  // 3. Equilibrium
  return {
    nextDifficulty: performance.currentDifficulty,
    changed: false,
    direction: "STABLE",
    reason: `Cohort performance is well-balanced (${performance.rollingAccuracy.toFixed(0)}% accuracy). Maintaining ${performance.currentDifficulty}.`,
  };
}
