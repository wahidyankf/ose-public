import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setPageComplete } from "@/features/learning-progress/core/progress-state";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
import { manifestFixture } from "../manifest-fixture";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { LearnPathCard } from "../../../../../src/features/course-paths/shell/learn-path-card";
// eslint-disable-next-line import/first
import type { RoadmapCourseData } from "../../../../../src/features/course-paths/shell/roadmap-course-card";

const PATH_ID = "careers/immediately-effective/backend-track";

const MANIFEST = manifestFixture({
  pathId: PATH_ID,
  arc: "immediately-effective",
  title: "Backend Track",
  description: "Write shell scripts, serve an HTTP backend, and store its data.",
  goals: ["sql-essentials"],
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
  description: "A mechanical one-phase shape awaiting its content plan.",
  restructurePendingIn: "plan-06",
  phases: [
    {
      id: "all-courses",
      title: "All courses",
      kind: "core",
      courses: ["accounting-foundations", "journal-entries-and-posting-mechanics"],
    },
  ],
});

const COURSE_TITLES = {
  "just-enough-bash": "Just Enough Bash",
  "backend-essentials": "Backend Essentials",
  "sql-essentials": "SQL Essentials",
  "accounting-foundations": "Accounting Foundations",
  "journal-entries-and-posting-mechanics": "Journal Entries and Posting Mechanics",
};

function courseCards(withoutEstimate: readonly string[] = []): Record<string, RoadmapCourseData> {
  const cards: Record<string, RoadmapCourseData> = {};
  for (const [courseId, title] of Object.entries(COURSE_TITLES)) {
    cards[courseId] = {
      title,
      ...(withoutEstimate.includes(courseId) ? {} : { estimatedHours: courseId === "backend-essentials" ? 6 : 3 }),
      isOutline: courseId === "sql-essentials",
    };
  }
  return cards;
}

const SEQUENCES = {
  "just-enough-bash": ["learning/overview", "learning/beginner"],
  "backend-essentials": ["learning/overview"],
  "sql-essentials": ["learning/beginner"],
  "accounting-foundations": ["learning/beginner"],
  "journal-entries-and-posting-mechanics": ["learning/beginner"],
};

function renderCard(manifest = MANIFEST, cards = courseCards()) {
  return render(
    <LearnPathCard
      locale="en"
      manifest={manifest}
      courseTitles={COURSE_TITLES}
      courseCards={cards}
      sequences={SEQUENCES}
    />,
  );
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("LearnPathCard", () => {
  it("links its title and its View path control to the path page", () => {
    renderCard();

    const href = `/en/learn/paths/${PATH_ID}`;
    expect(screen.getByRole("link", { name: "Backend Track" }).getAttribute("href")).toBe(href);
    expect(screen.getByRole("link", { name: /View path/ }).getAttribute("href")).toBe(href);
  });

  it("shows who the path is for, its goal, its size, and its time", () => {
    const { container } = renderCard();

    expect(screen.getByText("Write shell scripts, serve an HTTP backend, and store its data.")).toBeTruthy();
    expect(screen.getByText(/Goal:/).textContent).toContain("SQL Essentials");
    expect(container.textContent).toContain("1 core phase · 1 optional");
    expect(container.textContent).toContain("About 9 h");
  });

  it("says how many courses a path counts while it waits for its restructure", () => {
    const { container } = renderCard(MARKED);

    expect(container.textContent).toContain("2 courses");
    expect(container.textContent).not.toContain("core phases");
    expect(container.textContent).not.toContain("optional");
  });

  it("notes the outline courses that have no time estimate", () => {
    const { container } = renderCard(MANIFEST, courseCards(["backend-essentials"]));

    expect(container.textContent).toContain("About 3 h");
    expect(container.textContent).toContain("plus 1 outline courses");
  });

  it("omits the goal line for a path with no goals", () => {
    renderCard(MARKED);

    expect(screen.queryByText(/Goal:/)).toBeNull();
  });

  it("carries the path's progress in words", () => {
    // Path progress counts whole courses: every page of "just-enough-bash" is complete.
    learningProgressStore.update((state) =>
      SEQUENCES["just-enough-bash"].reduce(
        (next, pagePath) => setPageComplete(next, "just-enough-bash", pagePath, true),
        state,
      ),
    );
    renderCard();

    expect(screen.getByText("1 of 2 core courses done")).toBeTruthy();
  });

  it("localizes its labels on the id locale", () => {
    render(
      <LearnPathCard
        locale="id"
        manifest={MANIFEST}
        courseTitles={COURSE_TITLES}
        courseCards={courseCards()}
        sequences={SEQUENCES}
      />,
    );

    expect(screen.getByText(/Tujuan:/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Lihat jalur/ })).toBeTruthy();
  });
});
