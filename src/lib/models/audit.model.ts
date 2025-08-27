import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import {
  ObjectIdSchema,
  FileAccessTypeSchema,
  ProjectRoleSchema,
} from "./types";

// Zod validation schema for FileAccess
export const FileAccessValidationSchema = z.object({
  fileId: ObjectIdSchema,
  userId: ObjectIdSchema,
  accessType: FileAccessTypeSchema,
  ipAddress: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
      "Invalid IP address"
    )
    .optional(),
  userAgent: z.string().optional(),
});

// Zod validation schema for RoleChangeLog
export const RoleChangeLogValidationSchema = z.object({
  userId: ObjectIdSchema,
  projectId: ObjectIdSchema,
  changedById: ObjectIdSchema,
  oldRole: ProjectRoleSchema,
  newRole: ProjectRoleSchema,
  reason: z.string().max(500).optional(),
});

// TypeScript interfaces
export interface IFileAccess extends Document {
  _id: mongoose.Types.ObjectId;
  fileId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  accessType: "VIEW" | "DOWNLOAD" | "UPLOAD" | "DELETE";
  ipAddress?: string;
  userAgent?: string;
  accessedAt: Date;
}

export interface IRoleChangeLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  changedById: mongoose.Types.ObjectId;
  oldRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  newRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  reason?: string;
  changedAt: Date;
}

// FileAccess Schema
const FileAccessSchema = new Schema<IFileAccess>(
  {
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "File",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accessType: {
      type: String,
      enum: ["VIEW", "DOWNLOAD", "UPLOAD", "DELETE"],
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },
    accessedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "accessedAt", updatedAt: false },
    collection: "fileaccesses",
  }
);

// Indexes for FileAccess
FileAccessSchema.index({ fileId: 1, accessedAt: -1 });
FileAccessSchema.index({ userId: 1, accessedAt: -1 });
FileAccessSchema.index({ accessType: 1, accessedAt: -1 });
FileAccessSchema.index({ ipAddress: 1, accessedAt: -1 });

// Instance methods for FileAccess
FileAccessSchema.methods.toJSON = function () {
  const accessObject = this.toObject();
  delete accessObject.__v;
  return accessObject;
};

// Static methods for FileAccess
FileAccessSchema.statics.findByFile = function (
  fileId: string,
  options: any = {}
) {
  const query = this.find({ fileId });

  if (options.accessType) {
    query.where({ accessType: options.accessType });
  }

  if (options.userId) {
    query.where({ userId: options.userId });
  }

  return query
    .populate("userId", "clerkId username displayName avatar")
    .sort({ accessedAt: -1 })
    .limit(options.limit || 50);
};

FileAccessSchema.statics.findByUser = function (
  userId: string,
  options: any = {}
) {
  const query = this.find({ userId });

  if (options.accessType) {
    query.where({ accessType: options.accessType });
  }

  if (options.projectId) {
    // We need to join with File collection to filter by project
    query.populate({
      path: "fileId",
      match: { projectId: options.projectId },
      select: "filename originalName projectId",
    });
  } else {
    query.populate("fileId", "filename originalName projectId");
  }

  return query.sort({ accessedAt: -1 }).limit(options.limit || 50);
};

FileAccessSchema.statics.getAccessStats = function (
  fileId?: string,
  projectId?: string
) {
  let matchStage: any = {};

  if (fileId) {
    matchStage.fileId = new mongoose.Types.ObjectId(fileId);
  } else if (projectId) {
    // Need to lookup files first to filter by project
    return this.aggregate([
      {
        $lookup: {
          from: "files",
          localField: "fileId",
          foreignField: "_id",
          as: "file",
        },
      },
      { $unwind: "$file" },
      { $match: { "file.projectId": new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: "$accessType",
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        },
      },
      {
        $addFields: {
          uniqueUserCount: { $size: "$uniqueUsers" },
        },
      },
      {
        $project: {
          uniqueUsers: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$accessType",
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
    {
      $addFields: {
        uniqueUserCount: { $size: "$uniqueUsers" },
      },
    },
    {
      $project: {
        uniqueUsers: 0,
      },
    },
    { $sort: { count: -1 } },
  ]);
};

FileAccessSchema.statics.getAccessActivityByDay = function (
  projectId: string,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $lookup: {
        from: "files",
        localField: "fileId",
        foreignField: "_id",
        as: "file",
      },
    },
    { $unwind: "$file" },
    {
      $match: {
        "file.projectId": new mongoose.Types.ObjectId(projectId),
        accessedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$accessedAt" } },
          accessType: "$accessType",
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
    {
      $addFields: {
        uniqueUserCount: { $size: "$uniqueUsers" },
      },
    },
    {
      $project: {
        uniqueUsers: 0,
      },
    },
    { $sort: { "_id.date": 1, "_id.accessType": 1 } },
  ]);
};

// RoleChangeLog Schema
const RoleChangeLogSchema = new Schema<IRoleChangeLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    changedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    oldRole: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      required: true,
    },
    newRole: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      required: true,
    },
    reason: {
      type: String,
      maxlength: 500,
    },
    changedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "changedAt", updatedAt: false },
    collection: "rolechangelogs",
  }
);

// Indexes for RoleChangeLog
RoleChangeLogSchema.index({ projectId: 1, changedAt: -1 });
RoleChangeLogSchema.index({ userId: 1, changedAt: -1 });
RoleChangeLogSchema.index({ changedById: 1, changedAt: -1 });

// Instance methods for RoleChangeLog
RoleChangeLogSchema.methods.toJSON = function () {
  const logObject = this.toObject();
  delete logObject.__v;
  return logObject;
};

// Static methods for RoleChangeLog
RoleChangeLogSchema.statics.findByProject = function (
  projectId: string,
  options: any = {}
) {
  const query = this.find({ projectId });

  if (options.userId) {
    query.where({ userId: options.userId });
  }

  if (options.changedById) {
    query.where({ changedById: options.changedById });
  }

  return query
    .populate("userId", "clerkId username displayName avatar")
    .populate("changedById", "clerkId username displayName avatar")
    .sort({ changedAt: -1 })
    .limit(options.limit || 50);
};

RoleChangeLogSchema.statics.findByUser = function (
  userId: string,
  options: any = {}
) {
  const query = this.find({ userId });

  if (options.projectId) {
    query.where({ projectId: options.projectId });
  }

  return query
    .populate("projectId", "name description")
    .populate("changedById", "clerkId username displayName avatar")
    .sort({ changedAt: -1 })
    .limit(options.limit || 50);
};

RoleChangeLogSchema.statics.getRoleChangeStats = function (projectId: string) {
  return this.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: {
          oldRole: "$oldRole",
          newRole: "$newRole",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Pre-save middleware for RoleChangeLog
RoleChangeLogSchema.pre("save", function (next) {
  // Validate that old role and new role are different
  if (this.oldRole === this.newRole) {
    return next(new Error("Old role and new role cannot be the same"));
  }
  next();
});

// Create and export models
export interface IFileAccessModel extends Model<IFileAccess> {
  findByFile(fileId: string, options?: any): Promise<IFileAccess[]>;
  findByUser(userId: string, options?: any): Promise<IFileAccess[]>;
  getAccessStats(fileId?: string, projectId?: string): Promise<any[]>;
  getAccessActivityByDay(projectId: string, days?: number): Promise<any[]>;
}

export interface IRoleChangeLogModel extends Model<IRoleChangeLog> {
  findByProject(projectId: string, options?: any): Promise<IRoleChangeLog[]>;
  findByUser(userId: string, options?: any): Promise<IRoleChangeLog[]>;
  getRoleChangeStats(projectId: string): Promise<any[]>;
}

export const FileAccess =
  (mongoose.models.FileAccess as IFileAccessModel) ||
  mongoose.model<IFileAccess, IFileAccessModel>("FileAccess", FileAccessSchema);

export const RoleChangeLog =
  (mongoose.models.RoleChangeLog as IRoleChangeLogModel) ||
  mongoose.model<IRoleChangeLog, IRoleChangeLogModel>(
    "RoleChangeLog",
    RoleChangeLogSchema
  );

// Export validation functions
export const validateFileAccess = (data: any) => {
  return FileAccessValidationSchema.parse(data);
};

export const validateRoleChangeLog = (data: any) => {
  return RoleChangeLogValidationSchema.parse(data);
};
