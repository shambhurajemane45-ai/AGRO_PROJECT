import { Suspense } from "react";
import type { Metadata } from "next";
import type { ProductRecord } from "@/types";
import { requireRoleSession } from "@/lib/auth/server";
import { listProductsForAdmin } from "@/lib/products/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  AdminProductsFallbackView,
  AdminProductsListView,
} from "@/components/shared/AdminProductsViews";

export const metadata: Metadata = {
  title: "Product Master Management — Admin Portal",
  description:
    "Create, edit, view, and manage company product specifications and publication status.",
};

async function AdminProductsContent() {
  const user = await requireRoleSession("admin");

  let products: ProductRecord[] = [];
  let hasLoadError = false;

  try {
    products = await listProductsForAdmin();
  } catch {
    hasLoadError = true;
  }

  return (
    <AdminProductsListView
      user={user}
      products={products}
      hasLoadError={hasLoadError}
    />
  );
}

export default function AdminProductsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<AdminProductsFallbackView />}>
          <AdminProductsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
