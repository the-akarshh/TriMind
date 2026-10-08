import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getPlayerProfileAnalytics } from "@/lib/services/analytics-service";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId") || session.userId;

  const profile = await getPlayerProfileAnalytics(targetUserId);
  return NextResponse.json({ success: true, profile });
}
