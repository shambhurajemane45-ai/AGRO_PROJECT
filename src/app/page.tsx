"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PortalEntryButton } from "@/components/shared/PortalEntryButton";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";

export default function LandingPage() {
  const { t } = useLanguagePreference();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* STEP A: Premium Agricultural Hero + Primary Portal Selection */}
        <section className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--brand-primary)] via-[#194732] to-[#1D4E37] py-12 text-white sm:py-16 lg:py-20">
          {/* Subtle decorative botanical SVG background pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            aria-hidden="true"
          >
            <svg
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1200 600"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern
                  id="agri-grid"
                  width="60"
                  height="60"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="none"
                    stroke="#B9E769"
                    strokeWidth="0.75"
                  />
                </pattern>
              </defs>
              <rect width="1200" height="600" fill="url(#agri-grid)" />
              <circle cx="1020" cy="140" r="220" fill="#B9E769" opacity="0.2" />
              <circle cx="180" cy="480" r="260" fill="#2F7D4A" opacity="0.35" />
            </svg>
          </div>

          <Container className="relative z-10 space-y-10">
            {/* Hero Headline & Visual Illustration Banner */}
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-[var(--brand-lime)]">
                  <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {t.company.companyName} • {t.company.logoPlaceholderLabel}
                  </span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.12]">
                  {t.company.heroHeadline}
                </h1>

                <p className="max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                  {t.company.tagline} {t.landing.selectPortalPrompt}
                </p>
              </div>

              {/* Polished Agricultural Field & Leaf Illustration Panel */}
              <div className="hidden lg:col-span-5 lg:block">
                <div className="rounded-[var(--radius-xl)] border border-white/15 bg-white/5 p-5 backdrop-blur-xs">
                  <svg
                    viewBox="0 0 420 180"
                    className="h-40 w-full rounded-[var(--radius-md)]"
                    role="img"
                    aria-label={t.landing.illustrationAriaLabel}
                  >
                    <defs>
                      <linearGradient
                        id="skyGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#1E523A" />
                        <stop offset="100%" stopColor="#2F7D4A" />
                      </linearGradient>
                      <linearGradient
                        id="hillGrad1"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#3B8F57" />
                        <stop offset="100%" stopColor="#1B4730" />
                      </linearGradient>
                      <linearGradient
                        id="hillGrad2"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#296B42" />
                        <stop offset="100%" stopColor="#B9E769" stopOpacity="0.45" />
                      </linearGradient>
                    </defs>
                    <rect width="420" height="180" rx="10" fill="url(#skyGrad)" />
                    {/* Sun */}
                    <circle cx="340" cy="48" r="22" fill="#B9E769" opacity="0.85" />
                    <circle cx="340" cy="48" r="32" fill="#B9E769" opacity="0.2" />
                    {/* Rolling agricultural hills */}
                    <path
                      d="M0 125 Q110 85 240 120 T420 105 L420 180 L0 180 Z"
                      fill="url(#hillGrad1)"
                    />
                    <path
                      d="M0 145 Q150 110 300 140 T420 130 L420 180 L0 180 Z"
                      fill="url(#hillGrad2)"
                    />
                    {/* Crop rows */}
                    <path
                      d="M40 180 Q130 135 210 125"
                      stroke="#B9E769"
                      strokeWidth="1.5"
                      fill="none"
                      opacity="0.5"
                    />
                    <path
                      d="M110 180 Q180 140 250 128"
                      stroke="#B9E769"
                      strokeWidth="1.5"
                      fill="none"
                      opacity="0.5"
                    />
                    <path
                      d="M190 180 Q245 145 300 132"
                      stroke="#B9E769"
                      strokeWidth="1.5"
                      fill="none"
                      opacity="0.5"
                    />
                    {/* Stylized sprout emblem */}
                    <g transform="translate(56, 36)">
                      <rect
                        width="44"
                        height="44"
                        rx="10"
                        fill="#153D2B"
                        stroke="#B9E769"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M22 33 V19 M22 23 C15 23 13 16 13 13 C18 13 22 16 22 23 Z M22 20 C29 20 31 13 31 10 C26 10 22 13 22 20 Z"
                        stroke="#B9E769"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </g>
                    <text
                      x="114"
                      y="55"
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="sans-serif"
                    >
                      {t.landing.illustrationTitle}
                    </text>
                    <text
                      x="114"
                      y="73"
                      fill="#DFECE3"
                      fontSize="10.5"
                      fontFamily="sans-serif"
                    >
                      {t.landing.illustrationSubtitle}
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Two Prominent Portal Selection Cards Above the Fold */}
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wider text-[var(--brand-lime)] uppercase">
                {t.landing.choosePortalHeading}
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* 1. Customer Portal Selection Card */}
                <Card
                  variant="elevated"
                  padding="lg"
                  className="flex flex-col justify-between border-2 border-[var(--brand-lime)]/60 bg-white text-[var(--text-primary)] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]">
                        <Users className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <span className="rounded-full bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-secondary)]">
                        {t.landing.customerCardBadge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                        {t.landing.customerCardTitle}
                      </h2>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {t.landing.customerCardDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-2">
                    <PortalEntryButton
                      role="customer"
                      variant="primary"
                      size="lg"
                      fullWidth
                      ariaLabel={t.landing.customerCardButtonAria}
                    >
                      <span>{t.landing.customerCardButton}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </PortalEntryButton>
                  </div>
                </Card>

                {/* 2. Admin Portal Selection Card */}
                <Card
                  variant="elevated"
                  padding="lg"
                  className="flex flex-col justify-between border border-[var(--border-strong)] bg-white text-[var(--text-primary)] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[var(--brand-lime)]">
                        <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <span className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
                        {t.landing.adminCardBadge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                        {t.landing.adminCardTitle}
                      </h2>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {t.landing.adminCardDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-2">
                    <PortalEntryButton
                      role="admin"
                      variant="outline"
                      size="lg"
                      fullWidth
                      ariaLabel={t.landing.adminCardButtonAria}
                    >
                      <span>{t.landing.adminCardButton}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </PortalEntryButton>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* Concise Trust & Platform Highlights Section */}
        <section className="py-12 sm:py-16">
          <Container className="space-y-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold tracking-wider text-[var(--brand-secondary)] uppercase">
                  {t.landing.foundationEyebrow}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {t.landing.foundationHeading}
                </h2>
              </div>
              <p className="max-w-md text-xs text-[var(--text-muted)]">
                {t.landing.foundationDisclaimer}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {t.landing.trustPillars.map((pillar, index) => {
                const Icon =
                  index === 0
                    ? FileCheck2
                    : index === 1
                      ? CheckCircle2
                      : Building2;
                return (
                  <Card
                    key={pillar.id}
                    variant="default"
                    padding="md"
                    className="space-y-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--brand-primary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {pillar.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
