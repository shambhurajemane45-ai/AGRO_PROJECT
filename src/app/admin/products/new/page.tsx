import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRoleSession } from "@/lib/auth/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  AdminNewProductFallbackView,
  AdminNewProductView,
} from "@/components/shared/AdminProductsViews";

export const metadata: Metadata = {
  title: "Add New Product — Admin Portal",
  description:
    "Create a new verified company product record in Cloud Firestore.",
};

async function AdminNewProductContent() {
  const user = await requireRoleSession("admin");
  return <AdminNewProductView user={user} />;
}

export default function AdminNewProductPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<AdminNewProductFallbackView />}>
          <AdminNewProductContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
