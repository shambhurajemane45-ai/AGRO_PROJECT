import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  OrderRecord,
  PaymentStatusTransitionPayload,
} from "../src/types/index.ts";
import {
  toCustomerOrderView,
  validateAdminOrderStatusTransition,
  validatePaymentStatusTransition,
} from "../src/lib/orders/index.ts";
import {
  mapFirestoreDocToOrder,
  sanitizeOrderForFirestore,
} from "../src/lib/orders/server.ts";

function makeSampleOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ord-test-doc-201",
    orderNumber: "ORD-20261028-P5T001",
    customerUid: "cust-uid-phase5",
    customerEmail: "farmer.kisan@example.com",
    items: [
      {
        productId: "prod-bio-101",
        sku: "AGRO-BIO-101",
        name: "Bio-Potash Liquid Formulation",
        category: "Bio-Fertilizers",
        packSize: "1 L",
        unitPrice: 650,
        quantity: 2,
        lineSubtotal: 1300,
      },
    ],
    subtotal: 1300,
    total: 1300,
    totalItems: 2,
    uniqueItems: 1,
    deliveryDetails: {
      customerName: "Balasaheb Jadhav",
      mobile: "9876543210",
      addressLine: "Gat No. 42, Near Cooperative Sugar Mill",
      villageOrCity: "Phaltan",
      district: "Satara",
      state: "Maharashtra",
      pinCode: "415523",
    },
    orderStatus: "pending_verification",
    paymentStatus: "unpaid",
    idempotencyKey: "ik:cust-uid-phase5:test-key",
    createdAt: "2026-10-28T06:00:00.000Z",
    updatedAt: "2026-10-28T06:00:00.000Z",
    ...overrides,
  };
}

describe("Phase 5 — Payment-Independent Foundation", () => {
  describe("1. Valid Payment State Transitions", () => {
    it("successfully initiates payment from unpaid state, setting status to pending and recording paymentOrderId", () => {
      const order = makeSampleOrder({ paymentStatus: "unpaid" });
      const payload: PaymentStatusTransitionPayload = {
        action: "initiate",
        paymentOrderId: "order_mock_gateway_101",
        nowIso: "2026-10-28T07:00:00.000Z",
      };

      const result = validatePaymentStatusTransition(order, payload);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.paymentStatus, "pending");
        assert.equal(result.updatedOrder.paymentOrderId, "order_mock_gateway_101");
        assert.equal(result.updatedOrder.updatedAt, "2026-10-28T07:00:00.000Z");
        assert.equal("paidAt" in result.updatedOrder, false);
        assert.equal("paymentFailureReason" in result.updatedOrder, false);
        // Order status remains untouched
        assert.equal(result.updatedOrder.orderStatus, order.orderStatus);
      }
    });

    it("successfully confirms payment from pending state, setting status to paid with audit metadata", () => {
      const order = makeSampleOrder({
        paymentStatus: "pending",
        paymentOrderId: "order_mock_gateway_101",
      });
      const payload: PaymentStatusTransitionPayload = {
        action: "confirm_paid",
        paymentId: "pay_mock_trans_999",
        paymentMethod: "upi",
        nowIso: "2026-10-28T07:05:00.000Z",
      };

      const result = validatePaymentStatusTransition(order, payload);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.paymentStatus, "paid");
        assert.equal(result.updatedOrder.paidAt, "2026-10-28T07:05:00.000Z");
        assert.equal(result.updatedOrder.paymentId, "pay_mock_trans_999");
        assert.equal(result.updatedOrder.paymentMethod, "upi");
        assert.equal(result.updatedOrder.paymentOrderId, "order_mock_gateway_101");
        assert.equal("paymentFailureReason" in result.updatedOrder, false);
      }
    });

    it("successfully records payment failure from pending state, capturing failure reason", () => {
      const order = makeSampleOrder({
        paymentStatus: "pending",
        paymentOrderId: "order_mock_gateway_101",
      });
      const payload: PaymentStatusTransitionPayload = {
        action: "record_failure",
        failureReason: "Payment was cancelled or timed out by the customer's bank.",
        nowIso: "2026-10-28T07:10:00.000Z",
      };

      const result = validatePaymentStatusTransition(order, payload);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.paymentStatus, "failed");
        assert.equal(
          result.updatedOrder.paymentFailureReason,
          "Payment was cancelled or timed out by the customer's bank."
        );
        assert.equal("paidAt" in result.updatedOrder, false);
      }
    });

    it("allows retrying payment from failed state back to pending", () => {
      const failedOrder = makeSampleOrder({
        paymentStatus: "failed",
        paymentFailureReason: "Card declined by issuing bank",
      });
      const payload: PaymentStatusTransitionPayload = {
        action: "initiate",
        paymentOrderId: "order_mock_retry_202",
        nowIso: "2026-10-28T07:15:00.000Z",
      };

      const result = validatePaymentStatusTransition(failedOrder, payload);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.paymentStatus, "pending");
        assert.equal(result.updatedOrder.paymentOrderId, "order_mock_retry_202");
        assert.equal("paymentFailureReason" in result.updatedOrder, false);
      }
    });

    it("allows resetting pending or failed orders back to unpaid upon session expiry", () => {
      const pendingOrder = makeSampleOrder({
        paymentStatus: "pending",
        paymentOrderId: "order_expired_001",
      });
      const payload: PaymentStatusTransitionPayload = {
        action: "reset_unpaid",
        nowIso: "2026-10-28T07:20:00.000Z",
      };

      const result = validatePaymentStatusTransition(pendingOrder, payload);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.paymentStatus, "unpaid");
        assert.equal("paidAt" in result.updatedOrder, false);
        assert.equal("paymentFailureReason" in result.updatedOrder, false);
      }
    });
  });

  describe("2. Paid-State Protection & Invariants", () => {
    it("blocks initiate action when order is already paid with ALREADY_PAID error", () => {
      const paidOrder = makeSampleOrder({
        paymentStatus: "paid",
        paidAt: "2026-10-28T06:30:00.000Z",
        paymentId: "pay_confirmed_123",
      });

      const result = validatePaymentStatusTransition(paidOrder, {
        action: "initiate",
        paymentOrderId: "order_tampered",
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "ALREADY_PAID");
        assert.match(result.error, /already marked as paid/i);
      }
    });

    it("strictly prevents payment failure from overwriting a previously confirmed payment", () => {
      const paidOrder = makeSampleOrder({
        paymentStatus: "paid",
        paidAt: "2026-10-28T06:30:00.000Z",
        paymentId: "pay_confirmed_123",
      });

      const result = validatePaymentStatusTransition(paidOrder, {
        action: "record_failure",
        failureReason: "Late webhook received with failure event",
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "ALREADY_PAID");
        assert.match(result.error, /already marked as paid/i);
      }
    });

    it("blocks attempts to reset a paid order back to unpaid", () => {
      const paidOrder = makeSampleOrder({
        paymentStatus: "paid",
        paidAt: "2026-10-28T06:30:00.000Z",
      });

      const result = validatePaymentStatusTransition(paidOrder, {
        action: "reset_unpaid",
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "ALREADY_PAID");
      }
    });

    it("rejects invalid or unsupported payment actions", () => {
      const order = makeSampleOrder({ paymentStatus: "unpaid" });
      const result = validatePaymentStatusTransition(order, {
        // @ts-expect-error testing invalid action runtime safety
        action: "fraudulent_client_mark_paid",
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "INVALID_ACTION");
      }
    });

    it("rejects null or non-object order records safely", () => {
      // @ts-expect-error testing runtime safety
      const result = validatePaymentStatusTransition(null, { action: "initiate" });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.code, "ORDER_NOT_FOUND");
      }
    });
  });

  describe("3. Decoupling from Order Verification Invariant", () => {
    it("guarantees admin order verification preserves paymentStatus as unpaid", () => {
      const order = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });

      const result = validateAdminOrderStatusTransition(
        order,
        "verify",
        "admin-officer-satara"
      );

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.orderStatus, "verified");
        assert.equal(
          result.updatedOrder.paymentStatus,
          "unpaid",
          "Verification must NEVER mark an order as paid!"
        );
      }
    });

    it("guarantees admin order verification preserves paymentStatus when order is pending or paid", () => {
      const pendingPaymentOrder = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "pending",
        paymentOrderId: "order_gateway_777",
      });

      const result = validateAdminOrderStatusTransition(
        pendingPaymentOrder,
        "verify",
        "admin-officer-satara"
      );

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.updatedOrder.orderStatus, "verified");
        assert.equal(result.updatedOrder.paymentStatus, "pending");
      }
    });

    it("guarantees payment status transitions do not modify orderStatus", () => {
      const unverifiedOrder = makeSampleOrder({
        orderStatus: "pending_verification",
        paymentStatus: "unpaid",
      });

      const initiateResult = validatePaymentStatusTransition(unverifiedOrder, {
        action: "initiate",
        paymentOrderId: "order_gateway_888",
      });

      assert.equal(initiateResult.ok, true);
      if (initiateResult.ok) {
        assert.equal(
          initiateResult.updatedOrder.orderStatus,
          "pending_verification",
          "Payment transition must keep orderStatus unchanged"
        );
      }

      const verifiedOrder = makeSampleOrder({
        orderStatus: "verified",
        paymentStatus: "pending",
        paymentOrderId: "order_gateway_888",
      });

      const paidResult = validatePaymentStatusTransition(verifiedOrder, {
        action: "confirm_paid",
        paymentId: "pay_success_888",
      });

      assert.equal(paidResult.ok, true);
      if (paidResult.ok) {
        assert.equal(paidResult.updatedOrder.orderStatus, "verified");
        assert.equal(paidResult.updatedOrder.paymentStatus, "paid");
      }
    });
  });

  describe("4. Backward Compatibility with Existing Firestore Orders & Customer Projection", () => {
    it("maps raw Firestore document without payment fields cleanly with default paymentStatus unpaid", () => {
      const rawLegacyDoc = {
        orderNumber: "ORD-20261024-HDNEJG",
        customerUid: "KoTxPMQIRdVnYDFKhW8WDbQimxr1",
        customerEmail: "farmer.solapur@example.com",
        items: [],
        subtotal: 996,
        total: 996,
        orderStatus: "verified",
        paymentStatus: "unpaid",
        createdAt: "2026-10-24T12:19:30.056Z",
        updatedAt: "2026-10-26T08:53:49.891Z",
      };

      const mapped = mapFirestoreDocToOrder("hdNeJg8nwYeA8kARmcHA", rawLegacyDoc);
      assert.equal(mapped.id, "hdNeJg8nwYeA8kARmcHA");
      assert.equal(mapped.orderNumber, "ORD-20261024-HDNEJG");
      assert.equal(mapped.paymentStatus, "unpaid");
      assert.equal("paymentOrderId" in mapped, false);
      assert.equal("paymentId" in mapped, false);
      assert.equal("paidAt" in mapped, false);

      // Verify no keys in mapped object have undefined values
      for (const [key, val] of Object.entries(mapped)) {
        assert.notEqual(val, undefined, `Key '${key}' should not be undefined`);
      }
    });

    it("maps raw Firestore document with payment metadata correctly without data loss", () => {
      const rawPaymentDoc = {
        orderNumber: "ORD-20261028-PAID01",
        customerUid: "cust-uid-phase5",
        items: [],
        subtotal: 1300,
        total: 1300,
        orderStatus: "verified",
        paymentStatus: "paid",
        paymentOrderId: "order_rzp_99001",
        paymentId: "pay_rzp_99002",
        paymentMethod: "netbanking",
        paidAt: "2026-10-28T07:30:00.000Z",
        createdAt: "2026-10-28T07:00:00.000Z",
        updatedAt: "2026-10-28T07:30:00.000Z",
      };

      const mapped = mapFirestoreDocToOrder("doc-paid-001", rawPaymentDoc);
      assert.equal(mapped.paymentStatus, "paid");
      assert.equal(mapped.paymentOrderId, "order_rzp_99001");
      assert.equal(mapped.paymentId, "pay_rzp_99002");
      assert.equal(mapped.paymentMethod, "netbanking");
      assert.equal(mapped.paidAt, "2026-10-28T07:30:00.000Z");
    });

    it("projects optional payment metadata into CustomerOrderView while omitting idempotencyKey", () => {
      const order = makeSampleOrder({
        paymentStatus: "paid",
        paymentOrderId: "order_rzp_99001",
        paymentId: "pay_rzp_99002",
        paymentMethod: "upi",
        paidAt: "2026-10-28T07:30:00.000Z",
      });

      const customerView = toCustomerOrderView(order, "cust-uid-phase5");
      assert.notEqual(customerView, null);
      if (customerView) {
        assert.equal(customerView.paymentStatus, "paid");
        assert.equal(customerView.paymentOrderId, "order_rzp_99001");
        assert.equal(customerView.paymentId, "pay_rzp_99002");
        assert.equal(customerView.paymentMethod, "upi");
        assert.equal(customerView.paidAt, "2026-10-28T07:30:00.000Z");
        assert.equal("idempotencyKey" in customerView, false);

        for (const [key, val] of Object.entries(customerView)) {
          assert.notEqual(val, undefined, `Key '${key}' should not be undefined`);
        }
      }
    });
  });

  describe("5. Firestore Serialization & Undefined Property Sanitization", () => {
    it("guarantees sanitizeOrderForFirestore never emits undefined values for unpaid orders without payment metadata", () => {
      const order = makeSampleOrder({
        paymentStatus: "unpaid",
      });

      const payload = sanitizeOrderForFirestore(order);

      for (const [key, val] of Object.entries(payload)) {
        assert.notEqual(
          val,
          undefined,
          `Key '${key}' in sanitized payload must not be undefined`
        );
      }

      assert.equal(payload.paymentStatus, "unpaid");
      assert.equal("paymentOrderId" in payload, false);
      assert.equal("paymentId" in payload, false);
      assert.equal("paidAt" in payload, false);
      assert.equal("paymentFailureReason" in payload, false);
    });

    it("sanitizes orders with full payment metadata accurately without emitting undefined keys", () => {
      const order = makeSampleOrder({
        paymentStatus: "paid",
        paymentOrderId: "order_gateway_valid_123",
        paymentId: "pay_gateway_valid_456",
        paymentMethod: "card",
        paidAt: "2026-10-28T07:45:00.000Z",
      });

      const payload = sanitizeOrderForFirestore(order);

      for (const [key, val] of Object.entries(payload)) {
        assert.notEqual(
          val,
          undefined,
          `Key '${key}' in sanitized payload must not be undefined`
        );
      }

      assert.equal(payload.paymentStatus, "paid");
      assert.equal(payload.paymentOrderId, "order_gateway_valid_123");
      assert.equal(payload.paymentId, "pay_gateway_valid_456");
      assert.equal(payload.paymentMethod, "card");
      assert.equal(payload.paidAt, "2026-10-28T07:45:00.000Z");
      assert.equal("paymentFailureReason" in payload, false);
    });
  });
});
