import connectMongoDB from "../mongodb";
import {
  User,
  validateUser,
  validatePartialUser,
  IUser,
} from "../models/user.model";
import { ProjectMember } from "../models/projectMember.model";
import { Project } from "../models/project.model";
import mongoose from "mongoose";

/**
 * User Service - Handles all user-related database operations
 * Migrated from Prisma to MongoDB with Mongoose
 */
export class UserService {
  /**
   * Initialize database connection
   */
  private static async init() {
    await connectMongoDB();
  }

  /**
   * Create or update user from Clerk data
   * This syncs user data from Clerk authentication
   */
  static async syncUserFromClerk(clerkUser: {
    id: string;
    emailAddresses: Array<{ emailAddress: string }>;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string;
  }): Promise<IUser> {
    await this.init();

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error("User must have an email address");
    }

    // Generate displayName from Clerk data if not already set
    const displayName =
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || undefined;

    try {
      // Try to find existing user
      let user = await User.findByClerkId(clerkUser.id);

      if (user) {
        // Update existing user
        user.avatar = clerkUser.imageUrl || user.avatar;
        if (displayName && !user.displayName) {
          user.displayName = displayName;
        }
        await user.save();
      } else {
        // Create new user
        const userData = validateUser({
          clerkId: clerkUser.id,
          email,
          displayName,
          avatar: clerkUser.imageUrl,
        });

        user = new User(userData);
        await user.save();
      }

      return user;
    } catch (error) {
      console.error("Error syncing user from Clerk:", error);
      throw error;
    }
  }

  /**
   * Get user by Clerk ID with populated relations
   */
  static async getUserByClerkId(clerkId: string): Promise<IUser | null> {
    await this.init();

    try {
      const user = await User.findByClerkId(clerkId);

      console.log("👤 UserService.getUserByClerkId DEBUG:", {
        clerkId,
        found: !!user,
        mongoId: user?._id?.toString(),
        userIdProperty: user?.id,
        bothEqual: user?._id?.toString() === user?.id,
      });

      return user;
    } catch (error) {
      console.error("Error getting user by Clerk ID:", error);
      throw error;
    }
  }

  /**
   * Get user with project memberships and owned projects
   */
  static async getUserWithProjects(clerkId: string): Promise<{
    user: IUser;
    ownedProjects: any[];
    memberProjects: any[];
  } | null> {
    await this.init();

    try {
      const user = await User.findByClerkId(clerkId);
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
    clerkId: string,
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
        const user = await User.findByClerkId(clerkId);
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
      const updatedUser = await User.findOneAndUpdate(
        { clerkId },
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
    excludeClerkId?: string
  ): Promise<boolean> {
    await this.init();

    try {
      let excludeUserId: string | undefined;

      if (excludeClerkId) {
        const user = await User.findByClerkId(excludeClerkId);
        excludeUserId = user?._id.toString();
      }

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
      return await User.findByUsername(username);
    } catch (error) {
      console.error("Error getting user by username:", error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUser | null> {
    await this.init();

    try {
      return await User.findByEmail(email);
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  /**
   * Search users by display name or username
   */
  static async searchUsers(
    searchTerm: string,
    limit: number = 20
  ): Promise<IUser[]> {
    await this.init();

    try {
      const searchRegex = new RegExp(searchTerm, "i");

      return await User.find({
        $or: [
          { displayName: searchRegex },
          { username: searchRegex },
          { email: searchRegex },
        ],
        isOnboarded: true, // Only show onboarded users
      })
        .select("clerkId username displayName avatar bio")
        .limit(limit)
        .sort({ displayName: 1 });
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId: string): Promise<{
    projectsOwned: number;
    projectsMember: number;
    filesUploaded: number;
    messagesSent: number;
  }> {
    await this.init();

    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const [projectsOwned, projectsMember, filesUploaded, messagesSent] =
        await Promise.all([
          Project.countDocuments({ ownerId: userObjectId }),
          ProjectMember.countDocuments({
            userId: userObjectId,
            role: { $ne: "OWNER" },
          }),
          mongoose.model("File").countDocuments({ uploadedById: userObjectId }),
          mongoose.model("Message").countDocuments({ userId: userObjectId }),
        ]);

      return {
        projectsOwned,
        projectsMember,
        filesUploaded,
        messagesSent,
      };
    } catch (error) {
      console.error("Error getting user activity summary:", error);
      throw error;
    }
  }

  /**
   * Delete user and all associated data
   * WARNING: This is a destructive operation
   */
  static async deleteUser(clerkId: string): Promise<void> {
    await this.init();

    try {
      const user = await User.findByClerkId(clerkId);
      if (!user) {
        throw new Error("User not found");
      }

      // Use transaction for data consistency
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const userObjectId = user._id;

          // Delete user's owned projects and all related data
          const ownedProjects = await Project.find({
            ownerId: userObjectId,
          }).session(session);
          for (const project of ownedProjects) {
            // This will cascade delete all project-related data
            await Project.findByIdAndDelete(project._id).session(session);
          }

          // Remove user from project memberships
          await ProjectMember.deleteMany({ userId: userObjectId }).session(
            session
          );

          // Delete user's messages
          await mongoose
            .model("Message")
            .deleteMany({ userId: userObjectId })
            .session(session);

          // Delete user's files (Note: S3 cleanup should be handled separately)
          await mongoose
            .model("File")
            .deleteMany({ uploadedById: userObjectId })
            .session(session);

          // Delete audit logs
          await mongoose
            .model("FileAccess")
            .deleteMany({ userId: userObjectId })
            .session(session);
          await mongoose
            .model("RoleChangeLog")
            .deleteMany({
              $or: [{ userId: userObjectId }, { changedById: userObjectId }],
            })
            .session(session);

          // Finally, delete the user
          await User.findByIdAndDelete(userObjectId).session(session);
        });

        console.log(
          `Successfully deleted user ${clerkId} and all associated data`
        );
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  /**
   * Get recently active users
   */
  static async getRecentlyActiveUsers(limit: number = 10): Promise<IUser[]> {
    await this.init();

    try {
      return await User.find({ isOnboarded: true })
        .select("clerkId username displayName avatar")
        .sort({ updatedAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error("Error getting recently active users:", error);
      throw error;
    }
  }
}
