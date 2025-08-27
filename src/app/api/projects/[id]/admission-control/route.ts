import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  PermissionService,
  UserService,
  InvitationService,
} from "@/lib/database";

// GET /api/projects/[id]/admission-control - Get admission control status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to view admission control (OWNER only)
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      user._id.toString(),
      "OWNER"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only project owners can view admission control settings" },
        { status: 403 }
      );
    }

    // Get active invitation link
    const activeInviteLink = await InvitationService.getActiveInvitationLink(
      projectId
    );

    // Calculate admission status
    const admissionStatus = {
      isOpen: activeInviteLink ? activeInviteLink.isActive : false,
      activeInviteLink: activeInviteLink
        ? {
            id: activeInviteLink.id,
            secretToken: activeInviteLink.secretToken,
            maxUses: activeInviteLink.maxUses,
            currentUses: activeInviteLink.currentUses,
            expiresAt: activeInviteLink.expiresAt,
            createdAt: activeInviteLink.createdAt,
            url: `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/join/${activeInviteLink.secretToken}`,
          }
        : null,

      // Statistics (simplified)
      stats: {
        totalInviteLinks: activeInviteLink ? 1 : 0,
        totalJoins: activeInviteLink ? activeInviteLink.currentUses : 0,
        recentJoins: 0, // Simplified for now
        averageUsage: activeInviteLink ? activeInviteLink.currentUses : 0,
      },
    };

    return NextResponse.json(admissionStatus);
  } catch (error) {
    console.error("Error fetching admission control status:", error);
    return NextResponse.json(
      { error: "Failed to fetch admission control status" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/admission-control - Open admissions (create invite link)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to control admissions (OWNER only)
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      user._id.toString(),
      "OWNER"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only project owners can control admission settings" },
        { status: 403 }
      );
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const options: {
      maxUses?: number;
      expiresAt?: string;
    } = body;

    // Convert expiration date if provided
    const expiresAt = options.expiresAt
      ? new Date(options.expiresAt)
      : undefined;

    // Create invitation link to open admissions
    const inviteLink = await InvitationService.createInvitationLink(
      projectId,
      user._id.toString(),
      {
        maxUses: options.maxUses,
        expiresAt,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Admissions opened successfully",
      admissionStatus: {
        isOpen: true,
        activeInviteLink: {
          id: inviteLink.id,
          secretToken: inviteLink.secretToken,
          maxUses: inviteLink.maxUses,
          currentUses: inviteLink.currentUses,
          expiresAt: inviteLink.expiresAt,
          createdAt: inviteLink.createdAt,
          url: `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/join/${inviteLink.secretToken}`,
        },
      },
    });
  } catch (error) {
    console.error("Error opening admissions:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Only project owners")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to open admissions" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/admission-control - Close admissions (deactivate invite link)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to control admissions (OWNER only)
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      user.id,
      "OWNER"
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Only project owners can control admission settings" },
        { status: 403 }
      );
    }

    // Deactivate invitation link to close admissions
    await InvitationService.deactivateInvitationLink(
      projectId,
      user._id.toString()
    );

    return NextResponse.json({
      success: true,
      message: "Admissions closed successfully",
      admissionStatus: {
        isOpen: false,
        activeInviteLink: null,
      },
    });
  } catch (error) {
    console.error("Error closing admissions:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Only project owners")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to close admissions" },
      { status: 500 }
    );
  }
}
