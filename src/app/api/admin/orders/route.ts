import { NextResponse } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import { listOrdersForAdmin } from "@/lib/orders/server";

/**
 * GET /api/admin/orders
 *
 * Lists all recorded customer orders for authorized administrative review.
 * Protected server-side via Firebase Admin SDK session verification and admin role check.
 */
export async function GET() {
  const auth = await requireApiRoleSession("admin");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const orders = await listOrdersForAdmin();
    return NextResponse.json(
      {
        ok: true,
        orders,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Unable to load customer orders from Firestore.",
      },
      { status: 500 }
    );
  }
}
