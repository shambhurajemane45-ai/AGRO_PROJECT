import { Suspense } from "react";
import type { Metadata } from "next";
import type { ProductRecord } from "@/types";
import { requireRoleSession } from "@/lib/auth/server";
import { listActiveProductsForCustomer } from "@/lib/products/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CustomerCartFallbackView,
  CustomerCartView,
} from "@/components/shared/CustomerCartView";

export const metadata: Metadata = {
  title: "Shopping Cart — Customer Portal",
  description:
    "Review your selected agricultural products, adjust quantities, and revalidate live product prices and stock availability.",
};

async function CustomerCartContent() {
  const user = await requireRoleSession("customer");

  let products: ProductRecord[] = [];
  let hasLoadError = false;

  try {
    products = await listActiveProductsForCustomer();
  } catch {
    hasLoadError = true;
  }

  return (
    <CustomerCartView
      user={user}
      activeProducts={products}
      hasLoadError={hasLoadError}
    />
  );
}

export default function CustomerCartPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<CustomerCartFallbackView />}>
          <CustomerCartContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
