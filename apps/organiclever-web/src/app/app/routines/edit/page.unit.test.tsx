/**
 * Unit tests for EditRoutinePage — verifies it renders the editor with the
 * routine from context and that handlers route back to /app/home.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import type { Routine } from "@/contexts/routine/application";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
}));

let mockEditingRoutine: Routine | null = null;
const mockSetEditingRoutine = vi.fn();
const mockRefreshHome = vi.fn();
vi.mock("@/components/app/app-runtime-context", () => ({
  useAppRuntime: () => ({
    runtime: { runPromise: () => Promise.resolve() },
    editingRoutine: mockEditingRoutine,
    refreshHome: mockRefreshHome,
    setEditingRoutine: mockSetEditingRoutine,
  }),
}));

vi.mock("@/contexts/routine/presentation", () => ({
  EditRoutineScreen: ({
    routine,
    onBack,
    onSave,
  }: {
    routine: Routine | null;
    onBack: () => void;
    onSave: () => void;
  }) => (
    <div>
      <div data-testid="edit-screen">{routine?.name ?? "create-new"}</div>
      <button data-testid="back" onClick={onBack}>
        Back
      </button>
      <button data-testid="save" onClick={onSave}>
        Save
      </button>
    </div>
  ),
}));

// eslint-disable-next-line import/first
import EditRoutinePage from "./page";

beforeEach(() => {
  mockPush.mockReset();
  mockSetEditingRoutine.mockReset();
  mockRefreshHome.mockReset();
});

afterEach(() => {
  cleanup();
  mockEditingRoutine = null;
});

describe("EditRoutinePage", () => {
  it("renders the editor in 'create new' mode when no routine in context", async () => {
    mockEditingRoutine = null;
    await act(async () => {
      render(<EditRoutinePage />);
    });
    expect(screen.getByTestId("edit-screen").textContent).toBe("create-new");
  });

  it("renders the editor with the routine from context when present", async () => {
    mockEditingRoutine = {
      id: "r1",
      name: "Pull Day",
      hue: "teal",
      type: "workout",
      createdAt: new Date().toISOString(),
      groups: [],
    } as Routine;
    await act(async () => {
      render(<EditRoutinePage />);
    });
    expect(screen.getByTestId("edit-screen").textContent).toBe("Pull Day");
  });

  it("clears editingRoutine and pushes /app/home on Back", async () => {
    mockEditingRoutine = null;
    await act(async () => {
      render(<EditRoutinePage />);
    });
    fireEvent.click(screen.getByTestId("back"));
    expect(mockSetEditingRoutine).toHaveBeenCalledWith(null);
    expect(mockPush).toHaveBeenCalledWith("/app/home");
  });

  it("clears editingRoutine, refreshes Home, and pushes /app/home on Save", async () => {
    mockEditingRoutine = null;
    await act(async () => {
      render(<EditRoutinePage />);
    });
    fireEvent.click(screen.getByTestId("save"));
    expect(mockSetEditingRoutine).toHaveBeenCalledWith(null);
    expect(mockRefreshHome).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/app/home");
  });
});
