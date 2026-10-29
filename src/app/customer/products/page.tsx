import { Suspense } from "react";
import type { Metadata } from "next";
import type { ProductRecord } from "@/types";
import { requireRoleSession } from "@/lib/auth/server";
import { listActiveProductsForCustomer } from "@/lib/products/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CustomerProductsFallbackView,
  CustomerProductsListView,
} from "@/components/shared/CustomerProductsViews";

export const metadata: Metadata = {
  title: "Verified Product Catalogue — Customer Portal",
  description:
    "Browse verified agricultural products, active compositions, approved target crops, and packaging specifications.",
};

async function CustomerProductsContent() {
  const user = await requireRoleSession("customer");

  let products: ProductRecord[] = [];
  let hasLoadError = false;

  try {
    products = await listActiveProductsForCustomer();
  } catch {
    hasLoadError = true;
  }

  return (
    <CustomerProductsListView
      user={user}
      products={products}
      hasLoadError={hasLoadError}
    />
  );
}

export default function CustomerProductsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<CustomerProductsFallbackView />}>
          <CustomerProductsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
