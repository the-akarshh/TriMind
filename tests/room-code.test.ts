import { describe, it, expect } from "vitest";
import { generateRoomCode, isValidRoomCode } from "../src/lib/engine/room-code";

describe("Room Code Generator", () => {
  it("should generate a 6-character room code", () => {
    const code = generateRoomCode();
    expect(code).toBeDefined();
    expect(code.length).toBe(6);
  });

  it("should generate valid codes satisfying isValidRoomCode", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(isValidRoomCode(code)).toBe(true);
    }
  });

  it("should reject ambiguous characters like '0', 'O', '1', 'I'", () => {
    expect(isValidRoomCode("0ABCD2")).toBe(false);
    expect(isValidRoomCode("OABCD2")).toBe(false);
    expect(isValidRoomCode("1ABCD2")).toBe(false);
    expect(isValidRoomCode("IABCD2")).toBe(false);
  });

  it("should demonstrate high collision-resistance across 500 codes", () => {
    const generated = new Set<string>();
    for (let i = 0; i < 500; i++) {
      generated.add(generateRoomCode());
    }
    // High probability of zero collisions in 500 trials with 32^6 ~ 1 billion space
    expect(generated.size).toBe(500);
  });
});
