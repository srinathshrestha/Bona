// Shared types and enums for MongoDB models
import { z } from "zod";

// Enums with Zod validation
export const ProjectRoleSchema = z.enum(["OWNER", "MEMBER", "VIEWER"]);
export type ProjectRole = z.infer<typeof ProjectRoleSchema>;

export const InvitationStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const JoinMethodSchema = z.enum([
  "INVITE_LINK",
  "DIRECT_INVITE",
  "ADMIN_ADDED",
]);
export type JoinMethod = z.infer<typeof JoinMethodSchema>;

export const FileAccessTypeSchema = z.enum([
  "VIEW",
  "DOWNLOAD",
  "UPLOAD",
  "DELETE",
]);
export type FileAccessType = z.infer<typeof FileAccessTypeSchema>;

// Common field schemas
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
export const EmailSchema = z.string().email("Invalid email format");
export const DateSchema = z.date();

// User settings schema
export const UserSettingsSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    notifications: z
      .object({
        email: z.boolean().default(true),
        push: z.boolean().default(true),
        projectUpdates: z.boolean().default(true),
        invitations: z.boolean().default(true),
      })
      .optional(),
    preferences: z
      .object({
        language: z.string().default("en"),
        timezone: z.string().default("UTC"),
      })
      .optional(),
    // Persist gradient chosen on profile page
    profileGradient: z.string().max(500).optional(),
  })
  .optional();

// Project settings schema
export const ProjectSettingsSchema = z
  .object({
    allowGuestUploads: z.boolean().default(false),
    maxFileSize: z
      .number()
      .positive()
      .default(100 * 1024 * 1024), // 100MB
    allowedFileTypes: z.array(z.string()).optional(),
    autoDeleteFiles: z.boolean().default(false),
    autoDeleteDays: z.number().positive().optional(),
  })
  .optional();

// File metadata schema
export const FileMetadataSchema = z
  .object({
    dimensions: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
      })
      .optional(),
    duration: z.number().positive().optional(), // for video/audio files in seconds
    encoding: z.string().optional(),
    compression: z.string().optional(),
    uploadedVia: z.string().default("s3-direct"),
    s3ETag: z.string().optional(),
    thumbnailKey: z.string().optional(), // S3 key for thumbnail
  })
  .optional();

// Request info schema for audit logging
export const RequestInfoSchema = z.object({
  ipAddress: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      "Invalid IP address"
    )
    .optional(),
  userAgent: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

// Common validation schemas
export const PaginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  offset: z.number().nonnegative().optional(),
});

export const SortSchema = z.object({
  field: z.string(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Export types for pagination and sorting
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type RequestInfo = z.infer<typeof RequestInfoSchema>;
export type PaginationOptions = z.infer<typeof PaginationSchema>;
export type SortOptions = z.infer<typeof SortSchema>;
