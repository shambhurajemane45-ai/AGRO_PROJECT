import { NextResponse, type NextRequest } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import {
  LANGUAGE_COOKIE_NAME,
  normalizeLanguage,
} from "@/lib/language";
import { toCustomerOrderView } from "@/lib/orders";
import {
  createCustomerOrderInFirestore,
  listOrdersForCustomer,
} from "@/lib/orders/server";

/**
 * GET /api/customer/orders
 *
 * Returns only the authenticated customer's own order history.
 */
export async function GET() {
  const authResult = await requireApiRoleSession("customer");
  if (!authResult.ok) {
    return authResult.response;
  }

  try {
    const orders = await listOrdersForCustomer(authResult.user);
    const customerOrders = orders
      .map((order) => toCustomerOrderView(order, authResult.user.uid))
      .filter((order): order is NonNullable<typeof order> => order !== null);

    return NextResponse.json(
      {
        ok: true,
        orders: customerOrders,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Unable to load customer orders at this time.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customer/orders
 *
 * Protected server-side order creation endpoint for authenticated customers.
 * - Verifies session cookie and customer role via Firebase Admin SDK (`requireApiRoleSession("customer")`).
 * - Re-fetches authoritative active products from Firestore.
 * - Validates pack sizes, quantities, stock availability, and delivery details on the server.
 * - Recalculates all unit prices, line subtotals, and final payable amount on the server.
 * - Rejects requests attempting to create an order for another user UID.
 * - Stores initial `orderStatus: "pending_verification"` and `paymentStatus: "unpaid"`.
 * - Prevents accidental duplicate submissions via idempotency key / payload fingerprint.
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
        code: "INVALID_PAYLOAD",
        error: "Invalid JSON request body.",
      },
      { status: 400 }
    );
  }

  const cookieLang = request.cookies.get(LANGUAGE_COOKIE_NAME)?.value;
  const language = normalizeLanguage(body.language ?? cookieLang);

  try {
    const result = await createCustomerOrderInFirestore(
      body,
      authResult.user,
      language
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          error: result.error,
          fieldErrors: result.fieldErrors,
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        order: result.customerOrder,
      },
      { status: result.duplicate ? 200 : 201 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error:
          "Unable to create your order at this moment. Please check your connection and try again.",
      },
      { status: 500 }
    );
  }
}
