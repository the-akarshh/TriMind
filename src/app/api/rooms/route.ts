import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { canCreateRooms } from "@/lib/auth/rbac";
import { createRoomSchema } from "@/lib/validations/room";
import { createRoom } from "@/lib/services/room-service";

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  if (!canCreateRooms(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only hosts, faculty, or admins can create competition rooms." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validated = createRoomSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const room = await createRoom(
      session.userId,
      validated.data.questionSetId,
      validated.data.maxPlayers,
      session.collegeId,
      {
        gameMode: validated.data.gameMode,
        timePerQuestion: validated.data.timePerQuestion,
        questionCount: validated.data.questionCount,
      }
    );

    return NextResponse.json({ success: true, room }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create competition room." },
      { status: 400 }
    );
  }
}
