import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  CheckoutDeliveryInput,
  ProductRecord,
} from "../src/types/index.ts";
import { evaluateProxyRouteAccess } from "../src/lib/auth/rbac.ts";
import { TRANSLATIONS } from "../src/lib/language/index.ts";
import {
  computeOrderSubmissionFingerprint,
  generateOrderNumber,
  toCustomerOrderView,
  validateAndBuildOrderCreation,
  validateCheckoutDeliveryInput,
} from "../src/lib/orders/index.ts";

function makeActiveProduct(
  overrides: Partial<ProductRecord> = {}
): ProductRecord {
  return {
    id: "prod-bio-101",
    sku: "AGRO-BIO-101",
    name: "Bio-Potash Liquid Formulation",
    category: "Bio-Fertilizers",
    shortDescription:
      "Water-soluble potash mobilization formulation for field and fruit crops.",
    composition: "Potash mobilizing bacteria 1x10^9 CFU/ml",
    targetCrops: ["Sugarcane", "Grapes", "Cotton"],
    dosageAndApplication: "1 Litre per acre via drip or drenching.",
    packSizes: ["500 ml", "1 L", "5 L"],
    unitPrice: 640.5,
    stockQuantity: 15,
    stockStatus: "in_stock",
    safetyAndStorage: "Keep in cool, shaded storage away from direct heat.",
    registrationNumber: "REG-BIO-2026-101",
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    createdByUid: "admin-1",
    updatedByUid: "admin-1",
    ...overrides,
  };
}

function makeValidDeliveryInput(
  overrides: Partial<CheckoutDeliveryInput> = {}
): CheckoutDeliveryInput {
  return {
    customerName: "Ramesh Patil",
    mobile: "9876543210",
    addressLine: "Plot 14, Near Krishi Seva Kendra, Main Road",
    villageOrCity: "Baramati",
    district: "Pune",
    state: "Maharashtra",
    pinCode: "413102",
    ...overrides,
  };
}

const activeCustomerSession = {
  uid: "cust-uid-1001",
  role: "customer" as const,
  status: "active" as const,
};

describe("Phase 4.2 — Checkout & Secure Order Creation", () => {
  describe("1. Delivery details validation & multilingual error messages (en, mr, hi)", () => {
    it("accepts and trims valid Indian delivery details", () => {
      const result = validateCheckoutDeliveryInput(
        {
          customerName: "  Ramesh Patil  ",
          mobile: " +91 9876543210 ",
          addressLine: "  Gate No. 42, Post Malegaon  ",
          villageOrCity: " Baramati ",
          district: " Pune ",
          state: " Maharashtra ",
          pinCode: " 413102 ",
        },
        "en"
      );

      assert.equal(result.valid, true);
      if (result.valid) {
        assert.equal(result.data.customerName, "Ramesh Patil");
        assert.equal(result.data.mobile, "+91 9876543210");
        assert.equal(result.data.pinCode, "413102");
      }
    });

    it("rejects missing or invalid delivery fields with localized messages in en, mr, and hi", () => {
      const invalidInput = {
        customerName: "",
        mobile: "12345",
        addressLine: "abc",
        villageOrCity: "",
        district: "",
        state: "",
        pinCode: "00123",
      };

      const enResult = validateCheckoutDeliveryInput(invalidInput, "en");
      const mrResult = validateCheckoutDeliveryInput(invalidInput, "mr");
      const hiResult = validateCheckoutDeliveryInput(invalidInput, "hi");

      assert.equal(enResult.valid, false);
      assert.equal(mrResult.valid, false);
      assert.equal(hiResult.valid, false);

      if (!enResult.valid && !mrResult.valid && !hiResult.valid) {
        assert.equal(
          enResult.errors.customerName,
          TRANSLATIONS.en.validation.deliveryNameRequired
        );
        assert.equal(
          mrResult.errors.customerName,
          TRANSLATIONS.mr.validation.deliveryNameRequired
        );
        assert.equal(
          hiResult.errors.customerName,
          TRANSLATIONS.hi.validation.deliveryNameRequired
        );

        assert.equal(
          enResult.errors.mobile,
          TRANSLATIONS.en.validation.deliveryMobileInvalid
        );
        assert.equal(
          mrResult.errors.pinCode,
          TRANSLATIONS.mr.validation.deliveryPinCodeInvalid
        );
        assert.equal(
          hiResult.errors.addressLine,
          TRANSLATIONS.hi.validation.deliveryAddressLength
        );
      }
    });
  });

  describe("2. Authoritative server-side order validation & price calculation", () => {
    it("creates a verified order using authoritative server prices and ignores tampered client prices/statuses", () => {
      const p1 = makeActiveProduct({
        id: "prod-1",
        sku: "SKU-1",
        name: "Bio-N Concentrate",
        unitPrice: 450,
        packSizes: ["500 ml", "1 L"],
        stockQuantity: 20,
      });
      const p2 = makeActiveProduct({
        id: "prod-2",
        sku: "SKU-2",
        name: "Chelated Zinc",
        unitPrice: 310.25,
        packSizes: ["250 g", "500 g"],
        stockQuantity: 10,
      });

      const tamperedPayload = {
        deliveryDetails: makeValidDeliveryInput(),
        // Client attempts to tamper with prices, totals, and statuses:
        subtotal: 1,
        total: 1,
        orderStatus: "confirmed",
        paymentStatus: "paid",
        items: [
          {
            productId: "prod-1",
            packSize: "1 L",
            quantity: 2,
            unitPrice: 0.01,
            lineSubtotal: 0.02,
          },
          {
            productId: "prod-2",
            packSize: "500 g",
            quantity: 3,
            unitPrice: 1,
            lineSubtotal: 3,
          },
        ],
      };

      const result = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: tamperedPayload,
        authoritativeProducts: [p1, p2],
        generatedOrderId: "order-doc-9001",
        nowIso: "2026-10-22T11:00:00.000Z",
        language: "en",
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.duplicate, false);
        assert.equal(result.order.id, "order-doc-9001");
        assert.equal(result.order.customerUid, activeCustomerSession.uid);
        assert.equal(result.order.orderStatus, "pending_verification");
        assert.equal(result.order.paymentStatus, "unpaid");
        assert.equal(result.order.uniqueItems, 2);
        assert.equal(result.order.totalItems, 5);
        // Server calculation: (2 * 450) + (3 * 310.25) = 900 + 930.75 = 1830.75
        assert.equal(result.order.items[0].unitPrice, 450);
        assert.equal(result.order.items[0].lineSubtotal, 900);
        assert.equal(result.order.items[1].unitPrice, 310.25);
        assert.equal(result.order.items[1].lineSubtotal, 930.75);
        assert.equal(result.order.subtotal, 1830.75);
        assert.equal(result.order.total, 1830.75);
      }
    });

    it("rejects orders where a customer attempts to create an order for another user UID", () => {
      const product = makeActiveProduct();

      const result = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          customerUid: "other-customer-uid-999",
          deliveryDetails: makeValidDeliveryInput(),
          items: [{ productId: product.id, packSize: "1 L", quantity: 1 }],
        },
        authoritativeProducts: [product],
        generatedOrderId: "order-forbidden-1",
        language: "en",
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.status, 403);
        assert.equal(result.code, "FORBIDDEN_CUSTOMER_MISMATCH");
      }
    });

    it("rejects non-customer or inactive session users", () => {
      const product = makeActiveProduct();

      const adminAttempt = validateAndBuildOrderCreation({
        sessionUser: { uid: "admin-1", role: "admin", status: "active" },
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [{ productId: product.id, packSize: "1 L", quantity: 1 }],
        },
        authoritativeProducts: [product],
        generatedOrderId: "order-admin-attempt",
      });

      assert.equal(adminAttempt.ok, false);
      if (!adminAttempt.ok) {
        assert.equal(adminAttempt.status, 403);
        assert.equal(adminAttempt.code, "UNAUTHORIZED_CUSTOMER");
      }
    });

    it("rejects empty cart submissions", () => {
      const product = makeActiveProduct();

      const result = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [],
        },
        authoritativeProducts: [product],
        generatedOrderId: "order-empty",
        language: "mr",
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.status, 400);
        assert.equal(result.code, "EMPTY_CART");
        assert.equal(result.error, TRANSLATIONS.mr.validation.orderEmptyCart);
      }
    });

    it("rejects draft, archived, missing, enquiry-only, or out-of-stock products", () => {
      const draftProduct = makeActiveProduct({
        id: "prod-draft",
        status: "draft",
      });
      const archivedProduct = makeActiveProduct({
        id: "prod-archived",
        status: "archived",
      });
      const enquiryProduct = makeActiveProduct({
        id: "prod-enquiry",
        unitPrice: null,
      });
      const outOfStockProduct = makeActiveProduct({
        id: "prod-oos",
        stockQuantity: 0,
      });

      for (const unavailableId of [
        "prod-draft",
        "prod-archived",
        "prod-nonexistent",
      ]) {
        const res = validateAndBuildOrderCreation({
          sessionUser: activeCustomerSession,
          rawBody: {
            deliveryDetails: makeValidDeliveryInput(),
            items: [{ productId: unavailableId, packSize: "1 L", quantity: 1 }],
          },
          authoritativeProducts: [
            draftProduct,
            archivedProduct,
            enquiryProduct,
            outOfStockProduct,
          ],
          generatedOrderId: "order-invalid-prod",
        });

        assert.equal(res.ok, false);
        if (!res.ok) {
          assert.equal(res.code, "PRODUCT_UNAVAILABLE");
        }
      }

      const enquiryRes = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [{ productId: "prod-enquiry", packSize: "1 L", quantity: 1 }],
        },
        authoritativeProducts: [enquiryProduct],
        generatedOrderId: "order-enquiry",
      });
      assert.equal(enquiryRes.ok, false);
      if (!enquiryRes.ok) {
        assert.equal(enquiryRes.code, "PRICE_UNAVAILABLE");
      }

      const oosRes = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [{ productId: "prod-oos", packSize: "1 L", quantity: 1 }],
        },
        authoritativeProducts: [outOfStockProduct],
        generatedOrderId: "order-oos",
      });
      assert.equal(oosRes.ok, false);
      if (!oosRes.ok) {
        assert.equal(oosRes.code, "PRODUCT_OUT_OF_STOCK");
      }
    });

    it("rejects invalid pack sizes and quantities exceeding available stock (including split lines)", () => {
      const product = makeActiveProduct({
        id: "prod-stock-5",
        packSizes: ["500 ml", "1 L"],
        stockQuantity: 5,
      });

      const badPackRes = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [
            { productId: "prod-stock-5", packSize: "20 L Drum", quantity: 1 },
          ],
        },
        authoritativeProducts: [product],
        generatedOrderId: "order-bad-pack",
        language: "hi",
      });

      assert.equal(badPackRes.ok, false);
      if (!badPackRes.ok) {
        assert.equal(badPackRes.code, "INVALID_PACK_SIZE");
        assert.equal(
          badPackRes.error,
          TRANSLATIONS.hi.validation.orderInvalidPackSize(product.name)
        );
      }

      // Split lines trying to bypass stockQuantity = 5 (3 + 3 = 6 > 5)
      const splitExceedRes = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [
            { productId: "prod-stock-5", packSize: "500 ml", quantity: 3 },
            { productId: "prod-stock-5", packSize: "1 L", quantity: 3 },
          ],
        },
        authoritativeProducts: [product],
        generatedOrderId: "order-split-exceed",
      });

      assert.equal(splitExceedRes.ok, false);
      if (!splitExceedRes.ok) {
        assert.equal(splitExceedRes.code, "EXCEEDS_AVAILABLE_STOCK");
      }
    });

    it("prevents duplicate order creation when the same idempotencyKey or recent payload is re-submitted", () => {
      const product = makeActiveProduct({ id: "prod-dup", unitPrice: 500 });
      const payload = {
        idempotencyKey: "checkout-attempt-key-12345",
        deliveryDetails: makeValidDeliveryInput(),
        items: [{ productId: "prod-dup", packSize: "1 L", quantity: 2 }],
      };

      const firstAttempt = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: payload,
        authoritativeProducts: [product],
        existingCustomerOrders: [],
        generatedOrderId: "order-first-1",
        nowIso: "2026-10-22T12:00:00.000Z",
      });

      assert.equal(firstAttempt.ok, true);
      if (!firstAttempt.ok) return;
      assert.equal(firstAttempt.duplicate, false);

      // Second submission with same idempotencyKey returns existing order with duplicate = true
      const secondAttempt = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: payload,
        authoritativeProducts: [product],
        existingCustomerOrders: [firstAttempt.order],
        generatedOrderId: "order-second-2",
        nowIso: "2026-10-22T12:00:05.000Z",
      });

      assert.equal(secondAttempt.ok, true);
      if (secondAttempt.ok) {
        assert.equal(secondAttempt.duplicate, true);
        assert.equal(secondAttempt.order.id, "order-first-1");
        assert.equal(
          secondAttempt.customerOrder.orderNumber,
          firstAttempt.order.orderNumber
        );
      }
    });
  });

  describe("3. Customer order privacy & RBAC route protection", () => {
    it("projects CustomerOrderView only for the owning customer and hides orders from other customers", () => {
      const product = makeActiveProduct();
      const created = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [{ productId: product.id, packSize: "1 L", quantity: 1 }],
        },
        authoritativeProducts: [product],
        generatedOrderId: "order-priv-1",
      });

      assert.equal(created.ok, true);
      if (!created.ok) return;

      const ownerView = toCustomerOrderView(
        created.order,
        activeCustomerSession.uid
      );
      assert.ok(ownerView !== null);
      assert.equal(ownerView?.id, "order-priv-1");
      assert.equal("idempotencyKey" in (ownerView as object), false);

      const otherUserView = toCustomerOrderView(
        created.order,
        "different-customer-uid"
      );
      assert.equal(otherUserView, null);
    });

    it("generates deterministic order numbers and fingerprints", () => {
      const orderNo = generateOrderNumber(
        new Date("2026-10-22T00:00:00.000Z"),
        "ab12cd"
      );
      assert.equal(orderNo, "ORD-20261022-AB12CD");

      const fp1 = computeOrderSubmissionFingerprint(
        "u1",
        [
          { productId: "p2", packSize: "1 L", quantity: 1 },
          { productId: "p1", packSize: "500 ml", quantity: 2 },
        ],
        makeValidDeliveryInput()
      );
      const fp2 = computeOrderSubmissionFingerprint(
        "u1",
        [
          { productId: "p1", packSize: "500 ml", quantity: 2 },
          { productId: "p2", packSize: "1 L", quantity: 1 },
        ],
        makeValidDeliveryInput()
      );
      assert.equal(fp1, fp2);
    });

    it("enforces proxy access control on /customer/checkout, /customer/orders/[orderId], and /api/customer/orders", () => {
      const unauthCheckout = evaluateProxyRouteAccess({
        pathname: "/customer/checkout",
        hasSessionCookie: false,
        roleCookie: undefined,
      });
      assert.equal(unauthCheckout.action, "redirect");

      const adminToCheckout = evaluateProxyRouteAccess({
        pathname: "/customer/checkout",
        hasSessionCookie: true,
        roleCookie: "admin",
      });
      assert.equal(adminToCheckout.action, "redirect");
      if (adminToCheckout.action === "redirect") {
        assert.equal(adminToCheckout.loginPath, "/customer/login");
        assert.equal(adminToCheckout.reason, "forbidden_role");
      }

      const customerToCheckout = evaluateProxyRouteAccess({
        pathname: "/customer/checkout",
        hasSessionCookie: true,
        roleCookie: "customer",
      });
      assert.equal(customerToCheckout.action, "allow");

      const unauthOrderApi = evaluateProxyRouteAccess({
        pathname: "/api/customer/orders",
        hasSessionCookie: false,
        roleCookie: undefined,
      });
      assert.equal(unauthOrderApi.action, "json_error");
      if (unauthOrderApi.action === "json_error") {
        assert.equal(unauthOrderApi.status, 401);
      }

      const adminOrderApi = evaluateProxyRouteAccess({
        pathname: "/api/customer/orders",
        hasSessionCookie: true,
        roleCookie: "admin",
      });
      assert.equal(adminOrderApi.action, "json_error");
      if (adminOrderApi.action === "json_error") {
        assert.equal(adminOrderApi.status, 403);
      }
    });

    it("preserves authenticated customer access on post-checkout catalogue route (/customer/products)", () => {
      const customerCatalogueAccess = evaluateProxyRouteAccess({
        pathname: "/customer/products",
        hasSessionCookie: true,
        roleCookie: "customer",
      });
      assert.equal(customerCatalogueAccess.action, "allow");

      const unauthCatalogueAccess = evaluateProxyRouteAccess({
        pathname: "/customer/products",
        hasSessionCookie: false,
        roleCookie: undefined,
      });
      assert.equal(unauthCatalogueAccess.action, "redirect");
      if (unauthCatalogueAccess.action === "redirect") {
        assert.equal(unauthCatalogueAccess.loginPath, "/customer/login");
        assert.equal(unauthCatalogueAccess.reason, "auth_required");
      }
    });

    it("enforces proxy route protection on the customer order history page (/customer/orders)", () => {
      const unauthOrders = evaluateProxyRouteAccess({
        pathname: "/customer/orders",
        hasSessionCookie: false,
        roleCookie: undefined,
      });
      assert.equal(unauthOrders.action, "redirect");
      if (unauthOrders.action === "redirect") {
        assert.equal(unauthOrders.loginPath, "/customer/login");
        assert.equal(unauthOrders.reason, "auth_required");
      }

      const adminToCustomerOrders = evaluateProxyRouteAccess({
        pathname: "/customer/orders",
        hasSessionCookie: true,
        roleCookie: "admin",
      });
      assert.equal(adminToCustomerOrders.action, "redirect");
      if (adminToCustomerOrders.action === "redirect") {
        assert.equal(adminToCustomerOrders.loginPath, "/customer/login");
        assert.equal(adminToCustomerOrders.reason, "forbidden_role");
      }

      const customerOrdersAccess = evaluateProxyRouteAccess({
        pathname: "/customer/orders",
        hasSessionCookie: true,
        roleCookie: "customer",
      });
      assert.equal(customerOrdersAccess.action, "allow");
    });

    it("enforces order ownership projection and complete fields for order history views", () => {
      const product = makeActiveProduct();
      const orderCreation = validateAndBuildOrderCreation({
        sessionUser: activeCustomerSession,
        rawBody: {
          deliveryDetails: makeValidDeliveryInput(),
          items: [{ productId: product.id, packSize: "1 L", quantity: 3 }],
        },
        authoritativeProducts: [product],
        generatedOrderId: "order-history-test-1",
      });

      assert.equal(orderCreation.ok, true);
      if (!orderCreation.ok) return;

      // Authenticated customer views their own order
      const customerView = toCustomerOrderView(
        orderCreation.order,
        activeCustomerSession.uid
      );
      assert.ok(customerView !== null);
      assert.equal(customerView?.id, "order-history-test-1");
      assert.equal(customerView?.totalItems, 3);
      assert.equal(customerView?.orderStatus, "pending_verification");
      assert.equal(customerView?.paymentStatus, "unpaid");
      assert.equal(customerView?.deliveryDetails.villageOrCity, "Baramati");
      assert.equal(customerView?.items.length, 1);
      assert.equal(customerView?.items[0].name, product.name);

      // Different customer is strictly prohibited from viewing this order
      const foreignCustomerView = toCustomerOrderView(
        orderCreation.order,
        "foreign-customer-uid-999"
      );
      assert.equal(foreignCustomerView, null);

      // Verify localized empty state and status labels exist across en, mr, hi
      for (const lang of ["en", "mr", "hi"] as const) {
        const trans = TRANSLATIONS[lang].customerOrders;
        assert.ok(trans.myOrdersButton.length > 0);
        assert.ok(trans.emptyTitle.length > 0);
        assert.ok(trans.emptyDescription.length > 0);
        assert.ok(trans.statusPendingVerification.length > 0);
        assert.ok(trans.statusConfirmed.length > 0);
        assert.ok(trans.statusCancelled.length > 0);
        assert.ok(trans.paymentStatusUnpaid.length > 0);
        assert.ok(trans.paymentStatusPaid.length > 0);
      }
    });
  });
});
