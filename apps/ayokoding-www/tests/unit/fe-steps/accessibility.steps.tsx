import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/learn/overview",
}));
vi.mock("@/features/search/shell/use-search", () => ({
  useSearchOpen: () => ({ setOpen: vi.fn() }),
}));
vi.mock("@/features/app-shell/shell/use-mobile-nav-open", () => ({
  useMobileNavOpen: () => ({ open: false, setOpen: vi.fn() }),
}));
vi.mock("@/features/app-shell/shell/mobile-nav", () => ({ MobileNav: () => null }));
vi.mock("@/features/app-shell/shell/theme-toggle", () => ({ ThemeToggle: () => null }));
vi.mock("@/features/i18n/shell/language-switcher", () => ({ LanguageSwitcher: () => null }));

import "./helpers/test-setup";
import { PrevNext } from "@/features/navigation/shell/prev-next";
import { SkipLink } from "@/features/app-shell/shell/skip-link";
import { Header } from "@/features/app-shell/shell/header";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(cleanup);

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(Header).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Keyboard navigation moves through all interactive elements
  Scenario("Keyboard navigation moves through all interactive elements", ({ When, Then, And }) => {
    When("a visitor opens a content page", () => {
      render(
        <PrevNext locale="en" prev={{ title: "Previous", slug: "prev" }} next={{ title: "Next", slug: "next" }} />,
      );
    });

    const focusedLabels: string[] = [];

    And("the visitor presses Tab repeatedly", async () => {
      const user = userEvent.setup();
      await user.tab();
      focusedLabels.push(document.activeElement?.textContent?.trim() ?? "");
      await user.tab();
      focusedLabels.push(document.activeElement?.textContent?.trim() ?? "");
    });

    Then("focus should move through all interactive elements in a logical order", () => {
      expect(focusedLabels[0]).toContain("Previous");
      expect(focusedLabels[1]).toContain("Next");
    });

    And("no interactive element should be skipped or unreachable by keyboard", () => {
      const links = screen.getAllByRole("link");
      expect(links.every((link) => link.getAttribute("tabindex") !== "-1")).toBe(true);
      expect(focusedLabels).toHaveLength(links.length);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Buttons and interactive elements have ARIA labels
  Scenario("Buttons and interactive elements have ARIA labels", ({ When, Then, And }) => {
    When(
      "a visitor opens a content page with interactive controls such as the hamburger menu and search button",
      () => {
        render(<Header locale="en" />);
      },
    );

    Then("each button should have an accessible name via an aria-label or visible label", () => {
      expect(screen.getByRole("button", { name: "Open navigation menu" })).toBeTruthy();
      expect(screen.getAllByRole("button", { name: "Search" })).toHaveLength(2);
      for (const button of screen.getAllByRole("button")) {
        expect(button.getAttribute("aria-label") || button.textContent?.trim()).toBeTruthy();
      }
    });

    And("each interactive element should be identifiable by assistive technologies", () => {
      expect(screen.getByRole("link", { name: "AyoKoding" })).toHaveAttribute("href", "/en");
      for (const interactive of [...screen.getAllByRole("button"), ...screen.getAllByRole("link")]) {
        expect(interactive.getAttribute("aria-label") || interactive.textContent?.trim()).toBeTruthy();
      }
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Skip to content link is present
  Scenario("Skip to content link is present", ({ When, Then, And }) => {
    When("a visitor opens any page on the site", () => {
      render(
        <>
          <SkipLink locale="en" />
          <main id="main-content" tabIndex={-1}>
            Article
          </main>
        </>,
      );
    });

    Then("a skip to content link should be present in the page", () => {
      expect(screen.getByRole("link", { name: "Skip to content" }).getAttribute("href")).toBe("#main-content");
    });

    And("the link should become visible when it receives keyboard focus", () => {
      const link = screen.getByRole("link", { name: "Skip to content" });
      expect(link.className).toContain("sr-only");
      expect(link.className).toContain("focus:not-sr-only");
    });

    And("activating the link should move focus to the main content area", () => {
      fireEvent.click(screen.getByRole("link", { name: "Skip to content" }));
      expect(document.activeElement).toBe(document.getElementById("main-content"));
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Text color contrast meets WCAG AA standard
  Scenario("Text color contrast meets WCAG AA standard", ({ When, Then, And }) => {
    When("a visitor opens any page on the site", () => {
      render(
        <PrevNext locale="en" prev={{ title: "Previous", slug: "prev" }} next={{ title: "Next", slug: "next" }} />,
      );
    });

    Then("all body text should meet a minimum contrast ratio of 4.5:1 against its background", () => {
      const nav = screen.getByRole("navigation", { name: "Page navigation" });
      expect(nav.querySelectorAll(".text-muted-foreground")).toHaveLength(2);
      expect(nav.querySelectorAll(".text-foreground")).toHaveLength(2);
    });

    And("large text and headings should meet a minimum contrast ratio of 3:1 against their background", () => {
      const titles = screen.getAllByText(/Previous|Next/).filter((node) => node.className.includes("font-medium"));
      expect(titles.every((title) => title.className.includes("text-foreground"))).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/app-shell/accessibility.feature: Focus indicators are visible on interactive elements
  Scenario("Focus indicators are visible on interactive elements", ({ When, Then, And }) => {
    When("a visitor navigates to an interactive element using the keyboard", () => {
      render(<SkipLink locale="en" />);
    });

    Then("a visible focus indicator should be displayed on that element", () => {
      const link = screen.getByRole("link", { name: "Skip to content" });
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(link.className).toContain("focus:not-sr-only");
    });

    And("the focus indicator should have sufficient contrast against the surrounding background", () => {
      const link = screen.getByRole("link", { name: "Skip to content" });
      expect(link.className).toContain("focus:bg-primary");
      expect(link.className).toContain("focus:text-primary-foreground");
      expect(link.className).toContain("focus:outline-black");
      expect(link.className).toContain("dark:focus:outline-white");
    });
  });
});
