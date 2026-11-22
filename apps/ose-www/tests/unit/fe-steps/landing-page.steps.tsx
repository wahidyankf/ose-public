import "./helpers/test-setup";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";

// Mock next/link so it renders as a plain anchor
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Github: () => <svg aria-label="github-icon" />,
  Rss: () => <svg aria-label="rss-icon" />,
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
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
    if (asChild && React.isValidElement(children)) {
      return children;
    }
    return <>{children}</>;
  },
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { Hero } from "@/features/landing/shell/hero";
import { SocialIcons } from "@/features/landing/shell/social-icons";
import { metadata } from "@/app/layout";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/apps/ose/www/behaviours/frontend/landing/landing-page.feature"),
);

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
  });

  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(Hero).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/landing/landing-page.feature: The landing page is served at / with the site title
  Scenario("The landing page is served at / with the site title", ({ When, Then }) => {
    When("the landing page is rendered", () => {
      render(<Hero />);
    });

    Then('the page title is "OSE Platform"', () => {
      // The root layout's metadata is the title the home page is served with.
      expect(metadata.title).toEqual({ default: "OSE Platform", template: "%s | OSE Platform" });
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/landing/landing-page.feature: Hero shows the title and mission description
  Scenario("Hero shows the title and mission description", ({ When, Then, And }) => {
    When("the landing page is rendered", () => {
      render(<Hero />);
    });

    Then('the hero section displays the title "Open Sharia Enterprise Platform"', () => {
      expect(screen.getByRole("heading", { name: /Open Sharia Enterprise Platform/i })).toBeInTheDocument();
    });

    And("the hero section displays a description of the platform mission", () => {
      // The mission text "Built in the Open · Sharia-Compliant · Enterprise-Ready" is in a <strong>
      expect(screen.getByText(/Built in the Open/i)).toBeInTheDocument();
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/landing/landing-page.feature: Hero links to About and to GitHub
  Scenario("Hero links to About and to GitHub", ({ When, Then, And }) => {
    When("the landing page is rendered", () => {
      render(<Hero />);
    });

    Then('the hero section contains a "Learn More" link to "/about/"', () => {
      const link = screen.getByRole("link", { name: /Learn More/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/about/");
    });

    And('the hero section contains a "GitHub" link', () => {
      const githubLink = screen.getByRole("link", { name: /GitHub/i });
      expect(githubLink).toBeInTheDocument();
    });
  });

  // @scenario specs/apps/ose/www/behaviours/frontend/landing/landing-page.feature: Social icons are displayed
  Scenario("Social icons are displayed", ({ When, Then, And }) => {
    When("the landing page is rendered", () => {
      render(<SocialIcons />);
    });

    Then("a GitHub icon link is visible", () => {
      const githubLink = screen.getByRole("link", { name: /GitHub repository/i });
      expect(githubLink).toBeInTheDocument();
    });

    And("an RSS feed icon link is visible", () => {
      const rssLink = screen.getByRole("link", { name: /RSS feed/i });
      expect(rssLink).toBeInTheDocument();
    });
  });
});
