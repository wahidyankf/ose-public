import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, waitFor, within, act } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { AUTHENTICATED } from "../helpers/auth-mock";
import { server } from "../server";
import { MOCK_MEMBERS } from "../helpers/mock-data";

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

const feature = await loadFeature("../../specs/apps/organiclever-web/members/member-deletion.feature");

async function openDeleteDialogFor(name: string): Promise<void> {
  const user = userEvent.setup();
  const rows = screen.getAllByRole("row");
  const targetRow = rows.find((row) => within(row).queryByText(name) !== null);
  const actionBtns = within(targetRow!).getAllByRole("button");
  // order: View (0), Edit (1), Delete trigger (2)
  await user.click(actionBtns[2]!);
  await screen.findByRole("alertdialog");
}

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  AfterEachScenario(() => {
    cleanup();
  });

  Scenario("Clicking delete opens a confirmation dialog", ({ Given, When, Then }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When('the user clicks the delete button for "Charlie Davis"', async () => {
      await openDeleteDialogFor("Charlie Davis");
    });

    Then('a confirmation dialog should appear with the text "Are you absolutely sure?"', () => {
      expect(screen.getByRole("alertdialog")).toBeTruthy();
      expect(screen.getByText("Are you absolutely sure?")).toBeTruthy();
    });
  });

  Scenario("Confirming deletion removes the member from the list", ({ Given, When, Then, And }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    And('the user has clicked the delete button for "Bob Smith"', async () => {
      await openDeleteDialogFor("Bob Smith");
    });

    When("the user confirms the deletion", async () => {
      const listWithoutBob = MOCK_MEMBERS.filter((m) => m.name !== "Bob Smith");
      server.use(http.get("/api/members", () => HttpResponse.json(listWithoutBob)));

      const user = userEvent.setup();
      const dialog = screen.getByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
      await waitFor(() => expect(screen.queryByText("Bob Smith")).toBeNull());
    });

    Then('"Bob Smith" should no longer appear in the member list', () => {
      expect(screen.queryByText("Bob Smith")).toBeNull();
    });
  });

  Scenario("Cancelling deletion keeps the member in the list", ({ Given, When, Then, And }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    And('the user has clicked the delete button for "Bob Smith"', async () => {
      await openDeleteDialogFor("Bob Smith");
    });

    When("the user cancels the deletion", async () => {
      const user = userEvent.setup();
      const dialog = screen.getByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: /cancel/i }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    });

    Then('"Bob Smith" should still appear in the member list', () => {
      expect(screen.getByText("Bob Smith")).toBeTruthy();
    });
  });

  Scenario("A server error during deletion shows an error message", ({ Given, When, Then, And }) => {
    Given("the member list page is displayed with all members", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When("the user clicks the delete button for the first member", async () => {
      await openDeleteDialogFor("Alice Johnson");
    });

    And("the user confirms the deletion", async () => {
      server.use(http.delete("/api/members/:id", () => new HttpResponse(null, { status: 500 })));
      const user = userEvent.setup();
      const dialog = screen.getByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    });

    And("the server returns an error", async () => {
      // Flush the async DELETE response and React state update from handleDeleteMember
      await act(async () => {});
    });

    Then("an error message should be displayed", () => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    And("all members should still be visible in the list", () => {
      expect(screen.getAllByRole("row").length - 1).toBe(MOCK_MEMBERS.length);
    });
  });
});
