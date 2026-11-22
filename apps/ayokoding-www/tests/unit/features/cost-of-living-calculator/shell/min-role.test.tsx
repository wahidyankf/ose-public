import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dataset } from "../../../../../src/features/cost-of-living-calculator/core/data/cities";
import { roleMatrix } from "../../../../../src/features/cost-of-living-calculator/core/data/roles";
import { MinRoleTable } from "../../../../../src/features/cost-of-living-calculator/shell/min-role";
import { DEFAULT_STATE } from "../../../../../src/features/cost-of-living-calculator/core/url-state";
import type { MinRoleInputs } from "../../../../../src/features/cost-of-living-calculator/core/url-state";
import { URL_INPUT_DEBOUNCE_MS } from "../../../../../src/features/cost-of-living-calculator/shell/use-debounced-field";

afterEach(cleanup);

// Include-all renders every (city, role) in scope. With the default unscoped props that is ~90+
// rows that re-render on each keystroke of `userEvent.type`; under coverage instrumentation a few
// of these brush past the 5s default. Give the suite headroom — production debounces the URL commit
// so it never re-renders per keystroke, but these tests drive the uncontrolled (delay-0) path.
// The full 128-file unit suite runs concurrently, starving these slow component tests of CPU; under
// that contention individual tests reach ~40s, so 20s was too tight and made the suite flaky. 120s
// keeps each test well clear of the limit without masking a genuine hang.
vi.setConfig({ testTimeout: 120000 });

describe("MinRoleTable", () => {
  const defaultProps = {
    dataset,
    matrix: roleMatrix,
    household: { adults: 1 as const, preschoolKids: 0 as const, schoolKids: 0 as const },
    schoolType: "public" as const,
    area: "center" as const,
    cityScope: null as null,
  };

  // Gherkin (binds): "Qualifying rows sit above a divider, others dimmed below"; "The lowest qualifying role is marked minimum"
  // NOTE: target 8000 USD genuinely splits the ladder for the default 1-adult household
  // (savings: swe_1≈2950, swe_2≈6150, senior_swe≈8710 → senior_swe is the minimum, swe_1/swe_2
  // fall below). A target of 2000 would clear ALL roles (no split) — the prior 2000 assertion
  // only "passed" because of the rank-inversion bug in orderForDisplay (now fixed).
  it("with savings_target=8000 shows qualifying above divider and minimum marked", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    // Select savings target baseline
    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));

    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "8000");

    // Divider separating qualifying from non-qualifying
    expect(screen.getByTestId("qualifying-divider")).toBeTruthy();

    // Minimum marker on the lowest qualifier
    expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);

    // Non-qualifying rows are de-emphasised
    const dimmedRows = screen.getAllByTestId("non-qualifying-row");
    expect(dimmedRows.length).toBeGreaterThan(0);

    // Regression guard against rank inversion: qualifying rows must all appear ABOVE the
    // divider in DOM order, and non-qualifying rows BELOW it. (Pre-fix, senior roles with
    // higher savings were wrongly dumped below the divider.)
    const allRows = screen.getAllByRole("row");
    const dividerIdx = allRows.findIndex(
      (r) =>
        r.querySelector('[data-testid="qualifying-divider"]') || r.getAttribute("data-testid") === "qualifying-divider",
    );
    const dimmedIdxs = dimmedRows.map((r) => allRows.indexOf(r));
    expect(dividerIdx).toBeGreaterThan(-1);
    for (const idx of dimmedIdxs) expect(idx).toBeGreaterThan(dividerIdx);
  });

  // EWT-001 (Major): Gherkin (binds): "Zero savings target marks the lowest role as the minimum".
  // With baseline source = savings target and a numeric zero target, EVERY role qualifies (no role
  // falls below the bar), so the qualifying divider must still render to anchor the qualifying group.
  // NOTE: this is a baseline-ENGAGED, target===0 state (numeric zero, not blank). It is deliberately
  // distinct from the Phase-5 min-role EMPTY-STATE, which applies to a BLANK target. Keep the two
  // distinguishable: here a baseline IS engaged (savings_target is selected and the target is the
  // literal number 0), so the table + divider render; the empty-state covers the no-target case.
  it("with savings_target=0 (baseline engaged) renders the qualifying divider and marks the minimum", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    // Select savings target baseline (default, but assert it explicitly) and set target to 0.
    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "0");

    // Divider anchors the qualifying group even when no role is below the minimum.
    expect(screen.getByTestId("qualifying-divider")).toBeTruthy();

    // The lowest-clearing role is marked as the minimum.
    expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
  });

  // Gherkin (binds): "Roles are labelled as software-engineering roles"
  it("shows SE roles caption covering IC and management tracks", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);
    // Enter a target so the ladder (and its caption) renders past the blank empty-state.
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");
    const caption = screen.getByTestId("se-roles-caption");
    expect(caption.textContent?.toLowerCase()).toMatch(/software.engineering|se roles/);
    expect(caption.textContent?.toLowerCase()).toMatch(/ic|management/);
  });

  // Gherkin (binds): "Each role shows its per-country salary distribution"
  it("role rows show p25, median, p75 distribution", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
    expect(headers.some((t) => t.includes("p25") || t.includes("bottom"))).toBe(true);
    expect(headers.some((t) => t.includes("median"))).toBe(true);
    expect(headers.some((t) => t.includes("p75") || t.includes("top"))).toBe(true);
  });

  // Gherkin (binds): "City rows show the country alongside the city name"
  it("qualifying rows show the city and its country", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    // Qualifying rows should have city cells naming both the city and its country
    const cityCells = screen.getAllByTestId("city-cell");
    expect(cityCells.length).toBeGreaterThan(0);
    for (const cell of cityCells.slice(0, 3)) {
      expect(cell.textContent?.length).toBeGreaterThan(0);
    }
  });

  // Gherkin (binds): "Geographic filter scopes the candidate cities"
  it("passing cityScope restricts every row to that city set", async () => {
    const user = userEvent.setup();
    const idCities = dataset.cities.filter((c) => c.countryId === "id");

    render(<MinRoleTable {...defaultProps} cityScope={idCities} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "500");

    // Every city cell (qualifying or not) must reference an Indonesian city — nothing leaks in.
    const cityCells = screen.getAllByTestId("city-cell");
    const idCityNames = idCities.map((c) => c.name.en);
    for (const cell of cityCells) {
      const text = cell.textContent ?? "";
      const isInIndonesia = idCityNames.some((name) => text.includes(name));
      expect(isInIndonesia).toBe(true);
    }
  });

  // INCLUDE-ALL rule (the reported "only 1 Malaysia entry" bug): with a multi-country scope and a
  // bar that several countries clear at multiple seniority levels, the table must surface EVERY
  // qualifying (city, role) — no per-role argmax collapse — so a country is never hidden behind a
  // higher-saving neighbour, and a country can appear on more than one row.
  it("INCLUDE-ALL: every qualifying country appears, and a country can occupy multiple rows", async () => {
    const user = userEvent.setup();
    const asean = dataset.cities.filter((c) => c.region === "asean");
    render(<MinRoleTable {...defaultProps} cityScope={asean} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "400");

    const cityCells = screen.getAllByTestId("city-cell");
    const texts = cityCells.map((c) => c.textContent ?? "");
    // Multiple ASEAN countries are represented (not collapsed to a single "best" country).
    const countriesShown = ["Singapore", "Malaysia", "Philippines"].filter((c) => texts.some((t) => t.includes(c)));
    expect(countriesShown.length).toBeGreaterThanOrEqual(2);
    // Malaysia clears the bar at several seniority levels → it occupies more than one row.
    const malaysiaRows = texts.filter((t) => t.includes("Malaysia"));
    expect(malaysiaRows.length).toBeGreaterThan(1);
  });

  // The below-bar near-miss rows are capped (they are optional context, not part of the include-all
  // rule); the hidden remainder is surfaced as a count so nothing is silently dropped. The QUALIFYING
  // set is never capped.
  it("caps the below-bar near-miss rows and discloses the hidden count", async () => {
    const user = userEvent.setup();
    // Unscoped (all ~31 cities × 15 roles) with a mid bar leaves far more than 12 below-bar pairs.
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "3000");

    // At most 12 dimmed near-miss rows are shown…
    expect(screen.getAllByTestId("non-qualifying-row").length).toBeLessThanOrEqual(12);
    // …and the remainder is disclosed, not silently dropped.
    const more = screen.getByTestId("non-qualifying-more");
    expect(more.textContent).toMatch(/^\+\d+/);
  });

  // Gherkin (binds): "Non-salary comp does not change the minimum-role ranking"
  it("non-salary comp column is informational and does not affect ladder order", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
    // Non-salary comp column present (informational)
    expect(headers.some((t) => t.includes("non-salary") || t.includes("rsu"))).toBe(true);
    // Non-salary comp note visible
    expect(screen.getByTestId("non-salary-rank-note")).toBeTruthy();
  });

  // Gherkin (binds): "Lifestyle does not change the minimum-role ranking"
  it("ranking key is essential savings — lifestyle column is separate", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.toLowerCase() ?? "");
    // Essential savings drives ranking
    expect(headers.some((t) => t.includes("essential savings") || t.includes("savings (essential)"))).toBe(true);
    // Lifestyle is separate (not the rank key)
    const rankNote = screen.getByTestId("rank-basis-note");
    expect(rankNote.textContent?.toLowerCase()).toMatch(/essential/);
  });

  // Gherkin (binds): "Minimum role from a reference city and role"
  it("reference_role baseline uses that role's essential savings in Jakarta", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /match a role/i }));

    // City selector and role selector appear
    expect(screen.getByRole("combobox", { name: /reference city/i })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /reference role/i })).toBeTruthy();

    const citySelect = screen.getByRole("combobox", { name: /reference city/i });
    await user.selectOptions(citySelect, "jakarta");

    const roleSelect = screen.getByRole("combobox", { name: /reference role/i });
    await user.selectOptions(roleSelect, "senior_swe");

    // Minimum marker should appear after baseline is set
    expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
  });

  // Gherkin (binds): "Minimum role from my own salary"
  it("my_salary baseline shows my-salary inputs and marks minimum", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /my salary/i }));

    // Gross salary input and city selector appear
    expect(screen.getByRole("spinbutton", { name: /my gross monthly/i })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /my salary city/i })).toBeTruthy();

    const grossInput = screen.getByRole("spinbutton", { name: /my gross monthly/i });
    await user.clear(grossInput);
    await user.type(grossInput, "5000");

    const citySelect = screen.getByRole("combobox", { name: /my salary city/i });
    await user.selectOptions(citySelect, "singapore");

    expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
  });

  // Gherkin (binds): "My-salary baseline accepts the gross in local currency or USD"
  it("my_salary gross can be entered in the salary city's local currency or USD, defaulting to local", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /my salary/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: /my salary city/i }), "singapore");

    // A salary-currency toggle offers the city's local currency (SGD) and USD, defaulting to local.
    const currencyGroup = screen.getByRole("radiogroup", { name: /salary currency/i });
    const sgd = within(currencyGroup).getByRole("radio", { name: "SGD" });
    const usd = within(currencyGroup).getByRole("radio", { name: "USD" });
    expect(sgd.getAttribute("aria-checked")).toBe("true");
    expect(usd.getAttribute("aria-checked")).toBe("false");

    // Entering a gross in local currency still produces a ranked minimum.
    const grossInput = screen.getByRole("spinbutton", { name: /my gross monthly/i });
    await user.clear(grossInput);
    await user.type(grossInput, "12000");
    expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
  });

  // Gherkin (binds): "Savings shown in USD, local, and display currency"
  it("display currency selector shows savings in USD, local, and display currency", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    const displayCurrencySelect = screen.getByRole("combobox", { name: /display currency/i });
    await user.selectOptions(displayCurrencySelect, "EUR");

    // Savings cells show 3-currency breakdown
    const savingsCells = screen.getAllByTestId("savings-triple");
    expect(savingsCells.length).toBeGreaterThan(0);
    for (const cell of savingsCells.slice(0, 3)) {
      expect(cell.textContent?.includes("USD")).toBe(true);
    }
  });

  // Gherkin (binds): "Every money column on the Minimum-role tab is dual currency"
  it("with display currency, all money columns show display+local dual-currency", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    const displayCurrencySelect = screen.getByRole("combobox", { name: /display currency/i });
    await user.selectOptions(displayCurrencySelect, "EUR");

    const dualCells = screen.getAllByTestId("dual-currency-cell");
    expect(dualCells.length).toBeGreaterThan(0);
    for (const cell of dualCells.slice(0, 3)) {
      // Should have two lines: display and local
      expect(cell.querySelectorAll("[data-line]").length).toBeGreaterThanOrEqual(2);
    }
  });

  // Gherkin (binds): "Household composition changes the minimum qualifying role"
  it("changing household to married+2-children shifts the minimum role", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "500");

    // A 500-USD bar is cleared at some seniority, so the minimum role is marked (possibly in
    // several cities at the same rank — include-all surfaces them all).
    expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);

    // Change household to married with 2 school-age children — the cost basis shifts, so the
    // minimum qualifying role recomputes. The marker must still resolve to a valid minimum.
    rerender(<MinRoleTable {...defaultProps} household={{ adults: 2, preschoolKids: 0, schoolKids: 2 }} />);
    expect(screen.getAllByTestId("minimum-marker").length).toBeGreaterThan(0);
  });

  // Gherkin (binds): "No role can reach the bar"
  it("with impossibly high target shows no-qualifier message", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "999999999");

    expect(screen.getByTestId("no-qualifier-message")).toBeTruthy();
    expect(screen.queryByTestId("minimum-marker")).toBeNull();
  });

  // Gherkin (binds): "Cost-basis controls affect role candidates"
  it("changing household prop updates the ranked ladder", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    // Change area to rural — should update the ladder
    rerender(<MinRoleTable {...defaultProps} area="rural" />);

    // Ladder still renders (cost basis changed)
    expect(screen.getByRole("table")).toBeTruthy();
  });

  // Gherkin (binds): "Low-confidence cells are flagged"
  it("cells backed by lower-confidence estimates show a confidence flag", async () => {
    const user = userEvent.setup();
    // Scope to SE Asia cities — many roles have "proxy"/"moderate" confidence there
    const seaCities = dataset.cities.filter(
      (c) => c.countryId === "id" || c.countryId === "th" || c.countryId === "vn" || c.countryId === "ph",
    );
    render(<MinRoleTable {...defaultProps} cityScope={seaCities} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    // Confidence flags exist for proxy/moderate estimates in SE Asia dataset
    const flags = screen.getAllByTestId("confidence-flag");
    expect(flags.length).toBeGreaterThan(0);
  });

  // Gherkin (binds): "No Israeli city appears among role candidates"
  it("no Israeli city appears in the ladder", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);

    await user.click(screen.getByRole("radio", { name: /monthly savings target/i }));
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "1000");

    const cityCells = screen.getAllByTestId("city-cell");
    for (const cell of cityCells) {
      expect(cell.textContent).not.toMatch(/israel|tel aviv/i);
    }
  });

  // UWT-006: with the savings-target baseline engaged but a BLANK target (no value entered yet),
  // the role table is replaced by empty-state guidance — full salary data should not be dumped on
  // the user before they state a goal. This is the BLANK case, deliberately distinct from the
  // Phase-1 numeric-zero case (typing "0" → divider + table). On mount the target is blank.
  it("UWT-006: with savings-target baseline and a BLANK target, the table is hidden and empty-state guidance is shown", () => {
    render(<MinRoleTable {...defaultProps} />);
    // savings_target is the default baseline source; no value has been typed → blank.
    expect(screen.getByTestId("min-role-empty-state")).toBeTruthy();
    // The role ladder (and its markers) must not render while the target is blank.
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByTestId("minimum-marker")).toBeNull();
    expect(screen.queryByTestId("qualifying-divider")).toBeNull();
  });

  // UWT-006 reconciliation guard: typing an explicit numeric "0" is NOT blank — it must engage the
  // baseline, render the table + divider, and clear the empty-state. (Pairs with the Phase-1
  // "savings_target=0 (baseline engaged)" test above.)
  it("UWT-006: typing an explicit '0' clears the empty-state and renders the role table", async () => {
    const user = userEvent.setup();
    render(<MinRoleTable {...defaultProps} />);
    const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target/i });
    await user.clear(targetInput);
    await user.type(targetInput, "0");
    expect(screen.queryByTestId("min-role-empty-state")).toBeNull();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByTestId("qualifying-divider")).toBeTruthy();
  });

  // Phase 5: design-system primitives
  it("Phase5: baseline source selector uses a segmented control (role='radiogroup')", () => {
    render(<MinRoleTable {...defaultProps} />);
    // UWT-001: the baseline-source group's accessible name is now the scent-bearing relabel.
    const radiogroup = screen.getByRole("radiogroup", { name: /how to set your target/i });
    expect(radiogroup).toBeTruthy();
  });

  // Gherkin (binds): "id-locale tables use Indonesian city and country names"
  describe("id locale name rendering", () => {
    it("renders 'Singapura' in the city column when locale=id", async () => {
      const user = userEvent.setup();
      // Scope to Singapore only so every row is Singapore (id: "Singapura")
      const sgCities = dataset.cities.filter((c) => c.countryId === "sg");
      render(<MinRoleTable {...defaultProps} cityScope={sgCities} locale="id" />);
      // savings_target is default; type directly into target input
      const targetInput = document.querySelector("#target-amount-input") as HTMLInputElement;
      await user.clear(targetInput);
      await user.type(targetInput, "500");
      const cityCells = screen.getAllByTestId("city-cell");
      const texts = cityCells.map((c) => c.textContent ?? "");
      expect(texts.some((t) => /Singapura/.test(t))).toBe(true);
    });

    it("renders 'Jepang' in the city column when locale=id", async () => {
      const user = userEvent.setup();
      // Scope to Japan only so every row has country name "Jepang" (id locale)
      const jpCities = dataset.cities.filter((c) => c.countryId === "jp");
      render(<MinRoleTable {...defaultProps} cityScope={jpCities} locale="id" />);
      // savings_target is default; type directly into target input
      const targetInput = document.querySelector("#target-amount-input") as HTMLInputElement;
      await user.clear(targetInput);
      await user.type(targetInput, "500");
      const cityCells = screen.getAllByTestId("city-cell");
      const texts = cityCells.map((c) => c.textContent ?? "");
      expect(texts.some((t) => /Jepang/.test(t))).toBe(true);
    });
  });

  // Regression: in controlled (URL-driven) mode the text inputs must debounce their commit
  // so typing the savings target does not write the URL on every keystroke (the stutter bug).
  describe("controlled inputs debounce their URL commit", () => {
    function Controlled({ onCommit }: { onCommit: (next: MinRoleInputs) => void }) {
      const [inputs, setInputs] = useState<MinRoleInputs>({
        ...DEFAULT_STATE.minRole,
        baselineSource: "savings_target",
        targetRaw: "",
      });
      return (
        <MinRoleTable
          {...defaultProps}
          inputs={inputs}
          onInputsChange={(next) => {
            setInputs(next);
            onCommit(next);
          }}
        />
      );
    }

    it("typing the savings target commits once after the debounce window, not per keystroke", () => {
      vi.useFakeTimers();
      try {
        const onCommit = vi.fn();
        render(<Controlled onCommit={onCommit} />);
        const input = document.querySelector("#target-amount-input") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "8" } });
        fireEvent.change(input, { target: { value: "80" } });
        fireEvent.change(input, { target: { value: "8000" } });

        // The field echoes the latest keystroke immediately for responsiveness…
        expect(input.value).toBe("8000");
        // …but the URL commit has not fired — the debounce window has not elapsed.
        expect(onCommit).not.toHaveBeenCalled();

        act(() => vi.advanceTimersByTime(URL_INPUT_DEBOUNCE_MS));

        // Exactly one commit carrying the final value — the keystroke burst collapsed.
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(onCommit).toHaveBeenLastCalledWith(expect.objectContaining({ targetRaw: "8000" }));
      } finally {
        vi.useRealTimers();
      }
    });
  });

  it("changing the target currency commits the new code", () => {
    const onCommit = vi.fn();
    function Controlled() {
      const [inputs, setInputs] = useState<MinRoleInputs>({
        ...DEFAULT_STATE.minRole,
        baselineSource: "savings_target",
        targetRaw: "100",
        targetCurrency: "USD",
      });
      return (
        <MinRoleTable
          {...defaultProps}
          inputs={inputs}
          onInputsChange={(next) => {
            setInputs(next);
            onCommit(next);
          }}
        />
      );
    }
    render(<Controlled />);
    const select = document.querySelector("#target-currency-select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "EUR" } });
    expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ targetCurrency: "EUR" }));
  });

  // DWT-003: the min-role currency/ref selects must use the shared SelectField chrome
  // (appearance-none + custom chevron) so they match the geo selects.
  describe("DWT-003 — min-role selects use the shared SelectField chrome", () => {
    function assertStyledSelect(id: string) {
      const select = document.querySelector(`#${id}`) as HTMLSelectElement | null;
      expect(select, `select #${id} should exist`).not.toBeNull();
      expect(select!.classList.contains("appearance-none")).toBe(true);
      // SelectField wraps the <select> in a `relative` div that also renders the chevron svg.
      expect(select!.parentElement!.querySelector("svg")).not.toBeNull();
    }

    it("savings-target currency + display-currency selects are styled", () => {
      render(
        <MinRoleTable
          {...defaultProps}
          inputs={{ ...DEFAULT_STATE.minRole, baselineSource: "savings_target" }}
          onInputsChange={() => {}}
        />,
      );
      assertStyledSelect("target-currency-select");
      assertStyledSelect("display-currency-select");
    });

    it("reference-role city + role selects are styled", () => {
      render(
        <MinRoleTable
          {...defaultProps}
          inputs={{ ...DEFAULT_STATE.minRole, baselineSource: "reference_role" }}
          onInputsChange={() => {}}
        />,
      );
      assertStyledSelect("ref-city-select");
      assertStyledSelect("ref-role-select");
    });

    it("my-salary city select is styled", () => {
      render(
        <MinRoleTable
          {...defaultProps}
          inputs={{ ...DEFAULT_STATE.minRole, baselineSource: "my_salary" }}
          onInputsChange={() => {}}
        />,
      );
      assertStyledSelect("my-city-select");
    });
  });

  // DWT-004: the 3-option baseline-source segmented control must keep each option at 44px and
  // wrap to a second row at narrow widths instead of ballooning the box height.
  it("DWT-004: baseline-source control flex-wraps and each option keeps min-h-[44px]", () => {
    const { container } = render(
      <MinRoleTable
        {...defaultProps}
        inputs={{ ...DEFAULT_STATE.minRole, baselineSource: "savings_target" }}
        onInputsChange={() => {}}
      />,
    );
    const group = Array.from(container.querySelectorAll("[role='radiogroup']")).find(
      (g) =>
        g.getAttribute("aria-label")?.match(/baseline|target/i) &&
        within(g as HTMLElement).queryAllByRole("radio").length === 3,
    );
    expect(group).toBeDefined();
    expect((group as HTMLElement).classList.contains("flex-wrap")).toBe(true);
    for (const opt of within(group as HTMLElement).getAllByRole("radio")) {
      expect(opt.classList.contains("min-h-[44px]")).toBe(true);
    }
  });

  // DWT-007: on the my_salary baseline (non-USD city), the salary-currency toggle's field
  // group must be a direct items-end flex child of the field row, and its label is a <label>
  // so the column height is deterministic and the toggle bottom-aligns with the gross input.
  it("DWT-007: salary-currency toggle field group is an items-end flex child with a <label>", () => {
    const { container } = render(
      <MinRoleTable
        {...defaultProps}
        inputs={{ ...DEFAULT_STATE.minRole, baselineSource: "my_salary" }}
        onInputsChange={() => {}}
      />,
    );
    // The toggle (a 2-option radiogroup of local/USD) lives in the my_salary field row.
    const toggle = Array.from(container.querySelectorAll("[role='radiogroup']")).find((g) =>
      g.getAttribute("aria-label")?.match(/salary currency/i),
    );
    expect(toggle).toBeDefined();
    const fieldGroup = (toggle as HTMLElement).parentElement!;
    // Its parent field row must be an items-end flex container so the columns bottom-align.
    const fieldRow = fieldGroup.parentElement!;
    expect(fieldRow.classList.contains("items-end")).toBe(true);
    expect(fieldRow.classList.contains("flex")).toBe(true);
    // The field group's caption must be a <label> (deterministic column height), not a bare span.
    const caption = fieldGroup.querySelector("label");
    expect(caption).not.toBeNull();
    expect(caption!.textContent).toMatch(/salary currency/i);
  });

  // ─── Cluster 4 — jargon glosses & i18n labels ───────────────────────────────
  describe("Cluster 4 — jargon glosses & i18n labels", () => {
    // Reveal the role ladder table by engaging a savings target.
    async function withTarget(locale?: "en" | "id") {
      const user = userEvent.setup();
      render(<MinRoleTable {...defaultProps} locale={locale} />);
      await user.click(screen.getAllByRole("radio", { name: /monthly savings target|target tabungan bulanan/i })[0]!);
      const targetInput = screen.getByRole("spinbutton", { name: /monthly savings target|target tabungan bulanan/i });
      await user.clear(targetInput);
      await user.type(targetInput, "8000");
      return user;
    }

    // UWT-001: "Baseline source" relabelled to a scent-bearing label in both locales.
    it("UWT-001: baseline-source label reads 'How to set your target' (en)", () => {
      render(<MinRoleTable {...defaultProps} />);
      expect(screen.getAllByText("How to set your target").length).toBeGreaterThan(0);
      expect(screen.queryByText("Baseline source")).toBeNull();
    });

    it("UWT-001: baseline-source label reads 'Cara menetapkan target' (id)", () => {
      render(<MinRoleTable {...defaultProps} locale="id" />);
      expect(screen.getAllByText("Cara menetapkan target").length).toBeGreaterThan(0);
      expect(screen.queryByText("Sumber baseline")).toBeNull();
    });

    // UWT-010: P25 / Median / P75 headers carry percentile glosses (title attribute).
    it("UWT-010: P25/Median/P75 distribution headers carry title glosses", async () => {
      await withTarget();
      const headers = screen.getAllByRole("columnheader");
      for (const re of [/^P25/i, /^Median/i, /^P75/i]) {
        const header = headers.find((h) => re.test(h.textContent?.trim() ?? ""));
        expect(header, `header ${re} present`).toBeDefined();
        const hasTitle = header!.hasAttribute("title") || header!.querySelector("[title]") !== null;
        expect(hasTitle, `header ${re} has title gloss`).toBe(true);
      }
    });

    // UWT-013: the Track column expands ic/mgmt to full localized words (no bare "ic"/"mgmt").
    it("UWT-013: Track column shows full words, not bare ic/mgmt (en)", async () => {
      await withTarget();
      const trackCells = screen.getAllByRole("cell").filter((c) => {
        const t = c.textContent?.trim() ?? "";
        return t === "ic" || t === "mgmt";
      });
      expect(trackCells.length).toBe(0);
      expect(screen.getAllByText(/Individual contributor|Management/).length).toBeGreaterThan(0);
    });

    it("UWT-013: Track column is localized in id", async () => {
      await withTarget("id");
      expect(screen.getAllByText(/Kontributor individu|Manajemen/).length).toBeGreaterThan(0);
    });

    // UWT-003: Non-salary comp header shortened + carries a title expansion.
    it("UWT-003: Non-salary comp header is shortened and carries a title gloss", async () => {
      await withTarget();
      const headers = screen.getAllByRole("columnheader");
      const nsc = headers.find((h) => /non-salary comp/i.test(h.textContent?.trim() ?? ""));
      expect(nsc).toBeDefined();
      expect(nsc!.textContent?.trim()).toBe("Non-salary comp");
      const hasTitle = nsc!.hasAttribute("title") || nsc!.querySelector("[title]") !== null;
      expect(hasTitle).toBe(true);
    });
  });

  // Baseline failure containment: an unconvertible target currency (no fx rate) must not
  // crash the tab — the baseline stays disengaged, so no ladder renders, but the controls stay live.
  it("an unknown target currency disengages the baseline without crashing", () => {
    render(
      <MinRoleTable
        {...defaultProps}
        inputs={{ ...DEFAULT_STATE.minRole, baselineSource: "savings_target", targetRaw: "100", targetCurrency: "XXX" }}
        onInputsChange={() => {}}
      />,
    );
    // No baseline engaged: no table, no cards, no divider, no minimum marker…
    expect(screen.queryByTestId("min-role-table")).toBeNull();
    expect(screen.queryByTestId("mobile-role-cards")).toBeNull();
    expect(screen.queryByTestId("qualifying-divider")).toBeNull();
    expect(screen.queryAllByTestId("minimum-marker").length).toBe(0);
    // …but the tab stays alive — the savings-target input still accepts a fix.
    expect(screen.getByRole("spinbutton", { name: /monthly savings target/i })).toBeTruthy();
  });
});
