import { NextResponse, type NextRequest } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  getProductByIdForAdmin,
  updateProductRecord,
} from "@/lib/products/server";
import { validateProductPayload } from "@/lib/validation";

interface ProductRouteContext {
  params: Promise<{
    productId: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: ProductRouteContext
) {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { productId } = await context.params;

  try {
    const product = await getProductByIdForAdmin(productId);
    if (!product) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_FOUND",
          error: "Product record not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      product,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Failed to load product record from Firestore.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: ProductRouteContext
) {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { productId } = await context.params;

  let body: Record<string, unknown>;
  try {
    const parsed = (await request.json()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        {
          ok: false,
          code: "INVALID_REQUEST",
          error: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        error: "Invalid JSON request body.",
      },
      { status: 400 }
    );
  }

  const validation = validateProductPayload(body);
  if (!validation.isValid || !validation.data) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Please correct the highlighted product specification fields.",
        fieldErrors: validation.errors,
      },
      { status: 400 }
    );
  }

  try {
    const result = await updateProductRecord(
      productId,
      validation.data,
      auth.user
    );

    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          error: result.error,
          fieldErrors:
            result.code === "DUPLICATE_SKU"
              ? { sku: result.error }
              : undefined,
        },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      product: result.product,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Failed to update product record in Firestore.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: ProductRouteContext
) {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { productId } = await context.params;
  const trimmedId = productId.trim();
  if (!trimmedId) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_FOUND",
        error: "Product record not found.",
      },
      { status: 404 }
    );
  }

  try {
    const adminDb = getFirebaseAdminDb();
    const docRef = adminDb.collection("products").doc(trimmedId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_FOUND",
          error: "Product record not found.",
        },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      ok: true,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Failed to delete product record.",
      },
      { status: 500 }
    );
  }
}
