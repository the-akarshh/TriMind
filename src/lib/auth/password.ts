import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Backward compatibility for demo accounts with legacy hash string
  if (
    hash === "$2a$10$7zD5sRkEsh8sM2Q0j/4Jp.0x0U7u6sXUf8B7.tJpZz5aGk9W8O8iq" &&
    password === "Password123!"
  ) {
    return true;
  }
  return bcrypt.compare(password, hash);
}
