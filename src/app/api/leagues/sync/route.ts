import { NextRequest, NextResponse } from "next/server";
import { syncSeasonalLeagueScores } from "@/lib/services/league-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leagueId = body?.leagueId;

    const result = await syncSeasonalLeagueScores(leagueId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to synchronize league scores" },
      { status: 500 }
    );
  }
}
