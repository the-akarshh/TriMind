import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { canCreateQuestionSets } from "@/lib/auth/rbac";
import {
  parseQuestionsFromCSV,
  parseQuestionsFromJSON,
  getSampleCSVTemplate,
} from "@/lib/utils/csv-parser";
import { getQuestionSetById, updateQuestionSet } from "@/lib/services/question-service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const template = url.searchParams.get("template");

  if (template === "csv") {
    const csv = getSampleCSVTemplate();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="aptitude-questions-template.csv"',
      },
    });
  }

  return NextResponse.json({ message: "Import questions API endpoint." });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  if (!canCreateQuestionSets(session.role)) {
    return NextResponse.json(
      { error: "Forbidden: Only hosts and faculty can import questions." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { format = "csv", content, targetSetId, saveToSet = false } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid file content string." },
        { status: 400 }
      );
    }

    const parseResult =
      format === "json"
        ? parseQuestionsFromJSON(content)
        : parseQuestionsFromCSV(content);

    // If host wants to save directly to an existing question set
    if (saveToSet && targetSetId && parseResult.validQuestions.length > 0) {
      const currentSet = await getQuestionSetById(targetSetId);
      if (!currentSet) {
        return NextResponse.json({ error: "Target question set not found." }, { status: 404 });
      }

      const combinedQuestions = [
        ...(currentSet.questions || []),
        ...parseResult.validQuestions.map((q, idx) => ({
          ...q,
          order: (currentSet.questions?.length || 0) + idx + 1,
        })),
      ];

      await updateQuestionSet(targetSetId, session.userId, session.role, {
        title: currentSet.title,
        description: currentSet.description,
        topic: currentSet.topic || "QUANTITATIVE",
        difficulty: currentSet.difficulty || "MEDIUM",
        estimatedDuration: currentSet.estimatedDuration || 15,
        tags: currentSet.tags,
        isArchived: !!currentSet.isArchived,
        isPublished: currentSet.isPublished !== false,
        visibility: currentSet.visibility,
        questions: combinedQuestions as any,
      });
    }

    return NextResponse.json({
      success: parseResult.success,
      validQuestions: parseResult.validQuestions,
      errors: parseResult.errors,
      totalRows: parseResult.totalRows,
      validCount: parseResult.validCount,
      errorCount: parseResult.errorCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to parse import content." },
      { status: 500 }
    );
  }
}
