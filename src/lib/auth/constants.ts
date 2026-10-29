import type { PortalRole } from "../../types/index.ts";

export const SESSION_COOKIE_NAME = "supriya_session";
export const ROLE_COOKIE_NAME = "supriya_role";

/**
 * 5 days in milliseconds and seconds (Firebase Admin createSessionCookie supports 5 mins to 14 days).
 */
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;
export const SESSION_DURATION_SECONDS = 5 * 24 * 60 * 60;

export const CUSTOMER_LOGIN_PATH = "/customer/login";
export const CUSTOMER_SIGNUP_PATH = "/customer/signup";
export const CUSTOMER_DASHBOARD_PATH = "/customer/dashboard";

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

export function getDashboardPathForRole(role: PortalRole): string {
  return role === "admin" ? ADMIN_DASHBOARD_PATH : CUSTOMER_DASHBOARD_PATH;
}

export function getLoginPathForRole(role: PortalRole): string {
  return role === "admin" ? ADMIN_LOGIN_PATH : CUSTOMER_LOGIN_PATH;
}
