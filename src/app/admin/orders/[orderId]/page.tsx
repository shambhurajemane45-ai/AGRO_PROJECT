import { Suspense } from "react";
import type { Metadata } from "next";
import type { OrderRecord } from "@/types";
import { requireRoleSession } from "@/lib/auth/server";
import { getOrderByIdForAdmin } from "@/lib/orders/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  AdminOrdersFallbackView,
  AdminOrderDetailView,
} from "@/components/shared/AdminOrdersViews";

export const metadata: Metadata = {
  title: "Order Review & Verification — Admin Portal",
  description:
    "Review customer booking specifications, line items, verified recipient address, and authorize or reject booking.",
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

async function AdminOrderDetailContent({ params }: PageProps) {
  const user = await requireRoleSession("admin");
  const { orderId } = await params;

  let order: OrderRecord | null = null;
  let hasLoadError = false;

  try {
    order = await getOrderByIdForAdmin(orderId);
  } catch {
    hasLoadError = true;
  }

  return (
    <AdminOrderDetailView
      user={user}
      order={order}
      hasLoadError={hasLoadError}
    />
  );
}

export default function AdminOrderDetailPage(props: PageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<AdminOrdersFallbackView />}>
          <AdminOrderDetailContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
