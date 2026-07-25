/** @jsxImportSource react */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real Link needs a router; render a plain anchor carrying the resolved target
// so the test asserts on where the CTA actually points.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
  }: {
    to: string;
    search?: Record<string, string>;
    children: React.ReactNode;
  }) => (
    <a data-search={search ? JSON.stringify(search) : ""} href={to}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/openpanel/client-provider", () => ({
  useOpenPanelClient: () => ({ client: null }),
}));

const { PricingCard } = await import("./pricing-card");
const { buildPricingDisplay } = await import("./pricing-utils");

const proTier = () => {
  const { tiers } = buildPricingDisplay(
    {
      tiers: [
        {
          slug: "pro",
          benefits: ["Unlimited models"],
          prices: {
            month: { amount: 3599, currency: "USD", interval: "month", intervalCount: 1 },
            year: { amount: 38899, currency: "USD", interval: "year", intervalCount: 1 },
          },
        },
      ],
    } as never,
    ["pro"],
    "year",
  );
  return tiers[0]!;
};

afterEach(cleanup);

describe("PricingCard CTA", () => {
  it("points anonymous visitors at signup", () => {
    render(<PricingCard interval="year" isAuthenticated={false} tier={proTier()} />);
    expect(screen.getByRole("link")).toHaveProperty("href", expect.stringContaining("/signup"));
  });

  it("points signed-in visitors at billing with the selected interval (regression)", () => {
    render(<PricingCard interval="year" isAuthenticated tier={proTier()} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/billing");
    expect(link.getAttribute("data-search")).toBe(JSON.stringify({ interval: "year" }));
  });

  it("never sends a signed-in visitor to an auth route", () => {
    render(<PricingCard interval="month" isAuthenticated tier={proTier()} />);
    expect(screen.getByRole("link").getAttribute("href")).not.toContain("signup");
  });
});
