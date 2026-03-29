import React, { Suspense } from "react";
import { render, screen, cleanup, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { http } from "msw";
import { AUTHENTICATED } from "../../../../test/helpers/auth-mock";
import { server } from "../../../../test/server";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/dashboard/members/1"),
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
import MemberDetailPage from "@/app/dashboard/members/[id]/page";

describe("MemberDetailPage uncovered branches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    cleanup();
  });

  it("returns null when authenticated but member fetch is still pending — covers !member branch", async () => {
    // Use a handler that never resolves so member stays null
    server.use(http.get("/api/members/:id", () => new Promise<never>(() => {})));

    await act(async () => {
      render(
        <Suspense fallback={null}>
          <MemberDetailPage params={Promise.resolve({ id: "1" })} />
        </Suspense>,
      );
    });

    // Component renders null (no content) while member is null but user is authenticated
    expect(screen.queryByText("Member Details")).toBeNull();
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("redirects to login when user is not authenticated — covers lines 87-88", async () => {
    const mockPush = vi.fn();
    const mockSetIntendedDestination = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      ...AUTHENTICATED,
      isAuthenticated: false,
      setIntendedDestination: mockSetIntendedDestination,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);

    await act(async () => {
      render(
        <Suspense fallback={null}>
          <MemberDetailPage params={Promise.resolve({ id: "42" })} />
        </Suspense>,
      );
    });

    await waitFor(() => expect(mockSetIntendedDestination).toHaveBeenCalledWith("/dashboard/members/42"));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
  });
});
