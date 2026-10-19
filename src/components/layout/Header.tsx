import Link from "next/link";
import { Sprout, ShieldCheck, UserCheck } from "lucide-react";
import { companyPlaceholderConfig, mainNavigation } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xs">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] py-1.5 text-xs text-[var(--text-secondary)]">
        <Container className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-[var(--text-primary)]">
            {companyPlaceholderConfig.noticeBanner}
          </span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            Phase 1: UI &amp; Architecture Foundation
          </span>
        </Container>
      </div>

      <Container>
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-[var(--radius-sm)] py-1 text-left"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--brand-primary)] text-white"
              aria-hidden="true"
            >
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold tracking-tight text-[var(--text-primary)] sm:text-base">
                {companyPlaceholderConfig.companyName}
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                Agriculture Product Manufacturing Platform
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-6 md:flex"
          >
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              href="/customer/login"
              variant="outline"
              size="sm"
              ariaLabel="Navigate to Customer Login Portal"
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              <span>Customer Login</span>
            </Button>
            <Button
              href="/admin/login"
              variant="primary"
              size="sm"
              ariaLabel="Navigate to Admin Login Portal"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Admin Login</span>
            </Button>
          </div>
        </div>

        {/* Mobile Secondary Navigation */}
        <nav
          aria-label="Mobile section navigation"
          className="flex items-center gap-4 overflow-x-auto border-t border-[var(--border-subtle)] py-2.5 text-xs font-medium text-[var(--text-secondary)] md:hidden"
        >
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 hover:bg-[var(--bg-subtle)] hover:text-[var(--brand-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
