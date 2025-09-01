import connectMongoDB from "../mongodb";
import { ProjectMember } from "../models/projectMember.model";
import { RoleChangeLog } from "../models/audit.model";

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
    }).populate('userId');
    
    if (!member) throw new Error("User not found in project");

    const oldRole = member.role;
    member.role = newRole as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
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

  static async removeMember(
    projectId: string,
    targetUserId: string,
    removedById: string,
    reason?: string
  ) {
    await this.init();

    // Check if user is a member of the project
    const member = await ProjectMember.findOne({
      projectId,
      userId: targetUserId,
    }).populate('userId');

    if (!member) {
      throw new Error("User is not a member of this project");
    }

    // Check if the user performing the action has permission (OWNER or ADMIN)
    const removerRole = await this.getUserRole(projectId, removedById);
    if (!removerRole || !['OWNER', 'ADMIN'].includes(removerRole)) {
      throw new Error("Insufficient permissions to remove members");
    }

    // Prevent removing the project owner unless done by another owner
    if (member.role === 'OWNER' && removerRole !== 'OWNER') {
      throw new Error("Cannot remove project owner");
    }

    // Remove the member
    await ProjectMember.deleteOne({ projectId, userId: targetUserId });

    // Log the change
    const log = new RoleChangeLog({
      userId: targetUserId,
      projectId,
      changedById: removedById,
      oldRole: member.role,
      newRole: null, // null indicates member was removed
      reason: reason || 'Member removed from project',
    });
    await log.save();

    return member;
  }

  static async getPermissionSummary(projectId: string, userId: string) {
    await this.init();
    
    const role = await this.getUserRole(projectId, userId);
    
    if (!role) {
      return {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManageMembers: false,
        role: null
      };
    }

    const permissions = {
      canEdit: ["OWNER", "ADMIN", "MEMBER"].includes(role),
      canDelete: ["OWNER", "ADMIN"].includes(role),
      canInvite: ["OWNER", "ADMIN"].includes(role),
      canManageMembers: ["OWNER", "ADMIN"].includes(role),
      role: role
    };

    return permissions;
  }
}
