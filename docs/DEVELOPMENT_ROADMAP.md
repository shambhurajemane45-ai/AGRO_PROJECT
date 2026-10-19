# Development Roadmap — Agriculture Product Manufacturing Company Digital Platform

This roadmap defines the 12 sequential engineering phases for building and deploying the platform. Each phase builds upon verified completions from prior phases.

---

## Phase Summary Table

| Phase | Name | Status |
| :--- | :--- | :--- |
| **Phase 1** | **Foundation** | **Completed (Current Phase)** |
| **Phase 2** | Firebase Authentication and Security | Planned |
| **Phase 3** | Database and Core Business Logic | Planned |
| **Phase 4** | Admin Portal | Planned |
| **Phase 5** | Customer Portal | Planned |
| **Phase 6** | Orders, Payment Architecture and Validation Certificate | Planned |
| **Phase 7** | Fulfilment and Delivery | Planned |
| **Phase 8** | Company-Specific Claude AI Assistant | Planned |
| **Phase 9** | Notifications and Integrations | Planned |
| **Phase 10** | Testing and Security Review | Planned |
| **Phase 11** | Razorpay Integration | Planned |
| **Phase 12** | Production Deployment | Planned |

---

## Detailed Phase Breakdown

### 1. Foundation *(Completed in Current Phase)*
- Initialize Next.js (App Router) with strict TypeScript, Tailwind CSS, and ESLint.
- Establish the agricultural-business design system and reusable UI component library.
- Implement the Landing Page (`/`) with honest, clearly labelled placeholders.
- Implement the Customer Login UI (`/customer/login`) and Admin Login UI (`/admin/login`) with client-side validation and explicit Phase 1 status disclosures.
- Configure `.env.example`, `.gitignore`, and foundational architecture documentation.

### 2. Firebase Authentication and Security *(Planned)*
- Install and configure the Firebase Client SDK and Firebase Admin SDK.
- Implement real email/password sign-in on `/customer/login` and `/admin/login`.
- Implement server-side session/token verification and Role-Based Access Control (RBAC) differentiating `customer` and `admin` roles.
- Protect `/customer/*` and `/admin/*` routes against unauthorized access on the server.

### 3. Database and Core Business Logic *(Planned)*
- Configure Cloud Firestore and Firebase Storage with strict security rules.
- Define data schemas and server-side repositories for users, products, manufacturing batches, orders, and validation certificates.
- Implement server-side input validation and audit logging for state-changing operations.

### 4. Admin Portal *(Planned)*
- Build the authenticated Admin Dashboard.
- Implement CRUD workflows for verified product master data and documentation uploads.
- Implement manufacturing batch creation and quality parameter recording.
- Build admin order management and customer account oversight screens.

### 5. Customer Portal *(Planned)*
- Build the authenticated Customer Dashboard.
- Implement the verified product catalogue browser and detailed product specification views.
- Enable customer profile management and order history inspection.

### 6. Orders, Payment Architecture and Validation Certificate *(Planned)*
- Implement end-to-end order creation and server-side price/inventory calculation.
- Establish the payment state machine and server-side payment verification architecture.
- Implement the Batch Validation Certificate generation, linkage to fulfilled orders, and customer download/verification workflow.

### 7. Fulfilment and Delivery *(Planned)*
- Implement order dispatch workflows, batch allocation tracking, transporter metadata, and delivery confirmation states.
- Provide customers with real-time order status timelines from confirmation through delivery.

### 8. Company-Specific Claude AI Assistant *(Planned)*
- Integrate the Anthropic Claude API via a protected server-side route handler.
- Ground the assistant strictly in verified company product documentation and approved agronomy protocols.
- Implement rate limiting, input sanitization, and clear disclaimers against unverified agricultural claims.

### 9. Notifications and Integrations *(Planned)*
- Integrate the Official WhatsApp Business Cloud API on the server.
- Send automated transactional notifications for order confirmation, dispatch updates, and validation certificate availability.

### 10. Testing and Security Review *(Planned)*
- Conduct comprehensive integration testing across authentication, RBAC boundaries, order state transitions, and certificate access.
- Audit Firestore/Storage security rules, environment variable isolation, and API endpoint protections.

### 11. Razorpay Integration *(Planned)*
- Connect live/sandbox Razorpay order creation, checkout modal integration, cryptographic payment signature verification, and webhook reconciliation.

### 12. Production Deployment *(Planned)*
- Configure production hosting, custom domain, SSL, production environment secrets, monitoring, and backup policies.
- Perform final pre-launch verification against verified company master data.
