import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  parseDelimitedList,
  validateProductPayload,
} from "../src/lib/validation.ts";

describe("Phase B — Product Management Validation & Access Control", () => {
  describe("1. parseDelimitedList", () => {
    it("parses and deduplicates comma- and newline-delimited crop and pack size lists", () => {
      const crops = parseDelimitedList("Cotton, Soybean, Cotton\nWheat ,  ");
      assert.deepEqual(crops, ["Cotton", "Soybean", "Wheat"]);
    });

    it("normalizes string arrays and strips blanks", () => {
      const packs = parseDelimitedList([" 250 ml ", "500 ml", "250 ml", ""]);
      assert.deepEqual(packs, ["250 ml", "500 ml"]);
    });
  });

  describe("2. validateProductPayload", () => {
    it("accepts a valid product payload and normalizes SKU and price", () => {
      const validation = validateProductPayload({
        sku: "  prd-101  ",
        name: "Test Formulation A",
        category: "Crop Nutrition",
        shortDescription:
          "Verified agricultural formulation for foliar application.",
        composition: "Chelated Micronutrient Mixture — Grade II",
        targetCropsInput: "Cotton, Paddy, Groundnut",
        dosageAndApplication: "2 ml per litre of water during vegetative stage.",
        packSizesInput: "250 ml, 500 ml, 1 L",
        unitPriceInput: "450.5",
        safetyAndStorage: "Store in a cool, dry place away from direct sunlight.",
        registrationNumber: "REG-2026-01",
        status: "active",
      });

      assert.equal(validation.isValid, true);
      assert.ok(validation.data);
      assert.equal(validation.data.sku, "PRD-101");
      assert.deepEqual(validation.data.targetCrops, [
        "Cotton",
        "Paddy",
        "Groundnut",
      ]);
      assert.deepEqual(validation.data.packSizes, ["250 ml", "500 ml", "1 L"]);
      assert.equal(validation.data.unitPrice, 450.5);
      assert.equal(validation.data.status, "active");
    });

    it("allows unitPrice to be omitted (null) so no fabricated prices are required", () => {
      const validation = validateProductPayload({
        sku: "PRD-102",
        name: "Test Formulation B",
        category: "Soil Conditioner",
        shortDescription: "Granular soil conditioning input for field crops.",
        composition: "Organic carbon and calcium-magnesium complex",
        targetCrops: ["Sugarcane", "Maize"],
        dosageAndApplication: "25 kg per acre at basal application.",
        packSizes: ["25 kg", "50 kg"],
        unitPriceInput: "",
        safetyAndStorage: "",
        registrationNumber: "",
        status: "draft",
      });

      assert.equal(validation.isValid, true);
      assert.ok(validation.data);
      assert.equal(validation.data.unitPrice, null);
      assert.equal(validation.data.status, "draft");
    });

    it("rejects missing required fields, negative prices, and invalid statuses", () => {
      const validation = validateProductPayload({
        sku: "!",
        name: "A",
        category: "",
        shortDescription: "Too short",
        composition: "",
        targetCrops: [],
        dosageAndApplication: "",
        packSizes: [],
        unitPriceInput: "-10",
        status: "invalid_status",
      });

      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.sku);
      assert.ok(validation.errors.name);
      assert.ok(validation.errors.category);
      assert.ok(validation.errors.shortDescription);
      assert.ok(validation.errors.composition);
      assert.ok(validation.errors.targetCrops);
      assert.ok(validation.errors.dosageAndApplication);
      assert.ok(validation.errors.packSizes);
      assert.ok(validation.errors.unitPrice);
      assert.ok(validation.errors.status);
    });
  });

  describe("3. Firestore product security rules invariants", () => {
    const rulesPath = path.resolve(process.cwd(), "firestore.rules");
    const rulesContent = readFileSync(rulesPath, "utf8");

    it("restricts customer product reads strictly to active products and restricts writes to admins", () => {
      assert.match(
        rulesContent,
        /match \/products\/\{productId\}[\s\S]*?allow read: if isAdmin\(\) \|\| \([\s\S]*?hasActiveCustomerProfile\(\)[\s\S]*?resource\.data\.status == 'active'/
      );
      assert.match(
        rulesContent,
        /allow create, update: if isAdmin\(\) && isValidProductDocument\(request\.resource\.data\);/
      );
      assert.match(rulesContent, /allow delete: if isAdmin\(\);/);
    });
  });
});
