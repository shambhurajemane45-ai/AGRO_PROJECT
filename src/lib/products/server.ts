import type {
  ProductRecord,
  ProductStatus,
  ValidatedProductPayload,
  VerifiedSessionUser,
} from "../../types/index.ts";
import { getFirebaseAdminDb } from "../firebase/admin.ts";

if (typeof window !== "undefined") {
  throw new Error(
    "CRITICAL SECURITY VIOLATION: src/lib/products/server.ts is server-only and must never be imported in browser code."
  );
}

const PRODUCTS_COLLECTION = "products";

function normalizeStatus(value: unknown): ProductStatus {
  if (value === "active" || value === "draft" || value === "archived") {
    return value;
  }
  return "draft";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mapFirestoreDocToProduct(
  id: string,
  raw: Record<string, unknown>
): ProductRecord {
  const nowIso = new Date().toISOString();
  const product: ProductRecord = {
    id,
    sku: typeof raw.sku === "string" ? raw.sku : "",
    name: typeof raw.name === "string" ? raw.name : "",
    category: typeof raw.category === "string" ? raw.category : "",
    shortDescription:
      typeof raw.shortDescription === "string" ? raw.shortDescription : "",
    composition: typeof raw.composition === "string" ? raw.composition : "",
    targetCrops: normalizeStringArray(raw.targetCrops),
    dosageAndApplication:
      typeof raw.dosageAndApplication === "string"
        ? raw.dosageAndApplication
        : "",
    packSizes: normalizeStringArray(raw.packSizes),
    unitPrice:
      typeof raw.unitPrice === "number" && Number.isFinite(raw.unitPrice)
        ? raw.unitPrice
        : null,
    safetyAndStorage:
      typeof raw.safetyAndStorage === "string" ? raw.safetyAndStorage : "",
    registrationNumber:
      typeof raw.registrationNumber === "string" ? raw.registrationNumber : "",
    status: normalizeStatus(raw.status),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso,
    createdByUid:
      typeof raw.createdByUid === "string" ? raw.createdByUid : "",
    updatedByUid:
      typeof raw.updatedByUid === "string" ? raw.updatedByUid : "",
  };

  if (typeof raw.imageUrl === "string" && raw.imageUrl.trim().length > 0) {
    product.imageUrl = raw.imageUrl.trim();
  }

  if (
    typeof raw.stockQuantity === "number" &&
    Number.isFinite(raw.stockQuantity)
  ) {
    product.stockQuantity = Math.max(0, Math.floor(raw.stockQuantity));
  }

  if (raw.stockStatus === "in_stock" || raw.stockStatus === "out_of_stock") {
    product.stockStatus = raw.stockStatus;
  } else if (raw.inStock === false) {
    product.stockStatus = "out_of_stock";
  } else if (raw.inStock === true) {
    product.stockStatus = "in_stock";
  }

  return product;
}

/**
 * Lists all company products (active, draft, archived) for authorized administrators.
 */
export async function listProductsForAdmin(): Promise<ProductRecord[]> {
  const adminDb = getFirebaseAdminDb();
  const snapshot = await adminDb.collection(PRODUCTS_COLLECTION).get();

  const products = snapshot.docs.map((doc) =>
    mapFirestoreDocToProduct(doc.id, doc.data() as Record<string, unknown>)
  );

  return products.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Lists only active company products for authenticated customers.
 * Sorted in-memory to avoid requiring manual Firestore composite indexes.
 */
export async function listActiveProductsForCustomer(): Promise<ProductRecord[]> {
  const adminDb = getFirebaseAdminDb();
  const snapshot = await adminDb
    .collection(PRODUCTS_COLLECTION)
    .where("status", "==", "active")
    .get();

  const products = snapshot.docs
    .map((doc) =>
      mapFirestoreDocToProduct(doc.id, doc.data() as Record<string, unknown>)
    )
    .filter((product) => product.status === "active");

  return products.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Retrieves a single product by document ID for authorized administrators.
 */
export async function getProductByIdForAdmin(
  productId: string
): Promise<ProductRecord | null> {
  const trimmedId = productId.trim();
  if (!trimmedId) {
    return null;
  }

  const adminDb = getFirebaseAdminDb();
  const docSnap = await adminDb
    .collection(PRODUCTS_COLLECTION)
    .doc(trimmedId)
    .get();

  if (!docSnap.exists) {
    return null;
  }

  return mapFirestoreDocToProduct(
    docSnap.id,
    docSnap.data() as Record<string, unknown>
  );
}

/**
 * Retrieves a single active product by document ID for authenticated customers.
 * Draft or archived products are never returned to customers.
 */
export async function getActiveProductByIdForCustomer(
  productId: string
): Promise<ProductRecord | null> {
  const product = await getProductByIdForAdmin(productId);
  if (!product || product.status !== "active") {
    return null;
  }
  return product;
}

export type ProductMutationResult =
  | {
      ok: true;
      product: ProductRecord;
    }
  | {
      ok: false;
      code: "DUPLICATE_SKU" | "NOT_FOUND";
      error: string;
    };

/**
 * Creates a new verified product record in Firestore.
 */
export async function createProductRecord(
  payload: ValidatedProductPayload,
  adminUser: VerifiedSessionUser
): Promise<ProductMutationResult> {
  const adminDb = getFirebaseAdminDb();
  const collectionRef = adminDb.collection(PRODUCTS_COLLECTION);

  const duplicateSkuSnap = await collectionRef
    .where("sku", "==", payload.sku)
    .limit(1)
    .get();

  if (!duplicateSkuSnap.empty) {
    return {
      ok: false,
      code: "DUPLICATE_SKU",
      error: `A product with SKU "${payload.sku}" already exists.`,
    };
  }

  const nowIso = new Date().toISOString();
  const docRef = collectionRef.doc();

  const documentData = {
    sku: payload.sku,
    name: payload.name,
    category: payload.category,
    shortDescription: payload.shortDescription,
    composition: payload.composition,
    targetCrops: payload.targetCrops,
    dosageAndApplication: payload.dosageAndApplication,
    packSizes: payload.packSizes,
    unitPrice: payload.unitPrice,
    safetyAndStorage: payload.safetyAndStorage,
    registrationNumber: payload.registrationNumber,
    status: payload.status,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdByUid: adminUser.uid,
    updatedByUid: adminUser.uid,
  };

  await docRef.set(documentData);

  return {
    ok: true,
    product: mapFirestoreDocToProduct(docRef.id, documentData),
  };
}

/**
 * Updates an existing product record in Firestore.
 */
export async function updateProductRecord(
  productId: string,
  payload: ValidatedProductPayload,
  adminUser: VerifiedSessionUser
): Promise<ProductMutationResult> {
  const trimmedId = productId.trim();
  if (!trimmedId) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "Product record not found.",
    };
  }

  const adminDb = getFirebaseAdminDb();
  const collectionRef = adminDb.collection(PRODUCTS_COLLECTION);
  const docRef = collectionRef.doc(trimmedId);
  const existingSnap = await docRef.get();

  if (!existingSnap.exists) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "Product record not found.",
    };
  }

  const existingData = existingSnap.data() as Record<string, unknown>;

  if (existingData.sku !== payload.sku) {
    const duplicateSkuSnap = await collectionRef
      .where("sku", "==", payload.sku)
      .limit(2)
      .get();

    const conflictingDoc = duplicateSkuSnap.docs.find(
      (doc) => doc.id !== trimmedId
    );
    if (conflictingDoc) {
      return {
        ok: false,
        code: "DUPLICATE_SKU",
        error: `Another product already uses SKU "${payload.sku}".`,
      };
    }
  }

  const nowIso = new Date().toISOString();
  const createdAt =
    typeof existingData.createdAt === "string"
      ? existingData.createdAt
      : nowIso;
  const createdByUid =
    typeof existingData.createdByUid === "string"
      ? existingData.createdByUid
      : adminUser.uid;

  const updatedData = {
    sku: payload.sku,
    name: payload.name,
    category: payload.category,
    shortDescription: payload.shortDescription,
    composition: payload.composition,
    targetCrops: payload.targetCrops,
    dosageAndApplication: payload.dosageAndApplication,
    packSizes: payload.packSizes,
    unitPrice: payload.unitPrice,
    safetyAndStorage: payload.safetyAndStorage,
    registrationNumber: payload.registrationNumber,
    status: payload.status,
    createdAt,
    updatedAt: nowIso,
    createdByUid,
    updatedByUid: adminUser.uid,
  };

  await docRef.set(updatedData);

  return {
    ok: true,
    product: mapFirestoreDocToProduct(docRef.id, updatedData),
  };
}
