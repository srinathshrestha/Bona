import connectMongoDB from "../mongodb";
import { ProjectMember } from "../models/projectMember.model";
import { RoleChangeLog } from "../models/audit.model";
import mongoose from "mongoose";

export class PermissionService {
  private static async init() {
    await connectMongoDB();
  }

  static async checkPermission(
    projectId: string,
    userId: string,
    requiredRole: string
  ): Promise<boolean> {
    await this.init();
    return await ProjectMember.checkPermission(projectId, userId, requiredRole);
  }

  static async getUserRole(
    projectId: string,
    userId: string
  ): Promise<string | null> {
    await this.init();
    const member = await ProjectMember.getUserRole(projectId, userId);
    return member?.role || null;
  }

  static async changeUserRole(
    projectId: string,
    targetUserId: string,
    newRole: string,
    changedById: string,
    reason?: string
  ) {
    await this.init();

    const member = await ProjectMember.findOne({
      projectId,
      userId: targetUserId,
    });
    if (!member) throw new Error("User not found in project");

    const oldRole = member.role;
    member.role = newRole as any;
    await member.save();

    // Log the change
    const log = new RoleChangeLog({
      userId: targetUserId,
      projectId,
      changedById,
      oldRole,
      newRole,
      reason,
    });
    await log.save();

    return member;
  }
}
