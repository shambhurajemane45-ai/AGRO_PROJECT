import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRoleSession } from "@/lib/auth/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CustomerDashboardFallbackView,
  CustomerDashboardView,
} from "@/components/shared/CustomerDashboardView";

export const metadata: Metadata = {
  title: "Customer Dashboard",
  description:
    "Role-protected Customer Portal dashboard verified via Firebase Authentication and Firebase Admin SDK.",
};

async function CustomerDashboardContent() {
  const user = await requireRoleSession("customer");
  return <CustomerDashboardView user={user} />;
}

export default function CustomerDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<CustomerDashboardFallbackView />}>
          <CustomerDashboardContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
