import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getGameHistory } from "@/lib/services/analytics-service";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(req.url);
  const hostId = url.searchParams.get("hostId") || undefined;
  const collegeId = url.searchParams.get("collegeId") || session.collegeId || undefined;

  const history = await getGameHistory(hostId, collegeId);
  return NextResponse.json({ success: true, history });
}
