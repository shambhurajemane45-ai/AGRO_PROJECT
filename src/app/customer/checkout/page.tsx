import { Suspense } from "react";
import type { Metadata } from "next";
import type { ProductRecord } from "@/types";
import { requireRoleSession } from "@/lib/auth/server";
import { listActiveProductsForCustomer } from "@/lib/products/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CustomerCheckoutFallbackView,
  CustomerCheckoutView,
} from "@/components/shared/CustomerCheckoutView";

export const metadata: Metadata = {
  title: "Secure Order Checkout — Customer Portal",
  description:
    "Review your server-validated cart items, enter your delivery address, and submit your order for official verification.",
};

async function CustomerCheckoutContent() {
  const user = await requireRoleSession("customer");

  let products: ProductRecord[] = [];
  let hasLoadError = false;

  try {
    products = await listActiveProductsForCustomer();
  } catch {
    hasLoadError = true;
  }

  return (
    <CustomerCheckoutView
      user={user}
      initialProducts={products}
      hasLoadError={hasLoadError}
    />
  );
}

export default function CustomerCheckoutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<CustomerCheckoutFallbackView />}>
          <CustomerCheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
