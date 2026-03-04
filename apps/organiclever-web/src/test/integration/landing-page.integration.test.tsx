import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";
import { BASE_AUTH, AUTHENTICATED } from "../helpers/auth-mock";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/"),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));
vi.mock("@/app/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/components/Navigation", () => ({ Navigation: () => null }));
vi.mock("@/components/Breadcrumb", () => ({ default: () => null }));

import { useAuth } from "@/app/contexts/auth-context";
import Home from "@/app/page";

const feature = await loadFeature("../../specs/organiclever-web/landing/landing-page.feature");

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH });
  });

  AfterEachScenario(() => {
    cleanup();
  });

  Scenario("Unauthenticated visitor sees login call-to-action in the header", ({ Given, When, Then, And }) => {
    Given("a visitor has not logged in", () => {
      vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH });
    });

    When("the visitor opens the OrganicLever home page", async () => {
      render(<Home />);
      await screen.findByRole("main");
    });

    Then('the header should display a "Login" link', () => {
      expect(screen.getByRole("link", { name: /login/i })).toBeTruthy();
    });

    And('the page should display a "Get Started" button', () => {
      expect(screen.getByRole("link", { name: /get started/i })).toBeTruthy();
    });

    And('the page headline should read "Boost Your Software Team\'s Productivity"', () => {
      expect(screen.getByText(/boost your software team's productivity/i)).toBeTruthy();
    });
  });

  Scenario("Authenticated user sees dashboard link instead of login", ({ Given, When, Then, And }) => {
    Given('a user is logged in as "user@example.com"', () => {
      vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    });

    When("the user opens the OrganicLever home page", async () => {
      render(<Home />);
      await screen.findByRole("main");
    });

    Then('the header should display a "Dashboard" link', () => {
      expect(screen.getByRole("link", { name: /dashboard/i })).toBeTruthy();
    });

    And('a "Login" link should not be visible in the header', () => {
      expect(screen.queryByRole("link", { name: /^login$/i })).toBeNull();
    });
  });

  Scenario('Clicking "Get Started" takes the visitor to the login page', ({ Given, When, Then, And }) => {
    Given("a visitor has not logged in", () => {
      vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH });
    });

    And("the visitor is on the OrganicLever home page", async () => {
      render(<Home />);
      await screen.findByRole("main");
    });

    When('the visitor clicks the "Get Started" button', async () => {
      const user = userEvent.setup();
      const getStarted = screen.getByRole("link", { name: /get started/i });
      await user.click(getStarted);
    });

    Then("the visitor should be on the login page", () => {
      const getStarted = screen.getByRole("link", { name: /get started/i });
      expect(getStarted.getAttribute("href")).toBe("/login");
    });
  });
});
