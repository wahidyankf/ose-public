import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

import { HomeContent } from "@/features/home";
import {
  contrastRatio,
  LANDING_ACCESSIBILITY_COLORS,
  LANDING_FOCUS_RING_WIDTH_PX,
} from "@/features/home/core/accessibility-style";

const feature = await loadFeature(
  path.resolve(
    __dirname,
    "../../../../../../specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature",
  ),
);

describeFeature(feature, ({ Scenario, Background }) => {
  let renderedContainer: HTMLElement;

  Background(({ Given }) => {
    Given("the app is running", () => {
      cleanup();
      expect(HomeContent).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Pages have proper heading hierarchy
  Scenario("Pages have proper heading hierarchy", ({ When, Then, And }) => {
    When("I navigate to any page", () => {
      renderedContainer = render(<HomeContent />).container;
    });

    Then("each page should have exactly one h1 element", () => {
      const h1Elements = screen.getAllByRole("heading", { level: 1 });
      expect(h1Elements).toHaveLength(1);
    });

    And("heading levels should not skip (no h1 followed by h3)", () => {
      const headings = screen.queryAllByRole("heading");
      const levels = headings.map((h) => parseInt(h.tagName.replace("H", ""), 10));
      for (let i = 1; i < levels.length; i++) {
        const prev = levels[i - 1] ?? 0;
        const curr = levels[i] ?? 0;
        if (curr > prev) {
          expect(curr - prev).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Keyboard navigation works throughout the app
  Scenario("Keyboard navigation works throughout the app", ({ When, Then, And }) => {
    When("I navigate to the landing page", () => {
      renderedContainer = render(<HomeContent />).container;
    });

    Then("I should be able to tab to all interactive elements", async () => {
      const expected = [...renderedContainer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      const reached: HTMLElement[] = [];
      const user = userEvent.setup();
      for (let index = 0; index < expected.length; index += 1) {
        await user.tab();
        reached.push(document.activeElement as HTMLElement);
      }
      expect(expected.length).toBeGreaterThan(0);
      expect(reached).toEqual(expected);
    });

    And("focus indicators should be visible", () => {
      expect(document.activeElement).not.toBe(document.body);
      expect((document.activeElement as HTMLElement).matches(":focus")).toBe(true);
      expect(screen.getByTestId("landing-surface")).toHaveClass("ol-focus-surface");
      expect(LANDING_FOCUS_RING_WIDTH_PX).toBeGreaterThanOrEqual(2);
      expect(
        contrastRatio(LANDING_ACCESSIBILITY_COLORS.focusRing, LANDING_ACCESSIBILITY_COLORS.background),
      ).toBeGreaterThanOrEqual(3);
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Color contrast meets WCAG AA requirements
  Scenario("Color contrast meets WCAG AA requirements", ({ When, Then, And }) => {
    When("I navigate to any page", () => {
      renderedContainer = render(<HomeContent />).container;
    });

    Then("all text should meet WCAG AA contrast ratio (4.5:1 for normal text)", () => {
      expect(
        contrastRatio(LANDING_ACCESSIBILITY_COLORS.text, LANDING_ACCESSIBILITY_COLORS.background),
      ).toBeGreaterThanOrEqual(4.5);
    });

    And("all interactive elements should have sufficient contrast", () => {
      expect(
        contrastRatio(LANDING_ACCESSIBILITY_COLORS.interactiveText, LANDING_ACCESSIBILITY_COLORS.interactiveBackground),
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Images have text alternatives
  Scenario("Images have text alternatives", ({ When, Then }) => {
    When("I navigate to any page", () => {
      render(<HomeContent />);
    });

    Then("images should have alt attributes", () => {
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        expect(img.getAttribute("alt")).not.toBeNull();
      });
    });
  });

  // @scenario specs/apps/organiclever/www/behaviours/frontend/accessibility/accessibility.feature: Navigation landmarks are labeled
  Scenario("Navigation landmarks are labeled", ({ When, Then }) => {
    When("I navigate to any page", () => {
      render(<HomeContent />);
    });

    Then("navigation landmarks should be properly labeled", () => {
      expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    });
  });
});
