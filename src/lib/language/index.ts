import type {
  CompanyProfilePlaceholder,
  LanguageOption,
  NavigationItem,
  PortalFeatureHighlight,
  PortalRole,
  SupportedLanguage,
} from "../../types/index.ts";
import {
  ADMIN_LOGIN_PATH,
  CUSTOMER_LOGIN_PATH,
} from "../auth/constants.ts";

export const LANGUAGE_STORAGE_KEY = "supriya_preferred_language";
export const LANGUAGE_COOKIE_NAME = "supriya_lang";
export const LANGUAGE_CHANGE_EVENT = "supriya:language-change";

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const SUPPORTED_LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    code: "en",
    englishName: "English",
    nativeName: "English",
    description: "Continue in English",
  },
  {
    code: "mr",
    englishName: "Marathi",
    nativeName: "मराठी",
    description: "मराठी भाषेत पुढे जा (Marathi)",
  },
  {
    code: "hi",
    englishName: "Hindi",
    nativeName: "हिन्दी",
    description: "हिन्दी भाषा में आगे बढ़ें (Hindi)",
  },
] as const;

export function isSupportedLanguage(
  value: unknown
): value is SupportedLanguage {
  return value === "en" || value === "mr" || value === "hi";
}

export function normalizeLanguage(value: unknown): SupportedLanguage {
  return isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export function getLanguageOption(code: SupportedLanguage): LanguageOption {
  const found = SUPPORTED_LANGUAGE_OPTIONS.find((item) => item.code === code);
  return found ?? SUPPORTED_LANGUAGE_OPTIONS[0];
}

export function getPortalLoginDestination(role: PortalRole): string {
  return role === "admin" ? ADMIN_LOGIN_PATH : CUSTOMER_LOGIN_PATH;
}

export function getLocaleTagForLanguage(language: SupportedLanguage): string {
  if (language === "mr") return "mr-IN";
  if (language === "hi") return "hi-IN";
  return "en-IN";
}

export function formatCurrencyForLanguage(
  amount: number,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const locale = getLocaleTagForLanguage(language);
  try {
    return `₹${amount.toLocaleString(locale)}`;
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

export function formatDateForLanguage(
  isoDateString: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  if (!isoDateString) return "";
  const parsed = new Date(isoDateString);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateString.slice(0, 10);
  }
  const locale = getLocaleTagForLanguage(language);
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(parsed);
  } catch {
    return isoDateString.slice(0, 10);
  }
}

function readCookieValue(cookieHeader: string, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const segments = cookieHeader.split(";");
  for (const segment of segments) {
    const [rawKey, ...rawValueParts] = segment.trim().split("=");
    if (rawKey === cookieName) {
      return decodeURIComponent(rawValueParts.join("="));
    }
  }
  return null;
}

/**
 * Reads the persisted language preference on the client from localStorage
 * with cookie fallback. Defaults to 'en' if none is stored or on the server.
 */
export function getStoredLanguagePreference(): SupportedLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const fromStorage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(fromStorage)) {
      return fromStorage;
    }
  } catch {
    // Ignore storage access errors (e.g., restricted privacy mode)
  }

  if (typeof document !== "undefined") {
    const fromCookie = readCookieValue(document.cookie, LANGUAGE_COOKIE_NAME);
    if (isSupportedLanguage(fromCookie)) {
      return fromCookie;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Persists the selected language across navigation and page refreshes
 * using localStorage, a client-accessible cookie, and `<html lang="...">`.
 */
export function setStoredLanguagePreference(
  language: SupportedLanguage
): SupportedLanguage {
  const normalized = normalizeLanguage(language);

  if (typeof window === "undefined") {
    return normalized;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Ignore localStorage quota/privacy errors
  }

  if (typeof document !== "undefined") {
    const oneYearSeconds = 365 * 24 * 60 * 60;
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(
      normalized
    )}; path=/; max-age=${oneYearSeconds}; SameSite=Lax`;
    document.documentElement.lang = normalized;
  }

  window.dispatchEvent(
    new CustomEvent<SupportedLanguage>(LANGUAGE_CHANGE_EVENT, {
      detail: normalized,
    })
  );

  return normalized;
}

// =============================================================================
// Comprehensive Multilingual Dictionary (English, Marathi, Hindi)
// =============================================================================

export interface AuthLanguageCopy {
  selectedLanguageBadgeLabel: string;
  changeLanguageButtonLabel: string;
  modalTitleCustomer: string;
  modalTitleAdmin: string;
  modalSubtitleCustomer: string;
  modalSubtitleAdmin: string;
  continueCustomerButton: string;
  continueAdminButton: string;
  cancelButton: string;
  customerLoginTitle: string;
  customerLoginSubtitle: string;
  customerBadgeText: string;
  adminLoginTitle: string;
  adminLoginSubtitle: string;
  adminBadgeText: string;
  emailLabelCustomer: string;
  emailLabelAdmin: string;
  emailHint: string;
  passwordLabel: string;
  passwordHint: string;
  passwordPlaceholder: string;
  customerSubmitButton: string;
  adminSubmitButton: string;
  noCustomerAccountPrompt: string;
  createNewAccountLink: string;
  backToCustomerPortal: string;
  backToAdminPortal: string;
  homeLink: string;
}

export interface SiteTranslations {
  company: CompanyProfilePlaceholder;
  navigation: {
    primaryAriaLabel: string;
    items: NavigationItem[];
    headerSubtitle: string;
    customerPortalButton: string;
    customerPortalShort: string;
    customerPortalAriaLabel: string;
    adminPortalButton: string;
    adminPortalShort: string;
    adminPortalAriaLabel: string;
    languageSwitcherAriaLabel: string;
    languageLabel: string;
  };
  footer: {
    portalNavigationHeading: string;
    companyInfoHeading: string;
    facilityAddressLabel: string;
    officialContactLabel: string;
    copyrightSuffix: string;
  };
  common: {
    returnToHome: string;
    home: string;
    signOut: string;
    cancel: string;
    selected: string;
    showPasswordAria: string;
    hidePasswordAria: string;
    showConfirmPasswordAria: string;
    hideConfirmPasswordAria: string;
    skuPrefix: string;
    regPrefix: string;
    regRefPrefix: string;
    notProvided: string;
    providedOnEnquiry: string;
    activeStatus: string;
    suspendedStatus: string;
    customerRole: string;
    adminRole: string;
  };
  languageModal: {
    badgeLabel: string;
    closeDialogAria: string;
    radioGroupAria: string;
    customerPortalBadge: string;
    adminPortalBadge: string;
  };
  landing: {
    selectPortalPrompt: string;
    illustrationAriaLabel: string;
    illustrationTitle: string;
    illustrationSubtitle: string;
    choosePortalHeading: string;
    customerCardBadge: string;
    customerCardTitle: string;
    customerCardDescription: string;
    customerCardButton: string;
    customerCardButtonAria: string;
    adminCardBadge: string;
    adminCardTitle: string;
    adminCardDescription: string;
    adminCardButton: string;
    adminCardButtonAria: string;
    foundationEyebrow: string;
    foundationHeading: string;
    foundationDisclaimer: string;
    trustPillars: PortalFeatureHighlight[];
  };
  customerEntry: {
    badgeText: string;
    heading: string;
    description: string;
    loginButton: string;
    loginButtonAria: string;
    signupButton: string;
    signupButtonAria: string;
    existingCustomerTitle: string;
    existingCustomerDesc: string;
    existingCustomerLink: string;
    newCustomerTitle: string;
    newCustomerDesc: string;
    newCustomerLink: string;
    benefitsHeading: string;
    benefitsSubtext: string;
    highlights: PortalFeatureHighlight[];
  };
  adminEntry: {
    badgeText: string;
    portalScopeLabel: string;
    heading: string;
    description: string;
    policyTitle: string;
    policyDescription: string;
    loginButton: string;
    loginButtonAria: string;
    plannedModulesHeading: string;
    highlights: PortalFeatureHighlight[];
  };
  auth: AuthLanguageCopy & {
    authRequiredTitle: string;
    authRequiredAdminDesc: string;
    authRequiredCustomerDesc: string;
    forbiddenRoleTitle: string;
    forbiddenRoleAdminDesc: string;
    forbiddenRoleCustomerDesc: string;
    signInFailedTitle: string;
    authorizedPersonnelNoticeTitle: string;
    securityNoteTitle: string;
    customerSecurityNote: string;
    adminSecurityNote: string;
    firebaseUnconfiguredSignInError: string;
    firebaseUnconfiguredSignupError: string;
    firebaseAdminUnconfiguredError: string;
    serverRoleVerificationFailed: string;
    sessionInitFailedAfterSignup: string;
    signupBadge: string;
    signupTitle: string;
    signupSubtitle: string;
    registrationFailedTitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailAddressLabel: string;
    emailPlaceholder: string;
    mobileNumberLabel: string;
    mobilePlaceholder: string;
    passwordLabel: string;
    passwordHintShort: string;
    createPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordHint: string;
    confirmPasswordPlaceholder: string;
    termsPrefix: string;
    termsPlaceholderStrong: string;
    termsSuffix: string;
    createAccountButton: string;
    alreadyHaveAccountPrompt: string;
    loginToAccountLink: string;
  };
  validation: {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMinLength: string;
    fullNameRequired: string;
    fullNameMinLength: string;
    mobileRequired: string;
    mobileInvalid: string;
    confirmPasswordRequired: string;
    passwordsDoNotMatch: string;
    termsRequired: string;
    skuRequired: string;
    skuInvalid: string;
    productNameRequired: string;
    productNameLength: string;
    categoryRequired: string;
    categoryLength: string;
    shortDescRequired: string;
    shortDescLength: string;
    compositionRequired: string;
    compositionLength: string;
    targetCropsRequired: string;
    targetCropsMax: string;
    dosageRequired: string;
    dosageLength: string;
    packSizesRequired: string;
    packSizesMax: string;
    unitPriceInvalid: string;
    safetyMax: string;
    registrationMax: string;
    statusInvalid: string;
    cartProductUnavailable: string;
    cartPriceUnavailable: string;
    cartOutOfStock: string;
    cartInvalidQuantity: string;
    cartQuantityExceedsStock: (available: number) => string;
    deliveryNameRequired: string;
    deliveryNameLength: string;
    deliveryMobileRequired: string;
    deliveryMobileInvalid: string;
    deliveryAddressRequired: string;
    deliveryAddressLength: string;
    deliveryVillageOrCityRequired: string;
    deliveryVillageOrCityLength: string;
    deliveryDistrictRequired: string;
    deliveryDistrictLength: string;
    deliveryStateRequired: string;
    deliveryStateLength: string;
    deliveryPinCodeRequired: string;
    deliveryPinCodeInvalid: string;
    orderEmptyCart: string;
    orderForbiddenCustomerMismatch: string;
    orderInvalidPackSize: (productName: string) => string;
    orderProductUnavailable: (productName: string) => string;
    orderDuplicateSubmission: string;
    benefitsMax: string;
    youtubeUrlInvalid: string;
    companyNameRequired: string;
    companyRegistrationRequired: string;
    companyFacilityRequired: string;
    companyStreetRequired: string;
    companyCityRequired: string;
    companyDistrictRequired: string;
    companyStateRequired: string;
    companyPinCodeRequired: string;
    companyPinCodeInvalid: string;
    companyHelplineRequired: string;
    companyHelplineInvalid: string;
    companyEmailRequired: string;
    companyEmailInvalid: string;
  };
  firebaseErrors: {
    invalidCredential: string;
    emailInUse: string;
    weakPassword: string;
    userDisabled: string;
    tooManyRequests: string;
    networkError: string;
    defaultError: string;
    unexpectedError: string;
  };
  customerDashboard: {
    verifiedSessionBadge: string;
    welcomePrefix: string;
    subtitle: string;
    accountHolderLabel: string;
    registeredEmailLabel: string;
    mobileNumberLabel: string;
    roleAndStatusLabel: string;
    phaseNoticeTitle: string;
    phaseNoticeDescription: string;
    browseCatalogueButton: string;
    viewCartButton: (count: number) => string;
    myOrdersButton: string;
    modulesHeading: string;
    modulesSubtext: string;
    activePhaseBadge: string;
    plannedPhaseBadge: string;
    viewProductsButton: string;
    loadingMessage: string;
    companySectionHeading: string;
    companySectionSubtitle: string;
    verifiedFacilityBadge: string;
    facilityAddressLabel: string;
    helplineLabel: string;
    supportEmailLabel: string;
    officeHoursLabel: string;
    registrationDetailsLabel: string;
  };
  adminDashboard: {
    verifiedSessionBadge: string;
    heading: string;
    subtitle: string;
    adminNameLabel: string;
    authorizedEmailLabel: string;
    verifiedRoleStatusLabel: string;
    phaseNoticeTitle: string;
    phaseNoticeDescription: string;
    manageProductsButton: string;
    addNewProductButton: string;
    manageOrdersButton: string;
    modulesHeading: string;
    modulesSubtext: string;
    activePhaseBadge: string;
    plannedPhaseBadge: string;
    openProductManagementButton: string;
    openOrdersManagementButton: string;
    manageCompanyButton: string;
    companyModuleTitle: string;
    companyModuleDesc: string;
    loadingMessage: string;
  };
  customerProducts: {
    backToDashboard: string;
    viewCartButton: (count: number) => string;
    catalogueBadge: string;
    showingProductsCount: (count: number) => string;
    heading: string;
    subtitle: string;
    catalogueUnavailableTitle: string;
    catalogueUnavailableDesc: string;
    loadingMessage: string;
    emptyTitle: string;
    emptyDescription: string;
    searchLabel: string;
    searchPlaceholder: string;
    categoryFilterLabel: string;
    allCategoriesOption: (count: number) => string;
    availabilityFilterLabel: string;
    allAvailabilityOption: string;
    inStockOnlyOption: string;
    noFilterMatch: string;
    resetFiltersButton: string;
    indicativeUnitPriceLabel: string;
    activeCompositionLabel: string;
    approvedCropsLabel: string;
    packSizesLabel: string;
    viewSpecificationsButton: string;
    viewDetailsButton: string;
    inStockBadge: string;
    inStockWithQtyBadge: (qty: number) => string;
    outOfStockBadge: string;
    enquiryOnlyBadge: string;
    addToCartButton: string;
    addedToCartFeedback: string;
    inCartCountBadge: (qty: number) => string;
    productImageAlt: (name: string) => string;
    noImagePlaceholder: string;
  };
  customerProductDetail: {
    backToCatalogue: string;
    viewCartButton: (count: number) => string;
    indicativeUnitPriceLabel: string;
    activeCompositionHeading: string;
    dosageHeading: string;
    approvedCropsHeading: string;
    packSizesHeading: string;
    safetyHeading: string;
    safetyNotSpecified: string;
    loadingMessage: string;
    inStockBadge: string;
    inStockWithQtyBadge: (qty: number) => string;
    outOfStockBadge: string;
    enquiryOnlyBadge: string;
    purchaseSectionHeading: string;
    purchaseSectionSubtitle: string;
    selectPackSizeLabel: string;
    quantityLabel: string;
    availableStockHint: (maxQty: number) => string;
    lineSubtotalLabel: string;
    addToCartButton: string;
    addedToCartSuccessTitle: string;
    addedToCartSuccessDesc: (name: string, qty: number) => string;
    goToCartButton: string;
    alreadyInCartLabel: (qty: number) => string;
    outOfStockPurchaseNotice: string;
    enquiryOnlyPurchaseNotice: string;
    decreaseQuantityAria: string;
    increaseQuantityAria: string;
    benefitsHeading: string;
    applicationMethodHeading: string;
    modeOfActionHeading: string;
    compatibilityHeading: string;
    videoTutorialHeading: string;
    videoTutorialSubtitle: string;
    videoUnavailableNotice: string;
    watchOnYouTubeButton: string;
  };
  customerCart: {
    backToCatalogue: string;
    backToDashboard: string;
    cartBadge: string;
    heading: string;
    subtitle: string;
    loadingMessage: string;
    emptyTitle: string;
    emptyDescription: string;
    browseProductsButton: string;
    clearCartButton: string;
    itemCountSummary: (totalItems: number, uniqueItems: number) => string;
    packSizeLabel: string;
    unitPriceLabel: string;
    quantityLabel: string;
    lineSubtotalLabel: string;
    removeButton: string;
    removeItemAria: (name: string) => string;
    decreaseQuantityAria: (name: string) => string;
    increaseQuantityAria: (name: string) => string;
    maxStockLabel: (maxQty: number) => string;
    summaryHeading: string;
    uniqueProductsLabel: string;
    totalUnitsLabel: string;
    subtotalLabel: string;
    estimatedTotalLabel: string;
    priceAuthorityNote: string;
    revalidateButton: string;
    revalidatingButton: string;
    proceedToCheckoutButton: string;
    revalidationIssuesTitle: string;
    revalidationVerifiedTitle: string;
    revalidationVerifiedDesc: string;
    checkoutNextPhaseTitle: string;
    checkoutNextPhaseDesc: string;
    revalidationFailedTitle: string;
    revalidationFailedDesc: string;
    issueRemovedInactive: (name: string) => string;
    issueOutOfStock: (name: string) => string;
    issuePriceUnavailable: (name: string) => string;
    issuePriceUpdated: (
      name: string,
      oldPrice: string,
      newPrice: string
    ) => string;
    issueQuantityAdjusted: (
      name: string,
      requested: number,
      available: number
    ) => string;
    issueInvalidQuantity: (name: string) => string;
  };
  customerCheckout: {
    backToCart: string;
    backToCatalogue: string;
    backToDashboard: string;
    checkoutBadge: string;
    heading: string;
    subtitle: string;
    loadingMessage: string;
    emptyCartTitle: string;
    emptyCartDescription: string;
    browseProductsButton: string;
    returnToCartButton: string;
    deliverySectionHeading: string;
    deliverySectionSubtitle: string;
    prefilledProfileNotice: string;
    customerNameLabel: string;
    customerNamePlaceholder: string;
    mobileLabel: string;
    mobilePlaceholder: string;
    addressLineLabel: string;
    addressLinePlaceholder: string;
    villageOrCityLabel: string;
    villageOrCityPlaceholder: string;
    districtLabel: string;
    districtPlaceholder: string;
    stateLabel: string;
    statePlaceholder: string;
    pinCodeLabel: string;
    pinCodePlaceholder: string;
    orderItemsHeading: string;
    packSizeLabel: string;
    quantityLabel: string;
    unitPriceLabel: string;
    lineSubtotalLabel: string;
    summaryHeading: string;
    uniqueProductsLabel: string;
    totalUnitsLabel: string;
    subtotalLabel: string;
    payableAmountLabel: string;
    serverAuthorityNotice: string;
    paymentPendingNoticeTitle: string;
    paymentPendingNoticeDesc: string;
    placeOrderButton: string;
    placingOrderButton: string;
    revalidatingBeforeOrderNotice: string;
    submissionErrorTitle: string;
    submissionErrorFallback: string;
    networkErrorDesc: string;
    cartChangedErrorDesc: string;
    confirmationBadge: string;
    confirmationHeading: string;
    confirmationSubtitle: string;
    orderNumberLabel: string;
    orderIdLabel: string;
    orderCreatedAtLabel: string;
    orderStatusLabel: string;
    paymentStatusLabel: string;
    statusPendingVerification: string;
    statusConfirmed: string;
    statusRejected: string;
    statusCancelled: string;
    paymentStatusUnpaid: string;
    paymentStatusPending: string;
    paymentStatusPaid: string;
    paymentStatusFailed: string;
    verificationExplainTitle: string;
    verificationExplainDesc: string;
    deliverySummaryHeading: string;
    orderedItemsHeading: string;
    continueShoppingButton: string;
    goToDashboardButton: string;
    orderNotFoundTitle: string;
    orderNotFoundDesc: string;
  };
  customerOrders: {
    backToDashboard: string;
    badge: string;
    heading: string;
    subtitle: string;
    myOrdersButton: string;
    viewAllOrdersButton: string;
    browseCatalogueButton: string;
    orderNumberLabel: string;
    orderIdLabel: string;
    orderDateLabel: string;
    itemsSummaryHeading: string;
    totalQuantityLabel: string;
    totalAmountLabel: string;
    orderStatusLabel: string;
    paymentStatusLabel: string;
    viewDetailsButton: string;
    emptyTitle: string;
    emptyDescription: string;
    loadingMessage: string;
    errorMessage: string;
    retryButton: string;
    statusPendingVerification: string;
    statusConfirmed: string;
    statusRejected: string;
    statusCancelled: string;
    paymentStatusUnpaid: string;
    paymentStatusPending: string;
    paymentStatusPaid: string;
    paymentStatusFailed: string;
  };
  adminProducts: {
    backToDashboard: string;
    signedInAsPrefix: string;
    adminLabelPrefix: string;
    catalogueBadge: string;
    heading: string;
    subtitle: string;
    addNewProductButton: string;
    totalProductsLabel: string;
    activeVisibleLabel: string;
    draftRecordsLabel: string;
    archivedRecordsLabel: string;
    dbErrorTitle: string;
    dbErrorDesc: string;
    emptyTitle: string;
    emptyDescription: string;
    createFirstProductButton: string;
    targetCropsLabel: string;
    packSizesLabel: string;
    viewAndEditButton: string;
    statusActivePublished: string;
    statusActiveVisible: string;
    statusDraft: string;
    statusDraftInternal: string;
    statusArchived: string;
    statusArchivedHidden: string;
    backToProductManagement: string;
    approvedTargetCropsLabel: string;
    availablePackSizesLabel: string;
    unitPriceLabel: string;
    lastUpdatedLabel: string;
    loadingListMessage: string;
    loadingDetailMessage: string;
    verifyingAdminMessage: string;
  };
  adminProductForm: {
    createHeading: string;
    editHeading: string;
    subtitle: string;
    backToListLink: string;
    saveFailedTitle: string;
    saveFailedFallback: string;
    networkSaveError: string;
    deleteFailedFallback: string;
    networkDeleteError: string;
    productSavedTitle: string;
    productSavedMessage: string;
    skuLabel: string;
    skuHint: string;
    skuPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    statusLabel: string;
    statusHint: string;
    categoryLabel: string;
    categoryHint: string;
    categoryPlaceholder: string;
    unitPriceLabel: string;
    unitPriceHint: string;
    unitPricePlaceholder: string;
    registrationLabel: string;
    registrationHint: string;
    registrationPlaceholder: string;
    shortDescLabel: string;
    shortDescHint: string;
    shortDescPlaceholder: string;
    compositionLabel: string;
    compositionHint: string;
    compositionPlaceholder: string;
    targetCropsLabel: string;
    targetCropsHint: string;
    targetCropsPlaceholder: string;
    packSizesLabel: string;
    packSizesHint: string;
    packSizesPlaceholder: string;
    dosageLabel: string;
    dosageHint: string;
    dosagePlaceholder: string;
    safetyLabel: string;
    safetyHint: string;
    safetyPlaceholder: string;
    createSubmitButton: string;
    editSubmitButton: string;
    deleteProductButton: string;
    confirmDeletePrompt: string;
    confirmDeleteYes: string;
    confirmDeleteNo: string;
    benefitsLabel: string;
    benefitsHint: string;
    benefitsPlaceholder: string;
    applicationMethodLabel: string;
    applicationMethodHint: string;
    applicationMethodPlaceholder: string;
    modeOfActionLabel: string;
    modeOfActionHint: string;
    modeOfActionPlaceholder: string;
    compatibilityLabel: string;
    compatibilityHint: string;
    compatibilityPlaceholder: string;
    youtubeUrlLabel: string;
    youtubeUrlHint: string;
    youtubeUrlPlaceholder: string;
  };
  adminOrders: {
    backToDashboard: string;
    backToOrdersList: string;
    signedInAsPrefix: string;
    badge: string;
    heading: string;
    subtitle: string;
    detailHeading: string;
    detailSubtitle: string;
    totalOrdersLabel: string;
    pendingVerificationLabel: string;
    verifiedOrdersLabel: string;
    rejectedOrdersLabel: string;
    cancelledOrdersLabel: string;
    filterAll: string;
    filterPending: string;
    filterVerified: string;
    filterRejected: string;
    filterCancelled: string;
    emptyTitle: string;
    emptyDescription: string;
    dbErrorTitle: string;
    dbErrorDesc: string;
    orderRefLabel: string;
    orderDateLabel: string;
    customerHeading: string;
    customerNameLabel: string;
    customerEmailLabel: string;
    customerMobileLabel: string;
    customerUidLabel: string;
    deliveryAddressHeading: string;
    addressLineLabel: string;
    villageCityLabel: string;
    districtStateLabel: string;
    pinCodeLabel: string;
    productsHeading: string;
    productNameHeader: string;
    packSizeHeader: string;
    unitPriceHeader: string;
    quantityHeader: string;
    lineTotalHeader: string;
    itemsCountSummary: (count: number) => string;
    totalAmountLabel: string;
    orderStatusLabel: string;
    paymentStatusLabel: string;
    viewDetailsButton: string;
    verifyOrderButton: string;
    rejectOrderButton: string;
    confirmVerifyTitle: string;
    confirmVerifyMessage: (orderNumber: string) => string;
    confirmVerifyNote: string;
    confirmRejectTitle: string;
    confirmRejectMessage: (orderNumber: string) => string;
    rejectionReasonLabel: string;
    rejectionReasonPlaceholder: string;
    cancelActionButton: string;
    confirmVerifyAction: string;
    confirmRejectAction: string;
    processingAction: string;
    verificationSuccessNotice: (orderNumber: string) => string;
    rejectionSuccessNotice: (orderNumber: string) => string;
    auditVerificationHeading: string;
    verifiedByLabel: string;
    verifiedAtLabel: string;
    rejectedByLabel: string;
    rejectedAtLabel: string;
    rejectionReasonValueLabel: string;
    loadingListMessage: string;
    loadingDetailMessage: string;
    orderNotFoundTitle: string;
    orderNotFoundDesc: string;
  };
  companyProfile: {
    badge: string;
    heading: string;
    subtitle: string;
    backToDashboard: string;
    saveButton: string;
    savingButton: string;
    savedSuccessTitle: string;
    savedSuccessMessage: string;
    generalInfoHeading: string;
    companyNameLabel: string;
    companyNamePlaceholder: string;
    taglineLabel: string;
    taglinePlaceholder: string;
    aboutUsLabel: string;
    aboutUsPlaceholder: string;
    registrationNumberLabel: string;
    registrationNumberPlaceholder: string;
    facilityAddressHeading: string;
    facilityNameLabel: string;
    facilityNamePlaceholder: string;
    streetAddressLabel: string;
    streetAddressPlaceholder: string;
    villageOrCityLabel: string;
    villageOrCityPlaceholder: string;
    districtLabel: string;
    districtPlaceholder: string;
    stateLabel: string;
    statePlaceholder: string;
    pinCodeLabel: string;
    pinCodePlaceholder: string;
    contactHeading: string;
    helplinePhoneLabel: string;
    helplinePhonePlaceholder: string;
    supportEmailLabel: string;
    supportEmailPlaceholder: string;
    officeHoursLabel: string;
    officeHoursPlaceholder: string;
    dbErrorTitle: string;
    dbErrorDesc: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, SiteTranslations> = {
  en: {
    company: {
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
    },
    navigation: {
      primaryAriaLabel: "Primary navigation",
      items: [
        { label: "Home", href: "/" },
        { label: "Customer Portal", href: "/customer" },
        { label: "Admin Portal", href: "/admin" },
      ],
      headerSubtitle: "Agriculture Product Platform",
      customerPortalButton: "Customer Portal",
      customerPortalShort: "Customer",
      customerPortalAriaLabel: "Open Customer Portal Language Selection",
      adminPortalButton: "Admin Portal",
      adminPortalShort: "Admin",
      adminPortalAriaLabel: "Open Admin Portal Language Selection",
      languageSwitcherAriaLabel: "Select Website Language",
      languageLabel: "Language",
    },
    footer: {
      portalNavigationHeading: "Portal Navigation",
      companyInfoHeading: "Company Information Placeholders",
      facilityAddressLabel: "Facility & Office Address:",
      officialContactLabel: "Official Contact:",
      copyrightSuffix: "All rights reserved.",
    },
    common: {
      returnToHome: "Return to Home Page",
      home: "Home",
      signOut: "Sign Out",
      cancel: "Cancel",
      selected: "Selected",
      showPasswordAria: "Show password",
      hidePasswordAria: "Hide password",
      showConfirmPasswordAria: "Show confirm password",
      hideConfirmPasswordAria: "Hide confirm password",
      skuPrefix: "SKU",
      regPrefix: "Reg",
      regRefPrefix: "Reg. Ref",
      notProvided: "[Not Provided]",
      providedOnEnquiry: "Provided on Enquiry",
      activeStatus: "active",
      suspendedStatus: "suspended",
      customerRole: "customer",
      adminRole: "admin",
    },
    languageModal: {
      badgeLabel: "Language Preference",
      closeDialogAria: "Close language selection dialog",
      radioGroupAria: "Select preferred language",
      customerPortalBadge: "Customer Portal",
      adminPortalBadge: "Admin Portal",
    },
    landing: {
      selectPortalPrompt: "Select your portal below to get started.",
      illustrationAriaLabel: "Agricultural field and crop growth illustration",
      illustrationTitle: "Verified Agricultural Platform",
      illustrationSubtitle: "Quality Inputs • Guided Agronomy • Batch Traceability",
      choosePortalHeading: "Choose Your Portal to Proceed",
      customerCardBadge: "Farmers, Dealers & Buyers",
      customerCardTitle: "Customer Portal",
      customerCardDescription:
        "Access verified agricultural products, watch crop guidance videos, explore seasonal offers, manage orders, and download batch validation certificates.",
      customerCardButton: "Customer Login / Portal",
      customerCardButtonAria: "Select language and continue to Customer Login",
      adminCardBadge: "Authorized Personnel Only",
      adminCardTitle: "Admin Portal",
      adminCardDescription:
        "Dedicated administrative environment for managing product master records, manufacturing batches, order approvals, and validation certificates.",
      adminCardButton: "Admin Login / Portal",
      adminCardButtonAria: "Select language and continue to Admin Login",
      foundationEyebrow: "Platform Foundation",
      foundationHeading: "Built for Agricultural Quality & Clarity",
      foundationDisclaimer:
        "No fabricated claims or unverified product statistics. Official company information will populate these modules once provided.",
      trustPillars: [
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
      ],
    },
    customerEntry: {
      badgeText: "Customer & Dealer Portal",
      heading: "Welcome to the Customer Portal",
      description:
        "Whether you are a farmer, agricultural input dealer, or institutional buyer, sign in or create an account to browse verified products, view agricultural guidance videos, explore seasonal offers, and manage your orders after authentication.",
      loginButton: "Login to Your Account",
      loginButtonAria: "Select language and Login to Your Account",
      signupButton: "Create New Account",
      signupButtonAria: "Create New Account",
      existingCustomerTitle: "Existing Customer or Dealer?",
      existingCustomerDesc:
        "Sign in with your registered email address and password to access your orders and batch validation certificates.",
      existingCustomerLink: "Go to Customer Login",
      newCustomerTitle: "New to the Platform?",
      newCustomerDesc:
        "Set up your customer profile to prepare for product ordering, agronomy updates, and direct support.",
      newCustomerLink: "Go to Customer Registration",
      benefitsHeading:
        "Available Inside Your Customer Account (Post-Authentication)",
      benefitsSubtext:
        "Authentication and role-protected customer dashboard access are active in Phase 2. Catalogue, order, video, offer, and certificate modules will unlock in their scheduled phases.",
      highlights: [
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
      ],
    },
    adminEntry: {
      badgeText: "Authorized Company Personnel Only",
      portalScopeLabel: "Portal Scope: Operations & Administration",
      heading: "Manufacturing Administration Portal",
      description:
        "This portal is restricted to authorized company administrators and operations staff responsible for product master records, manufacturing batch traceability, order approvals, and validation certificate issuance.",
      policyTitle: "Administrative Access Policy",
      policyDescription:
        "Public registration is not available for administrator accounts. Administrative access is verified server-side using Firebase Authentication and Firebase Admin SDK role claims.",
      loginButton: "Continue to Admin Login",
      loginButtonAria: "Select language and Continue to Admin Login",
      plannedModulesHeading: "Planned Administrative Capabilities",
      highlights: [
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
      ],
    },
    auth: {
      selectedLanguageBadgeLabel: "Preferred Language",
      changeLanguageButtonLabel: "Change Language",
      modalTitleCustomer: "Select Language for Customer Portal",
      modalTitleAdmin: "Select Language for Admin Portal",
      modalSubtitleCustomer:
        "Choose your preferred language to continue to Customer Sign In.",
      modalSubtitleAdmin:
        "Choose your preferred language to continue to Administrator Sign In.",
      continueCustomerButton: "Continue to Customer Login",
      continueAdminButton: "Continue to Admin Login",
      cancelButton: "Cancel",
      customerLoginTitle: "Customer Sign In",
      customerLoginSubtitle:
        "Sign in to access your role-protected Customer Portal dashboard.",
      customerBadgeText: "Customer & Dealer Portal",
      adminLoginTitle: "Administrator Sign In",
      adminLoginSubtitle:
        "Restricted login for authorized manufacturing administrators.",
      adminBadgeText: "Authorized Company Personnel",
      emailLabelCustomer: "Email Address",
      emailLabelAdmin: "Authorized Administrator Email",
      emailHint: "Enter your registered email address.",
      passwordLabel: "Password",
      passwordHint: "Minimum 8 characters required.",
      passwordPlaceholder: "Enter your password",
      customerSubmitButton: "Login to Your Account",
      adminSubmitButton: "Sign In to Admin Portal",
      noCustomerAccountPrompt: "Don't have a customer account yet?",
      createNewAccountLink: "Create New Account",
      backToCustomerPortal: "Back to Customer Portal",
      backToAdminPortal: "Back to Admin Portal",
      homeLink: "Home",
      authRequiredTitle: "Authentication Required",
      authRequiredAdminDesc:
        "Please sign in with an authorized administrator account to access the Admin Dashboard.",
      authRequiredCustomerDesc:
        "Please sign in to your customer account to access the Customer Dashboard.",
      forbiddenRoleTitle: "Role Authorization Required",
      forbiddenRoleAdminDesc:
        "Access denied: An authorized administrator role is required to view that page.",
      forbiddenRoleCustomerDesc:
        "Access denied: Please sign in with a customer account to view the Customer Portal.",
      signInFailedTitle: "Sign-In Failed",
      authorizedPersonnelNoticeTitle: "Authorized Personnel Notice",
      securityNoteTitle: "Security Note",
      customerSecurityNote:
        "Customer credentials are verified via Firebase Authentication and exchanged for an HttpOnly server-verified session cookie.",
      adminSecurityNote:
        "Public admin registration is disabled. Administrative authorization is verified on the server using Firebase Admin SDK session cookies and role claims.",
      firebaseUnconfiguredSignInError:
        "Firebase Client SDK is not configured. Populate NEXT_PUBLIC_FIREBASE_* and FIREBASE_ADMIN_* credentials in .env.local to enable live sign-in.",
      firebaseUnconfiguredSignupError:
        "Firebase Client SDK is not configured. Populate NEXT_PUBLIC_FIREBASE_* and FIREBASE_ADMIN_* credentials in .env.local to enable live account registration.",
      firebaseAdminUnconfiguredError:
        "Firebase Admin SDK is not configured on the server. Populate FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local.",
      serverRoleVerificationFailed:
        "Server-side role verification failed. Access was not granted.",
      sessionInitFailedAfterSignup:
        "Account was created, but server session initialization failed. Please sign in on the Customer Login page.",
      signupBadge: "Customer & Dealer Registration",
      signupTitle: "Create New Customer Account",
      signupSubtitle:
        "Register your customer profile to access your role-protected Customer Portal account.",
      registrationFailedTitle: "Registration Failed",
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      emailAddressLabel: "Email Address",
      emailPlaceholder: "name@example.com",
      mobileNumberLabel: "Mobile Number",
      mobilePlaceholder: "+91 98765 43210",
      passwordHintShort: "At least 8 characters.",
      createPasswordPlaceholder: "Create a password",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordHint: "Re-enter your password.",
      confirmPasswordPlaceholder: "Confirm password",
      termsPrefix: "I acknowledge the",
      termsPlaceholderStrong:
        "[Terms of Service & Privacy Policy Placeholder]",
      termsSuffix:
        "and confirm that my registration details are accurate.",
      createAccountButton: "Create Customer Account",
      alreadyHaveAccountPrompt: "Already have a customer account?",
      loginToAccountLink: "Login to Your Account",
    },
    validation: {
      emailRequired: "Email address is required.",
      emailInvalid:
        "Enter a valid email address (for example, name@domain.com).",
      passwordRequired: "Password is required.",
      passwordMinLength: "Password must be at least 8 characters long.",
      fullNameRequired: "Full name is required.",
      fullNameMinLength: "Enter your full name (at least 2 characters).",
      mobileRequired: "Mobile number is required.",
      mobileInvalid: "Enter a valid 10 to 15 digit mobile number.",
      confirmPasswordRequired: "Confirm your password.",
      passwordsDoNotMatch: "Passwords do not match.",
      termsRequired:
        "Please acknowledge the platform terms and privacy notice placeholder to continue.",
      skuRequired: "Product SKU / Code is required.",
      skuInvalid:
        "SKU must be 2 to 40 characters using letters, numbers, hyphens, underscores, or slashes.",
      productNameRequired: "Official product name is required.",
      productNameLength:
        "Product name must be between 2 and 140 characters.",
      categoryRequired: "Product category is required.",
      categoryLength: "Category must be between 2 and 80 characters.",
      shortDescRequired: "Short summary description is required.",
      shortDescLength:
        "Short description must be between 10 and 500 characters.",
      compositionRequired:
        "Active composition / technical specification is required.",
      compositionLength:
        "Composition specification must be between 3 and 1000 characters.",
      targetCropsRequired: "Specify at least one approved target crop.",
      targetCropsMax: "Provide at most 30 target crop entries.",
      dosageRequired: "Dosage and application instructions are required.",
      dosageLength:
        "Dosage and application instructions must be between 5 and 2000 characters.",
      packSizesRequired: "Specify at least one available packaging size.",
      packSizesMax: "Provide at most 20 packaging size entries.",
      unitPriceInvalid:
        "Unit price must be a valid non-negative number (or left blank if not applicable).",
      safetyMax:
        "Safety and storage guidelines cannot exceed 1500 characters.",
      registrationMax:
        "Statutory registration reference cannot exceed 120 characters.",
      statusInvalid:
        "Product status must be 'active', 'draft', or 'archived'.",
      cartProductUnavailable:
        "This product is not active or available for customer purchase.",
      cartPriceUnavailable:
        "Online cart ordering is unavailable because this product's price is provided upon enquiry.",
      cartOutOfStock:
        "This product is currently out of stock and cannot be added to the cart.",
      cartInvalidQuantity:
        "Please enter a valid whole-number quantity of at least 1.",
      cartQuantityExceedsStock: (available: number) =>
        `Requested quantity exceeds available stock (${available} unit${available === 1 ? "" : "s"} available).`,
      deliveryNameRequired: "Customer full name is required for delivery.",
      deliveryNameLength: "Customer full name must be between 2 and 120 characters.",
      deliveryMobileRequired: "Mobile number is required for delivery coordination.",
      deliveryMobileInvalid:
        "Enter a valid 10-digit Indian mobile number (with optional +91 prefix).",
      deliveryAddressRequired: "Delivery street/house/farm address is required.",
      deliveryAddressLength:
        "Delivery address must be between 5 and 300 characters.",
      deliveryVillageOrCityRequired: "Village or city name is required.",
      deliveryVillageOrCityLength:
        "Village or city name must be between 2 and 100 characters.",
      deliveryDistrictRequired: "District name is required.",
      deliveryDistrictLength:
        "District name must be between 2 and 100 characters.",
      deliveryStateRequired: "State name is required.",
      deliveryStateLength: "State name must be between 2 and 100 characters.",
      deliveryPinCodeRequired: "PIN code is required.",
      deliveryPinCodeInvalid: "Enter a valid 6-digit Indian PIN code.",
      orderEmptyCart:
        "Your shopping cart is empty. Please add at least one active product before placing an order.",
      orderForbiddenCustomerMismatch:
        "Order creation is restricted to your own authenticated customer account.",
      orderInvalidPackSize: (productName: string) =>
        `The selected pack size for "${productName}" is invalid or no longer available.`,
      orderProductUnavailable: (productName: string) =>
        `"${productName}" is no longer active or available for sale.`,
      orderDuplicateSubmission:
        "This order request has already been submitted. Duplicate order creation was prevented.",
      benefitsMax: "Benefits list must not exceed 20 items.",
      youtubeUrlInvalid:
        "Please enter a valid YouTube video URL (youtube.com or youtu.be).",
      companyNameRequired: "Company name is required.",
      companyRegistrationRequired:
        "Registration or license number is required.",
      companyFacilityRequired: "Facility or office name is required.",
      companyStreetRequired: "Street address is required.",
      companyCityRequired: "Village or city is required.",
      companyDistrictRequired: "District is required.",
      companyStateRequired: "State is required.",
      companyPinCodeRequired: "PIN code is required.",
      companyPinCodeInvalid: "Please enter a valid 6-digit Indian PIN code.",
      companyHelplineRequired: "Helpline phone number is required.",
      companyHelplineInvalid: "Please enter a valid phone number.",
      companyEmailRequired: "Support email address is required.",
      companyEmailInvalid: "Please enter a valid support email address.",
    },
    firebaseErrors: {
      invalidCredential:
        "Invalid email address or password. Please verify your credentials and try again.",
      emailInUse:
        "An account with this email address already exists. Please sign in instead.",
      weakPassword:
        "Password is too weak. Please enter at least 8 characters.",
      userDisabled:
        "This account has been disabled. Please contact company support.",
      tooManyRequests:
        "Too many unsuccessful attempts. Please wait a few minutes before trying again.",
      networkError:
        "Network error while contacting authentication service. Check your connection and try again.",
      defaultError:
        "Authentication request could not be completed. Please verify your credentials and configuration.",
      unexpectedError: "An unexpected authentication error occurred.",
    },
    customerDashboard: {
      verifiedSessionBadge: "Verified Customer Session",
      welcomePrefix: "Welcome,",
      subtitle:
        "Signed in to your role-protected Customer & Dealer Portal account.",
      accountHolderLabel: "Account Holder",
      registeredEmailLabel: "Registered Email",
      mobileNumberLabel: "Mobile Number",
      roleAndStatusLabel: "Role & Account Status",
      phaseNoticeTitle: "Phase 4.1 Customer Product Shopping Active",
      phaseNoticeDescription:
        "Your identity and customer role have been verified on the server using Firebase Admin SDK. You can browse active company products, inspect verified specifications, and manage your shopping cart with live price and stock validation. Checkout, payments, batch validation certificates, guidance videos, seasonal offers, and AI assistance remain scheduled for subsequent phases.",
      browseCatalogueButton: "Browse Product Catalogue",
      viewCartButton: (count: number) =>
        count > 0 ? `Shopping Cart (${count})` : "Shopping Cart",
      myOrdersButton: "My Orders",
      modulesHeading: "Customer Portal Modules",
      modulesSubtext:
        "Product Catalogue & Shopping Cart are active in Phase 4.1. Checkout, order history, videos, offers, certificates, and AI modules remain scheduled for subsequent phases.",
      activePhaseBadge: "Active in Phase 4.1",
      plannedPhaseBadge: "Planned Phase",
      viewProductsButton: "Shop Products",
      loadingMessage: "Verifying customer session and role permissions…",
      companySectionHeading: "Company & Manufacturing Facility",
      companySectionSubtitle:
        "Verified corporate identity, registered manufacturing facility, and official support channels.",
      verifiedFacilityBadge: "Verified Facility",
      facilityAddressLabel: "Manufacturing & Office Address",
      helplineLabel: "Official Helpline",
      supportEmailLabel: "Support Email",
      officeHoursLabel: "Office Hours",
      registrationDetailsLabel: "Registration & License",
    },
    adminDashboard: {
      verifiedSessionBadge: "Server-Verified Administrator Session",
      heading: "Manufacturing Administration Dashboard",
      subtitle:
        "Authenticated operations environment for authorized company personnel.",
      adminNameLabel: "Administrator Name",
      authorizedEmailLabel: "Authorized Email",
      verifiedRoleStatusLabel: "Verified Role & Status",
      phaseNoticeTitle: "Phase 3 Product Management Active",
      phaseNoticeDescription:
        "Administrative authorization is verified on the server via Firebase Admin SDK session cookie validation and RBAC checks. Product master management is active below. Manufacturing batch logs, order fulfilment workflows, and validation certificate issuance remain scheduled for subsequent phases.",
      manageProductsButton: "Manage Company Products",
      addNewProductButton: "Add New Product",
      manageOrdersButton: "Orders Management",
      modulesHeading: "Administrative Operations & Planned Modules",
      modulesSubtext:
        "Product Master Management is active in Phase 3. Batch, order, and certificate modules remain scheduled for Phases 4–7.",
      activePhaseBadge: "Active in Phase 3",
      plannedPhaseBadge: "Planned Phase",
      openProductManagementButton: "Open Product Management",
      openOrdersManagementButton: "Open Orders Management",
      manageCompanyButton: "Manage Company Profile",
      companyModuleTitle: "Company Profile & Facility Information",
      companyModuleDesc:
        "Manage verified company details, manufacturing facility address, official licenses, and customer helpline contacts.",
      loadingMessage:
        "Verifying administrator session and server role claims…",
    },
    customerProducts: {
      backToDashboard: "Back to Customer Dashboard",
      viewCartButton: (count: number) =>
        count > 0 ? `View Cart (${count})` : "View Cart",
      catalogueBadge: "Verified Company Product Catalogue",
      showingProductsCount: (count: number) =>
        `Showing ${count} Active Product${count === 1 ? "" : "s"}`,
      heading: "Official Agricultural Products & Shopping Catalogue",
      subtitle:
        "Explore company-verified formulations, approved crop categories, dosage instructions, stock availability, and add active products to your cart.",
      catalogueUnavailableTitle: "Catalogue Unavailable",
      catalogueUnavailableDesc:
        "Unable to load the published product catalogue at this moment. Please try again later.",
      loadingMessage: "Loading verified product catalogue…",
      emptyTitle: "No Active Products Published Yet",
      emptyDescription:
        "Verified company product listings will appear here automatically once published by the manufacturing administration team.",
      searchLabel: "Search by Product Name, SKU, Crop, or Composition",
      searchPlaceholder:
        "Search products, active ingredients, or approved crops…",
      categoryFilterLabel: "Filter by Category",
      allCategoriesOption: (count: number) => `All Categories (${count})`,
      availabilityFilterLabel: "Stock & Availability",
      allAvailabilityOption: "All Active Products",
      inStockOnlyOption: "Available for Cart Order",
      noFilterMatch: "No products matched your current filter criteria.",
      resetFiltersButton: "Reset Filters",
      indicativeUnitPriceLabel: "Unit Price",
      activeCompositionLabel: "Active Composition:",
      approvedCropsLabel: "Approved Crops:",
      packSizesLabel: "Pack Sizes:",
      viewSpecificationsButton: "View Details",
      viewDetailsButton: "View Details",
      inStockBadge: "In Stock",
      inStockWithQtyBadge: (qty: number) => `In Stock (${qty} available)`,
      outOfStockBadge: "Out of Stock",
      enquiryOnlyBadge: "Price on Enquiry",
      addToCartButton: "Add to Cart",
      addedToCartFeedback: "Added to Cart",
      inCartCountBadge: (qty: number) => `${qty} in Cart`,
      productImageAlt: (name: string) => `${name} product image`,
      noImagePlaceholder: "Verified Formulation Specification",
    },
    customerProductDetail: {
      backToCatalogue: "Back to Product Catalogue",
      viewCartButton: (count: number) =>
        count > 0 ? `View Cart (${count})` : "View Cart",
      indicativeUnitPriceLabel: "Unit Price",
      activeCompositionHeading: "Active Composition & Formulation",
      dosageHeading: "Usage, Dosage & Application Instructions",
      approvedCropsHeading: "Approved Target Crops",
      packSizesHeading: "Available Packaging Sizes",
      safetyHeading: "Safety Precautions & Storage Guidelines",
      safetyNotSpecified:
        "Follow standard agricultural input handling precautions and store in a cool, dry place away from direct sunlight.",
      loadingMessage: "Loading product specification details…",
      inStockBadge: "In Stock — Available for Order",
      inStockWithQtyBadge: (qty: number) =>
        `In Stock (${qty} unit${qty === 1 ? "" : "s"} available)`,
      outOfStockBadge: "Out of Stock",
      enquiryOnlyBadge: "Price Provided on Enquiry",
      purchaseSectionHeading: "Order & Add to Shopping Cart",
      purchaseSectionSubtitle:
        "Select your preferred pack size and quantity. Final prices and stock availability are revalidated on the server before checkout.",
      selectPackSizeLabel: "Select Pack Size",
      quantityLabel: "Order Quantity",
      availableStockHint: (maxQty: number) =>
        `Maximum available quantity per order: ${maxQty}`,
      lineSubtotalLabel: "Item Subtotal",
      addToCartButton: "Add to Cart",
      addedToCartSuccessTitle: "Added to Your Cart",
      addedToCartSuccessDesc: (name: string, qty: number) =>
        `${qty} unit${qty === 1 ? "" : "s"} of "${name}" added to your shopping cart.`,
      goToCartButton: "Go to Shopping Cart",
      alreadyInCartLabel: (qty: number) => `Currently in cart: ${qty}`,
      outOfStockPurchaseNotice:
        "This product is currently out of stock and unavailable for online cart ordering.",
      enquiryOnlyPurchaseNotice:
        "Unit pricing for this formulation is provided upon official enquiry. Online cart addition requires a published unit price.",
      decreaseQuantityAria: "Decrease quantity",
      increaseQuantityAria: "Increase quantity",
      benefitsHeading: "Key Benefits & Advantages",
      applicationMethodHeading: "Application Method & Timing",
      modeOfActionHeading: "Mode of Action",
      compatibilityHeading: "Compatibility Notice",
      videoTutorialHeading: "Product Tutorial & Guide",
      videoTutorialSubtitle:
        "Watch official demonstration and usage guidelines for best agronomic results.",
      videoUnavailableNotice:
        "Video guide is currently being prepared for this product.",
      watchOnYouTubeButton: "Watch on YouTube",
    },
    customerCart: {
      backToCatalogue: "Continue Shopping in Catalogue",
      backToDashboard: "Customer Dashboard",
      cartBadge: "Customer Shopping Cart",
      heading: "Your Shopping Cart",
      subtitle:
        "Review your selected agricultural products, adjust quantities, and revalidate live product availability and prices.",
      loadingMessage: "Loading your shopping cart and verifying product records…",
      emptyTitle: "Your Shopping Cart is Empty",
      emptyDescription:
        "Browse the verified product catalogue to inspect agricultural formulations and add active products to your cart.",
      browseProductsButton: "Browse Product Catalogue",
      clearCartButton: "Clear Cart",
      itemCountSummary: (totalItems: number, uniqueItems: number) =>
        `${totalItems} total unit${totalItems === 1 ? "" : "s"} across ${uniqueItems} product${uniqueItems === 1 ? "" : "s"}`,
      packSizeLabel: "Pack Size:",
      unitPriceLabel: "Verified Unit Price",
      quantityLabel: "Quantity",
      lineSubtotalLabel: "Subtotal",
      removeButton: "Remove",
      removeItemAria: (name: string) => `Remove ${name} from cart`,
      decreaseQuantityAria: (name: string) => `Decrease quantity for ${name}`,
      increaseQuantityAria: (name: string) => `Increase quantity for ${name}`,
      maxStockLabel: (maxQty: number) => `Max available: ${maxQty}`,
      summaryHeading: "Order Summary",
      uniqueProductsLabel: "Unique Products",
      totalUnitsLabel: "Total Units",
      subtotalLabel: "Validated Subtotal",
      estimatedTotalLabel: "Validated Total",
      priceAuthorityNote:
        "All subtotals and totals are calculated strictly using server-validated product prices. Client-side values are never treated as authoritative.",
      revalidateButton: "Revalidate Cart & Verify for Checkout",
      revalidatingButton: "Verifying Live Stock & Prices…",
      proceedToCheckoutButton: "Proceed to Secure Checkout",
      revalidationIssuesTitle: "Cart Updated to Match Live Product Catalogue",
      revalidationVerifiedTitle: "Cart Verified Against Live Server Catalogue",
      revalidationVerifiedDesc:
        "All products in your cart are active, in stock, and calculated using authoritative server unit prices.",
      checkoutNextPhaseTitle: "Checkout & Payment Scheduled for Next Phase",
      checkoutNextPhaseDesc:
        "Your shopping cart foundation and server-side price/stock revalidation are complete. Order creation and payment processing will be enabled in the next phase — no orders or charges have been created.",
      revalidationFailedTitle: "Unable to Verify Cart with Server",
      revalidationFailedDesc:
        "Could not complete live server revalidation at this moment. Please check your connection and try again.",
      issueRemovedInactive: (name: string) =>
        `"${name}" is no longer active in the published catalogue and was removed from your cart.`,
      issueOutOfStock: (name: string) =>
        `"${name}" is currently out of stock and was removed from your active cart total.`,
      issuePriceUnavailable: (name: string) =>
        `"${name}" no longer has a published online unit price and was removed from your cart.`,
      issuePriceUpdated: (
        name: string,
        oldPrice: string,
        newPrice: string
      ) =>
        `The unit price for "${name}" was updated from ${oldPrice} to the current official price of ${newPrice}.`,
      issueQuantityAdjusted: (
        name: string,
        requested: number,
        available: number
      ) =>
        `Quantity for "${name}" was adjusted from ${requested} to ${available} based on available stock.`,
      issueInvalidQuantity: (name: string) =>
        `Invalid quantity for "${name}" was reset to a valid amount.`,
    },
    customerCheckout: {
      backToCart: "Return to Shopping Cart",
      backToCatalogue: "Browse Product Catalogue",
      backToDashboard: "Customer Dashboard",
      checkoutBadge: "Customer Order Checkout",
      heading: "Secure Order Checkout",
      subtitle:
        "Review your server-validated cart items, enter your delivery address, and submit your order for official verification.",
      loadingMessage:
        "Loading your checkout summary and verifying live product prices…",
      emptyCartTitle: "No Items Available for Checkout",
      emptyCartDescription:
        "Your shopping cart is currently empty. Add active agricultural products to your cart before proceeding to checkout.",
      browseProductsButton: "Browse Product Catalogue",
      returnToCartButton: "Back to Shopping Cart",
      deliverySectionHeading: "Delivery & Contact Information",
      deliverySectionSubtitle:
        "Verify or update the recipient name, mobile number, and delivery location for this order.",
      prefilledProfileNotice:
        "Available contact details from your verified customer profile have been pre-filled below. You may review and update them for this order.",
      customerNameLabel: "Recipient Full Name",
      customerNamePlaceholder: "Enter recipient full name",
      mobileLabel: "Mobile Number",
      mobilePlaceholder: "10-digit mobile number",
      addressLineLabel: "Delivery Address (House / Farm / Landmark)",
      addressLinePlaceholder:
        "Enter house number, farm name, road, or nearby landmark",
      villageOrCityLabel: "Village / Town / City",
      villageOrCityPlaceholder: "Enter village, town, or city name",
      districtLabel: "District",
      districtPlaceholder: "Enter district name",
      stateLabel: "State",
      statePlaceholder: "Enter state name",
      pinCodeLabel: "PIN Code",
      pinCodePlaceholder: "6-digit PIN code",
      orderItemsHeading: "Selected Products for Order",
      packSizeLabel: "Pack Size:",
      quantityLabel: "Qty:",
      unitPriceLabel: "Unit Price:",
      lineSubtotalLabel: "Item Total",
      summaryHeading: "Final Order Summary",
      uniqueProductsLabel: "Selected Products",
      totalUnitsLabel: "Total Units",
      subtotalLabel: "Server-Validated Subtotal",
      payableAmountLabel: "Final Payable Amount",
      serverAuthorityNotice:
        "Every product status, pack size, stock quantity, unit price, subtotal, and final total is re-verified on the server before creating your order.",
      paymentPendingNoticeTitle: "Payment & Verification Status Policy",
      paymentPendingNoticeDesc:
        "Placing this order records your order with status 'Pending Verification' and payment status 'Unpaid'. Online payment collection and dispatch confirmation will occur only after verification.",
      placeOrderButton: "Place Order for Verification",
      placingOrderButton: "Validating & Creating Order…",
      revalidatingBeforeOrderNotice:
        "Verifying live stock and official prices with the server…",
      submissionErrorTitle: "Unable to Complete Order Submission",
      submissionErrorFallback:
        "Please review the highlighted fields or cart availability and try again.",
      networkErrorDesc:
        "A network error occurred while communicating with the order server. Please check your connection and try again.",
      cartChangedErrorDesc:
        "One or more items in your cart changed in price, stock, or availability. Your cart has been refreshed with the latest server data — please review before submitting again.",
      confirmationBadge: "Order Recorded — Pending Verification",
      confirmationHeading: "Your Order Has Been Recorded",
      confirmationSubtitle:
        "Thank you. Your order request has been securely saved and linked to your customer account.",
      orderNumberLabel: "Order Reference Number",
      orderIdLabel: "System Order ID",
      orderCreatedAtLabel: "Order Recorded On",
      orderStatusLabel: "Order Status",
      paymentStatusLabel: "Payment Status",
      statusPendingVerification: "Pending Verification",
      statusConfirmed: "Confirmed",
      statusRejected: "Rejected",
      statusCancelled: "Cancelled",
      paymentStatusUnpaid: "Unpaid (Payment Not Completed)",
      paymentStatusPending: "Payment Pending",
      paymentStatusPaid: "Paid",
      paymentStatusFailed: "Payment Failed",
      verificationExplainTitle:
        "Important: Payment & Dispatch Are Pending Verification",
      verificationExplainDesc:
        "Your order has been recorded with status 'Pending Verification' and payment status 'Unpaid'. No payment has been charged yet, and dispatch or delivery is not confirmed until payment and company order verification are completed.",
      deliverySummaryHeading: "Recorded Delivery Details",
      orderedItemsHeading: "Recorded Order Items & Verified Pricing",
      continueShoppingButton: "Continue Shopping in Catalogue",
      goToDashboardButton: "Return to Customer Dashboard",
      orderNotFoundTitle: "Order Record Not Found",
      orderNotFoundDesc:
        "The requested order could not be found or does not belong to your authenticated customer account.",
    },
    customerOrders: {
      backToDashboard: "Back to Dashboard",
      badge: "Verified Customer Orders",
      heading: "My Order History & Booking Verification",
      subtitle:
        "Review your submitted orders, verified quantities, delivery addresses, and official order verification statuses.",
      myOrdersButton: "My Orders",
      viewAllOrdersButton: "View All Orders",
      browseCatalogueButton: "Browse Product Catalogue",
      orderNumberLabel: "Order Ref",
      orderIdLabel: "System ID",
      orderDateLabel: "Placed On",
      itemsSummaryHeading: "Ordered Formulations",
      totalQuantityLabel: "Total Units",
      totalAmountLabel: "Payable Total",
      orderStatusLabel: "Order Status",
      paymentStatusLabel: "Payment Status",
      viewDetailsButton: "View Details",
      emptyTitle: "No Orders Placed Yet",
      emptyDescription:
        "You have not placed any orders yet. Browse our verified agricultural formulations catalogue to select products and book your first order.",
      loadingMessage: "Loading your verified order history…",
      errorMessage:
        "Unable to load your orders at this time. Please check your connection and try again.",
      retryButton: "Try Again",
      statusPendingVerification: "Pending Verification",
      statusConfirmed: "Verified / Confirmed",
      statusRejected: "Rejected",
      statusCancelled: "Cancelled",
      paymentStatusUnpaid: "Unpaid",
      paymentStatusPending: "Pending",
      paymentStatusPaid: "Paid",
      paymentStatusFailed: "Payment Failed",
    },
    adminProducts: {
      backToDashboard: "Back to Admin Dashboard",
      signedInAsPrefix: "Signed in as",
      adminLabelPrefix: "Admin:",
      catalogueBadge: "Phase 3 Product Master Catalogue",
      heading: "Company Product Management",
      subtitle:
        "Create, review, and update official company product formulations, target crop specifications, dosage guidelines, and customer catalogue visibility.",
      addNewProductButton: "Add New Product",
      totalProductsLabel: "Total Products",
      activeVisibleLabel: "Active (Customer Visible)",
      draftRecordsLabel: "Draft Records",
      archivedRecordsLabel: "Archived Records",
      dbErrorTitle: "Database Query Error",
      dbErrorDesc:
        "Unable to query the Firestore products collection. Verify your Firebase Admin credentials and Firestore database setup.",
      emptyTitle: "No Company Products Recorded Yet",
      emptyDescription:
        "No sample or fabricated products are pre-loaded. Click Add New Product to enter your first official company product record and technical specifications.",
      createFirstProductButton: "Create First Product Record",
      targetCropsLabel: "Target Crops:",
      packSizesLabel: "Pack Sizes:",
      viewAndEditButton: "View & Edit",
      statusActivePublished: "Active (Published)",
      statusActiveVisible: "Active (Visible to Customers)",
      statusDraft: "Draft",
      statusDraftInternal: "Draft (Internal Only)",
      statusArchived: "Archived",
      statusArchivedHidden: "Archived (Hidden)",
      backToProductManagement: "Back to Product Management",
      approvedTargetCropsLabel: "Approved Target Crops",
      availablePackSizesLabel: "Available Pack Sizes",
      unitPriceLabel: "Unit Price",
      lastUpdatedLabel: "Last Updated",
      loadingListMessage: "Loading product master records…",
      loadingDetailMessage: "Loading product record…",
      verifyingAdminMessage: "Verifying administrator session…",
    },
    adminProductForm: {
      createHeading: "Enter Official Product Specifications",
      editHeading: "Edit Product Master Record",
      subtitle:
        "Enter only verified company product details, active formulations, approved crop categories, and dosage instructions.",
      backToListLink: "Back to Product List",
      saveFailedTitle: "Save Failed",
      saveFailedFallback: "Unable to save product specification record.",
      networkSaveError:
        "Network error while saving product record. Please check your connection and try again.",
      deleteFailedFallback: "Failed to delete product record.",
      networkDeleteError: "Network error while deleting product record.",
      productSavedTitle: "Product Saved",
      productSavedMessage:
        "Product specifications and publication status updated in Firestore.",
      skuLabel: "Product Code / SKU",
      skuHint: "Unique company SKU code.",
      skuPlaceholder: "e.g., SKU-001",
      nameLabel: "Official Product Name",
      namePlaceholder: "Enter official company product name",
      statusLabel: "Publication Status",
      statusHint: "Active products appear in the Customer Portal.",
      categoryLabel: "Product Category",
      categoryHint: "Company-defined product classification.",
      categoryPlaceholder: "Enter category",
      unitPriceLabel: "Unit Price (INR — Optional)",
      unitPriceHint: "Leave blank if pricing is provided upon enquiry.",
      unitPricePlaceholder: "Optional unit price",
      registrationLabel: "Statutory / Registration Reference",
      registrationHint: "Optional license or registration number.",
      registrationPlaceholder: "Optional registration reference",
      shortDescLabel: "Short Summary Description",
      shortDescHint:
        "Concise overview displayed on product listing cards (10–500 characters).",
      shortDescPlaceholder:
        "Enter a clear, factual summary of the product",
      compositionLabel: "Active Composition & Technical Specifications",
      compositionHint:
        "Official chemical/biological formulation, active ingredients, and concentration breakdown.",
      compositionPlaceholder:
        "Enter verified composition and technical parameters",
      targetCropsLabel: "Approved Target Crops",
      targetCropsHint: "Separate multiple crops with commas.",
      targetCropsPlaceholder: "Comma-separated approved crops",
      packSizesLabel: "Available Pack Sizes",
      packSizesHint:
        "Separate multiple pack sizes with commas (e.g., 250 ml, 500 ml, 1 L).",
      packSizesPlaceholder: "Comma-separated packaging sizes",
      dosageLabel: "Dosage & Application Instructions",
      dosageHint:
        "Verified dosage per acre/hectare, dilution ratios, and stage of application.",
      dosagePlaceholder: "Enter official dosage and application method",
      safetyLabel:
        "Safety Precautions & Storage Instructions (Optional)",
      safetyHint:
        "Handling precautions, storage temperature, and label safety notes.",
      safetyPlaceholder: "Enter handling and storage instructions",
      createSubmitButton: "Create Product Record",
      editSubmitButton: "Save Product Changes",
      deleteProductButton: "Delete Product",
      confirmDeletePrompt: "Confirm permanent delete?",
      confirmDeleteYes: "Yes, Delete",
      confirmDeleteNo: "No",
      benefitsLabel: "Key Agronomic Benefits",
      benefitsHint: "Enter key benefits separated by newlines or commas",
      benefitsPlaceholder:
        "e.g., Enhances root development\nImproves drought tolerance",
      applicationMethodLabel: "Application Method",
      applicationMethodHint:
        "Foliar spray, drip irrigation, seed treatment, or soil application",
      applicationMethodPlaceholder:
        "e.g., Foliar spray during early vegetative stage",
      modeOfActionLabel: "Mode of Action",
      modeOfActionHint: "Biochemical or biological mechanism of action",
      modeOfActionPlaceholder:
        "e.g., Systemic absorption that stimulates metabolic enzymes",
      compatibilityLabel: "Compatibility Notice",
      compatibilityHint: "Tank mix recommendations and chemical compatibility",
      compatibilityPlaceholder:
        "e.g., Compatible with most fertilizers; avoid highly alkaline mixes",
      youtubeUrlLabel: "YouTube Tutorial URL",
      youtubeUrlHint:
        "Standard YouTube or youtu.be link for product demonstration",
      youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=...",
    },
    adminOrders: {
      backToDashboard: "Back to Admin Dashboard",
      backToOrdersList: "Back to Orders Management",
      signedInAsPrefix: "Signed in as",
      badge: "Phase 4.3 Order Management",
      heading: "Customer Orders Management",
      subtitle:
        "Review customer orders, verify agricultural formulation bookings, inspect delivery addresses, and manage order statuses.",
      detailHeading: "Order Review & Verification",
      detailSubtitle:
        "Inspect customer booking specifications, line items, verified recipient address, and authorize or reject booking.",
      totalOrdersLabel: "Total Orders",
      pendingVerificationLabel: "Pending Verification",
      verifiedOrdersLabel: "Verified Orders",
      rejectedOrdersLabel: "Rejected Orders",
      cancelledOrdersLabel: "Cancelled Orders",
      filterAll: "All Orders",
      filterPending: "Pending Verification",
      filterVerified: "Verified",
      filterRejected: "Rejected",
      filterCancelled: "Cancelled",
      emptyTitle: "No Orders Found",
      emptyDescription:
        "There are no customer orders matching the current filter. Newly submitted orders will appear here automatically.",
      dbErrorTitle: "Orders Database Unavailable",
      dbErrorDesc:
        "Unable to retrieve recorded customer orders from Firestore at this time.",
      orderRefLabel: "Order Reference",
      orderDateLabel: "Order Date",
      customerHeading: "Customer Details",
      customerNameLabel: "Recipient Name",
      customerEmailLabel: "Account Email",
      customerMobileLabel: "Contact Mobile",
      customerUidLabel: "Customer UID",
      deliveryAddressHeading: "Delivery Information",
      addressLineLabel: "Address Line",
      villageCityLabel: "Village / Town / City",
      districtStateLabel: "District & State",
      pinCodeLabel: "Postal PIN Code",
      productsHeading: "Ordered Formulations & Quantities",
      productNameHeader: "Product Name",
      packSizeHeader: "Pack Size",
      unitPriceHeader: "Unit Price",
      quantityHeader: "Qty",
      lineTotalHeader: "Line Total",
      itemsCountSummary: (count: number) =>
        `${count} ${count === 1 ? "formulation item" : "formulation items"}`,
      totalAmountLabel: "Total Order Amount",
      orderStatusLabel: "Order Status",
      paymentStatusLabel: "Payment Status",
      viewDetailsButton: "Review Details",
      verifyOrderButton: "Verify Order",
      rejectOrderButton: "Reject Order",
      confirmVerifyTitle: "Confirm Order Verification",
      confirmVerifyMessage: (orderNumber: string) =>
        `Are you sure you want to verify order ${orderNumber}? This confirms stock availability and approves the order for subsequent processing.`,
      confirmVerifyNote:
        "Note: Order verification confirms legitimacy and does NOT mark payment as paid. Payment status remains independent.",
      confirmRejectTitle: "Confirm Order Rejection",
      confirmRejectMessage: (orderNumber: string) =>
        `Are you sure you want to reject order ${orderNumber}? This will mark the booking as rejected.`,
      rejectionReasonLabel: "Rejection Reason (Optional)",
      rejectionReasonPlaceholder:
        "e.g., Delivery area unserviceable, requested by customer, or duplicate booking",
      cancelActionButton: "Cancel",
      confirmVerifyAction: "Yes, Verify Order",
      confirmRejectAction: "Yes, Reject Order",
      processingAction: "Processing…",
      verificationSuccessNotice: (orderNumber: string) =>
        `Order ${orderNumber} has been verified successfully.`,
      rejectionSuccessNotice: (orderNumber: string) =>
        `Order ${orderNumber} has been rejected.`,
      auditVerificationHeading: "Verification & Audit Details",
      verifiedByLabel: "Verified By (Admin UID)",
      verifiedAtLabel: "Verified Timestamp",
      rejectedByLabel: "Rejected By (Admin UID)",
      rejectedAtLabel: "Rejected Timestamp",
      rejectionReasonValueLabel: "Recorded Reason",
      loadingListMessage: "Loading customer orders from Firestore…",
      loadingDetailMessage: "Loading order and delivery details…",
      orderNotFoundTitle: "Order Record Not Found",
      orderNotFoundDesc:
        "The requested order could not be located in the database.",
    },
    companyProfile: {
      badge: "Verified Administration",
      heading: "Company Profile Management",
      subtitle:
        "Update verified company identity, registered manufacturing facility address, and official contact channels.",
      backToDashboard: "Back to Dashboard",
      saveButton: "Save Company Profile",
      savingButton: "Saving Profile…",
      savedSuccessTitle: "Company Profile Saved",
      savedSuccessMessage:
        "Company and facility details have been securely updated.",
      generalInfoHeading: "General Company Information",
      companyNameLabel: "Company Name",
      companyNamePlaceholder: "e.g., Supriya Agrobiotech",
      taglineLabel: "Company Tagline / Subtitle",
      taglinePlaceholder: "e.g., Growing Better Agriculture, Together",
      aboutUsLabel: "About Company",
      aboutUsPlaceholder:
        "Brief overview of manufacturing capabilities and company mission",
      registrationNumberLabel: "Registration / License / GST Number",
      registrationNumberPlaceholder: "e.g., MH-AGRO-2026-001",
      facilityAddressHeading: "Manufacturing Facility & Office Address",
      facilityNameLabel: "Facility / Unit Name",
      facilityNamePlaceholder: "e.g., Manufacturing Plant & Research Unit",
      streetAddressLabel: "Street / Plot / Area",
      streetAddressPlaceholder: "e.g., Plot No. 12, MIDC Industrial Area",
      villageOrCityLabel: "Village / Town / City",
      villageOrCityPlaceholder: "e.g., Baramati",
      districtLabel: "District",
      districtPlaceholder: "e.g., Pune",
      stateLabel: "State",
      statePlaceholder: "e.g., Maharashtra",
      pinCodeLabel: "PIN Code",
      pinCodePlaceholder: "e.g., 413102",
      contactHeading: "Official Contact Channels",
      helplinePhoneLabel: "Customer Helpline Number",
      helplinePhonePlaceholder: "e.g., +91 9876543210",
      supportEmailLabel: "Official Support Email",
      supportEmailPlaceholder: "e.g., support@supriyaagrobiotech.com",
      officeHoursLabel: "Working Hours",
      officeHoursPlaceholder: "e.g., Mon - Sat: 9:00 AM - 6:00 PM",
      dbErrorTitle: "Unable to Load Company Profile",
      dbErrorDesc:
        "Failed to communicate with the Firestore database. Please try again later.",
    },
  },

  mr: {
    company: {
      companyName: "[Company Name Placeholder]",
      logoPlaceholderLabel: "कंपनी लोगो प्लेसहोल्डर",
      platformTitle: "कृषी उत्पादन निर्मिती डिजिटल प्लॅटफॉर्म",
      heroHeadline: "उत्तम शेतीचा विकास, आपल्या सर्वांच्या सहकार्याने",
      tagline:
        "प्रमाणित कृषी उत्पादने, पीक मार्गदर्शन, ऑर्डर व्यवस्थापन आणि बॅच प्रमाणन प्रमाणपत्रांसाठी एकच एकात्मिक डिजिटल प्लॅटफॉर्म.",
      noticeBanner:
        "टप्पा २ प्रमाणीकरण आणि भूमिका-आधारित प्रवेश (RBAC) सक्रिय — अधिकृत माहिती प्राप्त होईपर्यंत कंपनीची ओळख आणि उत्पादनाच्या नोंदी प्लेसहोल्डर म्हणून ठेवल्या आहेत.",
      registrationPlaceholder:
        "[उत्पादन परवाना / GST / ISO नोंदणी तपशील — अधिकृत कंपनी माहिती प्रलंबित]",
      addressPlaceholder:
        "[नोंदणीकृत उत्पादन प्रकल्प आणि कॉर्पोरेट कार्यालयाचा पत्ता — अधिकृत कंपनी माहिती प्रलंबित]",
      contactEmailPlaceholder: "[official-contact@company-domain.placeholder]",
      contactPhonePlaceholder: "[अधिकृत सहाय्य दूरध्वनी क्रमांक — माहिती प्रलंबित]",
    },
    navigation: {
      primaryAriaLabel: "मुख्य नेव्हिगेशन",
      items: [
        { label: "मुख्यपृष्ठ", href: "/" },
        { label: "ग्राहक पोर्टल", href: "/customer" },
        { label: "प्रशासक पोर्टल", href: "/admin" },
      ],
      headerSubtitle: "कृषी उत्पादन प्लॅटफॉर्म",
      customerPortalButton: "ग्राहक पोर्टल",
      customerPortalShort: "ग्राहक",
      customerPortalAriaLabel: "ग्राहक पोर्टल भाषा निवड उघडा",
      adminPortalButton: "प्रशासक पोर्टल",
      adminPortalShort: "प्रशासक",
      adminPortalAriaLabel: "प्रशासक पोर्टल भाषा निवड उघडा",
      languageSwitcherAriaLabel: "वेबसाइटची भाषा निवडा",
      languageLabel: "भाषा",
    },
    footer: {
      portalNavigationHeading: "पोर्टल नेव्हिगेशन",
      companyInfoHeading: "कंपनी माहिती प्लेसहोल्डर",
      facilityAddressLabel: "प्रकल्प आणि कार्यालयाचा पत्ता:",
      officialContactLabel: "अधिकृत संपर्क:",
      copyrightSuffix: "सर्व हक्क राखीव.",
    },
    common: {
      returnToHome: "मुख्यपृष्ठावर परत जा",
      home: "मुख्यपृष्ठ",
      signOut: "साइन आउट करा",
      cancel: "रद्द करा",
      selected: "निवडलेले",
      showPasswordAria: "पासवर्ड दाखवा",
      hidePasswordAria: "पासवर्ड लपवा",
      showConfirmPasswordAria: "पुष्टीकरण पासवर्ड दाखवा",
      hideConfirmPasswordAria: "पुष्टीकरण पासवर्ड लपवा",
      skuPrefix: "SKU",
      regPrefix: "नोंदणी",
      regRefPrefix: "नोंदणी संदर्भ",
      notProvided: "[उपलब्ध नाही]",
      providedOnEnquiry: "चौकशीनुसार उपलब्ध",
      activeStatus: "सक्रिय (active)",
      suspendedStatus: "निलंबित (suspended)",
      customerRole: "ग्राहक (customer)",
      adminRole: "प्रशासक (admin)",
    },
    languageModal: {
      badgeLabel: "भाषा पसंती",
      closeDialogAria: "भाषा निवड संवाद बंद करा",
      radioGroupAria: "पसंतीची भाषा निवडा",
      customerPortalBadge: "ग्राहक पोर्टल",
      adminPortalBadge: "प्रशासक पोर्टल",
    },
    landing: {
      selectPortalPrompt: "सुरुवात करण्यासाठी खालीलपैकी तुमचे पोर्टल निवडा.",
      illustrationAriaLabel: "कृषी क्षेत्र आणि पीक वाढीचे चित्रण",
      illustrationTitle: "प्रमाणित कृषी प्लॅटफॉर्म",
      illustrationSubtitle: "दर्जेदार निविष्ठा • तज्ज्ञ कृषी मार्गदर्शन • बॅच ट्रेसबिलिटी",
      choosePortalHeading: "पुढे जाण्यासाठी तुमचे पोर्टल निवडा",
      customerCardBadge: "शेतकरी, विक्रेते आणि खरेदीदार",
      customerCardTitle: "ग्राहक पोर्टल",
      customerCardDescription:
        "प्रमाणित कृषी उत्पादने पहा, पीक मार्गदर्शक व्हिडिओ पहा, हंगामी सवलती एक्सप्लोर करा, ऑर्डर व्यवस्थापित करा आणि बॅच प्रमाणन प्रमाणपत्रे डाउनलोड करा.",
      customerCardButton: "ग्राहक लॉगिन / पोर्टल",
      customerCardButtonAria: "भाषा निवडा आणि ग्राहक लॉगिनकडे पुढे जा",
      adminCardBadge: "केवळ अधिकृत कर्मचाऱ्यांसाठी",
      adminCardTitle: "प्रशासक पोर्टल",
      adminCardDescription:
        "उत्पादन मास्टर रेकॉर्ड, उत्पादन बॅचेस, ऑर्डर मंजुरी आणि प्रमाणन प्रमाणपत्रे व्यवस्थापित करण्यासाठी समर्पित प्रशासकीय विभाग.",
      adminCardButton: "प्रशासक लॉगिन / पोर्टल",
      adminCardButtonAria: "भाषा निवडा आणि प्रशासक लॉगिनकडे पुढे जा",
      foundationEyebrow: "प्लॅटफॉर्म पाया",
      foundationHeading: "कृषी गुणवत्ता आणि पारदर्शकतेसाठी निर्मित",
      foundationDisclaimer:
        "कोणतेही काल्पनिक दावे किंवा अप्रमाणित आकडेवारी नाही. अधिकृत कंपनी माहिती उपलब्ध झाल्यानंतर या विभागांमध्ये अद्ययावत केली जाईल.",
      trustPillars: [
        {
          id: "pillar-1",
          title: "बॅच-संलग्न गुणवत्ता ट्रेसबिलिटी",
          description:
            "पूर्ण झालेल्या प्रत्येक ऑर्डरला संबंधित उत्पादन बॅचच्या प्रमाणन प्रमाणपत्राशी जोडण्यासाठी विशेष रचना.",
        },
        {
          id: "pillar-2",
          title: "प्रत्यक्ष कृषी मार्गदर्शन",
          description:
            "स्पष्ट पीक वापर सूचना, मार्गदर्शक व्हिडिओ आणि प्रमाणित उत्पादन माहितीवर आधारित रचना.",
        },
        {
          id: "pillar-3",
          title: "पारदर्शक कंपनी प्लेसहोल्डर",
          description:
            "अधिकृत माहिती पुरवली जाईपर्यंत सर्व कॉर्पोरेट तपशील, पत्ते आणि उत्पादन यादी स्पष्ट प्लेसहोल्डर म्हणून ठेवले आहेत.",
        },
      ],
    },
    customerEntry: {
      badgeText: "ग्राहक आणि विक्रेता पोर्टल",
      heading: "ग्राहक पोर्टलमध्ये आपले स्वागत आहे",
      description:
        "तुम्ही शेतकरी, कृषी निविष्ठा विक्रेते किंवा संस्थात्मक खरेदीदार असाल, तर प्रमाणित उत्पादने पाहण्यासाठी, कृषी मार्गदर्शक व्हिडिओ पाहण्यासाठी, हंगामी सवलती जाणून घेण्यासाठी आणि लॉगिननंतर तुमच्या ऑर्डर व्यवस्थापित करण्यासाठी साइन इन करा किंवा नवीन खाते तयार करा.",
      loginButton: "तुमच्या खात्यात लॉगिन करा",
      loginButtonAria: "भाषा निवडा आणि तुमच्या खात्यात लॉगिन करा",
      signupButton: "नवीन खाते तयार करा",
      signupButtonAria: "नवीन खाते तयार करा",
      existingCustomerTitle: "विद्यमान ग्राहक किंवा विक्रेते आहात?",
      existingCustomerDesc:
        "तुमच्या ऑर्डर आणि बॅच प्रमाणन प्रमाणपत्रे पाहण्यासाठी नोंदणीकृत ईमेल पत्ता आणि पासवर्ड वापरून साइन इन करा.",
      existingCustomerLink: "ग्राहक लॉगिनकडे जा",
      newCustomerTitle: "प्लॅटफॉर्मवर नवीन आहात?",
      newCustomerDesc:
        "उत्पादन ऑर्डरिंग, कृषी अद्यतने आणि थेट सहाय्यासाठी तुमचे ग्राहक प्रोफाइल तयार करा.",
      newCustomerLink: "ग्राहक नोंदणीकडे जा",
      benefitsHeading:
        "तुमच्या ग्राहक खात्यात उपलब्ध सुविधा (लॉगिननंतर)",
      benefitsSubtext:
        "टप्पा २ मध्ये प्रमाणीकरण आणि सुरक्षित ग्राहक डॅशबोर्ड प्रवेश सक्रिय आहे. उत्पादन कॅटलॉग, ऑर्डर, व्हिडिओ, ऑफर्स आणि प्रमाणपत्र सुविधा नियोजित टप्प्यांमध्ये खुल्या होतील.",
      highlights: [
        {
          id: "cust-feat-1",
          title: "प्रमाणित उत्पादने पहा",
          description:
            "कॅटलॉग माहिती प्रकाशित झाल्यानंतर अधिकृत कृषी निविष्ठा, पॅक आकार आणि वापर तपशील पहा.",
        },
        {
          id: "cust-feat-2",
          title: "कृषी मार्गदर्शक व्हिडिओ आणि माहिती",
          description:
            "कंपनीच्या तज्ज्ञांनी तयार केलेले पीक-काळजी मार्गदर्शक व्हिडिओ आणि प्रत्यक्ष वापराच्या सूचना मिळवा.",
        },
        {
          id: "cust-feat-3",
          title: "हंगामी ऑफर्स आणि विक्रेता योजना",
          description:
            "तुमच्या खात्यात पारदर्शक किंमत अद्यतने, हंगामी सवलती आणि पात्र ऑर्डर लाभ पहा.",
        },
        {
          id: "cust-feat-4",
          title: "ऑर्डर आणि बॅच प्रमाणपत्रे",
          description:
            "ऑर्डर पूर्णत्वाची स्थिती ट्रॅक करा आणि प्रत्येक वितरणासाठी बॅच-संलग्न प्रमाणन प्रमाणपत्रे डाउनलोड करा.",
        },
      ],
    },
    adminEntry: {
      badgeText: "केवळ अधिकृत कंपनी कर्मचाऱ्यांसाठी",
      portalScopeLabel: "पोर्टल व्याप्ती: कार्यप्रणाली आणि प्रशासन",
      heading: "उत्पादन प्रशासन पोर्टल",
      description:
        "हे पोर्टल केवळ अधिकृत कंपनी प्रशासक आणि ऑपरेशन कर्मचाऱ्यांसाठी राखीव आहे, जे उत्पादन मास्टर रेकॉर्ड, बॅच ट्रेसबिलिटी, ऑर्डर मंजुरी आणि प्रमाणन प्रमाणपत्र वितरणाचे काम पाहतात.",
      policyTitle: "प्रशासकीय प्रवेश धोरण",
      policyDescription:
        "प्रशासक खात्यांसाठी सार्वजनिक नोंदणी उपलब्ध नाही. Firebase Authentication आणि Firebase Admin SDK रोल क्लेम्स वापरून सर्व्हरवर प्रशासकीय प्रवेश तपासून पाहिला जातो.",
      loginButton: "प्रशासक लॉगिनकडे पुढे जा",
      loginButtonAria: "भाषा निवडा आणि प्रशासक लॉगिनकडे पुढे जा",
      plannedModulesHeading: "नियोजित प्रशासकीय क्षमता",
      highlights: [
        {
          id: "adm-feat-1",
          title: "उत्पादन आणि बॅच नियंत्रण",
          description:
            "प्रमाणित उत्पादन तपशील, उत्पादन बॅच नोंदी आणि गुणवत्ता दस्तऐवज व्यवस्थापित करा.",
        },
        {
          id: "adm-feat-2",
          title: "ऑर्डर आणि वितरण व्यवस्थापन",
          description:
            "ग्राहक ऑर्डरचे परीक्षण करा, उत्पादन बॅचेसचे वाटप करा आणि डिस्पॅच टप्पे समन्वित करा.",
        },
        {
          id: "adm-feat-3",
          title: "प्रमाणन प्रमाणपत्र वितरण",
          description:
            "पूर्ण झालेल्या बॅचेस आणि ग्राहक ऑर्डरला अधिकृत प्रयोगशाळा प्रमाणन प्रमाणपत्रे जोडा.",
        },
      ],
    },
    auth: {
      selectedLanguageBadgeLabel: "निवडलेली भाषा",
      changeLanguageButtonLabel: "भाषा बदला",
      modalTitleCustomer: "ग्राहक पोर्टलसाठी भाषा निवडा",
      modalTitleAdmin: "प्रशासक पोर्टलसाठी भाषा निवडा",
      modalSubtitleCustomer:
        "ग्राहक लॉगिन पृष्ठावर जाण्यासाठी तुमची पसंतीची भाषा निवडा.",
      modalSubtitleAdmin:
        "प्रशासक लॉगिन पृष्ठावर जाण्यासाठी तुमची पसंतीची भाषा निवडा.",
      continueCustomerButton: "ग्राहक लॉगिनकडे पुढे जा",
      continueAdminButton: "प्रशासक लॉगिनकडे पुढे जा",
      cancelButton: "रद्द करा",
      customerLoginTitle: "ग्राहक साइन इन",
      customerLoginSubtitle:
        "तुमच्या सुरक्षित ग्राहक पोर्टल डॅशबोर्डवर प्रवेश करण्यासाठी साइन इन करा.",
      customerBadgeText: "ग्राहक आणि विक्रेता पोर्टल",
      adminLoginTitle: "प्रशासक साइन इन",
      adminLoginSubtitle: "अधिकृत कंपनी प्रशासकांसाठी राखीव लॉगिन.",
      adminBadgeText: "अधिकृत कंपनी कर्मचारी",
      emailLabelCustomer: "ईमेल पत्ता",
      emailLabelAdmin: "अधिकृत प्रशासक ईमेल",
      emailHint: "तुमचा नोंदणीकृत ईमेल पत्ता प्रविष्ट करा.",
      passwordLabel: "पासवर्ड",
      passwordHint: "किमान ८ अक्षरे आवश्यक आहेत.",
      passwordPlaceholder: "तुमचा पासवर्ड प्रविष्ट करा",
      customerSubmitButton: "तुमच्या खात्यात लॉगिन करा",
      adminSubmitButton: "प्रशासक पोर्टलमध्ये साइन इन करा",
      noCustomerAccountPrompt: "अद्याप ग्राहक खाते नाही?",
      createNewAccountLink: "नवीन खाते तयार करा",
      backToCustomerPortal: "ग्राहक पोर्टलवर परत जा",
      backToAdminPortal: "प्रशासक पोर्टलवर परत जा",
      homeLink: "मुख्यपृष्ठ",
      authRequiredTitle: "प्रमाणीकरण आवश्यक आहे",
      authRequiredAdminDesc:
        "प्रशासक डॅशबोर्डवर प्रवेश करण्यासाठी कृपया अधिकृत प्रशासक खात्याने साइन इन करा.",
      authRequiredCustomerDesc:
        "ग्राहक डॅशबोर्डवर प्रवेश करण्यासाठी कृपया तुमच्या ग्राहक खात्यात साइन इन करा.",
      forbiddenRoleTitle: "भूमिका अधिकार आवश्यक",
      forbiddenRoleAdminDesc:
        "प्रवेश नाकारला: ते पृष्ठ पाहण्यासाठी अधिकृत प्रशासक भूमिका आवश्यक आहे.",
      forbiddenRoleCustomerDesc:
        "प्रवेश नाकारला: ग्राहक पोर्टल पाहण्यासाठी कृपया ग्राहक खात्याने साइन इन करा.",
      signInFailedTitle: "साइन-इन अयशस्वी",
      authorizedPersonnelNoticeTitle: "अधिकृत कर्मचारी सूचना",
      securityNoteTitle: "सुरक्षा टीप",
      customerSecurityNote:
        "ग्राहक तपशील Firebase Authentication द्वारे तपासले जातात आणि सर्व्हर-प्रमाणित HttpOnly सेशन कुकीमध्ये रूपांतरित केले जातात.",
      adminSecurityNote:
        "सार्वजनिक प्रशासक नोंदणी बंद आहे. Firebase Admin SDK सेशन कुकीज आणि रोल क्लेम्स वापरून सर्व्हरवर प्रशासकीय अधिकार तपासले जातात.",
      firebaseUnconfiguredSignInError:
        "Firebase Client SDK कॉन्फिगर केलेले नाही. थेट साइन-इन सुरू करण्यासाठी .env.local मध्ये NEXT_PUBLIC_FIREBASE_* आणि FIREBASE_ADMIN_* क्रेडेन्शियल्स भरा.",
      firebaseUnconfiguredSignupError:
        "Firebase Client SDK कॉन्फिगर केलेले नाही. थेट खाते नोंदणी सुरू करण्यासाठी .env.local मध्ये NEXT_PUBLIC_FIREBASE_* आणि FIREBASE_ADMIN_* क्रेडेन्शियल्स भरा.",
      firebaseAdminUnconfiguredError:
        "सर्व्हरवर Firebase Admin SDK कॉन्फिगर केलेले नाही. कृपया .env.local मध्ये FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL आणि FIREBASE_ADMIN_PRIVATE_KEY भरा.",
      serverRoleVerificationFailed:
        "सर्व्हर-साइड भूमिका तपासणी अयशस्वी झाली. प्रवेश मंजूर करण्यात आला नाही.",
      sessionInitFailedAfterSignup:
        "खाते तयार झाले, परंतु सर्व्हर सेशन सुरू होऊ शकले नाही. कृपया ग्राहक लॉगिन पृष्ठावर जाऊन साइन इन करा.",
      signupBadge: "ग्राहक आणि विक्रेता नोंदणी",
      signupTitle: "नवीन ग्राहक खाते तयार करा",
      signupSubtitle:
        "तुमच्या सुरक्षित ग्राहक पोर्टल खात्यावर प्रवेश मिळवण्यासाठी तुमचे ग्राहक प्रोफाइल नोंदणी करा.",
      registrationFailedTitle: "नोंदणी अयशस्वी",
      fullNameLabel: "पूर्ण नाव",
      fullNamePlaceholder: "तुमचे पूर्ण नाव प्रविष्ट करा",
      emailAddressLabel: "ईमेल पत्ता",
      emailPlaceholder: "name@example.com",
      mobileNumberLabel: "मोबाईल क्रमांक",
      mobilePlaceholder: "+91 98765 43210",
      passwordHintShort: "किमान ८ अक्षरे.",
      createPasswordPlaceholder: "पासवर्ड तयार करा",
      confirmPasswordLabel: "पासवर्डची पुष्टी करा",
      confirmPasswordHint: "तुमचा पासवर्ड पुन्हा प्रविष्ट करा.",
      confirmPasswordPlaceholder: "पासवर्डची पुष्टी करा",
      termsPrefix: "मी",
      termsPlaceholderStrong: "[सेवा अटी आणि गोपनीयता धोरण प्लेसहोल्डर]",
      termsSuffix:
        "मान्य करतो/करते आणि माझ्या नोंदणीचे तपशील अचूक असल्याची खात्री देतो/देते.",
      createAccountButton: "ग्राहक खाते तयार करा",
      alreadyHaveAccountPrompt: "आधीच ग्राहक खाते आहे का?",
      loginToAccountLink: "तुमच्या खात्यात लॉगिन करा",
    },
    validation: {
      emailRequired: "ईमेल पत्ता आवश्यक आहे.",
      emailInvalid: "कृपया वैध ईमेल पत्ता प्रविष्ट करा (उदा. name@domain.com).",
      passwordRequired: "पासवर्ड आवश्यक आहे.",
      passwordMinLength: "पासवर्ड किमान ८ अक्षरांचा असावा.",
      fullNameRequired: "पूर्ण नाव आवश्यक आहे.",
      fullNameMinLength: "तुमचे पूर्ण नाव प्रविष्ट करा (किमान २ अक्षरे).",
      mobileRequired: "मोबाईल क्रमांक आवश्यक आहे.",
      mobileInvalid: "कृपया १० ते १५ अंकांचा वैध मोबाईल क्रमांक प्रविष्ट करा.",
      confirmPasswordRequired: "कृपया तुमच्या पासवर्डची पुष्टी करा.",
      passwordsDoNotMatch: "दोन्ही पासवर्ड जुळत नाहीत.",
      termsRequired:
        "पुढे जाण्यासाठी कृपया प्लॅटफॉर्मच्या अटी आणि गोपनीयता धोरण प्लेसहोल्डर मान्य करा.",
      skuRequired: "उत्पादन SKU / कोड आवश्यक आहे.",
      skuInvalid:
        "SKU मध्ये अक्षरे, अंक, हायफन, अंडरस्कोर किंवा स्लॅश वापरून २ ते ४० अक्षरे असावीत.",
      productNameRequired: "अधिकृत उत्पादनाचे नाव आवश्यक आहे.",
      productNameLength: "उत्पादनाचे नाव २ ते १४० अक्षरांच्या दरम्यान असावे.",
      categoryRequired: "उत्पादन श्रेणी (Category) आवश्यक आहे.",
      categoryLength: "श्रेणी २ ते ८० अक्षरांच्या दरम्यान असावी.",
      shortDescRequired: "संक्षिप्त वर्णन आवश्यक आहे.",
      shortDescLength: "संक्षिप्त वर्णन १० ते ५०० अक्षरांच्या दरम्यान असावे.",
      compositionRequired: "सक्रिय घटक / तांत्रिक तपशील आवश्यक आहे.",
      compositionLength: "घटक तपशील ३ ते १००० अक्षरांच्या दरम्यान असावा.",
      targetCropsRequired: "किमान एक मंजूर लक्ष्य पीक नमूद करा.",
      targetCropsMax: "कमाल ३० लक्ष्य पिकांच्या नोंदी द्या.",
      dosageRequired: "मात्रा आणि वापरण्याच्या सूचना आवश्यक आहेत.",
      dosageLength:
        "मात्रा आणि वापरण्याच्या सूचना ५ ते २००० अक्षरांच्या दरम्यान असाव्यात.",
      packSizesRequired: "किमान एक उपलब्ध पॅकिंग आकार नमूद करा.",
      packSizesMax: "कमाल २० पॅकिंग आकारांच्या नोंदी द्या.",
      unitPriceInvalid:
        "प्रति युनिट किंमत वैध धन संख्या असावी (किंवा लागू नसल्यास रिकामी ठेवा).",
      safetyMax: "सुरक्षा आणि साठवणूक मार्गदर्शक तत्त्वे १५०० अक्षरांपेक्षा जास्त नसावीत.",
      registrationMax: "वैधानिक नोंदणी संदर्भ १२० अक्षरांपेक्षा जास्त नसावा.",
      statusInvalid:
        "उत्पादन स्थिती 'active', 'draft' किंवा 'archived' असणे आवश्यक आहे.",
      cartProductUnavailable:
        "हे उत्पादन सध्या सक्रिय नाही किंवा ग्राहक खरेदीसाठी उपलब्ध नाही.",
      cartPriceUnavailable:
        "या उत्पादनाची किंमत चौकशीनुसार उपलब्ध असल्याने ऑनलाइन कार्ट ऑर्डरिंग उपलब्ध नाही.",
      cartOutOfStock:
        "हे उत्पादन सध्या साठ्यात उपलब्ध नाही आणि कार्टमध्ये जोडता येत नाही.",
      cartInvalidQuantity:
        "कृपया किमान १ अशी वैध पूर्णांक संख्या (Quantity) प्रविष्ट करा.",
      cartQuantityExceedsStock: (available: number) =>
        `मागणी केलेली संख्या उपलब्ध साठ्यापेक्षा जास्त आहे (${available} नग उपलब्ध).`,
      deliveryNameRequired: "वितरणासाठी ग्राहकाचे पूर्ण नाव आवश्यक आहे.",
      deliveryNameLength: "ग्राहकाचे पूर्ण नाव २ ते १२० अक्षरांच्या दरम्यान असावे.",
      deliveryMobileRequired: "वितरण समन्वयासाठी मोबाईल क्रमांक आवश्यक आहे.",
      deliveryMobileInvalid:
        "कृपया वैध १०-अंकी भारतीय मोबाईल क्रमांक प्रविष्ट करा (ऐच्छिक +91 सह).",
      deliveryAddressRequired: "वितरणाचा संपूर्ण पत्ता (घर/शेत/गल्ली) आवश्यक आहे.",
      deliveryAddressLength: "वितरणाचा पत्ता ५ ते ३०० अक्षरांच्या दरम्यान असावा.",
      deliveryVillageOrCityRequired: "गाव किंवा शहराचे नाव आवश्यक आहे.",
      deliveryVillageOrCityLength:
        "गाव किंवा शहराचे नाव २ ते १०० अक्षरांच्या दरम्यान असावे.",
      deliveryDistrictRequired: "जिल्ह्याचे नाव आवश्यक आहे.",
      deliveryDistrictLength:
        "जिल्ह्याचे नाव २ ते १०० अक्षरांच्या दरम्यान असावे.",
      deliveryStateRequired: "राज्याचे नाव आवश्यक आहे.",
      deliveryStateLength: "राज्याचे नाव २ ते १०० अक्षरांच्या दरम्यान असावे.",
      deliveryPinCodeRequired: "पिन कोड (PIN Code) आवश्यक आहे.",
      deliveryPinCodeInvalid: "कृपया वैध ६-अंकी भारतीय पिन कोड प्रविष्ट करा.",
      orderEmptyCart:
        "तुमची शॉपिंग कार्ट रिकामी आहे. कृपया ऑर्डर देण्यापूर्वी किमान एक सक्रिय उत्पादन कार्टमध्ये जोडा.",
      orderForbiddenCustomerMismatch:
        "केवळ तुमच्या स्वतःच्या प्रमाणित ग्राहक खात्यासाठीच ऑर्डर तयार करता येते.",
      orderInvalidPackSize: (productName: string) =>
        `"${productName}" साठी निवडलेला पॅक आकार अवैध आहे किंवा आता उपलब्ध नाही.`,
      orderProductUnavailable: (productName: string) =>
        `"${productName}" आता सक्रिय नाही किंवा विक्रीसाठी उपलब्ध नाही.`,
      orderDuplicateSubmission:
        "ही ऑर्डर विनंती आधीच सबमिट केली गेली आहे. दुहेरी (Duplicate) ऑर्डर निर्मिती टाळण्यात आली आहे.",
      benefitsMax: "फायद्यांची यादी २० घटकांपेक्षा जास्त असू शकत नाही.",
      youtubeUrlInvalid:
        "कृपया वैध YouTube व्हिडिओ लिंक प्रविष्ट करा (youtube.com किंवा youtu.be).",
      companyNameRequired: "कंपनीचे नाव आवश्यक आहे.",
      companyRegistrationRequired:
        "नोंदणी किंवा परवाना क्रमांक आवश्यक आहे.",
      companyFacilityRequired: "कारखाना किंवा कार्यालयाचे नाव आवश्यक आहे.",
      companyStreetRequired: "पत्ता (रस्ता/गल्ली) आवश्यक आहे.",
      companyCityRequired: "गाव किंवा शहर आवश्यक आहे.",
      companyDistrictRequired: "जिल्हा आवश्यक आहे.",
      companyStateRequired: "राज्य आवश्यक आहे.",
      companyPinCodeRequired: "पिन कोड आवश्यक आहे.",
      companyPinCodeInvalid: "कृपया ६ अंकी वैध भारतीय पिन कोड प्रविष्ट करा.",
      companyHelplineRequired: "हेल्पलाइन फोन नंबर आवश्यक आहे.",
      companyHelplineInvalid: "कृपया वैध फोन नंबर प्रविष्ट करा.",
      companyEmailRequired: "सपोर्ट ईमेल पत्ता आवश्यक आहे.",
      companyEmailInvalid: "कृपया वैध सपोर्ट ईमेल पत्ता प्रविष्ट करा.",
    },
    firebaseErrors: {
      invalidCredential:
        "अवैध ईमेल पत्ता किंवा पासवर्ड. कृपया तुमचे तपशील तपासा आणि पुन्हा प्रयत्न करा.",
      emailInUse:
        "या ईमेल पत्त्यावर आधीच खाते अस्तित्वात आहे. कृपया साइन इन करा.",
      weakPassword: "पासवर्ड खूप कमकुवत आहे. कृपया किमान ८ अक्षरे प्रविष्ट करा.",
      userDisabled:
        "हे खाते निष्क्रिय करण्यात आले आहे. कृपया कंपनी सहाय्याशी संपर्क साधा.",
      tooManyRequests:
        "अनेक अयशस्वी प्रयत्न झाले आहेत. कृपया काही मिनिटे थांबून पुन्हा प्रयत्न करा.",
      networkError:
        "प्रमाणीकरण सेवेशी संपर्क साधताना नेटवर्क त्रुटी आली. कृपया इंटरनेट तपासा आणि पुन्हा प्रयत्न करा.",
      defaultError:
        "प्रमाणीकरण विनंती पूर्ण होऊ शकली नाही. कृपया तुमचे तपशील आणि कॉन्फिगरेशन तपासा.",
      unexpectedError: "अनपेक्षित प्रमाणीकरण त्रुटी आली.",
    },
    customerDashboard: {
      verifiedSessionBadge: "प्रमाणित ग्राहक सेशन",
      welcomePrefix: "स्वागत आहे,",
      subtitle:
        "तुमच्या सुरक्षित ग्राहक आणि विक्रेता पोर्टल खात्यात साइन इन केले आहे.",
      accountHolderLabel: "खातेधारक",
      registeredEmailLabel: "नोंदणीकृत ईमेल",
      mobileNumberLabel: "मोबाईल क्रमांक",
      roleAndStatusLabel: "भूमिका आणि खाते स्थिती",
      phaseNoticeTitle: "टप्पा ४.१ ग्राहक उत्पादन खरेदी सक्रिय",
      phaseNoticeDescription:
        "Firebase Admin SDK द्वारे सर्व्हरवर तुमची ओळख आणि ग्राहक भूमिका सत्यापित केली गेली आहे. तुम्ही आता कंपनीची सक्रिय उत्पादने पाहू शकता, त्यांचे तपशील तपासू शकता आणि शॉपिंग कार्टमध्ये उत्पादने जोडून किंमत व साठ्याची पडताळणी करू शकता. चेकआउट, पेमेंट, बॅच प्रमाणपत्रे, मार्गदर्शक व्हिडिओ, हंगामी ऑफर्स आणि AI सहाय्य पुढील नियोजित टप्प्यांमध्ये उपलब्ध होतील.",
      browseCatalogueButton: "उत्पादन कॅटलॉग पहा",
      viewCartButton: (count: number) =>
        count > 0 ? `शॉपिंग कार्ट (${count})` : "शॉपिंग कार्ट",
      myOrdersButton: "माझे ऑर्डर्स",
      modulesHeading: "ग्राहक पोर्टल विभाग",
      modulesSubtext:
        "टप्पा ४.१ मध्ये उत्पादन कॅटलॉग आणि शॉपिंग कार्ट सक्रिय आहे. चेकआउट, ऑर्डर, व्हिडिओ, ऑफर, प्रमाणपत्र आणि AI विभाग पुढील टप्प्यांमध्ये नियोजित आहेत.",
      activePhaseBadge: "टप्पा ४.१ मध्ये सक्रिय",
      plannedPhaseBadge: "नियोजित टप्पा",
      viewProductsButton: "उत्पादने खरेदी करा",
      loadingMessage: "ग्राहक सेशन आणि भूमिका परवानग्या तपासल्या जात आहेत…",
      companySectionHeading: "कंपनी आणि उत्पादन केंद्र माहिती",
      companySectionSubtitle:
        "सत्यापित कंपनी ओळख, नोंदणीकृत उत्पादन केंद्र आणि अधिकृत संपर्क व्यवस्था.",
      verifiedFacilityBadge: "प्रमाणित उत्पादन केंद्र",
      facilityAddressLabel: "उत्पादन केंद्र आणि कार्यालय पत्ता",
      helplineLabel: "अधिकृत हेल्पलाइन",
      supportEmailLabel: "सपोर्ट ईमेल",
      officeHoursLabel: "कार्यालयीन वेळ",
      registrationDetailsLabel: "नोंदणी आणि परवाना",
    },
    adminDashboard: {
      verifiedSessionBadge: "सर्व्हर-प्रमाणित प्रशासक सेशन",
      heading: "उत्पादन प्रशासन डॅशबोर्ड",
      subtitle: "अधिकृत कंपनी कर्मचाऱ्यांसाठी प्रमाणित कार्यप्रणाली विभाग.",
      adminNameLabel: "प्रशासकाचे नाव",
      authorizedEmailLabel: "अधिकृत ईमेल",
      verifiedRoleStatusLabel: "प्रमाणित भूमिका आणि स्थिती",
      phaseNoticeTitle: "टप्पा ३ उत्पादन व्यवस्थापन सक्रिय",
      phaseNoticeDescription:
        "Firebase Admin SDK सेशन कुकी आणि RBAC तपासणीद्वारे सर्व्हरवर प्रशासकीय अधिकार सत्यापित केले गेले आहेत. खालील उत्पादन मास्टर व्यवस्थापन सक्रिय आहे. उत्पादन बॅच नोंदी, ऑर्डर पूर्तता आणि प्रमाणन प्रमाणपत्र वितरण पुढील टप्प्यांमध्ये नियोजित आहे.",
      manageProductsButton: "कंपनी उत्पादने व्यवस्थापित करा",
      addNewProductButton: "नवीन उत्पादन जोडा",
      manageOrdersButton: "ऑर्डर्स व्यवस्थापन",
      modulesHeading: "प्रशासकीय कार्यप्रणाली आणि नियोजित विभाग",
      modulesSubtext:
        "टप्पा ३ मध्ये उत्पादन मास्टर व्यवस्थापन सक्रिय आहे. बॅच, ऑर्डर आणि प्रमाणपत्र विभाग टप्पा ४ ते ७ साठी नियोजित आहेत.",
      activePhaseBadge: "टप्पा ३ मध्ये सक्रिय",
      plannedPhaseBadge: "नियोजित टप्पा",
      openProductManagementButton: "उत्पादन व्यवस्थापन उघडा",
      openOrdersManagementButton: "ऑर्डर्स व्यवस्थापन उघडा",
      manageCompanyButton: "कंपनी प्रोफाइल व्यवस्थापित करा",
      companyModuleTitle: "कंपनी प्रोफाइल आणि उत्पादन केंद्र माहिती",
      companyModuleDesc:
        "सत्यापित कंपनी तपशील, उत्पादन केंद्राचा पत्ता, अधिकृत परवाने आणि ग्राहक हेल्पलाइन संपर्क व्यवस्थापित करा.",
      loadingMessage:
        "प्रशासक सेशन आणि सर्व्हर रोल क्लेम्स तपासले जात आहेत…",
    },
    customerProducts: {
      backToDashboard: "ग्राहक डॅशबोर्डवर परत जा",
      viewCartButton: (count: number) =>
        count > 0 ? `कार्ट पहा (${count})` : "कार्ट पहा",
      catalogueBadge: "प्रमाणित कंपनी उत्पादन कॅटलॉग",
      showingProductsCount: (count: number) =>
        `${count} सक्रिय ${count === 1 ? "उत्पादन" : "उत्पादने"} दर्शवित आहे`,
      heading: "अधिकृत कृषी उत्पादने आणि खरेदी कॅटलॉग",
      subtitle:
        "कंपनी-प्रमाणित घटक, मंजूर पीक प्रकार, मात्रा सूचना, साठा उपलब्धता पहा आणि सक्रिय उत्पादने तुमच्या कार्टमध्ये जोडा.",
      catalogueUnavailableTitle: "कॅटलॉग उपलब्ध नाही",
      catalogueUnavailableDesc:
        "या क्षणी प्रकाशित उत्पादन कॅटलॉग लोड करणे शक्य नाही. कृपया काही वेळाने पुन्हा प्रयत्न करा.",
      loadingMessage: "प्रमाणित उत्पादन कॅटलॉग लोड होत आहे…",
      emptyTitle: "अद्याप कोणतीही सक्रिय उत्पादने प्रकाशित केलेली नाहीत",
      emptyDescription:
        "उत्पादन प्रशासन टीमद्वारे प्रकाशित केल्यानंतर प्रमाणित कंपनी उत्पादनांची यादी येथे आपोआप दिसेल.",
      searchLabel: "उत्पादनाचे नाव, SKU, पीक किंवा घटकांनुसार शोधा",
      searchPlaceholder: "उत्पादने, सक्रिय घटक किंवा मंजूर पिके शोधा…",
      categoryFilterLabel: "श्रेणीनुसार फिल्टर करा",
      allCategoriesOption: (count: number) => `सर्व श्रेणी (${count})`,
      availabilityFilterLabel: "साठा आणि उपलब्धता",
      allAvailabilityOption: "सर्व सक्रिय उत्पादने",
      inStockOnlyOption: "ऑर्डरसाठी उपलब्ध (In Stock)",
      noFilterMatch: "तुमच्या सध्याच्या फिल्टर निकषांशी कोणतेही उत्पादन जुळले नाही.",
      resetFiltersButton: "फिल्टर रीसेट करा",
      indicativeUnitPriceLabel: "युनिट किंमत",
      activeCompositionLabel: "सक्रिय घटक:",
      approvedCropsLabel: "मंजूर पिके:",
      packSizesLabel: "पॅक आकार:",
      viewSpecificationsButton: "सविस्तर माहिती पहा",
      viewDetailsButton: "सविस्तर माहिती पहा",
      inStockBadge: "साठ्यात उपलब्ध",
      inStockWithQtyBadge: (qty: number) => `साठ्यात उपलब्ध (${qty} नग)`,
      outOfStockBadge: "साठा संपला आहे",
      enquiryOnlyBadge: "किंमत चौकशीनुसार",
      addToCartButton: "कार्टमध्ये जोडा",
      addedToCartFeedback: "कार्टमध्ये जोडले",
      inCartCountBadge: (qty: number) => `कार्टमध्ये: ${qty}`,
      productImageAlt: (name: string) => `${name} उत्पादनाचे छायाचित्र`,
      noImagePlaceholder: "प्रमाणित फॉर्म्युलेशन तपशील",
    },
    customerProductDetail: {
      backToCatalogue: "उत्पादन कॅटलॉगकडे परत जा",
      viewCartButton: (count: number) =>
        count > 0 ? `कार्ट पहा (${count})` : "कार्ट पहा",
      indicativeUnitPriceLabel: "युनिट किंमत",
      activeCompositionHeading: "सक्रिय घटक आणि फॉर्म्युलेशन",
      dosageHeading: "वापर पद्धती, मात्रा आणि फवारणीच्या सूचना",
      approvedCropsHeading: "मंजूर लक्ष्य पिके",
      packSizesHeading: "उपलब्ध पॅकिंग आकार",
      safetyHeading: "सुरक्षा दक्षता आणि साठवणूक मार्गदर्शक तत्त्वे",
      safetyNotSpecified:
        "कृषी निविष्ठा हाताळताना प्रमाणित सुरक्षा नियमांचे पालन करा आणि थेट सूर्यप्रकाशापासून दूर, थंड व कोरड्या जागी साठवणूक करा.",
      loadingMessage: "उत्पादन तपशील लोड होत आहेत…",
      inStockBadge: "साठ्यात उपलब्ध — ऑर्डरसाठी तयार",
      inStockWithQtyBadge: (qty: number) => `साठ्यात उपलब्ध (${qty} नग उपलब्ध)`,
      outOfStockBadge: "साठा संपला आहे",
      enquiryOnlyBadge: "किंमत चौकशीनुसार उपलब्ध",
      purchaseSectionHeading: "ऑर्डर करा आणि शॉपिंग कार्टमध्ये जोडा",
      purchaseSectionSubtitle:
        "तुमचा पसंतीचा पॅक आकार आणि नग संख्या निवडा. चेकआउटपूर्वी सर्व्हरवर अंतिम किंमत आणि साठ्याची पुन्हा पडताळणी केली जाते.",
      selectPackSizeLabel: "पॅक आकार निवडा",
      quantityLabel: "नग संख्या (Quantity)",
      availableStockHint: (maxQty: number) =>
        `प्रति ऑर्डर कमाल उपलब्ध संख्या: ${maxQty}`,
      lineSubtotalLabel: "एकूण रक्कम",
      addToCartButton: "कार्टमध्ये जोडा",
      addedToCartSuccessTitle: "तुमच्या कार्टमध्ये जोडले गेले",
      addedToCartSuccessDesc: (name: string, qty: number) =>
        `"${name}" चे ${qty} नग तुमच्या शॉपिंग कार्टमध्ये जोडले गेले आहेत.`,
      goToCartButton: "शॉपिंग कार्टकडे जा",
      alreadyInCartLabel: (qty: number) => `सध्या कार्टमध्ये: ${qty}`,
      outOfStockPurchaseNotice:
        "हे उत्पादन सध्या साठ्यात उपलब्ध नसल्यामुळे ऑनलाइन कार्ट ऑर्डरिंगसाठी उपलब्ध नाही.",
      enquiryOnlyPurchaseNotice:
        "या उत्पादनाची किंमत अधिकृत चौकशीनुसार दिली जाते. ऑनलाइन कार्टमध्ये जोडण्यासाठी प्रकाशित युनिट किंमत आवश्यक आहे.",
      decreaseQuantityAria: "संख्या कमी करा",
      increaseQuantityAria: "संख्या वाढवा",
      benefitsHeading: "प्रमुख फायदे आणि वैशिष्ट्ये",
      applicationMethodHeading: "वापरण्याची पद्धत आणि वेळ",
      modeOfActionHeading: "कार्य करण्याची पद्धत (मोड ऑफ ॲक्शन)",
      compatibilityHeading: "सुसंगतता सूचना",
      videoTutorialHeading: "उत्पादन ट्यूटोरियल आणि मार्गदर्शन",
      videoTutorialSubtitle:
        "उत्कृष्ट कृषी परिणामांसाठी अधिकृत प्रात्यक्षिक आणि वापर मार्गदर्शक पहा.",
      videoUnavailableNotice:
        "या उत्पादनासाठी व्हिडिओ मार्गदर्शन सध्या तयार केले जात आहे.",
      watchOnYouTubeButton: "YouTube वर पहा",
    },
    customerCart: {
      backToCatalogue: "कॅटलॉगमध्ये खरेदी सुरू ठेवा",
      backToDashboard: "ग्राहक डॅशबोर्ड",
      cartBadge: "ग्राहक शॉपिंग कार्ट",
      heading: "तुमची शॉपिंग कार्ट",
      subtitle:
        "तुम्ही निवडलेली कृषी उत्पादने तपासा, नग संख्या बदला आणि सर्व्हरवरील ताज्या किमती व साठ्याची पडताळणी करा.",
      loadingMessage: "तुमची शॉपिंग कार्ट लोड होत आहे आणि उत्पादने तपासली जात आहेत…",
      emptyTitle: "तुमची शॉपिंग कार्ट रिकामी आहे",
      emptyDescription:
        "कृषी उत्पादनांचे तपशील पाहण्यासाठी आणि सक्रिय उत्पादने तुमच्या कार्टमध्ये जोडण्यासाठी प्रमाणित उत्पादन कॅटलॉग पहा.",
      browseProductsButton: "उत्पादन कॅटलॉग पहा",
      clearCartButton: "कार्ट रिकामी करा",
      itemCountSummary: (totalItems: number, uniqueItems: number) =>
        `${uniqueItems} ${uniqueItems === 1 ? "उत्पादनाचे" : "उत्पादनांचे"} एकूण ${totalItems} नग`,
      packSizeLabel: "पॅक आकार:",
      unitPriceLabel: "प्रमाणित युनिट किंमत",
      quantityLabel: "नग संख्या",
      lineSubtotalLabel: "उप-एकूण (Subtotal)",
      removeButton: "काढून टाका",
      removeItemAria: (name: string) => `${name} कार्टमधून काढून टाका`,
      decreaseQuantityAria: (name: string) => `${name} ची संख्या कमी करा`,
      increaseQuantityAria: (name: string) => `${name} ची संख्या वाढवा`,
      maxStockLabel: (maxQty: number) => `कमाल उपलब्ध: ${maxQty}`,
      summaryHeading: "ऑर्डर सारांश",
      uniqueProductsLabel: "निवडलेली उत्पादने",
      totalUnitsLabel: "एकूण नग",
      subtotalLabel: "प्रमाणित उप-एकूण",
      estimatedTotalLabel: "प्रमाणित एकूण रक्कम",
      priceAuthorityNote:
        "सर्व उप-एकूण आणि एकूण रकमांची गणना केवळ सर्व्हर-प्रमाणित उत्पादन किमतींवरून केली जाते. क्लायंट-साइड किमती अंतिम मानल्या जात नाहीत.",
      revalidateButton: "कार्टची पडताळणी करा आणि चेकआउटसाठी तपासा",
      revalidatingButton: "थेट साठा आणि किमती तपासल्या जात आहेत…",
      proceedToCheckoutButton: "सुरक्षित चेकआउटसाठी पुढे जा",
      revalidationIssuesTitle: "थेट उत्पादन कॅटलॉगनुसार कार्ट अद्ययावत केली गेली",
      revalidationVerifiedTitle: "सर्व्हर कॅटलॉगनुसार कार्ट सत्यापित केली गेली",
      revalidationVerifiedDesc:
        "तुमच्या कार्टमधील सर्व उत्पादने सक्रिय आहेत, साठ्यात उपलब्ध आहेत आणि अधिकृत सर्व्हर किमतींनुसार मोजली गेली आहेत.",
      checkoutNextPhaseTitle: "चेकआउट आणि पेमेंट पुढील टप्प्यासाठी नियोजित",
      checkoutNextPhaseDesc:
        "तुमची शॉपिंग कार्ट आणि सर्व्हर-साइड किंमत/साठा पडताळणी पूर्ण झाली आहे. ऑर्डर निर्मिती आणि पेमेंट प्रक्रिया पुढील टप्प्यात कार्यान्वित केली जाईल — कोणतीही बनावट ऑर्डर किंवा शुल्क आकारले गेलेले नाही.",
      revalidationFailedTitle: "सर्व्हरवर कार्ट सत्यापित करता आली नाही",
      revalidationFailedDesc:
        "या क्षणी सर्व्हर पडताळणी पूर्ण होऊ शकली नाही. कृपया तुमचे इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.",
      issueRemovedInactive: (name: string) =>
        `"${name}" आता प्रकाशित कॅटलॉगमध्ये सक्रिय नसल्यामुळे तुमच्या कार्टमधून काढले गेले आहे.`,
      issueOutOfStock: (name: string) =>
        `"${name}" सध्या साठ्यात उपलब्ध नसल्यामुळे तुमच्या कार्टमधून काढले गेले आहे.`,
      issuePriceUnavailable: (name: string) =>
        `"${name}" साठी ऑनलाइन युनिट किंमत उपलब्ध नसल्यामुळे ते तुमच्या कार्टमधून काढले गेले आहे.`,
      issuePriceUpdated: (
        name: string,
        oldPrice: string,
        newPrice: string
      ) =>
        `"${name}" ची युनिट किंमत ${oldPrice} वरून सध्याच्या अधिकृत किमतीनुसार ${newPrice} अशी अद्ययावत केली गेली आहे.`,
      issueQuantityAdjusted: (
        name: string,
        requested: number,
        available: number
      ) =>
        `उपलब्ध साठ्यानुसार "${name}" ची संख्या ${requested} वरून ${available} करण्यात आली आहे.`,
      issueInvalidQuantity: (name: string) =>
        `"${name}" साठीची अवैध संख्या सुधारून वैध संख्येवर सेट केली गेली आहे.`,
    },
    customerCheckout: {
      backToCart: "शॉपिंग कार्टकडे परत जा",
      backToCatalogue: "उत्पादन कॅटलॉग पहा",
      backToDashboard: "ग्राहक डॅशबोर्ड",
      checkoutBadge: "ग्राहक ऑर्डर चेकआउट",
      heading: "सुरक्षित ऑर्डर चेकआउट",
      subtitle:
        "तुमच्या सर्व्हर-प्रमाणित कार्टमधील उत्पादने तपासा, वितरणाचा पत्ता प्रविष्ट करा आणि अधिकृत पडताळणीसाठी तुमची ऑर्डर सबमिट करा.",
      loadingMessage:
        "तुमचा चेकआउट सारांश लोड होत आहे आणि थेट उत्पादन किमती तपासल्या जात आहेत…",
      emptyCartTitle: "चेकआउटसाठी कोणतेही उत्पादन उपलब्ध नाही",
      emptyCartDescription:
        "तुमची शॉपिंग कार्ट सध्या रिकामी आहे. चेकआउट करण्यासाठी कृपया आधी सक्रिय कृषी उत्पादने तुमच्या कार्टमध्ये जोडा.",
      browseProductsButton: "उत्पादन कॅटलॉग पहा",
      returnToCartButton: "शॉपिंग कार्टकडे परत जा",
      deliverySectionHeading: "वितरण आणि संपर्क माहिती",
      deliverySectionSubtitle:
        "या ऑर्डरसाठी प्राप्तकर्त्याचे नाव, मोबाईल क्रमांक आणि वितरणाचा पत्ता तपासा किंवा अद्ययावत करा.",
      prefilledProfileNotice:
        "तुमच्या प्रमाणित ग्राहक प्रोफाइलमधील उपलब्ध संपर्क माहिती खाली आधीच भरली आहे. या ऑर्डरसाठी तुम्ही ती तपासू आणि बदलू शकता.",
      customerNameLabel: "प्राप्तकर्त्याचे पूर्ण नाव",
      customerNamePlaceholder: "प्राप्तकर्त्याचे पूर्ण नाव प्रविष्ट करा",
      mobileLabel: "मोबाईल क्रमांक",
      mobilePlaceholder: "१०-अंकी मोबाईल क्रमांक",
      addressLineLabel: "वितरणाचा पत्ता (घर / शेत / जवळची खूण)",
      addressLinePlaceholder:
        "घर क्रमांक, शेताचे नाव, रस्ता किंवा जवळची ओळख प्रविष्ट करा",
      villageOrCityLabel: "गाव / शहर",
      villageOrCityPlaceholder: "गाव किंवा शहराचे नाव प्रविष्ट करा",
      districtLabel: "जिल्हा",
      districtPlaceholder: "जिल्ह्याचे नाव प्रविष्ट करा",
      stateLabel: "राज्य",
      statePlaceholder: "राज्याचे नाव प्रविष्ट करा",
      pinCodeLabel: "पिन कोड (PIN Code)",
      pinCodePlaceholder: "६-अंकी पिन कोड",
      orderItemsHeading: "ऑर्डरसाठी निवडलेली उत्पादने",
      packSizeLabel: "पॅक आकार:",
      quantityLabel: "नग:",
      unitPriceLabel: "युनिट किंमत:",
      lineSubtotalLabel: "उत्पादन एकूण",
      summaryHeading: "अंतिम ऑर्डर सारांश",
      uniqueProductsLabel: "निवडलेली उत्पादने",
      totalUnitsLabel: "एकूण नग",
      subtotalLabel: "सर्व्हर-प्रमाणित उप-एकूण",
      payableAmountLabel: "अंतिम देय रक्कम (Total Payable)",
      serverAuthorityNotice:
        "तुमची ऑर्डर तयार करण्यापूर्वी प्रत्येक उत्पादनाची स्थिती, पॅक आकार, उपलब्ध साठा, युनिट किंमत, उप-एकूण आणि अंतिम देय रक्कम सर्व्हरवर पुन्हा तपासली जाते.",
      paymentPendingNoticeTitle: "पेमेंट आणि पडताळणी स्थिती धोरण",
      paymentPendingNoticeDesc:
        "ही ऑर्डर दिल्यावर तुमची ऑर्डर 'पडताळणी प्रलंबित (Pending Verification)' आणि पेमेंट स्थिती 'अदत्त (Unpaid)' म्हणून नोंदवली जाते. पडताळणीनंतरच ऑनलाइन पेमेंट आणि डिस्पॅचची पुष्टी केली जाईल.",
      placeOrderButton: "पडताळणीसाठी ऑर्डर नोंदवा (Place Order)",
      placingOrderButton: "पडताळणी करून ऑर्डर नोंदवली जात आहे…",
      revalidatingBeforeOrderNotice:
        "सर्व्हरवर थेट साठा आणि अधिकृत किमती तपासल्या जात आहेत…",
      submissionErrorTitle: "ऑर्डर सबमिट करता आली नाही",
      submissionErrorFallback:
        "कृपया दर्शविलेले रकाने किंवा कार्ट उपलब्धता तपासून पुन्हा प्रयत्न करा.",
      networkErrorDesc:
        "ऑर्डर सर्व्हरशी संपर्क साधताना नेटवर्क त्रुटी आली. कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.",
      cartChangedErrorDesc:
        "तुमच्या कार्टमधील एका किंवा अधिक उत्पादनांची किंमत, साठा किंवा उपलब्धता बदलली आहे. तुमची कार्ट ताज्या सर्व्हर माहितीनुसार अद्ययावत केली आहे — कृपया पुन्हा तपासून ऑर्डर सबमिट करा.",
      confirmationBadge: "ऑर्डर नोंदवली गेली — पडताळणी प्रलंबित",
      confirmationHeading: "तुमची ऑर्डर सुरक्षितपणे नोंदवली गेली आहे",
      confirmationSubtitle:
        "धन्यवाद. तुमची ऑर्डर विनंती सुरक्षितपणे जतन केली गेली आहे आणि तुमच्या ग्राहक खात्याशी जोडली गेली आहे.",
      orderNumberLabel: "ऑर्डर संदर्भ क्रमांक",
      orderIdLabel: "सिस्टम ऑर्डर आयडी",
      orderCreatedAtLabel: "ऑर्डर नोंदणीची वेळ",
      orderStatusLabel: "ऑर्डर स्थिती",
      paymentStatusLabel: "पेमेंट स्थिती",
      statusPendingVerification: "पडताळणी प्रलंबित (Pending Verification)",
      statusConfirmed: "पुष्टी झालेली (Confirmed)",
      statusRejected: "नाकारलेली (Rejected)",
      statusCancelled: "रद्द केलेली (Cancelled)",
      paymentStatusUnpaid: "अदत्त — पेमेंट पूर्ण झालेले नाही (Unpaid)",
      paymentStatusPending: "पेमेंट प्रलंबित",
      paymentStatusPaid: "पेमेंट पूर्ण (Paid)",
      paymentStatusFailed: "पेमेंट अयशस्वी",
      verificationExplainTitle:
        "महत्त्वाची सूचना: पेमेंट आणि डिस्पॅच पडताळणी प्रलंबित आहे",
      verificationExplainDesc:
        "तुमची ऑर्डर 'पडताळणी प्रलंबित (Pending Verification)' आणि पेमेंट स्थिती 'अदत्त (Unpaid)' म्हणून नोंदवली गेली आहे. अद्याप कोणतेही शुल्क आकारले गेलेले नाही, आणि पेमेंट व कंपनीची अधिकृत पडताळणी पूर्ण होईपर्यंत डिस्पॅच किंवा वितरणाची पुष्टी केलेली नाही.",
      deliverySummaryHeading: "नोंदवलेला वितरण पत्ता आणि संपर्क",
      orderedItemsHeading: "नोंदवलेली उत्पादने आणि प्रमाणित किमती",
      continueShoppingButton: "कॅटलॉगमध्ये खरेदी सुरू ठेवा",
      goToDashboardButton: "ग्राहक डॅशबोर्डवर परत जा",
      orderNotFoundTitle: "ऑर्डर नोंद सापडली नाही",
      orderNotFoundDesc:
        "विनंती केलेली ऑर्डर सापडली नाही किंवा ती तुमच्या प्रमाणित ग्राहक खात्याशी संबंधित नाही.",
    },
    customerOrders: {
      backToDashboard: "डॅशबोर्डवर परत जा",
      badge: "प्रमाणित ग्राहक ऑर्डर्स",
      heading: "माझा ऑर्डर इतिहास आणि पडताळणी स्थिती",
      subtitle:
        "तुमच्या नोंदवलेल्या ऑर्डर्स, पॅकिंग युनिट्स, वितरण पत्ते आणि कंपनीच्या पडताळणी स्थितीचा मागोवा घ्या.",
      myOrdersButton: "माझे ऑर्डर्स",
      viewAllOrdersButton: "सर्व ऑर्डर्स पहा",
      browseCatalogueButton: "उत्पादन कॅटलॉग पहा",
      orderNumberLabel: "ऑर्डर संदर्भ क्रमांक",
      orderIdLabel: "सिस्टम आयडी",
      orderDateLabel: "ऑर्डर तारीख",
      itemsSummaryHeading: "मागवलेली उत्पादने",
      totalQuantityLabel: "एकूण युनिट्स",
      totalAmountLabel: "एकूण देय रक्कम",
      orderStatusLabel: "ऑर्डर स्थिती",
      paymentStatusLabel: "पेमेंट स्थिती",
      viewDetailsButton: "तपशील पहा",
      emptyTitle: "अद्याप कोणतीही ऑर्डर नोंदवली नाही",
      emptyDescription:
        "तुम्ही अद्याप कोणतीही ऑर्डर नोंदवलेली नाही. उत्पादने निवडण्यासाठी आणि पहिली ऑर्डर नोंदवण्यासाठी आमचा प्रमाणित कृषी उत्पादन कॅटलॉग पहा.",
      loadingMessage: "तुमच्या प्रमाणित ऑर्डर्स लोड होत आहेत…",
      errorMessage:
        "सध्या तुमच्या ऑर्डर्स लोड करता आल्या नाहीत. कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.",
      retryButton: "पुन्हा प्रयत्न करा",
      statusPendingVerification: "पडताळणी प्रलंबित",
      statusConfirmed: "प्रमाणित / निश्चित",
      statusRejected: "नाकारले",
      statusCancelled: "रद्द केले",
      paymentStatusUnpaid: "अदत्त (देय बाकी)",
      paymentStatusPending: "पेमेंट प्रलंबित",
      paymentStatusPaid: "भरले आहे (Paid)",
      paymentStatusFailed: "पेमेंट अयशस्वी",
    },
    adminProducts: {
      backToDashboard: "प्रशासक डॅशबोर्डवर परत जा",
      signedInAsPrefix: "साइन इन केलेले खाते:",
      adminLabelPrefix: "प्रशासक:",
      catalogueBadge: "टप्पा ३ उत्पादन मास्टर कॅटलॉग",
      heading: "कंपनी उत्पादन व्यवस्थापन",
      subtitle:
        "अधिकृत कंपनी उत्पादन फॉर्म्युलेशन, लक्ष्य पीक तपशील, मात्रा मार्गदर्शक तत्त्वे आणि ग्राहक कॅटलॉग दृश्यमानता तयार करा, तपासा आणि अद्ययावत करा.",
      addNewProductButton: "नवीन उत्पादन जोडा",
      totalProductsLabel: "एकूण उत्पादने",
      activeVisibleLabel: "सक्रिय (ग्राहकांना दिसणारे)",
      draftRecordsLabel: "मसुदा (Draft) नोंदी",
      archivedRecordsLabel: "संग्रहित (Archived) नोंदी",
      dbErrorTitle: "डेटाबेस क्वेरी त्रुटी",
      dbErrorDesc:
        "Firestore उत्पादन संग्रह लोड करण्यात अक्षम. कृपया तुमचे Firebase Admin क्रेडेन्शियल्स आणि Firestore सेटअप तपासा.",
      emptyTitle: "अद्याप कोणत्याही कंपनी उत्पादनाची नोंद नाही",
      emptyDescription:
        "कोणतीही काल्पनिक उत्पादने आधीच जोडलेली नाहीत. तुमची पहिली अधिकृत उत्पादन नोंद आणि तांत्रिक तपशील प्रविष्ट करण्यासाठी 'नवीन उत्पादन जोडा' वर क्लिक करा.",
      createFirstProductButton: "पहिली उत्पादन नोंद तयार करा",
      targetCropsLabel: "लक्ष्य पिके:",
      packSizesLabel: "पॅक आकार:",
      viewAndEditButton: "पहा आणि संपादित करा",
      statusActivePublished: "सक्रिय (प्रकाशित)",
      statusActiveVisible: "सक्रिय (ग्राहकांना दिसणारे)",
      statusDraft: "मसुदा (Draft)",
      statusDraftInternal: "मसुदा (केवळ अंतर्गत)",
      statusArchived: "संग्रहित (Archived)",
      statusArchivedHidden: "संग्रहित (लपवलेले)",
      backToProductManagement: "उत्पादन व्यवस्थापनाकडे परत जा",
      approvedTargetCropsLabel: "मंजूर लक्ष्य पिके",
      availablePackSizesLabel: "उपलब्ध पॅक आकार",
      unitPriceLabel: "युनिट किंमत",
      lastUpdatedLabel: "शेवटचे अद्यतन",
      loadingListMessage: "उत्पादन मास्टर नोंदी लोड होत आहेत…",
      loadingDetailMessage: "उत्पादन नोंद लोड होत आहे…",
      verifyingAdminMessage: "प्रशासक सेशन तपासले जात आहे…",
    },
    adminProductForm: {
      createHeading: "अधिकृत उत्पादन तपशील प्रविष्ट करा",
      editHeading: "उत्पादन मास्टर रेकॉर्ड संपादित करा",
      subtitle:
        "केवळ प्रमाणित कंपनी उत्पादन तपशील, सक्रिय घटक, मंजूर पीक श्रेणी आणि मात्रा सूचना प्रविष्ट करा.",
      backToListLink: "उत्पादन यादीकडे परत जा",
      saveFailedTitle: "जतन करणे अयशस्वी",
      saveFailedFallback: "उत्पादन तपशील जतन करता आले नाही.",
      networkSaveError:
        "उत्पादन नोंद जतन करताना नेटवर्क त्रुटी आली. कृपया तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.",
      deleteFailedFallback: "उत्पादन नोंद हटवणे अयशस्वी झाले.",
      networkDeleteError: "उत्पादन नोंद हटवताना नेटवर्क त्रुटी आली.",
      productSavedTitle: "उत्पादन जतन केले",
      productSavedMessage:
        "उत्पादन तपशील आणि प्रकाशन स्थिती Firestore मध्ये अद्ययावत केली गेली आहे.",
      skuLabel: "उत्पादन कोड / SKU",
      skuHint: "कंपनीचा स्वतंत्र SKU कोड.",
      skuPlaceholder: "उदा., SKU-001",
      nameLabel: "अधिकृत उत्पादनाचे नाव",
      namePlaceholder: "कंपनीच्या अधिकृत उत्पादनाचे नाव प्रविष्ट करा",
      statusLabel: "प्रकाशन स्थिती",
      statusHint: "सक्रिय उत्पादने ग्राहक पोर्टलमध्ये दिसतात.",
      categoryLabel: "उत्पादन श्रेणी (Category)",
      categoryHint: "कंपनीने निश्चित केलेले उत्पादन वर्गीकरण.",
      categoryPlaceholder: "श्रेणी प्रविष्ट करा",
      unitPriceLabel: "युनिट किंमत (INR — ऐच्छिक)",
      unitPriceHint: "किंमत चौकशीनुसार दिली जात असल्यास रिकामे ठेवा.",
      unitPricePlaceholder: "ऐच्छिक युनिट किंमत",
      registrationLabel: "वैधानिक / नोंदणी संदर्भ",
      registrationHint: "ऐच्छिक परवाना किंवा नोंदणी क्रमांक.",
      registrationPlaceholder: "ऐच्छिक नोंदणी संदर्भ",
      shortDescLabel: "संक्षिप्त सारांश वर्णन",
      shortDescHint:
        "उत्पादन यादी कार्डवर दिसणारा संक्षिप्त गोषवारा (१०–५०० अक्षरे).",
      shortDescPlaceholder: "उत्पादनाचा स्पष्ट, वस्तुनिष्ठ सारांश प्रविष्ट करा",
      compositionLabel: "सक्रिय घटक आणि तांत्रिक तपशील",
      compositionHint:
        "अधिकृत रासायनिक/जैविक फॉर्म्युलेशन, सक्रिय घटक आणि प्रमाण तपशील.",
      compositionPlaceholder: "प्रमाणित घटक आणि तांत्रिक बाबी प्रविष्ट करा",
      targetCropsLabel: "मंजूर लक्ष्य पिके",
      targetCropsHint: "एकापेक्षा जास्त पिके स्वल्पविरामाने (comma) वेगळी करा.",
      targetCropsPlaceholder: "स्वल्पविरामाने वेगळी केलेली मंजूर पिके",
      packSizesLabel: "उपलब्ध पॅक आकार",
      packSizesHint:
        "एकापेक्षा जास्त पॅक आकार स्वल्पविरामाने वेगळे करा (उदा., 250 ml, 500 ml, 1 L).",
      packSizesPlaceholder: "स्वल्पविरामाने वेगळे केलेले पॅकिंग आकार",
      dosageLabel: "मात्रा आणि वापरण्याच्या सूचना",
      dosageHint:
        "प्रति एकर/हेक्टर प्रमाणित मात्रा, पाण्याचे प्रमाण आणि फवारणीची/वापराची अवस्था.",
      dosagePlaceholder: "अधिकृत मात्रा आणि वापरण्याची पद्धत प्रविष्ट करा",
      safetyLabel: "सुरक्षा दक्षता आणि साठवणूक सूचना (ऐच्छिक)",
      safetyHint: "हाताळणी करताना घ्यायची काळजी, साठवणूक तापमान आणि सुरक्षा सूचना.",
      safetyPlaceholder: "हाताळणी आणि साठवणूक सूचना प्रविष्ट करा",
      createSubmitButton: "उत्पादन नोंद तयार करा",
      editSubmitButton: "उत्पादन बदल जतन करा",
      deleteProductButton: "उत्पादन हटवा",
      confirmDeletePrompt: "कायमस्वरूपी हटवण्याची पुष्टी करता?",
      confirmDeleteYes: "होय, हटवा",
      confirmDeleteNo: "नाही",
      benefitsLabel: "प्रमुख कृषी फायदे",
      benefitsHint: "प्रमुख फायदे नवीन ओळ किंवा स्वल्पविरामाने वेगळे करून प्रविष्ट करा",
      benefitsPlaceholder:
        "उदा. मुळांची वाढ सुधारते\nदुष्काळ सहनशीलता वाढवते",
      applicationMethodLabel: "वापरण्याची पद्धत",
      applicationMethodHint:
        "फवारणी, ठिबक सिंचन, बीजप्रक्रिया किंवा जमिनीतून देणे",
      applicationMethodPlaceholder:
        "उदा. सुरुवातीच्या वाढीच्या अवस्थेत पानांवर फवारणी करा",
      modeOfActionLabel: "कार्य करण्याची पद्धत",
      modeOfActionHint: "जैविक किंवा रासायनिक कृतीची पद्धत",
      modeOfActionPlaceholder:
        "उदा. सिस्टेमिक शोषण ज्यामुळे चयापचय एन्झाईम्स उत्तेजित होतात",
      compatibilityLabel: "सुसंगतता सूचना",
      compatibilityHint: "इतर खते किंवा कीटकनाशकांसोबत एकत्र वापरण्याबाबत माहिती",
      compatibilityPlaceholder:
        "उदा. बहुतांश खतांशी सुसंगत; अत्यंत अल्कधर्मी मिश्रणे टाळा",
      youtubeUrlLabel: "YouTube ट्यूटोरियल लिंक",
      youtubeUrlHint: "उत्पादन प्रात्यक्षिकासाठी अधिकृत YouTube किंवा youtu.be लिंक",
      youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=...",
    },
    adminOrders: {
      backToDashboard: "प्रशासक डॅशबोर्डवर परत जा",
      backToOrdersList: "ऑर्डर्स व्यवस्थापनावर परत जा",
      signedInAsPrefix: "लॉग इन केले आहे",
      badge: "टप्पा ४.३ ऑर्डर्स व्यवस्थापन",
      heading: "ग्राहक ऑर्डर्स व्यवस्थापन",
      subtitle:
        "ग्राहक ऑर्डर्स तपासा, कृषी उत्पादन बुकिंग सत्यापित करा, वितरण पत्ता पहा आणि ऑर्डर स्थिती व्यवस्थापित करा.",
      detailHeading: "ऑर्डर पुनरावलोकन आणि पडताळणी",
      detailSubtitle:
        "ग्राहक बुकिंग तपशील, उत्पादन घटक, प्रमाणित पत्ता तपासा आणि बुकिंग मंजूर किंवा नाकारा.",
      totalOrdersLabel: "एकूण ऑर्डर्स",
      pendingVerificationLabel: "पडताळणी प्रलंबित",
      verifiedOrdersLabel: "सत्यापित ऑर्डर्स",
      rejectedOrdersLabel: "नाकारलेल्या ऑर्डर्स",
      cancelledOrdersLabel: "रद्द केलेल्या ऑर्डर्स",
      filterAll: "सर्व ऑर्डर्स",
      filterPending: "पडताळणी प्रलंबित",
      filterVerified: "सत्यापित",
      filterRejected: "नाकारलेले",
      filterCancelled: "रद्द केलेले",
      emptyTitle: "कोणतीही ऑर्डर आढळली नाही",
      emptyDescription:
        "सध्याच्या फिल्टरनुसार कोणतीही ग्राहक ऑर्डर उपलब्ध नाही. नवीन सबमिट केलेल्या ऑर्डर्स आपोआप येथे दिसतील.",
      dbErrorTitle: "ऑर्डर्स डेटाबेस उपलब्ध नाही",
      dbErrorDesc:
        "सध्या Firestore मधून ग्राहक ऑर्डर्स मिळवणे शक्य नाही.",
      orderRefLabel: "ऑर्डर संदर्भ क्रमांक",
      orderDateLabel: "ऑर्डर तारीख",
      customerHeading: "ग्राहक तपशील",
      customerNameLabel: "ग्राहकाचे नाव",
      customerEmailLabel: "खाते ईमेल",
      customerMobileLabel: "संपर्क मोबाइल",
      customerUidLabel: "ग्राहक UID",
      deliveryAddressHeading: "वितरण माहिती",
      addressLineLabel: "पत्ता",
      villageCityLabel: "गाव / शहर",
      districtStateLabel: "जिल्हा आणि राज्य",
      pinCodeLabel: "पिन कोड",
      productsHeading: "मागवलेली उत्पादने आणि प्रमाण",
      productNameHeader: "उत्पादनाचे नाव",
      packSizeHeader: "पॅक आकार",
      unitPriceHeader: "प्रति नग दर",
      quantityHeader: "नग",
      lineTotalHeader: "एकूण",
      itemsCountSummary: (count: number) =>
        `${count} ${count === 1 ? "उत्पादन घटक" : "उत्पादन घटक"}`,
      totalAmountLabel: "एकूण देय रक्कम",
      orderStatusLabel: "ऑर्डर स्थिती",
      paymentStatusLabel: "पेमेंट स्थिती",
      viewDetailsButton: "तपशील पहा",
      verifyOrderButton: "ऑर्डर सत्यापित करा",
      rejectOrderButton: "ऑर्डर नाकारा",
      confirmVerifyTitle: "ऑर्डर पडताळणीची पुष्टी करा",
      confirmVerifyMessage: (orderNumber: string) =>
        `तुम्हाला नक्की ${orderNumber} ही ऑर्डर सत्यापित करायची आहे का? यामुळे साठ्याची उपलब्धता निश्चित होईल आणि ऑर्डर पुढील प्रक्रियेसाठी मंजूर होईल.`,
      confirmVerifyNote:
        "टीप: ऑर्डर पडताळणीमुळे केवळ मागणीची पुष्टी होते, पेमेंट आपोआप भरलेले मानले जात नाही. पेमेंट स्थिती स्वतंत्र राहते.",
      confirmRejectTitle: "ऑर्डर नाकारण्याची पुष्टी करा",
      confirmRejectMessage: (orderNumber: string) =>
        `तुम्हाला नक्की ${orderNumber} ही ऑर्डर नाकारायची आहे का? हे बुकिंग नाकारले म्हणून चिन्हांकित केले जाईल.`,
      rejectionReasonLabel: "नाकारण्याचे कारण (पर्यायी)",
      rejectionReasonPlaceholder:
        "उदा. वितरण क्षेत्र उपलब्ध नाही, ग्राहकाच्या विनंतीनुसार, किंवा दुबार बुकिंग",
      cancelActionButton: "रद्द करा",
      confirmVerifyAction: "होय, ऑर्डर सत्यापित करा",
      confirmRejectAction: "होय, ऑर्डर नाकारा",
      processingAction: "प्रक्रिया सुरू आहे…",
      verificationSuccessNotice: (orderNumber: string) =>
        `ऑर्डर ${orderNumber} यशस्वीरित्या सत्यापित केली गेली आहे.`,
      rejectionSuccessNotice: (orderNumber: string) =>
        `ऑर्डर ${orderNumber} नाकारण्यात आली आहे.`,
      auditVerificationHeading: "पडताळणी आणि ऑडिट तपशील",
      verifiedByLabel: "सत्यापित केले (प्रशासक UID)",
      verifiedAtLabel: "पडताळणी वेळ",
      rejectedByLabel: "नाकारले (प्रशासक UID)",
      rejectedAtLabel: "नाकारल्याची वेळ",
      rejectionReasonValueLabel: "नोंदवलेले कारण",
      loadingListMessage: "Firestore मधून ग्राहक ऑर्डर्स लोड होत आहेत…",
      loadingDetailMessage: "ऑर्डर आणि वितरण तपशील लोड होत आहेत…",
      orderNotFoundTitle: "ऑर्डर नोंद आढळली नाही",
      orderNotFoundDesc:
        "मागितलेली ऑर्डर डेटाबेसमध्ये आढळली नाही.",
    },
    companyProfile: {
      badge: "प्रमाणित प्रशासन",
      heading: "कंपनी प्रोफाइल व्यवस्थापन",
      subtitle:
        "सत्यापित कंपनी ओळख, नोंदणीकृत उत्पादन केंद्र पत्ता आणि अधिकृत संपर्क माहिती अद्यतनित करा.",
      backToDashboard: "डॅशबोर्डवर परत जा",
      saveButton: "कंपनी प्रोफाइल सेव्ह करा",
      savingButton: "प्रोफाइल सेव्ह होत आहे…",
      savedSuccessTitle: "कंपनी प्रोफाइल यशस्वीरीत्या सेव्ह केले",
      savedSuccessMessage:
        "कंपनी आणि उत्पादन केंद्राची माहिती सुरक्षितपणे अद्यतनित झाली आहे.",
      generalInfoHeading: "सामान्य कंपनी माहिती",
      companyNameLabel: "कंपनीचे नाव",
      companyNamePlaceholder: "उदा. सुप्रिया ॲग्रोबायोटेक",
      taglineLabel: "कंपनी ब्रीदवाक्य / टॅगलाइन",
      taglinePlaceholder: "उदा. समृद्ध शेती, उज्ज्वल भविष्य",
      aboutUsLabel: "कंपनीबद्दल माहिती",
      aboutUsPlaceholder:
        "उत्पादन क्षमता आणि कंपनीच्या ध्येयाचा संक्षिप्त परिचय",
      registrationNumberLabel: "नोंदणी / परवाना / GST क्रमांक",
      registrationNumberPlaceholder: "उदा. MH-AGRO-2026-001",
      facilityAddressHeading: "उत्पादन केंद्र आणि कार्यालय पत्ता",
      facilityNameLabel: "उत्पादन केंद्र / युनिटचे नाव",
      facilityNamePlaceholder: "उदा. उत्पादन प्रकल्प आणि संशोधन केंद्र",
      streetAddressLabel: "रस्ता / प्लॉट / परिसर",
      streetAddressPlaceholder: "उदा. प्लॉट क्र. १२, एमआयडीसी औद्योगिक क्षेत्र",
      villageOrCityLabel: "गाव / शहर",
      villageOrCityPlaceholder: "उदा. बारामती",
      districtLabel: "जिल्हा",
      districtPlaceholder: "उदा. पुणे",
      stateLabel: "राज्य",
      statePlaceholder: "उदा. महाराष्ट्र",
      pinCodeLabel: "पिन कोड",
      pinCodePlaceholder: "उदा. ४१३१०२",
      contactHeading: "अधिकृत संपर्क व्यवस्था",
      helplinePhoneLabel: "ग्राहक हेल्पलाइन क्रमांक",
      helplinePhonePlaceholder: "उदा. +91 9876543210",
      supportEmailLabel: "अधिकृत सपोर्ट ईमेल",
      supportEmailPlaceholder: "उदा. support@supriyaagrobiotech.com",
      officeHoursLabel: "कार्यालयीन कामकाजाची वेळ",
      officeHoursPlaceholder: "उदा. सोम - शनि: सकाळी ९:०० ते संध्याकाळी ६:००",
      dbErrorTitle: "कंपनी प्रोफाइल लोड करता आले नाही",
      dbErrorDesc:
        "डेटाबेसशी संपर्क साधण्यात त्रुटी आली. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.",
    },
  },

  hi: {
    company: {
      companyName: "[Company Name Placeholder]",
      logoPlaceholderLabel: "कंपनी लोगो प्लेसहोल्डर",
      platformTitle: "कृषि उत्पाद निर्माण डिजिटल प्लेटफ़ॉर्म",
      heroHeadline: "बेहतर कृषि का विकास, हम सबके साथ",
      tagline:
        "प्रमाणित कृषि उत्पादों, फसल मार्गदर्शन, ऑर्डर प्रबंधन और बैच सत्यापन प्रमाणपत्रों के लिए एक एकीकृत डिजिटल प्लेटफ़ॉर्म।",
      noticeBanner:
        "चरण 2 प्रमाणीकरण और भूमिका-आधारित एक्सेस (RBAC) सक्रिय — सत्यापित डेटा प्राप्त होने तक कंपनी की पहचान और उत्पाद रिकॉर्ड प्लेसहोल्डर के रूप में रखे गए हैं।",
      registrationPlaceholder:
        "[निर्माण लाइसेंस / GST / ISO पंजीकरण विवरण — सत्यापित कंपनी जानकारी लंबित]",
      addressPlaceholder:
        "[पंजीकृत निर्माण संयंत्र और कॉर्पोरेट कार्यालय का पता — सत्यापित कंपनी जानकारी लंबित]",
      contactEmailPlaceholder: "[official-contact@company-domain.placeholder]",
      contactPhonePlaceholder: "[आधिकारिक सहायता फ़ोन नंबर — जानकारी लंबित]",
    },
    navigation: {
      primaryAriaLabel: "मुख्य नेविगेशन",
      items: [
        { label: "होम", href: "/" },
        { label: "ग्राहक पोर्टल", href: "/customer" },
        { label: "प्रशासक पोर्टल", href: "/admin" },
      ],
      headerSubtitle: "कृषि उत्पाद प्लेटफ़ॉर्म",
      customerPortalButton: "ग्राहक पोर्टल",
      customerPortalShort: "ग्राहक",
      customerPortalAriaLabel: "ग्राहक पोर्टल भाषा चयन खोलें",
      adminPortalButton: "प्रशासक पोर्टल",
      adminPortalShort: "प्रशासक",
      adminPortalAriaLabel: "प्रशासक पोर्टल भाषा चयन खोलें",
      languageSwitcherAriaLabel: "वेबसाइट की भाषा चुनें",
      languageLabel: "भाषा",
    },
    footer: {
      portalNavigationHeading: "पोर्टल नेविगेशन",
      companyInfoHeading: "कंपनी जानकारी प्लेसहोल्डर",
      facilityAddressLabel: "संयंत्र एवं कार्यालय का पता:",
      officialContactLabel: "आधिकारिक संपर्क:",
      copyrightSuffix: "सर्वाधिकार सुरक्षित।",
    },
    common: {
      returnToHome: "होम पेज पर वापस जाएं",
      home: "होम",
      signOut: "साइन आउट करें",
      cancel: "रद्द करें",
      selected: "चयनित",
      showPasswordAria: "पासवर्ड दिखाएं",
      hidePasswordAria: "पासवर्ड छिपाएं",
      showConfirmPasswordAria: "पुष्टिकरण पासवर्ड दिखाएं",
      hideConfirmPasswordAria: "पुष्टिकरण पासवर्ड छिपाएं",
      skuPrefix: "SKU",
      regPrefix: "पंजीकरण",
      regRefPrefix: "पंजीकरण संदर्भ",
      notProvided: "[उपलब्ध नहीं]",
      providedOnEnquiry: "पूछताछ पर उपलब्ध",
      activeStatus: "सक्रिय (active)",
      suspendedStatus: "निलंबित (suspended)",
      customerRole: "ग्राहक (customer)",
      adminRole: "प्रशासक (admin)",
    },
    languageModal: {
      badgeLabel: "भाषा प्राथमिकता",
      closeDialogAria: "भाषा चयन संवाद बंद करें",
      radioGroupAria: "पसंदीदा भाषा चुनें",
      customerPortalBadge: "ग्राहक पोर्टल",
      adminPortalBadge: "प्रशासक पोर्टल",
    },
    landing: {
      selectPortalPrompt: "शुरू करने के लिए नीचे अपना पोर्टल चुनें।",
      illustrationAriaLabel: "कृषि क्षेत्र और फसल वृद्धि का चित्रण",
      illustrationTitle: "सत्यापित कृषि प्लेटफ़ॉर्म",
      illustrationSubtitle: "गुणवत्तापूर्ण इनपुट • कृषि मार्गदर्शन • बैच ट्रेसेबिलिटी",
      choosePortalHeading: "आगे बढ़ने के लिए अपना पोर्टल चुनें",
      customerCardBadge: "किसान, विक्रेता और खरीदार",
      customerCardTitle: "ग्राहक पोर्टल",
      customerCardDescription:
        "सत्यापित कृषि उत्पाद देखें, फसल मार्गदर्शन वीडियो देखें, मौसमी ऑफ़र जानें, ऑर्डर प्रबंधित करें और बैच सत्यापन प्रमाणपत्र डाउनलोड करें।",
      customerCardButton: "ग्राहक लॉगिन / पोर्टल",
      customerCardButtonAria: "भाषा चुनें और ग्राहक लॉगिन पर आगे बढ़ें",
      adminCardBadge: "केवल अधिकृत कार्मिकों के लिए",
      adminCardTitle: "प्रशासक पोर्टल",
      adminCardDescription:
        "उत्पाद मास्टर रिकॉर्ड, निर्माण बैच, ऑर्डर स्वीकृति और सत्यापन प्रमाणपत्रों के प्रबंधन के लिए समर्पित प्रशासनिक पोर्टल।",
      adminCardButton: "प्रशासक लॉगिन / पोर्टल",
      adminCardButtonAria: "भाषा चुनें और प्रशासक लॉगिन पर आगे बढ़ें",
      foundationEyebrow: "प्लेटफ़ॉर्म आधार",
      foundationHeading: "कृषि गुणवत्ता और पारदर्शिता के लिए निर्मित",
      foundationDisclaimer:
        "कोई काल्पनिक दावा या असत्यापित उत्पाद आंकड़े नहीं। आधिकारिक कंपनी जानकारी उपलब्ध होने पर इन अनुभागों में जोड़ी जाएगी।",
      trustPillars: [
        {
          id: "pillar-1",
          title: "बैच-लिंक्ड गुणवत्ता ट्रेसेबिलिटी",
          description:
            "प्रत्येक पूर्ण ऑर्डर को उसके संबंधित निर्माण बैच सत्यापन प्रमाणपत्र से जोड़ने के लिए डिज़ाइन किया गया।",
        },
        {
          id: "pillar-2",
          title: "व्यावहारिक कृषि मार्गदर्शन",
          description:
            "स्पष्ट फसल उपयोग निर्देश, मार्गदर्शक वीडियो और सत्यापित उत्पाद दस्तावेज़ों पर आधारित।",
        },
        {
          id: "pillar-3",
          title: "पारदर्शी कंपनी प्लेसहोल्डर",
          description:
            "सत्यापित डेटा उपलब्ध होने तक सभी कॉर्पोरेट विवरण, पते और उत्पाद कैटलॉग स्पष्ट प्लेसहोल्डर के रूप में रखे गए हैं।",
        },
      ],
    },
    customerEntry: {
      badgeText: "ग्राहक एवं विक्रेता पोर्टल",
      heading: "ग्राहक पोर्टल में आपका स्वागत है",
      description:
        "चाहे आप किसान हों, कृषि इनपुट विक्रेता हों या संस्थागत खरीदार हों — सत्यापित उत्पाद देखने, कृषि मार्गदर्शन वीडियो देखने, मौसमी ऑफ़र जानने और प्रमाणीकरण के बाद अपने ऑर्डर प्रबंधित करने के लिए साइन इन करें या नया खाता बनाएं।",
      loginButton: "अपने खाते में लॉगिन करें",
      loginButtonAria: "भाषा चुनें और अपने खाते में लॉगिन करें",
      signupButton: "नया खाता बनाएं",
      signupButtonAria: "नया खाता बनाएं",
      existingCustomerTitle: "मौजूदा ग्राहक या विक्रेता हैं?",
      existingCustomerDesc:
        "अपने ऑर्डर और बैच सत्यापन प्रमाणपत्र देखने के लिए अपने पंजीकृत ईमेल पते और पासवर्ड से साइन इन करें।",
      existingCustomerLink: "ग्राहक लॉगिन पर जाएं",
      newCustomerTitle: "प्लेटफ़ॉर्म पर नए हैं?",
      newCustomerDesc:
        "उत्पाद ऑर्डरिंग, कृषि अपडेट और प्रत्यक्ष सहायता के लिए अपना ग्राहक प्रोफ़ाइल तैयार करें।",
      newCustomerLink: "ग्राहक पंजीकरण पर जाएं",
      benefitsHeading:
        "आपके ग्राहक खाते में उपलब्ध सुविधाएं (लॉगिन के बाद)",
      benefitsSubtext:
        "चरण 2 में प्रमाणीकरण और सुरक्षित ग्राहक डैशबोर्ड एक्सेस सक्रिय है। कैटलॉग, ऑर्डर, वीडियो, ऑफ़र और प्रमाणपत्र मॉड्यूल अपने निर्धारित चरणों में अनलॉक होंगे।",
      highlights: [
        {
          id: "cust-feat-1",
          title: "सत्यापित उत्पाद देखें",
          description:
            "कैटलॉग डेटा प्रकाशित होने के बाद आधिकारिक कृषि इनपुट, पैक आकार और उपयोग विवरण देखें।",
        },
        {
          id: "cust-feat-2",
          title: "कृषि मार्गदर्शन वीडियो और गाइड",
          description:
            "कंपनी विशेषज्ञों द्वारा तैयार फसल-देखभाल वीडियो और व्यावहारिक उपयोग निर्देश प्राप्त करें।",
        },
        {
          id: "cust-feat-3",
          title: "मौसमी ऑफ़र और डीलर योजनाएं",
          description:
            "अपने खाते में पारदर्शी मूल्य अपडेट, मौसमी ऑफ़र और पात्र ऑर्डर लाभ देखें।",
        },
        {
          id: "cust-feat-4",
          title: "ऑर्डर और बैच प्रमाणपत्र",
          description:
            "ऑर्डर पूर्ति स्थिति ट्रैक करें और प्रत्येक डिलीवरी के लिए बैच-लिंक्ड सत्यापन प्रमाणपत्र डाउनलोड करें।",
        },
      ],
    },
    adminEntry: {
      badgeText: "केवल अधिकृत कंपनी कार्मिकों के लिए",
      portalScopeLabel: "पोर्टल कार्यक्षेत्र: संचालन एवं प्रशासन",
      heading: "निर्माण प्रशासन पोर्टल",
      description:
        "यह पोर्टल केवल अधिकृत कंपनी प्रशासकों और संचालन कर्मचारियों के लिए प्रतिबंधित है, जो उत्पाद मास्टर रिकॉर्ड, निर्माण बैच ट्रेसेबिलिटी, ऑर्डर स्वीकृति और सत्यापन प्रमाणपत्र जारी करने के लिए उत्तरदायी हैं।",
      policyTitle: "प्रशासनिक प्रवेश नीति",
      policyDescription:
        "प्रशासक खातों के लिए सार्वजनिक पंजीकरण उपलब्ध नहीं है। Firebase Authentication और Firebase Admin SDK रोल क्लेम्स का उपयोग करके सर्वर-साइड पर प्रशासनिक पहुंच सत्यापित की जाती है।",
      loginButton: "प्रशासक लॉगिन पर आगे बढ़ें",
      loginButtonAria: "भाषा चुनें और प्रशासक लॉगिन पर आगे बढ़ें",
      plannedModulesHeading: "नियोजित प्रशासनिक क्षमताएं",
      highlights: [
        {
          id: "adm-feat-1",
          title: "उत्पाद और बैच नियंत्रण",
          description:
            "सत्यापित उत्पाद विनिर्देशों, निर्माण बैच लॉग और गुणवत्ता दस्तावेज़ों का प्रबंधन करें।",
        },
        {
          id: "adm-feat-2",
          title: "ऑर्डर और पूर्ति प्रबंधन",
          description:
            "ग्राहक ऑर्डर की समीक्षा करें, उत्पादन बैच आवंटित करें और डिस्पैच चरणों का समन्वय करें।",
        },
        {
          id: "adm-feat-3",
          title: "सत्यापन प्रमाणपत्र जारी करना",
          description:
            "पूर्ण किए गए बैचों और ग्राहक ऑर्डर के साथ आधिकारिक प्रयोगशाला सत्यापन प्रमाणपत्र संलग्न करें।",
        },
      ],
    },
    auth: {
      selectedLanguageBadgeLabel: "चयनित भाषा",
      changeLanguageButtonLabel: "भाषा बदलें",
      modalTitleCustomer: "ग्राहक पोर्टल के लिए भाषा चुनें",
      modalTitleAdmin: "प्रशासक पोर्टल के लिए भाषा चुनें",
      modalSubtitleCustomer:
        "ग्राहक लॉगिन पृष्ठ पर आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें।",
      modalSubtitleAdmin:
        "प्रशासक लॉगिन पृष्ठ पर आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें।",
      continueCustomerButton: "ग्राहक लॉगिन पर आगे बढ़ें",
      continueAdminButton: "प्रशासक लॉगिन पर आगे बढ़ें",
      cancelButton: "रद्द करें",
      customerLoginTitle: "ग्राहक साइन इन",
      customerLoginSubtitle:
        "अपने सुरक्षित ग्राहक पोर्टल डैशबोर्ड तक पहुँचने के लिए साइन इन करें।",
      customerBadgeText: "ग्राहक एवं विक्रेता पोर्टल",
      adminLoginTitle: "प्रशासक साइन इन",
      adminLoginSubtitle: "अधिकृत कंपनी प्रशासकों के लिए प्रतिबंधित लॉगिन।",
      adminBadgeText: "अधिकृत कंपनी कार्मिक",
      emailLabelCustomer: "ईमेल पता",
      emailLabelAdmin: "अधिकृत प्रशासक ईमेल",
      emailHint: "अपना पंजीकृत ईमेल पता दर्ज करें।",
      passwordLabel: "पासवर्ड",
      passwordHint: "न्यूनतम 8 अक्षर आवश्यक हैं।",
      passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
      customerSubmitButton: "अपने खाते में लॉगिन करें",
      adminSubmitButton: "प्रशासक पोर्टल में साइन इन करें",
      noCustomerAccountPrompt: "क्या आपका ग्राहक खाता नहीं है?",
      createNewAccountLink: "नया खाता बनाएं",
      backToCustomerPortal: "ग्राहक पोर्टल पर वापस जाएं",
      backToAdminPortal: "प्रशासक पोर्टल पर वापस जाएं",
      homeLink: "होम",
      authRequiredTitle: "प्रमाणीकरण आवश्यक है",
      authRequiredAdminDesc:
        "प्रशासक डैशबोर्ड तक पहुँचने के लिए कृपया अधिकृत प्रशासक खाते से साइन इन करें।",
      authRequiredCustomerDesc:
        "ग्राहक डैशबोर्ड तक पहुँचने के लिए कृपया अपने ग्राहक खाते में साइन इन करें।",
      forbiddenRoleTitle: "भूमिका प्राधिकरण आवश्यक है",
      forbiddenRoleAdminDesc:
        "प्रवेश अस्वीकृत: उस पृष्ठ को देखने के लिए अधिकृत प्रशासक भूमिका आवश्यक है।",
      forbiddenRoleCustomerDesc:
        "प्रवेश अस्वीकृत: ग्राहक पोर्टल देखने के लिए कृपया ग्राहक खाते से साइन इन करें।",
      signInFailedTitle: "साइन-इन विफल",
      authorizedPersonnelNoticeTitle: "अधिकृत कार्मिक सूचना",
      securityNoteTitle: "सुरक्षा सूचना",
      customerSecurityNote:
        "ग्राहक प्रमाणपत्र Firebase Authentication के माध्यम से सत्यापित किए जाते हैं और सर्वर-सत्यापित HttpOnly सेशन कुकी में बदले जाते हैं।",
      adminSecurityNote:
        "सार्वजनिक प्रशासक पंजीकरण अक्षम है। Firebase Admin SDK सेशन कुकीज़ और रोल क्लेम्स का उपयोग करके सर्वर पर प्रशासनिक प्राधिकरण सत्यापित किया जाता है।",
      firebaseUnconfiguredSignInError:
        "Firebase Client SDK कॉन्फ़िगर नहीं है। लाइव साइन-इन सक्षम करने के लिए .env.local में NEXT_PUBLIC_FIREBASE_* और FIREBASE_ADMIN_* क्रेडेंशियल्स भरें।",
      firebaseUnconfiguredSignupError:
        "Firebase Client SDK कॉन्फ़िगर नहीं है। लाइव खाता पंजीकरण सक्षम करने के लिए .env.local में NEXT_PUBLIC_FIREBASE_* और FIREBASE_ADMIN_* क्रेडेंशियल्स भरें।",
      firebaseAdminUnconfiguredError:
        "सर्वर पर Firebase Admin SDK कॉन्फ़िगर नहीं है। कृपया .env.local में FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL और FIREBASE_ADMIN_PRIVATE_KEY भरें।",
      serverRoleVerificationFailed:
        "सर्वर-साइड भूमिका सत्यापन विफल रहा। प्रवेश की अनुमति नहीं दी गई।",
      sessionInitFailedAfterSignup:
        "खाता बना दिया गया है, लेकिन सर्वर सेशन प्रारंभ नहीं हो सका। कृपया ग्राहक लॉगिन पृष्ठ पर साइन इन करें।",
      signupBadge: "ग्राहक एवं विक्रेता पंजीकरण",
      signupTitle: "नया ग्राहक खाता बनाएं",
      signupSubtitle:
        "अपने सुरक्षित ग्राहक पोर्टल खाते तक पहुँचने के लिए अपना ग्राहक प्रोफ़ाइल पंजीकृत करें।",
      registrationFailedTitle: "पंजीकरण विफल",
      fullNameLabel: "पूरा नाम",
      fullNamePlaceholder: "अपना पूरा नाम दर्ज करें",
      emailAddressLabel: "ईमेल पता",
      emailPlaceholder: "name@example.com",
      mobileNumberLabel: "मोबाइल नंबर",
      mobilePlaceholder: "+91 98765 43210",
      passwordHintShort: "कम से कम 8 अक्षर।",
      createPasswordPlaceholder: "पासवर्ड बनाएं",
      confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
      confirmPasswordHint: "अपना पासवर्ड दोबारा दर्ज करें।",
      confirmPasswordPlaceholder: "पासवर्ड की पुष्टि करें",
      termsPrefix: "मैं",
      termsPlaceholderStrong: "[सेवा की शर्तें और गोपनीयता नीति प्लेसहोल्डर]",
      termsSuffix:
        "को स्वीकार करता/करती हूँ और पुष्टि करता/करती हूँ कि मेरे पंजीकरण विवरण सही हैं।",
      createAccountButton: "ग्राहक खाता बनाएं",
      alreadyHaveAccountPrompt: "क्या आपका पहले से ग्राहक खाता है?",
      loginToAccountLink: "अपने खाते में लॉगिन करें",
    },
    validation: {
      emailRequired: "ईमेल पता आवश्यक है।",
      emailInvalid: "कृपया एक मान्य ईमेल पता दर्ज करें (उदाहरण: name@domain.com)।",
      passwordRequired: "पासवर्ड आवश्यक है।",
      passwordMinLength: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।",
      fullNameRequired: "पूरा नाम आवश्यक है।",
      fullNameMinLength: "अपना पूरा नाम दर्ज करें (कम से कम 2 अक्षर)।",
      mobileRequired: "मोबाइल नंबर आवश्यक है।",
      mobileInvalid: "कृपया 10 से 15 अंकों का मान्य मोबाइल नंबर दर्ज करें।",
      confirmPasswordRequired: "कृपया अपने पासवर्ड की पुष्टि करें।",
      passwordsDoNotMatch: "दोनों पासवर्ड मेल नहीं खाते।",
      termsRequired:
        "आगे बढ़ने के लिए कृपया प्लेटफ़ॉर्म की शर्तों और गोपनीयता नीति प्लेसहोल्डर को स्वीकार करें।",
      skuRequired: "उत्पाद SKU / कोड आवश्यक है।",
      skuInvalid:
        "SKU में अक्षरों, अंकों, हाइफ़न, अंडरस्कोर या स्लैश का उपयोग करके 2 से 40 अक्षर होने चाहिए।",
      productNameRequired: "आधिकारिक उत्पाद का नाम आवश्यक है।",
      productNameLength: "उत्पाद का नाम 2 से 140 अक्षरों के बीच होना चाहिए।",
      categoryRequired: "उत्पाद श्रेणी (Category) आवश्यक है।",
      categoryLength: "श्रेणी 2 से 80 अक्षरों के बीच होनी चाहिए।",
      shortDescRequired: "संक्षिप्त विवरण आवश्यक है।",
      shortDescLength: "संक्षिप्त विवरण 10 से 500 अक्षरों के बीच होना चाहिए।",
      compositionRequired: "सक्रिय संरचना / तकनीकी विवरण आवश्यक है।",
      compositionLength:
        "संरचना विवरण 3 से 1000 अक्षरों के बीच होना चाहिए।",
      targetCropsRequired: "कम से कम एक स्वीकृत लक्षित फसल निर्दिष्ट करें।",
      targetCropsMax: "अधिकतम 30 लक्षित फसल प्रविष्टियाँ प्रदान करें।",
      dosageRequired: "खुराक और उपयोग के निर्देश आवश्यक हैं।",
      dosageLength:
        "खुराक और उपयोग के निर्देश 5 से 2000 अक्षरों के बीच होने चाहिए।",
      packSizesRequired: "कम से कम एक उपलब्ध पैकेजिंग आकार निर्दिष्ट करें।",
      packSizesMax: "अधिकतम 20 पैकेजिंग आकार प्रविष्टियाँ प्रदान करें।",
      unitPriceInvalid:
        "इकाई मूल्य एक मान्य धनात्मक संख्या होनी चाहिए (या लागू न होने पर खाली छोड़ दें)।",
      safetyMax: "सुरक्षा और भंडारण दिशानिर्देश 1500 अक्षरों से अधिक नहीं हो सकते।",
      registrationMax: "वैधानिक पंजीकरण संदर्भ 120 अक्षरों से अधिक नहीं हो सकता।",
      statusInvalid:
        "उत्पाद की स्थिति 'active', 'draft' या 'archived' होनी चाहिए।",
      cartProductUnavailable:
        "यह उत्पाद वर्तमान में सक्रिय नहीं है या ग्राहक खरीद के लिए उपलब्ध नहीं है।",
      cartPriceUnavailable:
        "इस उत्पाद का मूल्य पूछताछ पर उपलब्ध होने के कारण ऑनलाइन कार्ट ऑर्डरिंग उपलब्ध नहीं है।",
      cartOutOfStock:
        "यह उत्पाद वर्तमान में स्टॉक में नहीं है और कार्ट में नहीं जोड़ा जा सकता।",
      cartInvalidQuantity:
        "कृपया कम से कम 1 की मान्य पूर्णांक मात्रा (Quantity) दर्ज करें।",
      cartQuantityExceedsStock: (available: number) =>
        `मांगी गई मात्रा उपलब्ध स्टॉक (${available} इकाई उपलब्ध) से अधिक है।`,
      deliveryNameRequired: "डिलीवरी के लिए ग्राहक का पूरा नाम आवश्यक है।",
      deliveryNameLength: "ग्राहक का पूरा नाम 2 से 120 अक्षरों के बीच होना चाहिए।",
      deliveryMobileRequired: "डिलीवरी समन्वय के लिए मोबाइल नंबर आवश्यक है।",
      deliveryMobileInvalid:
        "कृपया एक मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें (वैकल्पिक +91 के साथ)।",
      deliveryAddressRequired: "डिलीवरी का पता (मकान/खेत/गली) आवश्यक है।",
      deliveryAddressLength: "डिलीवरी का पता 5 से 300 अक्षरों के बीच होना चाहिए।",
      deliveryVillageOrCityRequired: "गाँव या शहर का नाम आवश्यक है।",
      deliveryVillageOrCityLength:
        "गाँव या शहर का नाम 2 से 100 अक्षरों के बीच होना चाहिए।",
      deliveryDistrictRequired: "ज़िले का नाम आवश्यक है।",
      deliveryDistrictLength:
        "ज़िले का नाम 2 से 100 अक्षरों के बीच होना चाहिए।",
      deliveryStateRequired: "राज्य का नाम आवश्यक है।",
      deliveryStateLength: "राज्य का नाम 2 से 100 अक्षरों के बीच होना चाहिए।",
      deliveryPinCodeRequired: "पिन कोड (PIN Code) आवश्यक है।",
      deliveryPinCodeInvalid: "कृपया एक मान्य 6-अंकीय भारतीय पिन कोड दर्ज करें।",
      orderEmptyCart:
        "आपकी शॉपिंग कार्ट खाली है। कृपया ऑर्डर देने से पहले कम से कम एक सक्रिय उत्पाद कार्ट में जोड़ें।",
      orderForbiddenCustomerMismatch:
        "ऑर्डर निर्माण केवल आपके अपने प्रमाणित ग्राहक खाते के लिए ही अनुमत है।",
      orderInvalidPackSize: (productName: string) =>
        `"${productName}" के लिए चयनित पैक आकार अमान्य है या अब उपलब्ध नहीं है।`,
      orderProductUnavailable: (productName: string) =>
        `"${productName}" अब सक्रिय नहीं है या बिक्री के लिए उपलब्ध नहीं है।`,
      orderDuplicateSubmission:
        "यह ऑर्डर अनुरोध पहले ही सबमिट किया जा चुका है। डुप्लिकेट ऑर्डर निर्माण को रोक दिया गया है।",
      benefitsMax: "लाभों की सूची २० मदों से अधिक नहीं हो सकती।",
      youtubeUrlInvalid:
        "कृपया वैध YouTube वीडियो लिंक दर्ज करें (youtube.com या youtu.be)।",
      companyNameRequired: "कंपनी का नाम आवश्यक है।",
      companyRegistrationRequired:
        "पंजीकरण या लाइसेंस नंबर आवश्यक है।",
      companyFacilityRequired: "परिसर या कार्यालय का नाम आवश्यक है।",
      companyStreetRequired: "पता (सड़क/मार्ग) आवश्यक है।",
      companyCityRequired: "गाँव या शहर आवश्यक है।",
      companyDistrictRequired: "ज़िला आवश्यक है।",
      companyStateRequired: "राज्य आवश्यक है।",
      companyPinCodeRequired: "पिन कोड आवश्यक है।",
      companyPinCodeInvalid: "कृपया ६ अंकों का वैध भारतीय पिन कोड दर्ज करें।",
      companyHelplineRequired: "हेल्पलाइन फोन नंबर आवश्यक है।",
      companyHelplineInvalid: "कृपया वैध फोन नंबर दर्ज करें।",
      companyEmailRequired: "सपोर्ट ईमेल पता आवश्यक है।",
      companyEmailInvalid: "कृपया वैध सपोर्ट ईमेल पता दर्ज करें।",
    },
    firebaseErrors: {
      invalidCredential:
        "अमान्य ईमेल पता या पासवर्ड। कृपया अपने विवरण की जाँच करें और पुनः प्रयास करें।",
      emailInUse:
        "इस ईमेल पते के साथ पहले से एक खाता मौजूद है। कृपया साइन इन करें।",
      weakPassword:
        "पासवर्ड बहुत कमज़ोर है। कृपया कम से कम 8 अक्षर दर्ज करें।",
      userDisabled:
        "यह खाता निष्क्रिय कर दिया गया है। कृपया कंपनी सहायता से संपर्क करें।",
      tooManyRequests:
        "बहुत अधिक असफल प्रयास। कृपया कुछ मिनट प्रतीक्षा करें और पुनः प्रयास करें।",
      networkError:
        "प्रमाणीकरण सेवा से संपर्क करते समय नेटवर्क त्रुटि हुई। अपना कनेक्शन जांचें और पुनः प्रयास करें।",
      defaultError:
        "प्रमाणीकरण अनुरोध पूरा नहीं किया जा सका। कृपया अपने क्रेडेंशियल और कॉन्फ़िगरेशन की जाँच करें।",
      unexpectedError: "एक अप्रत्याशित प्रमाणीकरण त्रुटि हुई।",
    },
    customerDashboard: {
      verifiedSessionBadge: "सत्यापित ग्राहक सेशन",
      welcomePrefix: "स्वागत है,",
      subtitle:
        "आपके सुरक्षित ग्राहक एवं विक्रेता पोर्टल खाते में साइन इन किया गया है।",
      accountHolderLabel: "खाताधारक",
      registeredEmailLabel: "पंजीकृत ईमेल",
      mobileNumberLabel: "मोबाइल नंबर",
      roleAndStatusLabel: "भूमिका और खाता स्थिति",
      phaseNoticeTitle: "चरण 4.1 ग्राहक उत्पाद खरीदारी सक्रिय",
      phaseNoticeDescription:
        "Firebase Admin SDK का उपयोग करके सर्वर पर आपकी पहचान और ग्राहक भूमिका सत्यापित की गई है। अब आप कंपनी के सक्रिय उत्पादों को देख सकते हैं, सत्यापित विनिर्देशों की जाँच कर सकते हैं और लाइव मूल्य व स्टॉक सत्यापन के साथ अपनी शॉपिंग कार्ट प्रबंधित कर सकते हैं। चेकआउट, भुगतान, बैच सत्यापन प्रमाणपत्र, मार्गदर्शन वीडियो, मौसमी ऑफ़र और AI सहायता आगामी चरणों के लिए निर्धारित हैं।",
      browseCatalogueButton: "उत्पाद कैटलॉग देखें",
      viewCartButton: (count: number) =>
        count > 0 ? `शॉपिंग कार्ट (${count})` : "शॉपिंग कार्ट",
      myOrdersButton: "मेरे ऑर्डर्स",
      modulesHeading: "ग्राहक पोर्टल मॉड्यूल",
      modulesSubtext:
        "चरण 4.1 में उत्पाद कैटलॉग और शॉपिंग कार्ट सक्रिय हैं। चेकआउट, ऑर्डर, वीडियो, ऑफ़र, प्रमाणपत्र और AI मॉड्यूल आगामी चरणों के लिए निर्धारित हैं।",
      activePhaseBadge: "चरण 4.1 में सक्रिय",
      plannedPhaseBadge: "नियोजित चरण",
      viewProductsButton: "उत्पाद खरीदें",
      loadingMessage: "ग्राहक सेशन और भूमिका अनुमतियों का सत्यापन किया जा रहा है…",
      companySectionHeading: "कंपनी और विनिर्माण परिसर जानकारी",
      companySectionSubtitle:
        "सत्यापित कंपनी पहचान, पंजीकृत विनिर्माण परिसर और आधिकारिक संपर्क चैनल।",
      verifiedFacilityBadge: "सत्यापित विनिर्माण परिसर",
      facilityAddressLabel: "विनिर्माण एवं कार्यालय पता",
      helplineLabel: "आधिकारिक हेल्पलाइन",
      supportEmailLabel: "सपोर्ट ईमेल",
      officeHoursLabel: "कार्यालय समय",
      registrationDetailsLabel: "पंजीकरण और लाइसेंस",
    },
    adminDashboard: {
      verifiedSessionBadge: "सर्वर-सत्यापित प्रशासक सेशन",
      heading: "निर्माण प्रशासन डैशबोर्ड",
      subtitle: "अधिकृत कंपनी कार्मिकों के लिए प्रमाणित संचालन वातावरण।",
      adminNameLabel: "प्रशासक का नाम",
      authorizedEmailLabel: "अधिकृत ईमेल",
      verifiedRoleStatusLabel: "सत्यापित भूमिका और स्थिति",
      phaseNoticeTitle: "चरण 3 उत्पाद प्रबंधन सक्रिय",
      phaseNoticeDescription:
        "Firebase Admin SDK सेशन कुकी सत्यापन और RBAC जांच के माध्यम से सर्वर पर प्रशासनिक प्राधिकरण सत्यापित किया गया है। उत्पाद मास्टर प्रबंधन नीचे सक्रिय है। निर्माण बैच लॉग, ऑर्डर पूर्ति वर्कफ़्लो और सत्यापन प्रमाणपत्र जारी करना आगामी चरणों के लिए निर्धारित है।",
      manageProductsButton: "कंपनी उत्पाद प्रबंधित करें",
      addNewProductButton: "नया उत्पाद जोड़ें",
      manageOrdersButton: "ऑर्डर प्रबंधन",
      modulesHeading: "प्रशासनिक संचालन और नियोजित मॉड्यूल",
      modulesSubtext:
        "चरण 3 में उत्पाद मास्टर प्रबंधन सक्रिय है। बैच, ऑर्डर और प्रमाणपत्र मॉड्यूल चरण 4–7 के लिए निर्धारित हैं।",
      activePhaseBadge: "चरण 3 में सक्रिय",
      plannedPhaseBadge: "नियोजित चरण",
      openProductManagementButton: "उत्पाद प्रबंधन खोलें",
      openOrdersManagementButton: "ऑर्डर प्रबंधन खोलें",
      manageCompanyButton: "कंपनी प्रोफाइल प्रबंधित करें",
      companyModuleTitle: "कंपनी प्रोफाइल और विनिर्माण परिसर विवरण",
      companyModuleDesc:
        "सत्यापित कंपनी विवरण, विनिर्माण परिसर का पता, आधिकारिक लाइसेंस और ग्राहक हेल्पलाइन संपर्क प्रबंधित करें।",
      loadingMessage:
        "प्रशासक सेशन और सर्वर रोल क्लेम्स का सत्यापन किया जा रहा है…",
    },
    customerProducts: {
      backToDashboard: "ग्राहक डैशबोर्ड पर वापस जाएं",
      viewCartButton: (count: number) =>
        count > 0 ? `कार्ट देखें (${count})` : "कार्ट देखें",
      catalogueBadge: "सत्यापित कंपनी उत्पाद कैटलॉग",
      showingProductsCount: (count: number) =>
        `${count} सक्रिय उत्पाद दिखाए जा रहे हैं`,
      heading: "आधिकारिक कृषि उत्पाद और खरीदारी कैटलॉग",
      subtitle:
        "कंपनी-सत्यापित फ़ॉर्मूलेशन, स्वीकृत फसल श्रेणियां, खुराक निर्देश, स्टॉक उपलब्धता देखें और सक्रिय उत्पादों को अपनी कार्ट में जोड़ें।",
      catalogueUnavailableTitle: "कैटलॉग अनुपलब्ध",
      catalogueUnavailableDesc:
        "इस समय प्रकाशित उत्पाद कैटलॉग लोड नहीं किया जा सका। कृपया बाद में पुनः प्रयास करें।",
      loadingMessage: "सत्यापित उत्पाद कैटलॉग लोड हो रहा है…",
      emptyTitle: "अभी तक कोई सक्रिय उत्पाद प्रकाशित नहीं हुआ है",
      emptyDescription:
        "निर्माण प्रशासन टीम द्वारा प्रकाशित किए जाने के बाद सत्यापित कंपनी उत्पाद सूचियां यहां स्वतः दिखाई देंगी।",
      searchLabel: "उत्पाद नाम, SKU, फसल या संरचना द्वारा खोजें",
      searchPlaceholder: "उत्पाद, सक्रिय घटक या स्वीकृत फसलें खोजें…",
      categoryFilterLabel: "श्रेणी के अनुसार फ़िल्टर करें",
      allCategoriesOption: (count: number) => `सभी श्रेणियां (${count})`,
      availabilityFilterLabel: "स्टॉक और उपलब्धता",
      allAvailabilityOption: "सभी सक्रिय उत्पाद",
      inStockOnlyOption: "ऑर्डर के लिए उपलब्ध (In Stock)",
      noFilterMatch: "आपके वर्तमान फ़िल्टर मानदंडों से कोई उत्पाद मेल नहीं खाता।",
      resetFiltersButton: "फ़िल्टर रीसेट करें",
      indicativeUnitPriceLabel: "इकाई मूल्य",
      activeCompositionLabel: "सक्रिय संरचना:",
      approvedCropsLabel: "स्वीकृत फसलें:",
      packSizesLabel: "पैक आकार:",
      viewSpecificationsButton: "विवरण देखें",
      viewDetailsButton: "विवरण देखें",
      inStockBadge: "स्टॉक में उपलब्ध",
      inStockWithQtyBadge: (qty: number) => `स्टॉक में उपलब्ध (${qty} उपलब्ध)`,
      outOfStockBadge: "स्टॉक समाप्त",
      enquiryOnlyBadge: "मूल्य पूछताछ पर",
      addToCartButton: "कार्ट में जोड़ें",
      addedToCartFeedback: "कार्ट में जोड़ा गया",
      inCartCountBadge: (qty: number) => `कार्ट में: ${qty}`,
      productImageAlt: (name: string) => `${name} उत्पाद छवि`,
      noImagePlaceholder: "सत्यापित फ़ॉर्मूलेशन विनिर्देश",
    },
    customerProductDetail: {
      backToCatalogue: "उत्पाद कैटलॉग पर वापस जाएं",
      viewCartButton: (count: number) =>
        count > 0 ? `कार्ट देखें (${count})` : "कार्ट देखें",
      indicativeUnitPriceLabel: "इकाई मूल्य",
      activeCompositionHeading: "सक्रिय संरचना और फ़ॉर्मूलेशन",
      dosageHeading: "उपयोग विधि, खुराक और छिड़काव के निर्देश",
      approvedCropsHeading: "स्वीकृत लक्षित फसलें",
      packSizesHeading: "उपलब्ध पैकेजिंग आकार",
      safetyHeading: "सुरक्षा सावधानियां और भंडारण दिशानिर्देश",
      safetyNotSpecified:
        "कृषि इनपुट का उपयोग करते समय मानक सुरक्षा सावधानियों का पालन करें और सीधे धूप से दूर ठंडी एवं सूखी जगह पर संग्रहीत करें।",
      loadingMessage: "उत्पाद विनिर्देश विवरण लोड हो रहा है…",
      inStockBadge: "स्टॉक में उपलब्ध — ऑर्डर के लिए तैयार",
      inStockWithQtyBadge: (qty: number) =>
        `स्टॉक में उपलब्ध (${qty} इकाई उपलब्ध)`,
      outOfStockBadge: "स्टॉक समाप्त",
      enquiryOnlyBadge: "पूछताछ पर मूल्य उपलब्ध",
      purchaseSectionHeading: "ऑर्डर करें और शॉपिंग कार्ट में जोड़ें",
      purchaseSectionSubtitle:
        "अपना पसंदीदा पैक आकार और मात्रा चुनें। चेकआउट से पहले सर्वर पर अंतिम मूल्य और स्टॉक उपलब्धता का पुनः सत्यापन किया जाता है।",
      selectPackSizeLabel: "पैक आकार चुनें",
      quantityLabel: "ऑर्डर मात्रा (Quantity)",
      availableStockHint: (maxQty: number) =>
        `प्रति ऑर्डर अधिकतम उपलब्ध मात्रा: ${maxQty}`,
      lineSubtotalLabel: "आइटम उप-योग",
      addToCartButton: "कार्ट में जोड़ें",
      addedToCartSuccessTitle: "आपकी कार्ट में जोड़ा गया",
      addedToCartSuccessDesc: (name: string, qty: number) =>
        `"${name}" की ${qty} इकाई आपकी शॉपिंग कार्ट में जोड़ दी गई है।`,
      goToCartButton: "शॉपिंग कार्ट पर जाएं",
      alreadyInCartLabel: (qty: number) => `वर्तमान में कार्ट में: ${qty}`,
      outOfStockPurchaseNotice:
        "यह उत्पाद वर्तमान में स्टॉक में नहीं है और ऑनलाइन कार्ट ऑर्डरिंग के लिए अनुपलब्ध है।",
      enquiryOnlyPurchaseNotice:
        "इस फ़ॉर्मूलेशन का मूल्य आधिकारिक पूछताछ पर प्रदान किया जाता है। ऑनलाइन कार्ट में जोड़ने के लिए प्रकाशित इकाई मूल्य आवश्यक है।",
      decreaseQuantityAria: "मात्रा कम करें",
      increaseQuantityAria: "मात्रा बढ़ाएं",
      benefitsHeading: "प्रमुख लाभ और विशेषताएं",
      applicationMethodHeading: "प्रयोग विधि और समय",
      modeOfActionHeading: "कार्य प्रणाली (मोड ऑफ एक्शन)",
      compatibilityHeading: "संगतता सूचना",
      videoTutorialHeading: "उत्पाद ट्यूटोरियल और मार्गदर्शन",
      videoTutorialSubtitle:
        "सर्वश्रेष्ठ कृषि परिणामों के लिए आधिकारिक प्रदर्शन और उपयोग दिशानिर्देश देखें।",
      videoUnavailableNotice:
        "इस उत्पाद के लिए वीडियो मार्गदर्शन वर्तमान में तैयार किया जा रहा है।",
      watchOnYouTubeButton: "YouTube पर देखें",
    },
    customerCart: {
      backToCatalogue: "कैटलॉग में खरीदारी जारी रखें",
      backToDashboard: "ग्राहक डैशबोर्ड",
      cartBadge: "ग्राहक शॉपिंग कार्ट",
      heading: "आपकी शॉपिंग कार्ट",
      subtitle:
        "अपने चयनित कृषि उत्पादों की समीक्षा करें, मात्रा समायोजित करें और लाइव उत्पाद उपलब्धता व मूल्यों को पुनः सत्यापित करें।",
      loadingMessage:
        "आपकी शॉपिंग कार्ट लोड हो रही है और उत्पाद रिकॉर्ड सत्यापित किए जा रहे हैं…",
      emptyTitle: "आपकी शॉपिंग कार्ट खाली है",
      emptyDescription:
        "कृषि फ़ॉर्मूलेशन देखने और सक्रिय उत्पादों को अपनी कार्ट में जोड़ने के लिए सत्यापित उत्पाद कैटलॉग ब्राउज़ करें।",
      browseProductsButton: "उत्पाद कैटलॉग देखें",
      clearCartButton: "कार्ट खाली करें",
      itemCountSummary: (totalItems: number, uniqueItems: number) =>
        `${uniqueItems} उत्पाद में कुल ${totalItems} इकाई`,
      packSizeLabel: "पैक आकार:",
      unitPriceLabel: "सत्यापित इकाई मूल्य",
      quantityLabel: "मात्रा",
      lineSubtotalLabel: "उप-योग (Subtotal)",
      removeButton: "हटाएं",
      removeItemAria: (name: string) => `${name} को कार्ट से हटाएं`,
      decreaseQuantityAria: (name: string) => `${name} की मात्रा कम करें`,
      increaseQuantityAria: (name: string) => `${name} की मात्रा बढ़ाएं`,
      maxStockLabel: (maxQty: number) => `अधिकतम उपलब्ध: ${maxQty}`,
      summaryHeading: "ऑर्डर सारांश",
      uniqueProductsLabel: "चयनित उत्पाद",
      totalUnitsLabel: "कुल इकाइयां",
      subtotalLabel: "सत्यापित उप-योग",
      estimatedTotalLabel: "सत्यापित कुल योग",
      priceAuthorityNote:
        "सभी उप-योग और कुल राशियों की गणना केवल सर्वर-सत्यापित उत्पाद मूल्यों का उपयोग करके की जाती है। क्लाइंट-साइड मूल्यों को कभी भी आधिकारिक नहीं माना जाता है।",
      revalidateButton: "कार्ट पुनः सत्यापित करें और चेकआउट के लिए जांचें",
      revalidatingButton: "लाइव स्टॉक और मूल्य सत्यापित किए जा रहे हैं…",
      proceedToCheckoutButton: "सुरक्षित चेकआउट के लिए आगे बढ़ें",
      revalidationIssuesTitle: "लाइव उत्पाद कैटलॉग के अनुसार कार्ट अपडेट की गई",
      revalidationVerifiedTitle: "लाइव सर्वर कैटलॉग के विरुद्ध कार्ट सत्यापित",
      revalidationVerifiedDesc:
        "आपकी कार्ट के सभी उत्पाद सक्रिय हैं, स्टॉक में हैं और आधिकारिक सर्वर इकाई मूल्यों के अनुसार गणना किए गए हैं।",
      checkoutNextPhaseTitle: "चेकआउट और भुगतान अगले चरण के लिए निर्धारित",
      checkoutNextPhaseDesc:
        "आपकी शॉपिंग कार्ट और सर्वर-साइड मूल्य/स्टॉक सत्यापन पूरा हो गया है। ऑर्डर निर्माण और भुगतान प्रक्रिया अगले चरण में सक्षम की जाएगी — कोई ऑर्डर या शुल्क नहीं बनाया गया है।",
      revalidationFailedTitle: "सर्वर से कार्ट सत्यापित करने में असमर्थ",
      revalidationFailedDesc:
        "इस समय लाइव सर्वर सत्यापन पूरा नहीं हो सका। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
      issueRemovedInactive: (name: string) =>
        `"${name}" अब प्रकाशित कैटलॉग में सक्रिय नहीं है और आपकी कार्ट से हटा दिया गया है।`,
      issueOutOfStock: (name: string) =>
        `"${name}" वर्तमान में स्टॉक में नहीं है और आपकी सक्रिय कार्ट से हटा दिया गया है।`,
      issuePriceUnavailable: (name: string) =>
        `"${name}" के लिए अब ऑनलाइन इकाई मूल्य उपलब्ध नहीं है और इसे आपकी कार्ट से हटा दिया गया है।`,
      issuePriceUpdated: (
        name: string,
        oldPrice: string,
        newPrice: string
      ) =>
        `"${name}" का इकाई मूल्य ${oldPrice} से अपडेट करके वर्तमान आधिकारिक मूल्य ${newPrice} कर दिया गया है।`,
      issueQuantityAdjusted: (
        name: string,
        requested: number,
        available: number
      ) =>
        `उपलब्ध स्टॉक के आधार पर "${name}" की मात्रा ${requested} से समायोजित करके ${available} कर दी गई है।`,
      issueInvalidQuantity: (name: string) =>
        `"${name}" के लिए अमान्य मात्रा को मान्य मान पर रीसेट किया गया है।`,
    },
    customerCheckout: {
      backToCart: "शॉपिंग कार्ट पर वापस जाएं",
      backToCatalogue: "उत्पाद कैटलॉग देखें",
      backToDashboard: "ग्राहक डैशबोर्ड",
      checkoutBadge: "ग्राहक ऑर्डर चेकआउट",
      heading: "सुरक्षित ऑर्डर चेकआउट",
      subtitle:
        "अपने सर्वर-सत्यापित कार्ट उत्पादों की समीक्षा करें, डिलीवरी पता दर्ज करें और आधिकारिक सत्यापन के लिए अपना ऑर्डर सबमिट करें।",
      loadingMessage:
        "आपका चेकआउट सारांश लोड हो रहा है और लाइव उत्पाद मूल्य सत्यापित किए जा रहे हैं…",
      emptyCartTitle: "चेकआउट के लिए कोई उत्पाद उपलब्ध नहीं है",
      emptyCartDescription:
        "आपकी शॉपिंग कार्ट वर्तमान में खाली है। चेकआउट के लिए आगे बढ़ने से पहले कृपया सक्रिय कृषि उत्पादों को अपनी कार्ट में जोड़ें।",
      browseProductsButton: "उत्पाद कैटलॉग देखें",
      returnToCartButton: "शॉपिंग कार्ट पर वापस जाएं",
      deliverySectionHeading: "डिलीवरी और संपर्क जानकारी",
      deliverySectionSubtitle:
        "इस ऑर्डर के लिए प्राप्तकर्ता का नाम, मोबाइल नंबर और डिलीवरी स्थान सत्यापित या अपडेट करें।",
      prefilledProfileNotice:
        "आपके सत्यापित ग्राहक प्रोफ़ाइल से उपलब्ध संपर्क विवरण नीचे पहले से भरे गए हैं। आप इस ऑर्डर के लिए उनकी समीक्षा कर सकते हैं और उन्हें अपडेट कर सकते हैं।",
      customerNameLabel: "प्राप्तकर्ता का पूरा नाम",
      customerNamePlaceholder: "प्राप्तकर्ता का पूरा नाम दर्ज करें",
      mobileLabel: "मोबाइल नंबर",
      mobilePlaceholder: "10-अंकीय मोबाइल नंबर",
      addressLineLabel: "डिलीवरी का पता (मकान / खेत / पहचान चिन्ह)",
      addressLinePlaceholder:
        "मकान नंबर, खेत का नाम, सड़क या नज़दीकी पहचान चिन्ह दर्ज करें",
      villageOrCityLabel: "गाँव / कस्बा / शहर",
      villageOrCityPlaceholder: "गाँव, कस्बे या शहर का नाम दर्ज करें",
      districtLabel: "ज़िला",
      districtPlaceholder: "ज़िले का नाम दर्ज करें",
      stateLabel: "राज्य",
      statePlaceholder: "राज्य का नाम दर्ज करें",
      pinCodeLabel: "पिन कोड (PIN Code)",
      pinCodePlaceholder: "6-अंकीय पिन कोड",
      orderItemsHeading: "ऑर्डर के लिए चयनित उत्पाद",
      packSizeLabel: "पैक आकार:",
      quantityLabel: "मात्रा:",
      unitPriceLabel: "इकाई मूल्य:",
      lineSubtotalLabel: "उत्पाद कुल",
      summaryHeading: "अंतिम ऑर्डर सारांश",
      uniqueProductsLabel: "चयनित उत्पाद",
      totalUnitsLabel: "कुल इकाइयां",
      subtotalLabel: "सर्वर-सत्यापित उप-योग",
      payableAmountLabel: "अंतिम देय राशि (Total Payable)",
      serverAuthorityNotice:
        "आपका ऑर्डर बनाने से पहले प्रत्येक उत्पाद की स्थिति, पैक आकार, उपलब्ध स्टॉक, इकाई मूल्य, उप-योग और अंतिम कुल राशि को सर्वर पर पुनः सत्यापित किया जाता है।",
      paymentPendingNoticeTitle: "भुगतान और सत्यापन स्थिति नीति",
      paymentPendingNoticeDesc:
        "यह ऑर्डर सबमिट करने पर आपका ऑर्डर 'सत्यापन लंबित (Pending Verification)' और भुगतान स्थिति 'अदत्त (Unpaid)' के रूप में दर्ज किया जाता है। सत्यापन के बाद ही ऑनलाइन भुगतान और डिस्पैच की पुष्टि की जाएगी।",
      placeOrderButton: "सत्यापन के लिए ऑर्डर दर्ज करें (Place Order)",
      placingOrderButton: "सत्यापन और ऑर्डर निर्माण हो रहा है…",
      revalidatingBeforeOrderNotice:
        "सर्वर से लाइव स्टॉक और आधिकारिक मूल्यों का सत्यापन किया जा रहा है…",
      submissionErrorTitle: "ऑर्डर सबमिट करने में असमर्थ",
      submissionErrorFallback:
        "कृपया हाइलाइट किए गए फ़ील्ड या कार्ट उपलब्धता की समीक्षा करें और पुनः प्रयास करें।",
      networkErrorDesc:
        "ऑर्डर सर्वर से संपर्क करते समय नेटवर्क त्रुटि हुई। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
      cartChangedErrorDesc:
        "आपकी कार्ट में एक या अधिक उत्पादों का मूल्य, स्टॉक या उपलब्धता बदल गई है। आपकी कार्ट को नवीनतम सर्वर डेटा के साथ अपडेट किया गया है — कृपया दोबारा सबमिट करने से पहले समीक्षा करें।",
      confirmationBadge: "ऑर्डर दर्ज किया गया — सत्यापन लंबित",
      confirmationHeading: "आपका ऑर्डर सुरक्षित रूप से दर्ज कर लिया गया है",
      confirmationSubtitle:
        "धन्यवाद। आपका ऑर्डर अनुरोध सुरक्षित रूप से सहेजा गया है और आपके ग्राहक खाते से जोड़ दिया गया है।",
      orderNumberLabel: "ऑर्डर संदर्भ संख्या",
      orderIdLabel: "सिस्टम ऑर्डर आईडी",
      orderCreatedAtLabel: "ऑर्डर दर्ज होने का समय",
      orderStatusLabel: "ऑर्डर स्थिति",
      paymentStatusLabel: "भुगतान स्थिति",
      statusPendingVerification: "सत्यापन लंबित (Pending Verification)",
      statusConfirmed: "पुष्टि की गई (Confirmed)",
      statusRejected: "अस्वीकृत (Rejected)",
      statusCancelled: "रद्द (Cancelled)",
      paymentStatusUnpaid: "अदत्त — भुगतान अभी पूर्ण नहीं हुआ है (Unpaid)",
      paymentStatusPending: "भुगतान लंबित",
      paymentStatusPaid: "भुगतान पूर्ण (Paid)",
      paymentStatusFailed: "भुगतान विफल",
      verificationExplainTitle:
        "महत्वपूर्ण सूचना: भुगतान और डिस्पैच सत्यापन लंबित हैं",
      verificationExplainDesc:
        "आपका ऑर्डर 'सत्यापन लंबित (Pending Verification)' और भुगतान स्थिति 'अदत्त (Unpaid)' के रूप में दर्ज किया गया है। अभी कोई भुगतान नहीं लिया गया है, और भुगतान व कंपनी द्वारा ऑर्डर सत्यापन पूरा होने तक डिस्पैच या डिलीवरी की पुष्टि नहीं हुई है।",
      deliverySummaryHeading: "दर्ज किया गया डिलीवरी विवरण",
      orderedItemsHeading: "दर्ज किए गए उत्पाद और सत्यापित मूल्य",
      continueShoppingButton: "कैटलॉग में खरीदारी जारी रखें",
      goToDashboardButton: "ग्राहक डैशबोर्ड पर वापस जाएं",
      orderNotFoundTitle: "ऑर्डर रिकॉर्ड नहीं मिला",
      orderNotFoundDesc:
        "अनुरोधित ऑर्डर नहीं मिला या यह आपके प्रमाणित ग्राहक खाते से संबंधित नहीं है।",
    },
    customerOrders: {
      backToDashboard: "डैशबोर्ड पर वापस जाएं",
      badge: "सत्यापित ग्राहक ऑर्डर्स",
      heading: "मेरा ऑर्डर इतिहास और बुकिंग सत्यापन",
      subtitle:
        "अपने दर्ज किए गए ऑर्डर्स, पैकेजिंग इकाइयां, डिलीवरी पते और कंपनी सत्यापन स्थिति को ट्रैक करें।",
      myOrdersButton: "मेरे ऑर्डर्स",
      viewAllOrdersButton: "सभी ऑर्डर्स देखें",
      browseCatalogueButton: "उत्पाद कैटलॉग देखें",
      orderNumberLabel: "ऑर्डर संदर्भ क्रमांक",
      orderIdLabel: "सिस्टम आईडी",
      orderDateLabel: "ऑर्डर की तारीख",
      itemsSummaryHeading: "ऑर्डर किए गए उत्पाद",
      totalQuantityLabel: "कुल इकाइयां",
      totalAmountLabel: "कुल देय राशि",
      orderStatusLabel: "ऑर्डर स्थिति",
      paymentStatusLabel: "भुगतान स्थिति",
      viewDetailsButton: "विवरण देखें",
      emptyTitle: "अभी तक कोई ऑर्डर नहीं मिला",
      emptyDescription:
        "आपने अभी तक कोई ऑर्डर दर्ज नहीं किया है। उत्पाद चुनने और अपना पहला ऑर्डर दर्ज करने के लिए हमारा सत्यापित उत्पाद कैटलॉग देखें।",
      loadingMessage: "आपके सत्यापित ऑर्डर्स लोड हो रहे हैं…",
      errorMessage:
        "इस समय आपके ऑर्डर्स लोड नहीं किए जा सके। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
      retryButton: "पुनः प्रयास करें",
      statusPendingVerification: "सत्यापन लंबित",
      statusConfirmed: "सत्यापित / पुष्ट",
      statusRejected: "अस्वीकृत",
      statusCancelled: "रद्द",
      paymentStatusUnpaid: "अदत्त (भुगतान शेष)",
      paymentStatusPending: "भुगतान लंबित",
      paymentStatusPaid: "भुगतान संपन्न (Paid)",
      paymentStatusFailed: "भुगतान विफल",
    },
    adminProducts: {
      backToDashboard: "प्रशासक डैशबोर्ड पर वापस जाएं",
      signedInAsPrefix: "साइन इन किया गया खाता:",
      adminLabelPrefix: "प्रशासक:",
      catalogueBadge: "चरण 3 उत्पाद मास्टर कैटलॉग",
      heading: "कंपनी उत्पाद प्रबंधन",
      subtitle:
        "आधिकारिक कंपनी उत्पाद फ़ॉर्मूलेशन, लक्षित फसल विनिर्देश, खुराक दिशानिर्देश और ग्राहक कैटलॉग दृश्यता बनाएं, समीक्षा करें और अपडेट करें।",
      addNewProductButton: "नया उत्पाद जोड़ें",
      totalProductsLabel: "कुल उत्पाद",
      activeVisibleLabel: "सक्रिय (ग्राहकों को दृश्यमान)",
      draftRecordsLabel: "ड्राफ्ट (Draft) रिकॉर्ड",
      archivedRecordsLabel: "संग्रहीत (Archived) रिकॉर्ड",
      dbErrorTitle: "डेटाबेस क्वेरी त्रुटि",
      dbErrorDesc:
        "Firestore उत्पाद संग्रह से डेटा प्राप्त करने में असमर्थ। कृपया अपने Firebase Admin क्रेडेंशियल और Firestore डेटाबेस सेटअप की जाँच करें।",
      emptyTitle: "अभी तक कोई कंपनी उत्पाद दर्ज नहीं किया गया है",
      emptyDescription:
        "कोई भी काल्पनिक उत्पाद पहले से लोड नहीं है। अपना पहला आधिकारिक कंपनी उत्पाद रिकॉर्ड और तकनीकी विनिर्देश दर्ज करने के लिए 'नया उत्पाद जोड़ें' पर क्लिक करें।",
      createFirstProductButton: "पहला उत्पाद रिकॉर्ड बनाएं",
      targetCropsLabel: "लक्षित फसलें:",
      packSizesLabel: "पैक आकार:",
      viewAndEditButton: "देखें और संपादित करें",
      statusActivePublished: "सक्रिय (प्रकाशित)",
      statusActiveVisible: "सक्रिय (ग्राहकों को दृश्यमान)",
      statusDraft: "ड्राफ्ट (Draft)",
      statusDraftInternal: "ड्राफ्ट (केवल आंतरिक)",
      statusArchived: "संग्रहीत (Archived)",
      statusArchivedHidden: "संग्रहीत (छिपा हुआ)",
      backToProductManagement: "उत्पाद प्रबंधन पर वापस जाएं",
      approvedTargetCropsLabel: "स्वीकृत लक्षित फसलें",
      availablePackSizesLabel: "उपलब्ध पैक आकार",
      unitPriceLabel: "इकाई मूल्य",
      lastUpdatedLabel: "अंतिम अपडेट",
      loadingListMessage: "उत्पाद मास्टर रिकॉर्ड लोड हो रहे हैं…",
      loadingDetailMessage: "उत्पाद रिकॉर्ड लोड हो रहा है…",
      verifyingAdminMessage: "प्रशासक सेशन सत्यापित किया जा रहा है…",
    },
    adminProductForm: {
      createHeading: "आधिकारिक उत्पाद विनिर्देश दर्ज करें",
      editHeading: "उत्पाद मास्टर रिकॉर्ड संपादित करें",
      subtitle:
        "केवल सत्यापित कंपनी उत्पाद विवरण, सक्रिय फ़ॉर्मूलेशन, स्वीकृत फसल श्रेणियां और खुराक निर्देश दर्ज करें।",
      backToListLink: "उत्पाद सूची पर वापस जाएं",
      saveFailedTitle: "सहेजना विफल रहा",
      saveFailedFallback: "उत्पाद विनिर्देश रिकॉर्ड सहेजने में असमर्थ।",
      networkSaveError:
        "उत्पाद रिकॉर्ड सहेजते समय नेटवर्क त्रुटि हुई। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।",
      deleteFailedFallback: "उत्पाद रिकॉर्ड हटाने में विफल।",
      networkDeleteError: "उत्पाद रिकॉर्ड हटाते समय नेटवर्क त्रुटि हुई।",
      productSavedTitle: "उत्पाद सहेजा गया",
      productSavedMessage:
        "उत्पाद विनिर्देश और प्रकाशन स्थिति Firestore में अपडेट कर दी गई है।",
      skuLabel: "उत्पाद कोड / SKU",
      skuHint: "अद्वितीय कंपनी SKU कोड।",
      skuPlaceholder: "उदा., SKU-001",
      nameLabel: "आधिकारिक उत्पाद का नाम",
      namePlaceholder: "आधिकारिक कंपनी उत्पाद का नाम दर्ज करें",
      statusLabel: "प्रकाशन स्थिति",
      statusHint: "सक्रिय उत्पाद ग्राहक पोर्टल में दिखाई देते हैं।",
      categoryLabel: "उत्पाद श्रेणी (Category)",
      categoryHint: "कंपनी द्वारा निर्धारित उत्पाद वर्गीकरण।",
      categoryPlaceholder: "श्रेणी दर्ज करें",
      unitPriceLabel: "इकाई मूल्य (INR — वैकल्पिक)",
      unitPriceHint: "यदि मूल्य पूछताछ पर दिया जाता है तो खाली छोड़ दें।",
      unitPricePlaceholder: "वैकल्पिक इकाई मूल्य",
      registrationLabel: "वैधानिक / पंजीकरण संदर्भ",
      registrationHint: "वैकल्पिक लाइसेंस या पंजीकरण संख्या।",
      registrationPlaceholder: "वैकल्पिक पंजीकरण संदर्भ",
      shortDescLabel: "संक्षिप्त सारांश विवरण",
      shortDescHint:
        "उत्पाद सूची कार्ड पर प्रदर्शित संक्षिप्त विवरण (10–500 अक्षर)।",
      shortDescPlaceholder: "उत्पाद का स्पष्ट और तथ्यात्मक सारांश दर्ज करें",
      compositionLabel: "सक्रिय संरचना और तकनीकी विनिर्देश",
      compositionHint:
        "आधिकारिक रासायनिक/जैविक फ़ॉर्मूलेशन, सक्रिय घटक और सांद्रता विवरण।",
      compositionPlaceholder: "सत्यापित संरचना और तकनीकी मापदंड दर्ज करें",
      targetCropsLabel: "स्वीकृत लक्षित फसलें",
      targetCropsHint: "एक से अधिक फसलों को अल्पविराम (comma) से अलग करें।",
      targetCropsPlaceholder: "अल्पविराम से अलग की गई स्वीकृत फसलें",
      packSizesLabel: "उपलब्ध पैक आकार",
      packSizesHint:
        "एक से अधिक पैक आकारों को अल्पविराम से अलग करें (उदा., 250 ml, 500 ml, 1 L)।",
      packSizesPlaceholder: "अल्पविराम से अलग किए गए पैकेजिंग आकार",
      dosageLabel: "खुराक और उपयोग के निर्देश",
      dosageHint:
        "प्रति एकड़/हेक्टेयर सत्यापित खुराक, घोल अनुपात और उपयोग की अवस्था।",
      dosagePlaceholder: "आधिकारिक खुराक और उपयोग विधि दर्ज करें",
      safetyLabel: "सुरक्षा सावधानियां और भंडारण निर्देश (वैकल्पिक)",
      safetyHint: "रख-रखाव सावधानियां, भंडारण तापमान और लेबल सुरक्षा निर्देश।",
      safetyPlaceholder: "रख-रखाव और भंडारण निर्देश दर्ज करें",
      createSubmitButton: "उत्पाद रिकॉर्ड बनाएं",
      editSubmitButton: "उत्पाद परिवर्तन सहेजें",
      deleteProductButton: "उत्पाद हटाएं",
      confirmDeletePrompt: "स्थायी रूप से हटाने की पुष्टि करें?",
      confirmDeleteYes: "हाँ, हटाएं",
      confirmDeleteNo: "नहीं",
      benefitsLabel: "प्रमुख कृषि लाभ",
      benefitsHint: "प्रमुख लाभ नई लाइन या अल्पविराम से अलग करके दर्ज करें",
      benefitsPlaceholder:
        "उदा. जड़ों का विकास सुधारता है\nसूखा सहनशीलता बढ़ाता है",
      applicationMethodLabel: "प्रयोग विधि",
      applicationMethodHint:
        "पर्ण छिड़काव, ड्रिप सिंचाई, बीज उपचार या मृदा प्रयोग",
      applicationMethodPlaceholder:
        "उदा. प्रारंभिक वानस्पतिक अवस्था में पर्ण छिड़काव करें",
      modeOfActionLabel: "कार्य प्रणाली",
      modeOfActionHint: "जैविक या रासायनिक कार्य प्रणाली",
      modeOfActionPlaceholder:
        "उदा. प्रणालीगत अवशोषण जो चयापचय एंजाइमों को उत्तेजित करता है",
      compatibilityLabel: "संगतता सूचना",
      compatibilityHint: "अन्य उर्वरक या कीटनाशकों के साथ मिश्रण की जानकारी",
      compatibilityPlaceholder:
        "उदा. अधिकांश उर्वरकों के साथ संगत; अत्यधिक क्षारीय मिश्रण से बचें",
      youtubeUrlLabel: "YouTube ट्यूटोरियल लिंक",
      youtubeUrlHint: "उत्पाद प्रदर्शन के लिए आधिकारिक YouTube या youtu.be लिंक",
      youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=...",
    },
    adminOrders: {
      backToDashboard: "प्रशासक डैशबोर्ड पर वापस जाएं",
      backToOrdersList: "ऑर्डर प्रबंधन पर वापस जाएं",
      signedInAsPrefix: "लॉग इन किया गया है",
      badge: "चरण 4.3 ऑर्डर प्रबंधन",
      heading: "ग्राहक ऑर्डर प्रबंधन",
      subtitle:
        "ग्राहक ऑर्डर की समीक्षा करें, कृषि उत्पाद बुकिंग सत्यापित करें, वितरण पते की जांच करें और ऑर्डर स्थिति प्रबंधित करें।",
      detailHeading: "ऑर्डर समीक्षा और सत्यापन",
      detailSubtitle:
        "ग्राहक बुकिंग विवरण, उत्पाद सामग्री, सत्यापित प्राप्तकर्ता पता जांचें और बुकिंग को अधिकृत या अस्वीकृत करें।",
      totalOrdersLabel: "कुल ऑर्डर्स",
      pendingVerificationLabel: "सत्यापन लंबित",
      verifiedOrdersLabel: "सत्यापित ऑर्डर्स",
      rejectedOrdersLabel: "अस्वीकृत ऑर्डर्स",
      cancelledOrdersLabel: "रद्द ऑर्डर्स",
      filterAll: "सभी ऑर्डर्स",
      filterPending: "सत्यापन लंबित",
      filterVerified: "सत्यापित",
      filterRejected: "अस्वीकृत",
      filterCancelled: "रद्द किए गए",
      emptyTitle: "कोई ऑर्डर नहीं मिला",
      emptyDescription:
        "वर्तमान फ़िल्टर से मेल खाने वाला कोई ग्राहक ऑर्डर नहीं मिला। नए सबमिट किए गए ऑर्डर यहां अपने आप दिखाई देंगे।",
      dbErrorTitle: "ऑर्डर डेटाबेस अनुपलब्ध",
      dbErrorDesc:
        "इस समय Firestore से दर्ज ग्राहक ऑर्डर प्राप्त करने में असमर्थ।",
      orderRefLabel: "ऑर्डर संदर्भ संख्या",
      orderDateLabel: "ऑर्डर तिथि",
      customerHeading: "ग्राहक विवरण",
      customerNameLabel: "प्राप्तकर्ता का नाम",
      customerEmailLabel: "खाता ईमेल",
      customerMobileLabel: "संपर्क मोबाइल",
      customerUidLabel: "ग्राहक UID",
      deliveryAddressHeading: "वितरण जानकारी",
      addressLineLabel: "पता पंक्ति",
      villageCityLabel: "गाँव / शहर",
      districtStateLabel: "ज़िला और राज्य",
      pinCodeLabel: "पिन कोड",
      productsHeading: "ऑर्डर किए गए उत्पाद और मात्रा",
      productNameHeader: "उत्पाद का नाम",
      packSizeHeader: "पैक आकार",
      unitPriceHeader: "इकाई मूल्य",
      quantityHeader: "मात्रा",
      lineTotalHeader: "कुल",
      itemsCountSummary: (count: number) =>
        `${count} ${count === 1 ? "उत्पाद सामग्री" : "उत्पाद सामग्री"}`,
      totalAmountLabel: "कुल ऑर्डर राशि",
      orderStatusLabel: "ऑर्डर स्थिति",
      paymentStatusLabel: "भुगतान स्थिति",
      viewDetailsButton: "विवरण देखें",
      verifyOrderButton: "ऑर्डर सत्यापित करें",
      rejectOrderButton: "ऑर्डर अस्वीकृत करें",
      confirmVerifyTitle: "ऑर्डर सत्यापन की पुष्टि करें",
      confirmVerifyMessage: (orderNumber: string) =>
        `क्या आप वाकई ऑर्डर ${orderNumber} को सत्यापित करना चाहते हैं? यह स्टॉक उपलब्धता की पुष्टि करता है और ऑर्डर को आगे की प्रक्रिया के लिए स्वीकृत करता है।`,
      confirmVerifyNote:
        "नोट: ऑर्डर सत्यापन केवल वैधता की पुष्टि करता है, भुगतान को स्वचालित रूप से चुकता नहीं करता। भुगतान स्थिति स्वतंत्र रहती है।",
      confirmRejectTitle: "ऑर्डर अस्वीकृति की पुष्टि करें",
      confirmRejectMessage: (orderNumber: string) =>
        `क्या आप वाकई ऑर्डर ${orderNumber} को अस्वीकृत करना चाहते हैं? यह बुकिंग को अस्वीकृत के रूप में चिह्नित करेगा।`,
      rejectionReasonLabel: "अस्वीकृति का कारण (वैकल्पिक)",
      rejectionReasonPlaceholder:
        "उदा. वितरण क्षेत्र अनुपलब्ध, ग्राहक के अनुरोध पर, या दोहराई गई बुकिंग",
      cancelActionButton: "रद्द करें",
      confirmVerifyAction: "हाँ, ऑर्डर सत्यापित करें",
      confirmRejectAction: "हाँ, ऑर्डर अस्वीकृत करें",
      processingAction: "प्रक्रिया जारी है…",
      verificationSuccessNotice: (orderNumber: string) =>
        `ऑर्डर ${orderNumber} को सफलतापूर्वक सत्यापित कर दिया गया है।`,
      rejectionSuccessNotice: (orderNumber: string) =>
        `ऑर्डर ${orderNumber} को अस्वीकृत कर दिया गया है।`,
      auditVerificationHeading: "सत्यापन और ऑडिट विवरण",
      verifiedByLabel: "सत्यापित किया गया (प्रशासक UID)",
      verifiedAtLabel: "सत्यापन समय",
      rejectedByLabel: "अस्वीकृत किया गया (प्रशासक UID)",
      rejectedAtLabel: "अस्वीकृति का समय",
      rejectionReasonValueLabel: "दर्ज कारण",
      loadingListMessage: "Firestore से ग्राहक ऑर्डर लोड किए जा रहे हैं…",
      loadingDetailMessage: "ऑर्डर और वितरण विवरण लोड किए जा रहे हैं…",
      orderNotFoundTitle: "ऑर्डर रिकॉर्ड नहीं मिला",
      orderNotFoundDesc:
        "अनुरोधित ऑर्डर डेटाबेस में नहीं मिला।",
    },
    companyProfile: {
      badge: "प्रमाणित प्रशासन",
      heading: "कंपनी प्रोफाइल प्रबंधन",
      subtitle:
        "सत्यापित कंपनी पहचान, पंजीकृत विनिर्माण परिसर पता और आधिकारिक संपर्क विवरण अपडेट करें।",
      backToDashboard: "डैशबोर्ड पर वापस जाएं",
      saveButton: "कंपनी प्रोफाइल सहेजें",
      savingButton: "प्रोफाइल सहेजा जा रहा है…",
      savedSuccessTitle: "कंपनी प्रोफाइल सफलतापूर्वक सहेजा गया",
      savedSuccessMessage:
        "कंपनी और विनिर्माण परिसर का विवरण सुरक्षित रूप से अपडेट हो गया है।",
      generalInfoHeading: "सामान्य कंपनी जानकारी",
      companyNameLabel: "कंपनी का नाम",
      companyNamePlaceholder: "उदा. सुप्रिया एग्रोबायोटेक",
      taglineLabel: "कंपनी ध्येयवाक्य / टैगलाइन",
      taglinePlaceholder: "उदा. समृद्ध कृषि, उज्ज्वल भविष्य",
      aboutUsLabel: "कंपनी के बारे में",
      aboutUsPlaceholder:
        "विनिर्माण क्षमता और कंपनी के मिशन का संक्षिप्त परिचय",
      registrationNumberLabel: "पंजीकरण / लाइसेंस / GST नंबर",
      registrationNumberPlaceholder: "उदा. MH-AGRO-2026-001",
      facilityAddressHeading: "विनिर्माण परिसर एवं कार्यालय पता",
      facilityNameLabel: "परिसर / यूनिट का नाम",
      facilityNamePlaceholder: "उदा. विनिर्माण संयंत्र एवं अनुसंधान केंद्र",
      streetAddressLabel: "सड़क / प्लॉट / क्षेत्र",
      streetAddressPlaceholder: "उदा. प्लॉट नं. १२, एमआईडीसी औद्योगिक क्षेत्र",
      villageOrCityLabel: "गाँव / शहर",
      villageOrCityPlaceholder: "उदा. बारामती",
      districtLabel: "ज़िला",
      districtPlaceholder: "उदा. पुणे",
      stateLabel: "राज्य",
      statePlaceholder: "उदा. महाराष्ट्र",
      pinCodeLabel: "पिन कोड",
      pinCodePlaceholder: "उदा. ४१३१०२",
      contactHeading: "आधिकारिक संपर्क चैनल",
      helplinePhoneLabel: "ग्राहक हेल्पलाइन नंबर",
      helplinePhonePlaceholder: "उदा. +91 9876543210",
      supportEmailLabel: "आधिकारिक सपोर्ट ईमेल",
      supportEmailPlaceholder: "उदा. support@supriyaagrobiotech.com",
      officeHoursLabel: "कामकाज का समय",
      officeHoursPlaceholder: "उदा. सोम - शनि: सुबह ९:०० से शाम ६:००",
      dbErrorTitle: "कंपनी प्रोफाइल लोड नहीं किया जा सका",
      dbErrorDesc:
        "डेटाबेस से संपर्क करने में त्रुटि हुई। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
    },
  },
};

export const AUTH_LANGUAGE_COPY: Record<SupportedLanguage, AuthLanguageCopy> = {
  en: TRANSLATIONS.en.auth,
  mr: TRANSLATIONS.mr.auth,
  hi: TRANSLATIONS.hi.auth,
};

export function getTranslations(language: SupportedLanguage): SiteTranslations {
  return TRANSLATIONS[normalizeLanguage(language)];
}
