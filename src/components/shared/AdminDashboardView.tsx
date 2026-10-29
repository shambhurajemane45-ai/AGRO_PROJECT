"use client";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  PackagePlus,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { VerifiedSessionUser } from "@/types";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { LogoutButton } from "@/components/shared/LogoutButton";

export function AdminDashboardView({ user }: { user: VerifiedSessionUser }) {
  const { t } = useLanguagePreference();
  const ad = t.adminDashboard;
  const highlights = t.adminEntry.highlights;

  const localizedRole =
    user.role === "admin" ? t.common.adminRole : t.common.customerRole;
  const localizedStatus =
    user.status === "suspended"
      ? t.common.suspendedStatus
      : t.common.activeStatus;

  return (
    <Container className="space-y-8">
      {/* Authenticated Admin Header Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-6 border-t-4 border-t-[var(--brand-primary)] bg-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-semibold text-[var(--brand-lime)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{ad.verifiedSessionBadge}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {ad.heading}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {ad.subtitle}
            </p>
          </div>

          <LogoutButton role="admin" />
        </div>

        {/* Verified Admin Identity Summary */}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ad.adminNameLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {user.fullName}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ad.authorizedEmailLabel}
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
              {user.email}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ad.verifiedRoleStatusLabel}
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>
                {localizedRole} ({localizedStatus})
              </span>
            </dd>
          </div>
        </dl>

        <StatusNotice tone="info" title={ad.phaseNoticeTitle}>
          <p>{ad.phaseNoticeDescription}</p>
        </StatusNotice>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button href="/admin/orders" variant="primary" size="md">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            <span>{ad.manageOrdersButton}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button href="/admin/products" variant="outline" size="md">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>{ad.manageProductsButton}</span>
          </Button>

          <Button href="/admin/products/new" variant="outline" size="md">
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            <span>{ad.addNewProductButton}</span>
          </Button>
        </div>
      </Card>

      {/* Orders Management Section */}
      <Card
        variant="elevated"
        padding="md"
        className="space-y-4 border-l-4 border-l-[var(--brand-primary)] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-lime-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-primary)]">
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.adminOrders.badge}</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              {t.adminOrders.heading}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {t.adminOrders.subtitle}
            </p>
          </div>

          <Button href="/admin/orders" variant="primary" size="md">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            <span>{ad.openOrdersManagementButton}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>

      {/* Administrative Modules */}
      <section
        aria-labelledby="admin-dashboard-modules-heading"
        className="space-y-4"
      >
        <div className="space-y-1">
          <h2
            id="admin-dashboard-modules-heading"
            className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
          >
            {ad.modulesHeading}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {ad.modulesSubtext}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {highlights.map((item, idx) => {
            const isProductModule = idx === 0;
            const isOrderModule = idx === 1;
            const isActiveModule = isProductModule || isOrderModule;
            const Icon =
              idx === 0
                ? SlidersHorizontal
                : idx === 1
                  ? ClipboardCheck
                  : FileCheck2;
            return (
              <Card
                key={item.id}
                variant={isActiveModule ? "elevated" : "default"}
                padding="md"
                className="flex flex-col justify-between space-y-4 bg-white"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] text-[var(--brand-primary)]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    {isActiveModule ? (
                      <span className="rounded-full bg-[var(--brand-lime-subtle)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand-primary)]">
                        {ad.activePhaseBadge}
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                        {ad.plannedPhaseBadge}
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

                {isProductModule ? (
                  <div className="pt-1">
                    <Button
                      href="/admin/products"
                      variant="outline"
                      size="sm"
                      fullWidth
                    >
                      <span>{ad.openProductManagementButton}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ) : isOrderModule ? (
                  <div className="pt-1">
                    <Button
                      href="/admin/orders"
                      variant="outline"
                      size="sm"
                      fullWidth
                    >
                      <span>{ad.openOrdersManagementButton}</span>
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

export function AdminDashboardFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="space-y-3 bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.adminDashboard.loadingMessage}
        </p>
      </Card>
    </Container>
  );
}
