"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { CustomerOrderView, OrderStatus, PaymentStatus, VerifiedSessionUser } from "@/types";
import { formatCurrencyForLanguage, formatDateForLanguage } from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { StatusNotice } from "@/components/ui/StatusNotice";

interface CustomerOrdersListViewProps {
  user: VerifiedSessionUser;
}

export function CustomerOrdersListView({ user }: CustomerOrdersListViewProps) {
  const { language, t } = useLanguagePreference();
  const co = t.customerOrders;

  const [orders, setOrders] = useState<CustomerOrderView[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRefresh() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/customer/orders", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = (await response.json()) as {
        ok?: boolean;
        orders?: CustomerOrderView[];
        error?: string;
      };

      if (!response.ok || !data.ok || !Array.isArray(data.orders)) {
        setErrorMessage(data.error ?? co.errorMessage);
        setOrders([]);
        return;
      }

      setOrders(data.orders);
    } catch {
      setErrorMessage(co.errorMessage);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        const response = await fetch("/api/customer/orders", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        const data = (await response.json()) as {
          ok?: boolean;
          orders?: CustomerOrderView[];
          error?: string;
        };

        if (ignore) return;

        if (!response.ok || !data.ok || !Array.isArray(data.orders)) {
          setErrorMessage(data.error ?? co.errorMessage);
          setOrders([]);
          return;
        }

        setOrders(data.orders);
      } catch {
        if (!ignore) {
          setErrorMessage(co.errorMessage);
          setOrders([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      ignore = true;
    };
  }, [co.errorMessage]);

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

  function getOrderStatusBadgeClasses(status: OrderStatus): string {
    switch (status) {
      case "verified":
        return "border-emerald-300 bg-emerald-50 text-emerald-800";
      case "rejected":
      case "cancelled":
        return "border-red-300 bg-red-50 text-red-800";
      case "pending_verification":
      default:
        return "border-amber-300 bg-amber-50 text-amber-800";
    }
  }

  function getPaymentStatusBadgeClasses(status: PaymentStatus): string {
    switch (status) {
      case "paid":
        return "border-emerald-300 bg-emerald-50 text-emerald-800";
      case "failed":
        return "border-red-300 bg-red-50 text-red-800";
      case "pending":
      case "unpaid":
      default:
        return "border-amber-300 bg-amber-50 text-amber-800";
    }
  }

  return (
    <Container className="space-y-8">
      {/* Top Navigation & Profile Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{co.backToDashboard}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Button href="/customer/products" variant="secondary" size="sm">
            <Package className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
            <span>{co.browseCatalogueButton}</span>
          </Button>

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <UserCheck className="h-3.5 w-3.5 text-[var(--brand-secondary)]" aria-hidden="true" />
            <span>{user.fullName}</span>
          </span>
          <LogoutButton role="customer" />
        </div>
      </div>

      {/* Header Banner */}
      <Card
        variant="elevated"
        padding="lg"
        className="space-y-4 border-t-4 border-t-[var(--brand-primary)] bg-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{co.badge}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {co.heading}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {co.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleRefresh()}
              isLoading={isLoading}
              aria-label={co.retryButton}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>{co.retryButton}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Notice */}
      {errorMessage ? (
        <StatusNotice tone="error" title={errorMessage}>
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleRefresh()}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{co.retryButton}</span>
            </Button>
          </div>
        </StatusNotice>
      ) : null}

      {/* Loading Skeleton / Pulse */}
      {isLoading && (!orders || orders.length === 0) ? (
        <Card variant="default" padding="lg" className="space-y-3 bg-white text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
            <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {co.loadingMessage}
          </p>
        </Card>
      ) : null}

      {/* Empty State */}
      {!isLoading && !errorMessage && orders && orders.length === 0 ? (
        <Card variant="default" padding="lg" className="space-y-4 bg-white py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--brand-primary)]">
            <ShoppingBag className="h-7 w-7 text-[var(--brand-secondary)]" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {co.emptyTitle}
            </h2>
            <p className="mx-auto max-w-lg text-sm text-[var(--text-secondary)]">
              {co.emptyDescription}
            </p>
          </div>
          <div className="pt-2">
            <Button href="/customer/products" variant="primary" size="md">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>{co.browseCatalogueButton}</span>
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Orders List */}
      {!isLoading && orders && orders.length > 0 ? (
        <div className="space-y-5">
          {orders.map((order) => {
            const statusBadgeClass = getOrderStatusBadgeClasses(order.orderStatus);
            const paymentBadgeClass = getPaymentStatusBadgeClasses(order.paymentStatus);

            return (
              <Card
                key={order.id}
                variant="elevated"
                padding="md"
                className="space-y-4 bg-white transition-all duration-150 hover:border-[var(--brand-secondary)]"
              >
                {/* Order Header / Identification */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-[var(--brand-primary)]">
                        {order.orderNumber}
                      </span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        ({order.id})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                      <span>{co.orderDateLabel}: {formatDateForLanguage(order.createdAt, language)}</span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass}`}
                    >
                      {order.orderStatus === "verified" ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      ) : order.orderStatus === "rejected" || order.orderStatus === "cancelled" ? (
                        <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>{getOrderStatusLabel(order.orderStatus)}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${paymentBadgeClass}`}
                    >
                      <span>{getPaymentStatusLabel(order.paymentStatus)}</span>
                    </span>
                  </div>
                </div>

                {/* Items Snapshot */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                    {co.itemsSummaryHeading}
                  </div>
                  <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-sm">
                    {order.items.map((item) => (
                      <div
                        key={`${item.productId}-${item.packSize}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-[var(--text-primary)]">
                            {item.name}
                          </span>
                          <span className="rounded bg-white px-1.5 py-0.5 text-xs text-[var(--text-muted)] border border-[var(--border-subtle)]">
                            {item.packSize}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            × {item.quantity}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                          {formatCurrencyForLanguage(item.lineSubtotal, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Preview & Order Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-4 text-sm">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <MapPin className="h-4 w-4 shrink-0 text-[var(--brand-secondary)]" aria-hidden="true" />
                    <span className="truncate max-w-xs sm:max-w-md">
                      {order.deliveryDetails.villageOrCity}, {order.deliveryDetails.district}, {order.deliveryDetails.state} - {order.deliveryDetails.pinCode}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <span className="block text-xs text-[var(--text-muted)]">
                        {co.totalQuantityLabel}: {order.totalItems} | {co.totalAmountLabel}
                      </span>
                      <span className="font-mono text-base font-bold text-[var(--brand-primary)]">
                        {formatCurrencyForLanguage(order.total, language)}
                      </span>
                    </div>

                    <Button
                      href={`/customer/orders/${order.id}`}
                      variant="primary"
                      size="sm"
                    >
                      <span>{co.viewDetailsButton}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </Container>
  );
}

export function CustomerOrdersFallbackView() {
  return (
    <Container>
      <Card variant="default" padding="lg" className="space-y-3 bg-white text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
          <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Loading orders…
        </p>
      </Card>
    </Container>
  );
}
