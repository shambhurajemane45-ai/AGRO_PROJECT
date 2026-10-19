import {
  BookOpen,
  Building2,
  CheckCircle2,
  FileCheck2,
  Layers,
  Package,
  ShieldCheck,
  Sprout,
  UserCheck,
} from "lucide-react";
import {
  agricultureGuidancePlaceholders,
  companyInformationPlaceholders,
  companyPlaceholderConfig,
  plannedIntegrations,
  productCategoryPlaceholders,
} from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-20">
          <Container>
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-primary)]">
                  <Sprout className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Company Identity Placeholder:{" "}
                    {companyPlaceholderConfig.companyName}
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl lg:leading-[1.15]">
                  {companyPlaceholderConfig.platformTitle}
                </h1>

                <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                  {companyPlaceholderConfig.tagline}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button href="/customer/login" variant="primary" size="lg">
                    <UserCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Customer Login Portal</span>
                  </Button>
                  <Button href="/admin/login" variant="outline" size="lg">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Admin Login Portal</span>
                  </Button>
                </div>

                <StatusNotice
                  tone="warning"
                  title="Placeholder Identity & Data Transparency"
                >
                  <p>
                    This platform foundation intentionally uses labelled
                    placeholders where official company identity, product
                    formulations, pricing, certifications, and facility
                    addresses have not yet been supplied. No commercial or
                    agricultural claims are fabricated.
                  </p>
                </StatusNotice>
              </div>

              {/* Portal Entry Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                <Card variant="elevated" padding="md" className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-subtle)] text-[var(--brand-primary)]">
                        <UserCheck className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">
                          Customer &amp; Dealer Portal
                        </h2>
                        <p className="text-xs text-[var(--text-muted)]">
                          Route: <code>/customer/login</code>
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                      Phase 1 UI
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    Dedicated entry point for registered customers and
                    agricultural input dealers to browse verified products,
                    place orders, download batch validation certificates, and
                    consult approved agricultural guidance.
                  </p>
                  <Button
                    href="/customer/login"
                    variant="secondary"
                    size="sm"
                    fullWidth
                  >
                    Open Customer Login UI
                  </Button>
                </Card>

                <Card variant="elevated" padding="md" className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-white">
                        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">
                          Manufacturing Admin Portal
                        </h2>
                        <p className="text-xs text-[var(--text-muted)]">
                          Route: <code>/admin/login</code>
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                      Phase 1 UI
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    Administrative entry point for managing product master data,
                    manufacturing batches, order lifecycle approvals, quality
                    validation certificates, and fulfilment tracking.
                  </p>
                  <Button
                    href="/admin/login"
                    variant="outline"
                    size="sm"
                    fullWidth
                  >
                    Open Admin Login UI
                  </Button>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* Products Placeholder Section */}
        <section
          id="products"
          className="scroll-mt-20 border-b border-[var(--border-subtle)] py-14 sm:py-16"
        >
          <Container className="space-y-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--brand-primary)] uppercase">
                  <Package className="h-4 w-4" aria-hidden="true" />
                  <span>Product Catalogue Placeholders</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Agricultural Product Lines (Unpopulated Structure)
                </h2>
                <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
                  Structured slots prepared for the company&apos;s verified
                  agricultural manufacturing catalogue. Actual SKUs, chemical or
                  biological compositions, and pricing will be loaded from Cloud
                  Firestore in Phase 3 and Phase 4.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {productCategoryPlaceholders.map((item) => (
                <Card
                  key={item.id}
                  variant="default"
                  padding="md"
                  className="flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <span className="inline-block rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 font-mono text-xs text-[var(--text-secondary)]">
                      {item.categoryLabel}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {item.summary}
                    </p>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-3 text-xs font-medium text-[var(--text-muted)]">
                    Status: {item.statusNote}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Company Information Placeholder Section */}
        <section
          id="company-info"
          className="scroll-mt-20 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-14 sm:py-16"
        >
          <Container className="space-y-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--brand-primary)] uppercase">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span>Corporate &amp; Manufacturing Identity</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Company Information Placeholders
              </h2>
              <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
                Reserved sections for official manufacturing credentials,
                regulatory registrations, and facility details. No unverified
                certifications or addresses are displayed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {companyInformationPlaceholders.map((item) => (
                <Card
                  key={item.id}
                  variant="subtle"
                  padding="md"
                  className="flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <span className="inline-block text-xs font-semibold text-[var(--brand-primary)]">
                      {item.categoryLabel}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {item.summary}
                    </p>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-muted)]">
                    {item.statusNote}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Agriculture Guidance & Validation Certificate Placeholder Section */}
        <section
          id="agriculture-guidance"
          className="scroll-mt-20 border-b border-[var(--border-subtle)] py-14 sm:py-16"
        >
          <Container className="space-y-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--brand-primary)] uppercase">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>Agronomy &amp; Quality Traceability</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Agriculture Guidance &amp; Batch Validation Placeholders
              </h2>
              <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
                Framework for publishing verified crop application protocols,
                batch-linked validation certificates, and the planned
                company-specific AI agronomy assistant.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {agricultureGuidancePlaceholders.map((item) => (
                <Card
                  key={item.id}
                  variant="default"
                  padding="md"
                  className="flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--brand-secondary)]">
                      <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                      <span>{item.categoryLabel}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {item.summary}
                    </p>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-3 text-xs font-medium text-[var(--text-muted)]">
                    {item.statusNote}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Planned Platform Architecture Extension Points */}
        <section
          id="platform-scope"
          className="scroll-mt-20 bg-[var(--bg-surface)] py-14 sm:py-16"
        >
          <Container className="space-y-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--brand-primary)] uppercase">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>Technical Architecture &amp; Roadmap Readiness</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Planned Integration Extension Points
              </h2>
              <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
                Phase 1 establishes clean architectural boundaries without
                installing unconfigured SDKs or exposing server secrets in
                client bundles.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plannedIntegrations.map((integration) => (
                <Card
                  key={integration.id}
                  variant="subtle"
                  padding="sm"
                  className="space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-[var(--radius-sm)] bg-[var(--brand-primary)] px-2 py-0.5 font-mono text-[11px] font-medium text-white">
                      {integration.plannedPhase}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      Scope: {integration.scope}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {integration.name}
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {integration.description}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-[var(--brand-primary)]">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Extension point documented • Status: Planned</span>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
