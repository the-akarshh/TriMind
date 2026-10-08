import { describe, it, expect } from "vitest";
import { questionSchema } from "../src/lib/validations/question";
import { joinRoomSchema, createRoomSchema } from "../src/lib/validations/room";
import { registerSchema } from "../src/lib/validations/auth";

describe("Zod Validation Schemas", () => {
  it("should validate question with at least 2 options and a marked correct answer", () => {
    const validQuestion = {
      text: "What is the speed of light in vacuum?",
      topic: "QUANTITATIVE" as const,
      difficulty: "MEDIUM" as const,
      timeLimit: 30,
      points: 100,
      order: 1,
      options: [
        { text: "3 x 10^8 m/s", isCorrect: true },
        { text: "3 x 10^6 m/s", isCorrect: false },
      ],
    };

    const parsed = questionSchema.safeParse(validQuestion);
    expect(parsed.success).toBe(true);
  });

  it("should reject question when no option is marked as correct", () => {
    const invalidQuestion = {
      text: "What is 2 + 2?",
      topic: "QUANTITATIVE" as const,
      difficulty: "EASY" as const,
      timeLimit: 20,
      points: 50,
      order: 1,
      options: [
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: false },
      ],
    };

    const parsed = questionSchema.safeParse(invalidQuestion);
    expect(parsed.success).toBe(false);
  });

  it("should enforce room PIN format and display name in joinRoomSchema", () => {
    // Valid
    const valid = joinRoomSchema.safeParse({
      code: "A7K9P2",
      displayName: "Cadet Arjun",
    });
    expect(valid.success).toBe(true);

    // Invalid length PIN
    const invalidShortPin = joinRoomSchema.safeParse({
      code: "ABC",
      displayName: "Cadet Arjun",
    });
    expect(invalidShortPin.success).toBe(false);

    // Empty display name
    const invalidName = joinRoomSchema.safeParse({
      code: "A7K9P2",
      displayName: "",
    });
    expect(invalidName.success).toBe(false);
  });

  it("should enforce registration password requirements", () => {
    // Missing number
    const noNumber = registerSchema.safeParse({
      name: "Test User",
      email: "test@college.edu",
      password: "PasswordOnly",
    });
    expect(noNumber.success).toBe(false);

    // Missing uppercase
    const noUpper = registerSchema.safeParse({
      name: "Test User",
      email: "test@college.edu",
      password: "password123",
    });
    expect(noUpper.success).toBe(false);

    // Valid
    const valid = registerSchema.safeParse({
      name: "Test User",
      email: "test@college.edu",
      password: "Password123",
    });
    expect(valid.success).toBe(true);
  });
});
