import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signToken, verifyToken } from "../src/lib/auth/token";
import {
  canCreateRooms,
  canCreateQuestionSets,
  canAccessSuperAdmin,
  canModifyQuestionSet,
} from "../src/lib/auth/rbac";

describe("Authentication & RBAC Security", () => {
  it("should securely hash and verify passwords using bcrypt", async () => {
    const raw = "SuperSecretPlacementPass123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2a$")).toBe(true);

    const match = await verifyPassword(raw, hash);
    expect(match).toBe(true);

    const wrongMatch = await verifyPassword("WrongPassword!", hash);
    expect(wrongMatch).toBe(false);
  });

  it("should sign and verify JWT tokens containing user roles", () => {
    const payload = {
      userId: "usr-123",
      email: "student@apex.edu",
      role: "PLAYER" as const,
      name: "Arjun S.",
    };

    const token = signToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("usr-123");
    expect(decoded?.role).toBe("PLAYER");
  });

  it("should strictly enforce role-based access permissions", () => {
    // Player cannot create rooms or question sets
    expect(canCreateRooms("PLAYER")).toBe(false);
    expect(canCreateQuestionSets("PLAYER")).toBe(false);
    expect(canAccessSuperAdmin("PLAYER")).toBe(false);

    // Host can create rooms and question sets
    expect(canCreateRooms("HOST")).toBe(true);
    expect(canCreateQuestionSets("HOST")).toBe(true);
    expect(canAccessSuperAdmin("HOST")).toBe(false);

    // Faculty can create rooms and question sets
    expect(canCreateRooms("FACULTY")).toBe(true);
    expect(canCreateQuestionSets("FACULTY")).toBe(true);

    // Super Admin has all privileges
    expect(canCreateRooms("SUPER_ADMIN")).toBe(true);
    expect(canAccessSuperAdmin("SUPER_ADMIN")).toBe(true);
  });

  it("should protect question set modification according to ownership and role", () => {
    const ownerId = "usr-host-1";
    const otherUserId = "usr-host-2";

    // Owner can modify
    expect(canModifyQuestionSet("HOST", ownerId, ownerId)).toBe(true);

    // Non-owner host cannot modify
    expect(canModifyQuestionSet("HOST", ownerId, otherUserId)).toBe(false);

    // Super Admin can modify any set
    expect(canModifyQuestionSet("SUPER_ADMIN", ownerId, otherUserId)).toBe(true);
  });
});
