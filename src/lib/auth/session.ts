import { cookies } from "next/headers";
import { verifyToken, TokenPayload } from "./token";

export const COOKIE_NAME = "arena_session";

export async function getServerSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function getSessionFromRequest(req: Request): TokenPayload | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  const token = match ? decodeURIComponent(match[2]) : null;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}
