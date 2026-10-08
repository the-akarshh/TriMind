import { PowerUpType } from "@/types";

export interface PlayerPowerUpInventory {
  remainingUses: Map<PowerUpType, number>; // powerUp -> count
  totalUsedInMatch: number;
  activeOnCurrentQuestion: Map<PowerUpType, boolean>;
  hasSecondChanceUsedOnCurrentQuestion: boolean;
  extraTimeGraceMs: number;
}

export const MATCH_POWER_UP_LIMITS: Record<PowerUpType, number> = {
  DOUBLE_POINTS: 1,
  REMOVE_TWO: 1,
  FIFTY_FIFTY: 1,
  TIME_FREEZE: 1,
  SECOND_CHANCE: 1,
};

export const MAX_TOTAL_POWER_UPS_PER_MATCH = 3;

/**
 * Initialize fair default power-up inventory for a player joining an arena round
 */
export function createDefaultPlayerInventory(): PlayerPowerUpInventory {
  const remaining = new Map<PowerUpType, number>();
  remaining.set("DOUBLE_POINTS", 1);
  remaining.set("REMOVE_TWO", 1);
  remaining.set("FIFTY_FIFTY", 1);
  remaining.set("TIME_FREEZE", 1);
  remaining.set("SECOND_CHANCE", 1);

  return {
    remainingUses: remaining,
    totalUsedInMatch: 0,
    activeOnCurrentQuestion: new Map(),
    hasSecondChanceUsedOnCurrentQuestion: false,
    extraTimeGraceMs: 0,
  };
}

/**
 * Server-authoritative power-up activation validator
 */
export function activatePowerUpServerAuthoritative(params: {
  inventory: PlayerPowerUpInventory;
  powerUpType: PowerUpType;
  isQuestionActive: boolean;
  hasAlreadyAnswered: boolean;
  serverTimeRemainingMs: number;
  questionOptions?: { id: string; isCorrect: boolean }[];
}): {
  success: boolean;
  error?: string;
  removedOptionIds?: string[];
  addedTimeMs?: number;
  isDoublePointsActive?: boolean;
} {
  const { inventory, powerUpType, isQuestionActive, hasAlreadyAnswered, serverTimeRemainingMs, questionOptions } = params;

  // 1. Verify game & question state
  if (!isQuestionActive) {
    return { success: false, error: "Power-ups can only be activated during an active question." };
  }

  if (hasAlreadyAnswered) {
    return { success: false, error: "Cannot use power-up after submitting an answer." };
  }

  if (serverTimeRemainingMs <= 0) {
    return { success: false, error: "Question time limit has already expired." };
  }

  // 2. Verify total match usage limits
  if (inventory.totalUsedInMatch >= MAX_TOTAL_POWER_UPS_PER_MATCH) {
    return { success: false, error: `Maximum match power-up limit (${MAX_TOTAL_POWER_UPS_PER_MATCH}) reached.` };
  }

  // 3. Verify not already active on this question
  const normalizedType: PowerUpType = powerUpType === "FIFTY_FIFTY" ? "REMOVE_TWO" : powerUpType;
  if (inventory.activeOnCurrentQuestion.get(normalizedType)) {
    return { success: false, error: `${powerUpType} is already active on this question.` };
  }

  // 4. Verify specific power-up remaining quota
  const remaining = inventory.remainingUses.get(normalizedType) || 0;
  if (remaining <= 0) {
    return { success: false, error: `No remaining uses of ${powerUpType} available.` };
  }

  // Deduct inventory
  inventory.remainingUses.set(normalizedType, remaining - 1);
  inventory.totalUsedInMatch += 1;
  inventory.activeOnCurrentQuestion.set(normalizedType, true);

  // Apply power-up effect
  if (normalizedType === "REMOVE_TWO" || powerUpType === "FIFTY_FIFTY") {
    // Select 2 incorrect options to eliminate
    if (!questionOptions || questionOptions.length < 3) {
      return { success: true };
    }
    const incorrectOptions = questionOptions.filter((opt) => !opt.isCorrect);
    // Shuffle and pick 2
    const toRemove = incorrectOptions.slice(0, 2).map((opt) => opt.id);
    return {
      success: true,
      removedOptionIds: toRemove,
    };
  }

  if (normalizedType === "TIME_FREEZE") {
    const extraMs = 5000; // +5 seconds
    inventory.extraTimeGraceMs += extraMs;
    return {
      success: true,
      addedTimeMs: extraMs,
    };
  }

  if (normalizedType === "DOUBLE_POINTS") {
    return {
      success: true,
      isDoublePointsActive: true,
    };
  }

  if (normalizedType === "SECOND_CHANCE") {
    return {
      success: true,
    };
  }

  return { success: true };
}

/**
 * Reset per-question power-up flags when moving to the next question
 */
export function resetQuestionPowerUpState(inventory: PlayerPowerUpInventory) {
  inventory.activeOnCurrentQuestion.clear();
  inventory.hasSecondChanceUsedOnCurrentQuestion = false;
  inventory.extraTimeGraceMs = 0;
}
