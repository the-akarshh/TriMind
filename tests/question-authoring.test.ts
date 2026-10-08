import { describe, it, expect, beforeEach } from "vitest";
import {
  parseQuestionsFromCSV,
  parseQuestionsFromJSON,
  getSampleCSVTemplate,
  normalizeTopic,
  normalizeDifficulty,
} from "../src/lib/utils/csv-parser";
import {
  createQuestionSet,
  getQuestionSetById,
  updateQuestionSet,
  reorderQuestions,
  archiveQuestionSet,
  publishQuestionSet,
  searchQuestionLibrary,
} from "../src/lib/services/question-service";
import {
  getFacultyAnalytics,
  getQuestionPerformanceList,
  getGameHistory,
  getGameSessionDetail,
  getPlayerProfileAnalytics,
} from "../src/lib/services/analytics-service";
import {
  exportRoomResultsCSV,
  exportFacultyAnalyticsCSV,
} from "../src/lib/services/export-service";
import {
  canCreateQuestionSets,
  canAccessFacultyAnalytics,
  canModifyQuestionSet,
} from "../src/lib/auth/rbac";

describe("Question Authoring & CSV/JSON Import Utility", () => {
  it("parses valid CSV questions with RFC 4180 compliance", () => {
    const csv = `question,optionA,optionB,optionC,optionD,correctAnswer,topic,difficulty,timeLimit,explanation
"What is 15% of 200?","25","30","35","40","B","QUANTITATIVE","EASY",20,"0.15 * 200 = 30"
"Find next in sequence: 2, 4, 8, 16, ?","24","32","30","28","B","LOGICAL","MEDIUM",25,"Powers of 2: 2^5 = 32"`;

    const result = parseQuestionsFromCSV(csv);
    expect(result.success).toBe(true);
    expect(result.validCount).toBe(2);
    expect(result.errorCount).toBe(0);

    const q1 = result.validQuestions[0];
    expect(q1.text).toBe("What is 15% of 200?");
    expect(q1.topic).toBe("QUANTITATIVE");
    expect(q1.difficulty).toBe("EASY");
    expect(q1.timeLimit).toBe(20);
    expect(q1.options).toHaveLength(4);
    expect(q1.options[1].text).toBe("30");
    expect(q1.options[1].isCorrect).toBe(true);
    expect(q1.options[0].isCorrect).toBe(false);
  });

  it("handles commas and escaped quotes inside question fields", () => {
    const csv = `"A merchant says, ""Buy two, get one free!"", what is the discount?","25%","33.33%","50%","20%","B","QUANTITATIVE","MEDIUM",30,"1 out of 3 is free = 33.33%"`;

    const result = parseQuestionsFromCSV(csv);
    expect(result.success).toBe(true);
    expect(result.validCount).toBe(1);
    expect(result.validQuestions[0].text).toContain('Buy two, get one free!');
  });

  it("reports precise row-by-row validation errors for invalid data", () => {
    const invalidCsv = `question,optionA,optionB,optionC,optionD,correctAnswer,topic,difficulty,timeLimit
"","10","20","30","40","A","QUANTITATIVE","EASY",30
"Valid question text?","10","","","","Z","INVALID_TOPIC","INVALID_DIFF",300`;

    const result = parseQuestionsFromCSV(invalidCsv);
    expect(result.success).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);

    const row1Errors = result.errors.filter((e) => e.row === 2);
    expect(row1Errors.some((e) => e.field === "question")).toBe(true);

    const row2Errors = result.errors.filter((e) => e.row === 3);
    expect(row2Errors.some((e) => e.field === "options")).toBe(true);
    expect(row2Errors.some((e) => e.field === "correctAnswer")).toBe(true);
    expect(row2Errors.some((e) => e.field === "topic")).toBe(true);
    expect(row2Errors.some((e) => e.field === "difficulty")).toBe(true);
    expect(row2Errors.some((e) => e.field === "timeLimit")).toBe(true);
  });

  it("parses valid JSON array of questions", () => {
    const json = JSON.stringify([
      {
        text: "Select the synonym for 'Eloquent'",
        options: [
          { text: "Articulate", isCorrect: true },
          { text: "Hesitant", isCorrect: false },
        ],
        topic: "VERBAL",
        difficulty: "MEDIUM",
        timeLimit: 25,
      },
    ]);

    const result = parseQuestionsFromJSON(json);
    expect(result.success).toBe(true);
    expect(result.validCount).toBe(1);
    expect(result.validQuestions[0].options[0].isCorrect).toBe(true);
  });

  it("normalizes topics and difficulties flexibly", () => {
    expect(normalizeTopic("quant")).toBe("QUANTITATIVE");
    expect(normalizeTopic("data-interpretation")).toBe("DATA_INTERPRETATION");
    expect(normalizeTopic("reasoning")).toBe("LOGICAL");
    expect(normalizeTopic("unknown")).toBeNull();

    expect(normalizeDifficulty("easy")).toBe("EASY");
    expect(normalizeDifficulty("MED")).toBe("MEDIUM");
    expect(normalizeDifficulty("expert")).toBe("EXPERT");
  });

  it("generates sample CSV template", () => {
    const template = getSampleCSVTemplate();
    expect(template).toContain("question,optionA,optionB,optionC,optionD,correctAnswer");
    expect(template).toContain("QUANTITATIVE");
  });
});

describe("Question Set Management & Server-Side Reordering", () => {
  it("creates a question set with image, tableData, duration and tags", async () => {
    const newSet = await createQuestionSet("usr-host-1", {
      title: "Campus Speed DI Sprint",
      description: "Data interpretation with charts and tables",
      topic: "DATA_INTERPRETATION",
      difficulty: "HARD",
      estimatedDuration: 20,
      tags: "di,placement,infosys",
      visibility: "PUBLIC",
      isArchived: false,
      isPublished: true,
      questions: [
        {
          text: "What was the growth in 2024 according to the table?",
          explanation: "Difference between 2024 and 2023 divided by 2023",
          topic: "DATA_INTERPRETATION",
          difficulty: "HARD",
          timeLimit: 45,
          points: 150,
          tableData: JSON.stringify([{ Year: "2023", Units: 100 }, { Year: "2024", Units: 150 }]),
          imageUrl: "https://example.com/chart.png",
          tags: "table,growth",
          order: 1,
          options: [
            { text: "50%", isCorrect: true },
            { text: "25%", isCorrect: false },
          ],
        },
      ],
    });

    expect(newSet.id).toBeDefined();
    expect(newSet.title).toBe("Campus Speed DI Sprint");
    expect(newSet.topic).toBe("DATA_INTERPRETATION");
    expect(newSet.estimatedDuration).toBe(20);
    expect(newSet.questions?.[0].tableData).toContain("Units");
  });

  it("updates a question set and modifies its questions", async () => {
    const created = await createQuestionSet("usr-host-1", {
      title: "Initial Set Title",
      description: "Initial description",
      topic: "QUANTITATIVE",
      difficulty: "MEDIUM",
      estimatedDuration: 15,
      visibility: "PUBLIC",
      isArchived: false,
      isPublished: true,
      questions: [
        {
          text: "Question A?",
          topic: "QUANTITATIVE",
          difficulty: "EASY",
          timeLimit: 30,
          points: 100,
          order: 1,
          options: [
            { text: "1", isCorrect: true },
            { text: "2", isCorrect: false },
          ],
        },
      ],
    });

    const updated = await updateQuestionSet(created.id, "usr-host-1", "HOST", {
      title: "Updated Set Title",
      description: "Updated description",
      topic: "QUANTITATIVE",
      difficulty: "HARD",
      estimatedDuration: 25,
      tags: "speed",
      visibility: "COLLEGE_ONLY",
      isArchived: false,
      isPublished: true,
      questions: [
        {
          text: "Question B (Updated)?",
          topic: "QUANTITATIVE",
          difficulty: "HARD",
          timeLimit: 40,
          points: 120,
          order: 1,
          options: [
            { text: "10", isCorrect: true },
            { text: "20", isCorrect: false },
          ],
        },
      ],
    });

    expect(updated.title).toBe("Updated Set Title");
    expect(updated.difficulty).toBe("HARD");
    expect(updated.visibility).toBe("COLLEGE_ONLY");
    expect(updated.questions?.[0].text).toBe("Question B (Updated)?");
  });

  it("handles server-side question reordering", async () => {
    const created = await createQuestionSet("usr-host-1", {
      title: "Reordering Test Set",
      topic: "LOGICAL",
      difficulty: "MEDIUM",
      estimatedDuration: 15,
      visibility: "PUBLIC",
      isArchived: false,
      isPublished: true,
      questions: [
        {
          id: "q-ord-1",
          text: "First Question",
          topic: "LOGICAL",
          difficulty: "MEDIUM",
          timeLimit: 30,
          points: 100,
          order: 1,
          options: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }],
        },
        {
          id: "q-ord-2",
          text: "Second Question",
          topic: "LOGICAL",
          difficulty: "MEDIUM",
          timeLimit: 30,
          points: 100,
          order: 2,
          options: [{ text: "C", isCorrect: true }, { text: "D", isCorrect: false }],
        },
      ],
    });

    // Reorder: put Second Question first
    await reorderQuestions(created.id, "usr-host-1", "HOST", ["q-ord-2", "q-ord-1"]);

    const reloaded = await getQuestionSetById(created.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.questions?.[0].text).toBe("Second Question");
    expect(reloaded?.questions?.[0].order).toBe(1);
    expect(reloaded?.questions?.[1].text).toBe("First Question");
    expect(reloaded?.questions?.[1].order).toBe(2);
  });

  it("archives and publishes question sets", async () => {
    const created = await createQuestionSet("usr-host-1", {
      title: "Archive Test",
      topic: "VERBAL",
      difficulty: "EASY",
      estimatedDuration: 10,
      visibility: "PUBLIC",
      isArchived: false,
      isPublished: true,
      questions: [
        {
          text: "Question 1",
          topic: "VERBAL",
          difficulty: "EASY",
          timeLimit: 20,
          points: 100,
          order: 1,
          options: [{ text: "X", isCorrect: true }, { text: "Y", isCorrect: false }],
        },
      ],
    });

    await archiveQuestionSet(created.id, "usr-host-1", "HOST", true);
    let s = await getQuestionSetById(created.id);
    expect(s?.isArchived).toBe(true);

    await publishQuestionSet(created.id, "usr-host-1", "HOST", false);
    s = await getQuestionSetById(created.id);
    expect(s?.isPublished).toBe(false);
  });

  it("searches individual questions across question bank library", async () => {
    const all = await searchQuestionLibrary();
    expect(all.length).toBeGreaterThan(0);

    const quantOnly = await searchQuestionLibrary({ topic: "QUANTITATIVE" });
    expect(quantOnly.every((q) => q.topic === "QUANTITATIVE")).toBe(true);
  });
});

describe("Faculty Analytics, Question Struggle Metrics & Export", () => {
  it("computes campus-level institutional KPIs", async () => {
    const analytics = await getFacultyAnalytics();
    expect(analytics.totalGames).toBeGreaterThan(0);
    expect(analytics.totalStudents).toBeGreaterThan(0);
    expect(analytics.averageAccuracy).toBeGreaterThan(0);
    expect(analytics.averageResponseTime).toBeGreaterThan(0);

    // Topic breakdown covers all 5 core aptitude topics
    expect(analytics.topicBreakdown).toHaveLength(5);
    expect(analytics.topicBreakdown.some((t) => t.topic === "QUANTITATIVE")).toBe(true);
    expect(analytics.topicBreakdown.some((t) => t.topic === "LOGICAL")).toBe(true);
  });

  it("identifies difficult questions and slowest friction points", async () => {
    const analytics = await getFacultyAnalytics();
    expect(analytics.mostDifficultQuestions.length).toBeGreaterThan(0);
    // Hard questions have lowest accuracy
    const lowestAccuracy = analytics.mostDifficultQuestions[0].correctPercent;
    expect(lowestAccuracy).toBeLessThanOrEqual(50);

    expect(analytics.fastestQuestions.length).toBeGreaterThan(0);
    expect(analytics.slowestQuestions.length).toBeGreaterThan(0);
    expect(analytics.fastestQuestions[0].averageResponseTime).toBeLessThan(
      analytics.slowestQuestions[0].averageResponseTime
    );
  });

  it("generates match session drilldown with standings and per-question stats", async () => {
    const detail = await getGameSessionDetail("room-hist-1");
    expect(detail).not.toBeNull();
    expect(detail?.leaderboard.length).toBeGreaterThan(0);
    expect(detail?.leaderboard[0].rank).toBe(1);
    expect(detail?.playerResults.length).toBeGreaterThan(0);
    expect(detail?.questionAnalytics.length).toBeGreaterThan(0);
  });

  it("generates valid server-side CSV result export for a completed match", async () => {
    const csv = await exportRoomResultsCSV("room-hist-1");
    expect(csv).toContain("Rank,Player Name,Score,Accuracy (%),Avg Response Time (s)");
    expect(csv).toContain("Arjun Sharma");
    expect(csv).toContain("A7K9P2");
  });

  it("generates valid server-side CSV faculty analytics report", async () => {
    const csv = await exportFacultyAnalyticsCSV();
    expect(csv).toContain("Question ID,Question Text,Topic,Difficulty,Attempts,Correct Count");
    expect(csv).toContain("QUANTITATIVE");
  });

  it("provides lifetime player profile analytics and cognitive mastery", async () => {
    const profile = await getPlayerProfileAnalytics("usr-student-1");
    expect(profile).not.toBeNull();
    expect(profile?.totalGames).toBeGreaterThan(0);
    expect(profile?.overallAccuracy).toBeGreaterThan(0);
    expect(profile?.topicStrengths.length).toBe(5);
    expect(profile?.recentGames.length).toBeGreaterThan(0);
  });
});

describe("Role-Based Authorization Enforcement", () => {
  it("rejects unauthorized actions for standard players", () => {
    expect(canCreateQuestionSets("PLAYER")).toBe(false);
    expect(canAccessFacultyAnalytics("PLAYER")).toBe(false);
  });

  it("permits authoring and analytics for hosts, faculty, and admins", () => {
    expect(canCreateQuestionSets("HOST")).toBe(true);
    expect(canCreateQuestionSets("FACULTY")).toBe(true);
    expect(canAccessFacultyAnalytics("FACULTY")).toBe(true);
    expect(canAccessFacultyAnalytics("SUPER_ADMIN")).toBe(true);
  });

  it("enforces ownership rules on modifying question sets", () => {
    expect(canModifyQuestionSet("HOST", "usr-host-1", "usr-host-1")).toBe(true);
    expect(canModifyQuestionSet("HOST", "usr-host-1", "usr-other-host")).toBe(false);
    // Super Admin can modify any set
    expect(canModifyQuestionSet("SUPER_ADMIN", "usr-host-1", "usr-admin-1")).toBe(true);
  });
});
