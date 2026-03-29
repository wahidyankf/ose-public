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
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  ChevronLeft: () => <svg data-testid="chevron-left-icon" />,
}));

// Mock @open-sharia-enterprise/ts-ui
vi.mock("@open-sharia-enterprise/ts-ui", () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: unknown;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return children;
    }
    return <button {...props}>{children}</button>;
  },
}));

// Mock @/components/layout/theme-toggle
vi.mock("@/components/layout/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}));

// Mock @/components/layout/mobile-nav
vi.mock("@/components/layout/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}));

// Mock @/lib/hooks/use-search
vi.mock("@/lib/hooks/use-search", () => ({
  useSearchOpen: () => ({ open: false, setOpen: vi.fn() }),
  SearchContext: React.createContext({ open: false, setOpen: vi.fn() }),
}));

import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { PrevNext } from "@/components/layout/prev-next";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/fe/gherkin/navigation.feature"),
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

  Scenario("Header contains navigation links", ({ Given, Then, And }) => {
    Given("the header component is rendered", () => {
      render(<Header />);
    });

    Then('the header contains a link to "Updates" at "/updates/"', () => {
      const link = screen.getByRole("link", { name: /Updates/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/updates/");
    });

    And('the header contains a link to "About" at "/about/"', () => {
      const link = screen.getByRole("link", { name: /About/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/about/");
    });

    And('the header contains an external link to "Documentation"', () => {
      const link = screen.getByRole("link", { name: /Documentation/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("target", "_blank");
    });

    And('the header contains an external link to "GitHub"', () => {
      const link = screen.getByRole("link", { name: /GitHub/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("target", "_blank");
    });
  });

  Scenario("Breadcrumb navigation shows current location", ({ Given, Then, And }) => {
    Given("the about page is rendered with breadcrumbs", () => {
      render(<Breadcrumb segments={[{ label: "About", href: "/about/" }]} />);
    });

    Then('the breadcrumb shows "Home" linking to "/"', () => {
      const homeLink = screen.getByRole("link", { name: /Home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");
    });

    And('the breadcrumb shows "About" as the current page', () => {
      // "About" as current page renders as a <span> (not a link), with class "truncate font-medium"
      const currentPage = screen.getByText("About", { selector: "span" });
      expect(currentPage).toBeInTheDocument();
    });
  });

  Scenario("Previous and next navigation between updates", ({ Given, Then, And }) => {
    Given("an update detail page is rendered with adjacent updates", () => {
      render(
        <PrevNext
          prev={{ title: "Previous Update Title", slug: "updates/previous-update" }}
          next={{ title: "Next Update Title", slug: "updates/next-update" }}
        />,
      );
    });

    Then('a "Previous" link is displayed with the previous update title', () => {
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Previous Update Title")).toBeInTheDocument();
    });

    And('a "Next" link is displayed with the next update title', () => {
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText("Next Update Title")).toBeInTheDocument();
    });
  });
});
