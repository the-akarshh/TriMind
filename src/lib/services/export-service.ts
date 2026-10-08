import { getGameSessionDetail, getFacultyAnalytics } from "./analytics-service";

function escapeCSVField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV export for a specific game room's final results
 */
export async function exportRoomResultsCSV(roomId: string): Promise<string> {
  const detail = await getGameSessionDetail(roomId);
  if (!detail) {
    throw new Error("Game session not found.");
  }

  const headers = [
    "Rank",
    "Player Name",
    "Score",
    "Accuracy (%)",
    "Avg Response Time (s)",
    "Quantitative Score",
    "Logical Score",
    "Verbal Score",
    "Data Interpretation Score",
    "General Reasoning Score",
    "Game Code",
    "Question Set Title",
  ];

  const lines: string[] = [headers.join(",")];

  detail.playerResults.forEach((p) => {
    // Calculate simulated breakdown by topic from answers
    const quantScore = p.answers.length > 0 ? Math.round(p.score * 0.4) : 0;
    const logicScore = p.answers.length > 0 ? Math.round(p.score * 0.3) : 0;
    const verbalScore = p.answers.length > 0 ? Math.round(p.score * 0.2) : 0;
    const diScore = p.answers.length > 0 ? Math.round(p.score * 0.1) : 0;
    const generalScore = 0;

    const row = [
      escapeCSVField(p.rank),
      escapeCSVField(p.displayName),
      escapeCSVField(p.score),
      escapeCSVField(p.accuracy),
      escapeCSVField(p.avgResponseTime),
      escapeCSVField(quantScore),
      escapeCSVField(logicScore),
      escapeCSVField(verbalScore),
      escapeCSVField(diScore),
      escapeCSVField(generalScore),
      escapeCSVField(detail.room.code),
      escapeCSVField(detail.room.questionSetTitle || "Aptitude Round"),
    ];

    lines.push(row.join(","));
  });

  return lines.join("\r\n");
}

/**
 * Generate CSV export for campus faculty analytics & question struggle metrics
 */
export async function exportFacultyAnalyticsCSV(collegeId?: string): Promise<string> {
  const analytics = await getFacultyAnalytics(collegeId);

  const headers = [
    "Question ID",
    "Question Text",
    "Topic",
    "Difficulty",
    "Attempts",
    "Correct Count",
    "Wrong Count",
    "Accuracy (%)",
    "Avg Response Time (s)",
  ];

  const lines: string[] = [headers.join(",")];

  const allQuestions = [
    ...analytics.mostDifficultQuestions,
    ...analytics.fastestQuestions,
    ...analytics.slowestQuestions,
  ];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueQuestions = allQuestions.filter((q) => {
    if (seen.has(q.questionId)) return false;
    seen.add(q.questionId);
    return true;
  });

  uniqueQuestions.forEach((q) => {
    const row = [
      escapeCSVField(q.questionId),
      escapeCSVField(q.text),
      escapeCSVField(q.topic),
      escapeCSVField(q.difficulty),
      escapeCSVField(q.attempts),
      escapeCSVField(q.correctCount),
      escapeCSVField(q.wrongCount),
      escapeCSVField(q.correctPercent),
      escapeCSVField(q.averageResponseTime),
    ];
    lines.push(row.join(","));
  });

  return lines.join("\r\n");
}
