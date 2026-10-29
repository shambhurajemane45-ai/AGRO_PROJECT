import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { CustomerSignupForm } from "@/components/shared/CustomerSignupForm";

export const metadata: Metadata = {
  title: "Customer Sign Up",
  description:
    "Create a new customer or dealer account on the Agriculture Product Manufacturing Platform.",
};

export default function CustomerSignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center py-10 sm:py-14">
        <Container size="narrow">
          <CustomerSignupForm />
        </Container>
      </main>

      <Footer />
    </div>
  );
}
