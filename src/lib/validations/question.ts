import { z } from "zod";

export const TopicEnum = z.enum([
  "QUANTITATIVE",
  "LOGICAL",
  "VERBAL",
  "DATA_INTERPRETATION",
  "GENERAL_REASONING",
]);

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]);
export const VisibilityEnum = z.enum(["PUBLIC", "PRIVATE", "COLLEGE_ONLY"]);

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Option text cannot be empty").max(300, "Option is too long"),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().min(5, "Question text must be at least 5 characters").max(1000),
    explanation: z.string().max(2000).optional().nullable(),
    topic: TopicEnum,
    difficulty: DifficultyEnum.default("MEDIUM"),
    imageUrl: z.string().url().optional().nullable().or(z.literal("")),
    tableData: z.string().optional().nullable(),
    tags: z.string().optional().nullable(),
    timeLimit: z.number().int().min(5).max(180).default(30),
    points: z.number().int().min(10).max(500).default(100),
    order: z.number().int().min(0).default(0),
    options: z
      .array(questionOptionSchema)
      .min(2, "Each question must have at least 2 options")
      .max(6, "Maximum 6 options allowed"),
  })
  .refine(
    (q) => q.options.some((opt) => opt.isCorrect),
    {
      message: "At least one option must be marked as correct",
      path: ["options"],
    }
  );

export const questionSetSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(500).optional().nullable(),
  topic: TopicEnum.default("QUANTITATIVE"),
  difficulty: DifficultyEnum.default("MEDIUM"),
  estimatedDuration: z.number().int().min(1).max(300).default(15),
  tags: z.string().optional().nullable(),
  isArchived: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  visibility: VisibilityEnum.default("PUBLIC"),
  collegeId: z.string().optional().nullable(),
  questions: z.array(questionSchema).optional(),
});

export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionSetInput = z.infer<typeof questionSetSchema>;
