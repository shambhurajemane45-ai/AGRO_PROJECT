import { Suspense } from "react";
import type { Metadata } from "next";
import type { CustomerOrderView } from "@/types";
import { requireRoleSession } from "@/lib/auth/server";
import { getCustomerOrderByIdForCustomer } from "@/lib/orders/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CustomerCheckoutFallbackView,
  CustomerOrderDetailView,
} from "@/components/shared/CustomerCheckoutView";

export const metadata: Metadata = {
  title: "Order Confirmation — Customer Portal",
  description:
    "Review your recorded order reference, server-verified items, delivery details, and verification status.",
};

interface PageProps {
  params: Promise<{ orderId: string }>;
}

async function CustomerOrderDetailContent({ params }: PageProps) {
  const user = await requireRoleSession("customer");
  const { orderId } = await params;

  let order: CustomerOrderView | null = null;
  try {
    order = await getCustomerOrderByIdForCustomer(orderId, user);
  } catch {
    order = null;
  }

  return <CustomerOrderDetailView user={user} order={order} />;
}

export default function CustomerOrderDetailPage(props: PageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<CustomerCheckoutFallbackView />}>
          <CustomerOrderDetailContent {...props} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
