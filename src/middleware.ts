import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Middleware function that runs after NextAuth authentication
export default withAuth(
  function middleware(req) {
    // The user is authenticated if we reach this point
    // You can add additional logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback is called to determine if the user is authorized
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicPaths = [
          "/",
          "/sign-in",
          "/sign-up",
          "/auth/error",
          "/auth/verify",
          "/api/auth", // NextAuth routes
          "/join", // Allow access to invitation links
        ];

        // Check if the current path is public
        const isPublicPath = publicPaths.some(
          (path) => pathname === path || pathname.startsWith(`${path}/`)
        );

        // Allow public paths without authentication
        if (isPublicPath) {
          return true;
        }

        // Check if user is authenticated for protected routes
        return !!token;
      },
    },
    pages: {
      signIn: "/sign-in",
      error: "/auth/error",
    },
  }
);

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/testimonials|api/admin/file-check).*)",
  ],
};
