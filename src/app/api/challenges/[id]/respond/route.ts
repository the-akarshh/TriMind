import { NextRequest, NextResponse } from "next/server";
import { respondToCollegeChallenge } from "@/lib/services/tournament-service";
import { respondChallengeSchema } from "@/lib/validations/tournament";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = respondChallengeSchema.parse({
      challengeId: params.id,
      action: body?.action,
    });

    const result = await respondToCollegeChallenge(
      validated.challengeId,
      validated.action
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to respond to challenge" },
      { status: 400 }
    );
  }
}
