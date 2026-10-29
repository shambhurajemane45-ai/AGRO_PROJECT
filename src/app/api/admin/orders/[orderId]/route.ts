import { NextResponse, type NextRequest } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import {
  getOrderByIdForAdmin,
  updateOrderStatusByAdmin,
} from "@/lib/orders/server";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

/**
 * GET /api/admin/orders/[orderId]
 *
 * Retrieves full order record and delivery details for authorized admin review.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { orderId } = await context.params;

  try {
    const order = await getOrderByIdForAdmin(orderId);
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
  } catch (error) {
    console.error("[API Admin Orders GET Error]", error);
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

/**
 * PATCH /api/admin/orders/[orderId]
 *
 * Allows an authorized Admin to explicitly verify or reject a customer order.
 * - Enforces admin session and role on the server.
 * - Never trusts client-supplied admin identity or customer IDs.
 * - Validates status transitions (only pending_verification can be transitioned).
 * - Leaves payment status strictly independent and unchanged.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { orderId } = await context.params;

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

  const action = body.action;
  if (action !== "verify" && action !== "reject") {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_ACTION",
        error: "Invalid action. Supported actions are 'verify' and 'reject'.",
      },
      { status: 400 }
    );
  }

  const rejectionReason =
    typeof body.rejectionReason === "string" ? body.rejectionReason : undefined;

  try {
    const result = await updateOrderStatusByAdmin(
      orderId,
      action,
      auth.user,
      rejectionReason
    );

    if (!result.ok) {
      const status =
        result.code === "ORDER_NOT_FOUND"
          ? 404
          : result.code === "INVALID_STATUS_TRANSITION"
            ? 409
            : 400;

      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          error: result.error,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        order: result.updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Admin Orders PATCH Error]", error);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Unable to update order status at this time.",
      },
      { status: 500 }
    );
  }
}
