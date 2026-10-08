import { prisma } from "../db";
import { getLeagueStandings } from "./league-service";

const isTest = process.env.NODE_ENV === "test";

export interface SeasonDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFrozen: boolean;
}

export interface SeasonSnapshotDTO {
  id: string;
  seasonId: string;
  type: "COLLEGE" | "PLAYER" | "TOPIC";
  targetId: string;
  targetName: string;
  rank: number;
  finalScore: number;
  metadata?: any;
}

/**
 * FAIR LEAGUE SCORING FORMULA
 * Prevents volume spam from dominating over skill.
 *
 * 1. Takes top 20 best games (decay weighted: 0.95^(i-1))
 * 2. Activity bonus scales logarithmically: 50 * ln(1 + gamesBeyond20), capped at 600 pts
 * 3. Accuracy multiplier: sqrt(avgAccuracy / 100) rewards precision
 */
export function calculateFairLeagueScore(
  games: { score: number; accuracy: number }[]
): { finalScore: number; topGamesScore: number; activityBonus: number; accuracyFactor: number } {
  if (!games || games.length === 0) {
    return { finalScore: 0, topGamesScore: 0, activityBonus: 0, accuracyFactor: 1.0 };
  }

  // Sort games by score descending
  const sorted = [...games].sort((a, b) => b.score - a.score);
  const top20 = sorted.slice(0, 20);

  // 1. Exponential decay on top 20 games
  let topGamesScore = 0;
  for (let i = 0; i < top20.length; i++) {
    const decay = Math.pow(0.95, i);
    topGamesScore += top20[i].score * decay;
  }

  // 2. Logarithmic activity bonus for matches beyond 20
  const gamesBeyond20 = Math.max(0, games.length - 20);
  const activityBonus = Math.min(600, Math.floor(50 * Math.log(1 + gamesBeyond20)));

  // 3. Accuracy factor (sqrt smoothing)
  const avgAccuracy = games.reduce((sum, g) => sum + g.accuracy, 0) / games.length;
  const accuracyFactor = Math.sqrt(Math.max(0.2, avgAccuracy / 100));

  const finalScore = Math.round((topGamesScore + activityBonus) * accuracyFactor);

  return {
    finalScore,
    topGamesScore: Math.round(topGamesScore),
    activityBonus,
    accuracyFactor: Math.round(accuracyFactor * 100) / 100,
  };
}

// In-Memory store for fast testing and standalone fallback
let memorySeasons: SeasonDTO[] = [
  {
    id: "season-1",
    name: "Season 1 (Autumn 2026)",
    startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    isActive: true,
    isFrozen: false,
  },
  {
    id: "season-pre-alpha",
    name: "Pre-Season Qualifier (Summer 2026)",
    startDate: new Date(Date.now() - 86400000 * 120).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 31).toISOString(),
    isActive: false,
    isFrozen: true,
  },
];

let memorySnapshots = new Map<string, SeasonSnapshotDTO[]>([
  [
    "season-pre-alpha",
    [
      {
        id: "snap-1",
        seasonId: "season-pre-alpha",
        type: "COLLEGE",
        targetId: "col-1",
        targetName: "Apex Institute of Technology",
        rank: 1,
        finalScore: 21540,
      },
      {
        id: "snap-2",
        seasonId: "season-pre-alpha",
        type: "COLLEGE",
        targetId: "col-2",
        targetName: "National Institute of Technology",
        rank: 2,
        finalScore: 19820,
      },
    ],
  ],
]);

export async function getCurrentSeason(): Promise<SeasonDTO> {
  const active = memorySeasons.find((s) => s.isActive && !s.isFrozen);
  if (active) return active;

  if (!isTest) {
    try {
      const dbSeason = await prisma.season.findFirst({
        where: { isActive: true, isFrozen: false },
        orderBy: { startDate: "desc" },
      });
      if (dbSeason) {
        return {
          id: dbSeason.id,
          name: dbSeason.name,
          startDate: dbSeason.startDate.toISOString(),
          endDate: dbSeason.endDate.toISOString(),
          isActive: dbSeason.isActive,
          isFrozen: dbSeason.isFrozen,
        };
      }
    } catch {
      // fallback
    }
  }

  return memorySeasons[0];
}

export async function listAllSeasons(): Promise<SeasonDTO[]> {
  return memorySeasons;
}

export async function getSeasonSnapshots(seasonId: string): Promise<SeasonSnapshotDTO[]> {
  return memorySnapshots.get(seasonId) || [];
}

/**
 * Freeze an active season, generate permanent historical snapshots, and lock standings
 */
export async function freezeSeason(seasonId: string): Promise<{ success: boolean; season: SeasonDTO; snapshotsCount: number }> {
  const season = memorySeasons.find((s) => s.id === seasonId);
  if (!season) {
    throw new Error("Season not found");
  }

  // Get current standings to freeze
  const currentStandings = await getLeagueStandings();
  const snapshots: SeasonSnapshotDTO[] = [];

  // Snapshot colleges
  currentStandings.colleges.forEach((col, idx) => {
    snapshots.push({
      id: `snap-${seasonId}-col-${col.collegeId}`,
      seasonId,
      type: "COLLEGE",
      targetId: col.collegeId,
      targetName: col.collegeName,
      rank: idx + 1,
      finalScore: col.score,
    });
  });

  // Snapshot top players
  currentStandings.players.forEach((p, idx) => {
    snapshots.push({
      id: `snap-${seasonId}-plyr-${p.playerId}`,
      seasonId,
      type: "PLAYER",
      targetId: p.playerId,
      targetName: p.displayName,
      rank: idx + 1,
      finalScore: p.score,
    });
  });

  season.isFrozen = true;
  season.isActive = false;
  memorySnapshots.set(seasonId, snapshots);

  return {
    success: true,
    season,
    snapshotsCount: snapshots.length,
  };
}

/**
 * Rollover to a brand new competitive season
 */
export async function rolloverNewSeason(name: string, startDate: Date, endDate: Date): Promise<SeasonDTO> {
  // 1. Deactivate old active seasons
  memorySeasons.forEach((s) => {
    if (s.isActive) s.isActive = false;
  });

  // 2. Create new season
  const newSeason: SeasonDTO = {
    id: `season-${Date.now()}`,
    name,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    isFrozen: false,
  };

  memorySeasons.unshift(newSeason);
  return newSeason;
}
