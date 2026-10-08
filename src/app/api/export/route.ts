import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { canViewAnalytics } from "@/lib/auth/rbac";
import { exportRoomResultsCSV, exportFacultyAnalyticsCSV } from "@/lib/services/export-service";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const url = new URL(req.url);
  const roomId = url.searchParams.get("roomId");
  const type = url.searchParams.get("type");

  try {
    if (type === "faculty") {
      if (!canViewAnalytics(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only faculty and admins can export institutional analytics." },
          { status: 403 }
        );
      }
      const csv = await exportFacultyAnalyticsCSV(session.collegeId || undefined);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="campus-faculty-analytics.csv"',
        },
      });
    }

    if (roomId) {
      const csv = await exportRoomResultsCSV(roomId);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="arena-results-${roomId}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Missing required parameter: 'roomId' or 'type=faculty'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}
