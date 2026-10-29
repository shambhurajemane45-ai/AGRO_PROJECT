import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ROLE_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  getFirebaseAdminAuth,
  isFirebaseAdminConfigured,
} from "@/lib/firebase/admin";

export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie && isFirebaseAdminConfigured()) {
    try {
      const adminAuth = getFirebaseAdminAuth();
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedClaims.sub);
    } catch {
      // Session cookie may already be expired or invalid; proceed to clear cookies
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ROLE_COOKIE_NAME);

  return NextResponse.json({ authenticated: false });
}
