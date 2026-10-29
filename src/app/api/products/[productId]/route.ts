import { NextResponse, type NextRequest } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import { getActiveProductByIdForCustomer } from "@/lib/products/server";

interface ProductRouteContext {
  params: Promise<{
    productId: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: ProductRouteContext
) {
  const auth = await requireApiRoleSession("customer");
  if (!auth.ok) {
    return auth.response;
  }

  const { productId } = await context.params;

  try {
    const product = await getActiveProductByIdForCustomer(productId);
    if (!product) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_FOUND",
          error: "Published product not found.",
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
        error: "Unable to load published product specification.",
      },
      { status: 500 }
    );
  }
}
