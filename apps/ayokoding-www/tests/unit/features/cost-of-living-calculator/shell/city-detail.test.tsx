import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { dataset } from "../../../../../src/features/cost-of-living-calculator/core/data/cities";
import { CityDetail } from "../../../../../src/features/cost-of-living-calculator/shell/city-detail";

afterEach(cleanup);

// Gherkin (binds): "Relocation reserve is shown separately from sunk costs"
describe("CityDetail", () => {
  const firstCity = dataset.cities[0]!;
  const defaultProps = {
    dataset,
    cityId: firstCity.id,
    household: { adults: 1 as const, preschoolKids: 0 as const, schoolKids: 0 as const },
    schoolType: "public" as const,
    area: "center" as const,
  };

  it("shows relocation sunk-cost total distinct from monthly total", () => {
    render(<CityDetail {...defaultProps} />);

    // Monthly total
    expect(screen.getByTestId("monthly-total")).toBeTruthy();

    // Relocation sunk-cost total — distinct section
    expect(screen.getByTestId("relocation-sunk")).toBeTruthy();

    // They should be different elements (not folded together)
    const monthly = screen.getByTestId("monthly-total");
    const sunk = screen.getByTestId("relocation-sunk");
    expect(monthly).not.toBe(sunk);
  });

  it("shows liquidity-reserve cash cushion in its own labelled figure", () => {
    render(<CityDetail {...defaultProps} />);

    const liquidity = screen.getByTestId("liquidity-reserve");
    expect(liquidity).toBeTruthy();

    // Must NOT be folded into relocation sunk
    const sunk = screen.getByTestId("relocation-sunk");
    expect(liquidity).not.toBe(sunk);

    // Should have non-zero value for any city
    const text = liquidity.textContent ?? "";
    expect(text.length).toBeGreaterThan(0);
  });

  it("shows per-category expense breakdown", () => {
    render(<CityDetail {...defaultProps} />);

    expect(screen.getByTestId("expense-housing")).toBeTruthy();
    expect(screen.getByTestId("expense-food")).toBeTruthy();
    expect(screen.getByTestId("expense-transport")).toBeTruthy();
    expect(screen.getByTestId("expense-utilities")).toBeTruthy();
    expect(screen.getByTestId("expense-healthcare")).toBeTruthy();
  });

  // Gherkin: clicking a city shows the full per-category breakdown and monthly total.
  it.each([
    { locale: "en", label: "Lifestyle" },
    { locale: "id", label: "Gaya hidup" },
  ] as const)("shows the flat lifestyle amount outside essentials in $locale", ({ locale, label }) => {
    render(
      <CityDetail
        {...defaultProps}
        cityId="singapore"
        household={{ adults: 2, preschoolKids: 0, schoolKids: 0 }}
        locale={locale}
      />,
    );

    // Raw Singapore fixture: lifestyle 260; two-adult essentials are
    // 3830 × 1.25 + 420 × 1.5 + 128 + 210 × 1.25 + 130 × 1.5 = 6003 SGD.
    expect(screen.getByText(label)).toBeVisible();
    expect(screen.getByTestId("expense-lifestyle")).toHaveAttribute("data-raw", "260");
    expect(screen.getByTestId("expense-lifestyle")).toHaveTextContent("SGD 260");
    expect(screen.getByTestId("essentials-subtotal")).toHaveAttribute("data-raw", "6003");
    expect(screen.getByTestId("monthly-total")).toHaveTextContent("SGD 6,263");
  });

  it("shows healthcare funding-scheme badge", () => {
    render(<CityDetail {...defaultProps} />);

    const badge = screen.getByTestId("healthcare-badge");
    const validTexts = ["tax-funded", "mandatory payroll insurance", "out-of-pocket"];
    expect(validTexts).toContain(badge.textContent?.trim());
  });

  // EWT-002: relocation sunk-cost and liquidity-reserve rows show both local currency AND USD equivalent.
  it("EWT-002: relocation-sunk row shows both local currency and USD value", () => {
    render(<CityDetail {...defaultProps} />);

    const sunk = screen.getByTestId("relocation-sunk");
    // Should contain "$" (USD indicator) and the local currency code
    expect(sunk.textContent).toMatch(/\$/);
    expect(sunk.textContent).toMatch(/SGD/);
  });

  it("EWT-002: liquidity-reserve row shows both local currency and USD value", () => {
    render(<CityDetail {...defaultProps} />);

    const liquidity = screen.getByTestId("liquidity-reserve");
    // Should contain "$" (USD indicator) and the local currency code
    expect(liquidity.textContent).toMatch(/\$/);
    expect(liquidity.textContent).toMatch(/SGD/);
  });

  // Phase 9 Cluster M — visible section headings (not only aria-label)
  it("Phase9M: renders visible heading for 'Monthly expenses' section", () => {
    render(<CityDetail {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /monthly expenses/i })).toBeTruthy();
  });

  it("Phase9M: renders visible heading for 'Relocation costs' section", () => {
    render(<CityDetail {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /relocation costs/i })).toBeTruthy();
  });

  // Phase 3b: city-detail back link uses backHref prop (UWT-010)
  it("3b: back link uses backHref prop when provided", () => {
    render(<CityDetail {...defaultProps} backHref="?region=asean&country=sg" />);
    const backLink = screen.getByRole("link", { name: /back to all cities/i });
    expect(backLink.getAttribute("href")).toBe("?region=asean&country=sg");
  });

  it("3b: back link defaults to ?tab=cost when no backHref", () => {
    render(<CityDetail {...defaultProps} />);
    const backLink = screen.getByRole("link", { name: /back to all cities/i });
    expect(backLink.getAttribute("href")).toBe("?tab=cost");
  });

  // Cluster 3 (EWT-003 / UWT-002 / DWT-006): the city-detail school row must render the same
  // warning-tone foreigner flag (with the shared testid) as the cost-of-living table.
  describe("Cluster 3 — foreigner public-school flag (city-detail)", () => {
    // Singapore (country sg, access "limited") with public school + 1 school-age child triggers
    // the private-fallback flag.
    const fallbackProps = {
      ...defaultProps,
      cityId: "singapore",
      household: { adults: 1 as const, preschoolKids: 0 as const, schoolKids: 1 as const },
      schoolType: "public" as const,
    };

    it("EWT-003: renders the school-foreigner-flag-<cityId> testid for a non-open city", () => {
      render(<CityDetail {...fallbackProps} />);
      expect(screen.getByTestId("school-foreigner-flag-singapore")).toBeTruthy();
    });

    it("UWT-002: flag uses plain-language wording in both locales", () => {
      const { rerender } = render(<CityDetail {...fallbackProps} />);
      expect(screen.getByTestId("school-foreigner-flag-singapore").textContent).toContain(
        "Private — public not open to foreigners",
      );
      rerender(<CityDetail {...fallbackProps} locale="id" />);
      expect(screen.getByTestId("school-foreigner-flag-singapore").textContent).toContain(
        "Swasta — negeri tak terbuka untuk WNA",
      );
    });

    it("DWT-006: flag is a warning-tone Badge, not a muted caption", () => {
      render(<CityDetail {...fallbackProps} />);
      const flag = screen.getByTestId("school-foreigner-flag-singapore");
      expect(flag.getAttribute("data-slot")).toBe("badge");
      expect(flag.className).not.toContain("text-muted-foreground");
    });

    it("does NOT render the flag when school type is private or no school-age children", () => {
      render(<CityDetail {...defaultProps} cityId="singapore" />);
      expect(screen.queryByTestId("school-foreigner-flag-singapore")).toBeNull();
    });
  });

  // EWT-007: per-category rows in city-detail must scale for household size so
  // their sum equals the Essentials subtotal shown.
  it("EWT-007: for a 2-adult household, per-category row amounts sum to the essentials subtotal", () => {
    const twoAdultProps = {
      ...defaultProps,
      household: { adults: 2 as const, preschoolKids: 0 as const, schoolKids: 0 as const },
    };
    render(<CityDetail {...twoAdultProps} />);

    const housing = parseFloat(screen.getByTestId("expense-housing").getAttribute("data-raw") ?? "NaN");
    const food = parseFloat(screen.getByTestId("expense-food").getAttribute("data-raw") ?? "NaN");
    const transport = parseFloat(screen.getByTestId("expense-transport").getAttribute("data-raw") ?? "NaN");
    const utilities = parseFloat(screen.getByTestId("expense-utilities").getAttribute("data-raw") ?? "NaN");
    const healthcare = parseFloat(screen.getByTestId("expense-healthcare").getAttribute("data-raw") ?? "NaN");
    const childcare = parseFloat(screen.getByTestId("expense-childcare").getAttribute("data-raw") ?? "NaN");
    const school = parseFloat(screen.getByTestId("expense-school").getAttribute("data-raw") ?? "NaN");
    const essentials = parseFloat(screen.getByTestId("essentials-subtotal").getAttribute("data-raw") ?? "NaN");

    const categorySum = housing + food + transport + utilities + healthcare + childcare + school;
    expect(Math.abs(categorySum - essentials)).toBeLessThan(0.01);
  });
});
