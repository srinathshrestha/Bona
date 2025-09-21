import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import {
  ObjectIdSchema,
  InvitationStatusSchema,
  JoinMethodSchema,
} from "./types";

// Zod validation schema for ProjectInviteLink
export const ProjectInviteLinkValidationSchema = z.object({
  projectId: ObjectIdSchema,
  createdById: ObjectIdSchema,
  secretToken: z.string().min(1),
  isActive: z.boolean().default(true),
  maxUses: z.number().positive().optional(),
  currentUses: z.number().nonnegative().default(0),
  expiresAt: z.date().optional(),
});

// Zod validation schema for MemberJoinLog
export const MemberJoinLogValidationSchema = z.object({
  userId: ObjectIdSchema,
  projectId: ObjectIdSchema,
  joinMethod: JoinMethodSchema,
  inviteToken: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Zod validation schema for Legacy Invitation
export const LegacyInvitationValidationSchema = z.object({
  email: z.string().email(),
  projectId: ObjectIdSchema,
  inviterId: ObjectIdSchema,
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
  status: InvitationStatusSchema.default("PENDING"),
  token: z.string().min(1),
  expiresAt: z.date(),
});

// TypeScript interfaces
export interface IProjectInviteLink extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  createdById: mongoose.Types.ObjectId;
  secretToken: string;
  isActive: boolean;
  maxUses?: number;
  currentUses: number;
  expiresAt?: Date;
  role: "MEMBER" | "VIEWER"; // Role that users will get when joining via this link
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isExpired(): boolean;
  isUsageLimitReached(): boolean;
  canBeUsed(): boolean;
}

export interface IMemberJoinLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  joinMethod: "INVITE_LINK" | "DIRECT_INVITE" | "ADMIN_ADDED";
  inviteToken?: string;
  ipAddress?: string;
  userAgent?: string;
  joinedAt: Date;
}

export interface ILegacyInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  projectId: mongoose.Types.ObjectId;
  inviterId: mongoose.Types.ObjectId;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ProjectInviteLink Schema
const ProjectInviteLinkSchema = new Schema<IProjectInviteLink>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    secretToken: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxUses: {
      type: Number,
      min: 1,
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
    },
    role: {
      type: String,
      enum: ["MEMBER", "VIEWER"],
      default: "MEMBER",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "projectinvitelinks",
  }
);

// Indexes - only add non-duplicate ones
ProjectInviteLinkSchema.index({ projectId: 1 });
ProjectInviteLinkSchema.index({ createdById: 1 });
ProjectInviteLinkSchema.index({ isActive: 1 });
ProjectInviteLinkSchema.index({ projectId: 1, isActive: 1 });
ProjectInviteLinkSchema.index({ expiresAt: 1 }, { sparse: true });

// Instance methods for ProjectInviteLink
ProjectInviteLinkSchema.methods.isExpired = function (): boolean {
  return this.expiresAt && this.expiresAt < new Date();
};

ProjectInviteLinkSchema.methods.isUsageLimitReached = function (): boolean {
  return this.maxUses && this.currentUses >= this.maxUses;
};

ProjectInviteLinkSchema.methods.canBeUsed = function (): boolean {
  return this.isActive && !this.isExpired() && !this.isUsageLimitReached();
};

// Static methods for ProjectInviteLink
ProjectInviteLinkSchema.statics.findActiveByProject = function (
  projectId: string
) {
  return this.findOne({
    projectId,
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  });
};

ProjectInviteLinkSchema.statics.findByToken = function (token: string) {
  return this.findOne({ secretToken: token })
    .populate({
      path: "projectId",
      select: "name description ownerId",
      populate: {
        path: "ownerId",
        select: "username avatar",
      },
    })
    .populate("createdById", "username avatar");
};

// MemberJoinLog Schema
const MemberJoinLogSchema = new Schema<IMemberJoinLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    joinMethod: {
      type: String,
      enum: ["INVITE_LINK", "DIRECT_INVITE", "ADMIN_ADDED"],
      required: true,
    },
    inviteToken: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "joinedAt", updatedAt: false },
    collection: "memberjoinlogs",
  }
);

// Indexes for MemberJoinLog
MemberJoinLogSchema.index({ projectId: 1, joinedAt: -1 });
MemberJoinLogSchema.index({ userId: 1, joinedAt: -1 });
MemberJoinLogSchema.index({ inviteToken: 1 }, { sparse: true });
MemberJoinLogSchema.index({ joinMethod: 1 });
MemberJoinLogSchema.index({ joinedAt: -1 });

// Static methods for MemberJoinLog
MemberJoinLogSchema.statics.findByProject = function (
  projectId: string,
  limit = 50
) {
  return this.find({ projectId })
    .populate("userId", "clerkId username avatar")
    .sort({ joinedAt: -1 })
    .limit(limit);
};

MemberJoinLogSchema.statics.getJoinStats = function (projectId: string) {
  return this.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: "$joinMethod",
        count: { $sum: 1 },
      },
    },
  ]);
};

// Legacy Invitation Schema (for backward compatibility)
const LegacyInvitationSchema = new Schema<ILegacyInvitation>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    inviterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      default: "MEMBER",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"],
      default: "PENDING",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "legacyinvitations",
  }
);

// Indexes for LegacyInvitation
LegacyInvitationSchema.index({ email: 1, projectId: 1 });
LegacyInvitationSchema.index({ projectId: 1 });
LegacyInvitationSchema.index({ inviterId: 1 });
LegacyInvitationSchema.index({ status: 1 });
LegacyInvitationSchema.index({ status: 1, expiresAt: 1 });
LegacyInvitationSchema.index({ expiresAt: 1 });

// Instance methods for LegacyInvitation
LegacyInvitationSchema.methods.isExpired = function (): boolean {
  return this.expiresAt < new Date();
};

// Static methods for LegacyInvitation
LegacyInvitationSchema.statics.findByToken = function (token: string) {
  return this.findOne({ token })
    .populate("projectId", "name description")
    .populate("inviterId", "username avatar");
};

LegacyInvitationSchema.statics.findPendingByProject = function (
  projectId: string
) {
  return this.find({
    projectId,
    status: "PENDING",
    expiresAt: { $gt: new Date() },
  })
    .populate("inviterId", "username avatar")
    .sort({ createdAt: -1 });
};

// Create and export models
export interface IProjectInviteLinkModel extends Model<IProjectInviteLink> {
  findActiveByProject(projectId: string): Promise<IProjectInviteLink | null>;
  findByToken(token: string): Promise<IProjectInviteLink | null>;
}

export interface IMemberJoinLogModel extends Model<IMemberJoinLog> {
  findByProject(projectId: string, limit?: number): Promise<IMemberJoinLog[]>;
  getJoinStats(
    projectId: string
  ): Promise<Array<{ _id: IMemberJoinLog["joinMethod"]; count: number }>>;
}

export interface ILegacyInvitationModel extends Model<ILegacyInvitation> {
  findByToken(token: string): Promise<ILegacyInvitation | null>;
  findPendingByProject(projectId: string): Promise<ILegacyInvitation[]>;
}

export const ProjectInviteLink =
  (mongoose.models.ProjectInviteLink as IProjectInviteLinkModel) ||
  mongoose.model<IProjectInviteLink, IProjectInviteLinkModel>(
    "ProjectInviteLink",
    ProjectInviteLinkSchema
  );

export const MemberJoinLog =
  (mongoose.models.MemberJoinLog as IMemberJoinLogModel) ||
  mongoose.model<IMemberJoinLog, IMemberJoinLogModel>(
    "MemberJoinLog",
    MemberJoinLogSchema
  );

export const LegacyInvitation =
  (mongoose.models.LegacyInvitation as ILegacyInvitationModel) ||
  mongoose.model<ILegacyInvitation, ILegacyInvitationModel>(
    "LegacyInvitation",
    LegacyInvitationSchema
  );

// Export validation functions
export const validateProjectInviteLink = (data: unknown) =>
  ProjectInviteLinkValidationSchema.parse(data);

export const validateMemberJoinLog = (data: unknown) =>
  MemberJoinLogValidationSchema.parse(data);

export const validateLegacyInvitation = (data: unknown) =>
  LegacyInvitationValidationSchema.parse(data);
