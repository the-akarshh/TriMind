import { NextRequest, NextResponse } from "next/server";
import { freezeSeason, rolloverNewSeason } from "@/lib/services/season-service";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "COLLEGE_ADMIN" && session.role !== "FACULTY")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const seasonId = body?.seasonId;
    if (!seasonId) {
      return NextResponse.json({ error: "Season ID required" }, { status: 400 });
    }

    const result = await freezeSeason(seasonId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to freeze season" },
      { status: 400 }
    );
  }
}
