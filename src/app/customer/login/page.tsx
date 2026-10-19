import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";

export const metadata: Metadata = {
  title: "Customer Portal Login",
  description:
    "Customer and distributor portal login interface (Phase 1 UI foundation).",
};

export default function CustomerLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center py-12 sm:py-16">
        <Container size="narrow">
          <PortalLoginForm
            role="customer"
            badgeText="Customer & Distributor Portal"
            portalTitle="Customer Sign In"
            portalSubtitle="Access your customer or dealer account to view verified product catalogues, place orders, and download batch validation certificates."
            emailPlaceholder="customer@example.com"
            securityNote="Customer authentication will be implemented in Phase 2 using Firebase Authentication. No fake login sessions are created in Phase 1."
          />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
