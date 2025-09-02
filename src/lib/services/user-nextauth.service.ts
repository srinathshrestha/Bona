import { connectMongoDB } from "../mongodb";
import { User, validatePartialUser, IUser } from "../models/user.model";
import { ProjectMember } from "../models/projectMember.model";
import { Project } from "../models/project.model";
import mongoose from "mongoose";

/**
 * User Service - Handles all user-related database operations
 * Updated for NextAuth integration
 */
export class UserService {
  /**
   * Initialize database connection
   */
  private static async init() {
    await connectMongoDB();
  }

  /**
   * Get user by ID with populated relations
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    await this.init();

    try {
      const user = await User.findById(userId);

      console.log("👤 UserService.getUserById DEBUG:", {
        userId,
        found: !!user,
        mongoId: user?._id?.toString(),
      });

      return user;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUser | null> {
    await this.init();

    try {
      const user = await User.findByEmail(email);
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  /**
   * Get user with project memberships and owned projects
   */
  static async getUserWithProjects(userId: string): Promise<{
    user: IUser;
    ownedProjects: any[];
    memberProjects: any[];
  } | null> {
    await this.init();

    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // Get owned projects
      const ownedProjects = await Project.find({ ownerId: user._id })
        .sort({ updatedAt: -1 })
        .lean();

      // Get projects where user is a member (but not owner)
      const membershipRecords = await ProjectMember.find({
        userId: user._id,
        role: { $ne: "OWNER" },
      })
        .populate("projectId")
        .sort({ joinedAt: -1 })
        .lean();

      const memberProjects = membershipRecords.map((record) => ({
        ...record.projectId,
        membershipRole: record.role,
        joinedAt: record.joinedAt,
      }));

      return {
        user,
        ownedProjects,
        memberProjects,
      };
    } catch (error) {
      console.error("Error getting user with projects:", error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    data: {
      username?: string;
      displayName?: string;
      bio?: string;
      isOnboarded?: boolean;
      settings?: any;
    }
  ): Promise<IUser> {
    await this.init();

    try {
      // Validate partial user data
      const validatedData = validatePartialUser(data);

      // Check if username is available (if being updated)
      if (validatedData.username) {
        const user = await User.findById(userId);
        if (!user) {
          throw new Error("User not found");
        }

        const isAvailable = await User.isUsernameAvailable(
          validatedData.username,
          user._id.toString()
        );
        if (!isAvailable) {
          throw new Error("Username is already taken");
        }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: validatedData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        throw new Error("User not found");
      }

      return updatedUser;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(
    username: string,
    excludeUserId?: string
  ): Promise<boolean> {
    await this.init();

    try {
      return await User.isUsernameAvailable(username, excludeUserId);
    } catch (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<IUser | null> {
    await this.init();

    try {
      const user = await User.findByUsername(username);
      return user;
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }

  /**
   * Search users by display name or username
   */
  static async searchUsers(
    query: string,
    limit: number = 10
  ): Promise<IUser[]> {
    await this.init();

    try {
      const searchRegex = new RegExp(query, "i");
      const users = await User.find({
        $or: [
          { displayName: searchRegex },
          { username: searchRegex },
          { email: searchRegex },
        ],
      })
        .limit(limit)
        .select("-password")
        .lean();

      return users as IUser[];
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: string): Promise<void> {
    await this.init();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove user from all project memberships
      await ProjectMember.deleteMany({ userId });

      // Transfer ownership of projects to another admin or delete if no admins
      const ownedProjects = await Project.find({ ownerId: userId });

      for (const project of ownedProjects) {
        // Find another admin in the project
        const adminMember = await ProjectMember.findOne({
          projectId: project._id,
          role: "ADMIN",
          userId: { $ne: userId },
        });

        if (adminMember) {
          // Transfer ownership to the admin
          project.ownerId = adminMember.userId;
          await project.save({ session });
        } else {
          // No other admins, delete the project
          await ProjectMember.deleteMany(
            { projectId: project._id },
            { session }
          );
          await Project.findByIdAndDelete(project._id, { session });
        }
      }

      // Delete the user
      await User.findByIdAndDelete(userId, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error("Error deleting user:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<{
    totalProjects: number;
    ownedProjects: number;
    memberProjects: number;
  }> {
    await this.init();

    try {
      const [ownedProjects, memberProjects] = await Promise.all([
        Project.countDocuments({ ownerId: userId }),
        ProjectMember.countDocuments({ userId, role: { $ne: "OWNER" } }),
      ]);

      return {
        totalProjects: ownedProjects + memberProjects,
        ownedProjects,
        memberProjects,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }
}
