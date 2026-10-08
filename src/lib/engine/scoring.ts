/**
 * Server-Authoritative Scoring Engine
 * Calculates score based on response time, question difficulty, and answer streaks.
 */

export interface ScoreCalculationParams {
  isCorrect: boolean;
  basePoints: number;
  responseTimeSeconds: number;
  timeLimitSeconds: number;
  currentStreak?: number;
  isDoublePointsActive?: boolean;
}

export interface ScoreResult {
  points: number;
  timeBonus: number;
  streakBonus: number;
  newStreak: number;
}

export function calculateQuestionScore(params: ScoreCalculationParams): ScoreResult {
  const {
    isCorrect,
    basePoints = 100,
    responseTimeSeconds,
    timeLimitSeconds = 30,
    currentStreak = 0,
    isDoublePointsActive = false,
  } = params;

  if (!isCorrect) {
    return {
      points: 0,
      timeBonus: 0,
      streakBonus: 0,
      newStreak: 0,
    };
  }

  // Clamped response time to prevent negative or infinite bonuses
  const clampedTime = Math.max(0, Math.min(responseTimeSeconds, timeLimitSeconds));

  // Time decay factor: 1.0 (instant answer) down to 0.5 (answered at buzzer)
  const timeRatio = clampedTime / Math.max(1, timeLimitSeconds);
  const timeFactor = Math.max(0.5, 1 - 0.5 * timeRatio);

  const baseCalculated = Math.round(basePoints * timeFactor);
  const timeBonus = baseCalculated - Math.round(basePoints * 0.5);

  // Consecutive streak bonus (up to 100 bonus pts for 5+ streak)
  const streak = currentStreak + 1;
  const streakBonus = Math.min(streak * 20, 100);

  let totalPoints = baseCalculated + streakBonus;

  if (isDoublePointsActive) {
    totalPoints *= 2;
  }

  return {
    points: totalPoints,
    timeBonus,
    streakBonus,
    newStreak: streak,
  };
}

export interface LeaderboardPlayer {
  id: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalAnswerTime: number;
  connected: boolean;
}

export function sortLeaderboard<T extends { score: number; totalAnswerTime: number; correctAnswers: number }>(
  players: T[]
): (T & { rank: number })[] {
  const sorted = [...players].sort((a, b) => {
    // Primary: Score descending
    if (b.score !== a.score) return b.score - a.score;
    // Secondary: More correct answers
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
    // Tertiary: Faster cumulative response time
    return a.totalAnswerTime - b.totalAnswerTime;
  });

  return sorted.map((player, idx) => ({
    ...player,
    rank: idx + 1,
  }));
}
