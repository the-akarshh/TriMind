import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { canViewAnalytics } from "@/lib/auth/rbac";
import { getFacultyAnalytics } from "@/lib/services/analytics-service";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  if (!canViewAnalytics(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only faculty, hosts, and admins have access to institutional analytics." },
      { status: 403 }
    );
  }

  try {
    const analytics = await getFacultyAnalytics(session.collegeId || undefined);
    return NextResponse.json({ success: true, analytics });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load faculty analytics." },
      { status: 500 }
    );
  }
}
