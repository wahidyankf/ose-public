import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { recordVisit, setPageComplete } from "../../../../src/features/learning-progress/core/progress-state";
import type { ProgressState } from "../../../../src/features/learning-progress/core/progress-schema";
// eslint-disable-next-line import/first
import { ContinueLearningCard } from "../../../../src/features/learning-progress/shell/continue-learning-card";
// eslint-disable-next-line import/first
import { learningProgressStore } from "../../../../src/features/learning-progress/shell/progress-storage";
import { BACKEND_TRACK, COURSE_TITLES } from "./lesson-fixtures";

const PATH_ID = BACKEND_TRACK.pathId;

/** The same three-course fixture library the roadmap and lesson tests share, page paths only. */
const SEQUENCES = {
  "just-enough-bash": ["learning/overview", "learning/beginner", "learning/advanced"],
  "backend-essentials": ["learning/overview", "learning/beginner"],
  "sql-essentials": ["learning/beginner", "learning/advanced"],
};

/** Complete every page of `courseIds`, in order, on top of `state`. */
function completeAll(state: ProgressState, courseIds: readonly string[]): ProgressState {
  return courseIds.reduce(
    (next, courseId) =>
      SEQUENCES[courseId as keyof typeof SEQUENCES].reduce(
        (inner, pagePath) => setPageComplete(inner, courseId, pagePath, true),
        next,
      ),
    state,
  );
}

function renderCard(locale = "en") {
  return render(
    <ContinueLearningCard
      locale={locale}
      manifests={[BACKEND_TRACK]}
      courseTitles={COURSE_TITLES}
      sequences={SEQUENCES}
    />,
  );
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("ContinueLearningCard — a new reader sees Start learning (S29)", () => {
  it("offers Start learning with a hint and a link to the career paths section", () => {
    const { container } = renderCard();

    expect(screen.getByText("Start learning")).toBeTruthy();
    expect(screen.getByText("Pick a path below, or browse all courses.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Choose a path" }).getAttribute("href")).toBe("/en/learn#career-paths");
    // Fixed slot: the card keeps its size in every mode, so nothing below it moves (S8).
    expect(container.firstElementChild?.className).toContain("h-44");
    expect(container.firstElementChild?.className).toContain("sm:h-32");
  });

  it("sizes the hero primary auto from sm so it never spans the card on tablet and desktop (DWT-002)", () => {
    renderCard();

    // The card is a column flex container, whose stretch default would keep even a
    // `sm:w-auto` link full-width: `sm:self-start` opts the primary back out of it.
    const classes = screen.getByRole("link", { name: "Choose a path" }).className.split(/\s+/);
    expect(classes).toContain("w-full");
    expect(classes).toContain("sm:w-auto");
    expect(classes).toContain("sm:self-start");
  });

  it("renders the start variant on the server, so hydration never swaps the slot's content size", () => {
    const html = renderToString(
      <ContinueLearningCard
        locale="en"
        manifests={[BACKEND_TRACK]}
        courseTitles={COURSE_TITLES}
        sequences={SEQUENCES}
      />,
    );

    expect(html).toContain("Start learning");
    expect(html).not.toContain("Continue learning");
  });

  it("localizes the start card on the id locale", () => {
    renderCard("id");

    expect(screen.getByText("Mulai belajar")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Pilih jalur" })).toBeTruthy();
  });
});

describe("ContinueLearningCard — a returning reader continues (S28)", () => {
  it("names the remembered path and its next step, and keeps the path in the link", () => {
    learningProgressStore.update((state) =>
      recordVisit(setPageComplete(state, "just-enough-bash", "learning/overview", true), "just-enough-bash", PATH_ID),
    );
    const { container } = renderCard();

    expect(screen.getByText("Continue learning")).toBeTruthy();
    expect(screen.getByText("Backend Track")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Continue:/ });
    expect(link.getAttribute("href")).toBe(`/en/learn/courses/just-enough-bash/learning/beginner?path=${PATH_ID}`);
    expect(link.textContent).toContain("Continue: Just Enough Bash");
    expect(container.firstElementChild?.className).toContain("h-44");
    expect(container.firstElementChild?.className).toContain("sm:h-32");
  });

  it("says the core is finished and links to the path page once every core course is done", () => {
    learningProgressStore.update((state) =>
      completeAll(
        recordVisit(state, "just-enough-bash", PATH_ID),
        BACKEND_TRACK.courseOrder.map((reference) => (typeof reference === "string" ? reference : reference.id)),
      ),
    );
    renderCard();

    expect(screen.getByText("Continue learning")).toBeTruthy();
    expect(screen.getByText("You finished the core of Backend Track.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View path" }).getAttribute("href")).toBe(`/en/learn/paths/${PATH_ID}`);
  });

  it("continues the remembered course when no path is remembered", () => {
    learningProgressStore.update((state) =>
      recordVisit(setPageComplete(state, "sql-essentials", "learning/beginner", true), "sql-essentials", null),
    );
    renderCard();

    expect(screen.getByText("Continue learning")).toBeTruthy();
    expect(screen.getByText("SQL Essentials")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Continue:/ });
    expect(link.getAttribute("href")).toBe("/en/learn/courses/sql-essentials/learning/advanced");
    expect(link.textContent).toContain("Continue: SQL Essentials");
  });

  it("sends a finished remembered course to its landing page", () => {
    learningProgressStore.update((state) => {
      const done = setPageComplete(
        setPageComplete(state, "sql-essentials", "learning/beginner", true),
        "sql-essentials",
        "learning/advanced",
        true,
      );
      return recordVisit(done, "sql-essentials", null);
    });
    renderCard();

    expect(screen.getByRole("link", { name: /Continue:/ }).getAttribute("href")).toBe(
      "/en/learn/courses/sql-essentials",
    );
  });

  it("starts at the path's first course when the remembered path has no progress of its own", () => {
    // A remembered path whose course is done: the next step falls through to the first unfinished
    // core course, so the card still offers a way forward.
    learningProgressStore.update((state) =>
      recordVisit(completeAll(state, ["just-enough-bash"]), "just-enough-bash", PATH_ID),
    );
    renderCard();

    expect(screen.getByRole("link", { name: /Continue:/ }).getAttribute("href")).toBe(
      `/en/learn/courses/backend-essentials?path=${PATH_ID}`,
    );
  });

  it("falls back to the remembered course when the remembered path is not loaded", () => {
    learningProgressStore.update((state) =>
      recordVisit(
        setPageComplete(state, "sql-essentials", "learning/beginner", true),
        "sql-essentials",
        "skills/other",
      ),
    );
    renderCard();

    expect(screen.getByText("SQL Essentials")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Continue:/ }).getAttribute("href")).toBe(
      "/en/learn/courses/sql-essentials/learning/advanced",
    );
  });

  it("falls back to Start learning when the remembered course is not loaded", () => {
    learningProgressStore.update((state) => recordVisit(state, "a-course-that-does-not-exist", null));
    renderCard();

    expect(screen.getByText("Start learning")).toBeTruthy();
  });
});
