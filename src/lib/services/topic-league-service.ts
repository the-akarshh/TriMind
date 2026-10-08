import { Topic } from "@/types";
import { DEMO_LEAGUE_STANDINGS, DEMO_COLLEGE } from "../seed-data";

export interface TopicLeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  college: string;
  topic: Topic;
  topicElo: number;
  score: number;
  accuracy: number;
  questionsAttempted: number;
}

// In-Memory dataset for Topic Leagues
const sampleTopicStandings = new Map<Topic, TopicLeaderboardEntry[]>([
  [
    "QUANTITATIVE",
    [
      {
        rank: 1,
        playerId: "usr-player-1",
        displayName: "Arjun Sharma",
        college: "Apex Institute of Tech",
        topic: "QUANTITATIVE",
        topicElo: 2640,
        score: 4850,
        accuracy: 94.2,
        questionsAttempted: 52,
      },
      {
        rank: 2,
        playerId: "usr-player-3",
        displayName: "Rohan Verma",
        college: "Birla Institute of Tech",
        topic: "QUANTITATIVE",
        topicElo: 2510,
        score: 4420,
        accuracy: 89.5,
        questionsAttempted: 50,
      },
      {
        rank: 3,
        playerId: "usr-player-2",
        displayName: "Priya Nair",
        college: "National Institute of Tech",
        topic: "QUANTITATIVE",
        topicElo: 2420,
        score: 4180,
        accuracy: 86.0,
        questionsAttempted: 48,
      },
    ],
  ],
  [
    "LOGICAL",
    [
      {
        rank: 1,
        playerId: "usr-player-2",
        displayName: "Priya Nair",
        college: "National Institute of Tech",
        topic: "LOGICAL",
        topicElo: 2710,
        score: 5120,
        accuracy: 96.0,
        questionsAttempted: 54,
      },
      {
        rank: 2,
        playerId: "usr-player-1",
        displayName: "Arjun Sharma",
        college: "Apex Institute of Tech",
        topic: "LOGICAL",
        topicElo: 2580,
        score: 4790,
        accuracy: 91.5,
        questionsAttempted: 52,
      },
      {
        rank: 3,
        playerId: "usr-player-4",
        displayName: "Ananya Iyer",
        college: "Vellore Institute of Tech",
        topic: "LOGICAL",
        topicElo: 2490,
        score: 4360,
        accuracy: 88.0,
        questionsAttempted: 50,
      },
    ],
  ],
  [
    "VERBAL",
    [
      {
        rank: 1,
        playerId: "usr-player-4",
        displayName: "Ananya Iyer",
        college: "Vellore Institute of Tech",
        topic: "VERBAL",
        topicElo: 2680,
        score: 4940,
        accuracy: 95.0,
        questionsAttempted: 52,
      },
      {
        rank: 2,
        playerId: "usr-player-2",
        displayName: "Priya Nair",
        college: "National Institute of Tech",
        topic: "VERBAL",
        topicElo: 2540,
        score: 4520,
        accuracy: 90.0,
        questionsAttempted: 50,
      },
    ],
  ],
  [
    "DATA_INTERPRETATION",
    [
      {
        rank: 1,
        playerId: "usr-player-3",
        displayName: "Rohan Verma",
        college: "Birla Institute of Tech",
        topic: "DATA_INTERPRETATION",
        topicElo: 2620,
        score: 4780,
        accuracy: 92.5,
        questionsAttempted: 50,
      },
      {
        rank: 2,
        playerId: "usr-player-1",
        displayName: "Arjun Sharma",
        college: "Apex Institute of Tech",
        topic: "DATA_INTERPRETATION",
        topicElo: 2590,
        score: 4690,
        accuracy: 91.0,
        questionsAttempted: 51,
      },
    ],
  ],
  [
    "GENERAL_REASONING",
    [
      {
        rank: 1,
        playerId: "usr-player-1",
        displayName: "Arjun Sharma",
        college: "Apex Institute of Tech",
        topic: "GENERAL_REASONING",
        topicElo: 2600,
        score: 4700,
        accuracy: 92.0,
        questionsAttempted: 51,
      },
    ],
  ],
]);

/**
 * Get specialized Topic League leaderboard
 */
export async function getTopicLeaderboard(topic: Topic): Promise<TopicLeaderboardEntry[]> {
  const entries = sampleTopicStandings.get(topic) || [];
  return entries.sort((a, b) => b.score - a.score);
}

/**
 * Calculate updated topic Elo rating from an answer
 */
export function calculateTopicEloDelta(currentElo: number, isCorrect: boolean, difficulty: string): number {
  const kFactor = 32;
  const expectedOutcome = 0.5; // Baseline expected
  const actualOutcome = isCorrect ? 1.0 : 0.0;

  let difficultyMultiplier = 1.0;
  if (difficulty === "HARD") difficultyMultiplier = 1.25;
  if (difficulty === "EXPERT") difficultyMultiplier = 1.5;
  if (difficulty === "EASY") difficultyMultiplier = 0.8;

  const delta = Math.round(kFactor * (actualOutcome - expectedOutcome) * difficultyMultiplier);
  return Math.max(800, currentElo + delta);
}
