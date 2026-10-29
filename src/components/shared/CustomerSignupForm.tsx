"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  AuthSessionResponsePayload,
  SignupFormErrors,
  SignupFormState,
} from "@/types";
import { validateSignupForm } from "@/lib/validation";
import {
  getFirebaseClientAuth,
  isFirebaseClientConfigured,
  mapFirebaseAuthError,
} from "@/lib/firebase/client";
import { CUSTOMER_DASHBOARD_PATH } from "@/lib/auth/constants";
import { SUPPORTED_LANGUAGE_OPTIONS } from "@/lib/language";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";

export function CustomerSignupForm() {
  const router = useRouter();
  const { language, languageOption, setLanguage, t } = useLanguagePreference();
  const copy = t.auth;
  const [formState, setFormState] = useState<SignupFormState>({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    const validation = validateSignupForm(formState, language);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    if (!isFirebaseClientConfigured()) {
      setAuthError(copy.firebaseUnconfiguredSignupError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Pre-check that the server-side Firebase Admin SDK is configured before
      // creating a new Firebase Auth user so we never leave an orphaned account
      // without a verified Firestore users/{uid} profile and session cookie.
      const precheckResponse = await fetch("/api/auth/session", {
        method: "GET",
      });
      if (precheckResponse.status === 503) {
        const precheckPayload =
          (await precheckResponse.json()) as AuthSessionResponsePayload;
        setAuthError(
          precheckPayload.error ?? copy.firebaseAdminUnconfiguredError
        );
        setIsSubmitting(false);
        return;
      }

      const auth = getFirebaseClientAuth();
      const trimmedName = formState.fullName.trim();
      const trimmedEmail = formState.email.trim();
      const trimmedMobile = formState.mobile.trim();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        formState.password
      );

      await updateProfile(userCredential.user, {
        displayName: trimmedName,
      });

      const idToken = await userCredential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          portal: "customer",
          isNewCustomerSignup: true,
          profile: {
            fullName: trimmedName,
            mobile: trimmedMobile,
          },
        }),
      });

      const payload = (await response.json()) as AuthSessionResponsePayload;

      if (!response.ok || !payload.authenticated) {
        await signOut(auth).catch(() => undefined);
        setAuthError(
          payload.error ?? copy.sessionInitFailedAfterSignup
        );
        setIsSubmitting(false);
        return;
      }

      router.push(payload.redirectTo ?? CUSTOMER_DASHBOARD_PATH);
      router.refresh();
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error, language));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/customer"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{copy.backToCustomerPortal}</span>
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
        className="space-y-6 border-t-4 border-t-[var(--brand-secondary)] bg-white"
      >
        <div className="space-y-3 border-b border-[var(--border-subtle)] pb-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{copy.signupBadge}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {copy.signupTitle}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {copy.signupSubtitle}
          </p>
        </div>

        {authError ? (
          <StatusNotice tone="error" title={copy.registrationFailedTitle}>
            <p>{authError}</p>
          </StatusNotice>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField
            id="signup-fullname"
            label={copy.fullNameLabel}
            required
            error={errors.fullName}
          >
            <Input
              id="signup-fullname"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder={copy.fullNamePlaceholder}
              value={formState.fullName}
              hasError={Boolean(errors.fullName)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={
                errors.fullName ? "signup-fullname-error" : undefined
              }
              onChange={(e) => {
                setFormState((prev) => ({
                  ...prev,
                  fullName: e.target.value,
                }));
                if (errors.fullName) {
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }
                if (authError) setAuthError(null);
              }}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="signup-email"
              label={copy.emailAddressLabel}
              required
              error={errors.email}
            >
              <Input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                value={formState.email}
                hasError={Boolean(errors.email)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "signup-email-error" : undefined
                }
                onChange={(e) => {
                  setFormState((prev) => ({ ...prev, email: e.target.value }));
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                  if (authError) setAuthError(null);
                }}
              />
            </FormField>

            <FormField
              id="signup-mobile"
              label={copy.mobileNumberLabel}
              required
              error={errors.mobile}
            >
              <Input
                id="signup-mobile"
                name="mobile"
                type="tel"
                autoComplete="tel"
                placeholder={copy.mobilePlaceholder}
                value={formState.mobile}
                hasError={Boolean(errors.mobile)}
                aria-invalid={Boolean(errors.mobile)}
                aria-describedby={
                  errors.mobile ? "signup-mobile-error" : undefined
                }
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    mobile: e.target.value,
                  }));
                  if (errors.mobile) {
                    setErrors((prev) => ({ ...prev, mobile: undefined }));
                  }
                  if (authError) setAuthError(null);
                }}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="signup-password"
              label={copy.passwordLabel}
              required
              error={errors.password}
              hint={copy.passwordHintShort}
            >
              <Input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={copy.createPasswordPlaceholder}
                value={formState.password}
                hasError={Boolean(errors.password)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password
                    ? "signup-password-error"
                    : "signup-password-hint"
                }
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }));
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }
                  if (authError) setAuthError(null);
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

            <FormField
              id="signup-confirm-password"
              label={copy.confirmPasswordLabel}
              required
              error={errors.confirmPassword}
              hint={copy.confirmPasswordHint}
            >
              <Input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={copy.confirmPasswordPlaceholder}
                value={formState.confirmPassword}
                hasError={Boolean(errors.confirmPassword)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword
                    ? "signup-confirm-password-error"
                    : "signup-confirm-password-hint"
                }
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }));
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }));
                  }
                  if (authError) setAuthError(null);
                }}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                    aria-label={
                      showConfirmPassword
                        ? t.common.hideConfirmPasswordAria
                        : t.common.showConfirmPasswordAria
                    }
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                }
              />
            </FormField>
          </div>

          {/* Terms / Privacy Acknowledgement Placeholder */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="signup-terms"
              className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[var(--text-secondary)]"
            >
              <input
                id="signup-terms"
                name="acceptedTerms"
                type="checkbox"
                checked={formState.acceptedTerms}
                aria-invalid={Boolean(errors.acceptedTerms)}
                aria-describedby={
                  errors.acceptedTerms ? "signup-terms-error" : undefined
                }
                onChange={(e) => {
                  setFormState((prev) => ({
                    ...prev,
                    acceptedTerms: e.target.checked,
                  }));
                  if (errors.acceptedTerms) {
                    setErrors((prev) => ({
                      ...prev,
                      acceptedTerms: undefined,
                    }));
                  }
                  if (authError) setAuthError(null);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border-strong)] accent-[var(--brand-primary)]"
              />
              <span>
                {copy.termsPrefix}{" "}
                <strong className="font-semibold text-[var(--text-primary)]">
                  {copy.termsPlaceholderStrong}
                </strong>{" "}
                {copy.termsSuffix}
              </span>
            </label>
            {errors.acceptedTerms ? (
              <p
                id="signup-terms-error"
                role="alert"
                className="text-xs font-medium text-[var(--status-error)]"
              >
                {errors.acceptedTerms}
              </p>
            ) : null}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>{copy.createAccountButton}</span>
            </Button>
          </div>
        </form>

        {/* Link to Existing Customer Login */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-secondary)]">
          <span>{copy.alreadyHaveAccountPrompt}</span>
          <Link
            href="/customer/login"
            className="inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
          >
            <span>{copy.loginToAccountLink}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

