import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PermissionService } from "@/lib/services/permission.service";

export const dynamic = 'force-dynamic';

// Store active connections
const connections = new Map<string, {
  controller: ReadableStreamDefaultController;
  projectId: string;
  userId: string;
}>();

// Broadcast new message to all project subscribers
export function broadcastToProject(projectId: string, message: Record<string, unknown>) {
  connections.forEach((connection, connectionId) => {
    if (connection.projectId === projectId) {
      try {
        const data = `data: ${JSON.stringify(message)}\n\n`;
        connection.controller.enqueue(new TextEncoder().encode(data));
      } catch (error) {
        console.error('Failed to send SSE message:', error);
        connections.delete(connectionId);
      }
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const projectId = params.id;

    // Verify user has permission to access this project
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      userId,
      'VIEWER'
    );

    if (!hasPermission) {
      return new Response('Forbidden', { status: 403 });
    }

    const stream = new ReadableStream({
      start(controller) {
        const connectionId = `${userId}-${projectId}-${Date.now()}`;
        
        // Store connection
        connections.set(connectionId, {
          controller,
          projectId,
          userId
        });

        // Send initial connection message
        const initialMessage = `data: ${JSON.stringify({ 
          type: 'connected', 
          timestamp: new Date().toISOString() 
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(initialMessage));

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          connections.delete(connectionId);
          try {
            controller.close();
          } catch {
            // Connection already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('SSE Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
