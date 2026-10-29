import { Suspense } from "react";
import type { Metadata } from "next";
import type { OrderRecord } from "@/types";
import { requireRoleSession } from "@/lib/auth/server";
import { listOrdersForAdmin } from "@/lib/orders/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  AdminOrdersFallbackView,
  AdminOrdersListView,
} from "@/components/shared/AdminOrdersViews";

export const metadata: Metadata = {
  title: "Orders Management — Admin Portal",
  description:
    "Review, verify, and manage recorded customer agricultural product bookings and order statuses.",
};

async function AdminOrdersContent() {
  const user = await requireRoleSession("admin");

  let orders: OrderRecord[] = [];
  let hasLoadError = false;

  try {
    orders = await listOrdersForAdmin();
  } catch {
    hasLoadError = true;
  }

  return (
    <AdminOrdersListView
      user={user}
      initialOrders={orders}
      hasLoadError={hasLoadError}
    />
  );
}

export default function AdminOrdersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<AdminOrdersFallbackView />}>
          <AdminOrdersContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
