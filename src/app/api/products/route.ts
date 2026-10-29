import { NextResponse } from "next/server";
import { requireApiRoleSession } from "@/lib/auth/server";
import { listActiveProductsForCustomer } from "@/lib/products/server";

export async function GET() {
  const auth = await requireApiRoleSession("customer");
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const products = await listActiveProductsForCustomer();
    return NextResponse.json({
      ok: true,
      products,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        error: "Unable to load published product catalogue.",
      },
      { status: 500 }
    );
  }
}
