import { NextRequest, NextResponse } from "next/server";
import { getTournamentById, getTournamentBracket } from "@/lib/services/tournament-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await getTournamentById(params.id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const bracket = await getTournamentBracket(params.id);

    return NextResponse.json({
      success: true,
      tournament,
      bracket,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load tournament" },
      { status: 500 }
    );
  }
}
