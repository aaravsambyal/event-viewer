import { NextResponse, NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  if (
    pathname === "/" ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/api/events") ||
    pathname === "/login" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/unauthorized"
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes
  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Member routes
  if (
    pathname.startsWith("/member") &&
    session.role !== "member" &&
    session.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // API role guards for member management
  if (pathname.startsWith("/api/members") && session.role !== "admin") {
    // Allow members to read their own data via GET for event assignment
    if (request.method !== "GET") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
