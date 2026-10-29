import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type {
  AuthSessionRequestPayload,
  AuthSessionResponsePayload,
  PortalRole,
} from "@/types";
import {
  getDashboardPathForRole,
  ROLE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/constants";
import {
  getFirebaseAdminAuth,
  isFirebaseAdminConfigured,
} from "@/lib/firebase/admin";
import {
  resolveAndAuthorizeUserForPortal,
  resolveServerSessionState,
} from "@/lib/auth/server";

const MOBILE_PATTERN = /^\+?[0-9\s-]{10,15}$/;

function isValidPortalRole(value: unknown): value is PortalRole {
  return value === "customer" || value === "admin";
}

export async function GET() {
  const state = await resolveServerSessionState();

  if (state.status === "unconfigured") {
    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "UNCONFIGURED",
        error: state.error,
      },
      { status: 503 }
    );
  }

  if (state.status === "suspended") {
    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "ACCOUNT_SUSPENDED",
        error: state.error,
      },
      { status: 403 }
    );
  }

  if (state.status === "unauthenticated") {
    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "UNAUTHENTICATED",
      },
      { status: 401 }
    );
  }

  return NextResponse.json<AuthSessionResponsePayload>({
    authenticated: true,
    user: state.user,
    redirectTo: getDashboardPathForRole(state.user.role),
  });
}

export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "UNCONFIGURED",
        error:
          "Firebase Admin SDK is not configured on the server. Populate FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local.",
      },
      { status: 503 }
    );
  }

  let body: Partial<AuthSessionRequestPayload>;
  try {
    body = (await request.json()) as Partial<AuthSessionRequestPayload>;
  } catch {
    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "INVALID_REQUEST",
        error: "Invalid JSON request payload.",
      },
      { status: 400 }
    );
  }

  const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
  const portal = body.portal;
  const isNewCustomerSignup = Boolean(body.isNewCustomerSignup);

  if (!idToken || !isValidPortalRole(portal)) {
    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "INVALID_REQUEST",
        error: "Missing or invalid authentication token or portal role.",
      },
      { status: 400 }
    );
  }

  // Block any attempt to use the signup flag with the admin portal
  if (isNewCustomerSignup && portal !== "customer") {
    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "FORBIDDEN_ROLE",
        error: "Public registration is restricted strictly to customer accounts.",
      },
      { status: 403 }
    );
  }

  if (isNewCustomerSignup) {
    const fullName = body.profile?.fullName?.trim() ?? "";
    const mobile = body.profile?.mobile?.trim() ?? "";
    if (fullName.length < 2 || !MOBILE_PATTERN.test(mobile)) {
      return NextResponse.json<AuthSessionResponsePayload>(
        {
          authenticated: false,
          code: "INVALID_REQUEST",
          error:
            "Customer registration requires a valid full name and 10 to 15 digit mobile number.",
        },
        { status: 400 }
      );
    }
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    const authResult = await resolveAndAuthorizeUserForPortal(decodedToken, {
      portal,
      isNewCustomerSignup,
      profile: body.profile,
    });

    const cookieStore = await cookies();

    if (!authResult.ok) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      cookieStore.delete(ROLE_COOKIE_NAME);

      return NextResponse.json<AuthSessionResponsePayload>(
        {
          authenticated: false,
          code: authResult.code,
          error: authResult.error,
        },
        { status: 403 }
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const isProduction = process.env.NODE_ENV === "production";

    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    });

    cookieStore.set(ROLE_COOKIE_NAME, authResult.user.role, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    });

    return NextResponse.json<AuthSessionResponsePayload>({
      authenticated: true,
      user: authResult.user,
      redirectTo: getDashboardPathForRole(authResult.user.role),
    });
  } catch {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(ROLE_COOKIE_NAME);

    return NextResponse.json<AuthSessionResponsePayload>(
      {
        authenticated: false,
        code: "UNAUTHENTICATED",
        error:
          "Failed to verify authentication token on the server. Please sign in again.",
      },
      { status: 401 }
    );
  }
}
