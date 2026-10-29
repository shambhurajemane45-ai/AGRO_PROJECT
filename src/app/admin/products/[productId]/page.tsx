import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRoleSession } from "@/lib/auth/server";
import { getProductByIdForAdmin } from "@/lib/products/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  AdminProductDetailFallbackView,
  AdminProductDetailView,
} from "@/components/shared/AdminProductsViews";

export const metadata: Metadata = {
  title: "View & Edit Product — Admin Portal",
  description:
    "Inspect and update company product specifications in Cloud Firestore.",
};

interface AdminProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

async function AdminProductDetailContent({
  params,
}: AdminProductDetailPageProps) {
  const user = await requireRoleSession("admin");
  const { productId } = await params;

  const product = await getProductByIdForAdmin(productId);
  if (!product) {
    notFound();
  }

  return <AdminProductDetailView user={user} product={product} />;
}

export default function AdminProductDetailPage(
  props: AdminProductDetailPageProps
) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<AdminProductDetailFallbackView />}>
          <AdminProductDetailContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
