import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgressSnapshot } from "@/features/learning-progress/shell/progress-storage";

vi.mock("@/features/learning-progress/shell/use-learning-progress", () => ({
  useLearningProgress: vi.fn(),
}));

import { useLearningProgress } from "@/features/learning-progress/shell/use-learning-progress";
import { StorageNotice } from "@/features/learning-progress/shell/storage-notice";

afterEach(cleanup);

const mocked = vi.mocked(useLearningProgress);

const EMPTY_STATE = { version: 1 as const, completed: {}, lastPath: null, lastCourse: null };

function ready(persisted: boolean): ProgressSnapshot {
  return { status: "ready", persisted, recovered: false, state: EMPTY_STATE };
}

function slotOf(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe("StorageNotice", () => {
  it("warns in the reader's locale when progress cannot be persisted", () => {
    mocked.mockReturnValue(ready(false));

    render(<StorageNotice locale="en" />);
    expect(
      screen.getByText("Progress can't be saved in this browser. It lasts until you close this tab."),
    ).toBeTruthy();
    cleanup();

    render(<StorageNotice locale="id" />);
    expect(
      screen.getByText("Progres tidak bisa disimpan di browser ini. Progres hanya bertahan sampai tab ini ditutup."),
    ).toBeTruthy();
  });

  it("keeps the same h-5 slot empty while the snapshot is unknown or persisted", () => {
    mocked.mockReturnValue(ready(true));
    const persistedRender = render(<StorageNotice locale="en" />);
    const persistedSlot = slotOf(persistedRender.container);

    expect(persistedSlot.className.split(/\s+/)).toContain("h-5");
    expect(persistedSlot.textContent).toBe("");
    cleanup();

    mocked.mockReturnValue({ status: "unknown" });
    const unknownRender = render(<StorageNotice locale="en" />);
    const unknownSlot = slotOf(unknownRender.container);

    expect(unknownSlot.className.split(/\s+/)).toContain("h-5");
    expect(unknownSlot.textContent).toBe("");
  });
});
