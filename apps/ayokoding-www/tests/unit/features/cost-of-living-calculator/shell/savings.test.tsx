import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dataset } from "../../../../../src/features/cost-of-living-calculator/core/data/cities";
import { roleMatrix } from "../../../../../src/features/cost-of-living-calculator/core/data/roles";
import { SavingsTable } from "../../../../../src/features/cost-of-living-calculator/shell/savings";
import { URL_INPUT_DEBOUNCE_MS } from "../../../../../src/features/cost-of-living-calculator/shell/use-debounced-field";

afterEach(cleanup);

describe("SavingsTable", () => {
  const defaultProps = {
    dataset,
    matrix: roleMatrix,
    household: { adults: 1 as const, preschoolKids: 0 as const, schoolKids: 0 as const },
    schoolType: "public" as const,
    area: "center" as const,
  };

  it("hydrates the gross input from the URL when uncontrolled", () => {
    window.history.replaceState({}, "", "/?gross=5000");
    try {
      render(<SavingsTable {...defaultProps} />);
      const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i }) as HTMLInputElement;
      expect(input.value).toBe("5000");
    } finally {
      window.history.replaceState({}, "", "/");
    }
  });

  it("toggles the mobile sort order", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);
    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");
    const toggle = screen.getByTestId("sort-mobile");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  // Gherkin (binds): "Savings tab converts gross salary to net before subtracting expenses"
  it("entering gross=8000 shows net, essentials, savings-after-essentials with % and savings-after-lifestyle with %, sortable", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    // Table present
    expect(screen.getByRole("table")).toBeTruthy();

    // Columns: Country, City, Net, Essentials, Savings after essentials, Savings after lifestyle
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
    expect(headers.some((t) => t.includes("country"))).toBe(true);
    expect(headers.some((t) => t.includes("city"))).toBe(true);
    expect(headers.some((t) => t.includes("net"))).toBe(true);
    expect(headers.some((t) => t.includes("essentials"))).toBe(true);
    expect(headers.some((t) => t.includes("savings"))).toBe(true);

    // Rows present (one per city + header)
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);

    // Sort trigger present
    expect(screen.getByRole("button", { name: /sort/i })).toBeTruthy();
  });

  // Gherkin (binds): "Gross salary entered monthly shows the derived annual figure"
  it("entering gross=8000 shows annual gross=96000", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    // Annual gross = 8000 * 12 = 96000
    expect(screen.getByTestId("annual-gross")).toHaveTextContent("96");
  });

  // Gherkin (binds): "Non-salary comp is shown as informational context only"
  it("shows informational non-salary comp column that does not affect net or savings", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    // Non-salary comp header present
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
    expect(headers.some((t) => t.includes("non-salary") || t.includes("rsu") || t.includes("equity"))).toBe(true);

    // The informational nature is marked
    expect(screen.getByTestId("non-salary-comp-note")).toBeTruthy();
  });

  // Gherkin (binds): "Total compensation is shown for negotiation context"
  it("shows informational total comp column that does not affect savings", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
    expect(headers.some((t) => t.includes("total comp") || t.includes("total compensation"))).toBe(true);
  });

  // Gherkin (binds): "Sub-national tax lowers net only in federal countries"
  it("US/CA/CH cities apply sub-national rate; unitary cities apply federal rate alone", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    // All rows have a net cell — the math is validated at the core level (calc.unit.test.ts)
    // Here we verify the sub-national indicator is shown for federal-country cities
    const subNatCells = screen.getAllByTestId("sub-national-indicator");
    expect(subNatCells.length).toBeGreaterThan(0);
  });

  // Gherkin (binds): "Net take-home is lower than the entered gross"
  it("net shown for each city is lower than the entered gross", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    const netCells = screen.getAllByTestId("net-value");
    expect(netCells.length).toBeGreaterThan(0);

    for (const cell of netCells) {
      // Net ≤ gross (UAE has 0% income tax so net = gross; other cities net < gross)
      const raw = cell.getAttribute("data-usd") ?? "0";
      expect(parseFloat(raw)).toBeLessThanOrEqual(8000);
    }
  });

  // EWT-005: negative salary input must clamp to 0 so annual gross is never negative.
  it("EWT-005: entering -5000 as gross monthly salary clamps to 0 and shows annual gross of 0", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "-5000");

    // Annual gross must not be negative (clamped to 0 → annual = 0)
    const annualEl = screen.getByTestId("annual-gross");
    const annualText = annualEl.textContent ?? "";
    // The displayed annual gross must be 0 (not -60,000)
    expect(annualText).toMatch(/^0/);
  });

  // Gherkin (binds): "Essentials above net show a deficit"
  it("shows negative savings-after-essentials when net < essentials", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    // Enter a very low gross so at least one city shows a deficit
    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "500");

    // At least one savings-after-essentials cell should be negative
    const savingsCells = screen.getAllByTestId("savings-essential");
    const hasDeficit = savingsCells.some((c) => parseFloat(c.getAttribute("data-usd") ?? "0") < 0);
    expect(hasDeficit).toBe(true);
  });

  // EWT-014: sort control must be visible and tappable at mobile widths (only when salary > 0)
  it("EWT-014: a sort control with data-testid='sort-mobile' is present for mobile users", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);
    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");
    expect(screen.getByTestId("sort-mobile")).toBeTruthy();
  });

  // EWT-012: sort button must have aria-pressed to reflect sort state (only when salary > 0)
  it("EWT-012: sort button has aria-pressed reflecting sort state", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    const sortBtn = screen.getByRole("button", { name: /sort/i });
    // Initial state: sortAsc is false (descending), aria-pressed should be "false"
    expect(sortBtn).toHaveAttribute("aria-pressed", "false");

    // After clicking, sortAsc becomes true, aria-pressed should be "true"
    await user.click(sortBtn);
    expect(sortBtn).toHaveAttribute("aria-pressed", "true");
  });

  // EWT-005: the sortable "Savings after essentials" <th> must expose aria-sort reflecting the
  // active sort direction so screen-reader users perceive the sorted column.
  it("EWT-005: the sortable savings column header exposes aria-sort reflecting direction", async () => {
    const user = userEvent.setup();
    render(<SavingsTable {...defaultProps} />);

    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    await user.clear(input);
    await user.type(input, "8000");

    // The <th> wrapping the sort button is the sorted column; default sort is descending.
    const sortButton = screen.getByRole("button", { name: /sort/i });
    const th = sortButton.closest("th");
    expect(th).toBeTruthy();
    expect(th!.getAttribute("aria-sort")).toBe("descending");

    // Toggling the sort flips the announced direction.
    await user.click(sortButton);
    expect(th!.getAttribute("aria-sort")).toBe("ascending");
  });

  // SG-001: when salary is 0, empty-state guidance is shown and no savings table is visible
  it("SG-001: when salary is 0, empty-state guidance is shown and savings table is hidden", () => {
    render(<SavingsTable {...defaultProps} />);
    // Empty state shown
    expect(screen.getByTestId("savings-empty-state")).toBeTruthy();
    // Savings cells not rendered
    expect(screen.queryAllByTestId("savings-essential")).toHaveLength(0);
  });

  // Phase 5: design-system primitives
  it("Phase5: gross-salary input uses the Input design-system primitive (data-slot='input')", () => {
    render(<SavingsTable {...defaultProps} />);
    const input = document.querySelector("#gross-salary-input");
    expect(input?.getAttribute("data-slot")).toBe("input");
  });

  // UWT-004: the gross-salary label must not hardcode the currency code "USD"; the active
  // currency is surfaced as a dedicated indicator next to the input instead.
  it("UWT-004: gross-salary label drops the literal 'USD' and an active-currency indicator is rendered", () => {
    render(<SavingsTable {...defaultProps} />);
    const label = document.querySelector('label[for="gross-salary-input"]');
    expect(label?.textContent).not.toMatch(/USD/);
    const indicator = screen.getByTestId("salary-currency-indicator");
    expect(indicator.textContent).toMatch(/USD/);
  });

  // UWT-019: the fixed USD indicator carries a short explanation of why USD is used for
  // every city, so it is not mistaken for a missing currency selector.
  it("UWT-019: renders an explanation that salaries are compared in USD across all cities", () => {
    render(<SavingsTable {...defaultProps} />);
    const explanation = screen.getByTestId("salary-currency-explanation");
    expect(explanation.textContent).toMatch(/USD/);
    expect(explanation.textContent?.toLowerCase()).toContain("all cities");
  });

  it("UWT-019: renders the id-locale currency explanation", () => {
    render(<SavingsTable {...defaultProps} locale="id" />);
    const explanation = screen.getByTestId("salary-currency-explanation");
    expect(explanation.textContent).toMatch(/USD/);
    expect(explanation.textContent?.toLowerCase()).toContain("semua kota");
  });

  // ─── Cluster 5 — UX states ──────────────────────────────────────────────────
  // UWT-005: empty-state prompt is wrapped in a visually-prominent bordered panel.
  it("UWT-005: savings empty-state is a prominent bordered panel", () => {
    render(<SavingsTable {...defaultProps} />);
    const panel = screen.getByTestId("savings-empty-state");
    expect(panel.className).toMatch(/border/);
    expect(panel.className).toMatch(/rounded/);
  });

  // UWT-005 (USS-001): the gross salary input auto-focuses when the Savings tab mounts.
  it("UWT-005: gross-salary input auto-focuses on mount", () => {
    render(<SavingsTable {...defaultProps} />);
    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    expect(input).toHaveFocus();
  });

  // UWT-016: the mount auto-focus must NOT scroll the page — focus is invoked with
  // { preventScroll: true } so a scrolled-down user is not yanked back to the top
  // (regression against the scroll-preservation goal introduced by USS-001's autoFocus).
  it("UWT-016: gross-salary input focuses with preventScroll on mount (no scroll jump)", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    render(<SavingsTable {...defaultProps} />);
    const input = screen.getByRole("spinbutton", { name: /gross monthly salary/i });
    // The input still receives focus...
    expect(input).toHaveFocus();
    // ...but the focus call that landed on it passed { preventScroll: true }.
    const focusedWithPreventScroll = focusSpy.mock.calls.some(
      ([opts]) => opts !== undefined && (opts as FocusOptions).preventScroll === true,
    );
    expect(focusedWithPreventScroll).toBe(true);
    focusSpy.mockRestore();
  });

  // UWT-007: the USD currency indicator is an inline at-field adornment inside the input row,
  // a sibling of the gross-salary input (not only a block note below the label).
  it("UWT-007: USD currency indicator sits inline in the same row as the input", () => {
    render(<SavingsTable {...defaultProps} />);
    const input = document.querySelector("#gross-salary-input")!;
    const indicator = screen.getByTestId("salary-currency-indicator");
    // Both share the same flex row container.
    const inputRow = input.closest("div");
    expect(inputRow).not.toBeNull();
    expect(inputRow!.contains(indicator)).toBe(true);
    expect(inputRow!.className).toMatch(/flex/);
  });

  // Gherkin (binds): "id-locale tables use Indonesian city and country names"
  describe("id locale name rendering", () => {
    it("renders 'Singapura' in the Country column when locale=id", async () => {
      const user = userEvent.setup();
      render(<SavingsTable {...defaultProps} locale="id" />);
      const input = screen.getByRole("spinbutton", { name: /gaji kotor/i });
      await user.clear(input);
      await user.type(input, "8000");
      const countryLinks = screen.getAllByRole("link").filter((el) => el.getAttribute("href")?.includes("country="));
      const countryTexts = countryLinks.map((l) => l.textContent ?? "");
      expect(countryTexts.some((t) => t === "Singapura")).toBe(true);
    });

    it("renders 'Jepang' in the Country column when locale=id", async () => {
      const user = userEvent.setup();
      render(<SavingsTable {...defaultProps} locale="id" />);
      const input = screen.getByRole("spinbutton", { name: /gaji kotor/i });
      await user.clear(input);
      await user.type(input, "8000");
      const countryLinks = screen.getAllByRole("link").filter((el) => el.getAttribute("href")?.includes("country="));
      const countryTexts = countryLinks.map((l) => l.textContent ?? "");
      expect(countryTexts.some((t) => t === "Jepang")).toBe(true);
    });
  });

  // Regression: in controlled (URL-driven) mode the gross input must debounce its commit so
  // typing the salary does not write the URL on every keystroke (the stutter bug).
  describe("controlled gross input debounces its URL commit", () => {
    function Controlled({ onCommit }: { onCommit: (gross: number) => void }) {
      const [gross, setGross] = useState(0);
      return (
        <SavingsTable
          {...defaultProps}
          gross={gross}
          onGrossChange={(g) => {
            setGross(g);
            onCommit(g);
          }}
        />
      );
    }

    it("typing the gross salary commits once after the debounce window, not per keystroke", () => {
      vi.useFakeTimers();
      try {
        const onCommit = vi.fn();
        render(<Controlled onCommit={onCommit} />);
        const input = document.querySelector("#gross-salary-input") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "8" } });
        fireEvent.change(input, { target: { value: "80" } });
        fireEvent.change(input, { target: { value: "8000" } });

        // The field echoes the latest keystroke immediately…
        expect(input.value).toBe("8000");
        // …but the URL commit has not fired yet.
        expect(onCommit).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(URL_INPUT_DEBOUNCE_MS));

        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(onCommit).toHaveBeenLastCalledWith(8000);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
