import type {
  CompanyProfilePlaceholder,
  IntegrationExtensionPoint,
  NavigationItem,
  PlaceholderSectionItem,
} from "@/types";

/**
 * Site configuration and clearly labelled placeholders.
 * IMPORTANT: No company identity, products, prices, certifications, addresses,
 * or agricultural claims are fabricated. Replace placeholders only with verified
 * company records in subsequent phases.
 */
export const companyPlaceholderConfig: CompanyProfilePlaceholder = {
  companyName: "[Company Name Placeholder]",
  platformTitle: "Agriculture Product Manufacturing Digital Platform",
  tagline:
    "Digital platform foundation for product catalogue management, distributor and customer ordering, batch validation certificates, and agricultural guidance.",
  noticeBanner:
    "Phase 1 Foundation Build — Company identity, product specifications, certifications, and live authentication are currently configured as labelled placeholders.",
  registrationPlaceholder:
    "[Manufacturing License / GST / ISO Registration Details — Pending Verified Company Input]",
  addressPlaceholder:
    "[Registered Manufacturing Facility & Corporate Office Address — Pending Verified Company Input]",
  contactEmailPlaceholder: "[official-contact@company-domain.placeholder]",
  contactPhonePlaceholder: "[Official Support Phone Number — Pending Input]",
};

export const mainNavigation: NavigationItem[] = [
  { label: "Products Overview", href: "/#products" },
  { label: "Company Profile", href: "/#company-info" },
  { label: "Agriculture Guidance", href: "/#agriculture-guidance" },
  { label: "Platform Architecture", href: "/#platform-scope" },
];

export const productCategoryPlaceholders: PlaceholderSectionItem[] = [
  {
    id: "prod-cat-1",
    title: "[Product Line Placeholder A — e.g., Crop Nutrition / Soil Inputs]",
    categoryLabel: "Catalogue Slot 01 • Unpopulated",
    summary:
      "Reserved for verified product formulations, active ingredient compositions, pack sizes, and batch quality parameters. No product names or prices are fabricated in Phase 1.",
    statusNote: "Awaiting verified product master data (Phase 3 / Phase 4)",
  },
  {
    id: "prod-cat-2",
    title: "[Product Line Placeholder B — e.g., Plant Protection / Bio-Inputs]",
    categoryLabel: "Catalogue Slot 02 • Unpopulated",
    summary:
      "Reserved for official label claims, application dosage tables, safety data sheets (SDS), and regulatory registration numbers.",
    statusNote: "Awaiting verified product master data (Phase 3 / Phase 4)",
  },
  {
    id: "prod-cat-3",
    title: "[Product Line Placeholder C — e.g., Specialty & Institutional Supply]",
    categoryLabel: "Catalogue Slot 03 • Unpopulated",
    summary:
      "Reserved for bulk manufacturing SKUs, distributor packaging configurations, and batch-linked validation certificate templates.",
    statusNote: "Awaiting verified product master data (Phase 3 / Phase 4)",
  },
];

export const companyInformationPlaceholders: PlaceholderSectionItem[] = [
  {
    id: "comp-info-1",
    title: "Manufacturing & Quality Assurance Profile",
    categoryLabel: "Company Record Placeholder",
    summary:
      "This section will display verified manufacturing plant details, laboratory testing protocols, and batch traceability workflows once official company documentation is provided.",
    statusNote: "Placeholder — No unverified manufacturing claims displayed",
  },
  {
    id: "comp-info-2",
    title: "Regulatory Compliance & Certifications",
    categoryLabel: "Compliance Record Placeholder",
    summary:
      "Reserved for official statutory licenses, fertilizer/agrochemical control order registrations, and quality certifications. No certification badges or numbers are invented.",
    statusNote: "Placeholder — Pending official compliance certificates",
  },
  {
    id: "comp-info-3",
    title: "Distribution & Fulfilment Network",
    categoryLabel: "Operations Record Placeholder",
    summary:
      "Reserved for verified regional depot locations, dealer onboarding policies, dispatch timelines, and order fulfilment service levels.",
    statusNote: "Placeholder — Pending verified logistics parameters",
  },
];

export const agricultureGuidancePlaceholders: PlaceholderSectionItem[] = [
  {
    id: "agri-guide-1",
    title: "Crop-Specific Application Protocols",
    categoryLabel: "Agronomy Knowledge Base Placeholder",
    summary:
      "Structured placeholder for agronomist-approved usage schedules, soil condition prerequisites, and compatibility matrices tied strictly to verified company products.",
    statusNote: "Placeholder — No unverified agronomic advice published",
  },
  {
    id: "agri-guide-2",
    title: "Batch Validation & Certificate Verification",
    categoryLabel: "Quality Verification Workflow",
    summary:
      "Planned module enabling customers and distributors to access official batch validation certificates linked to fulfilled orders.",
    statusNote: "Planned for Phase 6 (Orders & Validation Certificate)",
  },
  {
    id: "agri-guide-3",
    title: "Company-Specific AI Agronomy Assistant",
    categoryLabel: "Planned Claude AI Integration",
    summary:
      "Planned server-side Anthropic Claude assistant restricted exclusively to verified company product documentation and approved agricultural guidance.",
    statusNote: "Planned for Phase 8 (Server-Side Claude API)",
  },
];

export const plannedIntegrations: IntegrationExtensionPoint[] = [
  {
    id: "firebase-auth",
    name: "Firebase Authentication & Server-Side RBAC",
    plannedPhase: "Phase 2",
    scope: "client-and-server",
    description:
      "Customer and Admin authentication using Firebase Auth with server-side session/token verification and custom role claims via Firebase Admin SDK.",
    status: "planned",
  },
  {
    id: "firestore-storage",
    name: "Cloud Firestore & Firebase Storage",
    plannedPhase: "Phase 3",
    scope: "client-and-server",
    description:
      "Structured persistence for product catalogues, inventory batches, orders, customer accounts, and secure storage for product documentation and validation certificates.",
    status: "planned",
  },
  {
    id: "razorpay",
    name: "Razorpay Payment Gateway",
    plannedPhase: "Phase 6 & Phase 11",
    scope: "server-only",
    description:
      "Server-side order creation, cryptographic signature verification, and webhook reconciliation for online order payments.",
    status: "planned",
  },
  {
    id: "claude-ai",
    name: "Anthropic Claude AI Assistant",
    plannedPhase: "Phase 8",
    scope: "server-only",
    description:
      "Protected server-side API integration grounding responses strictly in approved company product manuals and validated agricultural advisories.",
    status: "planned",
  },
  {
    id: "whatsapp-business",
    name: "Official WhatsApp Business Messaging",
    plannedPhase: "Phase 9",
    scope: "server-only",
    description:
      "Automated order confirmation, dispatch updates, and validation certificate delivery via the official WhatsApp Business Cloud API.",
    status: "planned",
  },
];
