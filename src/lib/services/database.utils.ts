import connectMongoDB, { getConnectionStatus } from "../mongodb";
import { User } from "../models/user.model";
import { Project } from "../models/project.model";
import { File } from "../models/file.model";
import { PermissionService } from "./permission.service";

export class DatabaseUtils {
  static async healthCheck() {
    try {
      await connectMongoDB();
      const status = getConnectionStatus();
      return {
        status: "healthy",
        connection: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getStats() {
    await connectMongoDB();
    const [userCount, projectCount, fileCount] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      File.countDocuments(),
    ]);

    return {
      users: userCount,
      projects: projectCount,
      files: fileCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class RoutePermissionService {
  static async checkProjectAccess(
    userId: string,
    projectId: string,
    minimumRole: string = "VIEWER"
  ) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { hasAccess: false };
      }

      const hasPermission = await PermissionService.checkPermission(
        projectId,
        user._id.toString(),
        minimumRole
      );

      if (!hasPermission) {
        return { hasAccess: false, user };
      }

      const userRole = await PermissionService.getUserRole(
        projectId,
        user._id.toString()
      );

      return {
        hasAccess: true,
        user,
        userRole,
      };
    } catch (error) {
      console.error("Route permission check error:", error);
      return { hasAccess: false };
    }
  }

  static async checkCreateProjectAccess(userId: string) {
    try {
      const user = await User.findById(userId);
      return { hasAccess: !!user, user: user || undefined };
    } catch (error) {
      console.error("Create project permission check error:", error);
      return { hasAccess: false };
    }
  }
}
