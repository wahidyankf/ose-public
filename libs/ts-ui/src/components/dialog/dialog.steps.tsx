import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./dialog";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/libs/ts-ui/gherkin/dialog/dialog.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("Renders dialog with trigger button", ({ Given, Then, And }) => {
    Given('the Dialog is rendered with a trigger labeled "Open"', () => {
      // precondition noted
    });

    Then('the dialog trigger element with label "Open" should be present', () => {
      cleanup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>,
      );
      expect(screen.getByText("Open")).toBeDefined();
    });

    And('the trigger should have data-slot "dialog-trigger"', () => {
      cleanup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>,
      );
      expect(screen.getByText("Open").getAttribute("data-slot")).toBe("dialog-trigger");
    });
  });

  Scenario("Has no accessibility violations", ({ Given, Then }) => {
    Given('the Dialog is rendered open with title "Test Dialog"', () => {
      // precondition noted
    });

    Then("the dialog should have no accessibility violations", async () => {
      cleanup();
      const { container } = render(
        <Dialog open>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
