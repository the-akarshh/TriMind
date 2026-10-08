import { z } from "zod";

export const RoomStatusEnum = z.enum([
  "LOBBY",
  "IN_PROGRESS",
  "QUESTION_ACTIVE",
  "QUESTION_RESULT",
  "FINISHED",
]);

export const GameModeEnum = z.enum(["CLASSIC", "SPEED", "TEAM_BATTLE", "PRACTICE"]);

export const createRoomSchema = z.object({
  questionSetId: z.string().min(1, "Question set is required"),
  maxPlayers: z.number().int().min(2).max(100).default(50),
  collegeId: z.string().optional().nullable(),
  gameMode: GameModeEnum.default("CLASSIC"),
  timePerQuestion: z.number().int().min(5).max(180).optional().nullable(),
  questionCount: z.number().int().min(1).max(100).optional().nullable(),
});

export const joinRoomSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, "Room code must be exactly 6 characters")
    .regex(/^[A-Z0-9]+$/, "Room code must be alphanumeric"),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(25, "Display name must be under 25 characters"),
});

export const submitAnswerSchema = z.object({
  roomId: z.string().min(1),
  gameQuestionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  responseTime: z.number().min(0).max(300),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
