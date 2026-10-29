"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingCart,
  User,
  UserCheck,
} from "lucide-react";
import type {
  CartValidationSummary,
  CheckoutDeliveryErrors,
  CheckoutDeliveryInput,
  CustomerOrderView,
  OrderStatus,
  PaymentStatus,
  ProductRecord,
  VerifiedSessionUser,
} from "@/types";
import { revalidateCartAgainstProducts, roundCurrency } from "@/lib/cart";
import {
  formatCurrencyForLanguage,
  formatDateForLanguage,
} from "@/lib/language";
import {
  computeOrderSubmissionFingerprint,
  validateCheckoutDeliveryInput,
} from "@/lib/orders";
import { useCustomerCart } from "@/components/shared/CustomerCartProvider";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { StatusNotice } from "@/components/ui/StatusNotice";

interface CustomerOrderConfirmationCardProps {
  order: CustomerOrderView;
}

export function CustomerOrderConfirmationCard({
  order,
}: CustomerOrderConfirmationCardProps) {
  const { language, t } = useLanguagePreference();
  const co = t.customerCheckout;

  function getOrderStatusLabel(status: OrderStatus): string {
    switch (status) {
      case "verified":
        return co.statusConfirmed;
      case "rejected":
        return co.statusRejected;
      case "cancelled":
        return co.statusCancelled;
      case "pending_verification":
      default:
        return co.statusPendingVerification;
    }
  }

  function getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case "paid":
        return co.paymentStatusPaid;
      case "pending":
        return co.paymentStatusPending;
      case "failed":
        return co.paymentStatusFailed;
      case "unpaid":
      default:
        return co.paymentStatusUnpaid;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card
        variant="elevated"
        padding="lg"
        className="border-t-4 border-t-[var(--brand-primary)] bg-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{co.confirmationBadge}</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {co.confirmationHeading}
            </h1>
            <p className="max-w-3xl text-sm text-[var(--text-secondary)]">
              {co.confirmationSubtitle}
            </p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3 text-right">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {co.orderNumberLabel}
            </span>
            <span className="font-mono text-lg font-bold text-[var(--brand-primary)]">
              {order.orderNumber}
            </span>
          </div>
        </div>

        {/* Key Metadata Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--border-subtle)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-3.5">
            <span className="block text-xs font-medium text-[var(--text-muted)]">
              {co.orderIdLabel}
            </span>
            <span className="mt-1 block break-all font-mono text-xs font-semibold text-[var(--text-primary)]">
              {order.id}
            </span>
          </div>

          <div className="rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-3.5">
            <span className="block text-xs font-medium text-[var(--text-muted)]">
              {co.orderCreatedAtLabel}
            </span>
            <span className="mt-1 block text-xs font-semibold text-[var(--text-primary)]">
              {formatDateForLanguage(order.createdAt, language)}
            </span>
          </div>

          <div className="rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 p-3.5">
            <span className="block text-xs font-medium text-amber-800">
              {co.orderStatusLabel}
            </span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{getOrderStatusLabel(order.orderStatus)}</span>
            </span>
          </div>

          <div className="rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50 p-3.5">
            <span className="block text-xs font-medium text-amber-800">
              {co.paymentStatusLabel}
            </span>
            <span className="mt-1 block text-xs font-bold text-amber-900">
              {getPaymentStatusLabel(order.paymentStatus)}
            </span>
          </div>
        </div>
      </Card>

      {/* Honest Verification & Payment Status Notice */}
      <StatusNotice tone="warning" title={co.verificationExplainTitle}>
        <p>{co.verificationExplainDesc}</p>
      </StatusNotice>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Ordered Items Snapshot */}
        <div className="space-y-4 lg:col-span-7">
          <Card variant="default" padding="lg" className="space-y-4 bg-white">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Package
                className="h-5 w-5 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {co.orderedItemsHeading}
              </h2>
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {order.items.map((item) => (
                <div
                  key={`${item.productId}-${item.packSize}`}
                  className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--brand-lime-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-primary)]">
                        {item.category}
                      </span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        {t.common.skuPrefix}: {item.sku}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      <strong>{co.packSizeLabel}</strong> {item.packSize} ·{" "}
                      <strong>{co.quantityLabel}</strong> {item.quantity} ·{" "}
                      <strong>{co.unitPriceLabel}</strong>{" "}
                      {formatCurrencyForLanguage(item.unitPrice, language)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="block text-[11px] text-[var(--text-muted)]">
                      {co.lineSubtotalLabel}
                    </span>
                    <span className="text-sm font-bold text-[var(--brand-primary)]">
                      {formatCurrencyForLanguage(item.lineSubtotal, language)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-[var(--border-strong)] pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">
                  {co.uniqueProductsLabel}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {order.uniqueItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">
                  {co.totalUnitsLabel}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {order.totalItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">
                  {co.subtotalLabel}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatCurrencyForLanguage(order.subtotal, language)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-base">
                <span className="font-bold text-[var(--text-primary)]">
                  {co.payableAmountLabel}
                </span>
                <span className="text-lg font-bold text-[var(--brand-primary)]">
                  {formatCurrencyForLanguage(order.total, language)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recorded Delivery Details */}
        <div className="space-y-4 lg:col-span-5">
          <Card variant="default" padding="lg" className="space-y-4 bg-white">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <MapPin
                className="h-5 w-5 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {co.deliverySummaryHeading}
              </h2>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-[var(--text-muted)]">
                  {co.customerNameLabel}
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <User className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span>{order.deliveryDetails.customerName}</span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[var(--text-muted)]">
                  {co.mobileLabel}
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-mono font-semibold text-[var(--text-primary)]">
                  <Phone className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span>{order.deliveryDetails.mobile}</span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[var(--text-muted)]">
                  {co.addressLineLabel}
                </dt>
                <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                  {order.deliveryDetails.addressLine}
                </dd>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <dt className="text-xs font-medium text-[var(--text-muted)]">
                    {co.villageOrCityLabel}
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                    {order.deliveryDetails.villageOrCity}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-[var(--text-muted)]">
                    {co.districtLabel}
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                    {order.deliveryDetails.district}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-[var(--text-muted)]">
                    {co.stateLabel}
                  </dt>
                  <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                    {order.deliveryDetails.state}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-[var(--text-muted)]">
                    {co.pinCodeLabel}
                  </dt>
                  <dd className="mt-0.5 font-mono font-semibold text-[var(--text-primary)]">
                    {order.deliveryDetails.pinCode}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              href="/customer/products"
              variant="primary"
              size="md"
              fullWidth
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>{co.continueShoppingButton}</span>
            </Button>
            <Button
              href="/customer/orders"
              variant="outline"
              size="md"
              fullWidth
            >
              <ClipboardList className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
              <span>{t.customerOrders.myOrdersButton}</span>
            </Button>
            <Button
              href="/customer/dashboard"
              variant="outline"
              size="md"
              fullWidth
            >
              <span>{co.goToDashboardButton}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CustomerCheckoutViewProps {
  user: VerifiedSessionUser;
  initialProducts: ProductRecord[];
  hasLoadError: boolean;
}

export function CustomerCheckoutView({
  user,
  initialProducts,
  hasLoadError,
}: CustomerCheckoutViewProps) {
  const { language, t } = useLanguagePreference();
  const { items, syncWithValidatedItems, clearCart } = useCustomerCart();
  const co = t.customerCheckout;
  const cc = t.customerCart;

  const [deliveryForm, setDeliveryForm] = useState<CheckoutDeliveryInput>({
    customerName: user.fullName ?? "",
    mobile: user.mobile ?? "",
    addressLine: "",
    villageOrCity: "",
    district: "",
    state: "",
    pinCode: "",
  });

  const [fieldErrors, setFieldErrors] = useState<CheckoutDeliveryErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] =
    useState<CustomerOrderView | null>(null);

  // Authoritative cart validation against server-fetched products
  const liveValidation = useMemo(() => {
    if (hasLoadError && initialProducts.length === 0) {
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

    return revalidateCartAgainstProducts(items, initialProducts, language);
  }, [items, initialProducts, hasLoadError, language]);

  // Deterministic idempotency key for the current checkout payload to prevent double-click duplicate orders
  const idempotencyKey = useMemo(() => {
    return computeOrderSubmissionFingerprint(
      user.uid,
      liveValidation.items.map((item) => ({
        productId: item.productId,
        packSize: item.packSize,
        quantity: item.quantity,
      })),
      deliveryForm
    ).slice(0, 120);
  }, [user.uid, liveValidation.items, deliveryForm]);

  function handleFieldChange(
    field: keyof CheckoutDeliveryInput,
    value: string
  ) {
    setDeliveryForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSubmissionError(null);
  }

  async function handlePlaceOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setSubmissionError(null);

    // 1. Client-side validation of delivery fields in the selected language
    const validation = validateCheckoutDeliveryInput(deliveryForm, language);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setSubmissionError(
        Object.values(validation.errors).find(Boolean) ??
          co.submissionErrorFallback
      );
      return;
    }

    if (liveValidation.items.length === 0) {
      setSubmissionError(t.validation.orderEmptyCart);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/customer/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          idempotencyKey,
          deliveryDetails: validation.data,
          items: liveValidation.items.map((item) => ({
            productId: item.productId,
            packSize: item.packSize,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        code?: string;
        error?: string;
        fieldErrors?: CheckoutDeliveryErrors;
        order?: CustomerOrderView;
      };

      if (!response.ok || !data.ok || !data.order) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }

        // If cart items changed on the server, revalidate cart so UI reflects latest stock/prices
        if (
          data.code === "PRODUCT_UNAVAILABLE" ||
          data.code === "PRICE_UNAVAILABLE" ||
          data.code === "PRODUCT_OUT_OF_STOCK" ||
          data.code === "INVALID_PACK_SIZE" ||
          data.code === "EXCEEDS_AVAILABLE_STOCK"
        ) {
          try {
            const revalRes = await fetch("/api/customer/cart/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items,
                language,
              }),
            });
            const revalData = (await revalRes.json()) as {
              ok?: boolean;
              summary?: CartValidationSummary;
            };
            if (revalRes.ok && revalData.ok && revalData.summary) {
              syncWithValidatedItems(revalData.summary.items);
            }
          } catch {
            // Ignore secondary revalidation error; primary error message is shown below
          }
          setSubmissionError(data.error ?? co.cartChangedErrorDesc);
        } else {
          setSubmissionError(data.error ?? co.submissionErrorFallback);
        }
        return;
      }

      // Order created and verified on the server: clear local cart and show confirmation
      setConfirmedOrder(data.order);
      clearCart();
    } catch {
      setSubmissionError(co.networkErrorDesc);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/customer/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{co.backToCart}</span>
          </Link>
          <span className="text-[var(--border-strong)]" aria-hidden="true">
            |
          </span>
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
          >
            <Package className="h-4 w-4" aria-hidden="true" />
            <span>{co.backToCatalogue}</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {/* If order has been placed in this session, display the Order Confirmation screen */}
      {confirmedOrder ? (
        <CustomerOrderConfirmationCard order={confirmedOrder} />
      ) : (
        <>
          {/* Checkout Header */}
          <Card
            variant="elevated"
            padding="lg"
            className="border-t-4 border-t-[var(--brand-primary)] bg-white"
          >
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{co.checkoutBadge}</span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {co.heading}
              </h1>
              <p className="max-w-3xl text-sm text-[var(--text-secondary)]">
                {co.subtitle}
              </p>
            </div>
          </Card>

          {hasLoadError ? (
            <StatusNotice
              tone="error"
              title={t.customerProducts.catalogueUnavailableTitle}
            >
              <p>{t.customerProducts.catalogueUnavailableDesc}</p>
            </StatusNotice>
          ) : null}

          {liveValidation.issues.length > 0 ? (
            <StatusNotice tone="warning" title={cc.revalidationIssuesTitle}>
              <ul className="list-disc space-y-1 pl-4">
                {liveValidation.issues.map((issue) => (
                  <li key={`${issue.productId}-${issue.type}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </StatusNotice>
          ) : null}

          {submissionError ? (
            <StatusNotice tone="error" title={co.submissionErrorTitle}>
              <p>{submissionError}</p>
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
                  {co.emptyCartTitle}
                </h2>
                <p className="mx-auto max-w-lg text-sm text-[var(--text-secondary)]">
                  {co.emptyCartDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Button href="/customer/products" variant="primary" size="md">
                  <Package className="h-4 w-4" aria-hidden="true" />
                  <span>{co.browseProductsButton}</span>
                </Button>
                <Button href="/customer/cart" variant="outline" size="md">
                  <span>{co.returnToCartButton}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <form
              onSubmit={handlePlaceOrder}
              noValidate
              className="grid grid-cols-1 gap-6 lg:grid-cols-12"
            >
              {/* Left Column: Delivery Form & Selected Products Review */}
              <div className="space-y-6 lg:col-span-7">
                <Card
                  variant="default"
                  padding="lg"
                  className="space-y-5 bg-white"
                >
                  <div className="space-y-1 border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="h-5 w-5 text-[var(--brand-primary)]"
                        aria-hidden="true"
                      />
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {co.deliverySectionHeading}
                      </h2>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {co.deliverySectionSubtitle}
                    </p>
                  </div>

                  {user.fullName || user.mobile ? (
                    <StatusNotice
                      tone="info"
                      title={co.deliverySectionHeading}
                    >
                      <p className="flex items-start gap-1.5">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-secondary)]"
                          aria-hidden="true"
                        />
                        <span>{co.prefilledProfileNotice}</span>
                      </p>
                    </StatusNotice>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      id="checkout-customer-name"
                      label={co.customerNameLabel}
                      required
                      error={fieldErrors.customerName}
                    >
                      <Input
                        id="checkout-customer-name"
                        name="customerName"
                        placeholder={co.customerNamePlaceholder}
                        value={deliveryForm.customerName}
                        onChange={(e) =>
                          handleFieldChange("customerName", e.target.value)
                        }
                        hasError={Boolean(fieldErrors.customerName)}
                        required
                        disabled={isSubmitting}
                      />
                    </FormField>

                    <FormField
                      id="checkout-mobile"
                      label={co.mobileLabel}
                      required
                      error={fieldErrors.mobile}
                    >
                      <Input
                        id="checkout-mobile"
                        name="mobile"
                        type="tel"
                        placeholder={co.mobilePlaceholder}
                        value={deliveryForm.mobile}
                        onChange={(e) =>
                          handleFieldChange("mobile", e.target.value)
                        }
                        hasError={Boolean(fieldErrors.mobile)}
                        required
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </div>

                  <FormField
                    id="checkout-address-line"
                    label={co.addressLineLabel}
                    required
                    error={fieldErrors.addressLine}
                  >
                    <Input
                      id="checkout-address-line"
                      name="addressLine"
                      placeholder={co.addressLinePlaceholder}
                      value={deliveryForm.addressLine}
                      onChange={(e) =>
                        handleFieldChange("addressLine", e.target.value)
                      }
                      hasError={Boolean(fieldErrors.addressLine)}
                      required
                      disabled={isSubmitting}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      id="checkout-village-city"
                      label={co.villageOrCityLabel}
                      required
                      error={fieldErrors.villageOrCity}
                    >
                      <Input
                        id="checkout-village-city"
                        name="villageOrCity"
                        placeholder={co.villageOrCityPlaceholder}
                        value={deliveryForm.villageOrCity}
                        onChange={(e) =>
                          handleFieldChange("villageOrCity", e.target.value)
                        }
                        hasError={Boolean(fieldErrors.villageOrCity)}
                        required
                        disabled={isSubmitting}
                      />
                    </FormField>

                    <FormField
                      id="checkout-district"
                      label={co.districtLabel}
                      required
                      error={fieldErrors.district}
                    >
                      <Input
                        id="checkout-district"
                        name="district"
                        placeholder={co.districtPlaceholder}
                        value={deliveryForm.district}
                        onChange={(e) =>
                          handleFieldChange("district", e.target.value)
                        }
                        hasError={Boolean(fieldErrors.district)}
                        required
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      id="checkout-state"
                      label={co.stateLabel}
                      required
                      error={fieldErrors.state}
                    >
                      <Input
                        id="checkout-state"
                        name="state"
                        placeholder={co.statePlaceholder}
                        value={deliveryForm.state}
                        onChange={(e) =>
                          handleFieldChange("state", e.target.value)
                        }
                        hasError={Boolean(fieldErrors.state)}
                        required
                        disabled={isSubmitting}
                      />
                    </FormField>

                    <FormField
                      id="checkout-pincode"
                      label={co.pinCodeLabel}
                      required
                      error={fieldErrors.pinCode}
                    >
                      <Input
                        id="checkout-pincode"
                        name="pinCode"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder={co.pinCodePlaceholder}
                        value={deliveryForm.pinCode}
                        onChange={(e) =>
                          handleFieldChange("pinCode", e.target.value)
                        }
                        hasError={Boolean(fieldErrors.pinCode)}
                        required
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </div>
                </Card>

                {/* Selected Cart Items Review */}
                <Card
                  variant="default"
                  padding="lg"
                  className="space-y-4 bg-white"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-2">
                      <Package
                        className="h-5 w-5 text-[var(--brand-primary)]"
                        aria-hidden="true"
                      />
                      <h2 className="text-base font-bold text-[var(--text-primary)]">
                        {co.orderItemsHeading}
                      </h2>
                    </div>
                    <Link
                      href="/customer/cart"
                      className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      {co.backToCart}
                    </Link>
                  </div>

                  <div className="divide-y divide-[var(--border-subtle)]">
                    {liveValidation.items.map((item) => (
                      <div
                        key={`${item.productId}-${item.packSize}`}
                        className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--brand-lime-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-primary)]">
                              {item.category}
                            </span>
                            <span className="font-mono text-xs text-[var(--text-muted)]">
                              {t.common.skuPrefix}: {item.sku}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            <strong>{co.packSizeLabel}</strong> {item.packSize}{" "}
                            · <strong>{co.quantityLabel}</strong>{" "}
                            {item.quantity} ·{" "}
                            <strong>{co.unitPriceLabel}</strong>{" "}
                            {formatCurrencyForLanguage(
                              item.unitPrice,
                              language
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="block text-[11px] text-[var(--text-muted)]">
                            {co.lineSubtotalLabel}
                          </span>
                          <span className="text-sm font-bold text-[var(--brand-primary)]">
                            {formatCurrencyForLanguage(
                              item.lineSubtotal,
                              language
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Column: Order Summary & Submit Action */}
              <div className="space-y-4 lg:col-span-5">
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
                      {co.summaryHeading}
                    </h2>
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-[var(--text-secondary)]">
                        {co.uniqueProductsLabel}
                      </dt>
                      <dd className="font-semibold text-[var(--text-primary)]">
                        {liveValidation.uniqueItems}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between">
                      <dt className="text-[var(--text-secondary)]">
                        {co.totalUnitsLabel}
                      </dt>
                      <dd className="font-semibold text-[var(--text-primary)]">
                        {liveValidation.totalItems}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                      <dt className="text-[var(--text-secondary)]">
                        {co.subtotalLabel}
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
                        {co.payableAmountLabel}
                      </dt>
                      <dd className="text-xl font-bold text-[var(--brand-primary)]">
                        {formatCurrencyForLanguage(
                          liveValidation.total,
                          language
                        )}
                      </dd>
                    </div>
                  </dl>

                  <p className="rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-3 text-xs leading-relaxed text-[var(--text-muted)]">
                    {co.serverAuthorityNotice}
                  </p>

                  <StatusNotice
                    tone="warning"
                    title={co.paymentPendingNoticeTitle}
                  >
                    <p>{co.paymentPendingNoticeDesc}</p>
                  </StatusNotice>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                  >
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isSubmitting
                        ? co.placingOrderButton
                        : co.placeOrderButton}
                    </span>
                  </Button>
                </Card>
              </div>
            </form>
          )}
        </>
      )}
    </Container>
  );
}

interface CustomerOrderDetailViewProps {
  user: VerifiedSessionUser;
  order: CustomerOrderView | null;
}

export function CustomerOrderDetailView({
  user,
  order,
}: CustomerOrderDetailViewProps) {
  const { t } = useLanguagePreference();
  const co = t.customerCheckout;

  return (
    <Container className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/customer/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t.customerOrders.myOrdersButton}</span>
          </Link>
          <span className="text-[var(--border-strong)]" aria-hidden="true">
            |
          </span>
          <Link
            href="/customer/products"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
          >
            {co.backToCatalogue}
          </Link>
          <span className="text-[var(--border-strong)]" aria-hidden="true">
            |
          </span>
          <Link
            href="/customer/dashboard"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--brand-primary)]"
          >
            {co.backToDashboard}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {!order ? (
        <Card
          variant="default"
          padding="lg"
          className="space-y-4 bg-white text-center"
        >
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            {co.orderNotFoundTitle}
          </h1>
          <p className="mx-auto max-w-lg text-sm text-[var(--text-secondary)]">
            {co.orderNotFoundDesc}
          </p>
          <div className="pt-1">
            <Button href="/customer/products" variant="primary" size="md">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>{co.continueShoppingButton}</span>
            </Button>
          </div>
        </Card>
      ) : (
        <CustomerOrderConfirmationCard order={order} />
      )}
    </Container>
  );
}

export function CustomerCheckoutFallbackView() {
  const { t } = useLanguagePreference();
  return (
    <Container>
      <Card variant="default" padding="lg" className="bg-white">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {t.customerCheckout.loadingMessage}
        </p>
      </Card>
    </Container>
  );
}
