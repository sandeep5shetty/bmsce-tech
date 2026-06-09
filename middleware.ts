import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/placement",
  "/questions",
  "/random-picker",
  "/dashboard",
  "/quiz",
];

const QUIZ_PUBLIC_PREFIXES = ["/quiz/join", "/quiz/play"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isQuizPublic = QUIZ_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const isProtected =
    !isQuizPublic &&
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (!isProtected) return NextResponse.next();

  // Better Auth stores the session in this cookie
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/placement/:path*",
    "/questions/:path*",
    "/random-picker/:path*",
    "/dashboard/:path*",
    "/quiz",
    "/quiz/events/:path*",
    "/quiz/sessions/:path*",
  ],
};
