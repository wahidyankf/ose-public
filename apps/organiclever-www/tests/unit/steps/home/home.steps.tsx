import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { expect } from "vitest";

import { HomeContent } from "@/features/home";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/www/behaviours/frontend/home/home.feature"),
);

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Hero heading visible
  Scenario("Hero heading visible", ({ When, Then, And }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('I see text "Your life,"', () => {
      expect(screen.getByText(/Your life,/i)).toBeDefined();
    });

    And('I see text "tracked."', () => {
      expect(screen.getByText(/tracked\./i)).toBeDefined();
    });

    And('I see text "Analyzed."', () => {
      expect(screen.getByText(/Analyzed\./)).toBeDefined();
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Primary call-to-action button present
  Scenario("Primary call-to-action button present", ({ When, Then }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('I see a button "Open the app"', () => {
      expect(screen.getByRole("button", { name: /Open the app/i })).toBeDefined();
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Footer link present
  Scenario("Footer link present", ({ When, Then }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('I see text "Open app →"', () => {
      expect(screen.getByText(/Open app →/)).toBeDefined();
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: The Open the app button takes the visitor to /app/home
  Scenario("The Open the app button takes the visitor to /app/home", ({ When, And, Then }) => {
    let originalLocation: Location | undefined;
    let stub: { href: string } | undefined;

    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    And('I click the "Open the app" button', () => {
      // jsdom does not implement navigation, so the page's `window.location.href` write is observed
      // through a writable stand-in for the whole `location` object.
      originalLocation = window.location;
      stub = { href: "" };
      Object.defineProperty(window, "location", {
        configurable: true,
        writable: true,
        value: stub as unknown as Location,
      });
      fireEvent.click(screen.getByRole("button", { name: /Open the app/i }));
    });

    Then('the visitor lands on "/app/home"', () => {
      try {
        expect(stub?.href).toBe("/app/home");
      } finally {
        Object.defineProperty(window, "location", { configurable: true, writable: true, value: originalLocation });
      }
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: The hero links to the project on GitHub
  Scenario("The hero links to the project on GitHub", ({ When, Then, And }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('the hero links "Open source" to the project on GitHub', () => {
      expect(screen.getByRole("link", { name: /Open source/i }).getAttribute("href")).toBe(
        "https://github.com/wahidyankf/ose-public",
      );
    });

    And('the hero links "Fork & make it yours" to the project fork on GitHub', () => {
      expect(screen.getByRole("link", { name: /Fork & make it yours/i }).getAttribute("href")).toBe(
        "https://github.com/wahidyankf/ose-public/fork",
      );
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Home page tells the visitor the product is Pre-Alpha
  Scenario("Home page tells the visitor the product is Pre-Alpha", ({ When, Then, And }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('I see text "Pre-Alpha"', () => {
      expect(screen.getAllByText(/Pre-Alpha/i).length).toBeGreaterThan(0);
    });

    And('I see text "Pre-Alpha — expect bugs, rough edges, and breaking changes"', () => {
      expect(screen.getByText(/Pre-Alpha — expect bugs, rough edges, and breaking changes/i)).toBeDefined();
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Home page shows the five event types and the custom event card
  Scenario("Home page shows the five event types and the custom event card", ({ When, Then, And }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('I see text "Workouts"', () => {
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

    And('I see text "Plus your own."', () => {
      expect(screen.getByText(/Plus your own\./i)).toBeDefined();
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: Weekly rhythm demo visible
  Scenario("Weekly rhythm demo visible", ({ When, Then }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('I see text "Last 7 days"', () => {
      expect(screen.getByText("Last 7 days")).toBeDefined();
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/home/home.feature: All six principles visible
  Scenario("All six principles visible", ({ When, Then, And }) => {
    When("I navigate to the marketing home page", () => {
      cleanup();
      render(<HomeContent />);
    });

    Then('I see text "Local-first"', () => {
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
