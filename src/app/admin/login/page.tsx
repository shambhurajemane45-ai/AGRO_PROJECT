import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";

export const metadata: Metadata = {
  title: "Admin Portal Login",
  description:
    "Manufacturing administration portal login interface (Phase 1 UI foundation).",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center py-12 sm:py-16">
        <Container size="narrow">
          <PortalLoginForm
            role="admin"
            badgeText="Manufacturing Administration Portal"
            portalTitle="Administrator Sign In"
            portalSubtitle="Restricted entry point for authorized manufacturing administrators to manage products, inventory batches, orders, and validation certificates."
            emailPlaceholder="admin@company-domain.placeholder"
            securityNote="Administrative authorization is never enforced by UI hiding or hardcoded credentials. Server-side role verification via Firebase Admin SDK will be implemented in Phase 2."
          />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
