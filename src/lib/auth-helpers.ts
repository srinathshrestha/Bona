import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Get the current authenticated user from NextAuth session
 * This replaces Clerk's auth() function
 */
export async function getAuthUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { user: null, userId: null };
    }

    return {
      user: session.user,
      userId: (session.user as any).id || null,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { user: null, userId: null };
  }
}

/**
 * Check if user is authenticated (replaces Clerk's auth check)
 */
export async function requireAuth() {
  const { user, userId } = await getAuthUser();

  if (!user || !userId) {
    throw new Error("Unauthorized");
  }

  return { user, userId };
}
