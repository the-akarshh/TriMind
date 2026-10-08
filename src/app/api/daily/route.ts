import { NextRequest, NextResponse } from "next/server";
import { getTodayDailyChallenge, submitDailyChallengeAttempt } from "@/lib/services/daily-challenge-service";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getServerSession();
    const challenge = await getTodayDailyChallenge(session?.userId);

    return NextResponse.json({
      success: true,
      challenge,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load daily challenge" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await submitDailyChallengeAttempt({
      userId: session.userId,
      displayName: session.name || "Cadet",
      collegeName: session.collegeId ? "Apex Institute of Tech" : undefined,
      score: body.score || 0,
      accuracy: body.accuracy || 0,
      timeTakenSec: body.timeTakenSec || 30,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit daily challenge attempt" },
      { status: 400 }
    );
  }
}
