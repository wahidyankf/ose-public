import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";

import { AppHeader } from "../../../../src/components/app-header/app-header";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/libs/web-ui/behaviours/app-header/app-header.feature"),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/libs/web-ui/behaviours/app-header/app-header.feature: Renders title
  Scenario("Renders title", ({ When, Then }) => {
    let header: HTMLElement;

    When('I render an AppHeader with title "Workouts"', () => {
      cleanup();
      render(<AppHeader title="Workouts" />);
      header = screen.getByText("Workouts");
    });

    Then('the heading "Workouts" should be visible', () => {
      expect(header.textContent).toBe("Workouts");
    });
  });

  // @scenario specs/libs/web-ui/behaviours/app-header/app-header.feature: The back button is shown only when onBack is provided
  ScenarioOutline("The back button is shown only when onBack is provided", ({ When, Then }, examples) => {
    const setup = String(examples["setup"] ?? "");
    let backButton: HTMLElement | null = null;

    When('I render an AppHeader with title "Details" <setup>', () => {
      cleanup();
      const withHandler = setup === "and an onBack handler";
      render(withHandler ? <AppHeader title="Details" onBack={vi.fn()} /> : <AppHeader title="Details" />);
      backButton = screen.queryByRole("button", { name: /go back/i });
    });

    Then("the back button should be <presence>", () => {
      if (examples["presence"] === "shown") {
        expect(backButton?.getAttribute("aria-label")).toBe("Go back");
      } else {
        expect(backButton).toBeNull();
      }
    });
  });

  // @scenario specs/libs/web-ui/behaviours/app-header/app-header.feature: Back button click triggers onBack
  Scenario("Back button click triggers onBack", ({ Given, When, Then }) => {
    const onBackMock = vi.fn();

    Given('I render an AppHeader with title "Details" and an onBack handler', () => {
      cleanup();
      render(<AppHeader title="Details" onBack={onBackMock} />);
      expect(screen.getByRole("button", { name: /go back/i })).toBeDefined();
    });

    When("the user clicks the back button", () => {
      cleanup();
      render(<AppHeader title="Details" onBack={onBackMock} />);
      fireEvent.click(screen.getByRole("button", { name: /go back/i }));
    });

    Then("onBack should be called", () => {
      expect(onBackMock).toHaveBeenCalled();
    });
  });

  // @scenario specs/libs/web-ui/behaviours/app-header/app-header.feature: Renders subtitle when provided
  Scenario("Renders subtitle when provided", ({ When, Then }) => {
    let subtitle: HTMLElement;

    When('I render an AppHeader with title "Workouts" and subtitle "Today"', () => {
      cleanup();
      render(<AppHeader title="Workouts" subtitle="Today" />);
      subtitle = screen.getByText("Today");
    });

    Then('the text "Today" should be visible', () => {
      expect(subtitle.textContent).toBe("Today");
    });
  });
});
