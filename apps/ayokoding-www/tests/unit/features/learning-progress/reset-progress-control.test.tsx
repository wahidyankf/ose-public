import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import { parseProgress, setPageComplete } from "@/features/learning-progress/core/progress-state";
import { ResetProgressControl } from "@/features/learning-progress/shell/reset-progress-control";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";

/** Let Radix's portal mount, its focus scope run, and its close-focus restore settle. */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function storedCompleted(): unknown {
  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).state.completed;
}

function seed(): void {
  learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/overview", true));
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
  seed();
});

afterEach(cleanup);

describe("ResetProgressControl", () => {
  it("opens the dialog with Cancel focused, and keeps every record when Cancel is used", async () => {
    render(<ResetProgressControl locale="en" />);
    const trigger = screen.getByRole("button", { name: "Reset progress…" });

    fireEvent.click(trigger);
    await settle();

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Reset all progress?")).toBeTruthy();
    expect(screen.getByText("This clears every completed page in this browser. It cannot be undone.")).toBeTruthy();

    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(document.activeElement).toBe(cancel);

    fireEvent.click(cancel);
    await settle();

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(storedCompleted()).toEqual({ "just-enough-bash": ["learning/overview"] });
    expect(document.activeElement).toBe(trigger);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("clears every record, closes, announces resetDone, and returns focus when Confirm is used", async () => {
    render(<ResetProgressControl locale="en" />);
    const trigger = screen.getByRole("button", { name: "Reset progress…" });

    fireEvent.click(trigger);
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Reset progress" }));
    await settle();

    expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    expect(learningProgressStore.getSnapshot()).toEqual({
      status: "ready",
      persisted: true,
      recovered: false,
      state: { version: 1, completed: {}, lastPath: null, lastCourse: null },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Progress reset.");
    // The reset emptied the store, so the trigger is now disabled (UWT-009) and cannot take
    // focus back: focus lands on the reset announcement instead.
    expect(screen.getByRole("button", { name: "Reset progress…" }).hasAttribute("disabled")).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole("status"));
  });

  it("localizes the button, the dialog, and the announcement on the id locale", async () => {
    render(<ResetProgressControl locale="id" />);
    const trigger = screen.getByRole("button", { name: "Atur ulang progres…" });

    fireEvent.click(trigger);
    await settle();

    expect(screen.getByText("Atur ulang semua progres?")).toBeTruthy();
    expect(
      screen.getByText(
        "Ini menghapus semua halaman yang sudah selesai di browser ini. Tindakan ini tidak bisa dibatalkan.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Atur ulang progres" }));
    await settle();

    expect(screen.getByRole("status").textContent).toBe("Progres diatur ulang.");
  });

  it("keeps the trigger's label and the status region in the DOM before the dialog is ever opened", () => {
    render(<ResetProgressControl locale="en" />);

    expect(screen.getByRole("button", { name: "Reset progress…" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables the trigger when there is no saved progress to reset (UWT-009)", () => {
    learningProgressStore.reset();
    window.localStorage.clear();
    render(<ResetProgressControl locale="en" />);

    // A first-time reader with zero progress gets no destructive affordance: the control
    // renders disabled instead of promising a dialog over an empty state.
    expect(screen.getByRole("button", { name: "Reset progress…" }).hasAttribute("disabled")).toBe(true);
  });

  it("enables the trigger again once any progress exists (UWT-009)", () => {
    learningProgressStore.reset();
    window.localStorage.clear();
    render(<ResetProgressControl locale="en" />);
    expect(screen.getByRole("button", { name: "Reset progress…" }).hasAttribute("disabled")).toBe(true);

    act(() => {
      seed();
    });

    expect(screen.getByRole("button", { name: "Reset progress…" }).hasAttribute("disabled")).toBe(false);
  });
});
