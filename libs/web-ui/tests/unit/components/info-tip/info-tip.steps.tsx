import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { expect } from "vitest";

import { InfoTip } from "../../../../src/components/info-tip/info-tip";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/info-tip/info-tip.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/libs/web-ui/behaviours/info-tip/info-tip.feature: Trigger button renders
  Scenario("Trigger button renders", ({ When, Then }) => {
    let trigger: HTMLElement;

    When('I render an InfoTip with title "Volume" and text "Adjust the volume"', () => {
      cleanup();
      render(<InfoTip title="Volume" text="Adjust the volume" />);
      trigger = screen.getByRole("button", { name: "Volume" });
    });

    Then('the trigger button with aria-label "Volume" should be visible', () => {
      expect(trigger.getAttribute("aria-label")).toBe("Volume");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/info-tip/info-tip.feature: Click trigger opens Sheet
  Scenario("Click trigger opens Sheet", ({ Given, When, Then }) => {
    let sheetDescription: HTMLElement;

    Given('I render an InfoTip with title "Volume" and text "Adjust the volume"', () => {
      cleanup();
      render(<InfoTip title="Volume" text="Adjust the volume" />);
      expect(screen.getByRole("button", { name: "Volume" })).toBeDefined();
    });

    When("the user clicks the trigger button", () => {
      cleanup();
      render(<InfoTip title="Volume" text="Adjust the volume" />);
      fireEvent.click(screen.getByRole("button", { name: "Volume" }));
      sheetDescription = screen.getByText("Adjust the volume");
    });

    Then('the Sheet with title "Volume" should be visible', () => {
      expect(sheetDescription.textContent).toBe("Adjust the volume");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/info-tip/info-tip.feature: Sheet close button closes Sheet
  Scenario("Sheet close button closes Sheet", ({ Given, When, Then, And }) => {
    let sheetClosed = false;

    Given('I render an InfoTip with title "Volume" and text "Adjust the volume"', () => {
      cleanup();
      render(<InfoTip title="Volume" text="Adjust the volume" />);
      expect(screen.getByRole("button", { name: "Volume" })).toBeDefined();
    });

    When("the user clicks the trigger button", () => {
      cleanup();
      render(<InfoTip title="Volume" text="Adjust the volume" />);
      fireEvent.click(screen.getByRole("button", { name: "Volume" }));
      expect(screen.getByText("Adjust the volume")).toBeDefined();
    });

    And("the user clicks the close button", () => {
      cleanup();
      render(<InfoTip title="Volume" text="Adjust the volume" />);
      fireEvent.click(screen.getByRole("button", { name: "Volume" }));
      fireEvent.click(screen.getByRole("button", { name: /got it/i }));
      sheetClosed = screen.queryByText("Adjust the volume") === null;
    });

    Then("the Sheet should not be visible", () => {
      expect(sheetClosed).toBe(true);
    });
  });
});
