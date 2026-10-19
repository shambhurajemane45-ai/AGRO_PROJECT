"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { LoginFormErrors, LoginFormState, PortalRole } from "@/types";
import { validateLoginForm } from "@/lib/validation";
import { authExtensionPoint } from "@/lib/integrations";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusNotice } from "@/components/ui/StatusNotice";

interface PortalLoginFormProps {
  role: PortalRole;
  portalTitle: string;
  portalSubtitle: string;
  badgeText: string;
  emailPlaceholder: string;
  securityNote: string;
}

export function PortalLoginForm({
  role,
  portalTitle,
  portalSubtitle,
  badgeText,
  emailPlaceholder,
  securityNote,
}: PortalLoginFormProps) {
  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [hasSubmittedValidForm, setHasSubmittedValidForm] = useState(false);

  const isAdmin = role === "admin";
  const emailInputId = `${role}-login-email`;
  const passwordInputId = `${role}-login-password`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmittedValidForm(false);

    const validation = validateLoginForm(formState);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setHasSubmittedValidForm(true);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] py-1 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--brand-primary)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      <Card variant="elevated" padding="lg" className="space-y-6">
        <div className="space-y-3 border-b border-[var(--border-subtle)] pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
            {isAdmin ? (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{badgeText}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {portalTitle}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            {portalSubtitle}
          </p>
        </div>

        <StatusNotice
          tone="info"
          title="Phase 1 UI Foundation — Authentication Planned for Phase 2"
        >
          <p>
            This screen provides the validated form structure and accessibility
            foundation only. Live credential verification and role-based session
            issuance via{" "}
            <strong className="font-semibold text-[var(--text-primary)]">
              {authExtensionPoint.provider}
            </strong>{" "}
            will be connected in{" "}
            <strong className="font-semibold text-[var(--text-primary)]">
              {authExtensionPoint.phase}
            </strong>
            .
          </p>
        </StatusNotice>

        {hasSubmittedValidForm ? (
          <StatusNotice
            tone="warning"
            title="Authentication Service Not Active in Phase 1"
          >
            <p>
              Form inputs passed client-side validation, but{" "}
              <strong className="font-semibold text-[var(--text-primary)]">
                no sign-in session was created and no access was granted
              </strong>
              . Real authentication and server-side authorization will be
              enabled in Phase 2 using Firebase Authentication.
            </p>
          </StatusNotice>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField
            id={emailInputId}
            label={isAdmin ? "Administrator Email" : "Registered Email Address"}
            required
            error={errors.email}
            hint="Use your official registered email address."
          >
            <Input
              id={emailInputId}
              name="email"
              type="email"
              autoComplete="email"
              placeholder={emailPlaceholder}
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
                if (hasSubmittedValidForm) {
                  setHasSubmittedValidForm(false);
                }
              }}
            />
          </FormField>

          <FormField
            id={passwordInputId}
            label="Password"
            required
            error={errors.password}
            hint="Minimum 8 characters required."
          >
            <Input
              id={passwordInputId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
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
                if (hasSubmittedValidForm) {
                  setHasSubmittedValidForm(false);
                }
              }}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="rounded-[var(--radius-sm)] p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
            <Button type="submit" variant="primary" size="lg" fullWidth>
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>
                {isAdmin
                  ? "Sign In to Admin Portal"
                  : "Sign In to Customer Portal"}
              </span>
            </Button>
          </div>
        </form>

        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 text-xs leading-relaxed text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)]">
            Security Architecture Note
          </p>
          <p className="mt-1">{securityNote}</p>
        </div>
      </Card>
    </div>
  );
}
