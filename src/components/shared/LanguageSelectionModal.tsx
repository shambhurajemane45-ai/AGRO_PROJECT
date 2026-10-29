"use client";

import { useEffect, useId } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { PortalRole, SupportedLanguage } from "@/types";
import {
  getTranslations,
  SUPPORTED_LANGUAGE_OPTIONS,
} from "@/lib/language";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface LanguageSelectionModalProps {
  isOpen: boolean;
  role: PortalRole;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (language: SupportedLanguage) => void;
  onConfirm: (language: SupportedLanguage) => void;
  onClose: () => void;
}

export function LanguageSelectionModal({
  isOpen,
  role,
  selectedLanguage,
  onSelectLanguage,
  onConfirm,
  onClose,
}: LanguageSelectionModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isAdmin = role === "admin";
  const t = getTranslations(selectedLanguage);
  const copy = t.auth;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18251D]/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Card
        variant="elevated"
        padding="lg"
        className={`w-full max-w-lg space-y-6 bg-white ${
          isAdmin
            ? "border-t-4 border-t-[var(--brand-primary)]"
            : "border-t-4 border-t-[var(--brand-secondary)]"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isAdmin
                    ? "bg-[var(--brand-primary)] text-[var(--brand-lime)]"
                    : "bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]"
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>
                  {isAdmin
                    ? t.languageModal.adminPortalBadge
                    : t.languageModal.customerPortalBadge}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.languageModal.badgeLabel}</span>
              </span>
            </div>

            <h2
              id={titleId}
              className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl"
            >
              {isAdmin ? copy.modalTitleAdmin : copy.modalTitleCustomer}
            </h2>
            <p
              id={descriptionId}
              className="text-sm leading-relaxed text-[var(--text-secondary)]"
            >
              {isAdmin ? copy.modalSubtitleAdmin : copy.modalSubtitleCustomer}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.languageModal.closeDialogAria}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Language Options (English, Marathi, Hindi) */}
        <div
          role="radiogroup"
          aria-label={t.languageModal.radioGroupAria}
          className="grid grid-cols-1 gap-3"
        >
          {SUPPORTED_LANGUAGE_OPTIONS.map((option) => {
            const isSelected = selectedLanguage === option.code;

            return (
              <button
                key={option.code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectLanguage(option.code)}
                className={`flex w-full items-center justify-between gap-4 rounded-[var(--radius-md)] border p-4 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-2 border-[var(--brand-primary)] bg-[var(--brand-lime-subtle)]/55 shadow-xs"
                    : "border-[var(--border-strong)] bg-white hover:border-[var(--brand-secondary)] hover:bg-[var(--bg-subtle)]/60"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold text-[var(--text-primary)]">
                      {option.nativeName}
                    </span>
                    {option.nativeName !== option.englishName ? (
                      <span className="rounded bg-[var(--bg-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                        {option.englishName}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {option.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-lime)]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.common.selected}</span>
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border-2 border-[var(--border-strong)] bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            <span>{copy.cancelButton}</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onConfirm(selectedLanguage)}
          >
            <span>
              {isAdmin ? copy.continueAdminButton : copy.continueCustomerButton}
            </span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
