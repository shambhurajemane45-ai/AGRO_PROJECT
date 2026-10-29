"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type {
  AuthSessionResponsePayload,
  LoginFormErrors,
  LoginFormState,
  PortalRole,
} from "@/types";
import { validateLoginForm } from "@/lib/validation";
import {
  getFirebaseClientAuth,
  isFirebaseClientConfigured,
  mapFirebaseAuthError,
} from "@/lib/firebase/client";
import { getDashboardPathForRole } from "@/lib/auth/constants";
import { SUPPORTED_LANGUAGE_OPTIONS } from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";

interface PortalLoginFormProps {
  role: PortalRole;
  portalTitle?: string;
  portalSubtitle?: string;
  badgeText?: string;
  emailPlaceholder?: string;
  securityNote?: string;
  backHref: string;
  backLabel?: string;
}

function RedirectReasonBanner({ isAdmin }: { isAdmin: boolean }) {
  const searchParams = useSearchParams();
  const { t } = useLanguagePreference();
  const reason = searchParams.get("reason");

  if (reason === "auth_required") {
    return (
      <StatusNotice tone="warning" title={t.auth.authRequiredTitle}>
        <p>
          {isAdmin
            ? t.auth.authRequiredAdminDesc
            : t.auth.authRequiredCustomerDesc}
        </p>
      </StatusNotice>
    );
  }

  if (reason === "forbidden_role") {
    return (
      <StatusNotice tone="warning" title={t.auth.forbiddenRoleTitle}>
        <p>
          {isAdmin
            ? t.auth.forbiddenRoleAdminDesc
            : t.auth.forbiddenRoleCustomerDesc}
        </p>
      </StatusNotice>
    );
  }

  return null;
}

export function PortalLoginForm({
  role,
  emailPlaceholder,
  backHref,
}: PortalLoginFormProps) {
  const router = useRouter();
  const { language, languageOption, setLanguage, t } = useLanguagePreference();
  const copy = t.auth;
  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAdmin = role === "admin";
  const emailInputId = `${role}-login-email`;
  const passwordInputId = `${role}-login-password`;

  const localizedBadgeText = isAdmin
    ? copy.adminBadgeText
    : copy.customerBadgeText;
  const localizedPortalTitle = isAdmin
    ? copy.adminLoginTitle
    : copy.customerLoginTitle;
  const localizedPortalSubtitle = isAdmin
    ? copy.adminLoginSubtitle
    : copy.customerLoginSubtitle;
  const localizedBackLabel = isAdmin
    ? copy.backToAdminPortal
    : copy.backToCustomerPortal;
  const localizedSecurityNote = isAdmin
    ? copy.adminSecurityNote
    : copy.customerSecurityNote;
  const resolvedEmailPlaceholder =
    emailPlaceholder ??
    (isAdmin
      ? "admin@company-domain.placeholder"
      : "customer@example.com");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    const validation = validateLoginForm(formState, language);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    if (!isFirebaseClientConfigured()) {
      setAuthError(copy.firebaseUnconfiguredSignInError);
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getFirebaseClientAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formState.email.trim(),
        formState.password
      );

      const idToken = await userCredential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          portal: role,
        }),
      });

      const payload = (await response.json()) as AuthSessionResponsePayload;

      if (!response.ok || !payload.authenticated) {
        await signOut(auth).catch(() => undefined);
        setAuthError(
          payload.error ?? copy.serverRoleVerificationFailed
        );
        setIsSubmitting(false);
        return;
      }

      const destination = payload.redirectTo ?? getDashboardPathForRole(role);
      router.push(destination);
      router.refresh();
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error, language));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Clear Back Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{localizedBackLabel}</span>
        </Link>

        <Link
          href="/"
          className="text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--brand-primary)] hover:underline"
        >
          {copy.homeLink}
        </Link>
      </div>

      {/* Persisted Language Preference Indicator & Quick Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Globe
            className="h-4 w-4 text-[var(--brand-primary)]"
            aria-hidden="true"
          />
          <span>
            {copy.selectedLanguageBadgeLabel}:{" "}
            <strong className="font-semibold text-[var(--text-primary)]">
              {languageOption.nativeName}
              {languageOption.nativeName !== languageOption.englishName
                ? ` (${languageOption.englishName})`
                : ""}
            </strong>
          </span>
        </div>

        <div
          role="group"
          aria-label={copy.changeLanguageButtonLabel}
          className="inline-flex items-center gap-1"
        >
          {SUPPORTED_LANGUAGE_OPTIONS.map((opt) => {
            const active = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                aria-pressed={active}
                className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[var(--brand-primary)] text-[var(--brand-lime)]"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {opt.nativeName}
              </button>
            );
          })}
        </div>
      </div>

      <Card
        variant="elevated"
        padding="lg"
        className={`space-y-6 bg-white ${
          isAdmin
            ? "border-t-4 border-t-[var(--brand-primary)]"
            : "border-t-4 border-t-[var(--brand-secondary)]"
        }`}
      >
        <div className="space-y-3 border-b border-[var(--border-subtle)] pb-5">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              isAdmin
                ? "bg-[var(--brand-primary)] text-[var(--brand-lime)]"
                : "bg-[var(--brand-lime-subtle)] text-[var(--brand-primary)]"
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{localizedBadgeText}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {localizedPortalTitle}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {localizedPortalSubtitle}
          </p>
        </div>

        <Suspense fallback={null}>
          <RedirectReasonBanner isAdmin={isAdmin} />
        </Suspense>

        {authError ? (
          <StatusNotice tone="error" title={copy.signInFailedTitle}>
            <p>{authError}</p>
          </StatusNotice>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField
            id={emailInputId}
            label={isAdmin ? copy.emailLabelAdmin : copy.emailLabelCustomer}
            required
            error={errors.email}
            hint={copy.emailHint}
          >
            <Input
              id={emailInputId}
              name="email"
              type="email"
              autoComplete="email"
              placeholder={resolvedEmailPlaceholder}
              value={formState.email}
              hasError={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? `${emailInputId}-error` : `${emailInputId}-hint`
              }
              onChange={(e) => {
                setFormState((prev) => ({ ...prev, email: e.target.value }));
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
                if (authError) {
                  setAuthError(null);
                }
              }}
            />
          </FormField>

          <FormField
            id={passwordInputId}
            label={copy.passwordLabel}
            required
            error={errors.password}
            hint={copy.passwordHint}
          >
            <Input
              id={passwordInputId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={copy.passwordPlaceholder}
              value={formState.password}
              hasError={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? `${passwordInputId}-error`
                  : `${passwordInputId}-hint`
              }
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  password: e.target.value,
                }));
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
                if (authError) {
                  setAuthError(null);
                }
              }}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  aria-label={
                    showPassword
                      ? t.common.hidePasswordAria
                      : t.common.showPasswordAria
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              }
            />
          </FormField>

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>
                {isAdmin ? copy.adminSubmitButton : copy.customerSubmitButton}
              </span>
            </Button>
          </div>
        </form>

        {/* Customer Registration Link (Only on Customer Login, NEVER on Admin Login) */}
        {!isAdmin ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-secondary)]">
            <span>{copy.noCustomerAccountPrompt}</span>
            <Link
              href="/customer/signup"
              className="inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
            >
              <span>{copy.createNewAccountLink}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-xs leading-relaxed text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)]">
            {isAdmin
              ? copy.authorizedPersonnelNoticeTitle
              : copy.securityNoteTitle}
          </p>
          <p className="mt-1">{localizedSecurityNote}</p>
        </div>
      </Card>
    </div>
  );
}

