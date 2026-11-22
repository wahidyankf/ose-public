import "./helpers/test-setup";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { axe } from "vitest-axe";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Menu: () => <svg data-testid="menu-icon" />,
  Search: () => <svg data-testid="search-icon" />,
  Moon: () => <svg data-testid="moon-icon" />,
  Sun: () => <svg data-testid="sun-icon" />,
}));

// Mock theme-toggle and mobile-nav
vi.mock("@/features/app-shell/shell/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}));
vi.mock("@/features/app-shell/shell/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}));

// Mock search context
vi.mock("@/features/search/shell/use-search", () => ({
  useSearchOpen: () => ({ open: false, setOpen: vi.fn<(open: boolean) => void>() }),
  SearchContext: React.createContext({ open: false, setOpen: vi.fn<(open: boolean) => void>() }),
}));

import { Header } from "@/features/app-shell/shell/header";
import { Hero } from "@/features/landing/shell/hero";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  let renderedContainer: HTMLElement;
  let expectedFocusOrder: Element[] = [];
  let reachedFocusOrder: Element[] = [];
  AfterEachScenario(() => {
    cleanup();
  });

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(Header).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Home page has no accessibility violations
  Scenario("Home page has no accessibility violations", ({ When, Then }) => {
    When("a visitor opens the home page", () => {
      renderedContainer = render(
        <>
          <Header />
          <main>
            <Hero />
          </main>
        </>,
      ).container;
    });

    Then("the page should have no accessibility violations", async () => {
      const results = await axe(renderedContainer);
      expect(results.violations).toEqual([]);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Headings follow a proper hierarchy
  Scenario("Headings follow a proper hierarchy", ({ When, Then }) => {
    When("a visitor opens the home page", () => {
      render(<Hero />);
    });

    Then("headings should follow a proper hierarchy starting with a single h1", () => {
      const h1s = document.querySelectorAll("h1");
      expect(h1s.length).toBe(1);
      const levels = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((heading) =>
        Number(heading.tagName.slice(1)),
      );
      for (let index = 1; index < levels.length; index += 1) {
        expect(levels[index]!).toBeLessThanOrEqual(levels[index - 1]! + 1);
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: All interactive elements are keyboard accessible
  Scenario("All interactive elements are keyboard accessible", ({ When, And, Then }) => {
    When("a visitor opens the home page", () => {
      render(<Header />);
    });

    And("the visitor presses Tab repeatedly", async () => {
      const user = userEvent.setup();
      expectedFocusOrder = [...document.querySelectorAll("a[href], button, input, select, textarea")];
      reachedFocusOrder = [];
      for (let index = 0; index < expectedFocusOrder.length; index += 1) {
        await user.tab();
        reachedFocusOrder.push(document.activeElement!);
      }
    });

    Then("focus should move through all interactive elements in logical order", () => {
      expect(reachedFocusOrder).toEqual(expectedFocusOrder);
    });

    And("no interactive element should be skipped or unreachable by keyboard", () => {
      expect(new Set(reachedFocusOrder).size).toBe(expectedFocusOrder.length);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Text color contrast meets WCAG AA standard
  Scenario("Text color contrast meets WCAG AA standard", ({ When, Then, And }) => {
    When("a visitor opens any page on the site", () => {
      renderedContainer = render(<Hero />).container;
    });

    Then("all body text should meet a minimum contrast ratio of 4.5:1 against its background", async () => {
      const results = await axe(renderedContainer, { rules: { "color-contrast": { enabled: true } } });
      expect(results.violations.filter(({ id }) => id === "color-contrast")).toEqual([]);
    });

    And("large text and headings should meet a minimum contrast ratio of 3:1 against their background", async () => {
      const results = await axe(renderedContainer, { rules: { "color-contrast": { enabled: true } } });
      expect(results.violations.filter(({ id }) => id === "color-contrast")).toEqual([]);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/accessibility.feature: Focus indicators are visible on interactive elements
  Scenario("Focus indicators are visible on interactive elements", ({ When, Then, And }) => {
    When("a visitor navigates to an interactive element using the keyboard", async () => {
      render(<Header />);
      await userEvent.setup().tab();
      expect(document.activeElement).not.toBe(document.body);
    });

    Then("a visible focus indicator should be displayed on that element", () => {
      // Focus indicator visibility is CSS-dependent — validated via E2E.
      // Unit-level: verify interactive elements exist and are not explicitly hiding focus.
      const buttons = document.querySelectorAll("button, a");
      expect(buttons.length).toBeGreaterThan(0);
      for (const btn of buttons) {
        expect(btn).not.toHaveStyle({ outline: "none" });
      }
    });

    And("the focus indicator should have sufficient contrast against the surrounding background", () => {
      // The browser suite measures the rendered contrast. At Unit level,
      // prove that the app composes the real shared Button implementation
      // and therefore applies the contrast-bearing ring token instead of
      // silently replacing or suppressing its focus style.
      const navigationButton = screen.getByRole("button", { name: "Open navigation menu" });
      expect(navigationButton).toHaveClass("focus-visible:ring-[3px]");
      expect(navigationButton).toHaveClass("focus-visible:ring-ring/50");
    });
  });
});
