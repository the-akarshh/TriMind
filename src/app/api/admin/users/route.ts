import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { canManageCollege } from "@/lib/auth/rbac";
import { getAllMemoryUsers } from "@/lib/services/auth-service";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canManageCollege(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: Admin privileges required." },
      { status: 403 }
    );
  }

  const users = getAllMemoryUsers();
  return NextResponse.json({ success: true, users });
}
