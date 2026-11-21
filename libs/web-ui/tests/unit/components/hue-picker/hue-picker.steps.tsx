import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";

import { HuePicker, HUES } from "../../../../src/components/hue-picker/hue-picker";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/hue-picker/hue-picker.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/libs/web-ui/behaviours/hue-picker/hue-picker.feature: Renders 6 swatches
  Scenario("Renders 6 swatches", ({ When, Then }) => {
    let swatches: HTMLElement[];

    When('I render a HuePicker with value "teal"', () => {
      cleanup();
      render(<HuePicker value="teal" onChange={vi.fn()} />);
      swatches = screen.getAllByRole("button");
    });

    Then("the component should have 6 swatch buttons", () => {
      expect(swatches).toHaveLength(6);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/hue-picker/hue-picker.feature: Click calls onChange
  Scenario("Click calls onChange", ({ Given, When, Then }) => {
    const onChangeMock = vi.fn();

    Given('I render a HuePicker with value "teal"', () => {
      cleanup();
      render(<HuePicker value="teal" onChange={onChangeMock} />);
      expect(screen.getByRole("button", { name: "teal" }).getAttribute("aria-pressed")).toBe("true");
    });

    When('the user clicks the "sage" swatch', () => {
      cleanup();
      render(<HuePicker value="teal" onChange={onChangeMock} />);
      fireEvent.click(screen.getByRole("button", { name: "sage" }));
    });

    Then('onChange should be called with "sage"', () => {
      expect(onChangeMock).toHaveBeenCalledWith("sage");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/hue-picker/hue-picker.feature: aria-pressed reflects selection
  Scenario("aria-pressed reflects selection", ({ When, Then, And }) => {
    let teal: HTMLElement;
    let sage: HTMLElement;

    When('I render a HuePicker with value "teal"', () => {
      cleanup();
      render(<HuePicker value="teal" onChange={vi.fn()} />);
      teal = screen.getByRole("button", { name: "teal" });
      sage = screen.getByRole("button", { name: "sage" });
    });

    Then('the "teal" swatch should have aria-pressed "true"', () => {
      expect(teal.getAttribute("aria-pressed")).toBe("true");
    });

    And('the "sage" swatch should have aria-pressed "false"', () => {
      expect(sage.getAttribute("aria-pressed")).toBe("false");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/hue-picker/hue-picker.feature: HUES lists the six hues terracotta, honey, sage, teal, sky, plum in that order
  Scenario("HUES lists the six hues terracotta, honey, sage, teal, sky, plum in that order", ({ When, Then }) => {
    let hues: readonly string[] = [];

    When("I read the HUES list", () => {
      hues = HUES;
    });

    Then('the list should be "terracotta, honey, sage, teal, sky, plum"', () => {
      expect([...hues].join(", ")).toBe("terracotta, honey, sage, teal, sky, plum");
    });
  });
});
