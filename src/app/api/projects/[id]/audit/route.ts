import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  PermissionService, 
  UserService, 
  AuditService 
} from "@/lib/database";
import { ProjectRole } from "@prisma/client";

// GET /api/projects/[id]/audit - Get project audit trail
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
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // 'join', 'role_change', or undefined for all

    // Get the user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to view audit trail (ADMIN or OWNER)
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      user.id,
      ProjectRole.ADMIN
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions to view audit trail" },
        { status: 403 }
      );
    }

    let auditData;

    // Get specific type of audit data or comprehensive trail
    if (type === "join") {
      auditData = await AuditService.getMemberJoinHistory(projectId, { limit, offset });
      auditData = auditData.map(log => ({
        type: "join" as const,
        timestamp: log.joinedAt,
        data: log,
      }));
    } else if (type === "role_change") {
      auditData = await AuditService.getRoleChangeHistory(projectId, { limit, offset });
      auditData = auditData.map(log => ({
        type: "role_change" as const,
        timestamp: log.changedAt,
        data: log,
      }));
    } else {
      // Get comprehensive audit trail
      auditData = await AuditService.getAuditTrail(projectId, { limit, offset });
    }

    // Get summary statistics for the project
    const [joinHistory, roleChangeHistory] = await Promise.all([
      AuditService.getMemberJoinHistory(projectId, { limit: 100 }),
      AuditService.getRoleChangeHistory(projectId, { limit: 100 }),
    ]);

    // Calculate summary stats
    const stats = {
      totalEvents: auditData.length,
      recentJoins: joinHistory.filter(log => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return log.joinedAt >= sevenDaysAgo;
      }).length,
      totalRoleChanges: roleChangeHistory.length,
      recentRoleChanges: roleChangeHistory.filter(log => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return log.changedAt >= sevenDaysAgo;
      }).length,
      
      // Join method breakdown
      joinMethods: joinHistory.reduce((acc, log) => {
        acc[log.joinMethod] = (acc[log.joinMethod] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Role distribution changes
      roleChanges: roleChangeHistory.reduce((acc, log) => {
        const change = `${log.oldRole}_to_${log.newRole}`;
        acc[change] = (acc[change] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      auditTrail: auditData,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: auditData.length === limit,
      },
    });

  } catch (error) {
    console.error("Error fetching audit trail:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit trail" },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/audit/user/[userId] - Get user-specific audit trail
export async function getUserAudit(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { userId: requesterId } = await auth();
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, userId: targetUserId } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get the requester from database
    const requester = await UserService.getUserByClerkId(requesterId);
    if (!requester) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if requester has permission to view user audit (ADMIN or OWNER)
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      requester.id,
      ProjectRole.ADMIN
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions to view user audit trail" },
        { status: 403 }
      );
    }

    // Get role change history for specific user
    const roleChanges = await AuditService.getRoleChangeHistory(projectId, {
      userId: targetUserId,
      limit,
      offset,
    });

    // Get join history for specific user (if they joined via invitation)
    const joinHistory = await AuditService.getMemberJoinHistory(projectId);
    const userJoinLog = joinHistory.find(log => log.userId === targetUserId);

    return NextResponse.json({
      userAudit: {
        userId: targetUserId,
        joinLog: userJoinLog || null,
        roleChanges: roleChanges.map(log => ({
          id: log.id,
          oldRole: log.oldRole,
          newRole: log.newRole,
          reason: log.reason,
          changedAt: log.changedAt,
          changedBy: log.changedBy,
        })),
      },
      pagination: {
        limit,
        offset,
        hasMore: roleChanges.length === limit,
      },
    });

  } catch (error) {
    console.error("Error fetching user audit trail:", error);
    return NextResponse.json(
      { error: "Failed to fetch user audit trail" },
      { status: 500 }
    );
  }
} 