import jwt from "jsonwebtoken";
import { SafeUser } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_arena_change_in_production";
const DEFAULT_EXPIRY = "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: SafeUser["role"];
  name: string;
  collegeId?: string | null;
}

export function signToken(payload: TokenPayload, expiresIn: string = DEFAULT_EXPIRY): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
