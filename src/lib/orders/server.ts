import type {
  AdminOrderStatusTransitionResult,
  CheckoutDeliveryInput,
  CustomerOrderView,
  OrderLineItemSnapshot,
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  SupportedLanguage,
  VerifiedSessionUser,
} from "../../types/index.ts";
import { getFirebaseAdminDb } from "../firebase/admin.ts";
import { listActiveProductsForCustomer } from "../products/server.ts";
import { DEFAULT_LANGUAGE } from "../language/index.ts";
import {
  generateOrderNumber,
  toCustomerOrderView,
  validateAdminOrderStatusTransition,
  validateAndBuildOrderCreation,
  type OrderCreationValidationResult,
} from "./index.ts";

if (typeof window !== "undefined") {
  throw new Error(
    "CRITICAL SECURITY VIOLATION: src/lib/orders/server.ts is server-only and must never be imported in browser code."
  );
}

const ORDERS_COLLECTION = "orders";

function normalizeOrderStatus(value: unknown): OrderStatus {
  if (
    value === "pending_verification" ||
    value === "verified" ||
    value === "rejected" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "pending_verification";
}

function normalizePaymentStatus(value: unknown): PaymentStatus {
  if (
    value === "unpaid" ||
    value === "pending" ||
    value === "paid" ||
    value === "failed"
  ) {
    return value;
  }
  return "unpaid";
}

function mapRawDeliveryDetails(raw: unknown): CheckoutDeliveryInput {
  const obj =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  return {
    customerName:
      typeof obj.customerName === "string" ? obj.customerName : "",
    mobile: typeof obj.mobile === "string" ? obj.mobile : "",
    addressLine: typeof obj.addressLine === "string" ? obj.addressLine : "",
    villageOrCity:
      typeof obj.villageOrCity === "string" ? obj.villageOrCity : "",
    district: typeof obj.district === "string" ? obj.district : "",
    state: typeof obj.state === "string" ? obj.state : "",
    pinCode: typeof obj.pinCode === "string" ? obj.pinCode : "",
  };
}

function mapRawLineItems(raw: unknown): OrderLineItemSnapshot[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    )
    .map((item) => ({
      productId: typeof item.productId === "string" ? item.productId : "",
      sku: typeof item.sku === "string" ? item.sku : "",
      name: typeof item.name === "string" ? item.name : "",
      category: typeof item.category === "string" ? item.category : "",
      packSize: typeof item.packSize === "string" ? item.packSize : "",
      unitPrice:
        typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)
          ? item.unitPrice
          : 0,
      quantity:
        typeof item.quantity === "number" && Number.isFinite(item.quantity)
          ? item.quantity
          : 0,
      lineSubtotal:
        typeof item.lineSubtotal === "number" &&
        Number.isFinite(item.lineSubtotal)
          ? item.lineSubtotal
          : 0,
    }));
}

export function mapFirestoreDocToOrder(
  id: string,
  raw: Record<string, unknown>
): OrderRecord {
  const nowIso = new Date().toISOString();
  const items = mapRawLineItems(raw.items);

  const order: OrderRecord = {
    id,
    orderNumber:
      typeof raw.orderNumber === "string" && raw.orderNumber
        ? raw.orderNumber
        : `ORD-${id.slice(0, 6).toUpperCase()}`,
    customerUid:
      typeof raw.customerUid === "string" ? raw.customerUid : "",
    customerEmail:
      typeof raw.customerEmail === "string" ? raw.customerEmail : "",
    items,
    uniqueItems:
      typeof raw.uniqueItems === "number" && Number.isFinite(raw.uniqueItems)
        ? raw.uniqueItems
        : items.length,
    totalItems:
      typeof raw.totalItems === "number" && Number.isFinite(raw.totalItems)
        ? raw.totalItems
        : items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal:
      typeof raw.subtotal === "number" && Number.isFinite(raw.subtotal)
        ? raw.subtotal
        : 0,
    total:
      typeof raw.total === "number" && Number.isFinite(raw.total)
        ? raw.total
        : 0,
    deliveryDetails: mapRawDeliveryDetails(raw.deliveryDetails),
    orderStatus: normalizeOrderStatus(raw.orderStatus),
    paymentStatus: normalizePaymentStatus(raw.paymentStatus),
    idempotencyKey:
      typeof raw.idempotencyKey === "string" ? raw.idempotencyKey : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso,
  };

  if (typeof raw.verifiedAt === "string" && raw.verifiedAt) {
    order.verifiedAt = raw.verifiedAt;
  }
  if (typeof raw.verifiedByUid === "string" && raw.verifiedByUid) {
    order.verifiedByUid = raw.verifiedByUid;
  }
  if (typeof raw.rejectedAt === "string" && raw.rejectedAt) {
    order.rejectedAt = raw.rejectedAt;
  }
  if (typeof raw.rejectedByUid === "string" && raw.rejectedByUid) {
    order.rejectedByUid = raw.rejectedByUid;
  }
  if (typeof raw.rejectionReason === "string" && raw.rejectionReason) {
    order.rejectionReason = raw.rejectionReason;
  }
  // Phase 5: Optional payment metadata fields
  if (typeof raw.paymentOrderId === "string" && raw.paymentOrderId) {
    order.paymentOrderId = raw.paymentOrderId;
  }
  if (typeof raw.paymentId === "string" && raw.paymentId) {
    order.paymentId = raw.paymentId;
  }
  if (typeof raw.paymentMethod === "string" && raw.paymentMethod) {
    order.paymentMethod = raw.paymentMethod;
  }
  if (typeof raw.paidAt === "string" && raw.paidAt) {
    order.paidAt = raw.paidAt;
  }
  if (typeof raw.paymentFailureReason === "string" && raw.paymentFailureReason) {
    order.paymentFailureReason = raw.paymentFailureReason;
  }

  return order;
}

/**
 * Sanitizes an OrderRecord for Firestore persistence by guaranteeing
 * that no properties contain `undefined` values.
 */
export function sanitizeOrderForFirestore(
  order: OrderRecord
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerUid: order.customerUid,
    customerEmail: order.customerEmail,
    items: order.items,
    uniqueItems: order.uniqueItems,
    totalItems: order.totalItems,
    subtotal: order.subtotal,
    total: order.total,
    deliveryDetails: order.deliveryDetails,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    idempotencyKey: order.idempotencyKey,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };

  if (typeof order.verifiedAt === "string" && order.verifiedAt) {
    payload.verifiedAt = order.verifiedAt;
  }
  if (typeof order.verifiedByUid === "string" && order.verifiedByUid) {
    payload.verifiedByUid = order.verifiedByUid;
  }
  if (typeof order.rejectedAt === "string" && order.rejectedAt) {
    payload.rejectedAt = order.rejectedAt;
  }
  if (typeof order.rejectedByUid === "string" && order.rejectedByUid) {
    payload.rejectedByUid = order.rejectedByUid;
  }
  if (typeof order.rejectionReason === "string" && order.rejectionReason) {
    payload.rejectionReason = order.rejectionReason;
  }
  // Phase 5: Optional payment metadata fields (guaranteed non-undefined)
  if (typeof order.paymentOrderId === "string" && order.paymentOrderId) {
    payload.paymentOrderId = order.paymentOrderId;
  }
  if (typeof order.paymentId === "string" && order.paymentId) {
    payload.paymentId = order.paymentId;
  }
  if (typeof order.paymentMethod === "string" && order.paymentMethod) {
    payload.paymentMethod = order.paymentMethod;
  }
  if (typeof order.paidAt === "string" && order.paidAt) {
    payload.paidAt = order.paidAt;
  }
  if (
    typeof order.paymentFailureReason === "string" &&
    order.paymentFailureReason
  ) {
    payload.paymentFailureReason = order.paymentFailureReason;
  }

  return payload;
}

/**
 * Lists recent orders belonging strictly to the authenticated customer.
 */
export async function listOrdersForCustomer(
  sessionUser: VerifiedSessionUser
): Promise<OrderRecord[]> {
  if (sessionUser.role !== "customer" || !sessionUser.uid) {
    return [];
  }

  const adminDb = getFirebaseAdminDb();
  const snapshot = await adminDb
    .collection(ORDERS_COLLECTION)
    .where("customerUid", "==", sessionUser.uid)
    .get();

  const orders = snapshot.docs
    .map((doc) =>
      mapFirestoreDocToOrder(doc.id, doc.data() as Record<string, unknown>)
    )
    .filter((order) => order.customerUid === sessionUser.uid);

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Retrieves a single order by ID only if it belongs to the authenticated customer.
 */
export async function getCustomerOrderByIdForCustomer(
  orderId: string,
  sessionUser: VerifiedSessionUser
): Promise<CustomerOrderView | null> {
  const trimmedId = orderId.trim();
  if (!trimmedId || sessionUser.role !== "customer" || !sessionUser.uid) {
    return null;
  }

  const adminDb = getFirebaseAdminDb();
  let docSnap = await adminDb
    .collection(ORDERS_COLLECTION)
    .doc(trimmedId)
    .get();

  if (!docSnap.exists) {
    const querySnapshot = await adminDb
      .collection(ORDERS_COLLECTION)
      .where("orderNumber", "==", trimmedId)
      .where("customerUid", "==", sessionUser.uid)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }
    docSnap = querySnapshot.docs[0];
  }

  const order = mapFirestoreDocToOrder(
    docSnap.id,
    docSnap.data() as Record<string, unknown>
  );

  return toCustomerOrderView(order, sessionUser.uid);
}

/**
 * Validates and persists a new customer order in Firestore using authoritative server product records.
 */
export async function createCustomerOrderInFirestore(
  rawBody: unknown,
  sessionUser: VerifiedSessionUser,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): Promise<OrderCreationValidationResult> {
  const adminDb = getFirebaseAdminDb();

  // Fetch authoritative active products and customer's existing orders in parallel
  const [authoritativeProducts, existingCustomerOrders] = await Promise.all([
    listActiveProductsForCustomer(),
    listOrdersForCustomer(sessionUser),
  ]);

  const newDocRef = adminDb.collection(ORDERS_COLLECTION).doc();
  const now = new Date();
  const generatedOrderNumber = generateOrderNumber(
    now,
    newDocRef.id.slice(0, 6)
  );

  const validationResult = validateAndBuildOrderCreation({
    sessionUser,
    rawBody,
    authoritativeProducts,
    existingCustomerOrders,
    generatedOrderId: newDocRef.id,
    generatedOrderNumber,
    nowIso: now.toISOString(),
    language,
  });

  if (!validationResult.ok) {
    return validationResult;
  }

  // If duplicate submission was detected, return the existing order without writing a duplicate document
  if (validationResult.duplicate) {
    return validationResult;
  }

  const payloadToSave = sanitizeOrderForFirestore(validationResult.order);
  await newDocRef.set(payloadToSave);

  return validationResult;
}

/**
 * Lists all recorded customer orders for authorized administrative review.
 * Orders are sorted in reverse chronological order (newest first).
 */
export async function listOrdersForAdmin(): Promise<OrderRecord[]> {
  const adminDb = getFirebaseAdminDb();
  const snapshot = await adminDb.collection(ORDERS_COLLECTION).get();

  const orders = snapshot.docs.map((doc) =>
    mapFirestoreDocToOrder(doc.id, doc.data() as Record<string, unknown>)
  );

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Retrieves a single order record by ID for authorized administrative review.
 */
export async function getOrderByIdForAdmin(
  orderId: string
): Promise<OrderRecord | null> {
  const trimmedId = orderId.trim();
  if (!trimmedId) {
    return null;
  }

  const adminDb = getFirebaseAdminDb();
  let docSnap = await adminDb
    .collection(ORDERS_COLLECTION)
    .doc(trimmedId)
    .get();

  if (!docSnap.exists) {
    const querySnapshot = await adminDb
      .collection(ORDERS_COLLECTION)
      .where("orderNumber", "==", trimmedId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }
    docSnap = querySnapshot.docs[0];
  }

  return mapFirestoreDocToOrder(
    docSnap.id,
    docSnap.data() as Record<string, unknown>
  );
}

/**
 * Authoritatively updates order status (verify or reject) by an authorized admin.
 *
 * Invariants:
 * 1. Admin identity is verified strictly through sessionUser (never client-supplied parameters).
 * 2. Only orders in "pending_verification" status can be verified or rejected.
 * 3. Payment status is STRICTLY UNCHANGED upon verification/rejection.
 * 4. Audit fields (verifiedAt/rejectedAt, verifiedByUid/rejectedByUid, rejectionReason) are recorded.
 */
export async function updateOrderStatusByAdmin(
  orderId: string,
  action: unknown,
  adminUser: VerifiedSessionUser,
  rejectionReason?: string
): Promise<AdminOrderStatusTransitionResult> {
  if (adminUser.role !== "admin" || !adminUser.uid) {
    return {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      error:
        "Access denied. Only authorized administrators can update order status.",
    };
  }

  const trimmedId = orderId.trim();
  if (!trimmedId) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
      error: "Order ID is required.",
    };
  }

  const adminDb = getFirebaseAdminDb();
  let docRef = adminDb.collection(ORDERS_COLLECTION).doc(trimmedId);
  let docSnap = await docRef.get();

  if (!docSnap.exists) {
    const querySnapshot = await adminDb
      .collection(ORDERS_COLLECTION)
      .where("orderNumber", "==", trimmedId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return {
        ok: false,
        code: "ORDER_NOT_FOUND",
        error: "Order record not found.",
      };
    }
    docSnap = querySnapshot.docs[0];
    docRef = docSnap.ref;
  }

  const existingOrder = mapFirestoreDocToOrder(
    docSnap.id,
    docSnap.data() as Record<string, unknown>
  );

  const transitionResult = validateAdminOrderStatusTransition(
    existingOrder,
    action,
    adminUser.uid,
    rejectionReason
  );

  if (!transitionResult.ok) {
    return transitionResult;
  }

  const payloadToSave = sanitizeOrderForFirestore(transitionResult.updatedOrder);
  await docRef.set(payloadToSave, { merge: true });

  return transitionResult;
}

