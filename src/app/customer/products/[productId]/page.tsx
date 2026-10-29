import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRoleSession } from "@/lib/auth/server";
import { getActiveProductByIdForCustomer } from "@/lib/products/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CustomerProductDetailFallbackView,
  CustomerProductDetailView,
} from "@/components/shared/CustomerProductsViews";

export const metadata: Metadata = {
  title: "Product Specifications — Customer Portal",
  description:
    "Official product composition, approved crops, dosage instructions, and safety specifications.",
};

interface CustomerProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
}

async function CustomerProductDetailContent({
  params,
}: CustomerProductDetailPageProps) {
  const user = await requireRoleSession("customer");
  const { productId } = await params;

  const product = await getActiveProductByIdForCustomer(productId);
  if (!product) {
    notFound();
  }

  return <CustomerProductDetailView user={user} product={product} />;
}

export default function CustomerProductDetailPage(
  props: CustomerProductDetailPageProps
) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<CustomerProductDetailFallbackView />}>
          <CustomerProductDetailContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
