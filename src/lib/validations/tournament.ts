import { z } from "zod";

export const createTournamentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be under 100 characters"),
  description: z.string().max(500).optional().nullable(),
  season: z.string().min(1, "Season is required"),
  format: z.enum(["SINGLE_ELIMINATION", "ROUND_ROBIN", "DOUBLE_ELIMINATION"]).default("SINGLE_ELIMINATION"),
  minColleges: z.number().int().min(2).max(64).default(4),
  maxColleges: z.number().int().min(2).max(64).default(16),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  prizePool: z.string().max(100).optional().nullable(),
  questionSetId: z.string().optional().nullable(),
  participantCollegeIds: z.array(z.string()).min(2, "Select at least 2 colleges"),
});

export const advanceMatchSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  winnerCollegeId: z.string().min(1, "Winner College ID is required"),
  score1: z.number().int().min(0).default(0),
  score2: z.number().int().min(0).default(0),
});

export const createChallengeSchema = z.object({
  opponentCollegeId: z.string().min(1, "Target opponent college is required"),
  questionSetId: z.string().optional().nullable(),
  message: z.string().max(250).optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

export const respondChallengeSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
  action: z.enum(["ACCEPT", "DECLINE"]),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type AdvanceMatchInput = z.infer<typeof advanceMatchSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type RespondChallengeInput = z.infer<typeof respondChallengeSchema>;
