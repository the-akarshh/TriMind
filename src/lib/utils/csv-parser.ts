import { QuestionInput, TopicEnum, DifficultyEnum } from "../validations/question";
import { Topic, Difficulty } from "@/types";

export interface ParseError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  validQuestions: QuestionInput[];
  errors: ParseError[];
  totalRows: number;
  validCount: number;
  errorCount: number;
}

/**
 * Standard CSV Line Splitter adhering to RFC 4180
 * Correctly handles quotes, commas inside quotes, escaped quotes, and newlines.
 */
export function parseCSVLine(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.length > 0 && currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        currentField = "";
        if (currentRow.length > 0 && currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalize topic string to Topic enum
 */
export function normalizeTopic(raw: string | undefined): Topic | null {
  if (!raw) return null;
  const clean = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (clean === "QUANTITATIVE" || clean === "QUANT" || clean === "MATH") return "QUANTITATIVE";
  if (clean === "LOGICAL" || clean === "LOGIC" || clean === "REASONING") return "LOGICAL";
  if (clean === "VERBAL" || clean === "ENGLISH") return "VERBAL";
  if (
    clean === "DATA_INTERPRETATION" ||
    clean === "DATAINTERPRETATION" ||
    clean === "DI" ||
    clean === "DATA"
  )
    return "DATA_INTERPRETATION";
  if (clean === "GENERAL_REASONING" || clean === "GENERAL") return "GENERAL_REASONING";
  return null;
}

/**
 * Normalize difficulty string to Difficulty enum
 */
export function normalizeDifficulty(raw: string | undefined): Difficulty | null {
  if (!raw) return "MEDIUM";
  const clean = raw.trim().toUpperCase();
  if (clean === "EASY") return "EASY";
  if (clean === "MEDIUM" || clean === "MED") return "MEDIUM";
  if (clean === "HARD") return "HARD";
  if (clean === "EXPERT") return "EXPERT";
  return null;
}

/**
 * Parse and validate CSV data
 */
export function parseQuestionsFromCSV(csvText: string): ParseResult {
  const rows = parseCSVLine(csvText);
  const errors: ParseError[] = [];
  const validQuestions: QuestionInput[] = [];

  if (rows.length === 0) {
    return {
      success: false,
      validQuestions: [],
      errors: [{ row: 0, field: "file", message: "CSV file is empty" }],
      totalRows: 0,
      validCount: 0,
      errorCount: 1,
    };
  }

  // Header row detection
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const hasQuestionHeader = headers.some((h) => h === "question" || h === "text");

  let startIndex = 0;
  let colIndex = {
    question: -1,
    optionA: -1,
    optionB: -1,
    optionC: -1,
    optionD: -1,
    correctAnswer: -1,
    topic: -1,
    difficulty: -1,
    timeLimit: -1,
    explanation: -1,
  };

  if (hasQuestionHeader) {
    startIndex = 1;
    headers.forEach((h, idx) => {
      if (h === "question" || h === "text") colIndex.question = idx;
      else if (h === "optiona" || h === "a" || h === "opt1") colIndex.optionA = idx;
      else if (h === "optionb" || h === "b" || h === "opt2") colIndex.optionB = idx;
      else if (h === "optionc" || h === "c" || h === "opt3") colIndex.optionC = idx;
      else if (h === "optiond" || h === "d" || h === "opt4") colIndex.optionD = idx;
      else if (h === "correctanswer" || h === "correct" || h === "answer")
        colIndex.correctAnswer = idx;
      else if (h === "topic") colIndex.topic = idx;
      else if (h === "difficulty") colIndex.difficulty = idx;
      else if (h === "timelimit" || h === "time" || h === "duration") colIndex.timeLimit = idx;
      else if (h === "explanation" || h === "solution" || h === "reason")
        colIndex.explanation = idx;
    });
  } else {
    // Default column order if no headers
    colIndex = {
      question: 0,
      optionA: 1,
      optionB: 2,
      optionC: 3,
      optionD: 4,
      correctAnswer: 5,
      topic: 6,
      difficulty: 7,
      timeLimit: 8,
      explanation: 9,
    };
  }

  const dataRows = rows.slice(startIndex);

  dataRows.forEach((row, idx) => {
    const rowNum = startIndex + idx + 1;
    const rowErrors: ParseError[] = [];

    const getVal = (colIdx: number) => (colIdx >= 0 && row[colIdx] ? row[colIdx].trim() : "");

    const questionText = getVal(colIndex.question);
    const optA = getVal(colIndex.optionA);
    const optB = getVal(colIndex.optionB);
    const optC = getVal(colIndex.optionC);
    const optD = getVal(colIndex.optionD);
    const correctRaw = getVal(colIndex.correctAnswer);
    const topicRaw = getVal(colIndex.topic);
    const diffRaw = getVal(colIndex.difficulty);
    const timeLimitRaw = getVal(colIndex.timeLimit);
    const explanation = getVal(colIndex.explanation);

    // Validate Question Text
    if (!questionText || questionText.length < 5) {
      rowErrors.push({
        row: rowNum,
        field: "question",
        message: "Question text must be at least 5 characters long.",
      });
    }

    // Validate Options
    const optionsRaw = [optA, optB, optC, optD].filter((opt) => opt.length > 0);
    if (optionsRaw.length < 2) {
      rowErrors.push({
        row: rowNum,
        field: "options",
        message: "At least Option A and Option B must be provided.",
      });
    }

    // Validate Correct Answer
    let correctIdx = -1;
    const upperCorrect = correctRaw.toUpperCase().trim();
    if (upperCorrect === "A" || upperCorrect === "1" || upperCorrect === "OPTION A") {
      correctIdx = 0;
    } else if (upperCorrect === "B" || upperCorrect === "2" || upperCorrect === "OPTION B") {
      correctIdx = 1;
    } else if (upperCorrect === "C" || upperCorrect === "3" || upperCorrect === "OPTION C") {
      correctIdx = 2;
    } else if (upperCorrect === "D" || upperCorrect === "4" || upperCorrect === "OPTION D") {
      correctIdx = 3;
    } else {
      // Check if correct answer matches option text verbatim
      const matchIdx = [optA, optB, optC, optD].findIndex(
        (o) => o.toLowerCase() === correctRaw.toLowerCase() && o.length > 0
      );
      if (matchIdx >= 0) {
        correctIdx = matchIdx;
      } else {
        rowErrors.push({
          row: rowNum,
          field: "correctAnswer",
          message: `Invalid correct answer '${correctRaw}'. Specify A, B, C, D, or match option text.`,
        });
      }
    }

    if (correctIdx >= 0 && ![optA, optB, optC, optD][correctIdx]) {
      rowErrors.push({
        row: rowNum,
        field: "correctAnswer",
        message: `Option ${String.fromCharCode(65 + correctIdx)} marked as correct but is empty.`,
      });
    }

    // Validate Topic
    const topic = normalizeTopic(topicRaw);
    if (!topic) {
      rowErrors.push({
        row: rowNum,
        field: "topic",
        message: `Invalid topic '${topicRaw}'. Allowed: Quantitative, Logical, Verbal, Data Interpretation, General Reasoning.`,
      });
    }

    // Validate Difficulty
    const difficulty = normalizeDifficulty(diffRaw);
    if (!difficulty) {
      rowErrors.push({
        row: rowNum,
        field: "difficulty",
        message: `Invalid difficulty '${diffRaw}'. Allowed: EASY, MEDIUM, HARD, EXPERT.`,
      });
    }

    // Validate Time Limit
    let timeLimit = 30;
    if (timeLimitRaw) {
      const parsed = parseInt(timeLimitRaw, 10);
      if (isNaN(parsed) || parsed < 5 || parsed > 180) {
        rowErrors.push({
          row: rowNum,
          field: "timeLimit",
          message: "Time limit must be an integer between 5 and 180 seconds.",
        });
      } else {
        timeLimit = parsed;
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      const options = [optA, optB, optC, optD]
        .filter((text) => text.length > 0)
        .map((text, oIdx) => ({
          text,
          isCorrect: oIdx === correctIdx,
        }));

      validQuestions.push({
        text: questionText,
        explanation: explanation || null,
        topic: topic!,
        difficulty: difficulty!,
        timeLimit,
        points: 100,
        order: validQuestions.length + 1,
        options,
      });
    }
  });

  return {
    success: errors.length === 0,
    validQuestions,
    errors,
    totalRows: dataRows.length,
    validCount: validQuestions.length,
    errorCount: errors.length,
  };
}

/**
 * Parse questions from JSON array
 */
export function parseQuestionsFromJSON(jsonText: string): ParseResult {
  const errors: ParseError[] = [];
  const validQuestions: QuestionInput[] = [];

  let data: any[];
  try {
    data = JSON.parse(jsonText);
    if (!Array.isArray(data)) {
      return {
        success: false,
        validQuestions: [],
        errors: [{ row: 0, field: "json", message: "JSON must be an array of questions" }],
        totalRows: 0,
        validCount: 0,
        errorCount: 1,
      };
    }
  } catch (e: any) {
    return {
      success: false,
      validQuestions: [],
      errors: [{ row: 0, field: "json", message: `Malformed JSON: ${e.message}` }],
      totalRows: 0,
      validCount: 0,
      errorCount: 1,
    };
  }

  data.forEach((item, idx) => {
    const rowNum = idx + 1;
    const rowErrors: ParseError[] = [];

    const text = item.question || item.text;
    if (!text || typeof text !== "string" || text.trim().length < 5) {
      rowErrors.push({
        row: rowNum,
        field: "question",
        message: "Question text must be at least 5 characters.",
      });
    }

    let options: { text: string; isCorrect: boolean }[] = [];

    if (Array.isArray(item.options)) {
      options = item.options.map((opt: any) => ({
        text: typeof opt === "string" ? opt : opt.text || "",
        isCorrect: typeof opt === "object" ? !!opt.isCorrect : false,
      }));
    } else {
      const optA = item.optionA || item.a || "";
      const optB = item.optionB || item.b || "";
      const optC = item.optionC || item.c || "";
      const optD = item.optionD || item.d || "";
      const correct = String(item.correctAnswer || item.correct || "A").toUpperCase();

      const rawOpts = [optA, optB, optC, optD].filter((o) => o.length > 0);
      options = rawOpts.map((t, oIdx) => ({
        text: t,
        isCorrect:
          (correct === "A" && oIdx === 0) ||
          (correct === "B" && oIdx === 1) ||
          (correct === "C" && oIdx === 2) ||
          (correct === "D" && oIdx === 3) ||
          t.toLowerCase() === correct.toLowerCase(),
      }));
    }

    if (options.length < 2) {
      rowErrors.push({
        row: rowNum,
        field: "options",
        message: "At least 2 options required.",
      });
    }

    if (!options.some((o) => o.isCorrect)) {
      rowErrors.push({
        row: rowNum,
        field: "correctAnswer",
        message: "At least one option must be marked as correct.",
      });
    }

    const topic = normalizeTopic(item.topic);
    if (!topic) {
      rowErrors.push({
        row: rowNum,
        field: "topic",
        message: `Invalid topic: ${item.topic}`,
      });
    }

    const difficulty = normalizeDifficulty(item.difficulty);
    if (!difficulty) {
      rowErrors.push({
        row: rowNum,
        field: "difficulty",
        message: `Invalid difficulty: ${item.difficulty}`,
      });
    }

    let timeLimit = 30;
    if (item.timeLimit) {
      const parsed = parseInt(item.timeLimit, 10);
      if (isNaN(parsed) || parsed < 5 || parsed > 180) {
        rowErrors.push({
          row: rowNum,
          field: "timeLimit",
          message: "timeLimit must be between 5 and 180 seconds.",
        });
      } else {
        timeLimit = parsed;
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validQuestions.push({
        text: text.trim(),
        explanation: item.explanation || null,
        topic: topic!,
        difficulty: difficulty!,
        timeLimit,
        points: item.points ? Number(item.points) : 100,
        imageUrl: item.imageUrl || null,
        tableData: item.tableData
          ? typeof item.tableData === "string"
            ? item.tableData
            : JSON.stringify(item.tableData)
          : null,
        order: validQuestions.length + 1,
        options,
      });
    }
  });

  return {
    success: errors.length === 0,
    validQuestions,
    errors,
    totalRows: data.length,
    validCount: validQuestions.length,
    errorCount: errors.length,
  };
}

/**
 * Generate a downloadable sample CSV template
 */
export function getSampleCSVTemplate(): string {
  return `question,optionA,optionB,optionC,optionD,correctAnswer,topic,difficulty,timeLimit,explanation
"If 3x + 5 = 20, what is the value of 6x - 2?","28","30","26","32","A","QUANTITATIVE","EASY",25,"3x = 15 => x = 5. Then 6(5) - 2 = 28."
"Find the odd one out: Apple, Mango, Carrot, Banana","Apple","Mango","Carrot","Banana","C","LOGICAL","EASY",20,"Carrot is a root vegetable; others are fruits."
"Select the correct synonym for 'Candid'","Deceitful","Secretive","Frank","Timid","C","VERBAL","MEDIUM",30,"Candid means frank, open, and sincere."
"If total production in 2024 is 500 units and export is 40%, how many units were exported?","150","200","250","300","B","DATA_INTERPRETATION","MEDIUM",30,"40% of 500 = 0.40 * 500 = 200."
`;
}
