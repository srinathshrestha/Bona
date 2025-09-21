import connectMongoDB from "../mongodb";
import {
  Project,
  validateProject,
  validatePartialProject,
  IProject,
} from "../models/project.model";
import { ProjectMember, IProjectMember } from "../models/projectMember.model";
import { User, IUser } from "../models/user.model";
import mongoose from "mongoose";

// Define interfaces for service parameters
export interface ProjectCreateData {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface ProjectListOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface ProjectStatsResult {
  memberCount: number;
  fileCount: number;
  messageCount: number;
  totalFileSize: number;
  recentActivity: Array<Record<string, unknown>>;
}

export interface ProjectWithDetails extends IProject {
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      displayName: string | null;
      username: string | null;
      email: string;
      avatar: string | null;
    } | null;
  }>;
  files: Array<Record<string, unknown>>;
  _count: {
    members: number;
    files: number;
    messages: number;
  };
}

/**
 * Project Service - Handles all project-related database operations
 */
export class ProjectService {
  private static async init() {
    await connectMongoDB();
  }

  /**
   * Create a new project
   */
  static async createProject(
    ownerId: string,
    data: ProjectCreateData
  ): Promise<{ project: IProject; membership: IProjectMember }> {
    await this.init();

    try {
      // Get user to verify they exist
      const user = await User.findById(ownerId);
      if (!user) {
        throw new Error("User not found");
      }

      // Validate project data
      const validatedData = validateProject({
        ...data,
        ownerId,
      });

      // Start transaction
      const session = await mongoose.startSession();
      let project: IProject;
      let membership: IProjectMember;

      try {
        await session.withTransaction(async () => {
          // Create project
          project = new Project(validatedData);
          await project.save({ session });

          // Add owner as member with OWNER role
          membership = new ProjectMember({
            projectId: project._id,
            userId: ownerId,
            role: "OWNER",
          });
          await membership.save({ session });
        });

        return { project: project!, membership: membership! };
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  /**
   * Get project with members and basic stats
   */
  static async getProject(
    projectId: string,
    userId: string
  ): Promise<IProject | null> {
    await this.init();

    try {
      // First check if user has access to this project
      const member = await ProjectMember.findOne({
        projectId,
        userId,
      });

      if (!member) {
        throw new Error("Access denied to this project");
      }

      // Get project with populated data
      const project = await Project.findById(projectId)
        .populate("ownerId", "username avatar")
        .lean();

      if (!project) {
        return null;
      }

      // Get members
      const members = await ProjectMember.find({ projectId })
        .populate("userId", "username avatar")
        .sort({ role: 1, joinedAt: 1 })
        .lean();

      // Get files with populated user data
      const files = await mongoose
        .model("File")
        .find({ projectId })
        .populate("uploadedById", "username avatar")
        .sort({ createdAt: -1 })
        .lean();

      // Get basic stats
      const [filesCount, messagesCount] = await Promise.all([
        mongoose.model("File").countDocuments({ projectId }),
        mongoose.model("Message").countDocuments({ projectId }),
      ]);

      return {
        ...project,
        members,
        files,
        _count: {
          members: members.length,
          files: filesCount,
          messages: messagesCount,
        },
      } as unknown as ProjectWithDetails;
    } catch (error) {
      console.error("Error getting project:", error);
      throw error;
    }
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    userId: string,
    data: ProjectUpdateData
  ): Promise<IProject> {
    await this.init();

    try {
      // Check if user has admin access using permission hierarchy
      const member = await ProjectMember.findOne({
        projectId,
        userId,
      });

      if (!member) {
        throw new Error("User is not a member of this project");
      }

      // Use the hasPermission method to check if user has owner permission
      const roleHierarchy = {
        OWNER: 3,
        MEMBER: 2,
        VIEWER: 1,
      };

      const userLevel =
        roleHierarchy[member.role as keyof typeof roleHierarchy] || 0;
      const requiredLevel = roleHierarchy.OWNER;

      if (userLevel < requiredLevel) {
        throw new Error("Insufficient permissions to update project");
      }

      // Validate partial project data
      const validatedData = validatePartialProject(data);

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (!updatedProject) {
        throw new Error("Project not found");
      }

      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  /**
   * Add member to project
   */
  static async addMember(
    projectId: string,
    userId: string,
    role: "OWNER" | "MEMBER" | "VIEWER" = "MEMBER"
  ): Promise<IProjectMember> {
    await this.init();

    try {
      // Check if user already exists
      const existingMember = await ProjectMember.findOne({
        projectId,
        userId,
      });

      if (existingMember) {
        throw new Error("User is already a member of this project");
      }

      // Verify project exists
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Create membership
      const member = new ProjectMember({
        projectId,
        userId,
        role,
      });

      await member.save();

      // Populate user data
      await member.populate("userId", "username displayName avatar");
      await member.populate("projectId", "name description");

      return member;
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  }

  /**
   * Get user's projects (owned + member)
   */
  static async getUserProjects(userId: string): Promise<{
    ownedProjects: IProject[];
    memberProjects: Array<{
      project: IProject;
      role: string;
      joinedAt: Date;
    }>;
  }> {
    await this.init();

    try {
      // Get owned projects
      const ownedProjects = await Project.find({ ownerId: userId }).sort({
        updatedAt: -1,
      });

      // Get projects where user is a member (but not owner)
      const memberships = await ProjectMember.find({
        userId,
        role: { $ne: "OWNER" },
      })
        .populate("projectId")
        .sort({ joinedAt: -1 });

      const memberProjects = memberships.map((membership) => ({
        project: (membership.projectId as unknown as IProject).toObject(),
        role: membership.role,
        joinedAt: membership.joinedAt,
      }));

      return {
        ownedProjects,
        memberProjects,
      };
    } catch (error) {
      console.error("Error getting user projects:", error);
      throw error;
    }
  }

  /**
   * Delete project and all related data
   */
  static async deleteProject(projectId: string, userId: string): Promise<void> {
    await this.init();

    try {
      // Check if user is the owner
      const member = await ProjectMember.findOne({
        projectId,
        userId,
        role: "OWNER",
      });

      if (!member) {
        throw new Error("Only project owners can delete projects");
      }

      // Use transaction for data consistency
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const projectObjectId = new mongoose.Types.ObjectId(projectId);

          // Delete all project members
          await ProjectMember.deleteMany({
            projectId: projectObjectId,
          }).session(session);

          // Delete all files (Note: S3 cleanup should be handled separately)
          await mongoose
            .model("File")
            .deleteMany({ projectId: projectObjectId })
            .session(session);

          // Delete all messages
          await mongoose
            .model("Message")
            .deleteMany({ projectId: projectObjectId })
            .session(session);

          // Delete invitation links and logs
          await mongoose
            .model("ProjectInviteLink")
            .deleteMany({ projectId: projectObjectId })
            .session(session);
          await mongoose
            .model("MemberJoinLog")
            .deleteMany({ projectId: projectObjectId })
            .session(session);

          // Delete audit logs
          await mongoose
            .model("RoleChangeLog")
            .deleteMany({ projectId: projectObjectId })
            .session(session);

          // Finally, delete the project
          await Project.findByIdAndDelete(projectObjectId).session(session);
        });

        console.log(
          `Successfully deleted project ${projectId} and all related data`
        );
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  /**
   * Search projects by name or description
   */
  static async searchProjects(
    searchTerm: string,
    isPublic: boolean = false
  ): Promise<IProject[]> {
    await this.init();

    try {
      return await Project.searchProjects(searchTerm, isPublic);
    } catch (error) {
      console.error("Error searching projects:", error);
      throw error;
    }
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(projectId: string): Promise<ProjectStatsResult> {
    await this.init();

    try {
      const projectObjectId = new mongoose.Types.ObjectId(projectId);

      const [
        memberCount,
        fileCount,
        messageCount,
        fileSizeResult,
        recentMessages,
      ] = await Promise.all([
        ProjectMember.countDocuments({ projectId: projectObjectId }),
        mongoose.model("File").countDocuments({ projectId: projectObjectId }),
        mongoose
          .model("Message")
          .countDocuments({ projectId: projectObjectId }),
        mongoose
          .model("File")
          .aggregate([
            { $match: { projectId: projectObjectId } },
            { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
          ]),
        mongoose
          .model("Message")
          .find({ projectId: projectObjectId })
          .populate("userId", "username avatar")
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

      const totalFileSize = fileSizeResult[0]?.totalSize || 0;

      return {
        memberCount,
        fileCount,
        messageCount,
        totalFileSize,
        recentActivity: recentMessages,
      };
    } catch (error) {
      console.error("Error getting project stats:", error);
      throw error;
    }
  }

  /**
   * Check if user has access to project with minimum role
   */
  static async hasProjectAccess(
    userId: string,
    projectId: string,
    minRole: string = "VIEWER"
  ): Promise<boolean> {
    await this.init();

    try {
      const member = await ProjectMember.findOne({
        projectId,
        userId,
      });

      if (!member) {
        return false;
      }

      // Check if user has minimum required role
      // Use role hierarchy check directly
      const roleHierarchy = {
        OWNER: 3,
        MEMBER: 2,
        VIEWER: 1,
      };

      const userLevel =
        roleHierarchy[member.role as keyof typeof roleHierarchy] || 0;
      const requiredLevel =
        roleHierarchy[minRole as keyof typeof roleHierarchy] || 0;

      return userLevel >= requiredLevel;
    } catch (error) {
      console.error("Error checking project access:", error);
      return false;
    }
  }

  /**
   * Get project members with user details
   */
  static async getProjectMembers(projectId: string) {
    await this.init();

    try {
      const members = await ProjectMember.find({ projectId })
        .populate("userId")
        .sort({ joinedAt: 1 });

      return members.map((member) => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        updatedAt: member.updatedAt,
        user: member.userId
          ? {
              id: (member.userId as unknown as IUser).id,
              username: (member.userId as unknown as IUser).username,
              email: (member.userId as unknown as IUser).email,
              avatar: (member.userId as unknown as IUser).avatar,
            }
          : null,
      }));
    } catch (error) {
      console.error("Error getting project members:", error);
      throw error;
    }
  }
}
