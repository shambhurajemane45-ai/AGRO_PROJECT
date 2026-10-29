"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileArchive,
  Package,
  PackagePlus,
  ShieldCheck,
} from "lucide-react";
import type {
  ProductRecord,
  ProductStatus,
  VerifiedSessionUser,
} from "@/types";
import {
  formatCurrencyForLanguage,
  formatDateForLanguage,
   type SiteTranslations,
} from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { AdminProductForm } from "@/components/shared/AdminProductForm";
import { LogoutButton } from "@/components/shared/LogoutButton";

function StatusBadge({
  status,
  ap,
}: {
  status: ProductStatus;
  ap: SiteTranslations["adminProducts"];
}) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-lime-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-primary)]">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{ap.statusActivePublished}</span>
      </span>
    );
  }

  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-amber-border)] bg-[var(--accent-amber-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-amber)]">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{ap.statusDraft}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">
      <FileArchive className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{ap.statusArchived}</span>
    </span>
  );
}

export function AdminProductsListView({
  user,
  products,
  hasLoadError,
}: {
  user: VerifiedSessionUser;
  products: ProductRecord[];
  hasLoadError: boolean;
}) {
  const { language, t } = useLanguagePreference();
  const ap = t.adminProducts;

  const activeCount = products.filter((p) => p.status === "active").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const archivedCount = products.filter((p) => p.status === "archived").length;

  return (
    <Container className="space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{ap.backToDashboard}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">
            {ap.signedInAsPrefix} <strong>{user.email}</strong>
          </span>
          <LogoutButton role="admin" />
        </div>
      </div>

      {/* Header & Summary Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-6 border-t-4 border-t-[var(--brand-primary)] bg-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-semibold text-[var(--brand-lime)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{ap.catalogueBadge}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {ap.heading}
            </h1>
            <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
              {ap.subtitle}
            </p>
          </div>

          <Button href="/admin/products/new" variant="primary" size="md">
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            <span>{ap.addNewProductButton}</span>
          </Button>
        </div>

        {/* Summary Counters */}
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.totalProductsLabel}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {products.length}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.activeVisibleLabel}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-[var(--brand-secondary)]">
              {activeCount}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.draftRecordsLabel}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-[var(--accent-amber)]">
              {draftCount}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.archivedRecordsLabel}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-[var(--text-muted)]">
              {archivedCount}
            </dd>
          </div>
        </dl>
      </Card>

      {hasLoadError ? (
        <StatusNotice tone="error" title={ap.dbErrorTitle}>
          <p>{ap.dbErrorDesc}</p>
        </StatusNotice>
      ) : null}

      {/* Product Records List */}
      {products.length === 0 ? (
        <Card
          variant="default"
          padding="lg"
          className="space-y-4 bg-white text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--brand-primary)]">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {ap.emptyTitle}
            </h2>
            <p className="mx-auto max-w-lg text-sm text-[var(--text-secondary)]">
              {ap.emptyDescription}
            </p>
          </div>
          <div className="pt-2">
            <Button href="/admin/products/new" variant="primary" size="md">
              <PackagePlus className="h-4 w-4" aria-hidden="true" />
              <span>{ap.createFirstProductButton}</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              variant="default"
              padding="md"
              className="flex flex-col justify-between gap-4 bg-white sm:flex-row sm:items-center"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status={product.status} ap={ap} />
                  <span className="rounded bg-[var(--bg-subtle)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                    {t.common.skuPrefix}: {product.sku}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    • {product.category}
                  </span>
                  {product.unitPrice !== null ? (
                    <span className="text-xs font-semibold text-[var(--brand-primary)]">
                      • {formatCurrencyForLanguage(product.unitPrice, language)}
                    </span>
                  ) : null}
                </div>

                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {product.name}
                </h2>

                <p className="max-w-3xl text-sm text-[var(--text-secondary)]">
                  {product.shortDescription}
                </p>

                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-xs text-[var(--text-muted)]">
                  <span>
                    <strong className="text-[var(--text-secondary)]">
                      {ap.targetCropsLabel}
                    </strong>{" "}
                    {product.targetCrops.join(", ")}
                  </span>
                  <span>
                    <strong className="text-[var(--text-secondary)]">
                      {ap.packSizesLabel}
                    </strong>{" "}
                    {product.packSizes.join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  href={`/admin/products/${product.id}`}
                  variant="outline"
                  size="sm"
                >
                  <span>{ap.viewAndEditButton}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

export function AdminProductsFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.adminProducts.loadingListMessage}
        </p>
      </Card>
    </Container>
  );
}

export function AdminNewProductView({ user }: { user: VerifiedSessionUser }) {
  const { t } = useLanguagePreference();
  const ap = t.adminProducts;

  return (
    <Container className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{ap.backToProductManagement}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <ShieldCheck
              className="h-3.5 w-3.5 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>
              {ap.adminLabelPrefix} {user.email}
            </span>
          </span>
          <LogoutButton role="admin" />
        </div>
      </div>

      <AdminProductForm mode="create" />
    </Container>
  );
}

export function AdminNewProductFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.adminProducts.verifyingAdminMessage}
        </p>
      </Card>
    </Container>
  );
}

export function AdminProductDetailView({
  user,
  product,
}: {
  user: VerifiedSessionUser;
  product: ProductRecord;
}) {
  const { language, t } = useLanguagePreference();
  const ap = t.adminProducts;

  return (
    <Container className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{ap.backToProductManagement}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <ShieldCheck
              className="h-3.5 w-3.5 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>
              {ap.adminLabelPrefix} {user.email}
            </span>
          </span>
          <LogoutButton role="admin" />
        </div>
      </div>

      {/* Current Specification Summary Card */}
      <Card variant="default" padding="lg" className="space-y-5 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[var(--bg-subtle)] px-2.5 py-0.5 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                {t.common.skuPrefix}: {product.sku}
              </span>
              <span className="text-xs font-medium text-[var(--text-muted)]">
                • {product.category}
              </span>
              {product.registrationNumber ? (
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  • {t.common.regPrefix}: {product.registrationNumber}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {product.name}
            </h1>
          </div>

          <div>
            {product.status === "active" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{ap.statusActiveVisible}</span>
              </span>
            ) : product.status === "draft" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-amber-border)] bg-[var(--accent-amber-bg)] px-3 py-1 text-xs font-semibold text-[var(--accent-amber)]">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{ap.statusDraftInternal}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
                <FileArchive className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{ap.statusArchived}</span>
              </span>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.approvedTargetCropsLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {product.targetCrops.join(", ")}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.availablePackSizesLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {product.packSizes.join(", ")}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.unitPriceLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {product.unitPrice !== null
                ? formatCurrencyForLanguage(product.unitPrice, language)
                : t.common.providedOnEnquiry}
            </dd>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
            <dt className="text-xs font-medium text-[var(--text-muted)]">
              {ap.lastUpdatedLabel}
            </dt>
            <dd className="mt-1 font-mono text-xs font-semibold text-[var(--text-primary)]">
              {formatDateForLanguage(product.updatedAt, language)}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Edit Form */}
      <AdminProductForm mode="edit" initialProduct={product} />
    </Container>
  );
}

export function AdminProductDetailFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.adminProducts.loadingDetailMessage}
        </p>
      </Card>
    </Container>
  );
}
