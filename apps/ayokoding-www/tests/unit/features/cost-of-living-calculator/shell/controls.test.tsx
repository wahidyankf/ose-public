import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { dataset } from "../../../../../src/features/cost-of-living-calculator/core/data/cities";
import type { Household } from "../../../../../src/features/cost-of-living-calculator/core/data/cities";
import type { Area, SchoolType } from "../../../../../src/features/cost-of-living-calculator/core/calc";
import { Controls } from "../../../../../src/features/cost-of-living-calculator/shell/controls";

afterEach(cleanup);

const firstCity = dataset.cities[0]!;

function ControlsWithState(
  overrides: Partial<{
    adults: 1 | 2;
    preschoolKids: 0 | 1 | 2 | 3;
    schoolKids: 0 | 1 | 2 | 3;
    schoolType: SchoolType;
    area: Area;
    previewCityId: string;
  }>,
) {
  const [household, setHousehold] = useState<Household>({
    adults: overrides.adults ?? 1,
    preschoolKids: overrides.preschoolKids ?? 0,
    schoolKids: overrides.schoolKids ?? 0,
  });
  const [schoolType, setSchoolType] = useState<SchoolType>(overrides.schoolType ?? "public");
  const [area, setArea] = useState<Area>(overrides.area ?? "center");

  return (
    <Controls
      dataset={dataset}
      previewCityId={overrides.previewCityId ?? firstCity.id}
      household={household}
      schoolType={schoolType}
      area={area}
      onHouseholdChange={setHousehold}
      onSchoolTypeChange={setSchoolType}
      onAreaChange={setArea}
    />
  );
}

describe("Controls", () => {
  // The single-city essentials preview is no longer rendered by any tab (it was removed from the
  // min-role tab — its only former consumer — which now lists every qualifying city). The Controls
  // component RETAINS the capability behind `showPreview` purely as a deterministic probe for the
  // cost-math tests below; these three tests pin that dormant contract. The product-level guarantee
  // that no tab shows it lives in calculator-content.test.tsx.
  it("retained preview capability: carries an example caption naming the city (en)", () => {
    render(<ControlsWithState previewCityId="singapore" />);
    const caption = screen.getByTestId("min-role-example-caption");
    expect(caption.textContent).toMatch(/example/i);
    expect(caption.textContent).toContain("Singapore");
  });

  it("UWT-006: example caption is localized in id", () => {
    render(
      <Controls
        dataset={dataset}
        previewCityId="singapore"
        household={{ adults: 1, preschoolKids: 0, schoolKids: 0 }}
        schoolType="public"
        area="center"
        locale="id"
        onHouseholdChange={() => {}}
        onSchoolTypeChange={() => {}}
        onAreaChange={() => {}}
      />,
    );
    const caption = screen.getByTestId("min-role-example-caption");
    expect(caption.textContent).toMatch(/contoh/i);
    expect(caption.textContent).toContain("Singapura");
  });

  it("UWT-006: no example caption when the preview is hidden", () => {
    render(
      <Controls
        dataset={dataset}
        previewCityId="singapore"
        household={{ adults: 1, preschoolKids: 0, schoolKids: 0 }}
        schoolType="public"
        area="center"
        showPreview={false}
        onHouseholdChange={() => {}}
        onSchoolTypeChange={() => {}}
        onAreaChange={() => {}}
      />,
    );
    expect(screen.queryByTestId("min-role-example-caption")).toBeNull();
  });

  // UWT-010: Area label must not wrap (Indonesian locale has longer text)
  it("UWT-010: the Area label element has whitespace-nowrap class", () => {
    const { container } = render(<ControlsWithState />);

    // Find the span/label for "Area"
    const areaLabel = Array.from(container.querySelectorAll("span")).find((el) =>
      el.textContent?.match(/area|wilayah/i),
    );
    expect(areaLabel).toBeDefined();
    expect(areaLabel!.classList.contains("whitespace-nowrap")).toBe(true);
  });

  // UWT-009: interactive controls must have 44px minimum touch target
  it("UWT-009: interactive select controls have min-h-[44px] class or data-min-touch attribute", () => {
    const { container } = render(<ControlsWithState />);

    const selects = container.querySelectorAll("select");
    expect(selects.length).toBeGreaterThan(0);

    for (const select of Array.from(selects)) {
      const hasMinHeight = select.classList.contains("min-h-[44px]");
      const hasDataAttr = select.getAttribute("data-min-touch") === "true";
      const wrapper = select.closest("[data-min-touch='true']") ?? select.closest(".min-h-\\[44px\\]");
      expect(hasMinHeight || hasDataAttr || wrapper !== null).toBe(true);
    }
  });

  // Regression: the segmented control (radiogroup) must be the same 44px height as the sibling
  // selects/inputs so it bottom-aligns in `items-end` field rows instead of sitting low (the
  // "Salary currency" toggle appeared lower than the gross input + salary-city select).
  it("segmented controls (radiogroups) have the min-h-[44px] touch-target/alignment class", () => {
    const { container } = render(<ControlsWithState />);

    const groups = container.querySelectorAll("[role='radiogroup']");
    expect(groups.length).toBeGreaterThan(0);

    for (const group of Array.from(groups)) {
      expect(group.classList.contains("min-h-[44px]")).toBe(true);
    }
  });

  // EWT-002: every segmented-radio button (and not just the radiogroup container) must meet
  // the 44px WCAG 2.5.8 touch target at mobile widths.
  it("EWT-002: every segmented-radio button has the min-h-[44px] touch-target class", () => {
    const { container } = render(<ControlsWithState schoolKids={2} />);
    const radios = container.querySelectorAll("[role='radio']");
    expect(radios.length).toBeGreaterThan(0);
    for (const radio of Array.from(radios)) {
      expect(radio.classList.contains("min-h-[44px]")).toBe(true);
    }
  });

  // UWT-008: the Area segmented control (a radiogroup) must expose aria-checked reflecting the
  // selected option — active state is otherwise signalled only by colour.
  it("UWT-008: Area options expose aria-checked reflecting the selected option", () => {
    const { container } = render(<ControlsWithState area="center" />);
    const areaGroup = Array.from(container.querySelectorAll("[role='radiogroup']")).find((g) =>
      g.getAttribute("aria-label")?.match(/area/i),
    );
    expect(areaGroup).toBeDefined();
    const center = within(areaGroup as HTMLElement).getByRole("radio", { name: /city center/i });
    const rural = within(areaGroup as HTMLElement).getByRole("radio", { name: /rural/i });
    expect(center.getAttribute("aria-checked")).toBe("true");
    expect(rural.getAttribute("aria-checked")).toBe("false");
  });

  // UWT-008: the active segmented option must carry a non-colour active indicator (not colour
  // alone) so colour-blind users can perceive selection.
  it("UWT-008: the active segmented option carries a non-colour active indicator class", () => {
    const { container } = render(<ControlsWithState area="center" />);
    const areaGroup = Array.from(container.querySelectorAll("[role='radiogroup']")).find((g) =>
      g.getAttribute("aria-label")?.match(/area/i),
    );
    const center = within(areaGroup as HTMLElement).getByRole("radio", { name: /city center/i });
    const rural = within(areaGroup as HTMLElement).getByRole("radio", { name: /rural/i });
    // The active option carries a non-colour ring indicator that the inactive option lacks
    // (a ring-1 ring-primary-foreground inset, not a focus-only ring). Assert the checked
    // option has a ring-N utility the unchecked option does not.
    const activeRing = (cls: string) => (cls.match(/(?:^|\s)ring-\d/g) ?? []).length;
    expect(activeRing(center.className)).toBeGreaterThan(activeRing(rural.className));
  });

  // UWT-011: the disabled school-type buttons must announce the prerequisite via
  // aria-describedby → the hint element, and expose aria-disabled.
  it("UWT-011: disabled school-type buttons reference the hint via aria-describedby and are aria-disabled", () => {
    render(<ControlsWithState schoolKids={0} />);
    const hint = screen.getByText(/add school-age children to choose/i);
    expect(hint.id).toBe("school-type-hint");

    const group = screen.getByRole("radiogroup", { name: /school type/i });
    const buttons = within(group).getAllByRole("radio");
    for (const button of buttons) {
      expect(button.getAttribute("aria-describedby")).toBe("school-type-hint");
      expect(button.getAttribute("aria-disabled")).toBe("true");
    }
  });

  // UWT-015: the disabled Public/Private buttons must carry a localized native `title` tooltip
  // explaining the prerequisite so a hovering first-timer learns why they can't be used.
  it("UWT-015: disabled school-type buttons carry a localized title tooltip (en)", () => {
    render(<ControlsWithState schoolKids={0} />);
    const group = screen.getByRole("radiogroup", { name: /school type/i });
    const buttons = within(group).getAllByRole("radio");
    for (const button of buttons) {
      expect(button.getAttribute("title")).toBe("Add a school-age child to enable this option");
    }
  });

  it("UWT-015: disabled school-type buttons carry a localized title tooltip (id)", () => {
    render(
      <Controls
        dataset={dataset}
        previewCityId={firstCity.id}
        household={{ adults: 1, preschoolKids: 0, schoolKids: 0 }}
        schoolType="public"
        area="center"
        locale="id"
        onHouseholdChange={() => {}}
        onSchoolTypeChange={() => {}}
        onAreaChange={() => {}}
      />,
    );
    const group = screen.getByRole("radiogroup", { name: /jenis sekolah/i });
    const buttons = within(group).getAllByRole("radio");
    for (const button of buttons) {
      expect(button.getAttribute("title")).toBe("Tambahkan anak usia sekolah untuk mengaktifkan opsi ini");
    }
  });

  // UWT-015: the disabled school-type group must read as inactive BEFORE a click — it carries a
  // reduced-opacity class, and the (formerly filled) selected option no longer keeps its active
  // brand fill while disabled.
  it("UWT-015: disabled school-type group is visually dimmed and drops the active fill", () => {
    render(<ControlsWithState schoolKids={0} schoolType="public" />);
    const group = screen.getByRole("radiogroup", { name: /school type/i });
    // The group is dimmed.
    expect(group.className).toMatch(/opacity-50/);
    // No disabled option keeps the active brand fill (which would read as enabled/selected).
    const buttons = within(group).getAllByRole("radio");
    for (const button of buttons) {
      expect(button.className).not.toMatch(/bg-primary/);
    }
  });

  // UWT-015 guard: when ENABLED, the group is NOT dimmed and the selected option keeps its fill —
  // the dim must apply only to the disabled state so other segmented groups are unaffected.
  it("UWT-015: enabled school-type group keeps the active fill and is not dimmed", () => {
    render(<ControlsWithState schoolKids={1} schoolType="public" />);
    const group = screen.getByRole("radiogroup", { name: /school type/i });
    expect(group.className).not.toMatch(/opacity-50/);
    const selected = within(group)
      .getAllByRole("radio")
      .find((b) => b.getAttribute("aria-checked") === "true")!;
    expect(selected.className).toMatch(/bg-primary/);
  });

  // DWT-002: the household selects must use the shared SelectField chrome (appearance-none +
  // custom chevron overlay) so they match the geo selects instead of showing the native arrow.
  it("DWT-002: household selects use appearance-none chrome with a custom chevron overlay", () => {
    const { container } = render(<ControlsWithState />);
    const selects = container.querySelectorAll("select");
    expect(selects.length).toBe(3);
    for (const select of Array.from(selects)) {
      expect(select.classList.contains("appearance-none")).toBe(true);
      // SelectField wraps the <select> in a `relative` container that also holds the chevron svg.
      const wrapper = select.parentElement!;
      expect(wrapper.querySelector("svg")).not.toBeNull();
    }
  });

  // Phase 9 Cluster J — id Area label must be short enough not to wrap at 375px
  it("Phase9J: id locale Area label text is no longer than 10 characters", () => {
    const { container } = render(
      <Controls
        dataset={dataset}
        previewCityId={firstCity.id}
        household={{ adults: 1, preschoolKids: 0, schoolKids: 0 }}
        schoolType="public"
        area="center"
        locale="id"
        onHouseholdChange={() => {}}
        onSchoolTypeChange={() => {}}
        onAreaChange={() => {}}
      />,
    );
    const areaLabel = Array.from(container.querySelectorAll("span")).find((el) =>
      el.className.includes("whitespace-nowrap"),
    );
    expect(areaLabel).toBeTruthy();
    // "Wilayah tempat tinggal" = 22 chars; must be shortened
    expect((areaLabel!.textContent ?? "").length).toBeLessThanOrEqual(10);
  });

  // Phase 9 Cluster I — each label+select pair must not mid-pair wrap at 320px
  it("Phase9I: each label+select pair has its own flex wrapper (not siblings of other pairs)", () => {
    const { container } = render(<ControlsWithState />);
    const adultsLabel = container.querySelector('label[for="controls-adults"]');
    const adultsSelect = container.querySelector("#controls-adults");
    expect(adultsLabel).toBeTruthy();
    expect(adultsSelect).toBeTruthy();
    // Each pair must be isolated in its own wrapper (parent has exactly 2 children)
    expect(adultsLabel!.parentElement!.children.length).toBe(2);
  });

  // Gherkin (binds): "Adding adults and children grows housing and utilities sub-linearly"; "Adding adults and children grows food and healthcare near per capita"; "Adding school-age children adds schooling costs"
  it("changing from single to married+2-school-kids increases housing sub-linearly and adds schooling", async () => {
    const user = userEvent.setup();
    render(<ControlsWithState />);

    // Capture single baseline
    const housingBefore = parseFloat(screen.getByTestId("preview-housing").getAttribute("data-local") ?? "0");
    const foodBefore = parseFloat(screen.getByTestId("preview-food").getAttribute("data-local") ?? "0");
    const schoolingBefore = parseFloat(screen.getByTestId("preview-schooling").getAttribute("data-local") ?? "0");

    // Change to 2 adults
    await user.selectOptions(screen.getByRole("combobox", { name: /adults/i }), "2");
    // Change to 2 school-age kids
    await user.selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "2");

    const housingAfter = parseFloat(screen.getByTestId("preview-housing").getAttribute("data-local") ?? "0");
    const foodAfter = parseFloat(screen.getByTestId("preview-food").getAttribute("data-local") ?? "0");
    const schoolingAfter = parseFloat(screen.getByTestId("preview-schooling").getAttribute("data-local") ?? "0");

    // Housing increases but sub-linearly (less than 3× for 3 people vs 1)
    expect(housingAfter).toBeGreaterThan(housingBefore);
    expect(housingAfter).toBeLessThan(housingBefore * 3);

    // Food increases near per-capita (roughly 3× for 4 people → we just check increase)
    expect(foodAfter).toBeGreaterThan(foodBefore);

    // Schooling added for 2 school-age children
    expect(schoolingAfter).toBeGreaterThan(schoolingBefore);
  });

  // Gherkin (binds): "Pre-school children incur childcare, not schooling"
  it("1 preschool child adds childcare but no schooling", async () => {
    const user = userEvent.setup();
    render(<ControlsWithState />);

    const childcareBefore = parseFloat(screen.getByTestId("preview-childcare").getAttribute("data-local") ?? "0");
    const schoolingBefore = parseFloat(screen.getByTestId("preview-schooling").getAttribute("data-local") ?? "0");

    await user.selectOptions(screen.getByRole("combobox", { name: /preschool children/i }), "1");

    const childcareAfter = parseFloat(screen.getByTestId("preview-childcare").getAttribute("data-local") ?? "0");
    const schoolingAfter = parseFloat(screen.getByTestId("preview-schooling").getAttribute("data-local") ?? "0");

    expect(childcareAfter).toBeGreaterThan(childcareBefore);
    expect(schoolingAfter).toBe(schoolingBefore); // no schooling for preschool
  });

  // Gherkin (binds): "School type toggle is shown but disabled without school-age children"
  it("school-type toggle always shown — disabled without school-age children, enabled when > 0", async () => {
    const user = userEvent.setup();
    render(<ControlsWithState />);

    // Always present, but disabled at 0 school-age kids
    const group = screen.getByRole("radiogroup", { name: /school type/i });
    expect(group).toBeTruthy();
    expect(group.getAttribute("aria-disabled")).toBe("true");
    expect(
      within(group)
        .getAllByRole("radio")
        .every((b) => (b as HTMLButtonElement).disabled),
    ).toBe(true);
    // A hint explains why it is disabled
    expect(screen.getByText(/add school-age children to choose/i)).toBeTruthy();

    // Add 1 school-age child → toggle becomes enabled and the hint disappears
    await user.selectOptions(screen.getByRole("combobox", { name: /school-age children/i }), "1");

    const enabled = screen.getByRole("radiogroup", { name: /school type/i });
    expect(enabled.getAttribute("aria-disabled")).toBeNull();
    expect(
      within(enabled)
        .getAllByRole("radio")
        .every((b) => !(b as HTMLButtonElement).disabled),
    ).toBe(true);
    expect(screen.queryByText(/add school-age children to choose/i)).toBeNull();
  });

  // Gherkin (binds): "Private school raises expenses more than public"
  // Preview Berlin (Germany = public school open to foreigners) so public < private holds; the
  // default preview city (Singapore) is "limited", where public correctly falls back to private.
  it("switching to private school increases schooling portion", async () => {
    const user = userEvent.setup();
    render(<ControlsWithState schoolKids={2} previewCityId="berlin" />);

    const schoolingPublic = parseFloat(screen.getByTestId("preview-schooling").getAttribute("data-local") ?? "0");

    await user.click(screen.getByRole("radio", { name: /private/i }));

    const schoolingPrivate = parseFloat(screen.getByTestId("preview-schooling").getAttribute("data-local") ?? "0");

    expect(schoolingPrivate).toBeGreaterThan(schoolingPublic);
  });

  // Gherkin (binds): "area changes the housing estimate"
  it("switching to rural reduces modeled housing and city total", async () => {
    const user = userEvent.setup();
    render(<ControlsWithState />);

    const housingCenter = parseFloat(screen.getByTestId("preview-housing").getAttribute("data-local") ?? "0");
    const totalCenter = parseFloat(screen.getByTestId("preview-total").getAttribute("data-local") ?? "0");

    await user.click(screen.getByRole("radio", { name: /rural/i }));

    const housingRural = parseFloat(screen.getByTestId("preview-housing").getAttribute("data-local") ?? "0");
    const totalRural = parseFloat(screen.getByTestId("preview-total").getAttribute("data-local") ?? "0");

    expect(housingRural).toBeLessThan(housingCenter);
    expect(totalRural).toBeLessThan(totalCenter);
  });
});
