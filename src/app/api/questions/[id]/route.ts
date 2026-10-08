import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  getQuestionSetById,
  updateQuestionSet,
  duplicateQuestionSet,
  deleteQuestionSet,
  archiveQuestionSet,
  publishQuestionSet,
  reorderQuestions,
} from "@/lib/services/question-service";
import { questionSetSchema } from "@/lib/validations/question";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const set = await getQuestionSetById(params.id);
  if (!set) {
    return NextResponse.json({ error: "Question set not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, questionSet: set });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

    const updated = await updateQuestionSet(
      params.id,
      session.userId,
      session.role,
      validated.data
    );

    return NextResponse.json({ success: true, questionSet: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update question set." },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "duplicate") {
      const duplicated = await duplicateQuestionSet(params.id, session.userId);
      return NextResponse.json({ success: true, questionSet: duplicated }, { status: 201 });
    }

    if (action === "archive") {
      await archiveQuestionSet(params.id, session.userId, session.role, true);
      return NextResponse.json({ success: true, message: "Question set archived." });
    }

    if (action === "unarchive") {
      await archiveQuestionSet(params.id, session.userId, session.role, false);
      return NextResponse.json({ success: true, message: "Question set restored from archive." });
    }

    if (action === "publish") {
      await publishQuestionSet(params.id, session.userId, session.role, true);
      return NextResponse.json({ success: true, message: "Question set published." });
    }

    if (action === "unpublish") {
      await publishQuestionSet(params.id, session.userId, session.role, false);
      return NextResponse.json({ success: true, message: "Question set unpublished." });
    }

    if (action === "reorder") {
      const body = await req.json();
      const { orderedQuestionIds } = body;
      if (!Array.isArray(orderedQuestionIds)) {
        return NextResponse.json(
          { error: "orderedQuestionIds array is required." },
          { status: 400 }
        );
      }
      await reorderQuestions(params.id, session.userId, session.role, orderedQuestionIds);
      return NextResponse.json({ success: true, message: "Question order saved." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Action failed." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteQuestionSet(params.id, session.userId, session.role);
    return NextResponse.json({ success: true, message: "Question set deleted successfully." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete question set." },
      { status: 403 }
    );
  }
}
