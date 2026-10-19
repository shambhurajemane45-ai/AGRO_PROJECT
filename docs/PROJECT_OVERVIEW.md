# Project Overview — Agriculture Product Manufacturing Company Digital Platform

> **Implementation Status Note**: This document describes the overall functional scope of the platform across all planned phases. At the completion of **Phase 1**, only the project foundation, design system, landing page (`/`), customer login UI (`/customer/login`), and admin login UI (`/admin/login`) are implemented. All portals, database workflows, payment processing, certificate generation, and AI features described below are **planned** for subsequent phases.

---

## 1. Platform Vision

The Agriculture Product Manufacturing Company Digital Platform is a unified web application connecting an agricultural input manufacturer with its registered customers, dealers, and internal operations team. The platform prioritizes regulatory accuracy, batch traceability, transparent order management, and verified agricultural guidance.

---

## 2. Customer Portal (Planned — Phase 5)

*(Phase 1 Status: `/customer/login` UI implemented; authentication planned for Phase 2; portal dashboard planned for Phase 5.)*

The Customer Portal will allow verified customers, dealers, and institutional buyers to:

- **Account & Profile Management**: View verified business details, billing/shipping addresses, and statutory registration numbers (where applicable).
- **Product Catalogue Browsing**: Explore official company products with verified active ingredient breakdowns, approved crop applications, dosage instructions, and packaging sizes.
- **Order Placement & History**: Create purchase orders, track order approval status, view invoices, and monitor dispatch progress.
- **Validation Certificate Access**: View and download batch-specific validation and quality analysis certificates tied to their fulfilled orders.
- **Agriculture Guidance & AI Assistant**: Access approved crop guidance documents and interact with the company-specific AI assistant (planned in Phase 8).

---

## 3. Admin Portal (Planned — Phase 4)

*(Phase 1 Status: `/admin/login` UI implemented; server-side role authorization planned for Phase 2; admin portal modules planned for Phase 4.)*

The Manufacturing Admin Portal will provide role-authorized staff with tools for:

- **Product & Catalogue Management**: Create, update, and archive product SKUs, technical specifications, safety data sheets (SDS), and label instructions.
- **Manufacturing Batch Management**: Record production batch numbers, manufacturing dates, expiry dates, and laboratory quality parameters.
- **Order Review & Fulfilment Control**: Review incoming customer orders, verify stock allocation against specific manufacturing batches, and update dispatch milestones.
- **Validation Certificate Issuance**: Generate and attach official validation certificates to manufacturing batches and customer orders.
- **Customer & Dealer Oversight**: Manage customer account verification statuses and order histories.

---

## 4. Product Management (Planned — Phase 3 & Phase 4)

- **Strict Data Accuracy**: Product records will only store verified company formulations, approved crop categories, pack sizes, and official regulatory registration details.
- **Document Attachments**: Products can be linked to official PDFs (usage leaflets, safety sheets) stored securely in Firebase Storage.
- **Inventory & Batch Linkage**: Products link to specific manufacturing batches so that fulfilled orders retain end-to-end batch traceability.

---

## 5. Order Lifecycle (Planned — Phase 6 & Phase 7)

The planned order lifecycle follows a controlled, auditable state machine:

1. **Draft / Submitted**: Customer selects products and quantities and submits an order request.
2. **Payment Pending / Verified**: Payment is processed via Razorpay (Phase 6 & Phase 11) or recorded under approved B2B payment terms, verified server-side.
3. **Confirmed & Batch Allocated**: Admin allocates specific manufacturing batch numbers to the order line items.
4. **Validation Certificate Linked**: The corresponding batch validation certificate is generated or attached to the order.
5. **Dispatched / In Transit**: Fulfilment details, transporter information, and tracking references are recorded (Phase 7).
6. **Delivered / Completed**: Order delivery is confirmed and archived for customer reference and compliance auditing.

---

## 6. Validation Certificate Workflow (Planned — Phase 6)

Agricultural products require strict quality assurance and batch traceability:

- Each manufacturing batch undergoes quality verification recorded by authorized administrators.
- When an order is fulfilled from a specific batch, a **Validation Certificate** containing batch metadata, test parameters, manufacturing/expiry dates, and verification references is associated with the order.
- Customers can download or verify the certificate directly from their order details page.

---

## 7. Company-Specific AI Assistant (Planned — Phase 8)

- Powered by the **Anthropic Claude API** running exclusively through protected server-side endpoints.
- **Strict Grounding**: The assistant will only answer questions using verified company product documentation, approved crop usage guidelines, and safety instructions provided by the company.
- **Safety Boundaries**: If a customer asks about unverified products, off-label chemical usage, or fabricated agricultural claims, the assistant will explicitly decline to speculate and refer the user to official company agronomists.
