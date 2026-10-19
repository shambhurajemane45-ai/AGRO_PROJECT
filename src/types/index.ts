/**
 * Core TypeScript definitions for Phase 1 Foundation and planned architecture extension points.
 * All placeholder content is explicitly typed to distinguish verified data from unconfigured placeholders.
 */

export type PortalRole = "customer" | "admin";

export interface NavigationItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface PlaceholderSectionItem {
  id: string;
  title: string;
  categoryLabel: string;
  summary: string;
  statusNote: string;
}

export interface CompanyProfilePlaceholder {
  companyName: string;
  platformTitle: string;
  tagline: string;
  noticeBanner: string;
  registrationPlaceholder: string;
  addressPlaceholder: string;
  contactEmailPlaceholder: string;
  contactPhonePlaceholder: string;
}

export interface IntegrationExtensionPoint {
  id: string;
  name: string;
  plannedPhase: string;
  scope: "client-and-server" | "server-only";
  description: string;
  status: "planned";
}

export interface LoginFormState {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  formNotice?: string;
}
