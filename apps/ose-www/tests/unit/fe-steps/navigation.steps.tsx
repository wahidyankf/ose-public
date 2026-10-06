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

// Mock @open-sharia-enterprise/web-ui
vi.mock("@open-sharia-enterprise/web-ui", () => ({
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

// Mock @/features/app-shell/shell/theme-toggle
vi.mock("@/features/app-shell/shell/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}));

// Mock @/features/app-shell/shell/mobile-nav
vi.mock("@/features/app-shell/shell/mobile-nav", () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}));

// Mock @/lib/hooks/use-search
vi.mock("@/features/search/shell/use-search", () => ({
  useSearchOpen: () => ({ open: false, setOpen: vi.fn() }),
  SearchContext: React.createContext({ open: false, setOpen: vi.fn() }),
}));

import { Footer } from "@/features/app-shell/shell/footer";
import { Header } from "@/features/app-shell/shell/header";
import { Breadcrumb } from "@/features/content/shell/breadcrumb";
import { PrevNext } from "@/features/content/shell/prev-next";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(Header).toBeTypeOf("function");
    });
  });

  Scenario("Header contains navigation links", ({ When, Then, And }) => {
    When("the header component is rendered", () => {
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

  Scenario("Breadcrumb shows ancestor hierarchy without current page", ({ When, Then, And }) => {
    When("the about page is rendered with breadcrumbs", () => {
      render(<Breadcrumb segments={[{ label: "About", href: "/about/" }]} />);
    });

    Then('the breadcrumb shows "Home" linking to "/"', () => {
      const homeLink = screen.getByRole("link", { name: /Home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");
    });

    And("the current page should not appear in the breadcrumb", () => {
      // "About" is the current page and should not appear in the breadcrumb
      expect(screen.queryByText("About")).not.toBeInTheDocument();
    });

    And("all breadcrumb segments should be clickable links", () => {
      const nav = screen.getByLabelText("Breadcrumb");
      const links = nav.querySelectorAll("a");
      expect(links.length).toBeGreaterThanOrEqual(1);
      // No non-link spans should exist
      const spans = nav.querySelectorAll("span:not(:has(*))");
      expect(spans.length).toBe(0);
    });

    And("breadcrumb text should wrap naturally without horizontal truncation", () => {
      const nav = screen.getByLabelText("Breadcrumb");
      const ol = nav.querySelector("ol");
      expect(ol?.className).toContain("flex-wrap");
      const allLinks = nav.querySelectorAll("a");
      for (const link of allLinks) {
        expect(link.className).not.toContain("truncate");
      }
    });
  });

  Scenario("Previous and next navigation between updates", ({ When, Then, And }) => {
    When("an update detail page is rendered with adjacent updates", () => {
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

  Scenario("Footer links to AyoKoding on its canonical host", ({ When, Then }) => {
    When("the footer component is rendered", () => {
      render(<Footer />);
    });

    Then('the footer contains an external link to "AyoKoding" on the canonical host "www.ayokoding.com"', () => {
      const link = screen.getByRole("link", { name: "AyoKoding" });
      expect(new URL(link.getAttribute("href") ?? "").host).toBe("www.ayokoding.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });
  });
});
