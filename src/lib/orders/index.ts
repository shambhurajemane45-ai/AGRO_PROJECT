import type {
  AccountStatus,
  AdminOrderStatusTransitionResult,
  CheckoutDeliveryErrors,
  CheckoutDeliveryInput,
  CustomerOrderView,
  OrderLineItemSnapshot,
  OrderRecord,
  PaymentStatusTransitionPayload,
  PaymentStatusTransitionResult,
  PortalRole,
  ProductRecord,
  SupportedLanguage,
} from "../../types/index.ts";
import {
  DEFAULT_LANGUAGE,
  getTranslations,
} from "../language/index.ts";
import {
  getAvailableStockForProduct,
  roundCurrency,
} from "../cart/index.ts";

const MOBILE_REGEX = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const PIN_CODE_REGEX = /^[1-9][0-9]{5}$/;
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates customer delivery details for checkout in the active language.
 */
export function validateCheckoutDeliveryInput(
  raw: unknown,
  language: SupportedLanguage = DEFAULT_LANGUAGE
):
  | { valid: true; data: CheckoutDeliveryInput }
  | { valid: false; errors: CheckoutDeliveryErrors } {
  const v = getTranslations(language).validation;

  if (!isPlainObject(raw)) {
    return {
      valid: false,
      errors: { customerName: v.deliveryNameRequired },
    };
  }

  const errors: CheckoutDeliveryErrors = {};

  const customerName =
    typeof raw.customerName === "string" ? raw.customerName.trim() : "";
  const mobile =
    typeof raw.mobile === "string" ? raw.mobile.trim() : "";
  const addressLine =
    typeof raw.addressLine === "string" ? raw.addressLine.trim() : "";
  const villageOrCity =
    typeof raw.villageOrCity === "string" ? raw.villageOrCity.trim() : "";
  const district =
    typeof raw.district === "string" ? raw.district.trim() : "";
  const state =
    typeof raw.state === "string" ? raw.state.trim() : "";
  const pinCode =
    typeof raw.pinCode === "string" ? raw.pinCode.trim() : "";

  if (!customerName) {
    errors.customerName = v.deliveryNameRequired;
  } else if (customerName.length < 2 || customerName.length > 120) {
    errors.customerName = v.deliveryNameLength;
  }

  if (!mobile) {
    errors.mobile = v.deliveryMobileRequired;
  } else if (!MOBILE_REGEX.test(mobile)) {
    errors.mobile = v.deliveryMobileInvalid;
  }

  if (!addressLine) {
    errors.addressLine = v.deliveryAddressRequired;
  } else if (addressLine.length < 5 || addressLine.length > 300) {
    errors.addressLine = v.deliveryAddressLength;
  }

  if (!villageOrCity) {
    errors.villageOrCity = v.deliveryVillageOrCityRequired;
  } else if (villageOrCity.length < 2 || villageOrCity.length > 100) {
    errors.villageOrCity = v.deliveryVillageOrCityLength;
  }

  if (!district) {
    errors.district = v.deliveryDistrictRequired;
  } else if (district.length < 2 || district.length > 100) {
    errors.district = v.deliveryDistrictLength;
  }

  if (!state) {
    errors.state = v.deliveryStateRequired;
  } else if (state.length < 2 || state.length > 100) {
    errors.state = v.deliveryStateLength;
  }

  if (!pinCode) {
    errors.pinCode = v.deliveryPinCodeRequired;
  } else if (!PIN_CODE_REGEX.test(pinCode)) {
    errors.pinCode = v.deliveryPinCodeInvalid;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      customerName,
      mobile,
      addressLine,
      villageOrCity,
      district,
      state,
      pinCode,
    },
  };
}

/**
 * Generates a human-readable server order reference number (e.g., ORD-20261022-A1B2C3).
 */
export function generateOrderNumber(
  now: Date = new Date(),
  randomSuffix?: string
): string {
  const year = now.getUTCFullYear().toString();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const cleanSuffix = (
    randomSuffix ??
    Math.random().toString(36).slice(2, 8)
  )
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .padEnd(6, "0")
    .slice(0, 6);

  return `ORD-${year}${month}${day}-${cleanSuffix}`;
}

/**
 * Produces a deterministic fingerprint for duplicate submission prevention.
 */
export function computeOrderSubmissionFingerprint(
  customerUid: string,
  items: ReadonlyArray<{
    productId: string;
    packSize: string;
    quantity: number;
  }>,
  deliveryDetails: CheckoutDeliveryInput
): string {
  const normalizedItems = [...items]
    .map((item) => ({
      productId: item.productId.trim(),
      packSize: item.packSize.trim(),
      quantity: item.quantity,
    }))
    .sort((a, b) =>
      `${a.productId}:${a.packSize}`.localeCompare(
        `${b.productId}:${b.packSize}`
      )
    )
    .map((item) => `${item.productId}|${item.packSize}|${item.quantity}`)
    .join(";");

  const normalizedDelivery = [
    deliveryDetails.customerName.toLowerCase(),
    deliveryDetails.mobile.replace(/\s+/g, ""),
    deliveryDetails.addressLine.toLowerCase(),
    deliveryDetails.villageOrCity.toLowerCase(),
    deliveryDetails.district.toLowerCase(),
    deliveryDetails.state.toLowerCase(),
    deliveryDetails.pinCode,
  ].join("|");

  return `fp:${customerUid}:${normalizedItems}:${normalizedDelivery}`;
}

/**
 * Projects an internal OrderRecord into a safe CustomerOrderView only if owned by the requesting customer.
 */
export function toCustomerOrderView(
  order: OrderRecord | null | undefined,
  requestingCustomerUid: string
): CustomerOrderView | null {
  if (!order || !requestingCustomerUid) {
    return null;
  }

  if (order.customerUid !== requestingCustomerUid) {
    return null;
  }

  const view: CustomerOrderView = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerUid: order.customerUid,
    customerEmail: order.customerEmail,
    items: order.items.map((item) => ({ ...item })),
    uniqueItems: order.uniqueItems,
    totalItems: order.totalItems,
    subtotal: order.subtotal,
    total: order.total,
    deliveryDetails: { ...order.deliveryDetails },
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  if (order.verifiedAt) view.verifiedAt = order.verifiedAt;
  if (order.verifiedByUid) view.verifiedByUid = order.verifiedByUid;
  if (order.rejectedAt) view.rejectedAt = order.rejectedAt;
  if (order.rejectedByUid) view.rejectedByUid = order.rejectedByUid;
  if (order.rejectionReason) view.rejectionReason = order.rejectionReason;
  // Phase 5: Optional payment metadata fields
  if (order.paymentOrderId) view.paymentOrderId = order.paymentOrderId;
  if (order.paymentId) view.paymentId = order.paymentId;
  if (order.paymentMethod) view.paymentMethod = order.paymentMethod;
  if (order.paidAt) view.paidAt = order.paidAt;
  if (order.paymentFailureReason) view.paymentFailureReason = order.paymentFailureReason;

  return view;
}

/**
 * Authoritative, pure evaluation of an administrative order status transition (verify or reject).
 *
 * Invariants:
 * 1. Only orders with orderStatus === "pending_verification" can be verified or rejected.
 * 2. Attempting to transition an already verified, rejected, or cancelled order fails with an error.
 * 3. Payment status is STRICTLY UNCHANGED upon verification or rejection. It is never marked as paid.
 * 4. The admin's verified UID and action timestamp are authoritatively recorded.
 */
export function validateAdminOrderStatusTransition(
  order: OrderRecord,
  action: unknown,
  adminUid: string,
  rejectionReason?: string,
  nowIso: string = new Date().toISOString()
): AdminOrderStatusTransitionResult {
  if (!order || typeof order !== "object") {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      error: "Order record not found.",
    };
  }

  if (action !== "verify" && action !== "reject") {
    return {
      ok: false,
      code: "INVALID_ACTION",
      error: "Invalid action. Allowed actions are 'verify' and 'reject'.",
    };
  }

  if (order.orderStatus === "verified") {
    return {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      error: "Order has already been verified and cannot be modified.",
    };
  }

  if (order.orderStatus === "rejected") {
    return {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      error: "Order has already been rejected and cannot be modified.",
    };
  }

  if (order.orderStatus === "cancelled") {
    return {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      error: "Cannot change the status of a cancelled customer order.",
    };
  }

  if (order.orderStatus !== "pending_verification") {
    return {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      error: `Cannot transition order with current status '${order.orderStatus}'.`,
    };
  }

  if (action === "verify") {
    const updatedOrder: OrderRecord = {
      ...order,
      orderStatus: "verified",
      // Payment status remains independent and unchanged
      paymentStatus: order.paymentStatus,
      verifiedAt: nowIso,
      verifiedByUid: adminUid,
      updatedAt: nowIso,
    };
    delete updatedOrder.rejectedAt;
    delete updatedOrder.rejectedByUid;
    delete updatedOrder.rejectionReason;

    return {
      ok: true,
      updatedOrder,
    };
  }

  // action === "reject"
  const cleanReason =
    typeof rejectionReason === "string" ? rejectionReason.trim() : "";

  const updatedOrder: OrderRecord = {
    ...order,
    orderStatus: "rejected",
    // Payment status remains independent and unchanged
    paymentStatus: order.paymentStatus,
    rejectedAt: nowIso,
    rejectedByUid: adminUid,
    updatedAt: nowIso,
  };
  if (cleanReason) {
    updatedOrder.rejectionReason = cleanReason;
  } else {
    delete updatedOrder.rejectionReason;
  }
  delete updatedOrder.verifiedAt;
  delete updatedOrder.verifiedByUid;

  return {
    ok: true,
    updatedOrder,
  };
}

/**
 * Phase 5: Authoritative, pure evaluation of payment status transitions.
 *
 * Invariants:
 * 1. Independent of Order Verification: Order status is NOT assumed or modified here.
 *    Payment state transitions remain strictly decoupled from admin order verification.
 * 2. Protected Paid State: An order with paymentStatus === "paid" is immutable and terminal.
 *    It cannot be downgraded to "unpaid", "pending", or "failed", and failure events
 *    cannot overwrite confirmed payments.
 * 3. Pure State Machine: Does NOT perform payment gateway processing, secret verification,
 *    or network calls. Trusted gateway verification must happen on the server prior to confirm_paid.
 * 4. Permitted Actions & Transitions:
 *    - "initiate": transitions "unpaid" or "failed" -> "pending".
 *      Records paymentOrderId (e.g. gateway order ref). Clears previous paymentFailureReason.
 *    - "confirm_paid": transitions "pending", "unpaid", or "failed" (upon retry) -> "paid".
 *      Records paidAt timestamp, paymentId, paymentOrderId, and paymentMethod. Clears paymentFailureReason.
 *    - "record_failure": transitions "pending" or "unpaid" -> "failed".
 *      Records paymentFailureReason. Does NOT alter or set paidAt.
 *    - "reset_unpaid": transitions "pending" or "failed" -> "unpaid".
 *      Returns order to unpaid state (e.g. timeout / session expired).
 */
export function validatePaymentStatusTransition(
  order: OrderRecord,
  payload: PaymentStatusTransitionPayload
): PaymentStatusTransitionResult {
  if (!order || typeof order !== "object") {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      error: "Order record not found.",
    };
  }

  const action = payload?.action;
  if (
    action !== "initiate" &&
    action !== "confirm_paid" &&
    action !== "record_failure" &&
    action !== "reset_unpaid"
  ) {
    return {
      ok: false,
      code: "INVALID_ACTION",
      error: `Invalid payment transition action '${String(action)}'. Supported actions are 'initiate', 'confirm_paid', 'record_failure', and 'reset_unpaid'.`,
    };
  }

  // Invariant: Once an order is paid, it is strictly terminal and non-downgradeable.
  if (order.paymentStatus === "paid") {
    return {
      ok: false,
      code: "ALREADY_PAID",
      error: "Order is already marked as paid. Payment status is final and cannot be modified or downgraded.",
    };
  }

  const nowIso =
    typeof payload.nowIso === "string" && payload.nowIso.trim()
      ? payload.nowIso.trim()
      : new Date().toISOString();

  const cleanPaymentOrderId =
    typeof payload.paymentOrderId === "string" ? payload.paymentOrderId.trim() : "";
  const cleanPaymentId =
    typeof payload.paymentId === "string" ? payload.paymentId.trim() : "";
  const cleanPaymentMethod =
    typeof payload.paymentMethod === "string" ? payload.paymentMethod.trim() : "";
  const cleanFailureReason =
    typeof payload.failureReason === "string" ? payload.failureReason.trim() : "";

  if (action === "initiate") {
    // Valid from "unpaid", "failed", or refreshing "pending"
    const updatedOrder: OrderRecord = {
      ...order,
      paymentStatus: "pending",
      updatedAt: nowIso,
    };

    if (cleanPaymentOrderId) {
      updatedOrder.paymentOrderId = cleanPaymentOrderId;
    }
    delete updatedOrder.paymentFailureReason;

    return {
      ok: true,
      updatedOrder,
    };
  }

  if (action === "confirm_paid") {
    // Valid from "pending", "unpaid", or "failed" (upon retry)
    const updatedOrder: OrderRecord = {
      ...order,
      paymentStatus: "paid",
      paidAt: nowIso,
      updatedAt: nowIso,
    };

    if (cleanPaymentId) {
      updatedOrder.paymentId = cleanPaymentId;
    }
    if (cleanPaymentOrderId) {
      updatedOrder.paymentOrderId = cleanPaymentOrderId;
    } else if (order.paymentOrderId) {
      updatedOrder.paymentOrderId = order.paymentOrderId;
    }
    if (cleanPaymentMethod) {
      updatedOrder.paymentMethod = cleanPaymentMethod;
    } else if (order.paymentMethod) {
      updatedOrder.paymentMethod = order.paymentMethod;
    }
    delete updatedOrder.paymentFailureReason;

    return {
      ok: true,
      updatedOrder,
    };
  }

  if (action === "record_failure") {
    // Valid from "pending" or "unpaid"
    const updatedOrder: OrderRecord = {
      ...order,
      paymentStatus: "failed",
      updatedAt: nowIso,
    };

    if (cleanFailureReason) {
      updatedOrder.paymentFailureReason = cleanFailureReason;
    } else {
      delete updatedOrder.paymentFailureReason;
    }
    if (cleanPaymentOrderId) {
      updatedOrder.paymentOrderId = cleanPaymentOrderId;
    }
    delete updatedOrder.paidAt;

    return {
      ok: true,
      updatedOrder,
    };
  }

  // action === "reset_unpaid"
  // Valid from "pending" or "failed"
  const updatedOrder: OrderRecord = {
    ...order,
    paymentStatus: "unpaid",
    updatedAt: nowIso,
  };
  delete updatedOrder.paidAt;
  delete updatedOrder.paymentFailureReason;

  return {
    ok: true,
    updatedOrder,
  };
}

export type OrderCreationErrorCode =
  | "UNAUTHORIZED_CUSTOMER"
  | "FORBIDDEN_CUSTOMER_MISMATCH"
  | "INVALID_PAYLOAD"
  | "INVALID_DELIVERY_DETAILS"
  | "EMPTY_CART"
  | "PRODUCT_UNAVAILABLE"
  | "PRICE_UNAVAILABLE"
  | "PRODUCT_OUT_OF_STOCK"
  | "INVALID_PACK_SIZE"
  | "INVALID_QUANTITY"
  | "EXCEEDS_AVAILABLE_STOCK";

export type OrderCreationValidationResult =
  | {
      ok: true;
      duplicate: boolean;
      order: OrderRecord;
      customerOrder: CustomerOrderView;
    }
  | {
      ok: false;
      status: 400 | 401 | 403 | 409;
      code: OrderCreationErrorCode;
      error: string;
      fieldErrors?: CheckoutDeliveryErrors;
    };

export interface ValidateOrderCreationParams {
  sessionUser: {
    uid: string;
    email?: string;
    role: PortalRole;
    status: AccountStatus;
  } | null;
  rawBody: unknown;
  authoritativeProducts: ReadonlyArray<ProductRecord>;
  existingCustomerOrders?: ReadonlyArray<OrderRecord>;
  generatedOrderId: string;
  generatedOrderNumber?: string;
  nowIso?: string;
  language?: SupportedLanguage;
}

/**
 * Performs complete, authoritative server-side validation and builds an immutable OrderRecord.
 * - Never trusts client-supplied unit prices, subtotals, totals, roles, product status, or payment status.
 * - Rejects attempts to create orders for another user UID.
 * - Validates product active status, price availability, stock availability, packSize membership, and quantities.
 * - Enforces initial orderStatus = "pending_verification" and paymentStatus = "unpaid".
 * - Prevents accidental duplicate order creation via idempotency key or recent payload fingerprint.
 */
export function validateAndBuildOrderCreation(
  params: ValidateOrderCreationParams
): OrderCreationValidationResult {
  const language = params.language ?? DEFAULT_LANGUAGE;
  const t = getTranslations(language);
  const v = t.validation;

  const { sessionUser, rawBody, authoritativeProducts } = params;

  if (
    !sessionUser ||
    !sessionUser.uid ||
    sessionUser.role !== "customer" ||
    sessionUser.status !== "active"
  ) {
    return {
      ok: false,
      status: 403,
      code: "UNAUTHORIZED_CUSTOMER",
      error: v.orderForbiddenCustomerMismatch,
    };
  }

  if (!isPlainObject(rawBody)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_PAYLOAD",
      error: t.customerCheckout.submissionErrorFallback,
    };
  }

  // Prevent customers from creating orders on behalf of another user
  const suppliedCustomerFields = [
    rawBody.customerUid,
    rawBody.uid,
    rawBody.userId,
  ];
  for (const field of suppliedCustomerFields) {
    if (
      typeof field === "string" &&
      field.trim().length > 0 &&
      field.trim() !== sessionUser.uid
    ) {
      return {
        ok: false,
        status: 403,
        code: "FORBIDDEN_CUSTOMER_MISMATCH",
        error: v.orderForbiddenCustomerMismatch,
      };
    }
  }

  // Validate delivery details
  const deliveryValidation = validateCheckoutDeliveryInput(
    rawBody.deliveryDetails,
    language
  );
  if (!deliveryValidation.valid) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_DELIVERY_DETAILS",
      error:
        Object.values(deliveryValidation.errors).find(Boolean) ??
        t.customerCheckout.submissionErrorFallback,
      fieldErrors: deliveryValidation.errors,
    };
  }

  // Validate cart items array
  if (!Array.isArray(rawBody.items) || rawBody.items.length === 0) {
    return {
      ok: false,
      status: 400,
      code: "EMPTY_CART",
      error: v.orderEmptyCart,
    };
  }

  if (rawBody.items.length > 50) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_PAYLOAD",
      error: t.customerCheckout.submissionErrorFallback,
    };
  }

  // Index authoritative products by ID
  const productMap = new Map<string, ProductRecord>();
  for (const product of authoritativeProducts) {
    if (product && typeof product.id === "string") {
      productMap.set(product.id, product);
    }
  }

  // Track cumulative quantity per productId across line items to prevent stock bypass via split lines
  const cumulativeQtyByProduct = new Map<string, number>();
  // Merge identical (productId + packSize) lines if sent multiple times
  const mergedLineMap = new Map<
    string,
    { product: ProductRecord; packSize: string; quantity: number }
  >();

  for (const rawItem of rawBody.items) {
    if (!isPlainObject(rawItem)) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_PAYLOAD",
        error: t.customerCheckout.submissionErrorFallback,
      };
    }

    const productId =
      typeof rawItem.productId === "string" ? rawItem.productId.trim() : "";
    if (!productId) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_PAYLOAD",
        error: t.customerCheckout.submissionErrorFallback,
      };
    }

    const authoritativeProduct = productMap.get(productId);
    const fallbackName =
      typeof rawItem.name === "string" && rawItem.name.trim()
        ? rawItem.name.trim()
        : productId;

    if (!authoritativeProduct || authoritativeProduct.status !== "active") {
      return {
        ok: false,
        status: 400,
        code: "PRODUCT_UNAVAILABLE",
        error: v.orderProductUnavailable(
          authoritativeProduct?.name ?? fallbackName
        ),
      };
    }

    if (
      typeof authoritativeProduct.unitPrice !== "number" ||
      !Number.isFinite(authoritativeProduct.unitPrice) ||
      authoritativeProduct.unitPrice <= 0
    ) {
      return {
        ok: false,
        status: 400,
        code: "PRICE_UNAVAILABLE",
        error: v.cartPriceUnavailable,
      };
    }

    const availableStock = getAvailableStockForProduct(authoritativeProduct);
    if (availableStock <= 0) {
      return {
        ok: false,
        status: 400,
        code: "PRODUCT_OUT_OF_STOCK",
        error: v.cartOutOfStock,
      };
    }

    const packSize =
      typeof rawItem.packSize === "string" ? rawItem.packSize.trim() : "";
    const validPackSizes = Array.isArray(authoritativeProduct.packSizes)
      ? authoritativeProduct.packSizes
      : [];

    if (!packSize || !validPackSizes.includes(packSize)) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_PACK_SIZE",
        error: v.orderInvalidPackSize(authoritativeProduct.name),
      };
    }

    const requestedQty = Number(rawItem.quantity);
    if (!Number.isInteger(requestedQty) || requestedQty < 1) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_QUANTITY",
        error: v.cartInvalidQuantity,
      };
    }

    const newCumulativeQty =
      (cumulativeQtyByProduct.get(productId) ?? 0) + requestedQty;
    if (newCumulativeQty > availableStock) {
      return {
        ok: false,
        status: 400,
        code: "EXCEEDS_AVAILABLE_STOCK",
        error: v.cartQuantityExceedsStock(availableStock),
      };
    }
    cumulativeQtyByProduct.set(productId, newCumulativeQty);

    const lineKey = `${productId}::${packSize}`;
    const existingLine = mergedLineMap.get(lineKey);
    if (existingLine) {
      existingLine.quantity += requestedQty;
    } else {
      mergedLineMap.set(lineKey, {
        product: authoritativeProduct,
        packSize,
        quantity: requestedQty,
      });
    }
  }

  // Build verified line item snapshots and recalculate every price, subtotal, and total on the server
  const verifiedItems: OrderLineItemSnapshot[] = [];
  for (const { product, packSize, quantity } of mergedLineMap.values()) {
    const unitPrice = roundCurrency(product.unitPrice!);
    const lineSubtotal = roundCurrency(unitPrice * quantity);

    verifiedItems.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      packSize,
      unitPrice,
      quantity,
      lineSubtotal,
    });
  }

  const uniqueItems = verifiedItems.length;
  const totalItems = verifiedItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = roundCurrency(
    verifiedItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
  );
  const total = subtotal;

  const nowIso = params.nowIso ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);

  const rawIdempotencyKey =
    typeof rawBody.idempotencyKey === "string"
      ? rawBody.idempotencyKey.trim()
      : "";
  const submissionFingerprint = computeOrderSubmissionFingerprint(
    sessionUser.uid,
    verifiedItems,
    deliveryValidation.data
  );
  const effectiveIdempotencyKey =
    rawIdempotencyKey.length >= 8 && rawIdempotencyKey.length <= 128
      ? `ik:${sessionUser.uid}:${rawIdempotencyKey}`
      : submissionFingerprint;

  // Check existing orders for duplicate submission
  const existingOrders = params.existingCustomerOrders ?? [];
  for (const existing of existingOrders) {
    if (existing.customerUid !== sessionUser.uid) {
      continue;
    }

    if (
      existing.idempotencyKey &&
      (existing.idempotencyKey === effectiveIdempotencyKey ||
        existing.idempotencyKey === submissionFingerprint)
    ) {
      const existingView = toCustomerOrderView(existing, sessionUser.uid);
      if (existingView) {
        return {
          ok: true,
          duplicate: true,
          order: existing,
          customerOrder: existingView,
        };
      }
    }

    const existingFingerprint = computeOrderSubmissionFingerprint(
      existing.customerUid,
      existing.items,
      existing.deliveryDetails
    );
    const existingCreatedMs = Date.parse(existing.createdAt);
    if (
      existingFingerprint === submissionFingerprint &&
      Number.isFinite(nowMs) &&
      Number.isFinite(existingCreatedMs) &&
      Math.abs(nowMs - existingCreatedMs) <= DUPLICATE_WINDOW_MS
    ) {
      const existingView = toCustomerOrderView(existing, sessionUser.uid);
      if (existingView) {
        return {
          ok: true,
          duplicate: true,
          order: existing,
          customerOrder: existingView,
        };
      }
    }
  }

  const orderNumber =
    params.generatedOrderNumber ??
    generateOrderNumber(
      Number.isFinite(nowMs) ? new Date(nowMs) : new Date(),
      params.generatedOrderId.slice(0, 6)
    );

  // Enforce initial orderStatus = "pending_verification" and paymentStatus = "unpaid"
  const orderRecord: OrderRecord = {
    id: params.generatedOrderId,
    orderNumber,
    customerUid: sessionUser.uid,
    customerEmail: sessionUser.email ?? "",
    items: verifiedItems,
    uniqueItems,
    totalItems,
    subtotal,
    total,
    deliveryDetails: deliveryValidation.data,
    orderStatus: "pending_verification",
    paymentStatus: "unpaid",
    idempotencyKey: effectiveIdempotencyKey,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return {
    ok: true,
    duplicate: false,
    order: orderRecord,
    customerOrder: toCustomerOrderView(orderRecord, sessionUser.uid)!,
  };
}
