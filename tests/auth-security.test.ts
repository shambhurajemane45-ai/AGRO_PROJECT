import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  evaluateApiRoleState,
  evaluatePortalAuthorization,
  evaluateProxyRouteAccess,
  hasAdminCustomClaim,
} from "../src/lib/auth/rbac.ts";

const NOW = "2026-10-21T12:00:00.000Z";

describe("Phase A Security Verification — Authentication & RBAC", () => {
  describe("1. Customer signup and Firestore profile creation", () => {
    it("provisions an active customer profile for a valid new customer signup", () => {
      const result = evaluatePortalAuthorization({
        uid: "cust-101",
        email: "farmer@example.com",
        tokenName: "Ramesh Kumar",
        claimIsAdmin: false,
        existingProfile: null,
        options: {
          portal: "customer",
          isNewCustomerSignup: true,
          profile: {
            fullName: "Ramesh Kumar",
            mobile: "+91 9876543210",
          },
        },
        nowIso: NOW,
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.isExistingDocument, false);
        assert.equal(result.profileToPersist.uid, "cust-101");
        assert.equal(result.profileToPersist.role, "customer");
        assert.equal(result.profileToPersist.status, "active");
        assert.equal(result.profileToPersist.fullName, "Ramesh Kumar");
        assert.equal(result.profileToPersist.mobile, "+91 9876543210");
      }
    });
  });

  describe("2. Public Admin Signup prevention", () => {
    it("blocks any attempt to pass isNewCustomerSignup with portal='admin'", () => {
      const result = evaluatePortalAuthorization({
        uid: "attacker-1",
        email: "attacker@example.com",
        claimIsAdmin: false,
        existingProfile: null,
        options: {
          portal: "admin",
          isNewCustomerSignup: true,
          profile: {
            fullName: "Attacker",
            mobile: "9999999999",
          },
        },
        nowIso: NOW,
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "FORBIDDEN_ROLE");
      }
    });

    it("blocks arbitrary Firebase Auth users without admin claims or admin Firestore profile from signing into Admin Portal", () => {
      const result = evaluatePortalAuthorization({
        uid: "arbitrary-user-2",
        email: "user@example.com",
        claimIsAdmin: false,
        existingProfile: null,
        options: {
          portal: "admin",
          isNewCustomerSignup: false,
        },
        nowIso: NOW,
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "FORBIDDEN_ROLE");
      }
    });
  });

  describe("3. Pre-write portal mismatch & non-downgrade of Admin custom claims", () => {
    it("rejects an existing customer attempting Admin login BEFORE any profile persistence", () => {
      const result = evaluatePortalAuthorization({
        uid: "cust-202",
        email: "customer@example.com",
        claimIsAdmin: false,
        existingProfile: {
          uid: "cust-202",
          email: "customer@example.com",
          fullName: "Existing Customer",
          mobile: "9876543210",
          role: "customer",
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        options: {
          portal: "admin",
        },
        nowIso: NOW,
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "FORBIDDEN_ROLE");
      }
      assert.equal("profileToPersist" in result, false);
    });

    it("never downgrades a verified admin custom claim to customer when attempting customer portal login (no existing Firestore doc)", () => {
      const result = evaluatePortalAuthorization({
        uid: "admin-claim-only",
        email: "admin@company.com",
        claimIsAdmin: true,
        existingProfile: null,
        options: {
          portal: "customer",
        },
        nowIso: NOW,
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "FORBIDDEN_ROLE");
      }
      assert.equal("profileToPersist" in result, false);
    });

    it("rejects suspended accounts before any Firestore profile write", () => {
      const result = evaluatePortalAuthorization({
        uid: "suspended-admin",
        email: "suspended@company.com",
        claimIsAdmin: true,
        existingProfile: {
          uid: "suspended-admin",
          email: "suspended@company.com",
          fullName: "Suspended Admin",
          role: "admin",
          status: "suspended",
        },
        options: {
          portal: "admin",
        },
        nowIso: NOW,
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "ACCOUNT_SUSPENDED");
      }
      assert.equal("profileToPersist" in result, false);
    });

    it("authorizes a verified admin logging into the Admin Portal", () => {
      const result = evaluatePortalAuthorization({
        uid: "admin-1",
        email: "admin@company.com",
        claimIsAdmin: hasAdminCustomClaim({ role: "admin", admin: true }),
        existingProfile: null,
        options: {
          portal: "admin",
        },
        nowIso: NOW,
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.profileToPersist.role, "admin");
        assert.equal(result.profileToPersist.status, "active");
      }
    });
  });

  describe("4. Server-side API role authorization (evaluateApiRoleState)", () => {
    it("returns 401 UNAUTHENTICATED when session is missing, expired, or revoked", () => {
      const decision = evaluateApiRoleState(
        {
          status: "unauthenticated",
          error: "Invalid, expired, or revoked session. Please sign in again.",
        },
        "admin"
      );

      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.status, 401);
        assert.equal(decision.code, "UNAUTHENTICATED");
      }
    });

    it("returns 403 ACCOUNT_SUSPENDED when user account is suspended", () => {
      const decision = evaluateApiRoleState(
        {
          status: "suspended",
          error: "Account suspended.",
        },
        "admin"
      );

      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.status, 403);
        assert.equal(decision.code, "ACCOUNT_SUSPENDED");
      }
    });

    it("returns 403 FORBIDDEN_ROLE when an authenticated customer accesses an Admin API", () => {
      const decision = evaluateApiRoleState(
        {
          status: "authenticated",
          user: {
            uid: "cust-1",
            email: "customer@example.com",
            fullName: "Customer User",
            mobile: "9876543210",
            role: "customer",
            status: "active",
          },
        },
        "admin"
      );

      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.status, 403);
        assert.equal(decision.code, "FORBIDDEN_ROLE");
      }
    });

    it("allows an authenticated active admin to access an Admin API", () => {
      const decision = evaluateApiRoleState(
        {
          status: "authenticated",
          user: {
            uid: "adm-1",
            email: "admin@company.com",
            fullName: "Admin User",
            mobile: "",
            role: "admin",
            status: "active",
          },
        },
        "admin"
      );

      assert.equal(decision.ok, true);
      if (decision.ok) {
        assert.equal(decision.user.role, "admin");
      }
    });
  });

  describe("5. Proxy defense-in-depth for /admin/*, /customer/*, and /api/admin/*", () => {
    it("returns 401 JSON for unauthenticated requests to /api/admin/products", () => {
      const decision = evaluateProxyRouteAccess({
        pathname: "/api/admin/products",
        hasSessionCookie: false,
        roleCookie: undefined,
      });

      assert.deepEqual(decision, {
        action: "json_error",
        status: 401,
        code: "UNAUTHENTICATED",
        error:
          "Authentication required. An active administrator session is required for this endpoint.",
      });
    });

    it("returns 403 JSON when a customer role cookie requests /api/admin/products", () => {
      const decision = evaluateProxyRouteAccess({
        pathname: "/api/admin/products",
        hasSessionCookie: true,
        roleCookie: "customer",
      });

      assert.deepEqual(decision, {
        action: "json_error",
        status: 403,
        code: "FORBIDDEN_ROLE",
        error:
          "Access denied. Customer accounts cannot access administrative API endpoints.",
      });
    });

    it("redirects customer role cookie away from /admin/dashboard to /admin/login?reason=forbidden_role", () => {
      const decision = evaluateProxyRouteAccess({
        pathname: "/admin/dashboard",
        hasSessionCookie: true,
        roleCookie: "customer",
      });

      assert.deepEqual(decision, {
        action: "redirect",
        loginPath: "/admin/login",
        reason: "forbidden_role",
      });
    });

    it("blocks /admin/signup by redirecting unauthenticated users to /admin/login", () => {
      const decision = evaluateProxyRouteAccess({
        pathname: "/admin/signup",
        hasSessionCookie: false,
        roleCookie: undefined,
      });

      assert.deepEqual(decision, {
        action: "redirect",
        loginPath: "/admin/login",
        reason: "auth_required",
      });
    });
  });

  describe("6. Firestore security rules invariants", () => {
    const rulesPath = path.resolve(process.cwd(), "firestore.rules");
    const rulesContent = readFileSync(rulesPath, "utf8");

    it("enforces role == 'customer' on client user profile creation and prevents role escalation on update", () => {
      assert.match(
        rulesContent,
        /allow create: if isOwner\(uid\)[\s\S]*?request\.resource\.data\.role == 'customer'/
      );
      assert.match(
        rulesContent,
        /allow update: if isAdmin\(\) \|\| \([\s\S]*?resource\.data\.role == 'customer'[\s\S]*?request\.resource\.data\.role == 'customer'/
      );
      assert.match(rulesContent, /allow delete: if false;/);
    });
  });
});
