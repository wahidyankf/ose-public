import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setPageComplete } from "@/features/learning-progress/core/progress-state";
import type { ProgressState } from "@/features/learning-progress/core/progress-schema";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
import { manifestFixture } from "../manifest-fixture";
import { PathCardProgress } from "../../../../../src/features/course-paths/shell/path-card-progress";

const MANIFEST = manifestFixture({
  pathId: "careers/immediately-effective/backend-track",
  arc: "immediately-effective",
  title: "Backend Track",
  phases: [
    {
      id: "shell-foundations",
      title: "Shell foundations",
      kind: "core",
      outcome: { can: "edit code quickly" },
      courses: ["just-enough-bash", "backend-essentials"],
    },
    {
      id: "optional-shell",
      title: "Optional shell workflow",
      kind: "extension",
      courses: ["sql-essentials"],
    },
  ],
});

const MARKED = manifestFixture({
  pathId: "skills/conventional-accounting",
  arc: "conventional-accounting",
  title: "Conventional Accounting",
  restructurePendingIn: "plan-06",
  phases: [
    {
      id: "all-courses",
      title: "All courses",
      kind: "core",
      courses: ["accounting-foundations", "journal-entries-and-posting-mechanics", "financial-statements"],
    },
  ],
});

const SEQUENCES = {
  "just-enough-bash": ["learning/overview", "learning/beginner"],
  "backend-essentials": ["learning/overview"],
  "sql-essentials": ["learning/beginner"],
  "accounting-foundations": ["learning/beginner"],
  "journal-entries-and-posting-mechanics": ["learning/beginner"],
  "financial-statements": ["learning/beginner"],
};

function renderProgress(locale = "en", manifest = MANIFEST) {
  return render(<PathCardProgress locale={locale} manifest={manifest} sequences={SEQUENCES} />);
}

/** Complete every page of `courseId` — path progress counts whole courses, not pages. */
function completeCourse(state: ProgressState, courseId: keyof typeof SEQUENCES): ProgressState {
  return SEQUENCES[courseId].reduce((next, pagePath) => setPageComplete(next, courseId, pagePath, true), state);
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("PathCardProgress", () => {
  it("shows a fixed-size placeholder instead of a count before progress is known", () => {
    const html = renderToString(<PathCardProgress locale="en" manifest={MANIFEST} sequences={SEQUENCES} />);

    expect(html).toContain("bg-muted");
    expect(html).not.toContain("core courses done");
  });

  it("reports a core path's course progress in words with its status", () => {
    learningProgressStore.update((state) => completeCourse(state, "just-enough-bash"));
    const { container } = renderProgress();

    expect(screen.getByText("1 of 2 core courses done")).toBeTruthy();
    expect(screen.getByText("In progress")).toBeTruthy();
    expect(container.firstElementChild?.className).toContain("h-5");
  });

  it("reads Done once every core course is finished", () => {
    learningProgressStore.update((state) =>
      setPageComplete(completeCourse(state, "just-enough-bash"), "backend-essentials", "learning/overview", true),
    );
    renderProgress();

    expect(screen.getByText("2 of 2 core courses done")).toBeTruthy();
    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("counts every course of a path waiting for its restructure", () => {
    learningProgressStore.update((state) =>
      setPageComplete(state, "accounting-foundations", "learning/beginner", true),
    );
    renderProgress("en", MARKED);

    expect(screen.getByText("1 of 3 courses done")).toBeTruthy();
    expect(screen.queryByText(/core courses done/)).toBeNull();
  });

  it("localizes the count and the status on the id locale", () => {
    learningProgressStore.update((state) => completeCourse(state, "just-enough-bash"));
    renderProgress("id");

    expect(screen.getByText("1 dari 2 kursus inti selesai")).toBeTruthy();
    expect(screen.getByText("Sedang berjalan")).toBeTruthy();
  });

  it("says Not started for a path nobody has touched", () => {
    renderProgress();

    expect(screen.getByText("0 of 2 core courses done")).toBeTruthy();
    expect(screen.getByText("Not started")).toBeTruthy();
  });

  it("keeps the hydrated row on the placeholder's 20px line so progress never shifts the card (S8)", () => {
    learningProgressStore.update((state) => completeCourse(state, "just-enough-bash"));
    const { container } = renderProgress();

    // The served placeholder box is min-h-5 (20px). The hydrated row must resolve its anonymous
    // text (the "·" separator) at the same text-sm line — at the body's 24px line the row grows
    // 20 → 24px and shifts every card below it on the Learn home.
    const slot = container.querySelector('[data-progress-slot="path-card-progress"]');
    expect((slot?.className ?? "").split(/\s+/)).toContain("text-sm");
  });

  it("wraps its row instead of overflowing the viewport, and never breaks a label mid-word (DWT-004)", () => {
    learningProgressStore.update((state) => completeCourse(state, "just-enough-bash"));
    const { container } = renderProgress();

    // S38: the row may wrap (flex-wrap + growing min-h) but must never force page-level
    // horizontal scroll with a fixed-height nowrap row, the 768px overflow this fixes.
    const slot = container.querySelector('[data-progress-slot="path-card-progress"]');
    const slotTokens = (slot?.className ?? "").split(/\s+/);
    expect(slotTokens).toContain("flex-wrap");
    expect(slotTokens).toContain("min-h-5");
    expect(slotTokens).not.toContain("h-5");
    // The count may move to the next line, but neither it nor the status label may break
    // mid-label the way 375px rendered "Not / started".
    const count = screen.getByText("1 of 2 core courses done");
    expect(count.className.split(/\s+/)).not.toContain("whitespace-nowrap");
    const label = screen.getByText("In progress").closest("span");
    expect(label?.className.split(/\s+/)).toContain("whitespace-nowrap");
  });
});
