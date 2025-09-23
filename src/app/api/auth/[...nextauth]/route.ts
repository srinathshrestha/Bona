import NextAuth, { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb-client";
import bcrypt from "bcryptjs";
import { User } from "@/lib/models/user.model";
import connectMongoDB from "@/lib/mongodb";
import { JWT } from "next-auth/jwt";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      username?: string | null;
      isOnboarded?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    username?: string | null;
    isOnboarded?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    username?: string | null;
    isOnboarded?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    // Email/Password authentication only
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Check if credentials are provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Connect to database
        await connectMongoDB();

        // Find user by email
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Check if user has a password (credential-based auth only)
        if (!user.password) {
          // Account exists without a password (legacy social accounts)
          // Ask user to reset password to proceed
          throw new Error(
            "No password set for this account. Please reset your password."
          );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Return user object for session
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName || user.username,
          username: user.username,
          isOnboarded: user.isOnboarded,
        };
      },
    }),
  ],

  // Use MongoDB adapter for session storage
  adapter: MongoDBAdapter(clientPromise),

  // Enable debug mode for better error logging
  debug: process.env.NODE_ENV === "development",

  // No OAuth events needed; credentials-only flow

  // Configure session strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure JWT
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure pages
  pages: {
    signIn: "/sign-in",
    signOut: "/",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/onboarding",
  },

  // Callbacks for customizing behavior
  callbacks: {
    async signIn() {
      // Allow all sign-ins - let the adapter handle user creation/linking
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.username = user.username;
        token.isOnboarded = user.isOnboarded;
      }

      // Fetch fresh user data from database if we have a user ID
      if (token.id && !user) {
        try {
          await connectMongoDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            token.username = dbUser.username;
            token.isOnboarded = dbUser.isOnboarded;
          }
        } catch (error) {
          console.error("Error fetching user data in JWT callback:", error);
        }
      }

      // Update token when session is updated
      if (trigger === "update" && session) {
        token.username = session.user.username;
        token.isOnboarded = session.user.isOnboarded;
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.username = token.username;
        session.user.isOnboarded = token.isOnboarded;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle redirects after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Configure security
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
