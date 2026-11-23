import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Label } from "../../../../src/components/label/label";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/label/label.feature"),
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
  // @scenario specs/libs/web-ui/behaviours/label/label.feature: A label shows its text
  Scenario("A label shows its text", ({ When, Then }) => {
    let label: HTMLElement;

    When('the Label is rendered with text "Email"', () => {
      cleanup();
      render(<Label>Email</Label>);
      label = screen.getByText("Email");
    });

    Then('the label element with text "Email" should be present', () => {
      expect(label.textContent).toBe("Email");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/label/label.feature: A label names its form control and focuses it when clicked
  Scenario("A label names its form control and focuses it when clicked", ({ When, Then, And }) => {
    When('the Label is rendered with text "Email" associated to input "email-input"', () => {
      cleanup();
      renderLabelWithInput();
      expect(screen.getByLabelText("Email").getAttribute("id")).toBe("email-input");
    });

    // The DOM is cleaned between steps, so the click is performed in the step that asserts it.
    Then("clicking the label focuses its input and names it", async () => {
      cleanup();
      renderLabelWithInput();
      const user = userEvent.setup();
      await user.click(screen.getByText("Email"));
      expect(document.activeElement).toBe(screen.getByLabelText("Email"));
    });

    And("the label and input association should have no accessibility violations", async () => {
      cleanup();
      const rendered = renderLabelWithInput().container;
      const results = await axe(rendered);
      expect(results).toHaveNoViolations();
    });
  });
});
