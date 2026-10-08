import { NextRequest, NextResponse } from "next/server";
import { rolloverNewSeason } from "@/lib/services/season-service";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "COLLEGE_ADMIN" && session.role !== "FACULTY")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const name = body?.name;
    const startDate = body?.startDate ? new Date(body.startDate) : new Date();
    const endDate = body?.endDate ? new Date(body.endDate) : new Date(Date.now() + 86400000 * 90);

    if (!name) {
      return NextResponse.json({ error: "Season name required" }, { status: 400 });
    }

    const newSeason = await rolloverNewSeason(name, startDate, endDate);
    return NextResponse.json({
      success: true,
      season: newSeason,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to rollover new season" },
      { status: 400 }
    );
  }
}
