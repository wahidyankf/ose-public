import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { expect } from "vitest";

import { LandingPage } from "@/components/landing/landing-page";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/landing/landing.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  Background(({ Given }) => {
    Given('I navigate to "/"', () => {});
  });

  Scenario("Hero heading visible", ({ Then, And }) => {
    Then('I see text "Your life,"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByText(/Your life,/i)).toBeDefined();
    });

    And('I see text "tracked."', () => {
      expect(screen.getByText(/tracked\./i)).toBeDefined();
    });

    And('I see text "Analyzed."', () => {
      expect(screen.getByText(/Analyzed\./)).toBeDefined();
    });
  });

  Scenario("CTA button present and functional", ({ Given, When, Then }) => {
    Given('I see a button "Open the app"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByRole("button", { name: /Open the app/i })).toBeDefined();
    });

    When('I click "Open the app"', () => {
      fireEvent.click(screen.getByRole("button", { name: /Open the app/i }));
    });

    Then('the URL hash contains "/app"', () => {
      expect(window.location.hash).toContain("/app");
    });
  });

  Scenario("Footer link navigates to app", ({ Given, When, Then }) => {
    Given('I see text "Open app →"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByText(/Open app →/)).toBeDefined();
    });

    When('I click "Open app →"', () => {
      fireEvent.click(screen.getByText(/Open app →/));
    });

    Then('the URL hash contains "/app"', () => {
      expect(window.location.hash).toContain("/app");
    });
  });

  Scenario("Pre-Alpha badge visible in nav", ({ Then }) => {
    Then('I see text "Pre-Alpha"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getAllByText(/Pre-Alpha/i).length).toBeGreaterThan(0);
    });
  });

  Scenario("Alpha warning banner visible", ({ Then }) => {
    Then('I see text "Pre-Alpha — expect breaking changes"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByText(/Pre-Alpha — expect breaking changes/i)).toBeDefined();
    });
  });

  Scenario("All five event type cards visible", ({ Then, And }) => {
    Then('I see text "Workouts"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByText("Workouts")).toBeDefined();
    });

    And('I see text "Reading"', () => {
      expect(screen.getAllByText("Reading").length).toBeGreaterThan(0);
    });

    And('I see text "Learning"', () => {
      expect(screen.getAllByText("Learning").length).toBeGreaterThan(0);
    });

    And('I see text "Meals"', () => {
      expect(screen.getByText("Meals")).toBeDefined();
    });

    And('I see text "Focus"', () => {
      expect(screen.getAllByText("Focus").length).toBeGreaterThan(0);
    });
  });

  Scenario("Custom event card visible", ({ Then }) => {
    Then('I see text "Plus your own."', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByText(/Plus your own\./i)).toBeDefined();
    });
  });

  Scenario("Weekly rhythm demo visible", ({ Then }) => {
    Then('I see text "Last 7 days"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByText("Last 7 days")).toBeDefined();
    });
  });

  Scenario("All six principles visible", ({ Then, And }) => {
    Then('I see text "Local-first"', () => {
      cleanup();
      render(<LandingPage />);
      expect(screen.getByText("Local-first")).toBeDefined();
    });

    And('I see text "Yours to take"', () => {
      expect(screen.getByText("Yours to take")).toBeDefined();
    });

    And('I see text "Flexible"', () => {
      expect(screen.getByText("Flexible")).toBeDefined();
    });

    And('I see text "Quiet"', () => {
      expect(screen.getByText("Quiet")).toBeDefined();
    });

    And('I see text "Open"', () => {
      expect(screen.getByText("Open")).toBeDefined();
    });

    And('I see text "Multilingual"', () => {
      expect(screen.getByText("Multilingual")).toBeDefined();
    });
  });
});
