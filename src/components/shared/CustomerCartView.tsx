"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UserCheck,
} from "lucide-react";
import type {
  CartRevalidationIssue,
  CartValidationSummary,
  ProductRecord,
  VerifiedSessionUser,
} from "@/types";
import { revalidateCartAgainstProducts, roundCurrency } from "@/lib/cart";
import { formatCurrencyForLanguage } from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { useCustomerCart } from "@/components/shared/CustomerCartProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { LogoutButton } from "@/components/shared/LogoutButton";

export function CustomerCartView({
  user,
  activeProducts,
  hasLoadError,
}: {
  user: VerifiedSessionUser;
  activeProducts: ProductRecord[];
  hasLoadError: boolean;
}) {
  const { language, t } = useLanguagePreference();
  const {
    items,
    setItemQuantity,
    setItemPackSize,
    removeItem,
    clearCart,
    syncWithValidatedItems,
  } = useCustomerCart();
  const cc = t.customerCart;
  const cp = t.customerProducts;

  const [itemError, setItemError] = useState<{
    productId: string;
    message: string;
  } | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [serverRevalidationError, setServerRevalidationError] = useState(false);
  const [serverVerifiedSummary, setServerVerifiedSummary] =
    useState<CartValidationSummary | null>(null);
  const [persistedIssues, setPersistedIssues] = useState<
    CartRevalidationIssue[]
  >([]);

  const productLookup = useMemo(() => {
    const map = new Map<string, ProductRecord>();
    for (const product of activeProducts) {
      map.set(product.id, product);
    }
    return map;
  }, [activeProducts]);

  // Authoritative revalidation against server-fetched activeProducts
  const liveValidation = useMemo(() => {
    if (hasLoadError && activeProducts.length === 0) {
      // Fallback display when Firestore is unreachable on initial load
      const validatedItems = items.map((item) => ({
        ...item,
        lineSubtotal: roundCurrency(item.unitPrice * item.quantity),
      }));
      const subtotal = roundCurrency(
        validatedItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
      );
      const totalItems = validatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      return {
        isValidForCheckout: false,
        hasAdjustments: false,
        items: validatedItems,
        issues: [],
        subtotal,
        total: subtotal,
        totalItems,
        uniqueItems: validatedItems.length,
        validatedAt: "",
      } satisfies CartValidationSummary;
    }

    return revalidateCartAgainstProducts(items, activeProducts, language);
  }, [items, activeProducts, hasLoadError, language]);

  const combinedIssues = useMemo(() => {
    const map = new Map<string, CartRevalidationIssue>();
    for (const issue of liveValidation.issues) {
      map.set(`${issue.productId}:${issue.type}`, issue);
    }
    for (const issue of persistedIssues) {
      map.set(`${issue.productId}:${issue.type}`, issue);
    }
    return Array.from(map.values());
  }, [liveValidation.issues, persistedIssues]);

  function handleQuantityChange(productId: string, nextQuantity: number) {
    setItemError(null);
    setServerVerifiedSummary(null);
    const authoritativeProduct = productLookup.get(productId) ?? null;
    const result = setItemQuantity(
      productId,
      nextQuantity,
      authoritativeProduct
    );
    if (!result.ok) {
      setItemError({
        productId,
        message: result.error,
      });
    }
  }

  async function handleRevalidateForCheckout() {
    setItemError(null);
    setServerRevalidationError(false);
    setIsRevalidating(true);

    try {
      const response = await fetch("/api/customer/cart/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          language,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        summary?: CartValidationSummary;
      };

      if (!response.ok || !payload.ok || !payload.summary) {
        setServerRevalidationError(true);
        setIsRevalidating(false);
        return;
      }

      const summary = payload.summary;
      setPersistedIssues(summary.issues);
      syncWithValidatedItems(summary.items);
      setServerVerifiedSummary(summary);
      setIsRevalidating(false);
    } catch {
      setServerRevalidationError(true);
      setIsRevalidating(false);
    }
  }

  return (
    <Container className="space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{cc.backToCatalogue}</span>
          </Link>

          <Link
            href="/customer/dashboard"
            className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--brand-primary)]"
          >
            {cc.backToDashboard}
          </Link>

          <span className="text-[var(--border-strong)]" aria-hidden="true">
            |
          </span>

          <Link
            href="/customer/orders"
            className="text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--brand-primary)]"
          >
            {t.customerOrders.myOrdersButton}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <UserCheck
              className="h-3.5 w-3.5 text-[var(--brand-secondary)]"
              aria-hidden="true"
            />
            <span>{user.fullName}</span>
          </span>
          <LogoutButton role="customer" />
        </div>
      </div>

      {/* Cart Header Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-4 border-t-4 border-t-[var(--brand-secondary)] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{cc.cartBadge}</span>
          </div>

          {liveValidation.items.length > 0 ? (
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {cc.itemCountSummary(
                liveValidation.totalItems,
                liveValidation.uniqueItems
              )}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {cc.heading}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {cc.subtitle}
            </p>
          </div>

          {items.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                clearCart();
                setServerVerifiedSummary(null);
                setPersistedIssues([]);
              }}
              className="text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span>{cc.clearCartButton}</span>
            </Button>
          ) : null}
        </div>
      </Card>

      {hasLoadError ? (
        <StatusNotice tone="error" title={cp.catalogueUnavailableTitle}>
          <p>{cp.catalogueUnavailableDesc}</p>
        </StatusNotice>
      ) : null}

      {combinedIssues.length > 0 ? (
        <StatusNotice tone="warning" title={cc.revalidationIssuesTitle}>
          <ul className="list-disc space-y-1 pl-4">
            {combinedIssues.map((issue) => (
              <li key={`${issue.productId}-${issue.type}`}>{issue.message}</li>
            ))}
          </ul>
        </StatusNotice>
      ) : null}

      {serverRevalidationError ? (
        <StatusNotice tone="error" title={cc.revalidationFailedTitle}>
          <p>{cc.revalidationFailedDesc}</p>
        </StatusNotice>
      ) : null}

      {liveValidation.items.length === 0 ? (
        <Card
          variant="default"
          padding="lg"
          className="space-y-4 bg-white text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
            <ShoppingCart className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {cc.emptyTitle}
            </h2>
            <p className="mx-auto max-w-lg text-sm text-[var(--text-secondary)]">
              {cc.emptyDescription}
            </p>
          </div>
          <div className="pt-1">
            <Button href="/customer/products" variant="primary" size="md">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>{cc.browseProductsButton}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Cart Items List */}
          <div className="space-y-4 lg:col-span-8">
            {liveValidation.items.map((item) => {
              const authoritativeProduct = productLookup.get(item.productId);
              const packSizes =
                authoritativeProduct && authoritativeProduct.packSizes.length > 0
                  ? authoritativeProduct.packSizes
                  : item.packSize
                    ? [item.packSize]
                    : [];

              return (
                <Card
                  key={item.productId}
                  variant="default"
                  padding="md"
                  className="space-y-4 bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--brand-lime-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-primary)]">
                          {item.category}
                        </span>
                        <span className="rounded bg-[var(--bg-subtle)] px-2 py-0.5 font-mono text-xs font-medium text-[var(--text-muted)]">
                          {t.common.skuPrefix}: {item.sku}
                        </span>
                      </div>

                      <Link
                        href={`/customer/products/${item.productId}`}
                        className="block text-lg font-bold text-[var(--text-primary)] hover:text-[var(--brand-primary)] hover:underline"
                      >
                        {item.name}
                      </Link>

                      {packSizes.length > 1 ? (
                        <div className="flex items-center gap-2 pt-1">
                          <label
                            htmlFor={`cart-pack-${item.productId}`}
                            className="text-xs font-semibold text-[var(--text-secondary)]"
                          >
                            {cc.packSizeLabel}
                          </label>
                          <select
                            id={`cart-pack-${item.productId}`}
                            value={item.packSize}
                            onChange={(e) =>
                              setItemPackSize(item.productId, e.target.value)
                            }
                            className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]"
                          >
                            {packSizes.map((pack) => (
                              <option key={pack} value={pack}>
                                {pack}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : item.packSize ? (
                        <p className="text-xs text-[var(--text-secondary)]">
                          <strong>{cc.packSizeLabel}</strong> {item.packSize}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={cc.removeItemAria(item.name)}
                      onClick={() => {
                        removeItem(item.productId);
                        setServerVerifiedSummary(null);
                      }}
                      className="text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>{cc.removeButton}</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-3 sm:items-center">
                    {/* Verified Unit Price */}
                    <div>
                      <span className="block text-xs font-medium text-[var(--text-muted)]">
                        {cc.unitPriceLabel}
                      </span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        {formatCurrencyForLanguage(item.unitPrice, language)}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div>
                      <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
                        {cc.quantityLabel}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={cc.decreaseQuantityAria(item.name)}
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.availableStock}
                          step={1}
                          aria-label={`${cc.quantityLabel} - ${item.name}`}
                          value={item.quantity}
                          onChange={(e) => {
                            const parsed = Number(e.target.value);
                            if (Number.isInteger(parsed)) {
                              handleQuantityChange(item.productId, parsed);
                            }
                          }}
                          className="h-9 w-16 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white px-2 text-center font-mono text-sm font-semibold text-[var(--text-primary)]"
                        />
                        <button
                          type="button"
                          aria-label={cc.increaseQuantityAria(item.name)}
                          disabled={item.quantity >= item.availableStock}
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="mt-1 block text-[11px] text-[var(--text-muted)]">
                        {cc.maxStockLabel(item.availableStock)}
                      </span>
                    </div>

                    {/* Validated Line Subtotal */}
                    <div className="sm:text-right">
                      <span className="block text-xs font-medium text-[var(--text-muted)]">
                        {cc.lineSubtotalLabel}
                      </span>
                      <span className="text-base font-bold text-[var(--brand-primary)]">
                        {formatCurrencyForLanguage(item.lineSubtotal, language)}
                      </span>
                    </div>
                  </div>

                  {itemError && itemError.productId === item.productId ? (
                    <p
                      role="alert"
                      className="rounded-[var(--radius-sm)] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-3 py-2 text-xs font-medium text-[var(--status-error)]"
                    >
                      {itemError.message}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>

          {/* Validated Order Summary & Checkout Verification Sidebar */}
          <div className="space-y-4 lg:col-span-4">
            <Card
              variant="elevated"
              padding="lg"
              className="space-y-5 border-t-4 border-t-[var(--brand-primary)] bg-white"
            >
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
                <ShieldCheck
                  className="h-5 w-5 text-[var(--brand-primary)]"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {cc.summaryHeading}
                </h2>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-secondary)]">
                    {cc.uniqueProductsLabel}
                  </dt>
                  <dd className="font-semibold text-[var(--text-primary)]">
                    {liveValidation.uniqueItems}
                  </dd>
                </div>

                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-secondary)]">
                    {cc.totalUnitsLabel}
                  </dt>
                  <dd className="font-semibold text-[var(--text-primary)]">
                    {liveValidation.totalItems}
                  </dd>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <dt className="text-[var(--text-secondary)]">
                    {cc.subtotalLabel}
                  </dt>
                  <dd className="font-semibold text-[var(--text-primary)]">
                    {formatCurrencyForLanguage(
                      liveValidation.subtotal,
                      language
                    )}
                  </dd>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-strong)] pt-3 text-base">
                  <dt className="font-bold text-[var(--text-primary)]">
                    {cc.estimatedTotalLabel}
                  </dt>
                  <dd className="text-xl font-bold text-[var(--brand-primary)]">
                    {formatCurrencyForLanguage(liveValidation.total, language)}
                  </dd>
                </div>
              </dl>

              <p className="rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-3 text-xs leading-relaxed text-[var(--text-muted)]">
                {cc.priceAuthorityNote}
              </p>

              <div className="space-y-3">
                <Button
                  href="/customer/checkout"
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  <span>{cc.proceedToCheckoutButton}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  isLoading={isRevalidating}
                  onClick={handleRevalidateForCheckout}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isRevalidating
                      ? cc.revalidatingButton
                      : cc.revalidateButton}
                  </span>
                </Button>
              </div>

              {serverVerifiedSummary ? (
                <div className="space-y-3 pt-1">
                  <StatusNotice
                    tone="info"
                    title={cc.revalidationVerifiedTitle}
                  >
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-secondary)]" />
                      <span>{cc.revalidationVerifiedDesc}</span>
                    </p>
                  </StatusNotice>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
}

export function CustomerCartFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.customerCart.loadingMessage}
        </p>
      </Card>
    </Container>
  );
}
