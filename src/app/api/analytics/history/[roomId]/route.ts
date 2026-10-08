import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getGameSessionDetail } from "@/lib/services/analytics-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const detail = await getGameSessionDetail(params.roomId);
  if (!detail) {
    return NextResponse.json({ error: "Game session detail not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, session: detail });
}
