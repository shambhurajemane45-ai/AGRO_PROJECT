import type {
  CompanyProfilePlaceholder,
  NavigationItem,
  PortalFeatureHighlight,
} from "@/types";

/**
 * Site configuration and clearly labelled placeholders.
 * IMPORTANT: No company identity, products, prices, certifications, addresses,
 * or agricultural claims are fabricated. Replace placeholders only with verified
 * company records in subsequent phases.
 */
export const companyPlaceholderConfig: CompanyProfilePlaceholder = {
  companyName: "[Company Name Placeholder]",
  logoPlaceholderLabel: "Company Logo Placeholder",
  platformTitle: "Agriculture Product Manufacturing Digital Platform",
  heroHeadline: "Growing Better Agriculture, Together",
  tagline:
    "A unified digital platform for verified agricultural products, guided crop solutions, order management, and batch validation certificates.",
  noticeBanner:
    "Phase 2 Authentication & RBAC Active — Company identity and product records remain labelled placeholders pending verified data.",
  registrationPlaceholder:
    "[Manufacturing License / GST / ISO Registration Details — Pending Verified Company Input]",
  addressPlaceholder:
    "[Registered Manufacturing Facility & Corporate Office Address — Pending Verified Company Input]",
  contactEmailPlaceholder: "[official-contact@company-domain.placeholder]",
  contactPhonePlaceholder: "[Official Support Phone Number — Pending Input]",
};

export const mainNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Customer Portal", href: "/customer" },
  { label: "Admin Portal", href: "/admin" },
];

export const customerPortalHighlights: PortalFeatureHighlight[] = [
  {
    id: "cust-feat-1",
    title: "Browse Verified Products",
    description:
      "Explore official agricultural inputs, pack sizes, and usage specifications once catalog data is published.",
  },
  {
    id: "cust-feat-2",
    title: "Agricultural Guidance Videos & Guides",
    description:
      "Access crop-care guidance videos and practical application instructions prepared by company specialists.",
  },
  {
    id: "cust-feat-3",
    title: "Seasonal Offers & Dealer Schemes",
    description:
      "View transparent pricing updates, seasonal offers, and eligible order benefits inside your account.",
  },
  {
    id: "cust-feat-4",
    title: "Orders & Batch Certificates",
    description:
      "Track order fulfilment status and download batch-linked validation certificates for every delivery.",
  },
];

export const adminPortalHighlights: PortalFeatureHighlight[] = [
  {
    id: "adm-feat-1",
    title: "Product & Batch Control",
    description:
      "Manage verified product specifications, manufacturing batch logs, and quality documentation.",
  },
  {
    id: "adm-feat-2",
    title: "Order & Fulfilment Management",
    description:
      "Review customer orders, allocate production batches, and coordinate dispatch milestones.",
  },
  {
    id: "adm-feat-3",
    title: "Validation Certificate Issuance",
    description:
      "Attach official laboratory validation certificates to fulfilled batches and customer orders.",
  },
];

export const landingTrustPillars: PortalFeatureHighlight[] = [
  {
    id: "pillar-1",
    title: "Batch-Linked Quality Traceability",
    description:
      "Designed to connect every fulfilled order with its corresponding manufacturing batch validation certificate.",
  },
  {
    id: "pillar-2",
    title: "Practical Agricultural Guidance",
    description:
      "Structured around clear crop usage guidance, instructional videos, and verified product documentation.",
  },
  {
    id: "pillar-3",
    title: "Transparent Company Placeholders",
    description:
      "All corporate credentials, addresses, and product catalogues remain honest placeholders until verified data is supplied.",
  },
];
