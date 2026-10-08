import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { registerUser } from "@/lib/services/auth-service";
import { signToken } from "@/lib/auth/token";
import { COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await registerUser(validated.data);
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      collegeId: user.collegeId,
    });

    const response = NextResponse.json({ success: true, user }, { status: 201 });
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to register user." },
      { status: 400 }
    );
  }
}
