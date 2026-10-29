import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRoleSession } from "@/lib/auth/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CustomerOrdersFallbackView,
  CustomerOrdersListView,
} from "@/components/shared/CustomerOrdersListView";

export const metadata: Metadata = {
  title: "My Orders — Customer Portal",
  description:
    "Review your submitted agricultural product orders, quantities, delivery details, and official order verification status.",
};

async function CustomerOrdersContent() {
  const user = await requireRoleSession("customer");
  return <CustomerOrdersListView user={user} />;
}

export default function CustomerOrdersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<CustomerOrdersFallbackView />}>
          <CustomerOrdersContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
