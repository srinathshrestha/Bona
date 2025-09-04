import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

// Middleware function that runs after NextAuth authentication
export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Admin panels guard (custom password, not NextAuth)
    const isAdminPanel =
      pathname.startsWith("/admin/testimonials") ||
      pathname.startsWith("/admin/feedback");

    if (isAdminPanel) {
      // Allow previously authorized sessions via cookie
      const cookie = req.cookies.get("admin_auth");
      if (cookie?.value === "ok") {
        return NextResponse.next();
      }
      // Not authorized -> redirect to admin auth UI
      const url = req.nextUrl.clone();
      url.pathname = "/admin/auth";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // The user is authenticated if we reach this point for non-admin routes
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
          "/admin/testimonials", // admin panels use custom auth
          "/admin/feedback",
          "/admin/auth", // custom admin auth UI
          "/api/admin/auth", // allow custom admin auth API
          "/api/admin/testimonials", // allow admin testimonials API
          "/api/admin/feedback", // allow admin feedback API
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
    "/((?!_next/static|_next/image|favicon.ico|public|api/testimonials|api/admin/file-check|api/admin/auth|api/admin/testimonials|api/admin/feedback).*)",
  ],
};
