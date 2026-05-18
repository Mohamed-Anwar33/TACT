import { describe, expect, it } from "vitest";
import { fallbackPackages, fallbackPackageStyles, normalizePackageImageUrl } from "./catalog";

describe("catalog fallback", () => {
  it("keeps the three legacy packages available during migration", () => {
    const packages = fallbackPackages();

    expect(packages.map((pkg) => pkg.id)).toEqual(["economy", "medium", "luxury"]);
    expect(packages.every((pkg) => pkg.name_ar && pkg.name_en)).toBe(true);
  });

  it("maps legacy package config into editable style/category/option shape", () => {
    const styles = fallbackPackageStyles("economy");

    expect(styles.length).toBeGreaterThan(0);
    expect(styles[0].categories.length).toBeGreaterThan(0);
    expect(styles[0].categories[0].options.length).toBeGreaterThan(0);
    expect(styles[0].categories[0].options[0].image_url).toContain("/real-content/Packages/");
  });

  it("keeps economy door images out of the medium/luxury single folder", () => {
    expect(
      normalizePackageImageUrl(
        "/real-content/Packages/economy-20260514T162446Z-3-001/economy/styles/styles/modern/Doors/single/1.webp"
      )
    ).toContain("/modern/Doors/1.webp");
  });

  it("moves medium and luxury door images into their real single folder", () => {
    expect(
      normalizePackageImageUrl(
        "/real-content/Packages/medium-20260514T162444Z-3-001/medium/styles/styles/modern/Doors/1.webp"
      )
    ).toContain("/modern/Doors/single/1.webp");
  });
});
