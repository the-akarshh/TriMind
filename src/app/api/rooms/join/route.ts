import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { joinRoomSchema } from "@/lib/validations/room";
import { joinRoom, getRoomByCode } from "@/lib/services/room-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = joinRoomSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code, displayName } = validated.data;
    const session = getSessionFromRequest(req);

    const room = await getRoomByCode(code);
    if (!room) {
      return NextResponse.json(
        { error: `Room code '${code}' was not found. Please verify the 6-character code.` },
        { status: 404 }
      );
    }

    const player = await joinRoom(code, displayName, session?.userId);

    return NextResponse.json({
      success: true,
      room,
      player,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to join room." },
      { status: 400 }
    );
  }
}
