"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  FlaskConical,
  Minus,
  Package,
  Plus,
  ShieldAlert,
  ShoppingCart,
  Sprout,
  UserCheck,
} from "lucide-react";
import type { ProductRecord, VerifiedSessionUser } from "@/types";
import {
  filterActiveCustomerProducts,
  getAvailableStockForProduct,
  getProductAvailabilityState,
  isProductAvailableForSale,
  roundCurrency,
  validateCartQuantity,
} from "@/lib/cart";
import { formatCurrencyForLanguage } from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { useCustomerCart } from "@/components/shared/CustomerCartProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { CustomerProductCatalogue } from "@/components/shared/CustomerProductCatalogue";
import { LogoutButton } from "@/components/shared/LogoutButton";

export function CustomerProductsListView({
  user,
  products,
  hasLoadError,
}: {
  user: VerifiedSessionUser;
  products: ProductRecord[];
  hasLoadError: boolean;
}) {
  const { t } = useLanguagePreference();
  const { totalItems } = useCustomerCart();
  const cp = t.customerProducts;
  const activeProducts = filterActiveCustomerProducts(products);

  return (
    <Container className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{cp.backToDashboard}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Button href="/customer/orders" variant="outline" size="sm">
            <ClipboardList
              className="h-4 w-4 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>{t.customerOrders.myOrdersButton}</span>
          </Button>

          <Button href="/customer/cart" variant="secondary" size="sm">
            <ShoppingCart
              className="h-4 w-4 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>{cp.viewCartButton(totalItems)}</span>
          </Button>

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

      {/* Catalogue Header Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-4 border-t-4 border-t-[var(--brand-secondary)] bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
            <Package className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{cp.catalogueBadge}</span>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {cp.showingProductsCount(activeProducts.length)}
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {cp.heading}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
            {cp.subtitle}
          </p>
        </div>
      </Card>

      {hasLoadError ? (
        <StatusNotice tone="error" title={cp.catalogueUnavailableTitle}>
          <p>{cp.catalogueUnavailableDesc}</p>
        </StatusNotice>
      ) : null}

      <CustomerProductCatalogue products={activeProducts} />
    </Container>
  );
}

export function CustomerProductsFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.customerProducts.loadingMessage}
        </p>
      </Card>
    </Container>
  );
}

export function CustomerProductDetailView({
  user,
  product,
}: {
  user: VerifiedSessionUser;
  product: ProductRecord;
}) {
  const { language, t } = useLanguagePreference();
  const { addItem, getItemQuantity, totalItems } = useCustomerCart();
  const cpd = t.customerProductDetail;

  const availability = getProductAvailabilityState(product);
  const canPurchase = isProductAvailableForSale(product);
  const availableStock = getAvailableStockForProduct(product);
  const inCartQty = getItemQuantity(product.id);
  const remainingAddableStock = Math.max(0, availableStock - inCartQty);

  const [selectedPackSize, setSelectedPackSize] = useState<string>(
    product.packSizes[0] ?? ""
  );
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [addedFeedbackCount, setAddedFeedbackCount] = useState<number | null>(
    null
  );

  const hasExplicitStockQty =
    typeof product.stockQuantity === "number" &&
    Number.isFinite(product.stockQuantity) &&
    product.stockQuantity > 0;

  const parsedQty = Number(quantityInput);
  const previewQty =
    Number.isInteger(parsedQty) && parsedQty >= 1 ? parsedQty : 1;
  const previewSubtotal =
    product.unitPrice !== null && product.unitPrice > 0
      ? roundCurrency(product.unitPrice * previewQty)
      : 0;

  function handleStepQuantity(delta: number) {
    setQuantityError(null);
    setAddedFeedbackCount(null);
    const current = Number(quantityInput);
    const base = Number.isInteger(current) && current >= 1 ? current : 1;
    const maxAllowed = Math.max(1, remainingAddableStock || availableStock);
    const next = Math.min(Math.max(1, base + delta), maxAllowed);
    setQuantityInput(String(next));
  }

  function handleAddToCart() {
    setQuantityError(null);
    setAddedFeedbackCount(null);

    const validation = validateCartQuantity(quantityInput, product, language);
    if (!validation.isValid) {
      setQuantityError(validation.error);
      return;
    }

    const result = addItem(product, validation.quantity, selectedPackSize);
    if (!result.ok) {
      setQuantityError(result.error);
      return;
    }

    setAddedFeedbackCount(validation.quantity);
    setQuantityInput("1");
  }

  return (
    <Container className="space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer/products"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{cpd.backToCatalogue}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Button href="/customer/orders" variant="outline" size="sm">
            <ClipboardList
              className="h-4 w-4 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>{t.customerOrders.myOrdersButton}</span>
          </Button>

          <Button href="/customer/cart" variant="secondary" size="sm">
            <ShoppingCart
              className="h-4 w-4 text-[var(--brand-primary)]"
              aria-hidden="true"
            />
            <span>{cpd.viewCartButton(totalItems)}</span>
          </Button>

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

      {/* Product Header & Technical Specifications Card */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-6 border-t-4 border-t-[var(--brand-secondary)] bg-white"
      >
        {/* Optional Product Image */}
        {product.imageUrl ? (
          <div className="relative h-64 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={t.customerProducts.productImageAlt(product.name)}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{product.category}</span>
              </span>
              <span className="rounded bg-[var(--bg-subtle)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--text-secondary)]">
                {t.common.skuPrefix}: {product.sku}
              </span>
              {product.registrationNumber ? (
                <span className="rounded bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
                  {t.common.regRefPrefix}: {product.registrationNumber}
                </span>
              ) : null}

              {/* Stock Status Badge */}
              {availability === "in_stock" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-[var(--brand-secondary)]"
                    aria-hidden="true"
                  />
                  <span>
                    {hasExplicitStockQty
                      ? cpd.inStockWithQtyBadge(product.stockQuantity!)
                      : cpd.inStockBadge}
                  </span>
                </span>
              ) : availability === "out_of_stock" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-3 py-1 text-xs font-semibold text-[var(--status-error)]">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{cpd.outOfStockBadge}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-amber-border)] bg-[var(--accent-amber-bg)] px-3 py-1 text-xs font-semibold text-[var(--accent-amber)]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{cpd.enquiryOnlyBadge}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {product.name}
            </h1>

            <p className="max-w-3xl text-base leading-relaxed text-[var(--text-secondary)]">
              {product.shortDescription}
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-4 py-3 text-right">
            <span className="block text-xs font-medium text-[var(--text-muted)]">
              {cpd.indicativeUnitPriceLabel}
            </span>
            {product.unitPrice !== null && product.unitPrice > 0 ? (
              <span className="text-xl font-bold text-[var(--brand-primary)]">
                {formatCurrencyForLanguage(product.unitPrice, language)}
              </span>
            ) : (
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                {t.common.providedOnEnquiry}
              </span>
            )}
          </div>
        </div>

        {/* Purchase / Add to Cart Panel */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {cpd.purchaseSectionHeading}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {cpd.purchaseSectionSubtitle}
              </p>
            </div>

            {inCartQty > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-semibold text-[var(--brand-lime)]">
                <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{cpd.alreadyInCartLabel(inCartQty)}</span>
              </span>
            ) : null}
          </div>

          {canPurchase ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Pack Size Selection */}
                <div>
                  <label
                    htmlFor="detail-pack-size"
                    className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]"
                  >
                    {cpd.selectPackSizeLabel}
                  </label>
                  <select
                    id="detail-pack-size"
                    value={selectedPackSize}
                    onChange={(e) => setSelectedPackSize(e.target.value)}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm font-medium text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    {product.packSizes.map((pack) => (
                      <option key={pack} value={pack}>
                        {pack}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Selector */}
                <div>
                  <label
                    htmlFor="detail-quantity"
                    className="mb-1.5 block text-xs font-semibold text-[var(--text-primary)]"
                  >
                    {cpd.quantityLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(-1)}
                      aria-label={cpd.decreaseQuantityAria}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <input
                      id="detail-quantity"
                      type="number"
                      min={1}
                      max={availableStock}
                      step={1}
                      value={quantityInput}
                      onChange={(e) => {
                        setQuantityError(null);
                        setAddedFeedbackCount(null);
                        setQuantityInput(e.target.value);
                      }}
                      className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3 text-center font-mono text-sm font-semibold text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(1)}
                      aria-label={cpd.increaseQuantityAria}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    {cpd.availableStockHint(availableStock)}
                  </p>
                </div>

                {/* Line Subtotal & Add to Cart Action */}
                <div className="flex flex-col justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {cpd.lineSubtotalLabel}
                    </span>
                    <span className="text-lg font-bold text-[var(--brand-primary)]">
                      {formatCurrencyForLanguage(previewSubtotal, language)}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      <span>{cpd.addToCartButton}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {quantityError ? (
                <StatusNotice tone="error" title={quantityError}>
                  <p>{cpd.availableStockHint(availableStock)}</p>
                </StatusNotice>
              ) : null}

              {addedFeedbackCount !== null ? (
                <StatusNotice
                  tone="info"
                  title={cpd.addedToCartSuccessTitle}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p>
                      {cpd.addedToCartSuccessDesc(
                        product.name,
                        addedFeedbackCount
                      )}
                    </p>
                    <Button href="/customer/cart" variant="primary" size="sm">
                      <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{cpd.goToCartButton}</span>
                    </Button>
                  </div>
                </StatusNotice>
              ) : null}
            </div>
          ) : (
            <div className="mt-3">
              <StatusNotice
                tone="warning"
                title={
                  availability === "out_of_stock"
                    ? cpd.outOfStockBadge
                    : cpd.enquiryOnlyBadge
                }
              >
                <p>
                  {availability === "out_of_stock"
                    ? cpd.outOfStockPurchaseNotice
                    : cpd.enquiryOnlyPurchaseNotice}
                </p>
              </StatusNotice>
            </div>
          )}
        </div>

        {/* Key Specifications Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Active Composition */}
          <Card variant="subtle" padding="md" className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <FlaskConical
                className="h-4 w-4 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <h2>{cpd.activeCompositionHeading}</h2>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
              {product.composition}
            </p>
          </Card>

          {/* Dosage & Application */}
          <Card variant="subtle" padding="md" className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <ClipboardList
                className="h-4 w-4 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <h2>{cpd.dosageHeading}</h2>
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
              {product.dosageAndApplication}
            </p>
          </Card>

          {/* Approved Target Crops */}
          <Card variant="subtle" padding="md" className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Sprout
                className="h-4 w-4 text-[var(--brand-secondary)]"
                aria-hidden="true"
              />
              <h2>{cpd.approvedCropsHeading}</h2>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {product.targetCrops.map((crop) => (
                <span
                  key={crop}
                  className="rounded-full border border-[var(--border-strong)] bg-white px-3 py-1 text-xs font-semibold text-[var(--text-primary)]"
                >
                  {crop}
                </span>
              ))}
            </div>
          </Card>

          {/* Available Pack Sizes */}
          <Card variant="subtle" padding="md" className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Package
                className="h-4 w-4 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <h2>{cpd.packSizesHeading}</h2>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {product.packSizes.map((pack) => (
                <span
                  key={pack}
                  className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-white px-3 py-1 font-mono text-xs font-semibold text-[var(--brand-primary)]"
                >
                  {pack}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Safety Precautions & Storage Information */}
        <div className="rounded-[var(--radius-md)] border border-[var(--accent-amber-border)] bg-[var(--accent-amber-bg)] p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-amber)]"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {cpd.safetyHeading}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                {product.safetyAndStorage || cpd.safetyNotSpecified}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </Container>
  );
}

export function CustomerProductDetailFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.customerProductDetail.loadingMessage}
        </p>
      </Card>
    </Container>
  );
}
