import { NextResponse, type NextRequest } from "next/server";
import {
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { evaluateProxyRouteAccess } from "@/lib/auth/rbac";

/**
 * Next.js 16 Proxy boundary for /customer/*, /admin/*, and /api/admin/* routes.
 *
 * Note on Defense-in-Depth:
 * Cookie presence in this proxy is NEVER treated as authentication by itself.
 * This proxy enforces fast edge/request-level redirects or 401/403 JSON rejections when
 * session or role cookies are absent or mismatched. Full cryptographic verification of
 * the Firebase Admin session cookie, token revocation status, and authoritative Firestore
 * role/status record is strictly enforced on the server inside `requireRoleSession()`
 * and `requireApiRoleSession()` using the Firebase Admin SDK.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;

  const decision = evaluateProxyRouteAccess({
    pathname,
    hasSessionCookie: Boolean(sessionCookie),
    roleCookie,
  });

  if (decision.action === "json_error") {
    return NextResponse.json(
      {
        ok: false,
        code: decision.code,
        error: decision.error,
      },
      { status: decision.status }
    );
  }

  if (decision.action === "redirect") {
    const loginUrl = new URL(decision.loginPath, request.url);
    loginUrl.searchParams.set("reason", decision.reason);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/customer/:path*",
  ],
};
