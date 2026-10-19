# Agriculture Product Manufacturing Company Digital Platform

## 1. Project Purpose

This repository contains the production foundation for an **Agriculture Product Manufacturing Company Digital Platform**. It is designed to support:

- **Customer & Distributor Portal**: Browsing verified agricultural products, placing orders, tracking fulfilment, downloading batch validation certificates, and consulting approved agricultural guidance.
- **Manufacturing Admin Portal**: Managing product master records, manufacturing batches, order workflows, quality validation certificates, and dispatch operations.
- **Data Integrity Policy**: No company identity, products, prices, certifications, addresses, or agricultural claims are fabricated. Where verified company records are not yet supplied, clearly labelled placeholders are used.

---

## 2. Required Software

- **Node.js**: v20.x or newer (verified on Node.js v24.17.0)
- **npm**: v10.x or newer (verified on npm v11.13.0)
- **Git**: v2.40+ for version control

---

## 3. Installation Steps

1. Clone or open the repository in `c:\Users\HP\OneDrive\Documents\projects\SUPRIYA_AGRO`.
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variable template when configuring local integrations in future phases:
   ```bash
   cp .env.example .env.local
   ```
   *(Note: `.env.local` is ignored by Git and must never be committed.)*

---

## 4. Running the Application Locally

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Phase 1 Routes

- `/` — Company Landing Page (Header, Hero, Portal Entry Points, Product/Company/Agronomy Placeholders, Planned Architecture, Footer)
- `/customer/login` — Customer & Distributor Portal Login UI
- `/admin/login` — Manufacturing Admin Portal Login UI

---

## 5. Linting, TypeScript Validation, and Production Build

- **Run ESLint**:
  ```bash
  npm run lint
  ```
- **Run TypeScript Strict Validation**:
  ```bash
  npm run typecheck
  ```
- **Run Production Build**:
  ```bash
  npm run build
  ```
- **Start Production Server (after build)**:
  ```bash
  npm run start
  ```

---

## 6. Folder Structure

```text
SUPRIYA_AGRO/
├── docs/
│   ├── ARCHITECTURE.md          # Frontend, backend, security, and integration architecture
│   ├── DEVELOPMENT_ROADMAP.md   # 12-phase engineering roadmap
│   └── PROJECT_OVERVIEW.md      # Functional overview of portals and core workflows
├── public/
│   ├── icons/                   # Static icon assets
│   └── images/                  # Verified visual assets (when licensed/provided)
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── login/
│   │   │       └── page.tsx     # Admin login UI route (/admin/login)
│   │   ├── customer/
│   │   │   └── login/
│   │   │       └── page.tsx     # Customer login UI route (/customer/login)
│   │   ├── globals.css          # Design system tokens (colors, spacing, borders, focus states)
│   │   ├── layout.tsx           # Root HTML layout and typography setup
│   │   └── page.tsx             # Company landing page (/)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Footer.tsx       # Platform footer with placeholder disclosures
│   │   │   └── Header.tsx       # Responsive header and navigation
│   │   ├── shared/
│   │   │   └── PortalLoginForm.tsx # Reusable validated login form for Customer & Admin UI
│   │   └── ui/
│   │       ├── Button.tsx       # Accessible button / link-button component
│   │       ├── Card.tsx         # Surface card component
│   │       ├── Container.tsx    # Responsive max-width container
│   │       ├── FormField.tsx    # Accessible form label, hint, and error wrapper
│   │       ├── Input.tsx        # Accessible text/password input component
│   │       └── StatusNotice.tsx # Semantic status, warning, and error alert banner
│   ├── config/
│   │   └── site.ts              # Labelled placeholders and navigation config
│   ├── lib/
│   │   ├── integrations.ts      # Documented extension contracts for future phases
│   │   └── validation.ts        # Client-side form validation rules
│   └── types/
│       └── index.ts             # Shared strict TypeScript interfaces
├── .env.example                 # Placeholder environment variables (no secrets)
├── .gitignore                   # Protects .env.local, node_modules, and build artifacts
├── eslint.config.mjs            # ESLint configuration
├── next.config.ts               # Next.js configuration
├── package.json                 # Scripts and dependencies
└── tsconfig.json                # Strict TypeScript configuration
```

---

## 7. Current Phase Limitations (Phase 1)

- **UI & Architecture Foundation Only**: Phase 1 establishes the visual design system, responsive layouts, strict TypeScript structure, and initial routes (`/`, `/customer/login`, `/admin/login`).
- **No Live Authentication Yet**: Submitting the Customer or Admin login form validates inputs (`email` and `password`) on the client and displays a transparent notice explaining that authentication is not active in Phase 1. No fake login success or fake session is created. Real authentication via **Firebase Authentication** and **Firebase Admin SDK** is scheduled for **Phase 2**.
- **Labelled Placeholders**: Company name, registration numbers, addresses, product items, and certifications are intentionally represented as labelled placeholders until official company data is supplied.
- **No Unconfigured Third-Party SDKs Installed**: Firebase, Anthropic Claude, Razorpay, and WhatsApp Business SDKs are documented as extension points and will be installed in their dedicated roadmap phases.
