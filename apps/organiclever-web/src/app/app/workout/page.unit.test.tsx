/**
 * Unit tests for WorkoutPage — wraps WorkoutScreen and routes through
 * AppRuntime context for routine + completedSession plumbing.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import type { Routine } from "@/contexts/routine/application";
import type { CompletedSession } from "@/contexts/app-shell/presentation/app-machine";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
}));

let mockActiveRoutine: Routine | null = null;
const mockSetCompletedSession = vi.fn();
const mockRefreshHome = vi.fn();
vi.mock("@/contexts/app-shell/presentation/app-runtime-context", () => ({
  useAppRuntime: () => ({
    runtime: { runPromise: () => Promise.resolve() },
    activeRoutine: mockActiveRoutine,
    refreshHome: mockRefreshHome,
    state: { context: { darkMode: false } },
    setCompletedSession: mockSetCompletedSession,
  }),
}));

vi.mock("@/contexts/settings/presentation", () => ({
  useSettings: () => ({ state: { status: "loading" } }),
}));

vi.mock("@/contexts/workout-session/presentation", () => ({
  WorkoutScreen: ({
    routine,
    onFinishWorkout,
    onBack,
  }: {
    routine: Routine | null;
    onFinishWorkout: (session: CompletedSession) => void;
    onBack: () => void;
  }) => (
    <div>
      <div data-testid="workout-screen">{routine?.name ?? "quick-start"}</div>
      <button
        data-testid="finish"
        onClick={() =>
          onFinishWorkout({
            durationSecs: 600,
            exercises: [],
            routineName: routine?.name ?? null,
          })
        }
      >
        Finish
      </button>
      <button data-testid="back" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

// eslint-disable-next-line import/first
import WorkoutPage from "./page";

beforeEach(() => {
  mockPush.mockReset();
  mockSetCompletedSession.mockReset();
  mockRefreshHome.mockReset();
});

afterEach(() => {
  cleanup();
  mockActiveRoutine = null;
});

describe("WorkoutPage", () => {
  it("renders WorkoutScreen with the active routine from context", async () => {
    mockActiveRoutine = {
      id: "r1",
      name: "Leg Day",
      hue: "teal",
      type: "workout",
      createdAt: new Date().toISOString(),
      groups: [],
    } as Routine;
    await act(async () => {
      render(<WorkoutPage />);
    });
    expect(screen.getByTestId("workout-screen").textContent).toBe("Leg Day");
  });

  it("renders WorkoutScreen in quick-start mode when no active routine", async () => {
    mockActiveRoutine = null;
    await act(async () => {
      render(<WorkoutPage />);
    });
    expect(screen.getByTestId("workout-screen").textContent).toBe("quick-start");
  });

  it("sets completed session, refreshes home, and pushes /app/workout/finish on Finish", async () => {
    mockActiveRoutine = null;
    await act(async () => {
      render(<WorkoutPage />);
    });
    fireEvent.click(screen.getByTestId("finish"));
    expect(mockSetCompletedSession).toHaveBeenCalled();
    expect(mockRefreshHome).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/app/workout/finish");
  });

  it("pushes /app/home on Back", async () => {
    mockActiveRoutine = null;
    await act(async () => {
      render(<WorkoutPage />);
    });
    fireEvent.click(screen.getByTestId("back"));
    expect(mockPush).toHaveBeenCalledWith("/app/home");
  });
});
