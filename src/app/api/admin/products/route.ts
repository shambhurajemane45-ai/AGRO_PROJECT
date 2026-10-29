import { NextResponse, type NextRequest } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import {
  createProductRecord,
  listProductsForAdmin,
} from "@/lib/products/server";
import { validateProductPayload } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const products = await listProductsForAdmin();
    return NextResponse.json({
      ok: true,
      products,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Unable to load product master records from Firestore.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

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
    const result = await createProductRecord(validation.data, auth.user);
    if (!result.ok) {
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
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        product: result.product,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Failed to save product record in Firestore.",
      },
      { status: 500 }
    );
  }
}
