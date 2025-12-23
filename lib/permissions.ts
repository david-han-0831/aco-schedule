import { UserRole } from "./firestore";

/**
 * 접근 권한 체크 유틸리티
 */

export const canAccessMembers = (role: UserRole | null): boolean => {
  if (!role) return false;
  return role === "SuperAdmin" || role === "Admin";
};

export const canAccessSchedules = (role: UserRole | null): boolean => {
  // 모든 사용자가 접근 가능
  return role !== null;
};

export const canAccessDashboard = (role: UserRole | null): boolean => {
  // 모든 사용자가 접근 가능
  return role !== null;
};

export const canManageRoles = (role: UserRole | null): boolean => {
  // SuperAdmin만 역할 관리 가능
  return role === "SuperAdmin";
};

