import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Alert, AlertTitle, AlertDescription } from "./alert";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/alert/alert.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("Renders default alert with title and description", ({ Given, Then, And }) => {
    Given('the Alert is rendered with title "Warning" and description "Something happened"', () => {
      // precondition noted
    });

    Then('an element with role "alert" should be present', () => {
      cleanup();
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Something happened</AlertDescription>
        </Alert>,
      );
      expect(screen.getByRole("alert")).toBeDefined();
    });

    And('the alert title "Warning" should be present', () => {
      cleanup();
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Something happened</AlertDescription>
        </Alert>,
      );
      expect(screen.getByText("Warning")).toBeDefined();
    });

    And('the alert description "Something happened" should be present', () => {
      cleanup();
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Something happened</AlertDescription>
        </Alert>,
      );
      expect(screen.getByText("Something happened")).toBeDefined();
    });
  });

  Scenario("Renders destructive variant", ({ Given, Then }) => {
    Given('the Alert is rendered with variant "destructive" and content "Error"', () => {
      // precondition noted
    });

    Then('the alert element should contain the class "text-destructive"', () => {
      cleanup();
      render(<Alert variant="destructive">Error</Alert>);
      expect(screen.getByRole("alert").className).toContain("text-destructive");
    });
  });

  Scenario("Has no accessibility violations", ({ Given, Then }) => {
    Given('the Alert is rendered with title "Warning" and description "Something happened"', () => {
      // precondition noted
    });

    Then("the alert should have no accessibility violations", async () => {
      cleanup();
      const { container } = render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Something happened</AlertDescription>
        </Alert>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  Scenario("Renders variant success", ({ Given, Then }) => {
    Given('I render an Alert with variant "success"', () => {
      // precondition noted
    });

    Then('the alert should have data-variant "success"', () => {
      cleanup();
      render(<Alert variant="success">Success content</Alert>);
      expect(screen.getByRole("alert").getAttribute("data-variant")).toBe("success");
    });
  });

  Scenario("Renders variant warning", ({ Given, Then }) => {
    Given('I render an Alert with variant "warning"', () => {
      // precondition noted
    });

    Then('the alert should have data-variant "warning"', () => {
      cleanup();
      render(<Alert variant="warning">Warning content</Alert>);
      expect(screen.getByRole("alert").getAttribute("data-variant")).toBe("warning");
    });
  });

  Scenario("Renders variant info", ({ Given, Then }) => {
    Given('I render an Alert with variant "info"', () => {
      // precondition noted
    });

    Then('the alert should have data-variant "info"', () => {
      cleanup();
      render(<Alert variant="info">Info content</Alert>);
      expect(screen.getByRole("alert").getAttribute("data-variant")).toBe("info");
    });
  });
});
