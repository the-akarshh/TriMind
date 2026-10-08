import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { canCreateQuestionSets } from "@/lib/auth/rbac";
import { questionSetSchema } from "@/lib/validations/question";
import { getQuestionSets, createQuestionSet } from "@/lib/services/question-service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId") || undefined;
  const collegeId = url.searchParams.get("collegeId") || undefined;

  const sets = await getQuestionSets({ ownerId, collegeId });
  return NextResponse.json({ success: true, sets });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  if (!canCreateQuestionSets(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only Hosts and Faculty can author question sets." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validated = questionSetSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const created = await createQuestionSet(session.userId, validated.data);
    return NextResponse.json({ success: true, questionSet: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create question set." },
      { status: 500 }
    );
  }
}
