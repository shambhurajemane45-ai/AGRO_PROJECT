import { NextResponse, type NextRequest } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import { revalidateCartAgainstProducts } from "@/lib/cart";
import { normalizeLanguage } from "@/lib/language";
import { listActiveProductsForCustomer } from "@/lib/products/server";

/**
 * POST /api/customer/cart/validate
 *
 * Server-side cart revalidation endpoint for authenticated customers.
 * - Enforces active customer session & RBAC via Firebase Admin SDK (`requireApiRoleSession("customer")`).
 * - Fetches authoritative active product records directly from Firestore (`listActiveProductsForCustomer()`).
 * - Never trusts client-supplied unit prices, statuses, or stock limits.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireApiRoleSession("customer");
  if (!authResult.ok) {
    return authResult.response;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
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

  const language = normalizeLanguage(body.language);

  try {
    const activeProducts = await listActiveProductsForCustomer();
    const summary = revalidateCartAgainstProducts(
      body.items,
      activeProducts,
      language
    );

    return NextResponse.json(
      {
        ok: true,
        summary,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error:
          "Unable to revalidate cart against the product database at this time.",
      },
      { status: 500 }
    );
  }
}
