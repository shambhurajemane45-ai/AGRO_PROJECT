import type { LoginFormErrors, LoginFormState } from "@/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates login form inputs on the client before any authentication request is attempted.
 * Note: Client-side validation is strictly for user experience and accessibility.
 * Real authentication and role authorization will be enforced in Phase 2 via
 * Firebase Authentication and Firebase Admin SDK on the server.
 */
export function validateLoginForm(values: LoginFormState): {
  isValid: boolean;
  errors: LoginFormErrors;
} {
  const errors: LoginFormErrors = {};

  const trimmedEmail = values.email.trim();

  if (!trimmedEmail) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address (for example, name@domain.com).";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.trim().length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
