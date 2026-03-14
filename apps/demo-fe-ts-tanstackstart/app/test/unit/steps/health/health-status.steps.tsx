import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { screen, waitFor } from "@testing-library/react";
import { vi, expect } from "vitest";
import path from "path";
import { renderWithProviders } from "../../support/test-utils";
import { Route as HomeRoute } from "~/routes/index";
const HomePage = (HomeRoute as unknown as { component: React.FC }).component;

vi.mock("~/lib/api/auth", () => ({
  getHealth: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
}));

import * as authApi from "~/lib/api/auth";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: "/" }),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) => select({ location: { pathname: "/" } }),
  useSearch: () => ({}),
  Outlet: () => null,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/health/health-status.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      // App is always running in test environment
    });
  });

  Scenario("Health indicator shows the service is UP", ({ When, Then }) => {
    When("the user opens the app", () => {
      // App is opened - health check will be triggered
    });

    Then('the health status indicator should display "UP"', async () => {
      vi.mocked(authApi.getHealth).mockResolvedValue({ status: "UP" });
      renderWithProviders(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText(/UP/)).toBeInTheDocument();
      });
    });
  });

  Scenario("Health indicator does not expose component details to regular users", ({ When, Then, And }) => {
    When("an unauthenticated user opens the app", () => {
      // App is opened
    });

    Then('the health status indicator should display "UP"', async () => {
      vi.mocked(authApi.getHealth).mockResolvedValue({ status: "UP" });
      renderWithProviders(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText(/UP/)).toBeInTheDocument();
      });
    });

    And("no detailed component health information should be visible", () => {
      expect(screen.queryByText(/components/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/database/i)).not.toBeInTheDocument();
    });
  });
});
