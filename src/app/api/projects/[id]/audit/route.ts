import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { 
  PermissionService, 
  UserService, 
  AuditService 
} from "@/lib/database";
import type { ProjectRole } from "@/lib/models/types";

// GET /api/projects/[id]/audit - Get project audit trail
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
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // 'join', 'role_change', or undefined for all

    // Get the user from database
    const user = await UserService.getUserById(userId);
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

// Note: User-specific audit trail functionality moved to separate route
// TODO: Create /api/projects/[id]/audit/user/[userId]/route.ts for user-specific audit data