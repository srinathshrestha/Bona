import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";

/**
 * Get the current user session from NextAuth
 * This is a helper function to be used in API routes and server components
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Get user ID from the session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Get session from NextAuth for API routes
 * This handles the request/response objects properly
 */
export async function getSessionFromRequest(req: NextRequest) {
  // For API routes in App Router, we need to use getServerSession differently
  const session = await getServerSession(authOptions);
  return session;
}

// Export for compatibility with old code
export { getCurrentUser as currentUser };
