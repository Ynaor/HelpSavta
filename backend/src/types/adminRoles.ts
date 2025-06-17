/**
 * Admin Role Types for Role-Based Access Control (RBAC)
 */

// Admin role constants - matches the database schema
export const ADMIN_ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  VOLUNTEER: 'VOLUNTEER'
} as const;

// Type for admin roles
export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SYSTEM_ADMIN]: {
    canManageAdmins: true,
    canManageAllRequests: true,
    canManageSlots: true,
    canManageNotifications: true,
    canViewAnalytics: true,
    canManageSystemSettings: true
  },
  [ADMIN_ROLES.VOLUNTEER]: {
    canManageAdmins: false,
    canManageAllRequests: true,
    canManageSlots: false,
    canManageNotifications: false,
    canViewAnalytics: false,
    canManageSystemSettings: false
  }
} as const;

// Helper function to check if user has specific permission
export function hasPermission(
  role: AdminRole, 
  permission: keyof typeof ROLE_PERMISSIONS[typeof ADMIN_ROLES.SYSTEM_ADMIN]
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Helper function to validate admin role
export function isValidAdminRole(role: string): role is AdminRole {
  return Object.values(ADMIN_ROLES).includes(role as AdminRole);
}

// Helper function to get default role
export function getDefaultRole(): AdminRole {
  return ADMIN_ROLES.VOLUNTEER;
}