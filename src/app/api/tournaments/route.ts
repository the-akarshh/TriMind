import { NextRequest, NextResponse } from "next/server";
import { listTournaments, createTournament } from "@/lib/services/tournament-service";
import { createTournamentSchema } from "@/lib/validations/tournament";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;

    const tournaments = await listTournaments(status);
    return NextResponse.json({
      success: true,
      tournaments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load tournaments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTournamentSchema.parse(body);

    const tournament = await createTournament(validated);

    return NextResponse.json({
      success: true,
      tournament,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Validation failed" },
      { status: 400 }
    );
  }
}
