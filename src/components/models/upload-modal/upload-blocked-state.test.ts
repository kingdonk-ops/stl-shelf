import { describe, expect, it } from "vitest";
import { getBlockedPlanOffer } from "./upload-blocked-state";

describe("getBlockedPlanOffer", () => {
  it("sends the annual product to checkout when annual is selected (regression)", () => {
    expect(getBlockedPlanOffer("pro", "year")).toEqual({
      productSlug: "pro_year",
      periodSuffix: "/yr",
    });
  });

  it("sends the monthly product when monthly is selected", () => {
    expect(getBlockedPlanOffer("pro", "month")).toEqual({
      productSlug: "pro_month",
      periodSuffix: "/mo",
    });
  });

  it("keeps every tier in step with the interval", () => {
    expect(getBlockedPlanOffer("basic", "year").productSlug).toBe("basic_year");
    expect(getBlockedPlanOffer("basic", "month").productSlug).toBe("basic_month");
  });

  it("never returns the monthly product for the annual interval", () => {
    const offers = (["basic", "pro"] as const).map((tier) => getBlockedPlanOffer(tier, "year"));
    expect(offers.every((offer) => offer.productSlug.endsWith("_year"))).toBe(true);
    expect(offers.every((offer) => offer.periodSuffix === "/yr")).toBe(true);
  });
});
