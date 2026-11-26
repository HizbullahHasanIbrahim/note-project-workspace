/**
 * Helper RBAC (Role-Based Access Control)
 * Berdasarkan Matriks Hak Akses PRD.md §3.4
 */

export type WorkspaceRole = "admin" | "member" | "viewer";

export interface RoleCapabilities {
  canManageWorkspace: boolean;
  canManageMembers: boolean;
  canEditTeamspace: boolean;
  canAccessPrivateSpace: boolean;
  canEditTasks: boolean;
  canComment: boolean;
  canUploadAttachments: boolean;
  canSearch: boolean;
  isReadOnly: boolean;
}

export function getRoleCapabilities(role: WorkspaceRole): RoleCapabilities {
  switch (role) {
    case "admin":
      return {
        canManageWorkspace: true,
        canManageMembers: true,
        canEditTeamspace: true,
        canAccessPrivateSpace: true,
        canEditTasks: true,
        canComment: true,
        canUploadAttachments: true,
        canSearch: true,
        isReadOnly: false,
      };
    case "member":
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canEditTeamspace: true,
        canAccessPrivateSpace: true,
        canEditTasks: true,
        canComment: true,
        canUploadAttachments: true,
        canSearch: true,
        isReadOnly: false,
      };
    case "viewer":
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canEditTeamspace: false,
        canAccessPrivateSpace: false,
        canEditTasks: false,
        canComment: false,
        canUploadAttachments: false,
        canSearch: true,
        isReadOnly: true,
      };
    default:
      return {
        canManageWorkspace: false,
        canManageMembers: false,
        canEditTeamspace: false,
        canAccessPrivateSpace: false,
        canEditTasks: false,
        canComment: false,
        canUploadAttachments: false,
        canSearch: false,
        isReadOnly: true,
      };
  }
}

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return role === "admin";
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return role === "admin";
}

export function canEditTeamspace(role: WorkspaceRole): boolean {
  return role === "admin" || role === "member";
}

export function canAccessPrivateSpace(role: WorkspaceRole): boolean {
  return role === "admin" || role === "member";
}

export function canEditTasks(role: WorkspaceRole): boolean {
  return role === "admin" || role === "member";
}

export function canComment(role: WorkspaceRole): boolean {
  return role === "admin" || role === "member";
}

export function canUploadAttachments(role: WorkspaceRole): boolean {
  return role === "admin" || role === "member";
}

export function canSearch(role: WorkspaceRole): boolean {
  return Boolean(role);
}

export function isReadOnlyRole(role: WorkspaceRole): boolean {
  return role === "viewer";
}
