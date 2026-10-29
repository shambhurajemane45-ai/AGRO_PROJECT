import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";

export const metadata: Metadata = {
  title: "Customer Portal Login",
  description:
    "Customer and dealer portal sign-in secured with Firebase Authentication and server-side role verification.",
};

export default function CustomerLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center py-10 sm:py-14">
        <Container size="narrow">
          <PortalLoginForm
            role="customer"
            badgeText="Customer & Dealer Portal"
            portalTitle="Customer Sign In"
            portalSubtitle="Sign in to access your role-protected Customer Portal dashboard."
            emailPlaceholder="customer@example.com"
            securityNote="Customer credentials are verified via Firebase Authentication and exchanged for an HttpOnly server-verified session cookie."
            backHref="/customer"
            backLabel="Back to Customer Portal"
          />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
