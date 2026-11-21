import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";

import { Toggle } from "../../../../src/components/toggle/toggle";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/toggle/toggle.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/toggle/toggle.feature: A toggle reports its on or off state
  ScenarioOutline("A toggle reports its on or off state", ({ When, Then }, examples) => {
    let toggle: HTMLElement;

    When("I render a Toggle with value <value>", () => {
      cleanup();
      render(<Toggle value={examples["value"] === "true"} onChange={vi.fn()} />);
      toggle = screen.getByRole("switch");
    });

    Then('the toggle switch should have aria-checked "<checked>"', () => {
      expect(toggle.getAttribute("aria-checked")).toBe(String(examples["checked"]));
    });
  });

  // @scenario specs/libs/web-ui/behaviours/toggle/toggle.feature: Click triggers onChange
  Scenario("Click triggers onChange", ({ Given, When, Then }) => {
    const onChangeMock = vi.fn();

    Given("I render a Toggle with value false", () => {
      cleanup();
      render(<Toggle value={false} onChange={onChangeMock} />);
      expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
    });

    When("the user clicks the toggle", () => {
      cleanup();
      render(<Toggle value={false} onChange={onChangeMock} />);
      fireEvent.click(screen.getByRole("switch"));
    });

    Then("onChange should be called with true", () => {
      expect(onChangeMock).toHaveBeenCalledWith(true);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/toggle/toggle.feature: Disabled toggle does not trigger onChange
  Scenario("Disabled toggle does not trigger onChange", ({ Given, When, Then }) => {
    const onChangeMock = vi.fn();

    Given("I render a Toggle with value false and disabled", () => {
      cleanup();
      render(<Toggle value={false} onChange={onChangeMock} disabled />);
      expect(screen.getByRole("switch", { hidden: true }).hasAttribute("disabled")).toBe(true);
    });

    When("the user clicks the toggle", () => {
      cleanup();
      render(<Toggle value={false} onChange={onChangeMock} disabled />);
      fireEvent.click(screen.getByRole("switch", { hidden: true }));
    });

    Then("onChange should not be called", () => {
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/toggle/toggle.feature: Renders with label
  Scenario("Renders with label", ({ When, Then }) => {
    let label: HTMLElement;

    When('I render a Toggle with value false and label "Enable notifications"', () => {
      cleanup();
      render(<Toggle value={false} onChange={vi.fn()} label="Enable notifications" />);
      label = screen.getByText("Enable notifications");
    });

    Then('the label "Enable notifications" should be visible', () => {
      expect(label.textContent).toBe("Enable notifications");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/toggle/toggle.feature: A toggle is operable with the Space key
  Scenario("A toggle is operable with the Space key", ({ Given, When, Then }) => {
    let onChangeMock: ReturnType<typeof vi.fn>;

    Given("I render a Toggle with value false", () => {
      cleanup();
      onChangeMock = vi.fn();
    });

    // The DOM is cleaned between steps, so the toggle is rendered, focused, and pressed in this step.
    When("the user presses Space on the toggle", async () => {
      cleanup();
      render(<Toggle value={false} onChange={onChangeMock} />);
      const user = userEvent.setup();
      screen.getByRole("switch").focus();
      await user.keyboard(" ");
    });

    Then("onChange should be called with true", () => {
      expect(onChangeMock).toHaveBeenCalledWith(true);
    });
  });
});
