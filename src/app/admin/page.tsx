"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { PortalEntryButton } from "@/components/shared/PortalEntryButton";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";

export default function AdminPortalEntryPage() {
  const { t } = useLanguagePreference();
  const a = t.adminEntry;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <Container size="narrow" className="space-y-8">
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

          {/* Secure, Business-Oriented Admin Gateway Card */}
          <Card
            variant="elevated"
            padding="lg"
            className="space-y-6 border-t-4 border-t-[var(--brand-primary)] bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-3.5 py-1 text-xs font-semibold text-[var(--brand-lime)]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{a.badgeText}</span>
              </div>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {a.portalScopeLabel}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {a.heading}
              </h1>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                {a.description}
              </p>
            </div>

            <StatusNotice tone="info" title={a.policyTitle}>
              <p>{a.policyDescription}</p>
            </StatusNotice>

            <div className="pt-2">
              <PortalEntryButton
                role="admin"
                variant="primary"
                size="lg"
                fullWidth
                ariaLabel={a.loginButtonAria}
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>{a.loginButton}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PortalEntryButton>
            </div>
          </Card>

          {/* Planned Administrative Modules Overview */}
          <section aria-labelledby="admin-modules-heading" className="space-y-4">
            <h2
              id="admin-modules-heading"
              className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase"
            >
              {a.plannedModulesHeading}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {a.highlights.map((item, idx) => {
                const Icon =
                  idx === 0
                    ? SlidersHorizontal
                    : idx === 1
                      ? ClipboardCheck
                      : FileCheck2;
                return (
                  <Card
                    key={item.id}
                    variant="default"
                    padding="md"
                    className="space-y-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] text-[var(--brand-primary)]">
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
