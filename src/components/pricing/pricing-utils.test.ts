import { describe, expect, it } from "vitest";
import { resolvePricingCtaTarget } from "./pricing-utils";

describe("resolvePricingCtaTarget", () => {
  it("sends anonymous visitors to signup", () => {
    expect(
      resolvePricingCtaTarget({ isAuthenticated: false, slug: "pro", interval: "year" }),
    ).toEqual({ to: "/signup" });
  });

  it("sends signed-in visitors to billing, carrying the annual interval (regression)", () => {
    expect(
      resolvePricingCtaTarget({ isAuthenticated: true, slug: "pro", interval: "year" }),
    ).toEqual({
      to: "/billing",
      search: { interval: "year" },
    });
  });

  it("carries the monthly interval too", () => {
    expect(
      resolvePricingCtaTarget({ isAuthenticated: true, slug: "basic", interval: "month" }),
    ).toEqual({ to: "/billing", search: { interval: "month" } });
  });

  it("never routes a signed-in visitor to an auth route", () => {
    const targets = (["free", "basic", "pro"] as const).map((slug) =>
      resolvePricingCtaTarget({ isAuthenticated: true, slug, interval: "year" }),
    );
    expect(targets.some((target) => target.to === "/signup")).toBe(false);
  });

  it("sends signed-in visitors on the free card back to the library", () => {
    expect(
      resolvePricingCtaTarget({ isAuthenticated: true, slug: "free", interval: "month" }),
    ).toEqual({ to: "/library" });
  });
});
