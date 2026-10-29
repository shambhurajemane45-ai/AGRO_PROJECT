"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const { t } = useLanguagePreference();

  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)]">
      <Container className="py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand & Placeholder Transparency */}
          <div className="space-y-3 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-primary)] text-[var(--brand-lime)]"
                aria-hidden="true"
              >
                <Sprout className="h-4 w-4" />
              </div>
              <span className="font-bold text-[var(--text-primary)]">
                {t.company.companyName}
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[var(--text-secondary)]">
              {t.company.tagline}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t.company.noticeBanner}
            </p>
          </div>

          {/* Primary User Journey Links */}
          <div className="space-y-3 md:col-span-3">
            <h2 className="text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">
              {t.footer.portalNavigationHeading}
            </h2>
            <ul className="space-y-2 text-xs">
              {t.navigation.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)] hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Corporate Placeholders */}
          <div className="space-y-3 md:col-span-4">
            <h2 className="text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">
              {t.footer.companyInfoHeading}
            </h2>
            <dl className="space-y-2 text-xs text-[var(--text-muted)]">
              <div>
                <dt className="font-medium text-[var(--text-secondary)]">
                  {t.footer.facilityAddressLabel}
                </dt>
                <dd>{t.company.addressPlaceholder}</dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--text-secondary)]">
                  {t.footer.officialContactLabel}
                </dt>
                <dd>{t.company.contactEmailPlaceholder}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center">
          <p>
            &copy; 2026 {t.company.companyName}. {t.footer.copyrightSuffix}
          </p>
          <p className="font-mono text-[11px]">
            {t.company.registrationPlaceholder}
          </p>
        </div>
      </Container>
    </footer>
  );
}
