import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateDivision,
  calculateEloRating,
  getLeagueStandings,
  syncSeasonalLeagueScores,
  SAMPLE_COLLEGES,
} from "../src/lib/services/league-service";
import {
  getSeedingPairs,
  getRoundName,
  createTournament,
  getTournamentById,
  getTournamentBracket,
  advanceTournamentMatch,
  createCollegeChallenge,
  respondToCollegeChallenge,
  resolveCollegeChallenge,
  listCollegeChallenges,
} from "../src/lib/services/tournament-service";
import { createTournamentSchema, advanceMatchSchema, createChallengeSchema } from "../src/lib/validations/tournament";

describe("College Leagues & MMR Elo System", () => {
  it("should assign DIAMOND, GOLD, and SILVER divisions accurately", () => {
    // Score >= 16000 or top 25% -> DIAMOND
    expect(calculateDivision(1, 8, 18500)).toBe("DIAMOND");
    expect(calculateDivision(2, 8, 16200)).toBe("DIAMOND");

    // Score >= 11000 or top 65% -> GOLD
    expect(calculateDivision(3, 8, 14000)).toBe("GOLD");
    expect(calculateDivision(5, 8, 11500)).toBe("GOLD");

    // Lower -> SILVER
    expect(calculateDivision(7, 8, 8000)).toBe("SILVER");
    expect(calculateDivision(8, 8, 6500)).toBe("SILVER");
  });

  it("should calculate Elo MMR ratings with score, win rate, and experience scaling", () => {
    const eloHigh = calculateEloRating(18000, 0.75, 50);
    const eloMid = calculateEloRating(12000, 0.50, 30);
    const eloLow = calculateEloRating(6000, 0.30, 10);

    expect(eloHigh).toBeGreaterThan(eloMid);
    expect(eloMid).toBeGreaterThan(eloLow);
    expect(eloHigh).toBeGreaterThan(2400);
    expect(eloLow).toBeLessThan(1800);
  });

  it("should filter standings by collegiate division tier", async () => {
    const allStandings = await getLeagueStandings(undefined, "ALL");
    expect(allStandings.colleges.length).toBe(SAMPLE_COLLEGES.length);

    const diamondStandings = await getLeagueStandings(undefined, "DIAMOND");
    expect(diamondStandings.colleges.every((c) => c.division === "DIAMOND")).toBe(true);
    expect(diamondStandings.colleges.length).toBeGreaterThan(0);

    const goldStandings = await getLeagueStandings(undefined, "GOLD");
    expect(goldStandings.colleges.every((c) => c.division === "GOLD")).toBe(true);

    const silverStandings = await getLeagueStandings(undefined, "SILVER");
    expect(silverStandings.colleges.every((c) => c.division === "SILVER")).toBe(true);
  });

  it("should perform seasonal synchronization of league scores", async () => {
    const syncResult = await syncSeasonalLeagueScores();
    expect(syncResult.success).toBe(true);
    expect(syncResult.collegesSynced).toBeGreaterThan(0);
    expect(syncResult.playersSynced).toBeGreaterThan(0);
    expect(syncResult.updatedAt).toBeDefined();
  });
});

describe("Tournament Bracket Generation & Seeding Engine", () => {
  it("should generate traditional single elimination seeding pairs", () => {
    // 4 teams: 1v4, 2v3
    const pairs4 = getSeedingPairs(4);
    expect(pairs4).toEqual([
      [1, 4],
      [2, 3],
    ]);

    // 8 teams: 1v8, 4v5, 2v7, 3v6
    const pairs8 = getSeedingPairs(8);
    expect(pairs8).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]);

    // 16 teams: 8 matches
    const pairs16 = getSeedingPairs(16);
    expect(pairs16.length).toBe(8);
    expect(pairs16[0]).toEqual([1, 16]);
  });

  it("should derive correct round names based on bracket depth", () => {
    expect(getRoundName(3, 3)).toBe("Grand Finals");
    expect(getRoundName(2, 3)).toBe("Semifinals");
    expect(getRoundName(1, 3)).toBe("Quarterfinals");
    expect(getRoundName(1, 4)).toBe("Round of 16");
  });

  it("should create an 8-campus tournament and build full multi-round tree", async () => {
    const colleges = SAMPLE_COLLEGES.slice(0, 8).map((c) => c.collegeId);
    const tournament = await createTournament({
      title: "Vitest Inter-Collegiate Clash",
      season: "Season 1",
      participantCollegeIds: colleges,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 5),
    });

    expect(tournament.id).toBeDefined();
    expect(tournament.participantCount).toBe(8);
    expect(tournament.matches?.length).toBe(7); // 4 QF + 2 SF + 1 Final = 7 matches

    // Verify round breakdown
    const bracket = await getTournamentBracket(tournament.id);
    expect(bracket.length).toBe(3); // 3 rounds (QF, SF, Finals)
    expect(bracket[0].matches.length).toBe(4);
    expect(bracket[1].matches.length).toBe(2);
    expect(bracket[2].matches.length).toBe(1);

    // Verify Round 1 seeding matches: Seed 1 (AIT) vs Seed 8 (TIET)
    const match1 = bracket[0].matches[0];
    expect(match1.college1Id).toBe(SAMPLE_COLLEGES[0].collegeId);
    expect(match1.college2Id).toBe(SAMPLE_COLLEGES[7].collegeId);
  });

  it("should advance match winners through bracket rounds to Grand Finals", async () => {
    const colleges = SAMPLE_COLLEGES.slice(0, 4).map((c) => c.collegeId);
    const tournament = await createTournament({
      title: "Final 4 College Invitational",
      season: "Season 1",
      participantCollegeIds: colleges,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 2),
    });

    // 4 teams -> 2 Semifinals (Round 1) + 1 Grand Final (Round 2)
    const bracket = await getTournamentBracket(tournament.id);
    expect(bracket.length).toBe(2);
    const sf1 = bracket[0].matches[0];
    const sf2 = bracket[0].matches[1];

    // Semifinal 1: College 1 wins
    const adv1 = await advanceTournamentMatch(sf1.id, sf1.college1Id!, 3200, 2100);
    expect(adv1.success).toBe(true);
    expect(adv1.currentMatch.status).toBe("COMPLETED");
    expect(adv1.nextMatch?.college1Id).toBe(sf1.college1Id);

    // Semifinal 2: College 2 wins
    const adv2 = await advanceTournamentMatch(sf2.id, sf2.college2Id!, 2400, 2900);
    expect(adv2.success).toBe(true);
    expect(adv2.nextMatch?.college2Id).toBe(sf2.college2Id);
    expect(adv2.nextMatch?.status).toBe("PENDING");

    // Grand Final: College 1 wins the championship!
    const finalMatch = adv2.nextMatch!;
    const advFinal = await advanceTournamentMatch(finalMatch.id, finalMatch.college1Id!, 3500, 2800);
    expect(advFinal.success).toBe(true);
    expect(advFinal.tournamentCompleted).toBe(true);
  });
});

describe("College Clash & Matchmaking System", () => {
  it("should create an inter-collegiate challenge", async () => {
    const challenge = await createCollegeChallenge({
      challengerCollegeId: SAMPLE_COLLEGES[0].collegeId,
      opponentCollegeId: SAMPLE_COLLEGES[1].collegeId,
      message: "Ready for the aptitude duel?",
    });

    expect(challenge.id).toBeDefined();
    expect(challenge.challengerShortName).toBe("AIT");
    expect(challenge.opponentShortName).toBe("NIT");
    expect(challenge.status).toBe("PENDING");
  });

  it("should accept a challenge and generate an arena room code", async () => {
    const challenge = await createCollegeChallenge({
      challengerCollegeId: SAMPLE_COLLEGES[0].collegeId,
      opponentCollegeId: SAMPLE_COLLEGES[2].collegeId,
      message: "Accept our challenge!",
    });

    const response = await respondToCollegeChallenge(challenge.id, "ACCEPT");
    expect(response.success).toBe(true);
    expect(response.challenge.status).toBe("ACCEPTED");
    expect(response.roomCode).toBeDefined();
    expect(response.roomCode?.length).toBeGreaterThanOrEqual(6);
  });

  it("should decline a challenge gracefully", async () => {
    const challenge = await createCollegeChallenge({
      challengerCollegeId: SAMPLE_COLLEGES[1].collegeId,
      opponentCollegeId: SAMPLE_COLLEGES[3].collegeId,
    });

    const response = await respondToCollegeChallenge(challenge.id, "DECLINE");
    expect(response.success).toBe(true);
    expect(response.challenge.status).toBe("DECLINED");
  });

  it("should resolve a challenge with score comparison", async () => {
    const challenge = await createCollegeChallenge({
      challengerCollegeId: SAMPLE_COLLEGES[0].collegeId,
      opponentCollegeId: SAMPLE_COLLEGES[1].collegeId,
    });

    const resolved = await resolveCollegeChallenge(challenge.id, 4500, 3900);
    expect(resolved.status).toBe("COMPLETED");
    expect(resolved.challengerScore).toBe(4500);
    expect(resolved.opponentScore).toBe(3900);
    expect(resolved.winnerCollegeId).toBe(SAMPLE_COLLEGES[0].collegeId);
  });

  it("should validate tournament and challenge inputs with Zod", () => {
    // Valid tournament
    const validTourn = createTournamentSchema.safeParse({
      title: "Placement Cup",
      season: "Season 1",
      participantCollegeIds: ["c1", "c2", "c3", "c4"],
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });
    expect(validTourn.success).toBe(true);

    // Invalid tournament (< 2 colleges)
    const invalidTourn = createTournamentSchema.safeParse({
      title: "Cup",
      season: "Season 1",
      participantCollegeIds: ["c1"],
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });
    expect(invalidTourn.success).toBe(false);

    // Valid challenge
    const validChal = createChallengeSchema.safeParse({
      opponentCollegeId: "col-2",
      message: "Game on!",
    });
    expect(validChal.success).toBe(true);
  });
});
