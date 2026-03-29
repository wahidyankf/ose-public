import "./helpers/test-setup";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Menu: () => <svg data-testid="menu-icon" />,
  Search: () => <svg data-testid="search-icon" />,
  Moon: () => <svg data-testid="moon-icon" />,
  Sun: () => <svg data-testid="sun-icon" />,
}));

// Mock @open-sharia-enterprise/ts-ui
vi.mock("@open-sharia-enterprise/ts-ui", () => ({
  Button: ({
    children,
    asChild,
    className,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    className?: string;
    [key: string]: unknown;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return children;
    }
    return (
      <button className={className} {...props}>
        {children}
      </button>
    );
  },
}));

// Mock @/components/layout/theme-toggle
vi.mock("@/components/layout/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}));

// Mock @/components/layout/mobile-nav
vi.mock("@/components/layout/mobile-nav", () => ({
  MobileNav: ({ open }: { open: boolean; onOpenChange: (v: boolean) => void }) => (
    <div data-testid="mobile-nav" data-open={String(open)} />
  ),
}));

// Mock @/lib/hooks/use-search
vi.mock("@/lib/hooks/use-search", () => ({
  useSearchOpen: () => ({ open: false, setOpen: vi.fn() }),
  SearchContext: React.createContext({ open: false, setOpen: vi.fn() }),
}));

import { Header } from "@/components/layout/header";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/fe/gherkin/responsive.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  Background(({ Given }) => {
    Given("the app is running", () => {
      // jsdom environment is ready
    });
  });

  Scenario("Mobile viewport shows hamburger navigation", ({ Given, When, Then, And }) => {
    Given("the viewport width is less than 640 pixels", () => {
      // jsdom does not enforce CSS visibility but we test aria/class presence
    });

    When("the header is rendered", () => {
      render(<Header />);
    });

    Then("the hamburger menu button is visible", () => {
      const menuButton = screen.getByRole("button", { name: /Open navigation menu/i });
      expect(menuButton).toBeInTheDocument();
    });

    And("the desktop navigation links are hidden", () => {
      // The desktop nav has class "hidden ... sm:flex" — hidden by default, only shows on sm+
      const nav = screen.getByRole("navigation", { name: /Main navigation/i });
      expect(nav).toBeInTheDocument();
      expect(nav.className).toContain("hidden");
    });
  });

  Scenario("Desktop viewport shows full navigation", ({ Given, When, Then, And }) => {
    Given("the viewport width is greater than 1024 pixels", () => {
      // jsdom does not enforce CSS breakpoints — test class presence
    });

    When("the header is rendered", () => {
      render(<Header />);
    });

    Then("the desktop navigation links are visible", () => {
      // The nav element has "sm:flex" which makes it visible on desktop (CSS controlled)
      const nav = screen.getByRole("navigation", { name: /Main navigation/i });
      expect(nav).toBeInTheDocument();
      expect(nav.className).toContain("sm:flex");
    });

    And("the hamburger menu button is hidden", () => {
      const menuButton = screen.getByRole("button", { name: /Open navigation menu/i });
      // The hamburger button has "sm:hidden" meaning it's hidden on desktop
      expect(menuButton.className).toContain("sm:hidden");
    });
  });
});
