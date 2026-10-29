import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection, NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import type {
  PortalRole,
  UserProfileRecord,
  VerifiedSessionUser,
} from "@/types";
import {
  ADMIN_LOGIN_PATH,
  CUSTOMER_LOGIN_PATH,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  evaluateApiRoleState,
  evaluatePortalAuthorization,
  hasAdminCustomClaim,
  type ApiRoleDecision,
  type PortalAuthorizationEvaluationInput,
  type PortalAuthorizationEvaluationResult,
  type ProvisionOrVerifyResult,
  type ProvisionOrVerifyUserOptions,
  type ServerSessionState,
} from "@/lib/auth/rbac";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/firebase/admin";

if (typeof window !== "undefined") {
  throw new Error(
    "CRITICAL SECURITY VIOLATION: src/lib/auth/server.ts is server-only and must never be imported in browser code."
  );
}

export {
  evaluateApiRoleState,
  evaluatePortalAuthorization,
  hasAdminCustomClaim,
  type ApiRoleDecision,
  type PortalAuthorizationEvaluationInput,
  type PortalAuthorizationEvaluationResult,
  type ProvisionOrVerifyResult,
  type ProvisionOrVerifyUserOptions,
  type ServerSessionState,
};

/**
 * Resolves and enforces server-side Role-Based Access Control (RBAC) for a verified Firebase token.
 *
 * Security invariants:
 * 1. Public customer sign-up can ONLY create a 'customer' role profile.
 * 2. Admin login requires an explicit verified 'admin' custom claim OR an existing server-verified
 *    Firestore user profile with `role === "admin"` and `status === "active"`.
 * 3. Customer login requires `role === "customer"` and `status === "active"`.
 * 4. Suspended-account and portal-role mismatch checks occur strictly BEFORE any Firestore write
 *    or custom claim update.
 */
export async function resolveAndAuthorizeUserForPortal(
  decodedToken: DecodedIdToken,
  options: ProvisionOrVerifyUserOptions
): Promise<ProvisionOrVerifyResult> {
  const adminDb = getFirebaseAdminDb();
  const adminAuth = getFirebaseAdminAuth();

  const uid = decodedToken.uid;
  const email = (decodedToken.email ?? "").trim().toLowerCase();
  const userDocRef = adminDb.collection("users").doc(uid);
  const userSnapshot = await userDocRef.get();

  const claimIsAdmin = hasAdminCustomClaim(decodedToken);
  const nowIso = new Date().toISOString();

  const existingProfile = userSnapshot.exists
    ? (userSnapshot.data() as Partial<UserProfileRecord>)
    : null;

  const evaluation = evaluatePortalAuthorization({
    uid,
    email,
    tokenName: decodedToken.name,
    claimIsAdmin,
    existingProfile,
    options,
    nowIso,
  });

  if (!evaluation.ok) {
    return evaluation;
  }

  const { profileToPersist, isExistingDocument } = evaluation;

  if (isExistingDocument) {
    await userDocRef.set(profileToPersist, { merge: true });
  } else {
    await userDocRef.set(profileToPersist);
  }

  // Ensure custom claims stay synchronized with the verified Firestore role
  const currentClaimRole = (decodedToken as Record<string, unknown>).role;
  const currentClaimAdmin = (decodedToken as Record<string, unknown>).admin;
  const expectedAdminFlag = profileToPersist.role === "admin";

  if (
    currentClaimRole !== profileToPersist.role ||
    currentClaimAdmin !== expectedAdminFlag
  ) {
    try {
      await adminAuth.setCustomUserClaims(uid, {
        role: profileToPersist.role,
        admin: expectedAdminFlag,
      });
    } catch {
      // Non-fatal if custom claims update fails; Firestore profile remains authoritative
    }
  }

  return {
    ok: true,
    user: {
      uid: profileToPersist.uid,
      email: profileToPersist.email,
      fullName: profileToPersist.fullName,
      mobile: profileToPersist.mobile,
      role: profileToPersist.role,
      status: profileToPersist.status,
    },
  };
}

/**
 * Resolves the complete server session state by verifying the Firebase Admin session cookie
 * (with revocation check enabled) and inspecting the authoritative Firestore user record.
 */
export async function resolveServerSessionState(): Promise<ServerSessionState> {
  await connection();

  if (!isFirebaseAdminConfigured()) {
    return {
      status: "unconfigured",
      error:
        "Firebase Admin SDK is not configured on the server. Populate FIREBASE_ADMIN_* variables in .env.local.",
    };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return {
      status: "unauthenticated",
      error: "Authentication required. Please sign in to continue.",
    };
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const adminDb = getFirebaseAdminDb();

    // Check revocation (true) to ensure signed-out or disabled sessions are rejected immediately
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    const userDoc = await adminDb
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    const claimIsAdmin = hasAdminCustomClaim(decodedClaims);

    if (!userDoc.exists) {
      if (claimIsAdmin) {
        return {
          status: "authenticated",
          user: {
            uid: decodedClaims.uid,
            email: decodedClaims.email ?? "",
            fullName: decodedClaims.name ?? "Authorized Administrator",
            mobile: "",
            role: "admin",
            status: "active",
          },
        };
      }
      return {
        status: "unauthenticated",
        error: "User profile record not found. Please sign in again.",
      };
    }

    const data = userDoc.data() as Partial<UserProfileRecord>;
    if (data.status === "suspended") {
      return {
        status: "suspended",
        error:
          "Your account is currently suspended. Please contact company support.",
      };
    }

    const role: PortalRole =
      claimIsAdmin || data.role === "admin" ? "admin" : "customer";

    return {
      status: "authenticated",
      user: {
        uid: decodedClaims.uid,
        email: data.email ?? decodedClaims.email ?? "",
        fullName:
          data.fullName ??
          decodedClaims.name ??
          (role === "admin" ? "Authorized Administrator" : "Customer"),
        mobile: data.mobile ?? "",
        role,
        status: "active",
      },
    };
  } catch {
    return {
      status: "unauthenticated",
      error: "Invalid, expired, or revoked session. Please sign in again.",
    };
  }
}

/**
 * Verifies the active server session cookie using Firebase Admin SDK and returns
 * the authenticated user and their server-verified role, or null if unauthenticated.
 */
export async function verifyServerSession(): Promise<VerifiedSessionUser | null> {
  const state = await resolveServerSessionState();
  return state.status === "authenticated" ? state.user : null;
}

export type ApiRoleAuthorizationResult =
  | {
      ok: true;
      user: VerifiedSessionUser;
    }
  | {
      ok: false;
      status: 401 | 403 | 503;
      code:
        | "UNCONFIGURED"
        | "UNAUTHENTICATED"
        | "ACCOUNT_SUSPENDED"
        | "FORBIDDEN_ROLE";
      error: string;
      response: NextResponse;
    };

/**
 * Enforces server-side authentication, revocation status, active account status,
 * and authoritative role authorization for JSON API Route Handlers.
 * Returns structured 401/403/503 JSON responses when unauthorized.
 */
export async function requireApiRoleSession(
  expectedRole: PortalRole
): Promise<ApiRoleAuthorizationResult> {
  const state = await resolveServerSessionState();
  const decision = evaluateApiRoleState(state, expectedRole);

  if (!decision.ok) {
    return {
      ...decision,
      response: NextResponse.json(
        {
          ok: false,
          code: decision.code,
          error: decision.error,
        },
        { status: decision.status }
      ),
    };
  }

  return decision;
}

/**
 * Enforces server-side authentication and strict role authorization for protected Server Components.
 * Redirects unauthenticated or unauthorized users to the appropriate login route.
 */
export async function requireRoleSession(
  expectedRole: PortalRole
): Promise<VerifiedSessionUser> {
  const sessionUser = await verifyServerSession();

  if (!sessionUser) {
    const targetLogin =
      expectedRole === "admin" ? ADMIN_LOGIN_PATH : CUSTOMER_LOGIN_PATH;
    redirect(`${targetLogin}?reason=auth_required`);
  }

  if (sessionUser.role !== expectedRole) {
    const targetLogin =
      expectedRole === "admin" ? ADMIN_LOGIN_PATH : CUSTOMER_LOGIN_PATH;
    redirect(`${targetLogin}?reason=forbidden_role`);
  }

  return sessionUser;
}
