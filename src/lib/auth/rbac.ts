import type {
  AccountStatus,
  PortalRole,
  UserProfileRecord,
  VerifiedSessionUser,
} from "../../types/index.ts";
import {
  ADMIN_LOGIN_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_SIGNUP_PATH,
} from "./constants.ts";

export interface ProvisionOrVerifyUserOptions {
  portal: PortalRole;
  isNewCustomerSignup?: boolean;
  profile?: {
    fullName: string;
    mobile: string;
  };
}

export type ProvisionOrVerifyResult =
  | {
      ok: true;
      user: VerifiedSessionUser;
    }
  | {
      ok: false;
      code: "FORBIDDEN_ROLE" | "ACCOUNT_SUSPENDED";
      error: string;
    };

export interface PortalAuthorizationEvaluationInput {
  uid: string;
  email: string;
  tokenName?: string;
  claimIsAdmin: boolean;
  existingProfile: Partial<UserProfileRecord> | null;
  options: ProvisionOrVerifyUserOptions;
  nowIso: string;
}

export type PortalAuthorizationEvaluationResult =
  | {
      ok: true;
      isExistingDocument: boolean;
      profileToPersist: UserProfileRecord;
    }
  | {
      ok: false;
      code: "FORBIDDEN_ROLE" | "ACCOUNT_SUSPENDED";
      error: string;
    };

export function hasAdminCustomClaim(
  token: Record<string, unknown> | null | undefined
): boolean {
  if (!token || typeof token !== "object") {
    return false;
  }
  return token.role === "admin" || token.admin === true;
}

/**
 * Pure, deterministic evaluation of portal authorization and profile state BEFORE any
 * Firestore write or custom claim mutation occurs.
 *
 * Security invariants enforced:
 * 1. A verified admin custom claim (`claimIsAdmin === true`) is NEVER downgraded to 'customer',
 *    even if the user attempts to sign in through the customer portal.
 * 2. Suspended accounts (`status === "suspended"`) are rejected immediately before any write.
 * 3. Portal-to-role mismatches (`portal !== resolvedRole`) are rejected immediately before any write.
 * 4. Public sign-ups and non-admin tokens can never acquire the 'admin' role.
 */
export function evaluatePortalAuthorization(
  input: PortalAuthorizationEvaluationInput
): PortalAuthorizationEvaluationResult {
  const {
    uid,
    email,
    tokenName,
    claimIsAdmin,
    existingProfile,
    options,
    nowIso,
  } = input;

  if (options.isNewCustomerSignup && options.portal !== "customer") {
    return {
      ok: false,
      code: "FORBIDDEN_ROLE",
      error: "Public registration is restricted strictly to customer accounts.",
    };
  }

  const isExistingDocument = existingProfile !== null;

  // Authoritative role resolution:
  // - Never downgrade a verified admin custom claim to customer.
  // - Existing Firestore admin role is respected; otherwise defaults to 'customer'.
  const resolvedRole: PortalRole =
    claimIsAdmin || existingProfile?.role === "admin" ? "admin" : "customer";

  const resolvedStatus: AccountStatus =
    existingProfile?.status === "suspended" ? "suspended" : "active";

  // 1. Check account suspension BEFORE any database write or claim update
  if (resolvedStatus === "suspended") {
    return {
      ok: false,
      code: "ACCOUNT_SUSPENDED",
      error:
        "Your account is currently suspended. Please contact company support for assistance.",
    };
  }

  // 2. Enforce strict portal-to-role matching BEFORE any database write or claim update
  if (options.portal === "admin" && resolvedRole !== "admin") {
    return {
      ok: false,
      code: "FORBIDDEN_ROLE",
      error: isExistingDocument
        ? "Access denied. Customer accounts cannot sign in to the Manufacturing Administration Portal."
        : "Access denied. This account is not authorized for the Manufacturing Administration Portal.",
    };
  }

  if (options.portal === "customer" && resolvedRole !== "customer") {
    return {
      ok: false,
      code: "FORBIDDEN_ROLE",
      error:
        "Administrator accounts must sign in through the Admin Portal (/admin/login).",
    };
  }

  const defaultDisplayName =
    resolvedRole === "admin" ? "Authorized Administrator" : "Customer";

  const profileToPersist: UserProfileRecord = isExistingDocument
    ? {
        uid,
        email: existingProfile.email ?? email,
        fullName:
          existingProfile.fullName?.trim() ||
          options.profile?.fullName?.trim() ||
          tokenName ||
          email.split("@")[0] ||
          defaultDisplayName,
        mobile:
          existingProfile.mobile?.trim() ||
          options.profile?.mobile?.trim() ||
          "",
        role: resolvedRole,
        status: resolvedStatus,
        createdAt: existingProfile.createdAt ?? nowIso,
        updatedAt: nowIso,
      }
    : {
        uid,
        email,
        fullName:
          options.profile?.fullName?.trim() ||
          tokenName ||
          email.split("@")[0] ||
          defaultDisplayName,
        mobile: options.profile?.mobile?.trim() || "",
        role: resolvedRole,
        status: "active",
        createdAt: nowIso,
        updatedAt: nowIso,
      };

  return {
    ok: true,
    isExistingDocument,
    profileToPersist,
  };
}

export type ServerSessionState =
  | {
      status: "authenticated";
      user: VerifiedSessionUser;
    }
  | {
      status: "unconfigured";
      error: string;
    }
  | {
      status: "unauthenticated";
      error: string;
    }
  | {
      status: "suspended";
      error: string;
    };

export type ApiRoleDecision =
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
    };

/**
 * Evaluates a resolved `ServerSessionState` against a required `PortalRole` for API endpoints.
 */
export function evaluateApiRoleState(
  state: ServerSessionState,
  expectedRole: PortalRole
): ApiRoleDecision {
  if (state.status === "unconfigured") {
    return {
      ok: false,
      status: 503,
      code: "UNCONFIGURED",
      error: state.error,
    };
  }

  if (state.status === "unauthenticated") {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHENTICATED",
      error: state.error,
    };
  }

  if (state.status === "suspended") {
    return {
      ok: false,
      status: 403,
      code: "ACCOUNT_SUSPENDED",
      error: state.error,
    };
  }

  if (state.user.role !== expectedRole) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN_ROLE",
      error:
        expectedRole === "admin"
          ? "Access denied. An active administrator session is required for this endpoint."
          : "Access denied. An active customer session is required for this endpoint.",
    };
  }

  return {
    ok: true,
    user: state.user,
  };
}

const PUBLIC_CUSTOMER_PATHS = new Set([
  "/customer",
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_SIGNUP_PATH,
]);

const PUBLIC_ADMIN_PATHS = new Set(["/admin", ADMIN_LOGIN_PATH]);

export type ProxyRouteDecision =
  | {
      action: "allow";
    }
  | {
      action: "redirect";
      loginPath: string;
      reason: "auth_required" | "forbidden_role";
    }
  | {
      action: "json_error";
      status: 401 | 403;
      code: "UNAUTHENTICATED" | "FORBIDDEN_ROLE";
      error: string;
    };

/**
 * Pure request-level proxy boundary evaluation for /customer/*, /admin/*, and /api/admin/*.
 * Note: Passing the proxy only permits the request to reach the Server Component or Route Handler,
 * where Firebase Admin SDK cryptographic session verification and Firestore RBAC are enforced.
 */
export function evaluateProxyRouteAccess(params: {
  pathname: string;
  hasSessionCookie: boolean;
  roleCookie?: string;
}): ProxyRouteDecision {
  const { pathname, hasSessionCookie, roleCookie } = params;

  const isAdminApiRoute =
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (isAdminApiRoute) {
    if (!hasSessionCookie) {
      return {
        action: "json_error",
        status: 401,
        code: "UNAUTHENTICATED",
        error:
          "Authentication required. An active administrator session is required for this endpoint.",
      };
    }

    if (roleCookie !== "admin") {
      return {
        action: "json_error",
        status: 403,
        code: "FORBIDDEN_ROLE",
        error:
          "Access denied. Customer accounts cannot access administrative API endpoints.",
      };
    }

    return { action: "allow" };
  }

  const isCustomerApiRoute =
    pathname === "/api/customer" || pathname.startsWith("/api/customer/");

  if (isCustomerApiRoute) {
    if (!hasSessionCookie) {
      return {
        action: "json_error",
        status: 401,
        code: "UNAUTHENTICATED",
        error:
          "Authentication required. An active customer session is required for this endpoint.",
      };
    }

    if (roleCookie !== "customer") {
      return {
        action: "json_error",
        status: 403,
        code: "FORBIDDEN_ROLE",
        error:
          "Access denied. Only customer accounts can access customer shopping API endpoints.",
      };
    }

    return { action: "allow" };
  }

  const isCustomerRoute =
    pathname === "/customer" || pathname.startsWith("/customer/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isCustomerRoute && !PUBLIC_CUSTOMER_PATHS.has(pathname)) {
    if (!hasSessionCookie) {
      return {
        action: "redirect",
        loginPath: CUSTOMER_LOGIN_PATH,
        reason: "auth_required",
      };
    }

    if (roleCookie !== "customer") {
      return {
        action: "redirect",
        loginPath: CUSTOMER_LOGIN_PATH,
        reason: "forbidden_role",
      };
    }
  }

  if (isAdminRoute && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    if (!hasSessionCookie) {
      return {
        action: "redirect",
        loginPath: ADMIN_LOGIN_PATH,
        reason: "auth_required",
      };
    }

    if (roleCookie !== "admin") {
      return {
        action: "redirect",
        loginPath: ADMIN_LOGIN_PATH,
        reason: "forbidden_role",
      };
    }
  }

  return { action: "allow" };
}
