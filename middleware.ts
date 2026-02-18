import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, generateCsrfToken, setCsrfCookie, validateCsrfToken } from "./lib/csrf";

export function middleware(request: NextRequest) {
  // Validate CSRF token on state-changing API requests (skip GET)
  if (request.nextUrl.pathname.startsWith("/api/") && request.method !== "GET") {
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingToken) {
    setCsrfCookie(response, generateCsrfToken());
  }

  return response;
}

export const config = {
  matcher: ["/get-involved", "/api/congressional-district", "/api/users"],
};
