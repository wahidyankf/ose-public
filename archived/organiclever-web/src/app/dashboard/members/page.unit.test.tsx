import React from "react";
import { render, screen, cleanup, waitFor, act, within } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { AUTHENTICATED } from "../../../test/helpers/auth-mock";
import { server } from "../../../test/server";

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

describe("MembersPage uncovered branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a member row without email — covers the email conditional false branch", async () => {
    // Bob Smith (id=2) has no email in the default mock data
    render(<MembersPage />);
    await screen.findAllByRole("row");

    const rows = screen.getAllByRole("row");
    const bobRow = rows.find((row) => within(row).queryByText("Bob Smith") !== null);
    expect(bobRow).toBeTruthy();
    // The email cell should be empty (no Mail icon text)
    const cells = within(bobRow!).getAllByRole("cell");
    // email is the 3rd cell (index 2)
    expect(cells[2]!.textContent).toBe("");
  });

  it("handles fetchMembers API error gracefully — covers the catch branch on initial load", async () => {
    server.use(http.get("/api/members", () => new HttpResponse(null, { status: 500 })));

    render(<MembersPage />);

    // Wait for the component to settle after the failed fetch
    await act(async () => {});

    // The page should still render (no crash) with zero data rows
    const rows = screen.getAllByRole("row");
    expect(rows.length - 1).toBe(0);
  });

  it("clicking the view button on a member row navigates to the member detail page — covers line 87", async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);

    render(<MembersPage />);
    await screen.findByText("Alice Johnson");

    const rows = screen.getAllByRole("row");
    const aliceRow = rows.find((row) => row.textContent?.includes("Alice Johnson"));
    expect(aliceRow).toBeTruthy();
    const actionBtns = within(aliceRow!).getAllByRole("button");
    // order: View (0), Edit (1), Delete trigger (2)
    const user = userEvent.setup();
    await user.click(actionBtns[0]!);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/members/1"));
  });

  it("clicking the github link stops event propagation — covers line 79", async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);

    render(<MembersPage />);
    await screen.findByText("Alice Johnson");

    const githubLink = screen.getByRole("link", { name: "alicejohnson" });
    const user = userEvent.setup();
    await user.click(githubLink);

    // stopPropagation prevents the row-level router.push from being called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens edit dialog for member without email — covers the optional email branch", async () => {
    render(<MembersPage />);
    await screen.findByText("Bob Smith");

    const rows = screen.getAllByRole("row");
    const bobRow = rows.find((row) => row.textContent?.includes("Bob Smith"));
    expect(bobRow).toBeTruthy();
    const actionBtns = within(bobRow!).getAllByRole("button");
    // order: View (0), Edit (1), Delete trigger (2)
    const user = userEvent.setup();
    await user.click(actionBtns[1]!);
    await screen.findByRole("dialog");

    const dialog = screen.getByRole("dialog");
    // Bob has no email — the email input value should be empty string
    const emailInput = within(dialog).getByLabelText(/^email$/i) as HTMLInputElement;
    expect(emailInput.value).toBe("");
  });

  it("handles handleUpdateMember API error gracefully — covers the catch branch in update", async () => {
    render(<MembersPage />);
    await screen.findByText("Alice Johnson");

    // Find the edit button for Alice Johnson's row
    const rows = screen.getAllByRole("row");
    const aliceRow = rows.find((row) => row.textContent?.includes("Alice Johnson"));
    expect(aliceRow).toBeTruthy();
    const actionBtns = within(aliceRow!).getAllByRole("button");
    // order: View (0), Edit (1), Delete trigger (2)
    const user = userEvent.setup();
    await user.click(actionBtns[1]!);
    await screen.findByRole("dialog");

    // Intercept the PUT to return 500
    server.use(http.put("/api/members/:id", () => new HttpResponse(null, { status: 500 })));

    // Submit the edit form
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /save changes/i }));

    // Wait for the async error handling to complete — the catch logs the error
    await act(async () => {});

    // Dialog remains open after a failed update (the catch doesn't close it)
    // Just verify no crash and the page is still usable
    expect(screen.getByText("Alice Johnson")).toBeTruthy();
  });
});
