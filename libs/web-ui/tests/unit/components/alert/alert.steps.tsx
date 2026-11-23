import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Alert, AlertTitle, AlertDescription } from "../../../../src/components/alert/alert";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/alert/alert.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/alert/alert.feature: Renders default alert with title and description
  Scenario("Renders default alert with title and description", ({ When, Then, And }) => {
    let alert: HTMLElement;

    When('the Alert is rendered with title "Warning" and description "Something happened"', () => {
      cleanup();
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Something happened</AlertDescription>
        </Alert>,
      );
      alert = screen.getByRole("alert");
    });

    Then('an element with role "alert" should be present', () => {
      expect(alert).toBeDefined();
    });

    And('the alert title "Warning" should be present', () => {
      expect(alert.textContent).toContain("Warning");
    });

    And('the alert description "Something happened" should be present', () => {
      expect(alert.textContent).toContain("Something happened");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/alert/alert.feature: A destructive alert shows its content in the destructive colour
  Scenario("A destructive alert shows its content in the destructive colour", ({ When, Then }) => {
    let alert: HTMLElement;

    When('the Alert is rendered with variant "destructive" and content "Error"', () => {
      cleanup();
      render(<Alert variant="destructive">Error</Alert>);
      alert = screen.getByRole("alert");
    });

    // Unit proof: jsdom loads no Tailwind stylesheet, so the unit level checks the destructive token
    // class the component applies. The computed colour is proven end to end in a real browser.
    Then("the alert text should be drawn in the destructive colour", () => {
      expect(alert.className).toContain("text-destructive");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/alert/alert.feature: Has no accessibility violations
  Scenario("Has no accessibility violations", ({ When, Then }) => {
    let container: HTMLElement;

    When('the Alert is rendered with title "Warning" and description "Something happened"', () => {
      cleanup();
      container = render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Something happened</AlertDescription>
        </Alert>,
      ).container;
    });

    Then("the alert should have no accessibility violations", async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/alert/alert.feature: Each alert variant is marked with its name
  ScenarioOutline("Each alert variant is marked with its name", ({ When, Then }, examples) => {
    let alert: HTMLElement;
    const variant = String(examples["variant"] ?? "");

    When('I render an Alert with variant "<variant>"', () => {
      cleanup();
      render(<Alert variant={variant as "success" | "warning" | "info" | "destructive"}>{variant} content</Alert>);
      alert = screen.getByRole("alert");
    });

    Then('the alert should have data-variant "<variant>"', () => {
      expect(alert.getAttribute("data-variant")).toBe(variant);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/alert/alert.feature: AlertTitle and AlertDescription are announced with the alert
  Scenario("AlertTitle and AlertDescription are announced with the alert", ({ When, Then }) => {
    let alert: HTMLElement;

    When('the Alert is rendered with title "Warning" and description "Something happened"', () => {
      cleanup();
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Something happened</AlertDescription>
        </Alert>,
      );
      alert = screen.getByRole("alert");
    });

    Then("the alert should announce its title and description", () => {
      expect(alert.getAttribute("role")).toBe("alert");
      expect(alert.textContent).toContain("Warning");
      expect(alert.textContent).toContain("Something happened");
    });
  });
});
