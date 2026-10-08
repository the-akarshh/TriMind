import { NextRequest, NextResponse } from "next/server";
import { getCurrentSeason, listAllSeasons, getSeasonSnapshots } from "@/lib/services/season-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");

    if (seasonId) {
      const snapshots = await getSeasonSnapshots(seasonId);
      return NextResponse.json({
        success: true,
        snapshots,
      });
    }

    const [current, all] = await Promise.all([
      getCurrentSeason(),
      listAllSeasons(),
    ]);

    return NextResponse.json({
      success: true,
      currentSeason: current,
      seasons: all,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load seasons" },
      { status: 500 }
    );
  }
}
