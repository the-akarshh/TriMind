import { NextRequest, NextResponse } from "next/server";
import { getActiveLeagues, getLeagueStandings } from "@/lib/services/league-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get("division") || undefined;
    const leagueId = searchParams.get("leagueId") || undefined;

    const [leagues, standings] = await Promise.all([
      getActiveLeagues(),
      getLeagueStandings(leagueId, division),
    ]);

    return NextResponse.json({
      success: true,
      leagues,
      standings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load leagues" },
      { status: 500 }
    );
  }
}
