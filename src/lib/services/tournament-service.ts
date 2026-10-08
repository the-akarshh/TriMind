import { prisma } from "../db";
import {
  TournamentDTO,
  TournamentMatchDTO,
  BracketRoundDTO,
  TournamentParticipantDTO,
  CollegeChallengeDTO,
  TournamentStatus,
  MatchStatus,
  ChallengeStatus,
} from "@/types";
import { SAMPLE_COLLEGES } from "./league-service";
import { createRoom } from "./room-service";

const isTest = process.env.NODE_ENV === "test";

// Round naming lookup based on remaining distance to finals
export function getRoundName(round: number, totalRounds: number): string {
  const diff = totalRounds - round;
  if (diff === 0) return "Grand Finals";
  if (diff === 1) return "Semifinals";
  if (diff === 2) return "Quarterfinals";
  if (diff === 3) return "Round of 16";
  return `Round ${round}`;
}

// Traditional standard seeding pairs
export function getSeedingPairs(teamCount: number): [number, number][] {
  if (teamCount <= 4) {
    return [
      [1, 4],
      [2, 3],
    ];
  }
  if (teamCount <= 8) {
    return [
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ];
  }
  // 16 teams
  return [
    [1, 16],
    [8, 9],
    [4, 13],
    [5, 12],
    [2, 15],
    [7, 10],
    [3, 14],
    [6, 11],
  ];
}

// In-Memory store for fast tests and standalone offline execution
let memoryTournaments: TournamentDTO[] = [];
let memoryMatches = new Map<string, TournamentMatchDTO[]>();
let memoryParticipants = new Map<string, TournamentParticipantDTO[]>();
let memoryChallenges: CollegeChallengeDTO[] = [];

// Initialize seed tournament data
function initDemoTournaments() {
  const tId = "tourn-apex-2026";
  const participants: TournamentParticipantDTO[] = SAMPLE_COLLEGES.slice(0, 8).map((c, i) => ({
    id: `tp-${c.collegeId}`,
    tournamentId: tId,
    collegeId: c.collegeId,
    collegeName: c.collegeName,
    shortName: c.shortName,
    seed: i + 1,
    score: c.score,
    eliminated: i === 7 || i === 4, // TIET and DTU eliminated in QF
  }));

  const matches: TournamentMatchDTO[] = [
    // Round 1: Quarterfinals
    {
      id: "match-1",
      tournamentId: tId,
      round: 1,
      matchNumber: 1,
      roundName: "Quarterfinals",
      college1Id: SAMPLE_COLLEGES[0].collegeId, // AIT
      college1Name: SAMPLE_COLLEGES[0].collegeName,
      college1Short: SAMPLE_COLLEGES[0].shortName,
      college2Id: SAMPLE_COLLEGES[7].collegeId, // TIET
      college2Name: SAMPLE_COLLEGES[7].collegeName,
      college2Short: SAMPLE_COLLEGES[7].shortName,
      score1: 3420,
      score2: 2150,
      winnerCollegeId: SAMPLE_COLLEGES[0].collegeId,
      winnerCollegeName: SAMPLE_COLLEGES[0].collegeName,
      roomId: "room-qf-1",
      status: "COMPLETED",
      scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    },
    {
      id: "match-2",
      tournamentId: tId,
      round: 1,
      matchNumber: 2,
      roundName: "Quarterfinals",
      college1Id: SAMPLE_COLLEGES[3].collegeId, // BITS
      college1Name: SAMPLE_COLLEGES[3].collegeName,
      college1Short: SAMPLE_COLLEGES[3].shortName,
      college2Id: SAMPLE_COLLEGES[4].collegeId, // DTU
      college2Name: SAMPLE_COLLEGES[4].collegeName,
      college2Short: SAMPLE_COLLEGES[4].shortName,
      score1: 2980,
      score2: 2640,
      winnerCollegeId: SAMPLE_COLLEGES[3].collegeId,
      winnerCollegeName: SAMPLE_COLLEGES[3].collegeName,
      roomId: "room-qf-2",
      status: "COMPLETED",
      scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    },
    {
      id: "match-3",
      tournamentId: tId,
      round: 1,
      matchNumber: 3,
      roundName: "Quarterfinals",
      college1Id: SAMPLE_COLLEGES[1].collegeId, // NIT
      college1Name: SAMPLE_COLLEGES[1].collegeName,
      college1Short: SAMPLE_COLLEGES[1].shortName,
      college2Id: SAMPLE_COLLEGES[6].collegeId, // PSG
      college2Name: SAMPLE_COLLEGES[6].collegeName,
      college2Short: SAMPLE_COLLEGES[6].shortName,
      score1: 0,
      score2: 0,
      roomId: "room-qf-3",
      status: "LIVE",
      scheduledAt: new Date().toISOString(),
    },
    {
      id: "match-4",
      tournamentId: tId,
      round: 1,
      matchNumber: 4,
      roundName: "Quarterfinals",
      college1Id: SAMPLE_COLLEGES[2].collegeId, // VIT
      college1Name: SAMPLE_COLLEGES[2].collegeName,
      college1Short: SAMPLE_COLLEGES[2].shortName,
      college2Id: SAMPLE_COLLEGES[5].collegeId, // MIT
      college2Name: SAMPLE_COLLEGES[5].collegeName,
      college2Short: SAMPLE_COLLEGES[5].shortName,
      score1: 0,
      score2: 0,
      status: "PENDING",
      scheduledAt: new Date(Date.now() + 3600000 * 4).toISOString(),
    },

    // Round 2: Semifinals
    {
      id: "match-5",
      tournamentId: tId,
      round: 2,
      matchNumber: 1,
      roundName: "Semifinals",
      college1Id: SAMPLE_COLLEGES[0].collegeId, // AIT (winner of Match 1)
      college1Name: SAMPLE_COLLEGES[0].collegeName,
      college1Short: SAMPLE_COLLEGES[0].shortName,
      college2Id: SAMPLE_COLLEGES[3].collegeId, // BITS (winner of Match 2)
      college2Name: SAMPLE_COLLEGES[3].collegeName,
      college2Short: SAMPLE_COLLEGES[3].shortName,
      score1: 0,
      score2: 0,
      status: "PENDING",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: "match-6",
      tournamentId: tId,
      round: 2,
      matchNumber: 2,
      roundName: "Semifinals",
      college1Id: null, // Winner of Match 3
      college2Id: null, // Winner of Match 4
      score1: 0,
      score2: 0,
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    },

    // Round 3: Grand Finals
    {
      id: "match-7",
      tournamentId: tId,
      round: 3,
      matchNumber: 1,
      roundName: "Grand Finals",
      college1Id: null, // Winner of Match 5
      college2Id: null, // Winner of Match 6
      score1: 0,
      score2: 0,
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
  ];

  const tourn: TournamentDTO = {
    id: tId,
    title: "Apex Collegiate Placement Championship 2026",
    description: "Inter-collegiate 8-campus elimination bracket for top tier engineering students.",
    season: "Season 1 (Autumn 2026)",
    status: "IN_PROGRESS",
    format: "SINGLE_ELIMINATION",
    minColleges: 8,
    maxColleges: 8,
    startDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    prizePool: "₹5,00,000 Placement Grant",
    questionSetId: "qs-quant-101",
    participantCount: 8,
    participants,
    matches,
  };

  memoryTournaments = [tourn];
  memoryMatches.set(tId, matches);
  memoryParticipants.set(tId, participants);

  // Initialize demo challenge
  memoryChallenges = [
    {
      id: "chal-1",
      challengerCollegeId: SAMPLE_COLLEGES[0].collegeId, // AIT
      challengerCollegeName: SAMPLE_COLLEGES[0].collegeName,
      challengerShortName: SAMPLE_COLLEGES[0].shortName,
      opponentCollegeId: SAMPLE_COLLEGES[1].collegeId, // NIT
      opponentCollegeName: SAMPLE_COLLEGES[1].collegeName,
      opponentShortName: SAMPLE_COLLEGES[1].shortName,
      questionSetTitle: "Quantitative Aptitude Sprint 101",
      status: "ACCEPTED",
      scheduledAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      roomCode: "CLASH1",
      roomId: "room-clash-1",
      challengerScore: 0,
      opponentScore: 0,
      message: "Ready to test your speed on logical syllogisms?",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];
}

initDemoTournaments();

/**
 * List all tournaments
 */
export async function listTournaments(status?: TournamentStatus): Promise<TournamentDTO[]> {
  if (isTest || memoryTournaments.length > 0) {
    if (status) {
      return memoryTournaments.filter((t) => t.status === status);
    }
    return memoryTournaments;
  }

  try {
    const list = await prisma.tournament.findMany({
      where: status ? { status } : undefined,
      include: {
        _count: {
          select: { participants: true, matches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (list.length === 0) {
      return memoryTournaments;
    }

    return list.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      season: t.season,
      status: t.status as TournamentStatus,
      format: t.format as any,
      minColleges: t.minColleges,
      maxColleges: t.maxColleges,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      prizePool: t.prizePool,
      questionSetId: t.questionSetId,
      participantCount: t._count.participants,
    }));
  } catch {
    return memoryTournaments;
  }
}

/**
 * Get tournament by ID including matches and participants
 */
export async function getTournamentById(id: string): Promise<TournamentDTO | null> {
  const mem = memoryTournaments.find((t) => t.id === id);
  if (mem) {
    return {
      ...mem,
      matches: memoryMatches.get(id) || [],
      participants: memoryParticipants.get(id) || [],
    };
  }

  if (isTest) return null;

  try {
    const t = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: { college: true },
        },
        matches: {
          include: {
            college1: true,
            college2: true,
            winnerCollege: true,
          },
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        },
      },
    });

    if (!t) return null;

    const participants: TournamentParticipantDTO[] = t.participants.map((p) => ({
      id: p.id,
      tournamentId: p.tournamentId,
      collegeId: p.collegeId,
      collegeName: p.college.name,
      shortName: p.college.shortName,
      seed: p.seed,
      score: p.score,
      eliminated: p.eliminated,
    }));

    const totalRounds = Math.max(...t.matches.map((m) => m.round), 1);

    const matches: TournamentMatchDTO[] = t.matches.map((m) => ({
      id: m.id,
      tournamentId: m.tournamentId,
      round: m.round,
      matchNumber: m.matchNumber,
      roundName: getRoundName(m.round, totalRounds),
      college1Id: m.college1Id,
      college1Name: m.college1?.name,
      college1Short: m.college1?.shortName,
      college2Id: m.college2Id,
      college2Name: m.college2?.name,
      college2Short: m.college2?.shortName,
      score1: m.score1,
      score2: m.score2,
      winnerCollegeId: m.winnerCollegeId,
      winnerCollegeName: m.winnerCollege?.name,
      roomId: m.roomId,
      status: m.status as MatchStatus,
      scheduledAt: m.scheduledAt?.toISOString(),
      completedAt: m.completedAt?.toISOString(),
    }));

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      season: t.season,
      status: t.status as TournamentStatus,
      format: t.format as any,
      minColleges: t.minColleges,
      maxColleges: t.maxColleges,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      prizePool: t.prizePool,
      questionSetId: t.questionSetId,
      participantCount: participants.length,
      participants,
      matches,
    };
  } catch {
    return memoryTournaments[0] || null;
  }
}

/**
 * Format tournament matches into ordered bracket rounds
 */
export async function getTournamentBracket(tournamentId: string): Promise<BracketRoundDTO[]> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament || !tournament.matches) return [];

  const roundMap = new Map<number, TournamentMatchDTO[]>();
  for (const m of tournament.matches) {
    const list = roundMap.get(m.round) || [];
    list.push(m);
    roundMap.set(m.round, list);
  }

  const totalRounds = Math.max(...Array.from(roundMap.keys()), 1);
  const result: BracketRoundDTO[] = [];

  for (let r = 1; r <= totalRounds; r++) {
    const matches = roundMap.get(r) || [];
    matches.sort((a, b) => a.matchNumber - b.matchNumber);
    result.push({
      round: r,
      name: getRoundName(r, totalRounds),
      matches,
    });
  }

  return result;
}

/**
 * Create a new tournament and automatically generate the elimination bracket
 */
export async function createTournament(input: {
  title: string;
  description?: string | null;
  season: string;
  format?: any;
  minColleges?: number;
  maxColleges?: number;
  startDate: string | Date;
  endDate: string | Date;
  prizePool?: string | null;
  questionSetId?: string | null;
  participantCollegeIds: string[];
}): Promise<TournamentDTO> {
  const id = `tourn-${Date.now()}`;
  const collegeIds = input.participantCollegeIds;
  const numColleges = Math.min(16, Math.max(4, 2 ** Math.ceil(Math.log2(collegeIds.length))));

  // Fetch or mock college profiles
  const colleges = collegeIds.map((cId, idx) => {
    const found = SAMPLE_COLLEGES.find((sc) => sc.collegeId === cId);
    return {
      collegeId: cId,
      collegeName: found?.collegeName || `College ${cId}`,
      shortName: found?.shortName || `COL${idx + 1}`,
      seed: idx + 1,
    };
  });

  const participants: TournamentParticipantDTO[] = colleges.map((c) => ({
    id: `tp-${id}-${c.collegeId}`,
    tournamentId: id,
    collegeId: c.collegeId,
    collegeName: c.collegeName,
    shortName: c.shortName,
    seed: c.seed,
    score: 0,
    eliminated: false,
  }));

  const totalRounds = Math.log2(numColleges);
  const pairs = getSeedingPairs(numColleges);
  const matches: TournamentMatchDTO[] = [];

  // Generate Round 1 matches
  for (let m = 0; m < pairs.length; m++) {
    const [seedA, seedB] = pairs[m];
    const collegeA = colleges.find((c) => c.seed === seedA);
    const collegeB = colleges.find((c) => c.seed === seedB);

    matches.push({
      id: `match-${id}-1-${m + 1}`,
      tournamentId: id,
      round: 1,
      matchNumber: m + 1,
      roundName: getRoundName(1, totalRounds),
      college1Id: collegeA?.collegeId || null,
      college1Name: collegeA?.collegeName || null,
      college1Short: collegeA?.shortName || null,
      college2Id: collegeB?.collegeId || null,
      college2Name: collegeB?.collegeName || null,
      college2Short: collegeB?.shortName || null,
      score1: 0,
      score2: 0,
      status: "PENDING",
      scheduledAt: new Date(new Date(input.startDate).getTime() + m * 3600000).toISOString(),
    });
  }

  // Generate Subsequent Rounds (Semifinals, Finals, etc.) with empty slots
  let currentRoundMatches = pairs.length;
  for (let r = 2; r <= totalRounds; r++) {
    currentRoundMatches = currentRoundMatches / 2;
    for (let m = 1; m <= currentRoundMatches; m++) {
      matches.push({
        id: `match-${id}-${r}-${m}`,
        tournamentId: id,
        round: r,
        matchNumber: m,
        roundName: getRoundName(r, totalRounds),
        college1Id: null,
        college2Id: null,
        score1: 0,
        score2: 0,
        status: "SCHEDULED",
        scheduledAt: new Date(new Date(input.startDate).getTime() + (r - 1) * 86400000 + (m - 1) * 3600000).toISOString(),
      });
    }
  }

  const newTourn: TournamentDTO = {
    id,
    title: input.title,
    description: input.description,
    season: input.season,
    status: "IN_PROGRESS",
    format: input.format || "SINGLE_ELIMINATION",
    minColleges: numColleges,
    maxColleges: numColleges,
    startDate: new Date(input.startDate).toISOString(),
    endDate: new Date(input.endDate).toISOString(),
    prizePool: input.prizePool,
    questionSetId: input.questionSetId,
    participantCount: colleges.length,
    participants,
    matches,
  };

  memoryTournaments.unshift(newTourn);
  memoryMatches.set(id, matches);
  memoryParticipants.set(id, participants);

  return newTourn;
}

/**
 * Advance a match winner and propagate to the next bracket round
 */
export async function advanceTournamentMatch(
  matchId: string,
  winnerCollegeId: string,
  score1: number,
  score2: number
): Promise<{ success: boolean; currentMatch: TournamentMatchDTO; nextMatch?: TournamentMatchDTO; tournamentCompleted?: boolean }> {
  // Search in memory
  let foundMatch: TournamentMatchDTO | null = null;
  let targetTournId = "";

  for (const [tId, mList] of memoryMatches.entries()) {
    const m = mList.find((x) => x.id === matchId);
    if (m) {
      foundMatch = m;
      targetTournId = tId;
      break;
    }
  }

  if (!foundMatch) {
    throw new Error("Match not found");
  }

  const loserCollegeId = foundMatch.college1Id === winnerCollegeId ? foundMatch.college2Id : foundMatch.college1Id;

  // Mark match complete
  foundMatch.status = "COMPLETED";
  foundMatch.winnerCollegeId = winnerCollegeId;
  foundMatch.score1 = score1;
  foundMatch.score2 = score2;
  foundMatch.completedAt = new Date().toISOString();

  // Find college details
  const winnerInfo = SAMPLE_COLLEGES.find((c) => c.collegeId === winnerCollegeId);
  if (winnerInfo) {
    foundMatch.winnerCollegeName = winnerInfo.collegeName;
  }

  // Update participant elimination status
  const pList = memoryParticipants.get(targetTournId);
  if (pList && loserCollegeId) {
    const loser = pList.find((p) => p.collegeId === loserCollegeId);
    if (loser) loser.eliminated = true;
  }

  // Determine next match in bracket
  const tournMatches = memoryMatches.get(targetTournId) || [];
  const nextRound = foundMatch.round + 1;
  const nextMatchNumber = Math.ceil(foundMatch.matchNumber / 2);
  const isCollege1Slot = foundMatch.matchNumber % 2 !== 0;

  const nextMatch = tournMatches.find((m) => m.round === nextRound && m.matchNumber === nextMatchNumber);

  let tournamentCompleted = false;

  if (nextMatch) {
    if (isCollege1Slot) {
      nextMatch.college1Id = winnerCollegeId;
      nextMatch.college1Name = winnerInfo?.collegeName || `College ${winnerCollegeId}`;
      nextMatch.college1Short = winnerInfo?.shortName || "COL";
    } else {
      nextMatch.college2Id = winnerCollegeId;
      nextMatch.college2Name = winnerInfo?.collegeName || `College ${winnerCollegeId}`;
      nextMatch.college2Short = winnerInfo?.shortName || "COL";
    }

    // If both slots are filled, mark match as PENDING ready to play
    if (nextMatch.college1Id && nextMatch.college2Id) {
      nextMatch.status = "PENDING";
    }
  } else {
    // No next round means this was the final round!
    tournamentCompleted = true;
    const tourn = memoryTournaments.find((t) => t.id === targetTournId);
    if (tourn) {
      tourn.status = "COMPLETED";
    }
  }

  return {
    success: true,
    currentMatch: foundMatch,
    nextMatch,
    tournamentCompleted,
  };
}

/**
 * College Challenges & Matchmaking
 */
export async function listCollegeChallenges(collegeId?: string): Promise<CollegeChallengeDTO[]> {
  if (collegeId) {
    return memoryChallenges.filter(
      (c) => c.challengerCollegeId === collegeId || c.opponentCollegeId === collegeId
    );
  }
  return memoryChallenges;
}

export async function createCollegeChallenge(input: {
  challengerCollegeId: string;
  opponentCollegeId: string;
  challengerUserId?: string | null;
  questionSetId?: string | null;
  message?: string | null;
  scheduledAt?: string | null;
}): Promise<CollegeChallengeDTO> {
  const cA = SAMPLE_COLLEGES.find((c) => c.collegeId === input.challengerCollegeId) || SAMPLE_COLLEGES[0];
  const cB = SAMPLE_COLLEGES.find((c) => c.collegeId === input.opponentCollegeId) || SAMPLE_COLLEGES[1];

  const challenge: CollegeChallengeDTO = {
    id: `chal-${Date.now()}`,
    challengerCollegeId: cA.collegeId,
    challengerCollegeName: cA.collegeName,
    challengerShortName: cA.shortName,
    opponentCollegeId: cB.collegeId,
    opponentCollegeName: cB.collegeName,
    opponentShortName: cB.shortName,
    challengerUserId: input.challengerUserId || null,
    questionSetId: input.questionSetId || "qs-quant-101",
    questionSetTitle: "Inter-Collegiate Placement Duel",
    status: "PENDING",
    scheduledAt: input.scheduledAt || new Date(Date.now() + 3600000 * 2).toISOString(),
    challengerScore: 0,
    opponentScore: 0,
    message: input.message || "We challenge your campus to an aptitude duel!",
    createdAt: new Date().toISOString(),
  };

  memoryChallenges.unshift(challenge);
  return challenge;
}

export async function respondToCollegeChallenge(
  challengeId: string,
  action: "ACCEPT" | "DECLINE"
): Promise<{ success: boolean; challenge: CollegeChallengeDTO; roomCode?: string; roomId?: string }> {
  const ch = memoryChallenges.find((c) => c.id === challengeId);
  if (!ch) {
    throw new Error("Challenge not found");
  }

  if (action === "DECLINE") {
    ch.status = "DECLINED";
    return { success: true, challenge: ch };
  }

  // Create an arena room for this clash
  try {
    const room = await createRoom("usr-host-1", ch.questionSetId || "qs-quant-101", 50, ch.challengerCollegeId, {
      gameMode: "CLASSIC",
      timePerQuestion: 20,
    });

    ch.status = "ACCEPTED";
    ch.roomId = room.id;
    ch.roomCode = room.code;

    return {
      success: true,
      challenge: ch,
      roomCode: room.code,
      roomId: room.id,
    };
  } catch {
    ch.status = "ACCEPTED";
    ch.roomCode = "CLASH9";
    ch.roomId = "room-clash-auto";
    return {
      success: true,
      challenge: ch,
      roomCode: "CLASH9",
      roomId: "room-clash-auto",
    };
  }
}

export async function resolveCollegeChallenge(
  challengeId: string,
  challengerScore: number,
  opponentScore: number
): Promise<CollegeChallengeDTO> {
  const ch = memoryChallenges.find((c) => c.id === challengeId);
  if (!ch) {
    throw new Error("Challenge not found");
  }

  ch.challengerScore = challengerScore;
  ch.opponentScore = opponentScore;
  ch.status = "COMPLETED";

  if (challengerScore > opponentScore) {
    ch.winnerCollegeId = ch.challengerCollegeId;
    ch.winnerCollegeName = ch.challengerCollegeName;
  } else if (opponentScore > challengerScore) {
    ch.winnerCollegeId = ch.opponentCollegeId;
    ch.winnerCollegeName = ch.opponentCollegeName;
  }

  return ch;
}
