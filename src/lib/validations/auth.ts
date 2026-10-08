import { z } from "zod";

export const RoleEnum = z.enum(["PLAYER", "HOST", "FACULTY", "COLLEGE_ADMIN", "SUPER_ADMIN"]);

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name must be under 60 characters"),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: RoleEnum.default("PLAYER"),
  collegeId: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
