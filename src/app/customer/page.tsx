"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  LogIn,
  Package,
  PlayCircle,
  Sparkles,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PortalEntryButton } from "@/components/shared/PortalEntryButton";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";

export default function CustomerPortalEntryPage() {
  const { t } = useLanguagePreference();
  const c = t.customerEntry;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <Container className="space-y-8">
          {/* Return to Home Navigation */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{t.common.returnToHome}</span>
            </Link>
          </div>

          {/* Friendly Welcome Header & Primary Actions */}
          <Card
            variant="elevated"
            padding="lg"
            className="overflow-hidden border border-[var(--border-strong)] bg-white"
          >
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="space-y-5 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3.5 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{c.badgeText}</span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
                  {c.heading}
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
                  {c.description}
                </p>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <PortalEntryButton
                    role="customer"
                    variant="primary"
                    size="lg"
                    ariaLabel={c.loginButtonAria}
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    <span>{c.loginButton}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </PortalEntryButton>

                  <Button
                    href="/customer/signup"
                    variant="outline"
                    size="lg"
                    ariaLabel={c.signupButtonAria}
                  >
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    <span>{c.signupButton}</span>
                  </Button>
                </div>
              </div>

              {/* Action Choice Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    {c.existingCustomerTitle}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {c.existingCustomerDesc}
                  </p>
                  <div className="mt-3">
                    <PortalEntryButton
                      role="customer"
                      variant="ghost"
                      size="sm"
                      className="px-0 py-0 text-xs font-semibold text-[var(--brand-primary)] hover:bg-transparent hover:underline"
                    >
                      <span>{c.existingCustomerLink}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </PortalEntryButton>
                  </div>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-5">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    {c.newCustomerTitle}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {c.newCustomerDesc}
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/customer/signup"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      <span>{c.newCustomerLink}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* What You Can Do After Authentication */}
          <section aria-labelledby="customer-benefits-heading" className="space-y-4">
            <div className="space-y-1">
              <h2
                id="customer-benefits-heading"
                className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
              >
                {c.benefitsHeading}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {c.benefitsSubtext}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {c.highlights.map((item, idx) => {
                const Icon =
                  idx === 0
                    ? Package
                    : idx === 1
                      ? PlayCircle
                      : idx === 2
                        ? Tag
                        : Sparkles;
                return (
                  <Card
                    key={item.id}
                    variant="default"
                    padding="md"
                    className="space-y-2.5"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
