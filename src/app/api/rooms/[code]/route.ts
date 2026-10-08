import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  getRoomByCode,
  getRoomPlayers,
  updateRoomStatus,
} from "@/lib/services/room-service";
import { RoomStatus } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const room = await getRoomByCode(params.code);
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const players = await getRoomPlayers(params.code);

  return NextResponse.json({
    success: true,
    room: {
      ...room,
      players,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status } = body as { status: RoomStatus };

    const updated = await updateRoomStatus(params.code, status, session.userId);
    return NextResponse.json({ success: true, room: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update room." },
      { status: 400 }
    );
  }
}
