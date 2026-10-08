import { prisma } from "../db";
import { QuestionDTO } from "@/types";
import { DEMO_QUESTION_SETS } from "../seed-data";
import { awardMatchProgression } from "./progression-service";

const isTest = process.env.NODE_ENV === "test";

export interface DailyChallengeDTO {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  questionCount: number;
  timeLimitPerQuestion: number;
  questions: QuestionDTO[];
  hasAttempted: boolean;
  userAttempt?: {
    score: number;
    accuracy: number;
    timeTaken: number;
    rank: number;
    completedAt: string;
  } | null;
}

export interface DailyLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  collegeName: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  completedAt: string;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// In-Memory store for tests and fast fallback
const memoryDailyAttempts = new Map<string, {
  userId: string;
  displayName: string;
  collegeName: string;
  date: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  isRanked: boolean;
  completedAt: string;
}[]>();

// Seed sample attempts for today's leaderboard
function initDailySampleAttempts(dateStr: string) {
  if (!memoryDailyAttempts.has(dateStr)) {
    memoryDailyAttempts.set(dateStr, [
      {
        userId: "usr-player-1",
        displayName: "Arjun Sharma",
        collegeName: "Apex Institute of Tech",
        date: dateStr,
        score: 980,
        accuracy: 100,
        timeTaken: 42.5,
        isRanked: true,
        completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        userId: "usr-player-2",
        displayName: "Priya Nair",
        collegeName: "National Institute of Tech",
        date: dateStr,
        score: 950,
        accuracy: 90,
        timeTaken: 48.2,
        isRanked: true,
        completedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        userId: "usr-player-3",
        displayName: "Rohan Verma",
        collegeName: "Birla Institute of Tech",
        date: dateStr,
        score: 890,
        accuracy: 90,
        timeTaken: 55.1,
        isRanked: true,
        completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ]);
  }
}

/**
 * Calculate user streak based on previous active dates
 */
export function calculateStreakUpdate(
  currentStreak: number,
  lastStreakDate: Date | null,
  now = new Date()
): { newStreak: number; streakMaintained: boolean; isNewDay: boolean } {
  if (!lastStreakDate) {
    return { newStreak: 1, streakMaintained: true, isNewDay: true };
  }

  const msPerDay = 86400000;
  const lastTime = new Date(lastStreakDate).setHours(0, 0, 0, 0);
  const currentTime = new Date(now).setHours(0, 0, 0, 0);
  const diffDays = Math.round((currentTime - lastTime) / msPerDay);

  if (diffDays === 0) {
    // Already participated today
    return { newStreak: currentStreak, streakMaintained: true, isNewDay: false };
  }

  if (diffDays === 1) {
    // Consecutive next day!
    return { newStreak: currentStreak + 1, streakMaintained: true, isNewDay: true };
  }

  // Grace period threshold exceeded (> 1 day missed) -> streak resets to 1
  return { newStreak: 1, streakMaintained: false, isNewDay: true };
}

/**
 * Fetch today's placement daily challenge
 */
export async function getTodayDailyChallenge(userId?: string): Promise<DailyChallengeDTO> {
  const dateStr = getTodayDateString();
  initDailySampleAttempts(dateStr);

  const qSet = DEMO_QUESTION_SETS[0];
  const questions = qSet.questions.slice(0, 10);

  const attemptsForToday = memoryDailyAttempts.get(dateStr) || [];
  const userAttempt = userId ? attemptsForToday.find((a) => a.userId === userId && a.isRanked) : null;

  return {
    id: `daily-${dateStr}`,
    date: dateStr,
    title: `Daily Placement Challenge — ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    description: "10 curated Quantitative and Logical aptitude questions. Complete once daily to maintain your streak!",
    questionCount: questions.length,
    timeLimitPerQuestion: 25,
    questions,
    hasAttempted: Boolean(userAttempt),
    userAttempt: userAttempt
      ? {
          score: userAttempt.score,
          accuracy: userAttempt.accuracy,
          timeTaken: userAttempt.timeTaken,
          rank: 1,
          completedAt: userAttempt.completedAt,
        }
      : null,
  };
}

/**
 * Submit daily challenge attempt with fair anti-spam rules
 */
export async function submitDailyChallengeAttempt(params: {
  userId: string;
  displayName: string;
  collegeName?: string;
  score: number;
  accuracy: number;
  timeTakenSec: number;
}): Promise<{
  success: boolean;
  isRanked: boolean;
  newStreak: number;
  streakMaintained: boolean;
  xpEarned: number;
  rank: number;
}> {
  const dateStr = getTodayDateString();
  initDailySampleAttempts(dateStr);

  const attempts = memoryDailyAttempts.get(dateStr) || [];
  const existingRanked = attempts.find((a) => a.userId === params.userId && a.isRanked);

  // If already attempted today, this is a practice attempt that doesn't overwrite leaderboard
  const isRanked = !existingRanked;

  const newEntry = {
    userId: params.userId,
    displayName: params.displayName,
    collegeName: params.collegeName || "Apex Institute of Tech",
    date: dateStr,
    score: params.score,
    accuracy: params.accuracy,
    timeTaken: params.timeTakenSec,
    isRanked,
    completedAt: new Date().toISOString(),
  };

  attempts.push(newEntry);
  memoryDailyAttempts.set(dateStr, attempts);

  // Calculate streak update
  const streakCalc = calculateStreakUpdate(3, new Date(Date.now() - 86400000));
  const newStreak = isRanked ? streakCalc.newStreak : 3;

  // Award progression XP
  const progressionResult = await awardMatchProgression(params.userId, {
    score: params.score,
    accuracy: params.accuracy,
    questionsAnswered: 10,
    correctAnswers: Math.round((params.accuracy / 100) * 10),
    rank: 1,
    totalPlayers: attempts.length,
  });

  // Calculate user rank on today's leaderboard
  const sorted = [...attempts]
    .filter((a) => a.isRanked)
    .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || a.timeTaken - b.timeTaken);

  const userRank = sorted.findIndex((a) => a.userId === params.userId) + 1 || 1;

  return {
    success: true,
    isRanked,
    newStreak,
    streakMaintained: streakCalc.streakMaintained,
    xpEarned: progressionResult.xpEarned,
    rank: userRank,
  };
}

/**
 * Get daily challenge leaderboard
 */
export async function getDailyChallengeLeaderboard(dateStr = getTodayDateString()): Promise<DailyLeaderboardEntry[]> {
  initDailySampleAttempts(dateStr);
  const attempts = memoryDailyAttempts.get(dateStr) || [];

  const rankedOnly = attempts.filter((a) => a.isRanked);
  rankedOnly.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.timeTaken - b.timeTaken;
  });

  return rankedOnly.map((a, idx) => ({
    rank: idx + 1,
    userId: a.userId,
    displayName: a.displayName,
    collegeName: a.collegeName,
    score: a.score,
    accuracy: a.accuracy,
    timeTaken: a.timeTaken,
    completedAt: a.completedAt,
  }));
}
