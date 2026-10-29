/**
 * Core TypeScript definitions for Phase 1 Foundation and Phase 2 Firebase Authentication & RBAC.
 * All placeholder content is explicitly typed to distinguish verified data from unconfigured placeholders.
 */

export type PortalRole = "customer" | "admin";

export type SupportedLanguage = "en" | "mr" | "hi";

export interface LanguageOption {
  code: SupportedLanguage;
  englishName: string;
  nativeName: string;
  description: string;
}

export type AccountStatus = "active" | "suspended";

export interface NavigationItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface PortalFeatureHighlight {
  id: string;
  title: string;
  description: string;
}

export interface CompanyProfilePlaceholder {
  companyName: string;
  logoPlaceholderLabel: string;
  platformTitle: string;
  heroHeadline: string;
  tagline: string;
  noticeBanner: string;
  registrationPlaceholder: string;
  addressPlaceholder: string;
  contactEmailPlaceholder: string;
  contactPhonePlaceholder: string;
}

export interface LoginFormState {
  email: string;
  password: string;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export interface SignupFormState {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface SignupFormErrors {
  fullName?: string;
  email?: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
  acceptedTerms?: string;
}

export interface UserProfileRecord {
  uid: string;
  email: string;
  fullName: string;
  mobile: string;
  role: PortalRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VerifiedSessionUser {
  uid: string;
  email: string;
  fullName: string;
  mobile: string;
  role: PortalRole;
  status: AccountStatus;
}

export interface AuthSessionRequestPayload {
  idToken: string;
  portal: PortalRole;
  isNewCustomerSignup?: boolean;
  profile?: {
    fullName: string;
    mobile: string;
  };
}

export interface AuthSessionResponsePayload {
  authenticated: boolean;
  user?: VerifiedSessionUser;
  redirectTo?: string;
  error?: string;
  code?:
    | "UNCONFIGURED"
    | "INVALID_REQUEST"
    | "UNAUTHENTICATED"
    | "FORBIDDEN_ROLE"
    | "ACCOUNT_SUSPENDED"
    | "SERVER_ERROR";
}

// =============================================================================
// Phase 3: Product Management Data Model
// =============================================================================

export type ProductStatus = "active" | "draft" | "archived";

export type StockStatus = "in_stock" | "out_of_stock";

export type ProductAvailabilityState =
  | "in_stock"
  | "out_of_stock"
  | "enquiry_only"
  | "unavailable";

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  category: string;
  shortDescription: string;
  composition: string;
  targetCrops: string[];
  dosageAndApplication: string;
  packSizes: string[];
  unitPrice: number | null;
  safetyAndStorage: string;
  registrationNumber: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  createdByUid: string;
  updatedByUid: string;
  imageUrl?: string | null;
  stockQuantity?: number | null;
  stockStatus?: StockStatus;
  // Phase 6: Extended Agronomic & Tutorial Information (optional, backward-compatible)
  benefits?: string[];
  applicationMethod?: string;
  modeOfAction?: string;
  compatibilityNotice?: string;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
}

export interface ProductFormInput {
  sku: string;
  name: string;
  category: string;
  shortDescription: string;
  composition: string;
  targetCropsInput: string;
  dosageAndApplication: string;
  packSizesInput: string;
  unitPriceInput: string;
  safetyAndStorage: string;
  registrationNumber: string;
  status: ProductStatus;
  // Phase 6: Extended Agronomic & Tutorial Inputs (optional)
  benefitsInput?: string;
  applicationMethod?: string;
  modeOfAction?: string;
  compatibilityNotice?: string;
  youtubeUrl?: string;
}

export interface ValidatedProductPayload {
  sku: string;
  name: string;
  category: string;
  shortDescription: string;
  composition: string;
  targetCrops: string[];
  dosageAndApplication: string;
  packSizes: string[];
  unitPrice: number | null;
  safetyAndStorage: string;
  registrationNumber: string;
  status: ProductStatus;
  // Phase 6: Extended Agronomic & Tutorial Payload (optional)
  benefits?: string[];
  applicationMethod?: string;
  modeOfAction?: string;
  compatibilityNotice?: string;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
}

export interface ProductValidationErrors {
  sku?: string;
  name?: string;
  category?: string;
  shortDescription?: string;
  composition?: string;
  targetCrops?: string;
  dosageAndApplication?: string;
  packSizes?: string;
  unitPrice?: string;
  safetyAndStorage?: string;
  registrationNumber?: string;
  status?: string;
  // Phase 6: Extended Agronomic & Tutorial Errors
  benefits?: string;
  applicationMethod?: string;
  modeOfAction?: string;
  compatibilityNotice?: string;
  youtubeUrl?: string;
}

// =============================================================================
// Phase 4.1: Customer Shopping Cart Data Model
// =============================================================================

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  packSize: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  imageUrl?: string | null;
}

export type CartRevalidationIssueType =
  | "removed_inactive"
  | "out_of_stock"
  | "price_unavailable"
  | "price_updated"
  | "quantity_adjusted"
  | "invalid_quantity";

export interface CartRevalidationIssue {
  productId: string;
  productName: string;
  type: CartRevalidationIssueType;
  message: string;
  previousPrice?: number;
  updatedPrice?: number;
  requestedQuantity?: number;
  adjustedQuantity?: number;
}

export interface ValidatedCartLineItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  packSize: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  lineSubtotal: number;
  imageUrl?: string | null;
}

export interface CartValidationSummary {
  isValidForCheckout: boolean;
  hasAdjustments: boolean;
  items: ValidatedCartLineItem[];
  issues: CartRevalidationIssue[];
  subtotal: number;
  total: number;
  totalItems: number;
  uniqueItems: number;
  validatedAt: string;
}

// =============================================================================
// Phase 4.2: Customer Checkout & Secure Order Creation Data Model
// =============================================================================

export type OrderStatus =
  | "pending_verification"
  | "verified"
  | "rejected"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export interface CheckoutDeliveryInput {
  customerName: string;
  mobile: string;
  addressLine: string;
  villageOrCity: string;
  district: string;
  state: string;
  pinCode: string;
}

export interface CheckoutDeliveryErrors {
  customerName?: string;
  mobile?: string;
  addressLine?: string;
  villageOrCity?: string;
  district?: string;
  state?: string;
  pinCode?: string;
}

export interface OrderLineItemSnapshot {
  productId: string;
  sku: string;
  name: string;
  category: string;
  packSize: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerUid: string;
  customerEmail: string;
  items: OrderLineItemSnapshot[];
  subtotal: number;
  total: number;
  totalItems: number;
  uniqueItems: number;
  deliveryDetails: CheckoutDeliveryInput;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedByUid?: string;
  rejectedAt?: string;
  rejectedByUid?: string;
  rejectionReason?: string;
  // Phase 5: Payment-Independent Metadata (backward-compatible, optional)
  paymentOrderId?: string;
  paymentId?: string;
  paymentMethod?: string;
  paidAt?: string;
  paymentFailureReason?: string;
}

export type CustomerOrderView = Omit<OrderRecord, "idempotencyKey">;

// =============================================================================
// Phase 4.3: Admin Order Management Data Model
// =============================================================================

export type AdminOrderAction = "verify" | "reject";

export interface AdminOrderActionPayload {
  action: AdminOrderAction;
  rejectionReason?: string;
}

export type AdminOrderStatusTransitionErrorCode =
  | "INVALID_STATUS_TRANSITION"
  | "INVALID_ACTION"
  | "ORDER_NOT_FOUND";

export type AdminOrderStatusTransitionResult =
  | {
      ok: true;
      updatedOrder: OrderRecord;
    }
  | {
      ok: false;
      code: AdminOrderStatusTransitionErrorCode;
      error: string;
    };

// =============================================================================
// Phase 5: Payment-Independent Foundation Data Model
// =============================================================================

export type PaymentStatusTransitionAction =
  | "initiate"
  | "confirm_paid"
  | "record_failure"
  | "reset_unpaid";

export type PaymentStatusTransitionErrorCode =
  | "INVALID_PAYMENT_TRANSITION"
  | "ALREADY_PAID"
  | "ORDER_NOT_FOUND"
  | "INVALID_ACTION";

export interface PaymentStatusTransitionPayload {
  action: PaymentStatusTransitionAction;
  paymentOrderId?: string;
  paymentId?: string;
  paymentMethod?: string;
  failureReason?: string;
  nowIso?: string;
}

export type PaymentStatusTransitionResult =
  | {
      ok: true;
      updatedOrder: OrderRecord;
    }
  | {
      ok: false;
      code: PaymentStatusTransitionErrorCode;
      error: string;
    };

// =============================================================================
// Phase 6: Company Profile Management Data Model
// =============================================================================

export interface CompanyAddressDetails {
  facilityName: string;
  streetAddress: string;
  villageOrCity: string;
  district: string;
  state: string;
  pinCode: string;
}

export interface CompanyContactDetails {
  helplinePhone: string;
  supportEmail: string;
  officeHours: string;
}

export interface CompanyProfileRecord {
  id: "company_profile" | string;
  companyName: string;
  tagline: string;
  aboutUs: string;
  registrationNumber: string;
  address: CompanyAddressDetails;
  contact: CompanyContactDetails;
  updatedAt: string;
  updatedByUid: string;
  createdAt?: string;
  createdByUid?: string;
}

export interface CompanyProfileFormInput {
  companyName: string;
  tagline: string;
  aboutUs: string;
  registrationNumber: string;
  facilityName: string;
  streetAddress: string;
  villageOrCity: string;
  district: string;
  state: string;
  pinCode: string;
  helplinePhone: string;
  supportEmail: string;
  officeHours: string;
}

export interface CompanyProfileValidationErrors {
  companyName?: string;
  tagline?: string;
  aboutUs?: string;
  registrationNumber?: string;
  facilityName?: string;
  streetAddress?: string;
  villageOrCity?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  helplinePhone?: string;
  supportEmail?: string;
  officeHours?: string;
}

export interface ValidatedCompanyProfilePayload {
  companyName: string;
  tagline: string;
  aboutUs: string;
  registrationNumber: string;
  address: CompanyAddressDetails;
  contact: CompanyContactDetails;
}

