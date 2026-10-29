import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  OrderRecord,
} from "../src/types/index.ts";
import {
  evaluateApiRoleState,
  evaluateProxyRouteAccess,
  type ServerSessionState,
} from "../src/lib/auth/rbac.ts";
import {
  toCustomerOrderView,
  validateAdminOrderStatusTransition,
} from "../src/lib/orders/index.ts";
import {
  mapFirestoreDocToOrder,
  sanitizeOrderForFirestore,
} from "../src/lib/orders/server.ts";
import { TRANSLATIONS } from "../src/lib/language/index.ts";

function makeSampleOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ord-doc-101",
    orderNumber: "ORD-20261026-A1B2C3",
    customerUid: "cust-uid-1001",
    customerEmail: "ramesh.patil@example.com",
    items: [
      {
        productId: "prod-bio-101",
        sku: "AGRO-BIO-101",
        name: "Bio-Potash Liquid Formulation",
        category: "Bio-Fertilizers",
        packSize: "1 L",
        unitPrice: 640.5,
        quantity: 2,
        lineSubtotal: 1281,
      },
    ],
    subtotal: 1281,
    total: 1281,
    totalItems: 2,
    uniqueItems: 1,
    deliveryDetails: {
      customerName: "Ramesh Patil",
      mobile: "9876543210",
      addressLine: "Plot 14, Near Krishi Seva Kendra, Main Road",
      villageOrCity: "Baramati",
      district: "Pune",
      state: "Maharashtra",
      pinCode: "413102",
    },
    orderStatus: "pending_verification",
    paymentStatus: "unpaid",
    idempotencyKey: "ik:cust-uid-1001:test-order-key",
    createdAt: "2026-10-26T10:00:00.000Z",
    updatedAt: "2026-10-26T10:00:00.000Z",
    ...overrides,
  };
}

describe("Phase 4.3 — Admin Order Management", () => {
  describe("1. Admin Authorization & Customer Access Denial", () => {
    it("authorizes an active admin session to access admin order endpoints", () => {
      const adminSession: ServerSessionState = {
        status: "authenticated",
        user: {
          uid: "admin-uid-001",
          email: "admin@supriyaagro.com",
          fullName: "Admin Officer",
          mobile: "9876543211",
          role: "admin",
          status: "active",
        },
      };

      const decision = evaluateApiRoleState(adminSession, "admin");
      assert.equal(decision.ok, true);
      if (decision.ok) {
        assert.equal(decision.user.role, "admin");
        assert.equal(decision.user.uid, "admin-uid-001");
      }
    });

    it("denies authenticated customer accounts access to admin order APIs with 403 FORBIDDEN_ROLE", () => {
      const customerSession: ServerSessionState = {
        status: "authenticated",
        user: {
          uid: "cust-uid-1001",
          email: "customer@example.com",
          fullName: "Ramesh Patil",
          mobile: "9876543210",
          role: "customer",
          status: "active",
        },
      };

      const decision = evaluateApiRoleState(customerSession, "admin");
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.status, 403);
        assert.equal(decision.code, "FORBIDDEN_ROLE");
        assert.match(decision.error, /administrator session is required/i);
      }
    });

    it("denies unauthenticated requests with 401 UNAUTHENTICATED", () => {
      const unauthSession: ServerSessionState = {
        status: "unauthenticated",
        error: "Authentication required.",
      };

      const decision = evaluateApiRoleState(unauthSession, "admin");
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.status, 401);
        assert.equal(decision.code, "UNAUTHENTICATED");
      }
    });

    it("denies suspended admin accounts with 403 ACCOUNT_SUSPENDED", () => {
      const suspendedSession: ServerSessionState = {
        status: "suspended",
        error: "Your account is suspended.",
      };

      const decision = evaluateApiRoleState(suspendedSession, "admin");
      assert.equal(decision.ok, false);
      if (!decision.ok) {
        assert.equal(decision.status, 403);
        assert.equal(decision.code, "ACCOUNT_SUSPENDED");
      }
    });

    it("enforces proxy boundary access control for admin order routes", () => {
      // Unauthenticated access to /api/admin/orders
      const unauthApi = evaluateProxyRouteAccess({
        pathname: "/api/admin/orders",
        hasSessionCookie: false,
      });
      assert.equal(unauthApi.action, "json_error");
      if (unauthApi.action === "json_error") {
        assert.equal(unauthApi.status, 401);
      }

      // Customer cookie attempting /api/admin/orders
      const customerApi = evaluateProxyRouteAccess({
        pathname: "/api/admin/orders",
        hasSessionCookie: true,
        roleCookie: "customer",
      });
      assert.equal(customerApi.action, "json_error");
      if (customerApi.action === "json_error") {
        assert.equal(customerApi.status, 403);
      }

      // Customer cookie attempting /admin/orders page
      const customerPage = evaluateProxyRouteAccess({
        pathname: "/admin/orders",
        hasSessionCookie: true,
        roleCookie: "customer",
      });
      assert.equal(customerPage.action, "redirect");
      if (customerPage.action === "redirect") {
        assert.equal(customerPage.reason, "forbidden_role");
      }

      // Admin cookie accessing /api/admin/orders and /admin/orders
      const adminApi = evaluateProxyRouteAccess({
        pathname: "/api/admin/orders",
        hasSessionCookie: true,
        roleCookie: "admin",
      });
      assert.equal(adminApi.action, "allow");

      const adminPage = evaluateProxyRouteAccess({
        pathname: "/admin/orders",
        hasSessionCookie: true,
        roleCookie: "admin",
      });
      assert.equal(adminPage.action, "allow");
    });
  });

  describe("2. Valid Order Status Transitions (Verify and Reject)", () => {
    it("successfully verifies a pending order, sets verifiedAt and verifiedByUid, and keeps paymentStatus unchanged", () => {
      const order = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });

      const fixedNow = "2026-10-26T12:00:00.000Z";
      const result = validateAdminOrderStatusTransition(
        order,
        "verify",
        "admin-uid-001",
        undefined,
        fixedNow
      );

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.orderStatus, "verified");
        assert.equal(result.updatedOrder.verifiedAt, fixedNow);
        assert.equal(result.updatedOrder.verifiedByUid, "admin-uid-001");
        assert.equal(result.updatedOrder.updatedAt, fixedNow);

        // Invariant 9: Payment status must remain independent and unpaid
        assert.equal(
          result.updatedOrder.paymentStatus,
          "unpaid",
          "Verification must NEVER mark paymentStatus as paid"
        );
      }
    });

    it("successfully rejects a pending order, records rejectedAt, rejectedByUid, and rejectionReason", () => {
      const order = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });

      const fixedNow = "2026-10-26T12:30:00.000Z";
      const result = validateAdminOrderStatusTransition(
        order,
        "reject",
        "admin-uid-002",
        "Delivery address outside verified delivery territory.",
        fixedNow
      );

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.orderStatus, "rejected");
        assert.equal(result.updatedOrder.rejectedAt, fixedNow);
        assert.equal(result.updatedOrder.rejectedByUid, "admin-uid-002");
        assert.equal(
          result.updatedOrder.rejectionReason,
          "Delivery address outside verified delivery territory."
        );
        assert.equal(result.updatedOrder.updatedAt, fixedNow);

        // Payment status must remain independent
        assert.equal(result.updatedOrder.paymentStatus, "unpaid");
      }
    });

    it("successfully rejects a pending order without rejection reason and leaves rejectionReason omitted", () => {
      const order = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });

      const fixedNow = "2026-10-26T12:35:00.000Z";
      const result = validateAdminOrderStatusTransition(
        order,
        "reject",
        "admin-uid-003",
        "   ", // whitespace only
        fixedNow
      );

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.orderStatus, "rejected");
        assert.equal(result.updatedOrder.rejectedAt, fixedNow);
        assert.equal(result.updatedOrder.rejectedByUid, "admin-uid-003");
        assert.equal("rejectionReason" in result.updatedOrder, false);
        assert.equal(result.updatedOrder.paymentStatus, "unpaid");
      }
    });

    it("never marks payment as paid or modifies paymentStatus during rejection", () => {
      // Test 1: unpaid order stays unpaid
      const unpaidOrder = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });
      const rejectUnpaid = validateAdminOrderStatusTransition(
        unpaidOrder,
        "reject",
        "admin-uid-004"
      );
      assert.equal(rejectUnpaid.ok, true);
      if (rejectUnpaid.ok) {
        assert.equal(rejectUnpaid.updatedOrder.paymentStatus, "unpaid");
      }

      // Test 2: paid order (e.g. advance paid) stays paid
      const paidOrder = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "paid",
      });
      const rejectPaid = validateAdminOrderStatusTransition(
        paidOrder,
        "reject",
        "admin-uid-004",
        "Out of stock"
      );
      assert.equal(rejectPaid.ok, true);
      if (rejectPaid.ok) {
        assert.equal(rejectPaid.updatedOrder.paymentStatus, "paid");
      }
    });
  });

  describe("3. Rejection of Invalid Status Transitions & Invalid Requests", () => {
    it("rejects attempt to verify an already verified order", () => {
      const order = makeSampleOrder({
        orderStatus: "verified",
        verifiedAt: "2026-10-26T11:00:00.000Z",
        verifiedByUid: "admin-uid-001",
      });

      const result = validateAdminOrderStatusTransition(
        order,
        "verify",
        "admin-uid-001"
      );

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "INVALID_STATUS_TRANSITION");
        assert.match(result.error, /already been verified/i);
      }
    });

    it("rejects attempt to reject an already verified order", () => {
      const order = makeSampleOrder({
        orderStatus: "verified",
        verifiedAt: "2026-10-26T11:00:00.000Z",
        verifiedByUid: "admin-uid-001",
      });

      const result = validateAdminOrderStatusTransition(
        order,
        "reject",
        "admin-uid-001",
        "Too late to reject"
      );

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "INVALID_STATUS_TRANSITION");
        assert.match(result.error, /already been verified/i);
      }
    });

    it("rejects attempt to verify or reject an already rejected order", () => {
      const order = makeSampleOrder({
        orderStatus: "rejected",
        rejectedAt: "2026-10-26T11:00:00.000Z",
        rejectedByUid: "admin-uid-002",
      });

      const verifyResult = validateAdminOrderStatusTransition(
        order,
        "verify",
        "admin-uid-001"
      );
      assert.equal(verifyResult.ok, false);
      if (!verifyResult.ok) {
        assert.equal(verifyResult.code, "INVALID_STATUS_TRANSITION");
        assert.match(verifyResult.error, /already been rejected/i);
      }

      const rejectResult = validateAdminOrderStatusTransition(
        order,
        "reject",
        "admin-uid-001"
      );
      assert.equal(rejectResult.ok, false);
      if (!rejectResult.ok) {
        assert.equal(rejectResult.code, "INVALID_STATUS_TRANSITION");
        assert.match(rejectResult.error, /already been rejected/i);
      }
    });

    it("rejects attempt to verify or reject a cancelled order", () => {
      const order = makeSampleOrder({
        orderStatus: "cancelled",
      });

      const verifyResult = validateAdminOrderStatusTransition(
        order,
        "verify",
        "admin-uid-001"
      );
      assert.equal(verifyResult.ok, false);
      if (!verifyResult.ok) {
        assert.equal(verifyResult.code, "INVALID_STATUS_TRANSITION");
        assert.match(verifyResult.error, /cancelled customer order/i);
      }
    });

    it("rejects invalid or unauthorized action strings", () => {
      const order = makeSampleOrder();

      const invalidActions = ["dispatch", "pay", "cancel", "", null, undefined];
      for (const action of invalidActions) {
        const result = validateAdminOrderStatusTransition(
          order,
          action,
          "admin-uid-001"
        );
        assert.equal(result.ok, false);
        if (!result.ok) {
          assert.equal(result.code, "INVALID_ACTION");
        }
      }
    });

    it("rejects null or missing order records", () => {
      const result = validateAdminOrderStatusTransition(
        null as unknown as OrderRecord,
        "verify",
        "admin-uid-001"
      );
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "ORDER_NOT_FOUND");
      }
    });
  });

  describe("4. Order Schema Backward Compatibility & Projection", () => {
    it("preserves verifiedAt, verifiedByUid, rejectedAt, rejectedByUid, and rejectionReason in CustomerOrderView", () => {
      const order = makeSampleOrder({
        orderStatus: "verified",
        verifiedAt: "2026-10-26T12:00:00.000Z",
        verifiedByUid: "admin-uid-001",
      });

      const customerView = toCustomerOrderView(order, "cust-uid-1001");
      assert.notEqual(customerView, null);
      if (customerView) {
        assert.equal(customerView.orderStatus, "verified");
        assert.equal(customerView.verifiedAt, "2026-10-26T12:00:00.000Z");
        assert.equal(customerView.verifiedByUid, "admin-uid-001");
        assert.equal("idempotencyKey" in customerView, false);
      }

      // Rejected order projection
      const rejectedOrder = makeSampleOrder({
        orderStatus: "rejected",
        rejectedAt: "2026-10-26T13:00:00.000Z",
        rejectedByUid: "admin-uid-002",
        rejectionReason: "Item temporarily unavailable in region.",
      });
      const rejectedCustomerView = toCustomerOrderView(rejectedOrder, "cust-uid-1001");
      assert.notEqual(rejectedCustomerView, null);
      if (rejectedCustomerView) {
        assert.equal(rejectedCustomerView.orderStatus, "rejected");
        assert.equal(rejectedCustomerView.rejectedAt, "2026-10-26T13:00:00.000Z");
        assert.equal(rejectedCustomerView.rejectedByUid, "admin-uid-002");
        assert.equal(
          rejectedCustomerView.rejectionReason,
          "Item temporarily unavailable in region."
        );
        assert.equal("idempotencyKey" in rejectedCustomerView, false);
      }
    });

    it("prevents customer from viewing orders belonging to another user", () => {
      const order = makeSampleOrder({ customerUid: "cust-uid-1001" });
      const customerView = toCustomerOrderView(order, "cust-uid-9999");
      assert.equal(customerView, null);
    });
  });

  describe("5. Multilingual Parity for adminOrders (en, mr, hi)", () => {
    it("provides complete and non-empty translation keys for adminOrders across all 3 languages", () => {
      const enOrders = TRANSLATIONS.en.adminOrders;
      const mrOrders = TRANSLATIONS.mr.adminOrders;
      const hiOrders = TRANSLATIONS.hi.adminOrders;

      const enKeys = Object.keys(enOrders).sort();
      const mrKeys = Object.keys(mrOrders).sort();
      const hiKeys = Object.keys(hiOrders).sort();

      assert.deepEqual(mrKeys, enKeys);
      assert.deepEqual(hiKeys, enKeys);

      // Verify no empty string values
      for (const key of enKeys as (keyof typeof enOrders)[]) {
        const enVal = enOrders[key];
        const mrVal = mrOrders[key];
        const hiVal = hiOrders[key];

        if (typeof enVal === "string") {
          assert.ok(enVal.trim().length > 0, `en.${key} is empty`);
          assert.ok(
            typeof mrVal === "string" && mrVal.trim().length > 0,
            `mr.${key} is empty`
          );
          assert.ok(
            typeof hiVal === "string" && hiVal.trim().length > 0,
            `hi.${key} is empty`
          );
        } else if (typeof enVal === "function") {
          assert.ok(typeof mrVal === "function", `mr.${key} should be function`);
          assert.ok(typeof hiVal === "function", `hi.${key} should be function`);
        }
      }
    });
  });

  describe("6. Firestore Serialization & Undefined Property Sanitization", () => {
    it("guarantees that sanitizeOrderForFirestore never emits undefined values into Firestore documents", () => {
      const pendingOrder = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });

      const sanitizedPending = sanitizeOrderForFirestore(pendingOrder);
      for (const [key, val] of Object.entries(sanitizedPending)) {
        assert.notEqual(
          val,
          undefined,
          `Key '${key}' in sanitizedPending must not be undefined`
        );
      }
      assert.equal("verifiedAt" in sanitizedPending, false);
      assert.equal("rejectedAt" in sanitizedPending, false);

      // Verified order sanitization
      const verifiedOrder = makeSampleOrder({
        orderStatus: "verified",
        paymentStatus: "unpaid",
        verifiedAt: "2026-10-26T14:00:00.000Z",
        verifiedByUid: "admin-uid-test",
      });

      const sanitizedVerified = sanitizeOrderForFirestore(verifiedOrder);
      for (const [key, val] of Object.entries(sanitizedVerified)) {
        assert.notEqual(
          val,
          undefined,
          `Key '${key}' in sanitizedVerified must not be undefined`
        );
      }
      assert.equal(sanitizedVerified.verifiedAt, "2026-10-26T14:00:00.000Z");
      assert.equal(sanitizedVerified.verifiedByUid, "admin-uid-test");
      assert.equal(sanitizedVerified.paymentStatus, "unpaid");
      assert.equal("rejectedAt" in sanitizedVerified, false);

      // Rejected order sanitization
      const rejectedOrder = makeSampleOrder({
        orderStatus: "rejected",
        paymentStatus: "unpaid",
        rejectedAt: "2026-10-26T14:30:00.000Z",
        rejectedByUid: "admin-uid-test-2",
        rejectionReason: "Customer requested cancellation.",
      });

      const sanitizedRejected = sanitizeOrderForFirestore(rejectedOrder);
      for (const [key, val] of Object.entries(sanitizedRejected)) {
        assert.notEqual(
          val,
          undefined,
          `Key '${key}' in sanitizedRejected must not be undefined`
        );
      }
      assert.equal(sanitizedRejected.rejectedAt, "2026-10-26T14:30:00.000Z");
      assert.equal(sanitizedRejected.rejectedByUid, "admin-uid-test-2");
      assert.equal(
        sanitizedRejected.rejectionReason,
        "Customer requested cancellation."
      );
      assert.equal(sanitizedRejected.paymentStatus, "unpaid");
      assert.equal("verifiedAt" in sanitizedRejected, false);
    });

    it("maps raw Firestore document without creating properties with undefined values", () => {
      const rawDocData = {
        orderNumber: "ORD-20261024-HDNEJG",
        customerUid: "cust-1",
        customerEmail: "cust@example.com",
        items: [
          {
            productId: "p1",
            sku: "SKU1",
            name: "Prod 1",
            category: "Cat 1",
            packSize: "500ml",
            unitPrice: 332,
            quantity: 3,
            lineSubtotal: 996,
          },
        ],
        subtotal: 996,
        total: 996,
        totalItems: 3,
        uniqueItems: 1,
        deliveryDetails: {
          customerName: "sm",
          mobile: "8956235689",
          addressLine: "solapur",
          villageOrCity: "south solapur",
          district: "solapur",
          state: "MH",
          pinCode: "413211",
        },
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
        createdAt: "2026-10-24T12:19:30.056Z",
        updatedAt: "2026-10-24T12:19:30.056Z",
      };

      const mapped = mapFirestoreDocToOrder("hdNeJg8nwYeA8kARmcHA", rawDocData);
      assert.equal(mapped.id, "hdNeJg8nwYeA8kARmcHA");
      assert.equal(mapped.orderNumber, "ORD-20261024-HDNEJG");
      assert.equal(mapped.orderStatus, "pending_verification");
      assert.equal(mapped.paymentStatus, "unpaid");

      // Verify no keys have undefined values
      for (const [key, val] of Object.entries(mapped)) {
        assert.notEqual(val, undefined, `Key '${key}' should not be undefined in mapped order`);
      }
    });

    it("verifies order ORD-20261024-HDNEJG and preserves paymentStatus as unpaid", () => {
      const order = makeSampleOrder({
        orderNumber: "ORD-20261024-HDNEJG",
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });

      const transitionResult = validateAdminOrderStatusTransition(
        order,
        "verify",
        "admin-officer-99"
      );

      assert.equal(transitionResult.ok, true);
      if (transitionResult.ok) {
        assert.equal(transitionResult.updatedOrder.orderStatus, "verified");
        assert.equal(transitionResult.updatedOrder.paymentStatus, "unpaid");
        assert.equal(transitionResult.updatedOrder.verifiedByUid, "admin-officer-99");
        assert.ok(transitionResult.updatedOrder.verifiedAt);
        assert.equal("rejectedAt" in transitionResult.updatedOrder, false);

        const payload = sanitizeOrderForFirestore(transitionResult.updatedOrder);
        assert.equal(payload.orderStatus, "verified");
        assert.equal(payload.paymentStatus, "unpaid");
        assert.equal(payload.verifiedByUid, "admin-officer-99");
      }
    });
  });
});
