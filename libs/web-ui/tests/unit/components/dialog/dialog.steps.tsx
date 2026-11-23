import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { expect } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../../../../src/components/dialog/dialog";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/dialog/dialog.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/dialog/dialog.feature: Activating the trigger opens a dialog showing its title
  Scenario("Activating the trigger opens a dialog showing its title", ({ When, And, Then }) => {
    let openedTitle: string | null = null;

    When('the Dialog is rendered with a trigger labeled "Open" and a title "Test Dialog"', () => {
      cleanup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );
    });

    // Each step renders its own tree: the DOM is cleaned between steps, so the activation and its
    // result are captured here in the same step that performs them.
    And('the user activates the trigger labeled "Open"', () => {
      cleanup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Open" }));
      openedTitle =
        screen.getByRole("dialog", { name: "Test Dialog" }).getAttribute("role") === "dialog" ? "Test Dialog" : null;
    });

    Then('the dialog titled "Test Dialog" should be visible', () => {
      expect(openedTitle).toBe("Test Dialog");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/dialog/dialog.feature: Has no accessibility violations
  Scenario("Has no accessibility violations", ({ When, Then }) => {
    let container: HTMLElement;

    When('the Dialog is rendered open with title "Test Dialog"', () => {
      cleanup();
      container = render(
        <Dialog open>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      ).container;
    });

    Then("the dialog should have no accessibility violations", async () => {
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/dialog/dialog.feature: A dialog closes with its close button and with Escape
  ScenarioOutline("A dialog closes with its close button and with Escape", ({ Given, When, Then }, examples) => {
    const action = String(examples["action"] ?? "");

    let stillOpen = true;

    Given('the Dialog is open with title "Test Dialog"', () => {
      cleanup();
    });

    // The DOM is cleaned between steps, so the open dialog, the action, and the result are all
    // produced inside this one step.
    When("the user <action>", () => {
      cleanup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Open" }));
      expect(screen.getByRole("dialog", { name: "Test Dialog" })).toBeDefined();
      if (action === "clicks the close button") {
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
      } else {
        fireEvent.keyDown(document, { key: "Escape" });
      }
      stillOpen = screen.queryByRole("dialog") !== null;
    });

    Then("the dialog should be closed", () => {
      expect(stillOpen).toBe(false);
    });
  });

  // @scenario specs/libs/web-ui/behaviours/dialog/dialog.feature: DialogContent omits the close button when showCloseButton is false
  Scenario("DialogContent omits the close button when showCloseButton is false", ({ When, Then }) => {
    let closeButtonFound = true;

    When("the Dialog content is rendered with showCloseButton false", () => {
      cleanup();
      render(
        <Dialog open>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>,
      );
      closeButtonFound = screen.queryByRole("button", { name: "Close" }) !== null;
    });

    Then("the dialog should have no close button", () => {
      expect(closeButtonFound).toBe(false);
    });
  });
});
