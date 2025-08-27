import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService, PermissionService } from "@/lib/database";
import { MessageService } from "@/lib/services";
import { z } from "zod";

// Validation schema for message creation
const messageCreateSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(1000, "Message too long"),
  replyToId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        fileId: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        fileSize: z.number().positive(),
      })
    )
    .optional(),
});

// GET /api/projects/[id]/messages - Get project messages
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to the project
    const hasAccess = await PermissionService.checkPermission(
      projectId,
      user._id.toString(),
      "VIEWER"
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get messages using MongoDB service
    const messages = await MessageService.getMessagesByProject(projectId, {
      limit,
      offset,
      reverse: true, // Get oldest first from DB
    });

    // Transform messages to match frontend interface
    const transformedMessages = messages.map((message: any) => ({
      id: message._id.toString(),
      content: message.content,
      createdAt: message.createdAt,
      user: message.userId
        ? {
            id: message.userId._id?.toString() || message.userId.toString(),
            displayName: message.userId.displayName || null,
            username: message.userId.username || null,
            avatar: message.userId.avatar || null,
          }
        : null,
      replyTo: message.replyToId
        ? {
            id:
              message.replyToId._id?.toString() || message.replyToId.toString(),
            content: message.replyToId.content,
            user: message.replyToId.userId
              ? {
                  id:
                    message.replyToId.userId._id?.toString() ||
                    message.replyToId.userId.toString(),
                  displayName: message.replyToId.userId.displayName || null,
                  username: message.replyToId.userId.username || null,
                  avatar: message.replyToId.userId.avatar || null,
                }
              : null,
          }
        : null,
      attachments: message.attachments || [],
      _count: {
        replies: message.replyCount || 0,
      },
    }));

    // For simplicity, we'll approximate total count
    // In production, you might want to implement proper pagination
    const totalCount = transformedMessages.length + offset;

    return NextResponse.json({
      messages: transformedMessages, // Keep chronological order: oldest first, newest last
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: transformedMessages.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/messages - Send a message
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

    // Get user from database
    const user = await UserService.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user can send messages (MEMBER or above)
    const canChat = await PermissionService.checkPermission(
      projectId,
      user._id.toString(),
      "MEMBER"
    );

    if (!canChat) {
      return NextResponse.json(
        { error: "Insufficient permissions to send messages" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = messageCreateSchema.parse(body);

    // Create the message using MongoDB service
    const messageData = {
      content: validatedData.content,
      projectId,
      userId: user._id.toString(),
      replyToId: validatedData.replyToId,
      attachments: validatedData.attachments,
    };

    const message = await MessageService.createMessage(messageData);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid message data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}