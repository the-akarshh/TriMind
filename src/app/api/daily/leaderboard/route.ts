import { NextRequest, NextResponse } from "next/server";
import { getDailyChallengeLeaderboard } from "@/lib/services/daily-challenge-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;

    const leaderboard = await getDailyChallengeLeaderboard(date);

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load daily leaderboard" },
      { status: 500 }
    );
  }
}
