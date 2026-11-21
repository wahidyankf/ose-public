import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import React from "react";

// The search dialog's results come from the tRPC client; the scenario sets the rows it returns.
const searchState = vi.hoisted(() => ({ results: [] as { title: string; slug: string; excerpt: string }[] }));
const routerPush = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    search: {
      query: {
        query: async () => searchState.results,
      },
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

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
  XIcon: () => <svg data-testid="close-icon" />,
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
  // Minimal stand-ins for the command palette; the scenarios test the search dialog's own behaviour.
  CommandDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  CommandInput: ({
    placeholder,
    value,
    onValueChange,
  }: {
    placeholder?: string;
    value: string;
    onValueChange: (value: string) => void;
  }) => <input placeholder={placeholder} value={value} onChange={(event) => onValueChange(event.target.value)} />,
  CommandList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CommandItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <button role="option" onClick={onSelect}>
      {children}
    </button>
  ),
}));

// Mock @/features/app-shell/shell/theme-toggle
vi.mock("@/features/app-shell/shell/theme-toggle", () => ({
  ThemeToggle: () => <button aria-label="Toggle theme">Theme</button>,
}));

import { Footer } from "@/features/app-shell/shell/footer";
import { Header } from "@/features/app-shell/shell/header";
import { Breadcrumb } from "@/features/content/shell/breadcrumb";
import { PrevNext } from "@/features/content/shell/prev-next";
import { SearchProvider } from "@/features/search/shell/search-provider";

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

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Header contains navigation links
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

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Breadcrumb lists the ancestors without the current page
  Scenario("Breadcrumb lists the ancestors without the current page", ({ When, Then, And }) => {
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
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Breadcrumb text wraps without horizontal truncation
  Scenario("Breadcrumb text wraps without horizontal truncation", ({ When, Then }) => {
    When("the about page is rendered with breadcrumbs", () => {
      render(<Breadcrumb segments={[{ label: "About", href: "/about/" }]} />);
    });

    Then("breadcrumb text should wrap naturally without horizontal truncation", () => {
      const nav = screen.getByLabelText("Breadcrumb");
      const ol = nav.querySelector("ol");
      expect(ol?.className).toContain("flex-wrap");
      const allLinks = nav.querySelectorAll("a");
      for (const link of allLinks) {
        expect(link.className).not.toContain("truncate");
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Previous and next navigation between updates
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

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Footer links to AyoKoding on its canonical host
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

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Visitor opens the search dialog, types a query, and opens a result
  Scenario("Visitor opens the search dialog, types a query, and opens a result", ({ When, And, Then }) => {
    When("the visitor opens the search dialog", () => {
      routerPush.mockClear();
      render(
        <SearchProvider>
          <Header />
        </SearchProvider>,
      );
      fireEvent.click(screen.getAllByRole("button", { name: "Search" })[0]!);
      expect(screen.getByPlaceholderText("Search pages...")).toBeInTheDocument();
    });

    And('the visitor types the query "Synthetic"', async () => {
      searchState.results = [
        { title: "Enterprise Compliance Fixture", slug: "about", excerpt: "Synthetic enterprise and compliance" },
      ];
      fireEvent.change(screen.getByPlaceholderText("Search pages..."), { target: { value: "Synthetic" } });
      expect(await screen.findByRole("option", { name: /Enterprise Compliance Fixture/ })).toBeInTheDocument();
    });

    And("the visitor opens the first search result", () => {
      fireEvent.click(screen.getAllByRole("option")[0]!);
    });

    Then('the visitor lands on the page at "/about/"', () => {
      expect(routerPush).toHaveBeenCalledWith("/about/");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/app-shell/navigation.feature: Mobile menu opens from the hamburger button and lists the navigation links
  Scenario("Mobile menu opens from the hamburger button and lists the navigation links", ({ Given, When, Then }) => {
    Given("the viewport width is less than 640 pixels", () => {
      // jsdom has no layout: the mobile-only hamburger is checked by its breakpoint class instead.
      render(<Header />);
      expect(screen.getByRole("button", { name: "Open navigation menu" })).toHaveClass("sm:hidden");
    });

    When("the visitor opens the navigation menu from the hamburger button", () => {
      fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    });

    Then('the navigation menu lists the links "Updates", "About", "Documentation", and "GitHub"', () => {
      const menu = screen.getByRole("navigation", { name: "Mobile navigation" });
      for (const label of ["Updates", "About", "Documentation", "GitHub"]) {
        expect(within(menu).getByRole("link", { name: label })).toBeInTheDocument();
      }
    });
  });
});
