import type {
  CartItem,
  CartRevalidationIssue,
  CartValidationSummary,
  ProductAvailabilityState,
  ProductRecord,
  SupportedLanguage,
  ValidatedCartLineItem,
} from "../../types/index.ts";
import {
  DEFAULT_LANGUAGE,
  formatCurrencyForLanguage,
  getTranslations,
} from "../language/index.ts";

export const CART_STORAGE_KEY = "supriya_customer_cart_v1";
export const CART_CHANGE_EVENT = "supriya:cart-change";
export const DEFAULT_MAX_ORDER_QUANTITY = 50;

export function roundCurrency(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

/**
 * Defense-in-depth filter ensuring only active products are ever shown or available to customers.
 * Draft and archived products are strictly excluded.
 */
export function filterActiveCustomerProducts(
  products: readonly ProductRecord[]
): ProductRecord[] {
  if (!Array.isArray(products)) {
    return [];
  }
  return products.filter((product) => product && product.status === "active");
}

/**
 * Resolves the maximum orderable stock for a product.
 * - Inactive, draft, archived, or explicitly out-of-stock products have 0 available stock.
 * - When `stockQuantity` is explicitly provided on a product, it is enforced as the upper limit.
 * - When `stockQuantity` is omitted on a standard Phase 3 active product, defaults to `DEFAULT_MAX_ORDER_QUANTITY`.
 */
export function getAvailableStockForProduct(
  product: ProductRecord | null | undefined
): number {
  if (!product || product.status !== "active") {
    return 0;
  }

  if (product.stockStatus === "out_of_stock") {
    return 0;
  }

  if (
    product.stockQuantity !== undefined &&
    product.stockQuantity !== null
  ) {
    if (
      typeof product.stockQuantity !== "number" ||
      !Number.isFinite(product.stockQuantity) ||
      product.stockQuantity <= 0
    ) {
      return 0;
    }
    return Math.min(
      Math.floor(product.stockQuantity),
      DEFAULT_MAX_ORDER_QUANTITY
    );
  }

  return DEFAULT_MAX_ORDER_QUANTITY;
}

/**
 * Resolves the customer-facing availability state of a product.
 */
export function getProductAvailabilityState(
  product: ProductRecord | null | undefined
): ProductAvailabilityState {
  if (!product || product.status !== "active") {
    return "unavailable";
  }

  const availableStock = getAvailableStockForProduct(product);
  if (availableStock <= 0) {
    return "out_of_stock";
  }

  if (
    product.unitPrice === null ||
    typeof product.unitPrice !== "number" ||
    !Number.isFinite(product.unitPrice) ||
    product.unitPrice <= 0
  ) {
    return "enquiry_only";
  }

  return "in_stock";
}

/**
 * Returns true if and only if the product is active, has a valid positive unit price,
 * and has available stock > 0.
 */
export function isProductAvailableForSale(
  product: ProductRecord | null | undefined
): boolean {
  return getProductAvailabilityState(product) === "in_stock";
}

export type QuantityValidationFailureReason =
  | "product_unavailable"
  | "price_unavailable"
  | "out_of_stock"
  | "invalid_quantity"
  | "exceeds_stock";

export type QuantityValidationResult =
  | {
      isValid: true;
      quantity: number;
      availableStock: number;
      unitPrice: number;
    }
  | {
      isValid: false;
      reason: QuantityValidationFailureReason;
      availableStock: number;
      error: string;
    };

/**
 * Validates a requested cart quantity against a product's status, unit price, and available stock.
 */
export function validateCartQuantity(
  requestedQuantity: unknown,
  product: ProductRecord | null | undefined,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): QuantityValidationResult {
  const v = getTranslations(language).validation;

  if (!product || product.status !== "active") {
    return {
      isValid: false,
      reason: "product_unavailable",
      availableStock: 0,
      error: v.cartProductUnavailable,
    };
  }

  const availableStock = getAvailableStockForProduct(product);
  if (availableStock <= 0) {
    return {
      isValid: false,
      reason: "out_of_stock",
      availableStock: 0,
      error: v.cartOutOfStock,
    };
  }

  if (
    product.unitPrice === null ||
    typeof product.unitPrice !== "number" ||
    !Number.isFinite(product.unitPrice) ||
    product.unitPrice <= 0
  ) {
    return {
      isValid: false,
      reason: "price_unavailable",
      availableStock,
      error: v.cartPriceUnavailable,
    };
  }

  const parsedQty =
    typeof requestedQuantity === "number"
      ? requestedQuantity
      : typeof requestedQuantity === "string" &&
          requestedQuantity.trim() !== ""
        ? Number(requestedQuantity.trim())
        : NaN;

  if (!Number.isInteger(parsedQty) || parsedQty < 1) {
    return {
      isValid: false,
      reason: "invalid_quantity",
      availableStock,
      error: v.cartInvalidQuantity,
    };
  }

  if (parsedQty > availableStock) {
    return {
      isValid: false,
      reason: "exceeds_stock",
      availableStock,
      error: v.cartQuantityExceedsStock(availableStock),
    };
  }

  return {
    isValid: true,
    quantity: parsedQty,
    availableStock,
    unitPrice: roundCurrency(product.unitPrice),
  };
}

/**
 * Adds a product to the cart (or increments its quantity if already present),
 * validating the resulting total quantity against available stock and authoritative product state.
 */
export function addOrUpdateCartItem(
  currentItems: readonly CartItem[],
  product: ProductRecord | null | undefined,
  quantityToAdd: unknown,
  selectedPackSize?: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
):
  | {
      ok: true;
      items: CartItem[];
      item: CartItem;
    }
  | {
      ok: false;
      reason: QuantityValidationFailureReason;
      error: string;
      availableStock: number;
    } {
  const existingItem = product
    ? currentItems.find((item) => item.productId === product.id)
    : undefined;
  const baseQty = existingItem ? existingItem.quantity : 0;

  // First validate the delta quantity itself is a positive integer
  const deltaValidation = validateCartQuantity(
    quantityToAdd,
    product,
    language
  );
  if (!deltaValidation.isValid) {
    return {
      ok: false,
      reason: deltaValidation.reason,
      error: deltaValidation.error,
      availableStock: deltaValidation.availableStock,
    };
  }

  const combinedQuantity = baseQty + deltaValidation.quantity;
  const totalValidation = validateCartQuantity(
    combinedQuantity,
    product,
    language
  );
  if (!totalValidation.isValid || !product) {
    return {
      ok: false,
      reason: totalValidation.isValid
        ? "product_unavailable"
        : totalValidation.reason,
      error: totalValidation.isValid
        ? getTranslations(language).validation.cartProductUnavailable
        : totalValidation.error,
      availableStock: totalValidation.availableStock,
    };
  }

  const resolvedPackSize =
    selectedPackSize && product.packSizes.includes(selectedPackSize)
      ? selectedPackSize
      : existingItem?.packSize &&
          product.packSizes.includes(existingItem.packSize)
        ? existingItem.packSize
        : (product.packSizes[0] ?? "");

  const updatedItem: CartItem = {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    packSize: resolvedPackSize,
    unitPrice: totalValidation.unitPrice,
    quantity: totalValidation.quantity,
    availableStock: totalValidation.availableStock,
    imageUrl: product.imageUrl ?? null,
  };

  const nextItems = existingItem
    ? currentItems.map((item) =>
        item.productId === product.id ? updatedItem : item
      )
    : [...currentItems, updatedItem];

  return {
    ok: true,
    items: nextItems,
    item: updatedItem,
  };
}

/**
 * Updates the quantity (and optionally pack size) of an existing cart item,
 * validating against the authoritative product record when provided or the stored stock limit.
 */
export function updateCartItemQuantity(
  currentItems: readonly CartItem[],
  productId: string,
  newQuantity: unknown,
  authoritativeProduct?: ProductRecord | null,
  language: SupportedLanguage = DEFAULT_LANGUAGE
):
  | {
      ok: true;
      items: CartItem[];
    }
  | {
      ok: false;
      reason: QuantityValidationFailureReason;
      error: string;
      availableStock: number;
    } {
  const existingItem = currentItems.find(
    (item) => item.productId === productId
  );
  if (!existingItem) {
    return {
      ok: false,
      reason: "product_unavailable",
      error: getTranslations(language).validation.cartProductUnavailable,
      availableStock: 0,
    };
  }

  const productToValidate: ProductRecord = authoritativeProduct ?? {
    id: existingItem.productId,
    sku: existingItem.sku,
    name: existingItem.name,
    category: existingItem.category,
    shortDescription: "",
    composition: "",
    targetCrops: [],
    dosageAndApplication: "",
    packSizes: existingItem.packSize ? [existingItem.packSize] : [],
    unitPrice: existingItem.unitPrice,
    safetyAndStorage: "",
    registrationNumber: "",
    status: "active",
    createdAt: "",
    updatedAt: "",
    createdByUid: "",
    updatedByUid: "",
    stockQuantity: existingItem.availableStock,
    imageUrl: existingItem.imageUrl ?? null,
  };

  const validation = validateCartQuantity(
    newQuantity,
    productToValidate,
    language
  );
  if (!validation.isValid) {
    return {
      ok: false,
      reason: validation.reason,
      error: validation.error,
      availableStock: validation.availableStock,
    };
  }

  const nextItems = currentItems.map((item) =>
    item.productId === productId
      ? {
          ...item,
          unitPrice: validation.unitPrice,
          quantity: validation.quantity,
          availableStock: validation.availableStock,
        }
      : item
  );

  return {
    ok: true,
    items: nextItems,
  };
}

/**
 * Removes a product from the cart by productId.
 */
export function removeCartItem(
  currentItems: readonly CartItem[],
  productId: string
): CartItem[] {
  return currentItems.filter((item) => item.productId !== productId);
}

/**
 * Computes cart subtotal, total, total units, and unique product count.
 */
export function calculateCartTotals(items: readonly CartItem[]): {
  subtotal: number;
  total: number;
  totalItems: number;
  uniqueItems: number;
} {
  let subtotal = 0;
  let totalItems = 0;
  let uniqueItems = 0;

  for (const item of items) {
    if (
      !item ||
      typeof item.unitPrice !== "number" ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      continue;
    }
    subtotal = roundCurrency(subtotal + roundCurrency(item.unitPrice * item.quantity));
    totalItems += item.quantity;
    uniqueItems += 1;
  }

  return {
    subtotal,
    total: subtotal,
    totalItems,
    uniqueItems,
  };
}

/**
 * Revalidates untrusted client cart items against authoritative server ProductRecord data.
 *
 * Security invariants:
 * 1. Client-supplied prices are NEVER trusted; subtotal and total are always computed
 *    from `authoritativeProduct.unitPrice`.
 * 2. Draft, archived, or deleted products are immediately removed and reported in `issues`.
 * 3. Out-of-stock products or products without a valid unit price are removed and reported in `issues`.
 * 4. Quantities exceeding `availableStock` are clamped to `availableStock` and reported in `issues`.
 */
export function revalidateCartAgainstProducts(
  clientItemsInput: unknown,
  authoritativeProducts: readonly ProductRecord[],
  language: SupportedLanguage = DEFAULT_LANGUAGE
): CartValidationSummary {
  const cc = getTranslations(language).customerCart;
  const productMap = new Map<string, ProductRecord>();

  for (const product of authoritativeProducts) {
    if (product && typeof product.id === "string") {
      productMap.set(product.id, product);
    }
  }

  const rawItems = Array.isArray(clientItemsInput) ? clientItemsInput : [];
  const validatedItems: ValidatedCartLineItem[] = [];
  const issues: CartRevalidationIssue[] = [];
  const seenProductIds = new Set<string>();

  for (const rawEntry of rawItems) {
    if (!rawEntry || typeof rawEntry !== "object") {
      continue;
    }

    const entry = rawEntry as Record<string, unknown>;
    const productId =
      typeof entry.productId === "string" ? entry.productId.trim() : "";
    if (!productId || seenProductIds.has(productId)) {
      continue;
    }
    seenProductIds.add(productId);

    const fallbackName =
      typeof entry.name === "string" && entry.name.trim()
        ? entry.name.trim()
        : productId;

    const authoritativeProduct = productMap.get(productId);

    if (!authoritativeProduct || authoritativeProduct.status !== "active") {
      issues.push({
        productId,
        productName: authoritativeProduct?.name ?? fallbackName,
        type: "removed_inactive",
        message: cc.issueRemovedInactive(
          authoritativeProduct?.name ?? fallbackName
        ),
      });
      continue;
    }

    const availableStock = getAvailableStockForProduct(authoritativeProduct);
    if (availableStock <= 0) {
      issues.push({
        productId,
        productName: authoritativeProduct.name,
        type: "out_of_stock",
        message: cc.issueOutOfStock(authoritativeProduct.name),
      });
      continue;
    }

    if (
      authoritativeProduct.unitPrice === null ||
      typeof authoritativeProduct.unitPrice !== "number" ||
      !Number.isFinite(authoritativeProduct.unitPrice) ||
      authoritativeProduct.unitPrice <= 0
    ) {
      issues.push({
        productId,
        productName: authoritativeProduct.name,
        type: "price_unavailable",
        message: cc.issuePriceUnavailable(authoritativeProduct.name),
      });
      continue;
    }

    const authoritativePrice = roundCurrency(authoritativeProduct.unitPrice);
    const clientPrice =
      typeof entry.unitPrice === "number" && Number.isFinite(entry.unitPrice)
        ? roundCurrency(entry.unitPrice)
        : null;

    if (clientPrice !== null && clientPrice !== authoritativePrice) {
      issues.push({
        productId,
        productName: authoritativeProduct.name,
        type: "price_updated",
        previousPrice: clientPrice,
        updatedPrice: authoritativePrice,
        message: cc.issuePriceUpdated(
          authoritativeProduct.name,
          formatCurrencyForLanguage(clientPrice, language),
          formatCurrencyForLanguage(authoritativePrice, language)
        ),
      });
    }

    const rawQty = Number(entry.quantity);
    let validatedQty = 1;

    if (!Number.isInteger(rawQty) || rawQty < 1) {
      validatedQty = 1;
      issues.push({
        productId,
        productName: authoritativeProduct.name,
        type: "invalid_quantity",
        requestedQuantity: Number.isFinite(rawQty) ? rawQty : 0,
        adjustedQuantity: 1,
        message: cc.issueInvalidQuantity(authoritativeProduct.name),
      });
    } else if (rawQty > availableStock) {
      validatedQty = availableStock;
      issues.push({
        productId,
        productName: authoritativeProduct.name,
        type: "quantity_adjusted",
        requestedQuantity: rawQty,
        adjustedQuantity: availableStock,
        message: cc.issueQuantityAdjusted(
          authoritativeProduct.name,
          rawQty,
          availableStock
        ),
      });
    } else {
      validatedQty = rawQty;
    }

    const requestedPackSize =
      typeof entry.packSize === "string" ? entry.packSize.trim() : "";
    const resolvedPackSize = authoritativeProduct.packSizes.includes(
      requestedPackSize
    )
      ? requestedPackSize
      : (authoritativeProduct.packSizes[0] ?? "");

    const lineSubtotal = roundCurrency(authoritativePrice * validatedQty);

    validatedItems.push({
      productId: authoritativeProduct.id,
      sku: authoritativeProduct.sku,
      name: authoritativeProduct.name,
      category: authoritativeProduct.category,
      packSize: resolvedPackSize,
      unitPrice: authoritativePrice,
      quantity: validatedQty,
      availableStock,
      lineSubtotal,
      imageUrl: authoritativeProduct.imageUrl ?? null,
    });
  }

  const subtotal = roundCurrency(
    validatedItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
  );
  const totalItems = validatedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    isValidForCheckout: validatedItems.length > 0 && issues.length === 0,
    hasAdjustments: issues.length > 0,
    items: validatedItems,
    issues,
    subtotal,
    total: subtotal,
    totalItems,
    uniqueItems: validatedItems.length,
    validatedAt: new Date().toISOString(),
  };
}

/**
 * Sanitizes a raw JSON array from localStorage into safe CartItem structures.
 */
export function sanitizeStoredCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const sanitized: CartItem[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const productId =
      typeof record.productId === "string" ? record.productId.trim() : "";
    const sku = typeof record.sku === "string" ? record.sku.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const category =
      typeof record.category === "string" ? record.category.trim() : "";
    const packSize =
      typeof record.packSize === "string" ? record.packSize.trim() : "";
    const unitPrice =
      typeof record.unitPrice === "number" &&
      Number.isFinite(record.unitPrice) &&
      record.unitPrice > 0
        ? roundCurrency(record.unitPrice)
        : 0;
    const quantity =
      typeof record.quantity === "number" &&
      Number.isInteger(record.quantity) &&
      record.quantity >= 1
        ? Math.min(record.quantity, DEFAULT_MAX_ORDER_QUANTITY)
        : 0;
    const availableStock =
      typeof record.availableStock === "number" &&
      Number.isFinite(record.availableStock) &&
      record.availableStock >= 1
        ? Math.min(
            Math.floor(record.availableStock),
            DEFAULT_MAX_ORDER_QUANTITY
          )
        : DEFAULT_MAX_ORDER_QUANTITY;
    const imageUrl =
      typeof record.imageUrl === "string" && record.imageUrl.trim()
        ? record.imageUrl.trim()
        : null;

    if (!productId || !name || unitPrice <= 0 || quantity < 1 || seen.has(productId)) {
      continue;
    }

    seen.add(productId);
    sanitized.push({
      productId,
      sku,
      name,
      category,
      packSize,
      unitPrice,
      quantity: Math.min(quantity, availableStock),
      availableStock,
      imageUrl,
    });
  }

  return sanitized;
}

let cachedRawCartJson: string | null = null;
let cachedParsedCartItems: CartItem[] = [];
const EMPTY_CART_ITEMS: CartItem[] = [];

export function getServerCartSnapshot(): CartItem[] {
  return EMPTY_CART_ITEMS;
}

/**
 * Reads persisted cart items on the client from localStorage with referential caching
 * so React's `useSyncExternalStore` never triggers infinite re-renders.
 */
export function getStoredCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART_ITEMS;
  }

  try {
    const rawJson = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawJson) {
      cachedRawCartJson = null;
      cachedParsedCartItems = EMPTY_CART_ITEMS;
      return EMPTY_CART_ITEMS;
    }

    if (rawJson === cachedRawCartJson) {
      return cachedParsedCartItems;
    }

    const parsed = JSON.parse(rawJson) as unknown;
    cachedRawCartJson = rawJson;
    cachedParsedCartItems = sanitizeStoredCartItems(parsed);
    return cachedParsedCartItems;
  } catch {
    return EMPTY_CART_ITEMS;
  }
}

/**
 * Persists cart items to localStorage and dispatches a synchronization event.
 */
export function setStoredCartItems(items: readonly CartItem[]): CartItem[] {
  const sanitized = sanitizeStoredCartItems(items);

  if (typeof window === "undefined") {
    return sanitized;
  }

  try {
    if (sanitized.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      cachedRawCartJson = null;
      cachedParsedCartItems = EMPTY_CART_ITEMS;
    } else {
      const serialized = JSON.stringify(sanitized);
      window.localStorage.setItem(CART_STORAGE_KEY, serialized);
      cachedRawCartJson = serialized;
      cachedParsedCartItems = sanitized;
    }
  } catch {
    // Ignore storage quota or privacy mode errors
  }

  window.dispatchEvent(new CustomEvent(CART_CHANGE_EVENT));
  return sanitized;
}
