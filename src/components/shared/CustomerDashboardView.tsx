"use client";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  PlayCircle,
  ShoppingCart,
  Sparkles,
  Tag,
  UserCheck,
} from "lucide-react";
import type { VerifiedSessionUser } from "@/types";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { useCustomerCart } from "@/components/shared/CustomerCartProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { LogoutButton } from "@/components/shared/LogoutButton";

export function CustomerDashboardView({ user }: { user: VerifiedSessionUser }) {
  const { t } = useLanguagePreference();
  const { totalItems } = useCustomerCart();
  const cd = t.customerDashboard;
  const highlights = t.customerEntry.highlights;

  const localizedRole =
    user.role === "admin" ? t.common.adminRole : t.common.customerRole;
  const localizedStatus =
    user.status === "suspended"
      ? t.common.suspendedStatus
      : t.common.activeStatus;

  return (
    <Container className="space-y-8">
      {/* Authenticated Customer Header Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-6 border-t-4 border-t-[var(--brand-secondary)] bg-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{cd.verifiedSessionBadge}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {cd.welcomePrefix} {user.fullName}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {cd.subtitle}
            </p>
          </div>

          <LogoutButton role="customer" />
        </div>

        {/* Verified Account Summary */}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {cd.accountHolderLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {user.fullName}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {cd.registeredEmailLabel}
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
              {user.email}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {cd.mobileNumberLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {user.mobile || t.common.notProvided}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {cd.roleAndStatusLabel}
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>
                {localizedRole} ({localizedStatus})
              </span>
            </dd>
          </div>
        </dl>

        <StatusNotice tone="info" title={cd.phaseNoticeTitle}>
          <p>{cd.phaseNoticeDescription}</p>
        </StatusNotice>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button href="/customer/products" variant="primary" size="md">
            <Package className="h-4 w-4" aria-hidden="true" />
            <span>{cd.browseCatalogueButton}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button href="/customer/cart" variant="secondary" size="md">
            <ShoppingCart
              className="h-4 w-4 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>{cd.viewCartButton(totalItems)}</span>
          </Button>

          <Button href="/customer/orders" variant="outline" size="md">
            <ClipboardList
              className="h-4 w-4 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>{cd.myOrdersButton}</span>
          </Button>
        </div>
      </Card>

      {/* Customer Portal Modules */}
      <section
        aria-labelledby="customer-dashboard-modules-heading"
        className="space-y-4"
      >
        <div className="space-y-1">
          <h2
            id="customer-dashboard-modules-heading"
            className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
          >
            {cd.modulesHeading}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {cd.modulesSubtext}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item, idx) => {
            const isProductCatalogue = idx === 0;
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
                variant={isProductCatalogue ? "elevated" : "default"}
                padding="md"
                className="flex flex-col justify-between space-y-4 bg-white"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    {isProductCatalogue ? (
                      <span className="rounded-full bg-[var(--brand-lime-subtle)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand-primary)]">
                        {cd.activePhaseBadge}
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                        {cd.plannedPhaseBadge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {item.description}
                  </p>
                </div>

                {isProductCatalogue ? (
                  <div className="pt-1">
                    <Button
                      href="/customer/products"
                      variant="outline"
                      size="sm"
                      fullWidth
                    >
                      <span>{cd.viewProductsButton}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </section>
    </Container>
  );
}

export function CustomerDashboardFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="space-y-3 bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.customerDashboard.loadingMessage}
        </p>
      </Card>
    </Container>
  );
}
