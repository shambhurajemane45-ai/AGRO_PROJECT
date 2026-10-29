"use client";

import Link from "next/link";
import { Globe, ShieldCheck, Sprout, Users } from "lucide-react";
import { SUPPORTED_LANGUAGE_OPTIONS } from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Container } from "@/components/ui/Container";
import { PortalEntryButton } from "@/components/shared/PortalEntryButton";

export function Header() {
  const { language, setLanguage, t } = useLanguagePreference();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md">
      <Container>
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          {/* Brand & Logo Placeholder */}
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 rounded-[var(--radius-sm)] py-1 text-left sm:gap-3"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--brand-secondary)]/30 bg-[var(--brand-primary)] text-[var(--brand-lime)] shadow-xs transition-transform duration-150 group-hover:scale-[1.02] sm:h-10 sm:w-10"
              aria-hidden="true"
            >
              <Sprout className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-bold tracking-tight text-[var(--text-primary)] sm:text-base">
                  {t.company.companyName}
                </span>
                <span className="hidden rounded-full border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase lg:inline-block">
                  {t.company.logoPlaceholderLabel}
                </span>
              </div>
              <span className="block truncate text-xs text-[var(--text-muted)]">
                {t.navigation.headerSubtitle}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label={t.navigation.primaryAriaLabel}
            className="hidden items-center gap-6 md:flex"
          >
            {t.navigation.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Global Language Switcher & Quick Portal Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-2.5">
            <div
              role="group"
              aria-label={t.navigation.languageSwitcherAriaLabel}
              className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-1"
            >
              <Globe
                className="ml-1 hidden h-3.5 w-3.5 text-[var(--brand-primary)] sm:inline"
                aria-hidden="true"
              />
              {SUPPORTED_LANGUAGE_OPTIONS.map((option) => {
                const isActive = option.code === language;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setLanguage(option.code)}
                    aria-pressed={isActive}
                    className={`rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-[var(--brand-primary)] text-[var(--brand-lime)] shadow-2xs"
                        : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {option.nativeName}
                  </button>
                );
              })}
            </div>

            <PortalEntryButton
              role="customer"
              variant="secondary"
              size="sm"
              ariaLabel={t.navigation.customerPortalAriaLabel}
            >
              <Users
                className="h-4 w-4 text-[var(--brand-secondary)]"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {t.navigation.customerPortalButton}
              </span>
              <span className="sm:hidden">
                {t.navigation.customerPortalShort}
              </span>
            </PortalEntryButton>
            <PortalEntryButton
              role="admin"
              variant="outline"
              size="sm"
              ariaLabel={t.navigation.adminPortalAriaLabel}
            >
              <ShieldCheck
                className="h-4 w-4 text-[var(--brand-primary)]"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {t.navigation.adminPortalButton}
              </span>
              <span className="sm:hidden">{t.navigation.adminPortalShort}</span>
            </PortalEntryButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
