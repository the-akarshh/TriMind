import { NextRequest, NextResponse } from "next/server";
import { listCollegeChallenges, createCollegeChallenge } from "@/lib/services/tournament-service";
import { createChallengeSchema } from "@/lib/validations/tournament";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId") || undefined;

    const challenges = await listCollegeChallenges(collegeId);
    return NextResponse.json({
      success: true,
      challenges,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load challenges" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    const validated = createChallengeSchema.parse(body);

    const challengerCollegeId = session?.collegeId || "col-1";

    const challenge = await createCollegeChallenge({
      challengerCollegeId,
      opponentCollegeId: validated.opponentCollegeId,
      challengerUserId: session?.userId,
      questionSetId: validated.questionSetId,
      message: validated.message,
      scheduledAt: validated.scheduledAt,
    });

    return NextResponse.json(
      {
        success: true,
        challenge,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create challenge" },
      { status: 400 }
    );
  }
}
