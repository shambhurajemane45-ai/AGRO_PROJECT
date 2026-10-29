import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRoleSession } from "@/lib/auth/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  AdminDashboardFallbackView,
  AdminDashboardView,
} from "@/components/shared/AdminDashboardView";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description:
    "Role-protected Manufacturing Administration Dashboard verified server-side via Firebase Admin SDK.",
};

async function AdminDashboardContent() {
  const user = await requireRoleSession("admin");
  return <AdminDashboardView user={user} />;
}

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-10 sm:py-14">
        <Suspense fallback={<AdminDashboardFallbackView />}>
          <AdminDashboardContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
