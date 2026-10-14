import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setPageComplete } from "@/features/learning-progress/core/progress-state";
import { CourseProgressSummary } from "@/features/learning-progress/shell/course-progress-summary";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
import { BASH_SEQUENCE } from "./lesson-fixtures";

afterEach(cleanup);

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

const COURSE_ID = "just-enough-bash";
const PAGE_PATHS = BASH_SEQUENCE.map((page) => page.pagePath);

function summary(locale = "en") {
  return <CourseProgressSummary locale={locale} courseId={COURSE_ID} sequence={PAGE_PATHS} />;
}

function complete(pagePaths: readonly string[]): void {
  learningProgressStore.update((state) =>
    pagePaths.reduce((next, pagePath) => setPageComplete(next, COURSE_ID, pagePath, true), state),
  );
}

describe("CourseProgressSummary — the server render", () => {
  it("shows placeholders instead of a count, so nothing moves when progress arrives", () => {
    const html = renderToString(summary());

    expect(html).toContain("inline-block rounded bg-muted");
    // Hidden until hydration: a fresh reader must not read a wrong count off the static HTML.
    expect(html).not.toContain("pages done");
    expect(html).not.toContain("Not started");
  });

  it("keeps the fixed h-16 slot in every mode", () => {
    const server = renderToString(summary());
    expect(server).toContain("h-16");

    const { container } = render(summary());
    expect(container.firstElementChild?.className).toContain("h-16");
  });
});

describe("CourseProgressSummary — a reader's own progress", () => {
  it("states the not-started status and the page count in words", () => {
    const { container } = render(summary());

    expect(screen.getByText("Not started")).toBeTruthy();
    expect(screen.getByText("0 of 3 pages done")).toBeTruthy();
    expect(screen.getByText("Saved in this browser")).toBeTruthy();
    expect(container.querySelector(".bg-primary")).not.toBeNull();
  });

  it("reports an in-progress course once some pages are done", () => {
    complete(["learning/overview", "learning/beginner"]);
    const { container } = render(summary());

    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.getByText("2 of 3 pages done")).toBeTruthy();
    expect(container.querySelector(".bg-amber-700")).not.toBeNull();
  });

  it("reports a finished course once every page is done", () => {
    complete(PAGE_PATHS);
    const { container } = render(summary());

    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.getByText("3 of 3 pages done")).toBeTruthy();
    expect(container.querySelector(".bg-green-700")).not.toBeNull();
  });

  it("localizes the status, the count, and the storage note on the id locale", () => {
    complete(["learning/overview"]);
    render(summary("id"));

    expect(screen.getByText("Sedang berjalan")).toBeTruthy();
    expect(screen.getByText("1 dari 3 halaman selesai")).toBeTruthy();
    expect(screen.getByText("Tersimpan di browser ini")).toBeTruthy();
  });
});
