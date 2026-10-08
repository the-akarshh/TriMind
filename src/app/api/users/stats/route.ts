import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getPlayerStats } from "@/lib/services/stats-service";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  const stats = await getPlayerStats(session?.userId);

  return NextResponse.json({
    success: true,
    stats,
  });
}
