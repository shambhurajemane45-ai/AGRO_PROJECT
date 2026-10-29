"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Save,
  Trash2,
} from "lucide-react";
import type {
  ProductFormInput,
  ProductRecord,
  ProductStatus,
  ProductValidationErrors,
} from "@/types";
import { validateProductPayload } from "@/lib/validation";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";

interface AdminProductFormProps {
  mode: "create" | "edit";
  initialProduct?: ProductRecord;
}

const textareaClasses =
  "w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

const selectClasses =
  "w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-primary)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

export function AdminProductForm({
  mode,
  initialProduct,
}: AdminProductFormProps) {
  const router = useRouter();
  const { language, t } = useLanguagePreference();
  const pf = t.adminProductForm;
  const ap = t.adminProducts;

  const [formState, setFormState] = useState<ProductFormInput>({
    sku: initialProduct?.sku ?? "",
    name: initialProduct?.name ?? "",
    category: initialProduct?.category ?? "",
    shortDescription: initialProduct?.shortDescription ?? "",
    composition: initialProduct?.composition ?? "",
    targetCropsInput: initialProduct?.targetCrops.join(", ") ?? "",
    dosageAndApplication: initialProduct?.dosageAndApplication ?? "",
    packSizesInput: initialProduct?.packSizes.join(", ") ?? "",
    unitPriceInput:
      initialProduct?.unitPrice !== null &&
      initialProduct?.unitPrice !== undefined
        ? String(initialProduct.unitPrice)
        : "",
    safetyAndStorage: initialProduct?.safetyAndStorage ?? "",
    registrationNumber: initialProduct?.registrationNumber ?? "",
    status: initialProduct?.status ?? "active",
  });

  const [errors, setErrors] = useState<ProductValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function clearFieldError(field: keyof ProductValidationErrors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) {
      setServerError(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const validation = validateProductPayload(
      {
        sku: formState.sku,
        name: formState.name,
        category: formState.category,
        shortDescription: formState.shortDescription,
        composition: formState.composition,
        targetCropsInput: formState.targetCropsInput,
        dosageAndApplication: formState.dosageAndApplication,
        packSizesInput: formState.packSizesInput,
        unitPriceInput: formState.unitPriceInput,
        safetyAndStorage: formState.safetyAndStorage,
        registrationNumber: formState.registrationNumber,
        status: formState.status,
      },
      language
    );

    if (!validation.isValid || !validation.data) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initialProduct?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: ProductValidationErrors;
        product?: ProductRecord;
      };

      if (!response.ok || !payload.ok) {
        if (payload.fieldErrors) {
          setErrors(payload.fieldErrors);
        }
        setServerError(payload.error ?? pf.saveFailedFallback);
        setIsSubmitting(false);
        return;
      }

      if (mode === "create" && payload.product) {
        router.push(`/admin/products/${payload.product.id}?saved=created`);
        router.refresh();
        return;
      }

      setSuccessMessage(pf.productSavedMessage);
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setServerError(pf.networkSaveError);
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialProduct) return;
    setServerError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/products/${initialProduct.id}`,
        {
          method: "DELETE",
        }
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setServerError(payload.error ?? pf.deleteFailedFallback);
        setIsDeleting(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setServerError(pf.networkDeleteError);
      setIsDeleting(false);
    }
  }

  return (
    <Card
      variant="elevated"
      padding="lg"
      className="space-y-6 border-t-4 border-t-[var(--brand-primary)] bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {mode === "create" ? pf.createHeading : pf.editHeading}
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            {pf.subtitle}
          </p>
        </div>

        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{pf.backToListLink}</span>
        </Link>
      </div>

      {serverError ? (
        <StatusNotice tone="error" title={pf.saveFailedTitle}>
          <p>{serverError}</p>
        </StatusNotice>
      ) : null}

      {successMessage ? (
        <StatusNotice tone="info" title={pf.productSavedTitle}>
          <p className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[var(--brand-secondary)]" />
            <span>{successMessage}</span>
          </p>
        </StatusNotice>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Identity, Category & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            id="product-sku"
            label={pf.skuLabel}
            required
            error={errors.sku}
            hint={pf.skuHint}
          >
            <Input
              id="product-sku"
              name="sku"
              type="text"
              placeholder={pf.skuPlaceholder}
              value={formState.sku}
              hasError={Boolean(errors.sku)}
              onChange={(e) => {
                setFormState((prev) => ({ ...prev, sku: e.target.value }));
                clearFieldError("sku");
              }}
            />
          </FormField>

          <div className="sm:col-span-1 lg:col-span-2">
            <FormField
              id="product-name"
              label={pf.nameLabel}
              required
              error={errors.name}
            >
              <Input
                id="product-name"
                name="name"
                type="text"
                placeholder={pf.namePlaceholder}
                value={formState.name}
                hasError={Boolean(errors.name)}
                onChange={(e) => {
                  setFormState((prev) => ({ ...prev, name: e.target.value }));
                  clearFieldError("name");
                }}
              />
            </FormField>
          </div>

          <FormField
            id="product-status"
            label={pf.statusLabel}
            required
            error={errors.status}
            hint={pf.statusHint}
          >
            <select
              id="product-status"
              name="status"
              value={formState.status}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  status: e.target.value as ProductStatus,
                }));
                clearFieldError("status");
              }}
              className={selectClasses}
            >
              <option value="active">{ap.statusActiveVisible}</option>
              <option value="draft">{ap.statusDraftInternal}</option>
              <option value="archived">{ap.statusArchivedHidden}</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            id="product-category"
            label={pf.categoryLabel}
            required
            error={errors.category}
            hint={pf.categoryHint}
          >
            <Input
              id="product-category"
              name="category"
              type="text"
              placeholder={pf.categoryPlaceholder}
              value={formState.category}
              hasError={Boolean(errors.category)}
              onChange={(e) => {
                setFormState((prev) => ({ ...prev, category: e.target.value }));
                clearFieldError("category");
              }}
            />
          </FormField>

          <FormField
            id="product-price"
            label={pf.unitPriceLabel}
            error={errors.unitPrice}
            hint={pf.unitPriceHint}
          >
            <Input
              id="product-price"
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder={pf.unitPricePlaceholder}
              value={formState.unitPriceInput}
              hasError={Boolean(errors.unitPrice)}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  unitPriceInput: e.target.value,
                }));
                clearFieldError("unitPrice");
              }}
            />
          </FormField>

          <FormField
            id="product-registration"
            label={pf.registrationLabel}
            error={errors.registrationNumber}
            hint={pf.registrationHint}
          >
            <Input
              id="product-registration"
              name="registrationNumber"
              type="text"
              placeholder={pf.registrationPlaceholder}
              value={formState.registrationNumber}
              hasError={Boolean(errors.registrationNumber)}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  registrationNumber: e.target.value,
                }));
                clearFieldError("registrationNumber");
              }}
            />
          </FormField>
        </div>

        {/* Short Description */}
        <FormField
          id="product-short-desc"
          label={pf.shortDescLabel}
          required
          error={errors.shortDescription}
          hint={pf.shortDescHint}
        >
          <textarea
            id="product-short-desc"
            name="shortDescription"
            rows={2}
            placeholder={pf.shortDescPlaceholder}
            value={formState.shortDescription}
            onChange={(e) => {
              setFormState((prev) => ({
                ...prev,
                shortDescription: e.target.value,
              }));
              clearFieldError("shortDescription");
            }}
            className={textareaClasses}
          />
        </FormField>

        {/* Active Composition & Technical Specifications */}
        <FormField
          id="product-composition"
          label={pf.compositionLabel}
          required
          error={errors.composition}
          hint={pf.compositionHint}
        >
          <textarea
            id="product-composition"
            name="composition"
            rows={3}
            placeholder={pf.compositionPlaceholder}
            value={formState.composition}
            onChange={(e) => {
              setFormState((prev) => ({
                ...prev,
                composition: e.target.value,
              }));
              clearFieldError("composition");
            }}
            className={textareaClasses}
          />
        </FormField>

        {/* Crops & Pack Sizes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="product-crops"
            label={pf.targetCropsLabel}
            required
            error={errors.targetCrops}
            hint={pf.targetCropsHint}
          >
            <Input
              id="product-crops"
              name="targetCrops"
              type="text"
              placeholder={pf.targetCropsPlaceholder}
              value={formState.targetCropsInput}
              hasError={Boolean(errors.targetCrops)}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  targetCropsInput: e.target.value,
                }));
                clearFieldError("targetCrops");
              }}
            />
          </FormField>

          <FormField
            id="product-pack-sizes"
            label={pf.packSizesLabel}
            required
            error={errors.packSizes}
            hint={pf.packSizesHint}
          >
            <Input
              id="product-pack-sizes"
              name="packSizes"
              type="text"
              placeholder={pf.packSizesPlaceholder}
              value={formState.packSizesInput}
              hasError={Boolean(errors.packSizes)}
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  packSizesInput: e.target.value,
                }));
                clearFieldError("packSizes");
              }}
            />
          </FormField>
        </div>

        {/* Dosage & Application */}
        <FormField
          id="product-dosage"
          label={pf.dosageLabel}
          required
          error={errors.dosageAndApplication}
          hint={pf.dosageHint}
        >
          <textarea
            id="product-dosage"
            name="dosageAndApplication"
            rows={3}
            placeholder={pf.dosagePlaceholder}
            value={formState.dosageAndApplication}
            onChange={(e) => {
              setFormState((prev) => ({
                ...prev,
                dosageAndApplication: e.target.value,
              }));
              clearFieldError("dosageAndApplication");
            }}
            className={textareaClasses}
          />
        </FormField>

        {/* Safety & Storage */}
        <FormField
          id="product-safety"
          label={pf.safetyLabel}
          error={errors.safetyAndStorage}
          hint={pf.safetyHint}
        >
          <textarea
            id="product-safety"
            name="safetyAndStorage"
            rows={2}
            placeholder={pf.safetyPlaceholder}
            value={formState.safetyAndStorage}
            onChange={(e) => {
              setFormState((prev) => ({
                ...prev,
                safetyAndStorage: e.target.value,
              }));
              clearFieldError("safetyAndStorage");
            }}
            className={textareaClasses}
          />
        </FormField>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
            >
              {mode === "create" ? (
                <>
                  <PackagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>{pf.createSubmitButton}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>{pf.editSubmitButton}</span>
                </>
              )}
            </Button>

            <Button href="/admin/products" variant="secondary" size="lg">
              <span>{t.common.cancel}</span>
            </Button>
          </div>

          {mode === "edit" && initialProduct ? (
            <div className="flex items-center gap-2">
              {!confirmDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>{pf.deleteProductButton}</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-3 py-1.5">
                  <span className="text-xs font-semibold text-[var(--status-error)]">
                    {pf.confirmDeletePrompt}
                  </span>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={isDeleting}
                    onClick={handleDelete}
                    className="bg-[var(--status-error)] hover:bg-[var(--status-error)]/90"
                  >
                    <span>{pf.confirmDeleteYes}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    <span>{pf.confirmDeleteNo}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
