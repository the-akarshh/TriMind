import { NextRequest, NextResponse } from "next/server";
import { searchQuestionLibrary } from "@/lib/services/question-service";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || undefined;
  const difficulty = url.searchParams.get("difficulty") || undefined;
  const tags = url.searchParams.get("tags") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const questions = await searchQuestionLibrary({ topic, difficulty, tags, search });
  return NextResponse.json({ success: true, questions });
}
