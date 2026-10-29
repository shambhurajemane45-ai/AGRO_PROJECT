# Agriculture Product Manufacturing Company Digital Platform

## 1. Project Purpose

This repository contains the production foundation for an **Agriculture Product Manufacturing Company Digital Platform**. It is designed to support:

- **Customer & Dealer Portal**: Browsing verified agricultural products, watching agricultural guidance videos, exploring seasonal offers, placing and managing orders, and downloading batch validation certificates.
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

### Available Phase 1 & Phase 2 Routes & User Journey

- `/` — **Welcome & Portal Selection Landing Page** ("Growing Better Agriculture, Together" hero + prominent **Customer Portal** and **Admin Portal** selection cards)
- `/customer` — **Customer Portal Entry Page** (Friendly welcome overview, "Login to Your Account", and "Create New Account" actions)
- `/customer/login` — **Customer Login** (Firebase Authentication email/password sign-in, server session cookie exchange, link to `/customer/signup` and back to `/customer`)
- `/customer/signup` — **Customer Sign Up** (Firebase Authentication registration, server-verified `customer` role provisioning in Firestore, link to `/customer/login`)
- `/customer/dashboard` — **Role-Protected Customer Dashboard** (Protected by `src/proxy.ts` and server-side `requireRoleSession("customer")` via Firebase Admin SDK)
- `/admin` — **Admin Portal Entry Page** (Authorized-personnel gateway with single primary "Continue to Admin Login" CTA)
- `/admin/login` — **Admin Login** (Restricted administrative sign-in with server-side `admin` role verification via Firebase Admin SDK, no public registration link)
- `/admin/dashboard` — **Role-Protected Admin Dashboard** (Protected by `src/proxy.ts` and server-side `requireRoleSession("admin")` via Firebase Admin SDK)
- `/api/auth/session` — **Server Session Verification & Creation Endpoint** (`GET` / `POST`)
- `/api/auth/logout` — **Server Session Revocation & Cookie Cleanup Endpoint** (`POST`)

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
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # Role-protected Admin Dashboard (/admin/dashboard)
│   │   │   ├── login/
│   │   │   │   └── page.tsx     # Admin login route (/admin/login)
│   │   │   └── page.tsx         # Admin portal entry route (/admin)
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── logout/
│   │   │       │   └── route.ts # Server session revocation & cookie deletion
│   │   │       └── session/
│   │   │           └── route.ts # Firebase ID token verification & RBAC session cookie
│   │   ├── customer/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # Role-protected Customer Dashboard (/customer/dashboard)
│   │   │   ├── login/
│   │   │   │   └── page.tsx     # Customer login route (/customer/login)
│   │   │   ├── signup/
│   │   │   │   └── page.tsx     # Customer registration route (/customer/signup)
│   │   │   └── page.tsx         # Customer portal entry route (/customer)
│   │   ├── globals.css          # Design system tokens (colors, spacing, borders, focus states)
│   │   ├── layout.tsx           # Root HTML layout and typography setup
│   │   └── page.tsx             # Welcome & portal selection landing page (/)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Footer.tsx       # Platform footer with placeholder disclosures
│   │   │   └── Header.tsx       # Responsive header and portal navigation
│   │   ├── shared/
│   │   │   ├── CustomerSignupForm.tsx # Firebase-connected customer sign-up component
│   │   │   ├── LogoutButton.tsx       # Server + client sign-out button
│   │   │   └── PortalLoginForm.tsx    # Reusable Firebase login form for Customer & Admin
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
│   │   ├── auth/
│   │   │   ├── constants.ts     # Session cookie names, durations, and route paths
│   │   │   └── server.ts        # Server-only Firebase Admin session & RBAC verification
│   │   ├── firebase/
│   │   │   ├── admin.ts         # Server-only Firebase Admin SDK initialization
│   │   │   └── client.ts        # Browser Firebase Client SDK initialization
│   │   ├── integrations.ts      # Documented extension contracts
│   │   └── validation.ts        # Client-side login & sign-up validation rules
│   ├── types/
│   │   └── index.ts             # Shared strict TypeScript interfaces
│   └── proxy.ts                 # Next.js 16 request proxy protecting /customer/* and /admin/*
├── .env.example                 # Placeholder environment variables (no secrets)
├── firebase.json                # Firebase security rules configuration
├── firestore.rules              # Cloud Firestore RBAC security rules
├── storage.rules                # Firebase Storage security rules
└── package.json                 # Scripts and dependencies
```

---

## 7. Current Phase Status & Boundaries (Phase 2)

- **Firebase Authentication & Server RBAC Active**: Phase 2 implements Firebase Client SDK authentication, Firebase Admin SDK server-side token & session cookie verification, strict `customer` vs `admin` role-based access control, Next.js 16 `src/proxy.ts` route protection, role-protected dashboards (`/customer/dashboard` and `/admin/dashboard`), and `firestore.rules` / `storage.rules`.
- **Environment Configuration Required for Live Auth**: Copy `.env.example` to `.env.local` and populate `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_ADMIN_*` with your Firebase project credentials. No fake sessions or hardcoded credentials exist.
- **Strict Scope Boundary**: Product catalogue, batch records, orders, payments, certificates, videos, seasonal offers, and AI assistant features are not started in Phase 2 and remain scheduled for their designated phases.

