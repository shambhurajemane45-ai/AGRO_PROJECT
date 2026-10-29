import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProductRecord } from "../src/types/index.ts";
import { evaluateProxyRouteAccess } from "../src/lib/auth/rbac.ts";
import {
  addOrUpdateCartItem,
  calculateCartTotals,
  DEFAULT_MAX_ORDER_QUANTITY,
  filterActiveCustomerProducts,
  getAvailableStockForProduct,
  getProductAvailabilityState,
  isProductAvailableForSale,
  removeCartItem,
  revalidateCartAgainstProducts,
  sanitizeStoredCartItems,
  updateCartItemQuantity,
  validateCartQuantity,
} from "../src/lib/cart/index.ts";

function makeProduct(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    id: "prod-active-1",
    sku: "AGRO-101",
    name: "Bio-Nutrient Foliar Concentrate",
    category: "Crop Nutrition",
    shortDescription:
      "Concentrated foliar nutrition input for field and horticulture crops.",
    composition: "Amino acid & chelated micronutrient formulation",
    targetCrops: ["Cotton", "Soybean", "Chilli"],
    dosageAndApplication: "2 ml per litre of water at vegetative stage.",
    packSizes: ["250 ml", "500 ml", "1 L"],
    unitPrice: 480.5,
    safetyAndStorage: "Store in a cool, dry place away from direct sunlight.",
    registrationNumber: "REG-2026-101",
    status: "active",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-15T00:00:00.000Z",
    createdByUid: "admin-1",
    updatedByUid: "admin-1",
    ...overrides,
  };
}

describe("Phase 4.1 — Customer Product Shopping & Cart Foundation", () => {
  describe("1. Catalogue active-only filtering & product availability", () => {
    it("filters out draft and archived products so customers only ever see active products", () => {
      const active = makeProduct({ id: "p-active", status: "active" });
      const draft = makeProduct({ id: "p-draft", status: "draft" });
      const archived = makeProduct({ id: "p-archived", status: "archived" });

      const visible = filterActiveCustomerProducts([active, draft, archived]);
      assert.equal(visible.length, 1);
      assert.equal(visible[0].id, "p-active");
    });

    it("resolves stock availability and sale eligibility accurately across product states", () => {
      const standardActive = makeProduct({ unitPrice: 550 });
      assert.equal(isProductAvailableForSale(standardActive), true);
      assert.equal(getProductAvailabilityState(standardActive), "in_stock");
      assert.equal(
        getAvailableStockForProduct(standardActive),
        DEFAULT_MAX_ORDER_QUANTITY
      );

      const stockLimited = makeProduct({ unitPrice: 550, stockQuantity: 12 });
      assert.equal(isProductAvailableForSale(stockLimited), true);
      assert.equal(getAvailableStockForProduct(stockLimited), 12);

      const zeroStock = makeProduct({ unitPrice: 550, stockQuantity: 0 });
      assert.equal(isProductAvailableForSale(zeroStock), false);
      assert.equal(getProductAvailabilityState(zeroStock), "out_of_stock");
      assert.equal(getAvailableStockForProduct(zeroStock), 0);

      const explicitOutOfStock = makeProduct({
        unitPrice: 550,
        stockStatus: "out_of_stock",
      });
      assert.equal(isProductAvailableForSale(explicitOutOfStock), false);
      assert.equal(
        getProductAvailabilityState(explicitOutOfStock),
        "out_of_stock"
      );

      const enquiryPrice = makeProduct({ unitPrice: null });
      assert.equal(isProductAvailableForSale(enquiryPrice), false);
      assert.equal(getProductAvailabilityState(enquiryPrice), "enquiry_only");

      const draftProduct = makeProduct({ status: "draft", unitPrice: 550 });
      assert.equal(isProductAvailableForSale(draftProduct), false);
      assert.equal(getProductAvailabilityState(draftProduct), "unavailable");
    });
  });

  describe("2. Quantity validation & unavailable product rejection (en, mr, hi)", () => {
    it("accepts valid whole-number quantities within available stock", () => {
      const product = makeProduct({ stockQuantity: 10, unitPrice: 325.25 });
      const result = validateCartQuantity(4, product, "en");

      assert.equal(result.isValid, true);
      if (result.isValid) {
        assert.equal(result.quantity, 4);
        assert.equal(result.availableStock, 10);
        assert.equal(result.unitPrice, 325.25);
      }
    });

    it("rejects zero, negative, fractional, or non-numeric quantities", () => {
      const product = makeProduct({ stockQuantity: 10 });

      for (const invalidInput of [0, -2, 2.5, "abc", ""]) {
        const res = validateCartQuantity(invalidInput, product, "en");
        assert.equal(res.isValid, false);
        if (!res.isValid) {
          assert.equal(res.reason, "invalid_quantity");
        }
      }
    });

    it("rejects quantities exceeding available stock with localized error messages in en, mr, and hi", () => {
      const product = makeProduct({ stockQuantity: 5 });

      const enRes = validateCartQuantity(6, product, "en");
      const mrRes = validateCartQuantity(6, product, "mr");
      const hiRes = validateCartQuantity(6, product, "hi");

      assert.equal(enRes.isValid, false);
      assert.equal(mrRes.isValid, false);
      assert.equal(hiRes.isValid, false);

      if (!enRes.isValid && !mrRes.isValid && !hiRes.isValid) {
        assert.equal(enRes.reason, "exceeds_stock");
        assert.ok(enRes.error.includes("5"));
        assert.ok(mrRes.error.includes("5"));
        assert.ok(hiRes.error.includes("5"));
        assert.notEqual(enRes.error, mrRes.error);
        assert.notEqual(enRes.error, hiRes.error);
      }
    });

    it("rejects draft, archived, out-of-stock, and enquiry-only products from being added to cart", () => {
      const draft = makeProduct({ status: "draft" });
      const archived = makeProduct({ status: "archived" });
      const outOfStock = makeProduct({ stockQuantity: 0 });
      const enquiryOnly = makeProduct({ unitPrice: null });

      const r1 = validateCartQuantity(1, draft, "en");
      const r2 = validateCartQuantity(1, archived, "mr");
      const r3 = validateCartQuantity(1, outOfStock, "hi");
      const r4 = validateCartQuantity(1, enquiryOnly, "en");

      assert.equal(r1.isValid, false);
      assert.equal(r2.isValid, false);
      assert.equal(r3.isValid, false);
      assert.equal(r4.isValid, false);

      if (!r1.isValid) assert.equal(r1.reason, "product_unavailable");
      if (!r2.isValid) assert.equal(r2.reason, "product_unavailable");
      if (!r3.isValid) assert.equal(r3.reason, "out_of_stock");
      if (!r4.isValid) assert.equal(r4.reason, "price_unavailable");
    });
  });

  describe("3. Cart item mutations & subtotal/total calculation", () => {
    it("adds active products, increments existing items, and blocks exceeding stock across additions", () => {
      const productA = makeProduct({
        id: "prod-a",
        sku: "SKU-A",
        name: "Formulation A",
        unitPrice: 250,
        stockQuantity: 5,
      });
      const productB = makeProduct({
        id: "prod-b",
        sku: "SKU-B",
        name: "Formulation B",
        unitPrice: 400.5,
        stockQuantity: 10,
      });

      const step1 = addOrUpdateCartItem([], productA, 2, "500 ml", "en");
      assert.equal(step1.ok, true);
      if (!step1.ok) return;

      const step2 = addOrUpdateCartItem(
        step1.items,
        productA,
        2,
        "500 ml",
        "en"
      );
      assert.equal(step2.ok, true);
      if (!step2.ok) return;
      assert.equal(step2.item.quantity, 4);

      // Adding 2 more would make 6 > stockQuantity (5), so it must be rejected
      const stepOverflow = addOrUpdateCartItem(
        step2.items,
        productA,
        2,
        "500 ml",
        "en"
      );
      assert.equal(stepOverflow.ok, false);
      if (!stepOverflow.ok) {
        assert.equal(stepOverflow.reason, "exceeds_stock");
      }

      const step3 = addOrUpdateCartItem(
        step2.items,
        productB,
        3,
        "1 L",
        "en"
      );
      assert.equal(step3.ok, true);
      if (!step3.ok) return;

      const totals = calculateCartTotals(step3.items);
      // Product A: 4 * 250 = 1000; Product B: 3 * 400.5 = 1201.5 => 2201.5
      assert.equal(totals.subtotal, 2201.5);
      assert.equal(totals.total, 2201.5);
      assert.equal(totals.totalItems, 7);
      assert.equal(totals.uniqueItems, 2);

      // Update quantity of Product A to 1
      const step4 = updateCartItemQuantity(
        step3.items,
        "prod-a",
        1,
        productA,
        "en"
      );
      assert.equal(step4.ok, true);
      if (!step4.ok) return;

      const updatedTotals = calculateCartTotals(step4.items);
      assert.equal(updatedTotals.subtotal, 1451.5);
      assert.equal(updatedTotals.totalItems, 4);

      // Remove Product B
      const afterRemove = removeCartItem(step4.items, "prod-b");
      assert.equal(afterRemove.length, 1);
      assert.equal(calculateCartTotals(afterRemove).total, 250);
    });
  });

  describe("4. Authoritative cart revalidation against server product records", () => {
    it("overrides tampered client prices, clamps excess quantities, and removes inactive or out-of-stock products", () => {
      const authoritativeProducts: ProductRecord[] = [
        makeProduct({
          id: "prod-valid",
          name: "Verified Input 1",
          unitPrice: 600,
          stockQuantity: 4,
          status: "active",
        }),
        makeProduct({
          id: "prod-archived",
          name: "Archived Input 2",
          unitPrice: 300,
          status: "archived",
        }),
        makeProduct({
          id: "prod-oos",
          name: "Out of Stock Input 3",
          unitPrice: 450,
          stockQuantity: 0,
          status: "active",
        }),
      ];

      // Client payload with tampered unitPrice (10 instead of 600), excess quantity (9 > 4),
      // an archived product, and an out-of-stock product
      const untrustedClientCart = [
        {
          productId: "prod-valid",
          name: "Verified Input 1",
          unitPrice: 10, // Tampered client price!
          quantity: 9, // Exceeds availableStock (4)!
          packSize: "500 ml",
        },
        {
          productId: "prod-archived",
          name: "Archived Input 2",
          unitPrice: 300,
          quantity: 1,
        },
        {
          productId: "prod-oos",
          name: "Out of Stock Input 3",
          unitPrice: 450,
          quantity: 2,
        },
      ];

      const summary = revalidateCartAgainstProducts(
        untrustedClientCart,
        authoritativeProducts,
        "en"
      );

      // Only prod-valid remains, at authoritative price 600 and clamped quantity 4
      assert.equal(summary.items.length, 1);
      assert.equal(summary.items[0].productId, "prod-valid");
      assert.equal(summary.items[0].unitPrice, 600);
      assert.equal(summary.items[0].quantity, 4);
      assert.equal(summary.items[0].lineSubtotal, 2400);
      assert.equal(summary.subtotal, 2400);
      assert.equal(summary.total, 2400);
      assert.equal(summary.hasAdjustments, true);
      assert.equal(summary.isValidForCheckout, false);

      const issueTypes = summary.issues.map((i) => i.type).sort();
      assert.deepEqual(issueTypes, [
        "out_of_stock",
        "price_updated",
        "quantity_adjusted",
        "removed_inactive",
      ]);
    });

    it("marks cart as valid for checkout when all items match authoritative active products", () => {
      const authoritativeProducts = [
        makeProduct({
          id: "prod-1",
          unitPrice: 500,
          stockQuantity: 10,
          status: "active",
        }),
      ];

      const cleanClientCart = sanitizeStoredCartItems([
        {
          productId: "prod-1",
          sku: "AGRO-101",
          name: "Bio-Nutrient Foliar Concentrate",
          category: "Crop Nutrition",
          packSize: "500 ml",
          unitPrice: 500,
          quantity: 2,
          availableStock: 10,
        },
      ]);

      const summary = revalidateCartAgainstProducts(
        cleanClientCart,
        authoritativeProducts,
        "mr"
      );

      assert.equal(summary.isValidForCheckout, true);
      assert.equal(summary.hasAdjustments, false);
      assert.equal(summary.issues.length, 0);
      assert.equal(summary.subtotal, 1000);
      assert.equal(summary.total, 1000);
      assert.equal(summary.totalItems, 2);
    });
  });

  describe("5. Proxy & RBAC protection for /customer/cart and /api/customer/cart/validate", () => {
    it("redirects unauthenticated or admin users away from /customer/cart", () => {
      const unauthDecision = evaluateProxyRouteAccess({
        pathname: "/customer/cart",
        hasSessionCookie: false,
        roleCookie: undefined,
      });
      assert.deepEqual(unauthDecision, {
        action: "redirect",
        loginPath: "/customer/login",
        reason: "auth_required",
      });

      const adminDecision = evaluateProxyRouteAccess({
        pathname: "/customer/cart",
        hasSessionCookie: true,
        roleCookie: "admin",
      });
      assert.deepEqual(adminDecision, {
        action: "redirect",
        loginPath: "/customer/login",
        reason: "forbidden_role",
      });
    });

    it("protects /api/customer/cart/validate against unauthenticated and non-customer requests", () => {
      const unauthApi = evaluateProxyRouteAccess({
        pathname: "/api/customer/cart/validate",
        hasSessionCookie: false,
        roleCookie: undefined,
      });
      assert.equal(unauthApi.action, "json_error");
      if (unauthApi.action === "json_error") {
        assert.equal(unauthApi.status, 401);
        assert.equal(unauthApi.code, "UNAUTHENTICATED");
      }

      const adminApi = evaluateProxyRouteAccess({
        pathname: "/api/customer/cart/validate",
        hasSessionCookie: true,
        roleCookie: "admin",
      });
      assert.equal(adminApi.action, "json_error");
      if (adminApi.action === "json_error") {
        assert.equal(adminApi.status, 403);
        assert.equal(adminApi.code, "FORBIDDEN_ROLE");
      }

      const customerApi = evaluateProxyRouteAccess({
        pathname: "/api/customer/cart/validate",
        hasSessionCookie: true,
        roleCookie: "customer",
      });
      assert.deepEqual(customerApi, { action: "allow" });
    });
  });
});
