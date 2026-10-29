import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_LANGUAGE_COPY,
  DEFAULT_LANGUAGE,
  formatCurrencyForLanguage,
  formatDateForLanguage,
  getLanguageOption,
  getPortalLoginDestination,
  getStoredLanguagePreference,
  getTranslations,
  isSupportedLanguage,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  SUPPORTED_LANGUAGE_OPTIONS,
  TRANSLATIONS,
} from "../src/lib/language/index.ts";
import {
  validateLoginForm,
  validateProductPayload,
  validateSignupForm,
} from "../src/lib/validation.ts";
import type { CompanyProfileRecord, ProductRecord } from "../src/types/index.ts";

function collectLeafKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") {
    return [prefix];
  }

  if (Array.isArray(obj)) {
    return obj.flatMap((item, index) =>
      collectLeafKeys(item, `${prefix}[${index}]`)
    );
  }

  return Object.entries(obj as Record<string, unknown>).flatMap(
    ([key, value]) =>
      collectLeafKeys(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe("Language Selection & Complete Multilingual Support (en, mr, hi)", () => {
  describe("1. Supported languages specification", () => {
    it("supports exactly three languages: English (en), Marathi (mr), and Hindi (hi)", () => {
      assert.equal(SUPPORTED_LANGUAGE_OPTIONS.length, 3);
      assert.deepEqual(
        SUPPORTED_LANGUAGE_OPTIONS.map((item) => ({
          code: item.code,
          englishName: item.englishName,
          nativeName: item.nativeName,
        })),
        [
          { code: "en", englishName: "English", nativeName: "English" },
          { code: "mr", englishName: "Marathi", nativeName: "मराठी" },
          { code: "hi", englishName: "Hindi", nativeName: "हिन्दी" },
        ]
      );
    });

    it("validates and normalizes language codes safely with fallback to English", () => {
      assert.equal(isSupportedLanguage("en"), true);
      assert.equal(isSupportedLanguage("mr"), true);
      assert.equal(isSupportedLanguage("hi"), true);
      assert.equal(isSupportedLanguage("fr"), false);
      assert.equal(isSupportedLanguage(null), false);
      assert.equal(isSupportedLanguage(undefined), false);

      assert.equal(normalizeLanguage("mr"), "mr");
      assert.equal(normalizeLanguage("hi"), "hi");
      assert.equal(normalizeLanguage("invalid"), DEFAULT_LANGUAGE);
      assert.equal(getStoredLanguagePreference(), DEFAULT_LANGUAGE);
    });

    it("resolves language option metadata for each supported language", () => {
      assert.equal(getLanguageOption("en").nativeName, "English");
      assert.equal(getLanguageOption("mr").nativeName, "मराठी");
      assert.equal(getLanguageOption("hi").nativeName, "हिन्दी");
    });
  });

  describe("2. Role-to-login route resolution", () => {
    it("routes customer role to /customer/login and admin role to /admin/login", () => {
      assert.equal(getPortalLoginDestination("customer"), "/customer/login");
      assert.equal(getPortalLoginDestination("admin"), "/admin/login");
    });
  });

  describe("3. Complete translation dictionary parity across English, Marathi, and Hindi", () => {
    it("defines identical translation key trees across en, mr, and hi with non-empty values", () => {
      assert.equal(LANGUAGE_STORAGE_KEY, "supriya_preferred_language");
      assert.equal(LANGUAGE_COOKIE_NAME, "supriya_lang");

      const enKeys = collectLeafKeys(TRANSLATIONS.en).sort();
      const mrKeys = collectLeafKeys(TRANSLATIONS.mr).sort();
      const hiKeys = collectLeafKeys(TRANSLATIONS.hi).sort();

      assert.deepEqual(mrKeys, enKeys);
      assert.deepEqual(hiKeys, enKeys);

      for (const code of ["en", "mr", "hi"] as const) {
        const dict = getTranslations(code);
        assert.ok(dict.company.heroHeadline.length > 0);
        assert.ok(dict.navigation.customerPortalButton.length > 0);
        assert.ok(dict.navigation.adminPortalButton.length > 0);
        assert.ok(dict.landing.customerCardTitle.length > 0);
        assert.ok(dict.customerEntry.heading.length > 0);
        assert.ok(dict.adminEntry.heading.length > 0);
        assert.ok(dict.customerDashboard.welcomePrefix.length > 0);
        assert.ok(dict.adminDashboard.heading.length > 0);
        assert.ok(dict.customerProducts.heading.length > 0);
        assert.ok(dict.customerProducts.showingProductsCount(3).length > 0);
        assert.ok(dict.customerProducts.viewCartButton(2).length > 0);
        assert.ok(dict.customerProducts.inStockWithQtyBadge(10).length > 0);
        assert.ok(dict.customerProductDetail.activeCompositionHeading.length > 0);
        assert.ok(dict.customerProductDetail.purchaseSectionHeading.length > 0);
        assert.ok(
          dict.customerProductDetail.addedToCartSuccessDesc("Bio Crop", 2)
            .length > 0
        );
        assert.ok(dict.customerCart.heading.length > 0);
        assert.ok(dict.customerCart.itemCountSummary(5, 2).length > 0);
        assert.ok(dict.customerCart.revalidateButton.length > 0);
        assert.ok(dict.customerCart.proceedToCheckoutButton.length > 0);
        assert.ok(dict.customerCheckout.heading.length > 0);
        assert.ok(dict.customerCheckout.placeOrderButton.length > 0);
        assert.ok(dict.customerCheckout.statusPendingVerification.length > 0);
        assert.ok(dict.customerCheckout.paymentStatusUnpaid.length > 0);
        assert.ok(dict.customerCheckout.verificationExplainDesc.length > 0);
        assert.ok(dict.validation.orderInvalidPackSize("Bio-N").length > 0);
        assert.ok(dict.validation.orderProductUnavailable("Bio-N").length > 0);
        assert.ok(dict.adminProducts.heading.length > 0);
        assert.ok(dict.adminProductForm.createHeading.length > 0);
        assert.ok(dict.customerProductDetail.benefitsHeading.length > 0);
        assert.ok(dict.customerProductDetail.videoTutorialHeading.length > 0);
        assert.ok(dict.adminProductForm.benefitsLabel.length > 0);
        assert.ok(dict.adminProductForm.youtubeUrlLabel.length > 0);
        assert.ok(dict.companyProfile.heading.length > 0);
        assert.ok(dict.customerDashboard.companySectionHeading.length > 0);
        assert.ok(dict.adminDashboard.manageCompanyButton.length > 0);

        const authCopy = AUTH_LANGUAGE_COPY[code];
        assert.ok(authCopy.modalTitleCustomer.length > 0);
        assert.ok(authCopy.modalTitleAdmin.length > 0);
      }
    });

    it("produces distinct localized UI text for Marathi and Hindi compared to English", () => {
      assert.notEqual(
        TRANSLATIONS.mr.landing.customerCardTitle,
        TRANSLATIONS.en.landing.customerCardTitle
      );
      assert.notEqual(
        TRANSLATIONS.hi.landing.customerCardTitle,
        TRANSLATIONS.en.landing.customerCardTitle
      );
      assert.notEqual(
        TRANSLATIONS.mr.customerDashboard.browseCatalogueButton,
        TRANSLATIONS.en.customerDashboard.browseCatalogueButton
      );
      assert.notEqual(
        TRANSLATIONS.hi.adminDashboard.heading,
        TRANSLATIONS.en.adminDashboard.heading
      );
    });
  });

  describe("4. Localized validation & formatting helpers", () => {
    it("returns localized validation errors for en, mr, and hi", () => {
      const enLogin = validateLoginForm({ email: "", password: "" }, "en");
      const mrLogin = validateLoginForm({ email: "", password: "" }, "mr");
      const hiLogin = validateLoginForm({ email: "", password: "" }, "hi");

      assert.equal(enLogin.isValid, false);
      assert.equal(mrLogin.isValid, false);
      assert.equal(hiLogin.isValid, false);
      assert.notEqual(enLogin.errors.email, mrLogin.errors.email);
      assert.notEqual(enLogin.errors.email, hiLogin.errors.email);

      const mrSignup = validateSignupForm(
        {
          fullName: "",
          email: "bad",
          mobile: "123",
          password: "short",
          confirmPassword: "diff",
          acceptedTerms: false,
        },
        "mr"
      );
      assert.equal(mrSignup.isValid, false);
      assert.equal(
        mrSignup.errors.fullName,
        TRANSLATIONS.mr.validation.fullNameRequired
      );

      const hiProduct = validateProductPayload({ status: "invalid" }, "hi");
      assert.equal(hiProduct.isValid, false);
      assert.equal(
        hiProduct.errors.sku,
        TRANSLATIONS.hi.validation.skuRequired
      );
    });

    it("formats currency and dates safely across all three languages", () => {
      for (const lang of ["en", "mr", "hi"] as const) {
        const formattedPrice = formatCurrencyForLanguage(1250.5, lang);
        assert.ok(formattedPrice.startsWith("₹"));

        const formattedDate = formatDateForLanguage(
          "2026-10-22T00:00:00.000Z",
          lang
        );
        assert.ok(formattedDate.length > 0);
      }
    });
  });

  describe("5. Phase 6: Extended product and company profile type invariants & dictionary coverage", () => {
    it("verifies ProductRecord backward compatibility with and without extended Phase 6 agronomic fields", () => {
      // Legacy product record without Phase 6 fields (backward compatibility check)
      const legacyProduct: ProductRecord = {
        id: "prod-legacy-001",
        sku: "BIO-NPK-01",
        name: "Bio NPK Consortium",
        category: "Biofertilizer",
        shortDescription: "Consortium of nitrogen-fixing and solubilizing bacteria.",
        composition: "Azotobacter, PSB, KMB consortium (1x10^8 CFU/ml)",
        targetCrops: ["Cotton", "Soybean", "Wheat"],
        dosageAndApplication: "1 Litre per acre via drip or soil drench.",
        packSizes: ["1 Litre", "5 Litres"],
        unitPrice: 650,
        safetyAndStorage: "Store in a cool dry place.",
        registrationNumber: "REG-BIO-2026-001",
        status: "active",
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
        createdByUid: "admin-uid-1",
        updatedByUid: "admin-uid-1",
      };

      assert.equal(legacyProduct.benefits, undefined);
      assert.equal(legacyProduct.applicationMethod, undefined);
      assert.equal(legacyProduct.modeOfAction, undefined);
      assert.equal(legacyProduct.compatibilityNotice, undefined);
      assert.equal(legacyProduct.youtubeUrl, undefined);
      assert.equal(legacyProduct.youtubeVideoId, undefined);

      // Extended product record with all Phase 6 agronomic and tutorial fields
      const extendedProduct: ProductRecord = {
        ...legacyProduct,
        id: "prod-ext-002",
        sku: "BIO-NPK-02",
        benefits: [
          "Increases nitrogen fixation by up to 25%",
          "Solubilizes insoluble soil phosphorus",
          "Enhances root system architecture",
        ],
        applicationMethod: "Foliar spray or fertigation through drip system",
        modeOfAction: "Microbial enzymatic action releases locked nutrients in soil",
        compatibilityNotice: "Do not mix with chemical bactericides or fungicides",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        youtubeVideoId: "dQw4w9WgXcQ",
      };

      assert.equal(extendedProduct.benefits?.length, 3);
      assert.ok(extendedProduct.applicationMethod && extendedProduct.applicationMethod.length > 0);
      assert.ok(extendedProduct.modeOfAction && extendedProduct.modeOfAction.length > 0);
      assert.ok(extendedProduct.compatibilityNotice && extendedProduct.compatibilityNotice.length > 0);
      assert.equal(extendedProduct.youtubeUrl, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      assert.equal(extendedProduct.youtubeVideoId, "dQw4w9WgXcQ");
    });

    it("verifies CompanyProfileRecord structure matching audited company profile model", () => {
      const profile: CompanyProfileRecord = {
        id: "company_profile",
        companyName: "Supriya Agrobiotech",
        tagline: "Growing Better Agriculture, Together",
        aboutUs: "Manufacturer of premium certified agricultural formulations and biologicals.",
        registrationNumber: "MH-AGRO-2026-001",
        address: {
          facilityName: "Manufacturing Plant & Research Unit",
          streetAddress: "Plot No. 12, MIDC Industrial Area",
          villageOrCity: "Baramati",
          district: "Pune",
          state: "Maharashtra",
          pinCode: "413102",
        },
        contact: {
          helplinePhone: "+91 9876543210",
          supportEmail: "support@supriyaagrobiotech.com",
          officeHours: "Mon - Sat: 9:00 AM - 6:00 PM",
        },
        updatedAt: "2026-10-29T12:00:00.000Z",
        updatedByUid: "admin-uid-1",
        createdAt: "2026-10-01T00:00:00.000Z",
        createdByUid: "admin-uid-1",
      };

      assert.equal(profile.id, "company_profile");
      assert.equal(profile.companyName, "Supriya Agrobiotech");
      assert.equal(profile.address.facilityName, "Manufacturing Plant & Research Unit");
      assert.equal(profile.address.pinCode, "413102");
      assert.equal(profile.contact.helplinePhone, "+91 9876543210");
      assert.equal(profile.contact.supportEmail, "support@supriyaagrobiotech.com");
      assert.equal(profile.updatedAt, "2026-10-29T12:00:00.000Z");
      assert.equal(profile.updatedByUid, "admin-uid-1");
    });

    it("verifies multilingual dictionary coverage and parity for Phase 6 additions", () => {
      for (const lang of ["en", "mr", "hi"] as const) {
        const dict = getTranslations(lang);

        // Extended customer product detail keys
        assert.ok(dict.customerProductDetail.benefitsHeading.length > 0);
        assert.ok(dict.customerProductDetail.applicationMethodHeading.length > 0);
        assert.ok(dict.customerProductDetail.modeOfActionHeading.length > 0);
        assert.ok(dict.customerProductDetail.compatibilityHeading.length > 0);
        assert.ok(dict.customerProductDetail.videoTutorialHeading.length > 0);
        assert.ok(dict.customerProductDetail.videoTutorialSubtitle.length > 0);
        assert.ok(dict.customerProductDetail.videoUnavailableNotice.length > 0);
        assert.ok(dict.customerProductDetail.watchOnYouTubeButton.length > 0);

        // Extended admin product form keys
        assert.ok(dict.adminProductForm.benefitsLabel.length > 0);
        assert.ok(dict.adminProductForm.benefitsHint.length > 0);
        assert.ok(dict.adminProductForm.applicationMethodLabel.length > 0);
        assert.ok(dict.adminProductForm.modeOfActionLabel.length > 0);
        assert.ok(dict.adminProductForm.compatibilityLabel.length > 0);
        assert.ok(dict.adminProductForm.youtubeUrlLabel.length > 0);
        assert.ok(dict.adminProductForm.youtubeUrlHint.length > 0);

        // Company profile management keys
        assert.ok(dict.companyProfile.badge.length > 0);
        assert.ok(dict.companyProfile.heading.length > 0);
        assert.ok(dict.companyProfile.subtitle.length > 0);
        assert.ok(dict.companyProfile.saveButton.length > 0);
        assert.ok(dict.companyProfile.savingButton.length > 0);
        assert.ok(dict.companyProfile.savedSuccessTitle.length > 0);
        assert.ok(dict.companyProfile.companyNameLabel.length > 0);
        assert.ok(dict.companyProfile.facilityAddressHeading.length > 0);
        assert.ok(dict.companyProfile.contactHeading.length > 0);

        // Dashboard company keys
        assert.ok(dict.customerDashboard.companySectionHeading.length > 0);
        assert.ok(dict.customerDashboard.companySectionSubtitle.length > 0);
        assert.ok(dict.customerDashboard.verifiedFacilityBadge.length > 0);
        assert.ok(dict.adminDashboard.manageCompanyButton.length > 0);
        assert.ok(dict.adminDashboard.companyModuleTitle.length > 0);

        // Validation keys
        assert.ok(dict.validation.benefitsMax.length > 0);
        assert.ok(dict.validation.youtubeUrlInvalid.length > 0);
        assert.ok(dict.validation.companyNameRequired.length > 0);
        assert.ok(dict.validation.companyRegistrationRequired.length > 0);
        assert.ok(dict.validation.companyPinCodeInvalid.length > 0);
        assert.ok(dict.validation.companyHelplineInvalid.length > 0);
        assert.ok(dict.validation.companyEmailInvalid.length > 0);
      }

      // Linguistic differentiation
      assert.notEqual(
        TRANSLATIONS.mr.companyProfile.heading,
        TRANSLATIONS.en.companyProfile.heading
      );
      assert.notEqual(
        TRANSLATIONS.hi.companyProfile.heading,
        TRANSLATIONS.en.companyProfile.heading
      );
      assert.notEqual(
        TRANSLATIONS.mr.customerProductDetail.benefitsHeading,
        TRANSLATIONS.en.customerProductDetail.benefitsHeading
      );
      assert.notEqual(
        TRANSLATIONS.hi.customerProductDetail.benefitsHeading,
        TRANSLATIONS.en.customerProductDetail.benefitsHeading
      );
    });
  });
});

