import { NextRequest, NextResponse } from "next/server";
import { advanceTournamentMatch } from "@/lib/services/tournament-service";
import { advanceMatchSchema } from "@/lib/validations/tournament";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = advanceMatchSchema.parse(body);

    const result = await advanceTournamentMatch(
      validated.matchId,
      validated.winnerCollegeId,
      validated.score1,
      validated.score2
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to advance tournament match" },
      { status: 400 }
    );
  }
}
