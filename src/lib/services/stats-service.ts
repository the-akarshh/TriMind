import { DEMO_COLLEGE, DEMO_LEAGUE } from "../seed-data";

export interface PlayerDashboardStats {
  totalGames: number;
  averageScore: number;
  accuracy: number;
  averageResponseTime: number; // in seconds
  currentRank: number;
  collegeRank: number;
  streak: number;
  collegeName: string;
  currentLeague: {
    name: string;
    season: string;
  };
  dailyChallenge: {
    status: "READY" | "COMPLETED";
    title: string;
    points: number;
  };
  topicStrengths: {
    topic: string;
    accuracy: number;
    speed: string;
  }[];
  topicWeaknesses: {
    topic: string;
    accuracy: number;
    recommendedSets: string;
  }[];
  recentGames: {
    id: string;
    date: string;
    title: string;
    score: number;
    rank: number;
    totalPlayers: number;
    accuracy: number;
  }[];
}

export async function getPlayerStats(userId?: string): Promise<PlayerDashboardStats> {
  return {
    totalGames: 18,
    averageScore: 840,
    accuracy: 86.4,
    averageResponseTime: 8.2,
    currentRank: 4,
    collegeRank: 2,
    streak: 6,
    collegeName: DEMO_COLLEGE.name,
    currentLeague: {
      name: DEMO_LEAGUE.name,
      season: DEMO_LEAGUE.season,
    },
    dailyChallenge: {
      status: "READY",
      title: "Today's Speed Math & Syllogism Sprint",
      points: 250,
    },
    topicStrengths: [
      { topic: "Quantitative Aptitude", accuracy: 92, speed: "Fast (6.4s avg)" },
      { topic: "Data Interpretation", accuracy: 88, speed: "Optimal (10.1s avg)" },
    ],
    topicWeaknesses: [
      {
        topic: "Verbal - Sentence Correction",
        accuracy: 64,
        recommendedSets: "Verbal Ability: Vocabulary & Structure",
      },
      {
        topic: "Logical - Blood Relations",
        accuracy: 71,
        recommendedSets: "Logical Reasoning: Syllogisms & Arrangements",
      },
    ],
    recentGames: [
      {
        id: "game-101",
        date: "2026-10-07",
        title: "Quantitative Aptitude: High-Frequency Placement Core",
        score: 950,
        rank: 1,
        totalPlayers: 42,
        accuracy: 94,
      },
      {
        id: "game-102",
        date: "2026-10-06",
        title: "Logical Reasoning: Syllogisms & Seating Arrangements",
        score: 820,
        rank: 3,
        totalPlayers: 38,
        accuracy: 85,
      },
      {
        id: "game-103",
        date: "2026-10-04",
        title: "Data Interpretation: Placement Analytics & Tabular Data",
        score: 780,
        rank: 5,
        totalPlayers: 45,
        accuracy: 80,
      },
    ],
  };
}
