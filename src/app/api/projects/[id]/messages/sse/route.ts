import { auth } from "@clerk/nextjs/server";
import { PermissionService } from "@/lib/services/permission.service";
import { UserService } from "@/lib/services/user.service";

export const dynamic = 'force-dynamic';

// Store SSE connections for broadcasting
const sseConnections = new Map<string, Set<WritableStreamDefaultWriter>>();

function addConnection(projectId: string, writer: WritableStreamDefaultWriter) {
  if (!sseConnections.has(projectId)) {
    sseConnections.set(projectId, new Set());
  }
  sseConnections.get(projectId)!.add(writer);
}

function removeConnection(projectId: string, writer: WritableStreamDefaultWriter) {
  const connections = sseConnections.get(projectId);
  if (connections) {
    connections.delete(writer);
    if (connections.size === 0) {
      sseConnections.delete(projectId);
    }
  }
}

export function broadcastMessage(projectId: string, message: Record<string, unknown>) {
  const connections = sseConnections.get(projectId);
  if (connections) {
    const data = JSON.stringify({
      type: 'new_message',
      message
    });
    
    connections.forEach(async (writer) => {
      try {
        await writer.write(`data: ${data}\n\n`);
      } catch (error) {
        console.error('Failed to write to SSE connection:', error);
        connections.delete(writer);
      }
    });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Get the MongoDB user ID from Clerk ID
    const user = await UserService.getUserByClerkId(clerkUserId);
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Verify user has permission to access this project
    const hasPermission = await PermissionService.checkPermission(
      projectId,
      user.id,
      'VIEWER'
    );

    if (!hasPermission) {
      return new Response('Forbidden', { status: 403 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Add this connection to the project's connections
        const streamWriter = {
          write: async (data: string) => {
            controller.enqueue(encoder.encode(data));
          }
        } as WritableStreamDefaultWriter;

        addConnection(projectId, streamWriter);

        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          message: 'SSE connection established'
        })}\n\n`));

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          removeConnection(projectId, streamWriter);
          try {
            controller.close();
          } catch {
            // Connection already closed
          }
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('SSE Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
