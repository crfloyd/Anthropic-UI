// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(function middleware(req) {}, {
  callbacks: {
    authorized: ({ token, req }) => {
      // Allow access to landing page without auth
      if (req.nextUrl.pathname === "/landing") {
        return true;
      }

      // Allow access to auth API routes
      if (req.nextUrl.pathname.startsWith("/api/auth")) {
        return true;
      }

      // Require auth for all other pages
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
