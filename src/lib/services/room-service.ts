import { prisma } from "../db";
import { generateRoomCode } from "../engine/room-code";
import { RoomDTO, RoomPlayerDTO, RoomStatus } from "@/types";
import { getQuestionSetById } from "./question-service";
import { DEMO_COLLEGE } from "../seed-data";
import { gameEngine } from "../engine/multiplayer-engine";

interface MemoryRoom extends RoomDTO {
  players: RoomPlayerDTO[];
}

const memoryRooms = new Map<string, MemoryRoom>();
const isTest = process.env.NODE_ENV === "test";

export async function createRoom(
  hostId: string,
  questionSetId: string,
  maxPlayers = 50,
  collegeId?: string | null,
  options?: {
    gameMode?: any;
    timePerQuestion?: number | null;
    questionCount?: number | null;
  }
): Promise<RoomDTO> {
  const qSet = await getQuestionSetById(questionSetId);
  if (!qSet) {
    throw new Error("Question set not found.");
  }

  // Generate unique collision-resistant code
  let code = "";
  let attempts = 0;
  while (attempts < 10) {
    const candidate = generateRoomCode(6);
    if (!memoryRooms.has(candidate)) {
      code = candidate;
      break;
    }
    attempts++;
  }

  if (!code) {
    code = generateRoomCode(6);
  }

  const roomId = `room-${Date.now()}`;
  const roomData: RoomDTO = {
    id: roomId,
    code,
    hostId,
    collegeId: collegeId || DEMO_COLLEGE.id,
    questionSetId,
    questionSetTitle: qSet.title,
    gameMode: options?.gameMode || "CLASSIC",
    timePerQuestion: options?.timePerQuestion || null,
    questionCount: options?.questionCount || null,
    status: "LOBBY",
    maxPlayers,
    currentQuestionIndex: 0,
    playerCount: 0,
    createdAt: new Date().toISOString(),
  };

  memoryRooms.set(code, {
    ...roomData,
    players: [],
  });

  // Initialize in multiplayer engine
  try {
    await gameEngine.initRoom(code, "", hostId, questionSetId, maxPlayers);
  } catch (e) {
    // Engine already initialized or fallback
  }

  if (!isTest) {
    try {
      await prisma.room.create({
        data: {
          id: roomId,
          code,
          hostId,
          questionSetId,
          collegeId: collegeId || DEMO_COLLEGE.id,
          gameMode: roomData.gameMode as any,
          timePerQuestion: roomData.timePerQuestion,
          questionCount: roomData.questionCount,
          maxPlayers,
          status: "LOBBY",
        },
      });
    } catch {
      // fallback to memory
    }
  }

  return roomData;
}

export async function getRoomByCode(code: string): Promise<RoomDTO | null> {
  const upperCode = code.toUpperCase().trim();

  if (!isTest) {
    try {
      const dbRoom = await prisma.room.findUnique({
        where: { code: upperCode },
        include: {
          questionSet: { select: { title: true } },
          _count: { select: { players: true } },
        },
      });

      if (dbRoom) {
        return {
          id: dbRoom.id,
          code: dbRoom.code,
          hostId: dbRoom.hostId,
          collegeId: dbRoom.collegeId,
          questionSetId: dbRoom.questionSetId,
          questionSetTitle: dbRoom.questionSet.title,
          status: dbRoom.status as RoomStatus,
          maxPlayers: dbRoom.maxPlayers,
          currentQuestionIndex: dbRoom.currentQuestionIndex,
          playerCount: dbRoom._count.players,
          createdAt: dbRoom.createdAt.toISOString(),
        };
      }
    } catch {
      // DB offline, fall through
    }
  }

  const memRoom = memoryRooms.get(upperCode);
  if (!memRoom) return null;

  return {
    ...memRoom,
    playerCount: memRoom.players.length,
  };
}

export async function joinRoom(
  code: string,
  displayName: string,
  userId?: string | null
): Promise<RoomPlayerDTO> {
  const upperCode = code.toUpperCase().trim();
  const room = await getRoomByCode(upperCode);

  if (!room) {
    throw new Error("Room not found. Please check your room code.");
  }

  if (room.status === "FINISHED") {
    throw new Error("This competition room has already ended.");
  }

  const existingPlayers = await getRoomPlayers(upperCode);
  if (existingPlayers.length >= room.maxPlayers) {
    throw new Error(`Room is full (Maximum capacity: ${room.maxPlayers} players).`);
  }

  // Check duplicate displayName in active room
  const duplicateName = existingPlayers.find(
    (p) => p.displayName.toLowerCase() === displayName.trim().toLowerCase()
  );
  if (duplicateName) {
    throw new Error("Display name is already taken in this room. Please choose another.");
  }

  const newPlayer: RoomPlayerDTO = {
    id: `ply-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    roomId: room.id,
    userId: userId || null,
    displayName: displayName.trim(),
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    answeredQuestions: 0,
    totalAnswerTime: 0,
    connected: true,
    joinedAt: new Date().toISOString(),
  };

  const memRoom = memoryRooms.get(upperCode);
  if (memRoom) {
    memRoom.players.push(newPlayer);
  } else {
    memoryRooms.set(upperCode, {
      ...room,
      players: [newPlayer],
    });
  }

  try {
    await prisma.roomPlayer.create({
      data: {
        id: newPlayer.id,
        roomId: room.id,
        userId: newPlayer.userId,
        displayName: newPlayer.displayName,
        score: 0,
      },
    });
  } catch {
    // fallback
  }

  return newPlayer;
}

export async function getRoomPlayers(code: string): Promise<RoomPlayerDTO[]> {
  const upperCode = code.toUpperCase().trim();

  try {
    const dbPlayers = await prisma.roomPlayer.findMany({
      where: { room: { code: upperCode } },
      orderBy: { score: "desc" },
    });
    if (dbPlayers.length > 0) {
      return dbPlayers.map((p) => ({
        id: p.id,
        roomId: p.roomId,
        userId: p.userId,
        displayName: p.displayName,
        score: p.score,
        correctAnswers: p.correctAnswers,
        wrongAnswers: p.wrongAnswers,
        answeredQuestions: p.answeredQuestions,
        totalAnswerTime: p.totalAnswerTime,
        connected: p.connected,
        joinedAt: p.joinedAt.toISOString(),
      }));
    }
  } catch {
    // fallback
  }

  const memRoom = memoryRooms.get(upperCode);
  return memRoom ? [...memRoom.players] : [];
}

export async function updateRoomStatus(
  code: string,
  newStatus: RoomStatus,
  hostId: string
): Promise<RoomDTO> {
  const upperCode = code.toUpperCase().trim();
  const room = await getRoomByCode(upperCode);
  if (!room) throw new Error("Room not found.");

  if (room.hostId !== hostId) {
    throw new Error("Unauthorized: Only the host can modify room state.");
  }

  const memRoom = memoryRooms.get(upperCode);
  if (memRoom) {
    memRoom.status = newStatus;
  }

  try {
    await prisma.room.update({
      where: { code: upperCode },
      data: { status: newStatus },
    });
  } catch {
    // fallback
  }

  return { ...room, status: newStatus };
}
