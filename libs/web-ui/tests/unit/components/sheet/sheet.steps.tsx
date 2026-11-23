import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";

import { Sheet } from "../../../../src/components/sheet/sheet";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/sheet/sheet.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/sheet/sheet.feature: Title renders
  Scenario("Title renders", ({ When, Then }) => {
    let title: HTMLElement;

    When('I render a Sheet with title "Settings"', () => {
      cleanup();
      render(<Sheet title="Settings" onClose={vi.fn()} />);
      title = screen.getByText("Settings");
    });

    Then('the heading "Settings" should be visible', () => {
      expect(title.textContent).toBe("Settings");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/sheet/sheet.feature: Close button closes sheet
  Scenario("Close button closes sheet", ({ Given, When, Then }) => {
    const onCloseMock = vi.fn();

    Given('I render a Sheet with title "Settings" and an onClose handler', () => {
      cleanup();
      render(<Sheet title="Settings" onClose={onCloseMock} />);
      expect(screen.getByRole("button", { name: /close/i })).toBeDefined();
    });

    When("the user clicks the close button", () => {
      cleanup();
      render(<Sheet title="Settings" onClose={onCloseMock} />);
      fireEvent.click(screen.getByRole("button", { name: /close/i }));
    });

    Then("onClose should be called", () => {
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/sheet/sheet.feature: Has accessible title
  Scenario("Has accessible title", ({ When, Then }) => {
    let dialog: HTMLElement;

    When('I render a Sheet with title "My Sheet"', () => {
      cleanup();
      render(<Sheet title="My Sheet" onClose={vi.fn()} />);
      dialog = screen.getByRole("dialog", { name: "My Sheet" });
    });

    Then('the dialog should have accessible label "My Sheet"', () => {
      expect(dialog.getAttribute("aria-labelledby")).not.toBeNull();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/sheet/sheet.feature: Pressing Escape or clicking the overlay closes the sheet
  ScenarioOutline("Pressing Escape or clicking the overlay closes the sheet", ({ Given, When, Then }, examples) => {
    const action = String(examples["action"] ?? "");
    const onCloseMock = vi.fn();

    Given('I render a Sheet with title "Settings" and an onClose handler', () => {
      cleanup();
      onCloseMock.mockClear();
    });

    // The DOM is cleaned between steps, so the open sheet and the action are produced in this step.
    When("the user <action>", () => {
      cleanup();
      render(<Sheet title="Settings" onClose={onCloseMock} />);
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeDefined();
      if (action === "presses Escape") {
        fireEvent.keyDown(document, { key: "Escape" });
      } else {
        const overlay = document.querySelector(".fixed.inset-0");
        expect(overlay).not.toBeNull();
        fireEvent.click(overlay as Element);
      }
    });

    Then("onClose should be called", () => {
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
