import { NextRequest, NextResponse } from "next/server";
import { getTopicLeaderboard } from "@/lib/services/topic-league-service";
import { Topic } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = (searchParams.get("topic") || "QUANTITATIVE") as Topic;

    const leaderboard = await getTopicLeaderboard(topic);

    return NextResponse.json({
      success: true,
      topic,
      leaderboard,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load topic leaderboard" },
      { status: 500 }
    );
  }
}
