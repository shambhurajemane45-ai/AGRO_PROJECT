import { NextResponse, type NextRequest } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import { getCustomerOrderByIdForCustomer } from "@/lib/orders/server";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

/**
 * GET /api/customer/orders/[orderId]
 *
 * Returns a single order only if it belongs to the authenticated customer.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const authResult = await requireApiRoleSession("customer");
  if (!authResult.ok) {
    return authResult.response;
  }

  const { orderId } = await context.params;

  try {
    const order = await getCustomerOrderByIdForCustomer(
      orderId,
      authResult.user
    );

    if (!order) {
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_NOT_FOUND",
          error: "Order record not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        order,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Unable to load order details at this time.",
      },
      { status: 500 }
    );
  }
}
