/**
 * Room Code Generator & Validator
 * Generates collision-resistant, human-readable 6-character room codes.
 * Excludes ambiguous characters (0, O, 1, I) to prevent student entry errors.
 */

const SAFE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomCode(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_ALPHABET.length);
    result += SAFE_ALPHABET[randomIndex];
  }
  return result;
}

export function isValidRoomCode(code: string): boolean {
  if (!code || code.length !== 6) return false;
  const uppercase = code.toUpperCase();
  for (const char of uppercase) {
    if (!SAFE_ALPHABET.includes(char)) {
      return false;
    }
  }
  return true;
}
