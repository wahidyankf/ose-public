/**
 * Unit tests for FinishPage — verifies that the page redirects to /app/home
 * when no completed session is in context, and renders the FinishScreen when
 * one is present.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import type { CompletedSession } from "@/contexts/app-shell/presentation/app-machine";
import type { AppRuntimeContextValue } from "@/contexts/app-shell/presentation/app-runtime-context";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: vi.fn() }),
}));

let mockContextValue: Partial<AppRuntimeContextValue> = {};
const mockSetCompletedSession = vi.fn();
vi.mock("@/contexts/app-shell/presentation/app-runtime-context", () => ({
  useAppRuntime: () => ({
    completedSession: mockContextValue.completedSession ?? null,
    setCompletedSession: mockSetCompletedSession,
  }),
}));

vi.mock("@/contexts/workout-session/presentation", () => ({
  FinishScreen: ({ completedSession }: { completedSession: CompletedSession }) => (
    <div data-testid="finish-screen">{completedSession.routineName ?? "no routine"}</div>
  ),
}));

// eslint-disable-next-line import/first
import FinishPage from "./page";

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockReplace.mockReset();
  mockPush.mockReset();
  mockSetCompletedSession.mockReset();
});

afterEach(() => {
  cleanup();
  mockContextValue = {};
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FinishPage", () => {
  it("redirects to /app/home when no completed session is in context", async () => {
    mockContextValue = { completedSession: null };
    await act(async () => {
      render(<FinishPage />);
    });
    expect(mockReplace).toHaveBeenCalledWith("/app/home");
    expect(screen.queryByTestId("finish-screen")).toBeNull();
  });

  it("renders FinishScreen when a completed session is present", async () => {
    const session: CompletedSession = {
      durationSecs: 1800,
      exercises: [{ name: "Squat", sets: 3 }],
      routineName: "Push Day",
    };
    mockContextValue = { completedSession: session };
    await act(async () => {
      render(<FinishPage />);
    });
    expect(screen.getByTestId("finish-screen").textContent).toBe("Push Day");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
