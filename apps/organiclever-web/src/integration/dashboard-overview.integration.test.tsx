import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";
import { AUTHENTICATED } from "../test/helpers/auth-mock";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/dashboard"),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));
vi.mock("@/app/contexts/auth-context", () => ({ useAuth: vi.fn() }));
// Navigation is NOT mocked — needed for sidebar collapse scenario
vi.mock("@/components/Breadcrumb", () => ({ default: () => null }));

import { useAuth } from "@/app/contexts/auth-context";
import { useRouter } from "next/navigation";
import DashboardPage from "@/app/dashboard/page";

const feature = await loadFeature("../../specs/organiclever-web/dashboard/dashboard-overview.feature");

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
    localStorage.clear();
  });

  AfterEachScenario(() => {
    cleanup();
    localStorage.clear();
  });

  Scenario("Dashboard displays the active projects count", ({ Given, Then }) => {
    Given("a user is logged in and on the dashboard", async () => {
      render(<DashboardPage />);
      await screen.findByRole("heading", { name: /dashboard/i });
    });

    Then('the dashboard should display "12" active projects', () => {
      expect(screen.getByText("12")).toBeTruthy();
    });
  });

  Scenario("Dashboard displays the team members count", ({ Given, Then }) => {
    Given("a user is logged in and on the dashboard", async () => {
      render(<DashboardPage />);
      await screen.findByRole("heading", { name: /dashboard/i });
    });

    Then('the dashboard should display "24" team members', () => {
      expect(screen.getByText("24")).toBeTruthy();
    });
  });

  Scenario("Clicking the Team Members card navigates to the members list", ({ Given, When, Then }) => {
    let mockPush: ReturnType<typeof vi.fn>;

    Given("a user is logged in and on the dashboard", async () => {
      mockPush = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
      render(<DashboardPage />);
      await screen.findByText("Team Members");
    });

    When('the user clicks the "Team Members" card', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByText("Team Members").closest('[class*="cursor-pointer"]') as Element);
    });

    Then("the user should be on the members list page", () => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/members");
    });
  });

  Scenario("Collapsing the sidebar persists across page refreshes", ({ Given, When, Then, And }) => {
    Given("a user is logged in and on the dashboard", async () => {
      render(<DashboardPage />);
      await screen.findByRole("heading", { name: /dashboard/i });
    });

    When("the user clicks the sidebar collapse button", async () => {
      const user = userEvent.setup();
      const allButtons = screen.getAllByRole("button");
      const logoutBtn = screen.getByRole("button", { name: /logout/i });
      const hamburgerBtn = allButtons.find((btn) => btn.className.includes("md:hidden"));
      const collapseBtn = allButtons.find((btn) => btn !== hamburgerBtn && btn !== logoutBtn);
      await user.click(collapseBtn as Element);
    });

    And("the user refreshes the page", () => {
      expect(localStorage.getItem("sidebarCollapsed")).toBe("true");
      cleanup();
    });

    Then("the sidebar should remain collapsed", async () => {
      render(<DashboardPage />);
      await screen.findByRole("heading", { name: /dashboard/i });
      expect(localStorage.getItem("sidebarCollapsed")).toBe("true");
    });
  });
});
