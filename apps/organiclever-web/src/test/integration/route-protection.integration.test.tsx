import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";
import { BASE_AUTH } from "../helpers/auth-mock";

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
import { useRouter } from "next/navigation";
import DashboardPage from "@/app/dashboard/page";
import MembersPage from "@/app/dashboard/members/page";
import LoginPage from "@/app/login/page";

const feature = await loadFeature("../../specs/organiclever-web/auth/route-protection.feature");

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  AfterEachScenario(() => {
    cleanup();
  });

  Scenario("Unauthenticated access to the dashboard redirects to login", ({ Given, When, Then }) => {
    let mockPush: ReturnType<typeof vi.fn>;

    Given("a visitor has not logged in", () => {
      mockPush = vi.fn();
      vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH });
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    });

    When('the visitor navigates directly to "/dashboard"', async () => {
      render(<DashboardPage />);
    });

    Then("the visitor should be redirected to the login page", async () => {
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
    });
  });

  Scenario("Unauthenticated access to the members page redirects to login", ({ Given, When, Then }) => {
    let mockPush: ReturnType<typeof vi.fn>;

    Given("a visitor has not logged in", () => {
      mockPush = vi.fn();
      vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH });
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    });

    When('the visitor navigates directly to "/dashboard/members"', async () => {
      render(<MembersPage />);
    });

    Then("the visitor should be redirected to the login page", async () => {
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
    });
  });

  Scenario("After login the user is sent to the page they originally requested", ({ Given, When, Then, And }) => {
    let mockPush: ReturnType<typeof vi.fn>;
    let mockSetIntendedDestination: ReturnType<typeof vi.fn>;
    let mockLogin: ReturnType<typeof vi.fn>;

    Given('a visitor navigated to "/dashboard/members" without being logged in', async () => {
      mockPush = vi.fn();
      mockSetIntendedDestination = vi.fn();
      vi.mocked(useAuth).mockReturnValue({
        ...BASE_AUTH,
        setIntendedDestination: mockSetIntendedDestination,
      } as unknown as ReturnType<typeof useAuth>);
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
      render(<MembersPage />);
      await waitFor(() => expect(mockSetIntendedDestination).toHaveBeenCalledWith("/dashboard/members"));
    });

    And("the visitor was redirected to the login page", async () => {
      cleanup();
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
    });

    When("the visitor successfully logs in", async () => {
      mockLogin = vi.fn<(email: string, password: string) => Promise<boolean>>().mockResolvedValue(true);
      vi.mocked(useAuth).mockReturnValue({
        ...BASE_AUTH,
        login: mockLogin,
        getIntendedDestination: vi.fn().mockReturnValue("/dashboard/members"),
      } as unknown as ReturnType<typeof useAuth>);
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
      render(<LoginPage />);
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /login/i }));
    });

    Then('the visitor should be on the "/dashboard/members" page', async () => {
      await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123"));
    });
  });
});
