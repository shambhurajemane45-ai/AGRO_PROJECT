import type {
  LoginFormErrors,
  LoginFormState,
  ProductStatus,
  ProductValidationErrors,
  SignupFormErrors,
  SignupFormState,
  SupportedLanguage,
  ValidatedProductPayload,
} from "../types/index.ts";
import { DEFAULT_LANGUAGE, getTranslations } from "./language/index.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^\+?[0-9\s-]{10,15}$/;
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{1,39}$/;

function isValidProductStatus(value: string): value is ProductStatus {
  return value === "active" || value === "draft" || value === "archived";
}

/**
 * Validates login form inputs on the client before any authentication request is attempted.
 * Note: Client-side validation is strictly for user experience and accessibility.
 * Real authentication and role authorization are enforced via Firebase Authentication
 * and Firebase Admin SDK on the server.
 */
export function validateLoginForm(
  values: LoginFormState,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): {
  isValid: boolean;
  errors: LoginFormErrors;
} {
  const errors: LoginFormErrors = {};
  const v = getTranslations(language).validation;

  const trimmedEmail = values.email.trim();

  if (!trimmedEmail) {
    errors.email = v.emailRequired;
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = v.emailInvalid;
  }

  if (!values.password) {
    errors.password = v.passwordRequired;
  } else if (values.password.trim().length < 8) {
    errors.password = v.passwordMinLength;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates customer registration inputs on the client.
 */
export function validateSignupForm(
  values: SignupFormState,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): {
  isValid: boolean;
  errors: SignupFormErrors;
} {
  const errors: SignupFormErrors = {};
  const v = getTranslations(language).validation;

  const trimmedName = values.fullName.trim();
  const trimmedEmail = values.email.trim();
  const trimmedMobile = values.mobile.trim();

  if (!trimmedName) {
    errors.fullName = v.fullNameRequired;
  } else if (trimmedName.length < 2) {
    errors.fullName = v.fullNameMinLength;
  }

  if (!trimmedEmail) {
    errors.email = v.emailRequired;
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = v.emailInvalid;
  }

  if (!trimmedMobile) {
    errors.mobile = v.mobileRequired;
  } else if (!MOBILE_PATTERN.test(trimmedMobile)) {
    errors.mobile = v.mobileInvalid;
  }

  if (!values.password) {
    errors.password = v.passwordRequired;
  } else if (values.password.trim().length < 8) {
    errors.password = v.passwordMinLength;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = v.confirmPasswordRequired;
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = v.passwordsDoNotMatch;
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = v.termsRequired;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normalizes a comma- or newline-delimited string or string[] into a deduplicated array of non-empty strings.
 */
export function parseDelimitedList(input: unknown): string[] {
  if (Array.isArray(input)) {
    const items = input
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(items));
  }

  if (typeof input === "string") {
    const items = input
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(items));
  }

  return [];
}

/**
 * Validates product creation/update payloads on both the client and server.
 */
export function validateProductPayload(
  raw: Record<string, unknown>,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): {
  isValid: boolean;
  errors: ProductValidationErrors;
  data?: ValidatedProductPayload;
} {
  const errors: ProductValidationErrors = {};
  const v = getTranslations(language).validation;

  const sku =
    typeof raw.sku === "string" ? raw.sku.trim().toUpperCase() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const category = typeof raw.category === "string" ? raw.category.trim() : "";
  const shortDescription =
    typeof raw.shortDescription === "string" ? raw.shortDescription.trim() : "";
  const composition =
    typeof raw.composition === "string" ? raw.composition.trim() : "";
  const dosageAndApplication =
    typeof raw.dosageAndApplication === "string"
      ? raw.dosageAndApplication.trim()
      : "";
  const safetyAndStorage =
    typeof raw.safetyAndStorage === "string" ? raw.safetyAndStorage.trim() : "";
  const registrationNumber =
    typeof raw.registrationNumber === "string"
      ? raw.registrationNumber.trim()
      : "";

  const targetCrops = parseDelimitedList(
    raw.targetCrops ?? raw.targetCropsInput
  );
  const packSizes = parseDelimitedList(raw.packSizes ?? raw.packSizesInput);

  const rawStatus =
    typeof raw.status === "string" ? raw.status.trim() : "";

  if (!sku) {
    errors.sku = v.skuRequired;
  } else if (!SKU_PATTERN.test(sku)) {
    errors.sku = v.skuInvalid;
  }

  if (!name) {
    errors.name = v.productNameRequired;
  } else if (name.length < 2 || name.length > 140) {
    errors.name = v.productNameLength;
  }

  if (!category) {
    errors.category = v.categoryRequired;
  } else if (category.length < 2 || category.length > 80) {
    errors.category = v.categoryLength;
  }

  if (!shortDescription) {
    errors.shortDescription = v.shortDescRequired;
  } else if (shortDescription.length < 10 || shortDescription.length > 500) {
    errors.shortDescription = v.shortDescLength;
  }

  if (!composition) {
    errors.composition = v.compositionRequired;
  } else if (composition.length < 3 || composition.length > 1000) {
    errors.composition = v.compositionLength;
  }

  if (targetCrops.length === 0) {
    errors.targetCrops = v.targetCropsRequired;
  } else if (targetCrops.length > 30) {
    errors.targetCrops = v.targetCropsMax;
  }

  if (!dosageAndApplication) {
    errors.dosageAndApplication = v.dosageRequired;
  } else if (
    dosageAndApplication.length < 5 ||
    dosageAndApplication.length > 2000
  ) {
    errors.dosageAndApplication = v.dosageLength;
  }

  if (packSizes.length === 0) {
    errors.packSizes = v.packSizesRequired;
  } else if (packSizes.length > 20) {
    errors.packSizes = v.packSizesMax;
  }

  let unitPrice: number | null = null;
  const rawPrice = raw.unitPrice ?? raw.unitPriceInput;
  if (
    rawPrice !== null &&
    rawPrice !== undefined &&
    String(rawPrice).trim() !== ""
  ) {
    const parsedPrice = Number(String(rawPrice).trim());
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      errors.unitPrice = v.unitPriceInvalid;
    } else {
      unitPrice = Math.round(parsedPrice * 100) / 100;
    }
  }

  if (safetyAndStorage.length > 1500) {
    errors.safetyAndStorage = v.safetyMax;
  }

  if (registrationNumber.length > 120) {
    errors.registrationNumber = v.registrationMax;
  }

  if (!isValidProductStatus(rawStatus)) {
    errors.status = v.statusInvalid;
  }

  if (Object.keys(errors).length > 0 || !isValidProductStatus(rawStatus)) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: {},
    data: {
      sku,
      name,
      category,
      shortDescription,
      composition,
      targetCrops,
      dosageAndApplication,
      packSizes,
      unitPrice,
      safetyAndStorage,
      registrationNumber,
      status: rawStatus,
    },
  };
}
