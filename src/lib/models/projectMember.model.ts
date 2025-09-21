import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";
import { ObjectIdSchema, ProjectRoleSchema } from "./types";

// Zod validation schema for ProjectMember
export const ProjectMemberValidationSchema = z.object({
  projectId: ObjectIdSchema,
  userId: ObjectIdSchema,
  role: ProjectRoleSchema.default("MEMBER"),
});

// TypeScript interface for ProjectMember document
export interface IProjectMember extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "OWNER" | "MEMBER" | "VIEWER";
  joinedAt: Date;
  updatedAt: Date;
}

// Mongoose schema for ProjectMember
const ProjectMemberSchema = new Schema<IProjectMember>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["OWNER", "MEMBER", "VIEWER"],
      default: "MEMBER",
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "joinedAt", updatedAt: true },
    collection: "projectmembers",
  }
);

// Compound indexes for better performance
ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true }); // Unique member per project
ProjectMemberSchema.index({ projectId: 1, role: 1 }); // Find members by role
ProjectMemberSchema.index({ userId: 1, role: 1 }); // Find user's roles across projects
ProjectMemberSchema.index({ joinedAt: -1 }); // Sort by join date

// Instance methods
ProjectMemberSchema.methods.toJSON = function () {
  const memberObject = this.toObject();
  delete memberObject.__v;
  return memberObject;
};

ProjectMemberSchema.methods.hasPermission = function (
  requiredRole: string
): boolean {
  const roleHierarchy = {
    OWNER: 3, // Full project control
    MEMBER: 2, // Content contribution
    VIEWER: 1, // Read-only access
  };

  const userLevel = roleHierarchy[this.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel =
    roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
};


// Static methods
ProjectMemberSchema.statics.findByProject = function (projectId: string) {
  return this.find({ projectId })
    .populate("userId", "clerkId email username displayName avatar")
    .sort({ role: 1, joinedAt: 1 }); // Sort by role hierarchy, then join date
};

ProjectMemberSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId })
    .populate("projectId", "name description isPrivate ownerId")
    .sort({ joinedAt: -1 }); // Most recent first
};

ProjectMemberSchema.statics.findMember = function (
  projectId: string,
  userId: string
) {
  return this.findOne({ projectId, userId })
    .populate("userId", "clerkId email username displayName avatar")
    .populate("projectId", "name description");
};

ProjectMemberSchema.statics.getUserRole = function (
  projectId: string,
  userId: string
) {
  return this.findOne({ projectId, userId }).select("role");
};

ProjectMemberSchema.statics.getProjectOwner = function (projectId: string) {
  return this.findOne({ projectId, role: "OWNER" }).populate(
    "userId",
    "clerkId email username displayName avatar"
  );
};

ProjectMemberSchema.statics.getProjectAdmins = function (projectId: string) {
  return this.find({ projectId, role: { $in: ["OWNER", "ADMIN"] } })
    .populate("userId", "clerkId email username displayName avatar")
    .sort({ role: 1, joinedAt: 1 });
};

ProjectMemberSchema.statics.countMembersByRole = function (projectId: string) {
  return this.aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
    { $group: { _id: "$role", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

// Check if user has permission for a project
ProjectMemberSchema.statics.checkPermission = async function (
  projectId: string,
  userId: string,
  requiredRole: string
): Promise<boolean> {
  // Add debugging to understand what's happening
  console.log("🔍 ProjectMember.checkPermission DEBUG:", {
    projectId,
    userId,
    requiredRole,
    projectIdType: typeof projectId,
    userIdType: typeof userId,
  });

  // Try to find the member
  const member = await this.findOne({ projectId, userId });

  console.log("👤 Member found:", {
    found: !!member,
    memberData: member
      ? {
          userId: member.userId?.toString(),
          projectId: member.projectId?.toString(),
          role: member.role,
        }
      : null,
    userIdMatch: member ? member.userId?.toString() === userId : false,
    projectIdMatch: member ? member.projectId?.toString() === projectId : false,
  });

  if (!member) {
    // Debug: Let's see what members exist for this project
    const allMembers = await this.find({ projectId }).limit(10);
    console.log(
      "🔍 All members for project:",
      allMembers.map((m: IProjectMember) => ({
        userId: m.userId?.toString(),
        role: m.role,
        projectId: m.projectId?.toString(),
      }))
    );

    return false;
  }

  const hasPermission = member.hasPermission(requiredRole);
  console.log("🔑 Permission result:", {
    userRole: member.role,
    requiredRole,
    hasPermission,
  });

  return hasPermission;
};

// Pre-save middleware
ProjectMemberSchema.pre("save", function (next) {
  // Ensure we don't have duplicate owners
  if (this.isNew && this.role === "OWNER") {
    ProjectMember.findOne({ projectId: this.projectId, role: "OWNER" })
      .then((existingOwner) => {
        if (existingOwner && !existingOwner._id.equals(this._id)) {
          return next(new Error("Project can only have one owner"));
        }
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Post-save middleware
ProjectMemberSchema.post("save", function (doc) {
  console.log(
    `User ${doc.userId} added to project ${doc.projectId} with role ${doc.role}`
  );
});

// Post-remove middleware
ProjectMemberSchema.post(
  "deleteOne",
  { document: true, query: false },
  function (doc) {
    console.log(`User ${doc.userId} removed from project ${doc.projectId}`);
  }
);

// Create and export the model
export interface IProjectMemberModel extends Model<IProjectMember> {
  findByProject(projectId: string): Promise<IProjectMember[]>;
  findByUser(userId: string): Promise<IProjectMember[]>;
  findMember(projectId: string, userId: string): Promise<IProjectMember | null>;
  getUserRole(
    projectId: string,
    userId: string
  ): Promise<{ role: string } | null>;
  getProjectOwner(projectId: string): Promise<IProjectMember | null>;
  getProjectAdmins(projectId: string): Promise<IProjectMember[]>;
  countMembersByRole(
    projectId: string
  ): Promise<Array<{ _id: string; count: number }>>;
  checkPermission(
    projectId: string,
    userId: string,
    requiredRole: string
  ): Promise<boolean>;
}

export const ProjectMember =
  (mongoose.models.ProjectMember as IProjectMemberModel) ||
  mongoose.model<IProjectMember, IProjectMemberModel>(
    "ProjectMember",
    ProjectMemberSchema
  );

// Export validation functions
export const validateProjectMember = (data: any) => {
  return ProjectMemberValidationSchema.parse(data);
};

export const validatePartialProjectMember = (data: any) => {
  return ProjectMemberValidationSchema.partial().parse(data);
};
