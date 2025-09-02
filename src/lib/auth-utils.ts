import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserService } from "@/lib/services/user-nextauth.service";

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { user: null, session: null };
  }

  const user = await UserService.getUserById(session.user.id);

  return { user, session };
}

export async function requireAuth() {
  const { user, session } = await getAuthenticatedUser();

  if (!user || !session) {
    throw new Error("Authentication required");
  }

  return { user, session };
}
