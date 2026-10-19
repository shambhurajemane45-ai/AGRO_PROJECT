import Link from "next/link";
import { Sprout } from "lucide-react";
import { companyPlaceholderConfig, mainNavigation } from "@/config/site";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)]">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="space-y-3 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-primary)] text-white"
                aria-hidden="true"
              >
                <Sprout className="h-4 w-4" />
              </div>
              <span className="font-semibold text-[var(--text-primary)]">
                {companyPlaceholderConfig.companyName}
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-[var(--text-secondary)]">
              {companyPlaceholderConfig.tagline}
            </p>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs text-[var(--text-muted)]">
              <p className="font-medium text-[var(--text-primary)]">
                Data Integrity Notice
              </p>
              <p className="mt-1">
                Company registration numbers, facility addresses, product
                catalogues, and certifications are strictly maintained as
                labelled placeholders until verified company documents are
                loaded.
              </p>
            </div>
          </div>

          <div className="space-y-3 md:col-span-3">
            <h2 className="text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">
              Platform Sections
            </h2>
            <ul className="space-y-2 text-xs">
              {mainNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-[var(--brand-primary)] hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 md:col-span-4">
            <h2 className="text-xs font-semibold tracking-wider text-[var(--text-primary)] uppercase">
              Portal Access &amp; Placeholders
            </h2>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/customer/login"
                  className="font-medium text-[var(--brand-primary)] hover:underline"
                >
                  Customer Portal Login (Phase 1 UI)
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="font-medium text-[var(--brand-primary)] hover:underline"
                >
                  Admin Portal Login (Phase 1 UI)
                </Link>
              </li>
              <li className="pt-2 text-[var(--text-muted)]">
                <span className="block font-medium text-[var(--text-secondary)]">
                  Registered Address Placeholder:
                </span>
                {companyPlaceholderConfig.addressPlaceholder}
              </li>
              <li className="text-[var(--text-muted)]">
                <span className="block font-medium text-[var(--text-secondary)]">
                  Official Contact Placeholder:
                </span>
                {companyPlaceholderConfig.contactEmailPlaceholder}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center">
          <p>
            &copy; 2026 {companyPlaceholderConfig.companyName}. All rights
            reserved.
          </p>
          <p className="font-mono text-[11px]">
            {companyPlaceholderConfig.registrationPlaceholder}
          </p>
        </div>
      </Container>
    </footer>
  );
}
