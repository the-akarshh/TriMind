import { prisma } from "../db";
import { QuestionSetInput, QuestionInput } from "../validations/question";
import { QuestionSetDTO, QuestionDTO, Role, Topic, Difficulty } from "@/types";
import { DEMO_QUESTION_SETS, DEMO_COLLEGE } from "../seed-data";
import { canModifyQuestionSet } from "../auth/rbac";

const isTest = process.env.NODE_ENV === "test";

let memoryQuestionSets: any[] = DEMO_QUESTION_SETS.map((set) => ({
  ...set,
  topic: set.questions[0]?.topic || "QUANTITATIVE",
  difficulty: set.questions[0]?.difficulty || "MEDIUM",
  estimatedDuration: 15,
  tags: "placement,aptitude",
  isArchived: false,
  isPublished: true,
}));

export async function getQuestionSets(filters?: {
  ownerId?: string;
  collegeId?: string;
  visibility?: string;
  topic?: string;
  difficulty?: string;
  isArchived?: boolean;
  search?: string;
}): Promise<QuestionSetDTO[]> {
  if (!isTest) {
    try {
      const where: any = {};
      if (filters?.ownerId) where.ownerId = filters.ownerId;
      if (filters?.collegeId) where.collegeId = filters.collegeId;
      if (filters?.topic && filters.topic !== "ALL") where.topic = filters.topic;
      if (filters?.difficulty && filters.difficulty !== "ALL") where.difficulty = filters.difficulty;
      if (typeof filters?.isArchived === "boolean") where.isArchived = filters.isArchived;

      const sets = await prisma.questionSet.findMany({
        where,
        include: {
          owner: { select: { name: true } },
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (sets.length > 0) {
        let result = sets.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          topic: s.topic as Topic,
          difficulty: s.difficulty as Difficulty,
          estimatedDuration: s.estimatedDuration,
          tags: s.tags,
          isArchived: s.isArchived,
          isPublished: s.isPublished,
          ownerId: s.ownerId,
          ownerName: s.owner.name,
          collegeId: s.collegeId,
          visibility: s.visibility,
          questionCount: s._count.questions,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }));

        if (filters?.search) {
          const query = filters.search.toLowerCase();
          result = result.filter(
            (s) =>
              s.title.toLowerCase().includes(query) ||
              (s.description && s.description.toLowerCase().includes(query)) ||
              (s.tags && s.tags.toLowerCase().includes(query))
          );
        }

        return result;
      }
    } catch {
      // DB offline, fall through to memory
    }
  }

  let filtered = [...memoryQuestionSets];
  if (filters?.ownerId) {
    filtered = filtered.filter((s) => s.ownerId === filters.ownerId);
  }
  if (filters?.topic && filters.topic !== "ALL") {
    filtered = filtered.filter((s) => s.topic === filters.topic);
  }
  if (filters?.difficulty && filters.difficulty !== "ALL") {
    filtered = filtered.filter((s) => s.difficulty === filters.difficulty);
  }
  if (typeof filters?.isArchived === "boolean") {
    filtered = filtered.filter((s) => !!s.isArchived === filters.isArchived);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.tags && s.tags.toLowerCase().includes(q))
    );
  }

  return filtered.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    topic: (s.topic || s.questions?.[0]?.topic || "QUANTITATIVE") as Topic,
    difficulty: (s.difficulty || s.questions?.[0]?.difficulty || "MEDIUM") as Difficulty,
    estimatedDuration: s.estimatedDuration || 15,
    tags: s.tags || null,
    isArchived: !!s.isArchived,
    isPublished: s.isPublished !== false,
    ownerId: s.ownerId,
    ownerName: s.ownerId === "usr-host-1" ? "Prof. Alan Vance" : "Dr. Evelyn Reed",
    collegeId: s.collegeId,
    visibility: s.visibility,
    questionCount: s.questions?.length || 0,
    createdAt: s.createdAt,
    updatedAt: s.createdAt,
  }));
}

export async function getQuestionSetById(id: string): Promise<QuestionSetDTO | null> {
  if (isTest) {
    const s = memoryQuestionSets.find((item) => item.id === id);
    if (!s) return null;
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      topic: s.topic || "QUANTITATIVE",
      difficulty: s.difficulty || "MEDIUM",
      estimatedDuration: s.estimatedDuration || 15,
      tags: s.tags || null,
      isArchived: !!s.isArchived,
      isPublished: s.isPublished !== false,
      ownerId: s.ownerId,
      ownerName: s.ownerId === "usr-host-1" ? "Prof. Alan Vance" : "Dr. Evelyn Reed",
      collegeId: s.collegeId,
      visibility: s.visibility,
      questionCount: s.questions.length,
      createdAt: s.createdAt,
      updatedAt: s.createdAt,
      questions: s.questions.map((q: any) => ({
        ...q,
        questionSetId: s.id,
        imageUrl: q.imageUrl || null,
        tableData: q.tableData || null,
        tags: q.tags || null,
        usageCount: q.usageCount || 0,
        options: q.options.map((opt: any) => ({
          ...opt,
          imageUrl: opt.imageUrl || null,
        })),
      })),
    };
  }

  try {
    const s = await prisma.questionSet.findUnique({
      where: { id },
      include: {
        owner: { select: { name: true } },
        questions: {
          include: { options: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (s) {
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        topic: s.topic as Topic,
        difficulty: s.difficulty as Difficulty,
        estimatedDuration: s.estimatedDuration,
        tags: s.tags,
        isArchived: s.isArchived,
        isPublished: s.isPublished,
        ownerId: s.ownerId,
        ownerName: s.owner.name,
        collegeId: s.collegeId,
        visibility: s.visibility,
        questionCount: s.questions.length,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        questions: s.questions.map((q) => ({
          id: q.id,
          questionSetId: q.questionSetId,
          text: q.text,
          explanation: q.explanation,
          topic: q.topic as Topic,
          difficulty: q.difficulty as Difficulty,
          imageUrl: q.imageUrl,
          tableData: q.tableData,
          tags: q.tags,
          usageCount: q.usageCount,
          timeLimit: q.timeLimit,
          points: q.points,
          order: q.order,
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            imageUrl: opt.imageUrl,
            isCorrect: opt.isCorrect,
          })),
        })),
      };
    }
  } catch {
    // DB offline, fall through to memory
  }

  const s = memoryQuestionSets.find((item) => item.id === id);
  if (!s) return null;

  return {
    id: s.id,
    title: s.title,
    description: s.description,
    topic: s.topic || "QUANTITATIVE",
    difficulty: s.difficulty || "MEDIUM",
    estimatedDuration: s.estimatedDuration || 15,
    tags: s.tags || null,
    isArchived: !!s.isArchived,
    isPublished: s.isPublished !== false,
    ownerId: s.ownerId,
    ownerName: s.ownerId === "usr-host-1" ? "Prof. Alan Vance" : "Dr. Evelyn Reed",
    collegeId: s.collegeId,
    visibility: s.visibility,
    questionCount: s.questions.length,
    createdAt: s.createdAt,
    updatedAt: s.createdAt,
    questions: s.questions.map((q: any) => ({
      ...q,
      questionSetId: s.id,
      imageUrl: q.imageUrl || null,
      tableData: q.tableData || null,
      tags: q.tags || null,
      usageCount: q.usageCount || 0,
      options: q.options.map((opt: any) => ({
        ...opt,
        imageUrl: opt.imageUrl || null,
      })),
    })),
  };
}

export async function createQuestionSet(
  ownerId: string,
  input: QuestionSetInput
): Promise<QuestionSetDTO> {
  const newSetId = `qs-${Date.now()}`;

  if (!isTest) {
    try {
      const created = await prisma.questionSet.create({
        data: {
          id: newSetId,
          title: input.title,
          description: input.description,
          topic: input.topic || "QUANTITATIVE",
          difficulty: input.difficulty || "MEDIUM",
          estimatedDuration: input.estimatedDuration || 15,
          tags: input.tags || null,
          isArchived: input.isArchived || false,
          isPublished: input.isPublished !== false,
          visibility: input.visibility,
          collegeId: input.collegeId || DEMO_COLLEGE.id,
          ownerId,
          questions: {
            create: (input.questions || []).map((q, idx) => ({
              text: q.text,
              explanation: q.explanation,
              topic: q.topic,
              difficulty: q.difficulty,
              imageUrl: q.imageUrl,
              tableData: q.tableData,
              tags: q.tags,
              timeLimit: q.timeLimit,
              points: q.points,
              order: q.order ?? idx + 1,
              options: {
                create: q.options.map((opt) => ({
                  text: opt.text,
                  imageUrl: opt.imageUrl,
                  isCorrect: opt.isCorrect,
                })),
              },
            })),
          },
        },
        include: {
          questions: { include: { options: true } },
        },
      });

      return {
        id: created.id,
        title: created.title,
        description: created.description,
        topic: created.topic as Topic,
        difficulty: created.difficulty as Difficulty,
        estimatedDuration: created.estimatedDuration,
        tags: created.tags,
        isArchived: created.isArchived,
        isPublished: created.isPublished,
        ownerId: created.ownerId,
        collegeId: created.collegeId,
        visibility: created.visibility,
        questionCount: created.questions.length,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        questions: created.questions.map((q) => ({
          id: q.id,
          questionSetId: q.questionSetId,
          text: q.text,
          explanation: q.explanation,
          topic: q.topic as Topic,
          difficulty: q.difficulty as Difficulty,
          imageUrl: q.imageUrl,
          tableData: q.tableData,
          tags: q.tags,
          usageCount: q.usageCount,
          timeLimit: q.timeLimit,
          points: q.points,
          order: q.order,
          options: q.options,
        })),
      };
    } catch {
      // In-memory fallback
    }
  }

  // In-memory implementation
  const memQuestions = (input.questions || []).map((q, idx) => ({
    id: q.id || `q-${Date.now()}-${idx}`,
    text: q.text,
    explanation: q.explanation || "",
    topic: q.topic,
    difficulty: q.difficulty,
    imageUrl: q.imageUrl || null,
    tableData: q.tableData || null,
    tags: q.tags || null,
    usageCount: 0,
    timeLimit: q.timeLimit,
    points: q.points,
    order: q.order ?? idx + 1,
    options: q.options.map((opt, oIdx) => ({
      id: opt.id || `opt-${Date.now()}-${idx}-${oIdx}`,
      text: opt.text,
      imageUrl: opt.imageUrl || null,
      isCorrect: opt.isCorrect,
    })),
  }));

  const memSet = {
    id: newSetId,
    title: input.title,
    description: input.description || "",
    topic: input.topic || "QUANTITATIVE",
    difficulty: input.difficulty || "MEDIUM",
    estimatedDuration: input.estimatedDuration || 15,
    tags: input.tags || null,
    isArchived: !!input.isArchived,
    isPublished: input.isPublished !== false,
    ownerId,
    collegeId: input.collegeId || DEMO_COLLEGE.id,
    visibility: input.visibility,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: memQuestions,
  };

  memoryQuestionSets.unshift(memSet);

  return {
    id: memSet.id,
    title: memSet.title,
    description: memSet.description,
    topic: memSet.topic as Topic,
    difficulty: memSet.difficulty as Difficulty,
    estimatedDuration: memSet.estimatedDuration,
    tags: memSet.tags,
    isArchived: memSet.isArchived,
    isPublished: memSet.isPublished,
    ownerId: memSet.ownerId,
    collegeId: memSet.collegeId,
    visibility: memSet.visibility,
    questionCount: memSet.questions.length,
    createdAt: memSet.createdAt,
    updatedAt: memSet.updatedAt,
    questions: memSet.questions,
  };
}

export async function updateQuestionSet(
  id: string,
  userId: string,
  userRole: Role,
  input: QuestionSetInput
): Promise<QuestionSetDTO> {
  const existing = await getQuestionSetById(id);
  if (!existing) {
    throw new Error("Question set not found.");
  }

  if (!canModifyQuestionSet(userRole, existing.ownerId, userId)) {
    throw new Error("You do not have permission to edit this question set.");
  }

  if (!isTest) {
    try {
      if (input.questions && input.questions.length > 0) {
        await prisma.question.deleteMany({ where: { questionSetId: id } });
      }

      const updated = await prisma.questionSet.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          topic: input.topic,
          difficulty: input.difficulty,
          estimatedDuration: input.estimatedDuration,
          tags: input.tags,
          isArchived: input.isArchived,
          isPublished: input.isPublished,
          visibility: input.visibility,
          questions: input.questions
            ? {
                create: input.questions.map((q, idx) => ({
                  text: q.text,
                  explanation: q.explanation,
                  topic: q.topic,
                  difficulty: q.difficulty,
                  imageUrl: q.imageUrl,
                  tableData: q.tableData,
                  tags: q.tags,
                  timeLimit: q.timeLimit,
                  points: q.points,
                  order: q.order ?? idx + 1,
                  options: {
                    create: q.options.map((opt) => ({
                      text: opt.text,
                      imageUrl: opt.imageUrl,
                      isCorrect: opt.isCorrect,
                    })),
                  },
                })),
              }
            : undefined,
        },
        include: {
          questions: { include: { options: true }, orderBy: { order: "asc" } },
          owner: { select: { name: true } },
        },
      });

      return {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        topic: updated.topic as Topic,
        difficulty: updated.difficulty as Difficulty,
        estimatedDuration: updated.estimatedDuration,
        tags: updated.tags,
        isArchived: updated.isArchived,
        isPublished: updated.isPublished,
        ownerId: updated.ownerId,
        ownerName: updated.owner.name,
        collegeId: updated.collegeId,
        visibility: updated.visibility,
        questionCount: updated.questions.length,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        questions: updated.questions.map((q) => ({
          id: q.id,
          questionSetId: q.questionSetId,
          text: q.text,
          explanation: q.explanation,
          topic: q.topic as Topic,
          difficulty: q.difficulty as Difficulty,
          imageUrl: q.imageUrl,
          tableData: q.tableData,
          tags: q.tags,
          usageCount: q.usageCount,
          timeLimit: q.timeLimit,
          points: q.points,
          order: q.order,
          options: q.options,
        })),
      };
    } catch {
      // In-memory fallback
    }
  }

  // In-memory fallback
  const setIdx = memoryQuestionSets.findIndex((s) => s.id === id);
  if (setIdx >= 0) {
    const current = memoryQuestionSets[setIdx];
    const updatedQuestions = input.questions
      ? input.questions.map((q, idx) => ({
          id: q.id || `q-${Date.now()}-${idx}`,
          text: q.text,
          explanation: q.explanation || "",
          topic: q.topic,
          difficulty: q.difficulty,
          imageUrl: q.imageUrl || null,
          tableData: q.tableData || null,
          tags: q.tags || null,
          usageCount: 0,
          timeLimit: q.timeLimit,
          points: q.points,
          order: q.order ?? idx + 1,
          options: q.options.map((opt, oIdx) => ({
            id: opt.id || `opt-${Date.now()}-${idx}-${oIdx}`,
            text: opt.text,
            imageUrl: opt.imageUrl || null,
            isCorrect: opt.isCorrect,
          })),
        }))
      : current.questions;

    memoryQuestionSets[setIdx] = {
      ...current,
      title: input.title ?? current.title,
      description: input.description ?? current.description,
      topic: input.topic ?? current.topic,
      difficulty: input.difficulty ?? current.difficulty,
      estimatedDuration: input.estimatedDuration ?? current.estimatedDuration,
      tags: input.tags ?? current.tags,
      isArchived: input.isArchived !== undefined ? input.isArchived : current.isArchived,
      isPublished: input.isPublished !== undefined ? input.isPublished : current.isPublished,
      visibility: input.visibility ?? current.visibility,
      updatedAt: new Date().toISOString(),
      questions: updatedQuestions,
    };

    return {
      id: memoryQuestionSets[setIdx].id,
      title: memoryQuestionSets[setIdx].title,
      description: memoryQuestionSets[setIdx].description,
      topic: memoryQuestionSets[setIdx].topic,
      difficulty: memoryQuestionSets[setIdx].difficulty,
      estimatedDuration: memoryQuestionSets[setIdx].estimatedDuration,
      tags: memoryQuestionSets[setIdx].tags,
      isArchived: memoryQuestionSets[setIdx].isArchived,
      isPublished: memoryQuestionSets[setIdx].isPublished,
      ownerId: memoryQuestionSets[setIdx].ownerId,
      ownerName: existing.ownerName,
      collegeId: memoryQuestionSets[setIdx].collegeId,
      visibility: memoryQuestionSets[setIdx].visibility,
      questionCount: updatedQuestions.length,
      createdAt: memoryQuestionSets[setIdx].createdAt,
      updatedAt: memoryQuestionSets[setIdx].updatedAt,
      questions: updatedQuestions,
    };
  }
  throw new Error("Failed to update question set.");
}

export async function archiveQuestionSet(
  id: string,
  userId: string,
  userRole: Role,
  archive = true
): Promise<boolean> {
  const target = await getQuestionSetById(id);
  if (!target) throw new Error("Question set not found.");

  if (!canModifyQuestionSet(userRole, target.ownerId, userId)) {
    throw new Error("You do not have permission to archive this question set.");
  }

  if (!isTest) {
    try {
      await prisma.questionSet.update({
        where: { id },
        data: { isArchived: archive },
      });
    } catch {
      // fallback
    }
  }

  const memSet = memoryQuestionSets.find((s) => s.id === id);
  if (memSet) memSet.isArchived = archive;
  return true;
}

export async function publishQuestionSet(
  id: string,
  userId: string,
  userRole: Role,
  publish = true
): Promise<boolean> {
  const target = await getQuestionSetById(id);
  if (!target) throw new Error("Question set not found.");

  if (!canModifyQuestionSet(userRole, target.ownerId, userId)) {
    throw new Error("You do not have permission to publish this question set.");
  }

  if (!isTest) {
    try {
      await prisma.questionSet.update({
        where: { id },
        data: { isPublished: publish },
      });
    } catch {
      // fallback
    }
  }

  const memSet = memoryQuestionSets.find((s) => s.id === id);
  if (memSet) memSet.isPublished = publish;
  return true;
}

export async function reorderQuestions(
  setId: string,
  userId: string,
  userRole: Role,
  orderedQuestionIds: string[]
): Promise<boolean> {
  const target = await getQuestionSetById(setId);
  if (!target) throw new Error("Question set not found.");

  if (!canModifyQuestionSet(userRole, target.ownerId, userId)) {
    throw new Error("You do not have permission to reorder questions in this set.");
  }

  if (!isTest) {
    try {
      await prisma.$transaction(
        orderedQuestionIds.map((qId, index) =>
          prisma.question.update({
            where: { id: qId },
            data: { order: index + 1 },
          })
        )
      );
    } catch {
      // fallback to memory
    }
  }

  const memSet = memoryQuestionSets.find((s) => s.id === setId);
  if (memSet && memSet.questions) {
    const qMap = new Map<string, any>(memSet.questions.map((q: any) => [q.id, q]));
    const reordered: any[] = [];
    orderedQuestionIds.forEach((qId, index) => {
      const item = qMap.get(qId);
      if (item) {
        item.order = index + 1;
        reordered.push(item);
      }
    });
    // add any remaining questions not specified
    memSet.questions.forEach((q: any) => {
      if (!orderedQuestionIds.includes(q.id)) {
        reordered.push(q);
      }
    });
    memSet.questions = reordered;
  }

  return true;
}

export async function searchQuestionLibrary(filters?: {
  topic?: string;
  difficulty?: string;
  tags?: string;
  search?: string;
}): Promise<QuestionDTO[]> {
  if (!isTest) {
    try {
      const where: any = {};
      if (filters?.topic && filters.topic !== "ALL") where.topic = filters.topic;
      if (filters?.difficulty && filters.difficulty !== "ALL") where.difficulty = filters.difficulty;

      const questions = await prisma.question.findMany({
        where,
        include: {
          options: true,
          questionSet: { select: { title: true, owner: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (questions.length > 0) {
        let result = questions.map((q) => ({
          id: q.id,
          questionSetId: q.questionSetId,
          text: q.text,
          explanation: q.explanation,
          topic: q.topic as Topic,
          difficulty: q.difficulty as Difficulty,
          imageUrl: q.imageUrl,
          tableData: q.tableData,
          tags: q.tags,
          usageCount: q.usageCount,
          timeLimit: q.timeLimit,
          points: q.points,
          order: q.order,
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            imageUrl: opt.imageUrl,
            isCorrect: opt.isCorrect,
          })),
        }));

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(
            (item) =>
              item.text.toLowerCase().includes(q) ||
              (item.tags && item.tags.toLowerCase().includes(q)) ||
              (item.explanation && item.explanation.toLowerCase().includes(q))
          );
        }

        return result;
      }
    } catch {
      // fallback
    }
  }

  const allQuestions: QuestionDTO[] = [];
  memoryQuestionSets.forEach((set) => {
    (set.questions || []).forEach((q: any) => {
      allQuestions.push({
        id: q.id,
        questionSetId: set.id,
        text: q.text,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        tableData: q.tableData,
        tags: q.tags,
        usageCount: q.usageCount || 0,
        timeLimit: q.timeLimit,
        points: q.points,
        order: q.order,
        options: q.options,
      });
    });
  });

  let filtered = allQuestions;
  if (filters?.topic && filters.topic !== "ALL") {
    filtered = filtered.filter((q) => q.topic === filters.topic);
  }
  if (filters?.difficulty && filters.difficulty !== "ALL") {
    filtered = filtered.filter((q) => q.difficulty === filters.difficulty);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        (item.tags && item.tags.toLowerCase().includes(q)) ||
        (item.explanation && item.explanation.toLowerCase().includes(q))
    );
  }

  return filtered;
}

export async function duplicateQuestionSet(
  id: string,
  userId: string
): Promise<QuestionSetDTO> {
  const source = await getQuestionSetById(id);
  if (!source) {
    throw new Error("Question set not found.");
  }

  const copyInput: QuestionSetInput = {
    title: `${source.title} (Copy)`,
    description: source.description,
    topic: source.topic || "QUANTITATIVE",
    difficulty: source.difficulty || "MEDIUM",
    estimatedDuration: source.estimatedDuration || 15,
    tags: source.tags,
    isArchived: false,
    isPublished: true,
    visibility: "PRIVATE",
    collegeId: source.collegeId,
    questions: (source.questions || []).map((q, idx) => ({
      text: q.text,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
      imageUrl: q.imageUrl,
      tableData: q.tableData,
      tags: q.tags,
      timeLimit: q.timeLimit,
      points: q.points,
      order: idx + 1,
      options: q.options.map((opt) => ({
        text: opt.text,
        imageUrl: opt.imageUrl,
        isCorrect: opt.isCorrect,
      })),
    })),
  };

  return createQuestionSet(userId, copyInput);
}

export async function deleteQuestionSet(
  id: string,
  userId: string,
  userRole: Role
): Promise<boolean> {
  const target = await getQuestionSetById(id);
  if (!target) {
    throw new Error("Question set not found.");
  }

  if (!canModifyQuestionSet(userRole, target.ownerId, userId)) {
    throw new Error("You do not have permission to delete this question set.");
  }

  if (!isTest) {
    try {
      await prisma.questionSet.delete({ where: { id } });
    } catch {
      // fallback
    }
  }

  memoryQuestionSets = memoryQuestionSets.filter((s) => s.id !== id);
  return true;
}
