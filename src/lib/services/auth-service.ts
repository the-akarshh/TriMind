import { prisma } from "../db";
import { hashPassword, verifyPassword } from "../auth/password";
import { RegisterInput, LoginInput } from "../validations/auth";
import { SafeUser, Role } from "@/types";
import { DEMO_USERS, DEMO_COLLEGE } from "../seed-data";

interface MemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  collegeId?: string | null;
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __arena_memoryUsers: MemoryUser[] | undefined;
}

// In-memory runtime cache for environments without a live PostgreSQL instance
const memoryUsers: MemoryUser[] = globalThis.__arena_memoryUsers ?? [...DEMO_USERS];
if (!globalThis.__arena_memoryUsers) {
  globalThis.__arena_memoryUsers = memoryUsers;
}

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existingInMemory = memoryUsers.find(
    (u) => u.email.toLowerCase() === input.email.toLowerCase()
  );
  if (existingInMemory) {
    throw new Error("A user with this email address already exists.");
  }

  const hashedPassword = await hashPassword(input.password);

  try {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new Error("A user with this email address already exists.");
    }

    const created = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: input.role,
        collegeId: input.collegeId || DEMO_COLLEGE.id,
      },
      include: { college: true },
    });

    const safeUser: SafeUser = {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      avatar: created.avatar,
      collegeId: created.collegeId,
      collegeName: created.college?.name || DEMO_COLLEGE.name,
      createdAt: created.createdAt.toISOString(),
    };

    memoryUsers.push({
      id: created.id,
      name: created.name,
      email: created.email,
      passwordHash: hashedPassword,
      role: created.role,
      collegeId: created.collegeId,
      createdAt: created.createdAt.toISOString(),
    });

    return safeUser;
  } catch (err: any) {
    // If DB is offline, fall back to memory
    if (err.message?.includes("already exists")) {
      throw err;
    }
    const newUser = {
      id: `usr-${Date.now()}`,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: hashedPassword,
      role: input.role,
      collegeId: input.collegeId || DEMO_COLLEGE.id,
      createdAt: new Date().toISOString(),
    };
    memoryUsers.push(newUser);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      collegeId: newUser.collegeId,
      collegeName: DEMO_COLLEGE.name,
      createdAt: newUser.createdAt,
    };
  }
}

export async function loginUser(input: LoginInput): Promise<SafeUser> {
  const normalizedEmail = (input.email || "").toLowerCase().trim();
  let user: any = null;

  try {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { college: true },
    });
  } catch {
    // DB offline, fallback to memory
    user = null;
  }

  if (!user) {
    user = memoryUsers.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
  }

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || null,
    collegeId: user.collegeId || null,
    collegeName: user.college?.name || DEMO_COLLEGE.name,
    createdAt: typeof user.createdAt === "string" ? user.createdAt : user.createdAt.toISOString(),
  };
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { college: true },
    });
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        collegeId: user.collegeId,
        collegeName: user.college?.name || DEMO_COLLEGE.name,
        createdAt: user.createdAt.toISOString(),
      };
    }
  } catch {
    // fallback
  }

  const memUser = memoryUsers.find((u) => u.id === id);
  if (!memUser) return null;

  return {
    id: memUser.id,
    name: memUser.name,
    email: memUser.email,
    role: memUser.role,
    collegeId: memUser.collegeId,
    collegeName: DEMO_COLLEGE.name,
    createdAt: memUser.createdAt,
  };
}

export function getAllMemoryUsers(): SafeUser[] {
  return memoryUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    collegeId: u.collegeId,
    collegeName: DEMO_COLLEGE.name,
    createdAt: u.createdAt,
  }));
}
