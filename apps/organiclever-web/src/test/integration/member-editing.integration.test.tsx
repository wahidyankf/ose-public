import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react/pure";
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

const feature = await loadFeature("../../specs/organiclever-web/members/member-editing.feature");

async function openEditDialogFor(name: string): Promise<void> {
  const user = userEvent.setup();
  const rows = screen.getAllByRole("row");
  const targetRow = rows.find((row) => within(row).queryByText(name) !== null);
  const actionBtns = within(targetRow!).getAllByRole("button");
  // order: View (0), Edit (1), Delete trigger (2)
  await user.click(actionBtns[1]!);
  await screen.findByRole("dialog");
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

  Scenario("Edit dialog opens with the member's current data pre-filled", ({ Given, When, Then, And }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    When('the user opens the edit dialog for "Alice Johnson"', async () => {
      await openEditDialogFor("Alice Johnson");
    });

    Then('the name field should show "Alice Johnson"', () => {
      const dialog = screen.getByRole("dialog");
      expect((within(dialog).getByLabelText(/^name$/i) as HTMLInputElement).value).toBe("Alice Johnson");
    });

    And('the role field should show "Senior Software Engineers"', () => {
      const dialog = screen.getByRole("dialog");
      expect((within(dialog).getByLabelText(/^role$/i) as HTMLInputElement).value).toBe("Senior Software Engineers");
    });

    And('the email field should show "alice@example.com"', () => {
      const dialog = screen.getByRole("dialog");
      expect((within(dialog).getByLabelText(/^email$/i) as HTMLInputElement).value).toBe("alice@example.com");
    });

    And('the GitHub field should show "alicejohnson"', () => {
      const dialog = screen.getByRole("dialog");
      expect((within(dialog).getByLabelText(/^github$/i) as HTMLInputElement).value).toBe("alicejohnson");
    });
  });

  Scenario("Saving an edit updates the member in the list", ({ Given, When, Then, And }) => {
    Given("a user is logged in and on the members page", async () => {
      render(<MembersPage />);
      await screen.findAllByRole("row");
    });

    And('the user has opened the edit dialog for "Alice Johnson"', async () => {
      await openEditDialogFor("Alice Johnson");
    });

    When('the user changes the name to "Alice Smith" and saves', async () => {
      const updatedMember = { ...MOCK_MEMBERS[0]!, name: "Alice Smith" };
      const updatedList = [updatedMember, ...MOCK_MEMBERS.slice(1)];
      server.use(
        http.put("/api/members/1", () => HttpResponse.json(updatedMember)),
        http.get("/api/members", () => HttpResponse.json(updatedList)),
      );

      const user = userEvent.setup();
      const dialog = screen.getByRole("dialog");
      const nameInput = within(dialog).getByLabelText(/^name$/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Alice Smith");
      await user.click(within(dialog).getByRole("button", { name: /save changes/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await screen.findByText("Alice Smith");
    });

    Then('"Alice Smith" should appear in the member list', () => {
      expect(screen.getByText("Alice Smith")).toBeTruthy();
    });

    And('"Alice Johnson" should no longer appear in the member list', () => {
      expect(screen.queryByText("Alice Johnson")).toBeNull();
    });
  });
});
