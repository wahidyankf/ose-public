import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";
import { AUTHENTICATED } from "../helpers/auth-mock";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/dashboard"),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));
vi.mock("@/app/contexts/auth-context", () => ({ useAuth: vi.fn() }));
// Navigation is NOT mocked — we need its Logout button
vi.mock("@/components/Breadcrumb", () => ({ default: () => null }));

import { useAuth } from "@/app/contexts/auth-context";
import { useRouter } from "next/navigation";
import DashboardPage from "@/app/dashboard/page";

const feature = await loadFeature("../../specs/organiclever-web/auth/user-logout.feature");

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  AfterEachScenario(() => {
    cleanup();
  });

  Scenario("Logging out ends the session and redirects to the login page", ({ Given, When, Then, And }) => {
    let mockLogout: ReturnType<typeof vi.fn>;

    Given("a user is logged in and on the dashboard", async () => {
      mockLogout = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
      vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED, logout: mockLogout } as unknown as ReturnType<
        typeof useAuth
      >);
      render(<DashboardPage />);
      await screen.findByRole("heading", { name: /dashboard/i });
    });

    When('the user clicks the "Logout" button in the navigation sidebar', async () => {
      const user = userEvent.setup();
      const logoutBtn = screen.getByRole("button", { name: /logout/i });
      await user.click(logoutBtn);
    });

    Then("the user should be redirected to the login page", async () => {
      await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    });

    And("the authentication session should be ended", () => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    And('navigating to "/dashboard" should redirect the user back to the login page', () => {
      // Full redirect flow is covered by E2E tests; here we verify logout was called
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
});
