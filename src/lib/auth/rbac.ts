import { Role } from "@/types";

export const ROLE_HIERARCHY: Record<Role, number> = {
  PLAYER: 1,
  HOST: 2,
  FACULTY: 3,
  COLLEGE_ADMIN: 4,
  SUPER_ADMIN: 5,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export function canCreateQuestionSets(role: Role): boolean {
  return ["HOST", "FACULTY", "COLLEGE_ADMIN", "SUPER_ADMIN"].includes(role);
}

export function canCreateRooms(role: Role): boolean {
  return ["HOST", "FACULTY", "COLLEGE_ADMIN", "SUPER_ADMIN"].includes(role);
}

export function canAccessFacultyAnalytics(role: Role): boolean {
  return ["FACULTY", "COLLEGE_ADMIN", "SUPER_ADMIN"].includes(role);
}

export const canViewAnalytics = canAccessFacultyAnalytics;

export function canManageCollege(role: Role): boolean {
  return ["COLLEGE_ADMIN", "SUPER_ADMIN"].includes(role);
}

export function canAccessSuperAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN";
}

export function canModifyQuestionSet(
  role: Role,
  resourceOwnerId: string,
  currentUserId: string
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (["HOST", "FACULTY", "COLLEGE_ADMIN"].includes(role) && resourceOwnerId === currentUserId) {
    return true;
  }
  return false;
}
