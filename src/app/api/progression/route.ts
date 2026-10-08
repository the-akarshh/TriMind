import { NextResponse } from "next/server";
import { getUserProgression } from "@/lib/services/progression-service";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getServerSession();
    const userId = session?.userId || "usr-player-1";
    const progression = getUserProgression(userId);

    return NextResponse.json({
      success: true,
      progression,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load player progression" },
      { status: 500 }
    );
  }
}
