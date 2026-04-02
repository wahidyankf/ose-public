import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Input } from "./input";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/input/input.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("Renders with default props", ({ Given, Then, And }) => {
    Given('the Input is rendered with aria-label "test input"', () => {
      // precondition noted
    });

    Then("a textbox element should be present", () => {
      cleanup();
      render(<Input aria-label="test input" />);
      expect(screen.getByRole("textbox")).toBeDefined();
    });

    And('the input should have data-slot "input"', () => {
      cleanup();
      render(<Input aria-label="test input" />);
      expect(screen.getByRole("textbox").getAttribute("data-slot")).toBe("input");
    });
  });

  Scenario("Supports disabled state", ({ Given, Then }) => {
    Given('the Input is rendered as disabled with aria-label "disabled input"', () => {
      // precondition noted
    });

    Then("the textbox element should have the disabled attribute", () => {
      cleanup();
      render(<Input aria-label="disabled input" disabled />);
      expect(screen.getByRole("textbox").hasAttribute("disabled")).toBe(true);
    });
  });

  Scenario("Has no accessibility violations", ({ Given, Then }) => {
    Given('the Input is rendered with a label "Email" associated via htmlFor', () => {
      // precondition noted
    });

    Then("the input should have no accessibility violations", async () => {
      cleanup();
      const { container } = render(
        <div>
          <label htmlFor="email-input">Email</label>
          <Input id="email-input" type="email" />
        </div>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
