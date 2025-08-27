import connectMongoDB from "../mongodb";
import { ProjectInviteLink, MemberJoinLog } from "../models/invitation.model";
import { ProjectMember } from "../models/projectMember.model";
import { PermissionService } from "./permission.service";
import crypto from "crypto";
import mongoose from "mongoose";

export class InvitationService {
  private static async init() {
    await connectMongoDB();
  }

  static generateSecretToken(): string {
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString(36);
    return `${timestamp}-${randomBytes.toString("base64url")}`;
  }

  static async createInvitationLink(
    projectId: string,
    createdById: string,
    options: { maxUses?: number; expiresAt?: Date } = {}
  ) {
    await this.init();

    console.log("🎯 InvitationService.createInvitationLink DEBUG:", {
      projectId,
      createdById,
      projectIdType: typeof projectId,
      createdByIdType: typeof createdById,
    });

    // Check permissions - both OWNER and ADMIN can create invitation links
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      createdById,
      "ADMIN"
    );

    console.log("✅ Permission check result:", hasPermission);

    if (!hasPermission) {
      throw new Error(
        "Only project owners and admins can create invitation links"
      );
    }

    // Deactivate existing links
    await ProjectInviteLink.updateMany(
      { projectId, isActive: true },
      { isActive: false }
    );

    // Create new link
    const secretToken = this.generateSecretToken();
    const inviteLink = new ProjectInviteLink({
      projectId,
      createdById,
      secretToken,
      maxUses: options.maxUses,
      expiresAt: options.expiresAt,
      isActive: true,
    });

    await inviteLink.save();
    return inviteLink;
  }

  static async validateInvitationToken(token: string) {
    await this.init();
    const inviteLink = await ProjectInviteLink.findByToken(token);

    if (!inviteLink || !inviteLink.canBeUsed()) {
      throw new Error("Invalid or expired invitation link");
    }

    return inviteLink;
  }

  static async acceptInvitation(
    token: string,
    userId: string,
    requestInfo: { ipAddress?: string; userAgent?: string } = {}
  ) {
    await this.init();

    const inviteLink = await this.validateInvitationToken(token);

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Add as member
        const member = new ProjectMember({
          projectId: inviteLink.projectId,
          userId,
          role: "MEMBER",
        });
        await member.save({ session });

        // Log the join
        const joinLog = new MemberJoinLog({
          userId,
          projectId: inviteLink.projectId,
          joinMethod: "INVITE_LINK",
          inviteToken: token,
          ...requestInfo,
        });
        await joinLog.save({ session });

        // Update usage count
        inviteLink.currentUses += 1;
        await inviteLink.save({ session });

        return member;
      });
    } finally {
      await session.endSession();
    }
  }

  static async getActiveInvitationLink(projectId: string) {
    await this.init();
    return await ProjectInviteLink.findActiveByProject(projectId);
  }

  static async deactivateInvitationLink(projectId: string, userId: string) {
    await this.init();

    // Check permissions - both OWNER and ADMIN can deactivate invitation links
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      userId,
      "ADMIN"
    );

    if (!hasPermission) {
      throw new Error(
        "Only project owners and admins can deactivate invitation links"
      );
    }

    // Deactivate all active links for this project
    await ProjectInviteLink.updateMany(
      { projectId, isActive: true },
      { isActive: false }
    );
  }
}
