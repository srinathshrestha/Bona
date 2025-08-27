// Legacy file - redirecting to new MongoDB services
// This file maintains compatibility while the migration is in progress

import {
  UserService,
  ProjectService,
  PermissionService,
  InvitationService,
  AuditService,
  FileService,
  DatabaseUtils,
  RoutePermissionService,
} from "./services";

// Re-export types from models
export type {
  ProjectRole,
  InvitationStatus,
  JoinMethod,
  FileAccessType,
} from "./models/types";

// Re-export services for backward compatibility
export {
  UserService,
  ProjectService,
  PermissionService,
  InvitationService,
  AuditService,
  FileService,
  DatabaseUtils,
  RoutePermissionService,
};
