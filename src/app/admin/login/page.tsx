import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { PortalLoginForm } from "@/components/shared/PortalLoginForm";

export const metadata: Metadata = {
  title: "Admin Portal Login",
  description:
    "Manufacturing administration portal sign-in enforced by Firebase Authentication and Firebase Admin SDK role verification.",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center py-10 sm:py-14">
        <Container size="narrow">
          <PortalLoginForm
            role="admin"
            badgeText="Authorized Company Personnel"
            portalTitle="Administrator Sign In"
            portalSubtitle="Restricted login for authorized manufacturing administrators."
            emailPlaceholder="admin@company-domain.placeholder"
            securityNote="Public admin registration is disabled. Administrative authorization is verified on the server using Firebase Admin SDK session cookies and role claims."
            backHref="/admin"
            backLabel="Back to Admin Portal"
          />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
