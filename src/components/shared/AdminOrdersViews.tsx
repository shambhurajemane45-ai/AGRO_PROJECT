"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileCheck2,
  FileX,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import type {
  AdminOrderAction,
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  VerifiedSessionUser,
} from "@/types";
import {
  formatCurrencyForLanguage,
  formatDateForLanguage,
} from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { LogoutButton } from "@/components/shared/LogoutButton";

type FilterTab = "all" | "pending_verification" | "verified" | "rejected" | "cancelled";

interface PendingActionState {
  order: OrderRecord;
  action: AdminOrderAction;
}

function OrderStatusBadge({
  status,
  t,
}: {
  status: OrderStatus;
  t: ReturnType<typeof useLanguagePreference>["t"];
}) {
  const ao = t.adminOrders;
  const co = t.customerOrders;

  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>{co.statusConfirmed}</span>
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
        <XCircle className="h-3 w-3 shrink-0 text-rose-600" aria-hidden="true" />
        <span>{ao.filterRejected}</span>
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
        <FileX className="h-3 w-3 shrink-0 text-slate-500" aria-hidden="true" />
        <span>{co.statusCancelled}</span>
      </span>
    );
  }

  // pending_verification
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      <Clock className="h-3 w-3 shrink-0 text-amber-600" aria-hidden="true" />
      <span>{co.statusPendingVerification}</span>
    </span>
  );
}

function PaymentStatusBadge({
  status,
  t,
}: {
  status: PaymentStatus;
  t: ReturnType<typeof useLanguagePreference>["t"];
}) {
  const co = t.customerOrders;

  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>{co.paymentStatusPaid}</span>
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        <Clock className="h-3 w-3 shrink-0 text-amber-600" aria-hidden="true" />
        <span>{co.paymentStatusPending}</span>
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
        <XCircle className="h-3 w-3 shrink-0 text-rose-600" aria-hidden="true" />
        <span>{co.paymentStatusFailed}</span>
      </span>
    );
  }

  // unpaid
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      <span>{co.paymentStatusUnpaid}</span>
    </span>
  );
}

interface ActionConfirmationModalProps {
  pendingAction: PendingActionState | null;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  t: ReturnType<typeof useLanguagePreference>["t"];
}

function ActionConfirmationModal({
  pendingAction,
  rejectionReason,
  onRejectionReasonChange,
  onCancel,
  onConfirm,
  isSubmitting,
  t,
}: ActionConfirmationModalProps) {
  if (!pendingAction) return null;

  const ao = t.adminOrders;
  const isVerify = pendingAction.action === "verify";
  const orderNumber = pendingAction.order.orderNumber;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-white p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isVerify
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {isVerify ? (
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <h3
                id="confirm-action-title"
                className="text-lg font-bold text-[var(--text-primary)]"
              >
                {isVerify ? ao.confirmVerifyTitle : ao.confirmRejectTitle}
              </h3>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {orderNumber}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            aria-label={ao.cancelActionButton}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {isVerify
            ? ao.confirmVerifyMessage(orderNumber)
            : ao.confirmRejectMessage(orderNumber)}
        </p>

        {isVerify ? (
          <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <strong>{ao.confirmVerifyNote}</strong>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label
              htmlFor="rejection-reason-input"
              className="block text-xs font-semibold text-[var(--text-primary)]"
            >
              {ao.rejectionReasonLabel}
            </label>
            <textarea
              id="rejection-reason-input"
              rows={3}
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              placeholder={ao.rejectionReasonPlaceholder}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {ao.cancelActionButton}
          </Button>

          <Button
            type="button"
            variant={isVerify ? "primary" : "secondary"}
            size="sm"
            onClick={onConfirm}
            isLoading={isSubmitting}
            className={!isVerify ? "bg-rose-700 text-white hover:bg-rose-800" : ""}
          >
            {isSubmitting
              ? ao.processingAction
              : isVerify
                ? ao.confirmVerifyAction
                : ao.confirmRejectAction}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminOrdersListView({
  user,
  initialOrders,
  hasLoadError,
}: {
  user: VerifiedSessionUser;
  initialOrders: OrderRecord[];
  hasLoadError?: boolean;
}) {
  const { language, t } = useLanguagePreference();
  const ao = t.adminOrders;

  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "error";
    message: string;
  } | null>(null);

  const pendingCount = orders.filter((o) => o.orderStatus === "pending_verification").length;
  const verifiedCount = orders.filter((o) => o.orderStatus === "verified").length;
  const rejectedCount = orders.filter((o) => o.orderStatus === "rejected").length;
  const cancelledCount = orders.filter((o) => o.orderStatus === "cancelled").length;

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") return true;
    return order.orderStatus === activeFilter;
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = (await response.json()) as {
        ok?: boolean;
        orders?: OrderRecord[];
        error?: string;
      };

      if (!response.ok || !data.ok || !Array.isArray(data.orders)) {
        setFeedback({
          tone: "error",
          message: data.error ?? ao.dbErrorDesc,
        });
        return;
      }

      setOrders(data.orders);
    } catch {
      setFeedback({
        tone: "error",
        message: ao.dbErrorDesc,
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleExecuteAction() {
    if (!pendingAction) return;

    setIsSubmitting(true);
    setFeedback(null);

    const { order, action } = pendingAction;

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        order?: OrderRecord;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.order) {
        setFeedback({
          tone: "error",
          message: data.error ?? "Failed to update order status.",
        });
        return;
      }

      // Update in local state
      const updated = data.order;
      setOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );

      setFeedback({
        tone: "info",
        message:
          action === "verify"
            ? ao.verificationSuccessNotice(updated.orderNumber)
            : ao.rejectionSuccessNotice(updated.orderNumber),
      });

      setPendingAction(null);
      setRejectionReason("");
    } catch {
      setFeedback({
        tone: "error",
        message: "Network error occurred while updating order status.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container className="space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{ao.backToDashboard}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">
            {ao.signedInAsPrefix} <strong>{user.email}</strong>
          </span>
          <LogoutButton role="admin" />
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
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-semibold text-[var(--brand-lime)]">
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{ao.badge}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {ao.heading}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {ao.subtitle}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            isLoading={isRefreshing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? ao.processingAction : "Refresh"}</span>
          </Button>
        </div>
      </Card>

      {/* Feedback Banner */}
      {feedback ? (
        <StatusNotice tone={feedback.tone} title={feedback.message}>
          <p>{feedback.message}</p>
        </StatusNotice>
      ) : null}

      {/* Database Error Banner */}
      {hasLoadError ? (
        <StatusNotice tone="error" title={ao.dbErrorTitle}>
          <p>{ao.dbErrorDesc}</p>
        </StatusNotice>
      ) : null}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white p-4 shadow-xs">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {ao.totalOrdersLabel}
          </span>
          <p className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
            {orders.length}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-xs font-medium text-amber-800">
            {ao.pendingVerificationLabel}
          </span>
          <p className="mt-1 font-mono text-2xl font-bold text-amber-900">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-medium text-emerald-800">
            {ao.verifiedOrdersLabel}
          </span>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-900">
            {verifiedCount}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <span className="text-xs font-medium text-rose-800">
            {ao.rejectedOrdersLabel}
          </span>
          <p className="mt-1 font-mono text-2xl font-bold text-rose-900">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-3 text-sm">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "all"
              ? "bg-[var(--brand-primary)] text-white"
              : "border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          }`}
        >
          <span>{ao.filterAll}</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("pending_verification")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "pending_verification"
              ? "bg-amber-600 text-white"
              : "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
          }`}
        >
          <span>{ao.filterPending}</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("verified")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "verified"
              ? "bg-emerald-600 text-white"
              : "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
          }`}
        >
          <span>{ao.filterVerified}</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
            {verifiedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("rejected")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "rejected"
              ? "bg-rose-600 text-white"
              : "border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
          }`}
        >
          <span>{ao.filterRejected}</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
            {rejectedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("cancelled")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            activeFilter === "cancelled"
              ? "bg-slate-700 text-white"
              : "border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200"
          }`}
        >
          <span>{ao.filterCancelled}</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
            {cancelledCount}
          </span>
        </button>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <Card variant="default" padding="lg" className="space-y-3 bg-white text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)]">
            <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {ao.emptyTitle}
          </h2>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-[var(--text-muted)]">
            {ao.emptyDescription}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isPending = order.orderStatus === "pending_verification";

            return (
              <Card
                key={order.id}
                variant="default"
                padding="md"
                className="space-y-4 bg-white transition-shadow hover:shadow-md"
              >
                {/* Header row: Order Ref & Badges */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-[var(--brand-primary)]">
                        {order.orderNumber}
                      </span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        ({order.id})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {ao.orderDateLabel}: {formatDateForLanguage(order.createdAt, language)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.orderStatus} t={t} />
                    <PaymentStatusBadge status={order.paymentStatus} t={t} />
                  </div>
                </div>

                {/* Customer & Delivery Summary Grid */}
                <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                  <div className="space-y-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                    <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {ao.customerHeading}
                    </span>
                    <div className="space-y-1 text-[var(--text-primary)]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
                        <span>{order.deliveryDetails.customerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
                        <span>{order.deliveryDetails.mobile}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" aria-hidden="true" />
                        <span className="truncate">{order.customerEmail || "No email"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                    <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {ao.deliveryAddressHeading}
                    </span>
                    <div className="flex items-start gap-1.5 text-[var(--text-primary)]">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-secondary)]" aria-hidden="true" />
                      <div className="space-y-0.5 text-xs text-[var(--text-secondary)]">
                        <p className="font-medium text-[var(--text-primary)]">
                          {order.deliveryDetails.addressLine}
                        </p>
                        <p>
                          {order.deliveryDetails.villageOrCity}, {order.deliveryDetails.district}
                        </p>
                        <p>
                          {order.deliveryDetails.state} - {order.deliveryDetails.pinCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Snapshot */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <span>{ao.productsHeading}</span>
                    <span>{ao.itemsCountSummary(order.totalItems)}</span>
                  </div>

                  <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-xs">
                    {order.items.map((item) => (
                      <div
                        key={`${item.productId}-${item.packSize}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-1.5 first:pt-1 last:pb-1"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-[var(--text-primary)]">
                            {item.name}
                          </span>
                          <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">
                            {item.packSize}
                          </span>
                          <span className="text-[var(--text-secondary)]">
                            × {item.quantity}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                          {formatCurrencyForLanguage(item.lineSubtotal, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit notes if verified or rejected */}
                {order.orderStatus === "verified" && order.verifiedAt ? (
                  <div className="rounded-[var(--radius-sm)] border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs text-emerald-900">
                    <span className="font-semibold">{ao.verifiedByLabel}:</span>{" "}
                    <span className="font-mono">{order.verifiedByUid ?? "Admin"}</span>{" "}
                    <span className="text-emerald-700">
                      ({formatDateForLanguage(order.verifiedAt, language)})
                    </span>
                  </div>
                ) : null}

                {order.orderStatus === "rejected" && order.rejectedAt ? (
                  <div className="rounded-[var(--radius-sm)] border border-rose-200 bg-rose-50/50 p-2.5 text-xs text-rose-900">
                    <span className="font-semibold">{ao.rejectedByLabel}:</span>{" "}
                    <span className="font-mono">{order.rejectedByUid ?? "Admin"}</span>{" "}
                    <span className="text-rose-700">
                      ({formatDateForLanguage(order.rejectedAt, language)})
                    </span>
                    {order.rejectionReason ? (
                      <p className="mt-1">
                        <strong>{ao.rejectionReasonValueLabel}:</strong> {order.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Footer with Amount & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-3">
                  <div>
                    <span className="block text-xs text-[var(--text-muted)]">
                      {ao.totalAmountLabel}
                    </span>
                    <span className="font-mono text-lg font-bold text-[var(--brand-primary)]">
                      {formatCurrencyForLanguage(order.total, language)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      href={`/admin/orders/${order.id}`}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{ao.viewDetailsButton}</span>
                    </Button>

                    {isPending ? (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setPendingAction({ order, action: "verify" });
                            setRejectionReason("");
                          }}
                        >
                          <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{ao.verifyOrderButton}</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPendingAction({ order, action: "reject" });
                            setRejectionReason("");
                          }}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          <FileX className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{ao.rejectOrderButton}</span>
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ActionConfirmationModal
        pendingAction={pendingAction}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onCancel={() => {
          setPendingAction(null);
          setRejectionReason("");
        }}
        onConfirm={() => void handleExecuteAction()}
        isSubmitting={isSubmitting}
        t={t}
      />
    </Container>
  );
}

export function AdminOrderDetailView({
  user,
  order,
  hasLoadError,
}: {
  user: VerifiedSessionUser;
  order: OrderRecord | null;
  hasLoadError?: boolean;
}) {
  const { language, t } = useLanguagePreference();
  const ao = t.adminOrders;

  const [currentOrder, setCurrentOrder] = useState<OrderRecord | null>(order);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "info" | "error";
    message: string;
  } | null>(null);

  if (hasLoadError || !currentOrder) {
    return (
      <Container className="space-y-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{ao.backToOrdersList}</span>
        </Link>

        <Card variant="default" padding="lg" className="space-y-3 bg-white text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {ao.orderNotFoundTitle}
          </h2>
          <p className="mx-auto max-w-md text-xs text-[var(--text-secondary)]">
            {ao.orderNotFoundDesc}
          </p>
          <div className="pt-2">
            <Button href="/admin/orders" variant="outline" size="sm">
              <span>{ao.backToOrdersList}</span>
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  const isPending = currentOrder.orderStatus === "pending_verification";

  async function handleExecuteAction() {
    if (!pendingAction) return;

    setIsSubmitting(true);
    setFeedback(null);

    const { action } = pendingAction;

    try {
      const response = await fetch(`/api/admin/orders/${currentOrder!.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        order?: OrderRecord;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.order) {
        setFeedback({
          tone: "error",
          message: data.error ?? "Failed to update order status.",
        });
        return;
      }

      setCurrentOrder(data.order);
      setFeedback({
        tone: "info",
        message:
          action === "verify"
            ? ao.verificationSuccessNotice(data.order.orderNumber)
            : ao.rejectionSuccessNotice(data.order.orderNumber),
      });

      setPendingAction(null);
      setRejectionReason("");
    } catch {
      setFeedback({
        tone: "error",
        message: "Network error occurred while updating order status.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container className="space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{ao.backToOrdersList}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">
            {ao.signedInAsPrefix} <strong>{user.email}</strong>
          </span>
          <LogoutButton role="admin" />
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl font-bold text-[var(--brand-primary)] sm:text-2xl">
                {currentOrder.orderNumber}
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                ({currentOrder.id})
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              {ao.detailHeading}
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {ao.detailSubtitle}
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-[var(--text-muted)]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {ao.orderDateLabel}: {formatDateForLanguage(currentOrder.createdAt, language)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={currentOrder.orderStatus} t={t} />
            <PaymentStatusBadge status={currentOrder.paymentStatus} t={t} />
          </div>
        </div>

        {/* Action buttons on detail view if pending */}
        {isPending ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                setPendingAction({ order: currentOrder, action: "verify" });
                setRejectionReason("");
              }}
            >
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              <span>{ao.verifyOrderButton}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setPendingAction({ order: currentOrder, action: "reject" });
                setRejectionReason("");
              }}
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <FileX className="h-4 w-4" aria-hidden="true" />
              <span>{ao.rejectOrderButton}</span>
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Feedback Banner */}
      {feedback ? (
        <StatusNotice tone={feedback.tone} title={feedback.message}>
          <p>{feedback.message}</p>
        </StatusNotice>
      ) : null}

      {/* Two Column Grid: Customer and Delivery */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Customer Information Card */}
        <Card variant="default" padding="md" className="space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-sm font-bold text-[var(--text-primary)]">
            <User className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
            <h2>{ao.customerHeading}</h2>
          </div>

          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-[var(--text-muted)]">{ao.customerNameLabel}</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {currentOrder.deliveryDetails.customerName}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{ao.customerEmailLabel}</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {currentOrder.customerEmail || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{ao.customerMobileLabel}</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {currentOrder.deliveryDetails.mobile}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{ao.customerUidLabel}</dt>
              <dd className="font-mono text-[var(--text-muted)]">
                {currentOrder.customerUid}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Delivery Details Card */}
        <Card variant="default" padding="md" className="space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-sm font-bold text-[var(--text-primary)]">
            <MapPin className="h-4 w-4 text-[var(--brand-secondary)]" aria-hidden="true" />
            <h2>{ao.deliveryAddressHeading}</h2>
          </div>

          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-[var(--text-muted)]">{ao.addressLineLabel}</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {currentOrder.deliveryDetails.addressLine}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{ao.villageCityLabel}</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {currentOrder.deliveryDetails.villageOrCity}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{ao.districtStateLabel}</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {currentOrder.deliveryDetails.district}, {currentOrder.deliveryDetails.state}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">{ao.pinCodeLabel}</dt>
              <dd className="font-mono font-semibold text-[var(--text-primary)]">
                {currentOrder.deliveryDetails.pinCode}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Line Items Table Card */}
      <Card variant="default" padding="md" className="space-y-4 bg-white">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 text-sm font-bold text-[var(--text-primary)]">
          <h2>{ao.productsHeading}</h2>
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {ao.itemsCountSummary(currentOrder.totalItems)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <th className="p-2.5 font-semibold">{ao.productNameHeader}</th>
                <th className="p-2.5 font-semibold">{ao.packSizeHeader}</th>
                <th className="p-2.5 text-right font-semibold">{ao.unitPriceHeader}</th>
                <th className="p-2.5 text-center font-semibold">{ao.quantityHeader}</th>
                <th className="p-2.5 text-right font-semibold">{ao.lineTotalHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
              {currentOrder.items.map((item) => (
                <tr key={`${item.productId}-${item.packSize}`} className="hover:bg-[var(--bg-subtle)]/50">
                  <td className="p-2.5">
                    <span className="font-medium">{item.name}</span>
                    <span className="block font-mono text-[10px] text-[var(--text-muted)]">
                      {item.sku}
                    </span>
                  </td>
                  <td className="p-2.5">{item.packSize}</td>
                  <td className="p-2.5 text-right font-mono">
                    {formatCurrencyForLanguage(item.unitPrice, language)}
                  </td>
                  <td className="p-2.5 text-center font-mono font-semibold">
                    {item.quantity}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-[var(--brand-primary)]">
                    {formatCurrencyForLanguage(item.lineSubtotal, language)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)] font-bold text-[var(--text-primary)]">
                <td colSpan={3} className="p-2.5 text-right">
                  {ao.totalAmountLabel}:
                </td>
                <td className="p-2.5 text-center font-mono">
                  {currentOrder.totalItems}
                </td>
                <td className="p-2.5 text-right font-mono text-base text-[var(--brand-primary)]">
                  {formatCurrencyForLanguage(currentOrder.total, language)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Verification Audit Log Card (if verified or rejected) */}
      {currentOrder.orderStatus !== "pending_verification" ? (
        <Card variant="default" padding="md" className="space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 text-sm font-bold text-[var(--text-primary)]">
            <ClipboardCheck className="h-4 w-4 text-[var(--brand-primary)]" aria-hidden="true" />
            <h2>{ao.auditVerificationHeading}</h2>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            {currentOrder.orderStatus === "verified" ? (
              <>
                <div>
                  <dt className="text-[var(--text-muted)]">{ao.verifiedByLabel}</dt>
                  <dd className="font-mono font-semibold text-[var(--text-primary)]">
                    {currentOrder.verifiedByUid ?? "Admin"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">{ao.verifiedAtLabel}</dt>
                  <dd className="font-semibold text-[var(--text-primary)]">
                    {currentOrder.verifiedAt
                      ? formatDateForLanguage(currentOrder.verifiedAt, language)
                      : "Not recorded"}
                  </dd>
                </div>
              </>
            ) : null}

            {currentOrder.orderStatus === "rejected" ? (
              <>
                <div>
                  <dt className="text-[var(--text-muted)]">{ao.rejectedByLabel}</dt>
                  <dd className="font-mono font-semibold text-[var(--text-primary)]">
                    {currentOrder.rejectedByUid ?? "Admin"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">{ao.rejectedAtLabel}</dt>
                  <dd className="font-semibold text-[var(--text-primary)]">
                    {currentOrder.rejectedAt
                      ? formatDateForLanguage(currentOrder.rejectedAt, language)
                      : "Not recorded"}
                  </dd>
                </div>
                {currentOrder.rejectionReason ? (
                  <div className="sm:col-span-2">
                    <dt className="text-[var(--text-muted)]">{ao.rejectionReasonValueLabel}</dt>
                    <dd className="font-medium text-rose-800">
                      {currentOrder.rejectionReason}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : null}
          </dl>
        </Card>
      ) : null}

      {/* Confirmation Modal */}
      <ActionConfirmationModal
        pendingAction={pendingAction}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onCancel={() => {
          setPendingAction(null);
          setRejectionReason("");
        }}
        onConfirm={() => void handleExecuteAction()}
        isSubmitting={isSubmitting}
        t={t}
      />
    </Container>
  );
}

export function AdminOrdersFallbackView() {
  return (
    <Container>
      <Card variant="default" padding="lg" className="space-y-3 bg-white text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
          <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Loading customer orders…
        </p>
      </Card>
    </Container>
  );
}
