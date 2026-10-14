import { cleanup, render, screen, within } from "@testing-library/react";
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
import { CareersArcSections } from "../../../../../src/features/course-paths/shell/careers-arc-sections";
// eslint-disable-next-line import/first
import type { RoadmapCourseData } from "../../../../../src/features/course-paths/shell/roadmap-course-card";

/** The immediately-effective arc: two roles, one of them with an optional extension phase. */
const BACKEND = manifestFixture({
  pathId: "careers/immediately-effective/backend-track",
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

const FRONTEND = manifestFixture({
  pathId: "careers/immediately-effective/frontend-track",
  arc: "immediately-effective",
  title: "Frontend Track",
  description: "Build the browser-facing half of a product.",
  courses: ["just-enough-python"],
});

const GENERALIST = manifestFixture({
  pathId: "careers/fundamentally-strong/generalist-track",
  arc: "fundamentally-strong",
  title: "Generalist Track",
  description: "Start broad before you specialise.",
  courses: ["just-enough-python"],
});

const COURSE_TITLES = {
  "just-enough-bash": "Just Enough Bash",
  "backend-essentials": "Backend Essentials",
  "sql-essentials": "SQL Essentials",
  "just-enough-python": "Just Enough Python",
};

const COURSE_CARDS: Record<string, RoadmapCourseData> = {
  "just-enough-bash": { title: "Just Enough Bash", estimatedHours: 4, isOutline: false },
  "backend-essentials": { title: "Backend Essentials", estimatedHours: 6, isOutline: false },
  "sql-essentials": { title: "SQL Essentials", isOutline: true },
  "just-enough-python": { title: "Just Enough Python", estimatedHours: 3, isOutline: false },
};

const SEQUENCES = {
  "just-enough-bash": ["learning/overview", "learning/beginner"],
  "backend-essentials": ["learning/overview"],
  "sql-essentials": ["learning/beginner"],
  "just-enough-python": ["learning/overview"],
};

const SECTIONS = [
  { arc: "immediately-effective", arcTitle: "Immediately-Effective", manifests: [BACKEND, FRONTEND] },
  { arc: "fundamentally-strong", arcTitle: "Fundamentally Strong", manifests: [GENERALIST] },
];

function renderSections(sections = SECTIONS) {
  return render(
    <CareersArcSections
      locale="en"
      sections={sections}
      courseTitles={COURSE_TITLES}
      courseCards={COURSE_CARDS}
      sequences={SEQUENCES}
    />,
  );
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("CareersArcSections", () => {
  it("renders one section per arc, each headed by a link to that arc's page", () => {
    renderSections();

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["Immediately-Effective", "Fundamentally Strong"]);
    expect(screen.getByRole("link", { name: "Immediately-Effective" }).getAttribute("href")).toBe(
      "/en/learn/paths/careers/immediately-effective",
    );
    expect(screen.getByRole("link", { name: "Fundamentally Strong" }).getAttribute("href")).toBe(
      "/en/learn/paths/careers/fundamentally-strong",
    );
  });

  it("renders one path card per manifest inside its own arc's section", () => {
    const { container } = renderSections();

    const immediate = container.querySelector("section[aria-labelledby='careers-arc-immediately-effective']");
    const fundamental = container.querySelector("section[aria-labelledby='careers-arc-fundamentally-strong']");
    expect(immediate?.querySelectorAll(":scope > ul > li").length).toBe(2);
    expect(fundamental?.querySelectorAll(":scope > ul > li").length).toBe(1);
    // Each card keeps the shared LearnPathCard shape: a title link plus a "View path" control.
    expect(
      within(immediate as HTMLElement)
        .getByRole("link", { name: "Backend Track" })
        .getAttribute("href"),
    ).toBe("/en/learn/paths/careers/immediately-effective/backend-track");
    expect(
      within(immediate as HTMLElement)
        .getAllByRole("link", { name: /View path/ })
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "/en/learn/paths/careers/immediately-effective/backend-track",
      "/en/learn/paths/careers/immediately-effective/frontend-track",
    ]);
  });

  it("carries each path's progress in words", () => {
    learningProgressStore.update((state) =>
      SEQUENCES["just-enough-bash"].reduce(
        (next, pagePath) => setPageComplete(next, "just-enough-bash", pagePath, true),
        state,
      ),
    );
    renderSections();

    const backedUp = screen.getByRole("link", { name: "Backend Track" }).closest("li") as HTMLElement;
    expect(backedUp.textContent).toContain("1 of 2 core courses done");
    expect(backedUp.textContent).toContain("In progress");
    const untouched = screen.getByRole("link", { name: "Frontend Track" }).closest("li") as HTMLElement;
    expect(untouched.textContent).toContain("0 of 1 core courses done");
    expect(untouched.textContent).toContain("Not started");
  });

  it("renders no path card and no heading when no arc has a manifest", () => {
    const { container } = renderSections([]);

    expect(screen.queryAllByRole("heading", { level: 2 })).toEqual([]);
    expect(container.querySelectorAll("li").length).toBe(0);
  });
});
