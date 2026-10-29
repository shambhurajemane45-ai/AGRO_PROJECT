"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  Package,
  Search,
  ShoppingCart,
} from "lucide-react";
import type { ProductRecord } from "@/types";
import {
  filterActiveCustomerProducts,
  getProductAvailabilityState,
  isProductAvailableForSale,
} from "@/lib/cart";
import { formatCurrencyForLanguage } from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { useCustomerCart } from "@/components/shared/CustomerCartProvider";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface CustomerProductCatalogueProps {
  products: ProductRecord[];
}

export function CustomerProductCatalogue({
  products,
}: CustomerProductCatalogueProps) {
  const { language, t } = useLanguagePreference();
  const { addItem, getItemQuantity } = useCustomerCart();
  const cp = t.customerProducts;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "in_stock"
  >("all");
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<{
    productId: string;
    message: string;
  } | null>(null);

  // Defense-in-depth: strictly display active products only
  const activeProducts = useMemo(
    () => filterActiveCustomerProducts(products),
    [products]
  );

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const product of activeProducts) {
      if (product.category.trim()) {
        unique.add(product.category.trim());
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return activeProducts.filter((product) => {
      if (
        selectedCategory !== "all" &&
        product.category.trim() !== selectedCategory
      ) {
        return false;
      }

      if (
        availabilityFilter === "in_stock" &&
        !isProductAvailableForSale(product)
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        product.name,
        product.sku,
        product.category,
        product.shortDescription,
        product.composition,
        ...product.targetCrops,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeProducts, searchQuery, selectedCategory, availabilityFilter]);

  function handleQuickAddToCart(product: ProductRecord) {
    setCardError(null);
    const result = addItem(product, 1, product.packSizes[0]);
    if (!result.ok) {
      setCardError({
        productId: product.id,
        message: result.error,
      });
      return;
    }

    setRecentlyAddedId(product.id);
    window.setTimeout(() => {
      setRecentlyAddedId((current) =>
        current === product.id ? null : current
      );
    }, 1800);
  }

  if (activeProducts.length === 0) {
    return (
      <Card
        variant="default"
        padding="lg"
        className="space-y-3 bg-white text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
          <Package className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {cp.emptyTitle}
        </h2>
        <p className="mx-auto max-w-lg text-sm text-[var(--text-secondary)]">
          {cp.emptyDescription}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search, Category & Stock Availability Filter Bar */}
      <Card variant="default" padding="md" className="bg-white">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label
              htmlFor="catalogue-search"
              className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              {cp.searchLabel}
            </label>
            <Input
              id="catalogue-search"
              type="search"
              placeholder={cp.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              endAdornment={
                <Search
                  className="h-4 w-4 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
              }
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="catalogue-category"
              className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              {cp.categoryFilterLabel}
            </label>
            <select
              id="catalogue-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-primary)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <option value="all">
                {cp.allCategoriesOption(activeProducts.length)}
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="catalogue-availability"
              className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]"
            >
              {cp.availabilityFilterLabel}
            </label>
            <select
              id="catalogue-availability"
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(e.target.value as "all" | "in_stock")
              }
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-primary)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <option value="all">{cp.allAvailabilityOption}</option>
              <option value="in_stock">{cp.inStockOnlyOption}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Filtered Results Grid */}
      {filteredProducts.length === 0 ? (
        <Card
          variant="default"
          padding="lg"
          className="space-y-3 bg-white text-center"
        >
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {cp.noFilterMatch}
          </p>
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setAvailabilityFilter("all");
              }}
            >
              <span>{cp.resetFiltersButton}</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredProducts.map((product) => {
            const availability = getProductAvailabilityState(product);
            const canAddToCart = isProductAvailableForSale(product);
            const inCartQty = getItemQuantity(product.id);
            const isRecentlyAdded = recentlyAddedId === product.id;
            const hasExplicitStockQty =
              typeof product.stockQuantity === "number" &&
              Number.isFinite(product.stockQuantity) &&
              product.stockQuantity > 0;

            return (
              <Card
                key={product.id}
                variant="default"
                padding="lg"
                className="flex flex-col justify-between space-y-5 bg-white"
              >
                <div className="space-y-4">
                  {/* Product Image or Verified Formulation Visual Banner */}
                  {product.imageUrl ? (
                    <div className="relative h-44 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={cp.productImageAlt(product.name)}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3">
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--brand-primary)]">
                        <FlaskConical
                          className="h-4 w-4 shrink-0 text-[var(--brand-secondary)]"
                          aria-hidden="true"
                        />
                        <span>{cp.noImagePlaceholder}</span>
                      </div>
                      <span className="font-mono text-xs font-medium text-[var(--text-muted)]">
                        {t.common.skuPrefix}: {product.sku}
                      </span>
                    </div>
                  )}

                  {/* Category & Stock Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-[var(--brand-lime-subtle)] px-3 py-0.5 text-xs font-semibold text-[var(--brand-primary)]">
                      {product.category}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {availability === "in_stock" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-lime-subtle)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-primary)]">
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-[var(--brand-secondary)]"
                            aria-hidden="true"
                          />
                          <span>
                            {hasExplicitStockQty
                              ? cp.inStockWithQtyBadge(product.stockQuantity!)
                              : cp.inStockBadge}
                          </span>
                        </span>
                      ) : availability === "out_of_stock" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--status-error)]">
                          <AlertCircle
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          <span>{cp.outOfStockBadge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-amber-border)] bg-[var(--accent-amber-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-amber)]">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{cp.enquiryOnlyBadge}</span>
                        </span>
                      )}

                      {inCartQty > 0 ? (
                        <span className="rounded-full bg-[var(--brand-primary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-lime)]">
                          {cp.inCartCountBadge(inCartQty)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Product Title & Price */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                      {product.name}
                    </h2>

                    <div className="text-right">
                      {product.unitPrice !== null && product.unitPrice > 0 ? (
                        <p className="text-base font-bold text-[var(--brand-primary)]">
                          {formatCurrencyForLanguage(
                            product.unitPrice,
                            language
                          )}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-[var(--text-muted)]">
                          {t.common.providedOnEnquiry}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {product.shortDescription}
                  </p>

                  {/* Key Specifications Summary */}
                  <dl className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-xs">
                    <div>
                      <dt className="font-semibold text-[var(--text-primary)]">
                        {cp.activeCompositionLabel}
                      </dt>
                      <dd className="mt-0.5 text-[var(--text-secondary)]">
                        {product.composition}
                      </dd>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-[var(--text-primary)]">
                          {cp.approvedCropsLabel}
                        </dt>
                        <dd className="mt-0.5 text-[var(--text-secondary)]">
                          {product.targetCrops.join(", ")}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[var(--text-primary)]">
                          {cp.packSizesLabel}
                        </dt>
                        <dd className="mt-0.5 text-[var(--text-secondary)]">
                          {product.packSizes.join(", ")}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  {cardError && cardError.productId === product.id ? (
                    <p
                      role="alert"
                      className="rounded-[var(--radius-sm)] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-3 py-2 text-xs font-medium text-[var(--status-error)]"
                    >
                      {cardError.message}
                    </p>
                  ) : null}
                </div>

                {/* Card Actions: View Details & Quick Add to Cart */}
                <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                  <Button
                    href={`/customer/products/${product.id}`}
                    variant={canAddToCart ? "outline" : "primary"}
                    size="md"
                    fullWidth
                  >
                    <span>{cp.viewDetailsButton}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>

                  {canAddToCart ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={() => handleQuickAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isRecentlyAdded
                          ? cp.addedToCartFeedback
                          : cp.addToCartButton}
                      </span>
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
