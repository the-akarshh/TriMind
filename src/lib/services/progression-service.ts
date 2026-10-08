import { prisma } from "../db";
import { SafeUser } from "@/types";

const isTest = process.env.NODE_ENV === "test";

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  icon: string;
  category: "GAMES" | "MASTERY" | "STREAK" | "SPECIAL";
  targetValue: number;
  xpReward: number;
}

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  {
    code: "FIRST_WIN",
    title: "First Victory",
    description: "Claim 1st place in a live multiplayer competition arena",
    icon: "Trophy",
    category: "GAMES",
    targetValue: 1,
    xpReward: 100,
  },
  {
    code: "GAMES_10",
    title: "Decathlete",
    description: "Complete 10 competitive placement arena rounds",
    icon: "Gamepad2",
    category: "GAMES",
    targetValue: 10,
    xpReward: 150,
  },
  {
    code: "CORRECT_100",
    title: "Centurion",
    description: "Submit 100 correct aptitude answers across all rounds",
    icon: "Target",
    category: "GAMES",
    targetValue: 100,
    xpReward: 200,
  },
  {
    code: "SPEED_DEMON",
    title: "Speed Demon",
    description: "Answer a question correctly in under 3.0 seconds",
    icon: "Zap",
    category: "SPECIAL",
    targetValue: 1,
    xpReward: 100,
  },
  {
    code: "PERFECT_GAME",
    title: "Flawless Cadet",
    description: "Achieve 100% accuracy in a match with at least 5 questions",
    icon: "ShieldCheck",
    category: "MASTERY",
    targetValue: 1,
    xpReward: 300,
  },
  {
    code: "LOGIC_MASTER",
    title: "Deductive Master",
    description: "Maintain 90%+ accuracy on 20 or more Logical questions",
    icon: "Brain",
    category: "MASTERY",
    targetValue: 20,
    xpReward: 250,
  },
  {
    code: "QUANT_MASTER",
    title: "Quantitative Wizard",
    description: "Maintain 90%+ accuracy on 20 or more Quantitative questions",
    icon: "Calculator",
    category: "MASTERY",
    targetValue: 20,
    xpReward: 250,
  },
  {
    code: "STREAK_7",
    title: "Week of Steel",
    description: "Maintain an active 7-day Daily Challenge completion streak",
    icon: "Flame",
    category: "STREAK",
    targetValue: 7,
    xpReward: 350,
  },
  {
    code: "TOP_10_COLLEGE",
    title: "Campus Champion",
    description: "Rank among the top 10 cadets in your College League",
    icon: "Award",
    category: "SPECIAL",
    targetValue: 1,
    xpReward: 400,
  },
  {
    code: "COMEBACK_KING",
    title: "Comeback King",
    description: "Advance 5 or more places up the leaderboard during a match",
    icon: "TrendingUp",
    category: "SPECIAL",
    targetValue: 1,
    xpReward: 200,
  },
];

export type RankTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "ARENA_MASTER";

export interface ProgressionDTO {
  xp: number;
  level: number;
  xpCurrentLevel: number;
  xpNextLevel: number;
  levelProgressPercent: number;
  rankTier: RankTier;
  streak: number;
  longestStreak: number;
  achievements: {
    code: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress: number;
    targetValue: number;
    unlockedAt?: string | null;
  }[];
}

/**
 * Calculate Level from Total XP:
 * Level 1 = 0 XP
 * Level 2 = 100 XP
 * Level 3 = 400 XP
 * Level L = (L - 1)^2 * 100 XP
 */
export function calculateLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  return 1 + Math.floor(Math.sqrt(xp / 100));
}

/**
 * Total XP required to reach a specific level
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Derive competitive Rank Tier from level
 */
export function getRankTierFromLevel(level: number): RankTier {
  if (level >= 45) return "ARENA_MASTER";
  if (level >= 30) return "DIAMOND";
  if (level >= 20) return "PLATINUM";
  if (level >= 10) return "GOLD";
  if (level >= 5) return "SILVER";
  return "BRONZE";
}

/**
 * Calculate fair XP awarded for a match
 * Prevents meaningless spam by rewarding accuracy, placement, and speed.
 */
export function calculateMatchXP(params: {
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  rank: number;
  totalPlayers: number;
  isFirstWin?: boolean;
}): number {
  const baseXP = params.questionsAnswered * 5;
  const correctBonus = params.correctAnswers * 15;
  const accuracyMultiplier = Math.max(0.2, params.accuracy / 100);

  // Performance-based placement bonus
  let placementXP = 0;
  if (params.totalPlayers > 1) {
    if (params.rank === 1) placementXP = 100;
    else if (params.rank === 2) placementXP = 60;
    else if (params.rank === 3) placementXP = 40;
    else if (params.rank <= Math.ceil(params.totalPlayers * 0.25)) placementXP = 25;
  }

  const rawEarned = Math.round((baseXP + correctBonus) * accuracyMultiplier + placementXP);
  return Math.max(10, Math.min(300, rawEarned));
}

// In-Memory mock storage for tests
const memoryUserProgression = new Map<
  string,
  {
    xp: number;
    level: number;
    streak: number;
    longestStreak: number;
    unlockedAchievements: Set<string>;
    achievementProgress: Map<string, number>;
  }
>();

export function getUserProgression(userId: string): ProgressionDTO {
  const data = memoryUserProgression.get(userId) || (
    userId === "usr-player-1" ? {
      xp: 650,
      level: calculateLevelFromXP(650),
      streak: 4,
      longestStreak: 7,
      unlockedAchievements: new Set(["FIRST_WIN", "GAMES_10"]),
      achievementProgress: new Map([
        ["CORRECT_100", 48],
        ["STREAK_7", 4],
      ]),
    } : {
      xp: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      unlockedAchievements: new Set<string>(),
      achievementProgress: new Map<string, number>(),
    }
  );

  const level = calculateLevelFromXP(data.xp);
  const currentLevelBaseXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpInCurrentLevel = data.xp - currentLevelBaseXP;
  const xpNeeded = nextLevelXP - currentLevelBaseXP;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeeded) * 100)));

  const achievements = ACHIEVEMENTS_CATALOG.map((cat) => {
    const isUnlocked = data.unlockedAchievements.has(cat.code);
    const prog = isUnlocked ? cat.targetValue : (data.achievementProgress.get(cat.code) || 0);

    return {
      code: cat.code,
      title: cat.title,
      description: cat.description,
      icon: cat.icon,
      unlocked: isUnlocked,
      progress: prog,
      targetValue: cat.targetValue,
      unlockedAt: isUnlocked ? new Date().toISOString() : null,
    };
  });

  return {
    xp: data.xp,
    level,
    xpCurrentLevel: xpInCurrentLevel,
    xpNextLevel: xpNeeded,
    levelProgressPercent: progressPercent,
    rankTier: getRankTierFromLevel(level),
    streak: data.streak,
    longestStreak: data.longestStreak,
    achievements,
  };
}

/**
 * Award XP and check/unlock achievements after a completed game or daily challenge
 */
export async function awardMatchProgression(userId: string, matchStats: {
  score: number;
  accuracy: number;
  questionsAnswered: number;
  correctAnswers: number;
  rank: number;
  totalPlayers: number;
  fastestAnswerSec?: number;
  rankClimb?: number;
}): Promise<{ xpEarned: number; newLevel: number; leveledUp: boolean; unlockedAchievements: string[] }> {
  const current = getUserProgression(userId);
  const earnedXP = calculateMatchXP(matchStats);
  const updatedXP = current.xp + earnedXP;
  const newLevel = calculateLevelFromXP(updatedXP);
  const leveledUp = newLevel > current.level;

  const newlyUnlocked: string[] = [];

  // Update in-memory user
  const userRecord = memoryUserProgression.get(userId) || {
    xp: current.xp,
    level: current.level,
    streak: current.streak,
    longestStreak: current.longestStreak,
    unlockedAchievements: new Set(current.achievements.filter((a) => a.unlocked).map((a) => a.code)),
    achievementProgress: new Map(),
  };

  userRecord.xp = updatedXP;
  userRecord.level = newLevel;

  // Check achievements criteria
  if (matchStats.rank === 1 && !userRecord.unlockedAchievements.has("FIRST_WIN")) {
    userRecord.unlockedAchievements.add("FIRST_WIN");
    newlyUnlocked.push("FIRST_WIN");
  }

  if (matchStats.accuracy === 100 && matchStats.questionsAnswered >= 5 && !userRecord.unlockedAchievements.has("PERFECT_GAME")) {
    userRecord.unlockedAchievements.add("PERFECT_GAME");
    newlyUnlocked.push("PERFECT_GAME");
  }

  if (matchStats.fastestAnswerSec && matchStats.fastestAnswerSec <= 3.0 && !userRecord.unlockedAchievements.has("SPEED_DEMON")) {
    userRecord.unlockedAchievements.add("SPEED_DEMON");
    newlyUnlocked.push("SPEED_DEMON");
  }

  if (matchStats.rankClimb && matchStats.rankClimb >= 5 && !userRecord.unlockedAchievements.has("COMEBACK_KING")) {
    userRecord.unlockedAchievements.add("COMEBACK_KING");
    newlyUnlocked.push("COMEBACK_KING");
  }

  memoryUserProgression.set(userId, userRecord);

  if (!isTest) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: updatedXP,
          level: newLevel,
        },
      });
    } catch {
      // ignore offline db
    }
  }

  return {
    xpEarned: earnedXP,
    newLevel,
    leveledUp,
    unlockedAchievements: newlyUnlocked,
  };
}
