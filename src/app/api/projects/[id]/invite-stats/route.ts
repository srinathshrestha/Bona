import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  InvitationService,
  UserService,
  PermissionService,
} from "@/lib/database";
import type { ProjectRole } from "@/lib/models/types";

// GET /api/projects/[id]/invite-stats - Get invitation statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get the user from database
    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to view invitation stats (ADMIN or OWNER)
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      user.id,
      ProjectRole.ADMIN
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions to view invitation statistics" },
        { status: 403 }
      );
    }

    // Get invitation statistics
    const invitationStats = await InvitationService.getInvitationStats(
      projectId
    );

    // Process the data to provide useful statistics
    const stats = {
      totalLinks: invitationStats.length,
      activeLinks: invitationStats.filter((link) => link.isActive).length,
      totalUses: invitationStats.reduce(
        (sum, link) => sum + link.currentUses,
        0
      ),
      totalJoins: invitationStats.reduce(
        (sum, link) => sum + link.joinLogs.length,
        0
      ),

      // Recent activity (last 30 days)
      recentJoins: invitationStats.flatMap((link) =>
        link.joinLogs.filter((log) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return log.joinedAt >= thirtyDaysAgo;
        })
      ).length,

      // Link details
      links: invitationStats.map((link) => ({
        id: link.id,
        secretToken: link.secretToken,
        isActive: link.isActive,
        maxUses: link.maxUses,
        currentUses: link.currentUses,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        createdBy: link.createdBy,

        // Join logs for this link
        joinLogs: link.joinLogs.map((log) => ({
          id: log.id,
          user: log.user,
          joinedAt: log.joinedAt,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
        })),

        // Link statistics
        stats: {
          totalJoins: link.joinLogs.length,
          uniqueUsers: new Set(link.joinLogs.map((log) => log.userId)).size,
          avgJoinsPerDay:
            link.joinLogs.length > 0
              ? link.joinLogs.length /
                Math.max(
                  1,
                  Math.ceil(
                    (new Date().getTime() - link.createdAt.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0,
        },
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching invitation statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation statistics" },
      { status: 500 }
    );
  }
}
