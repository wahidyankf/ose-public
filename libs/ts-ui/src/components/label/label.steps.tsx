import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Label } from "./label";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/label/label.feature"),
);

function renderLabelWithInput() {
  return render(
    <div>
      <Label htmlFor="email-input">Email</Label>
      <input id="email-input" type="email" />
    </div>,
  );
}

describeFeature(feature, ({ Scenario }) => {
  Scenario("Renders with text content", ({ Given, Then, And }) => {
    Given('the Label is rendered with text "Email"', () => {
      // precondition noted
    });

    Then('the label element with text "Email" should be present', () => {
      cleanup();
      render(<Label>Email</Label>);
      expect(screen.getByText("Email")).toBeDefined();
    });

    And('the label should have data-slot "label"', () => {
      cleanup();
      render(<Label>Email</Label>);
      expect(screen.getByText("Email").getAttribute("data-slot")).toBe("label");
    });
  });

  Scenario("Associates with form control via htmlFor", ({ Given, Then }) => {
    Given('the Label is rendered with text "Email" associated to input "email-input"', () => {
      // precondition noted
    });

    Then("the label and input association should have no accessibility violations", async () => {
      cleanup();
      const { container } = renderLabelWithInput();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  Scenario("Has no accessibility violations", ({ Given, Then }) => {
    Given('the Label is rendered with text "Email" associated to input "email-input"', () => {
      // precondition noted
    });

    Then("the label and input association should have no accessibility violations", async () => {
      cleanup();
      const { container } = renderLabelWithInput();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
