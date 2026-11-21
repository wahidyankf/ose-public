import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { expect, vi } from "vitest";
import type { ChangeEvent } from "react";

import { Input } from "../../../../src/components/input/input";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/input/input.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/libs/web-ui/behaviours/input/input.feature: An input is a focusable textbox
  Scenario("An input is a focusable textbox", ({ When, Then }) => {
    let input: HTMLElement;

    When('the Input is rendered with aria-label "test input"', () => {
      cleanup();
      render(<Input aria-label="test input" />);
      input = screen.getByRole("textbox");
    });

    Then("a focusable textbox element should be present", () => {
      expect(input.getAttribute("aria-label")).toBe("test input");
      expect(input.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/input/input.feature: Supports disabled state
  Scenario("Supports disabled state", ({ When, Then }) => {
    let input: HTMLElement;

    When('the Input is rendered as disabled with aria-label "disabled input"', () => {
      cleanup();
      render(<Input aria-label="disabled input" disabled />);
      input = screen.getByRole("textbox");
    });

    Then("the textbox element should have the disabled attribute", () => {
      expect(input.hasAttribute("disabled")).toBe(true);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/input/input.feature: An input is at least 44 pixels tall (touch target)
  Scenario("An input is at least 44 pixels tall (touch target)", ({ When, Then }) => {
    let input: HTMLElement;

    When("I render an Input", () => {
      cleanup();
      render(<Input aria-label="height test" />);
      input = screen.getByRole("textbox");
    });

    Then("the input should be at least 44 pixels tall", () => {
      // Unit proof: jsdom performs no layout, so the 44px minimum is asserted through the `h-11`
      // (2.75rem = 44px) utility. The end-to-end scenario measures the rendered box.
      expect(input.className).toContain("h-11");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/input/input.feature: Has no accessibility violations
  Scenario("Has no accessibility violations", ({ When, Then }) => {
    let container: HTMLElement;

    When('the Input is rendered with a label "Email" associated via htmlFor', () => {
      cleanup();
      container = render(
        <div>
          <label htmlFor="email-input">Email</label>
          <Input id="email-input" type="email" />
        </div>,
      ).container;
    });

    Then("the input should have no accessibility violations", async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/input/input.feature: An input with aria-invalid shows its invalid state
  Scenario("An input with aria-invalid shows its invalid state", ({ When, Then }) => {
    let input: HTMLElement;

    When("I render an Input with aria-invalid set", () => {
      cleanup();
      render(<Input aria-label="invalid test" aria-invalid />);
      input = screen.getByRole("textbox");
    });

    Then("the input should be marked invalid", () => {
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.className).toContain("aria-invalid:border-destructive");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/input/input.feature: Typing in an input reports each change to onChange
  Scenario("Typing in an input reports each change to onChange", ({ Given, When, Then }) => {
    const seen: string[] = [];
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      seen.push(event.target.value);
    });

    Given("I render an Input with an onChange handler", () => {
      cleanup();
      seen.length = 0;
      onChange.mockClear();
    });

    // The DOM is cleaned between steps, so the input is rendered and typed into in the same step.
    When('the user types "ab"', async () => {
      cleanup();
      render(<Input aria-label="typing test" onChange={onChange} />);
      const user = userEvent.setup();
      await user.type(screen.getByRole("textbox"), "ab");
    });

    Then("onChange should be called once per keystroke with the value so far", () => {
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(seen).toEqual(["a", "ab"]);
    });
  });
});
