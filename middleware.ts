import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE_NAME, generateCsrfToken, setCsrfCookie } from "./lib/csrf";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingToken) {
    setCsrfCookie(response, generateCsrfToken());
  }

  return response;
}

export const config = {
  matcher: ["/get-involved", "/api/congressional-district"],
};
