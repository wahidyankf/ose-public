import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";
import { AUTHENTICATED } from "../helpers/auth-mock";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/dashboard/members"),
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
import MembersPage from "@/app/dashboard/members/page";

const feature = await loadFeature("../../specs/organiclever-web/members/member-list.feature");

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  AfterEachScenario(() => {
    cleanup();
  });

  Scenario("Members page shows all team members", ({ Given, Then }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    Then("the member list should show 6 members", () => {
      const rows = screen.getAllByRole("row");
      // subtract header row
      expect(rows.length - 1).toBe(6);
    });
  });

  Scenario("Searching by name filters the list", ({ Given, When, Then }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When('the user types "Alice" in the search field', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText(/search members/i), "Alice");
    });

    Then('only members whose name contains "Alice" should be displayed', () => {
      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);
      expect(dataRows).toHaveLength(1);
      expect(dataRows[0]!.textContent).toContain("Alice");
    });
  });

  Scenario("Searching by role filters the list", ({ Given, When, Then }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When('the user types "Product Manager" in the search field', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText(/search members/i), "Product Manager");
    });

    Then('only members whose role is "Product Manager" should be displayed', () => {
      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);
      expect(dataRows).toHaveLength(1);
      expect(dataRows[0]!.textContent).toContain("Product Manager");
    });
  });

  Scenario("Searching by email filters the list", ({ Given, When, Then }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When('the user types "alice@example.com" in the search field', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText(/search members/i), "alice@example.com");
    });

    Then('only "Alice Johnson" should appear in the results', () => {
      const rows = screen.getAllByRole("row");
      const dataRows = rows.slice(1);
      expect(dataRows).toHaveLength(1);
      expect(dataRows[0]!.textContent).toContain("Alice Johnson");
    });
  });

  Scenario("Searching with no matches shows an empty list", ({ Given, When, Then }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When('the user types "zzznomatch" in the search field', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText(/search members/i), "zzznomatch");
    });

    Then("the member list should show 0 members", () => {
      const rows = screen.getAllByRole("row");
      // Only header row remains
      expect(rows.length - 1).toBe(0);
    });
  });

  Scenario("Clicking a member row navigates to that member's detail page", ({ Given, When, Then }) => {
    let mockPush: ReturnType<typeof vi.fn>;

    Given("a user is logged in and on the members page", async () => {
      mockPush = vi.fn();
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When('the user clicks the row for "Alice Johnson"', async () => {
      const user = userEvent.setup();
      const rows = screen.getAllByRole("row");
      const aliceRow = rows.find((row) => within(row).queryByText("Alice Johnson") !== null);
      await user.click(within(aliceRow!).getByText("Alice Johnson"));
    });

    Then("the user should be on the detail page for Alice Johnson", async () => {
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/members/1"));
    });
  });
});
