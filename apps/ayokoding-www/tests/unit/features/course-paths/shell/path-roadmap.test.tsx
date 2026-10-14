import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import type { RoadmapCourseData } from "../../../../../src/features/course-paths/shell/roadmap-course-card";
// eslint-disable-next-line import/first
import { PathRoadmap } from "../../../../../src/features/course-paths/shell/path-roadmap";
// eslint-disable-next-line import/first
import { learningProgressStore } from "../../../../../src/features/learning-progress/shell/progress-storage";
// eslint-disable-next-line import/first
import { setPageComplete } from "../../../../../src/features/learning-progress/core/progress-state";
import type { ProgressState } from "../../../../../src/features/learning-progress/core/progress-schema";

afterEach(cleanup);

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

const PATH_ID = "careers/immediately-effective/backend-track";

function phasedManifest(): PathManifest {
  return manifestFixture({
    pathId: PATH_ID,
    arc: "immediately-effective",
    title: "Backend Track",
    description: "Write shell scripts, serve an HTTP backend, and store its data.",
    phases: [
      {
        id: "shell-foundations",
        title: "Shell foundations",
        kind: "core",
        outcome: { can: "edit code quickly", cannotYet: "build a backend" },
        courses: ["just-enough-bash", "backend-essentials"],
      },
      {
        id: "data-foundations",
        title: "Data foundations",
        kind: "core",
        outcome: { can: "store and query data" },
        courses: ["sql-essentials"],
      },
      {
        id: "optional-tools",
        title: "Optional other tools",
        kind: "extension",
        courses: ["capstone-secure-service"],
      },
    ],
  });
}

function markedManifest(): PathManifest {
  return manifestFixture({
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
}

const COURSE_CARDS: Record<string, RoadmapCourseData> = {
  "just-enough-bash": { title: "Just Enough Bash", format: "primer", estimatedHours: 3, isOutline: false },
  "backend-essentials": { title: "Backend Essentials", format: "by-example", estimatedHours: 6, isOutline: false },
  "sql-essentials": { title: "SQL Essentials", format: "by-example", estimatedHours: 4, isOutline: false },
  "capstone-secure-service": { title: "Capstone Secure Service", isOutline: true },
  "accounting-foundations": { title: "Accounting Foundations", isOutline: true },
  "journal-entries-and-posting-mechanics": {
    title: "Journal Entries and Posting Mechanics",
    isOutline: true,
  },
};

const SEQUENCES = {
  "just-enough-bash": ["learning/beginner", "learning/advanced"],
  "backend-essentials": ["learning/overview"],
  "sql-essentials": ["learning/beginner"],
  "capstone-secure-service": ["learning/beginner"],
  "accounting-foundations": ["learning/beginner"],
  "journal-entries-and-posting-mechanics": ["learning/beginner", "learning/advanced"],
};

/** Complete every page of `courseId` — a course counts as done only when all of them are done. */
function completeCourse(state: ProgressState, courseId: string): ProgressState {
  return (SEQUENCES[courseId as keyof typeof SEQUENCES] as readonly string[]).reduce(
    (next, pagePath) => setPageComplete(next, courseId, pagePath, true),
    state,
  );
}

function renderRoadmap(manifest: PathManifest, cards: Record<string, RoadmapCourseData> = COURSE_CARDS) {
  return render(<PathRoadmap locale="en" manifest={manifest} courseCards={cards} sequences={SEQUENCES} />);
}

describe("PathRoadmap — core phases (S19)", () => {
  it("keeps the syllabus nav name plan 02 tests rely on and puts the progress card inside it", () => {
    renderRoadmap(phasedManifest());

    const nav = screen.getByRole("navigation", { name: "Backend Track syllabus" });
    expect(within(nav).getByText("Your progress (saved in this browser)")).toBeTruthy();
    expect(within(nav).getByText("0 of 3 core courses done")).toBeTruthy();
  });

  it("renders each core phase as a labelled section with id phase-<id>, its number, title, and outcome lines", () => {
    const { container } = renderRoadmap(phasedManifest());

    const section = container.querySelector("#phase-shell-foundations");
    expect(section).not.toBeNull();
    const heading = within(section as HTMLElement).getByRole("heading", { level: 3 });
    expect(heading.textContent).toContain("Phase 1");
    expect(heading.textContent).toContain("Shell foundations");
    expect(section?.getAttribute("aria-labelledby")).toBe(heading.getAttribute("id"));
    expect(heading.getAttribute("id")).toBe("phase-shell-foundations-heading");
    expect(within(section as HTMLElement).getByText("After this phase you can edit code quickly")).toBeTruthy();
    expect(within(section as HTMLElement).getByText("You cannot yet build a backend")).toBeTruthy();
    // The second core phase is numbered after the first.
    expect(screen.getByRole("heading", { level: 3, name: "Phase 2 · Data foundations" })).toBeTruthy();
  });

  it("numbers core courses continuously and links every card to the course landing page in path context", () => {
    const { container } = renderRoadmap(phasedManifest());

    const coreRows = within(container.querySelector("#phase-shell-foundations") as HTMLElement).getAllByRole(
      "listitem",
    );
    expect(coreRows.map((row) => row.textContent?.match(/^\d+/)?.[0])).toEqual(["1", "2"]);
    expect(
      within(coreRows[0] as HTMLElement)
        .getByRole("link", { name: "Just Enough Bash" })
        .getAttribute("href"),
    ).toBe(`/en/learn/courses/just-enough-bash?path=${PATH_ID}`);
    expect(
      within(coreRows[1] as HTMLElement)
        .getByRole("link", { name: "Backend Essentials" })
        .getAttribute("href"),
    ).toBe(`/en/learn/courses/backend-essentials?path=${PATH_ID}`);
    // The position continues into the second phase, never restarting at 1.
    const secondPhaseRows = within(container.querySelector("#phase-data-foundations") as HTMLElement).getAllByRole(
      "listitem",
    );
    expect(secondPhaseRows[0]?.textContent?.match(/^\d+/)?.[0]).toBe("3");
  });

  it("heads the core with its core-phase count and the core courses' hours (Path Hours)", () => {
    renderRoadmap(phasedManifest());

    const heading = screen.getByRole("heading", { level: 2, name: /Core path/ });
    expect(heading.textContent).toContain("Core path · 2 phases");
    expect(heading.textContent).toContain("About 13 h");
    expect(heading.textContent).not.toContain("plus");
  });

  it("appends the outline suffix when a core course has no estimate", () => {
    const cards = {
      ...COURSE_CARDS,
      "backend-essentials": { title: "Backend Essentials", isOutline: true },
    };
    renderRoadmap(phasedManifest(), cards);

    const heading = screen.getByRole("heading", { level: 2, name: /Core path/ });
    expect(heading.textContent).toContain("About 7 h");
    expect(heading.textContent).toContain("plus 1 outline courses");
  });

  it("counts a phase's courses as done only when a whole course is done (S19)", () => {
    learningProgressStore.update((state) => completeCourse(state, "just-enough-bash"));
    const { container } = renderRoadmap(phasedManifest());

    const section = within(container.querySelector("#phase-shell-foundations") as HTMLElement);
    expect(section.getByText("In progress")).toBeTruthy();
    expect(section.getByText("1 of 2 done")).toBeTruthy();
    expect(section.getByText("Done")).toBeTruthy();
  });
});

describe("PathRoadmap — the headline counts core courses only (S24, S25)", () => {
  it("ignores a completed extension course in the headline while its own phase shows the count", () => {
    learningProgressStore.update((state) => completeCourse(state, "capstone-secure-service"));
    const { container } = renderRoadmap(phasedManifest());

    expect(screen.getByText("0 of 3 core courses done")).toBeTruthy();
    const summary = container.querySelector("details summary");
    expect(summary?.textContent).toContain("Done");
    expect(summary?.textContent).toContain("1 of 1 done");
  });

  it("reports the core path complete, with no Start or Continue button, once every core course is done", () => {
    learningProgressStore.update((state) =>
      completeCourse(completeCourse(completeCourse(state, "just-enough-bash"), "backend-essentials"), "sql-essentials"),
    );
    renderRoadmap(phasedManifest());

    expect(screen.getByText("Core path complete. The optional extensions are below.")).toBeTruthy();
    expect(screen.getByText("3 of 3 core courses done")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Start:|Continue:/ })).toBeNull();
  });
});

describe("PathRoadmap — optional extensions are separate and closed by default (S23)", () => {
  it("renders the Optional extensions heading with plan 02's note after the last core phase", () => {
    const { container } = renderRoadmap(phasedManifest());

    const heading = screen.getByRole("heading", { level: 2, name: "Optional extensions" });
    const coreHeading = screen.getByRole("heading", { level: 2, name: /Core path/ });
    expect(coreHeading.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(container.textContent).toContain("Take these after the core");
  });

  it("keeps every extension phase in a closed details element listing its title, count, and progress", () => {
    const { container } = renderRoadmap(phasedManifest());

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.hasAttribute("open")).toBe(false);
    const summary = details?.querySelector("summary");
    expect(summary?.textContent).toContain("Optional other tools");
    expect(summary?.textContent).toContain("1 course");
    expect(summary?.textContent).toContain("0 of 1 done");
    expect(summary?.textContent).not.toContain("Phase");
    // The cards are in the DOM (so opening the section reveals them) with the next position number.
    const row = details?.querySelector("ol > li");
    expect(row?.textContent).toMatch(/^4\s*Capstone Secure Service/);
  });
});

describe("PathRoadmap — a path waiting for its restructure shows one flat list (S26)", () => {
  it("renders one list of every course in today's order, with no phase heading, outcome, or extensions", () => {
    const { container } = renderRoadmap(markedManifest());

    const nav = screen.getByRole("navigation", { name: "Conventional Accounting syllabus" });
    const rows = within(nav).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toMatch(/^1\s*Accounting Foundations/);
    expect(rows[1]?.textContent).toMatch(/^2\s*Journal Entries and Posting Mechanics/);
    // Every row still links into path context, and states its status in words (S26).
    expect(
      within(rows[0] as HTMLElement)
        .getByRole("link", { name: "Accounting Foundations" })
        .getAttribute("href"),
    ).toBe(`/en/learn/courses/accounting-foundations?path=skills/conventional-accounting`);
    expect(within(rows[0] as HTMLElement).getByText("Not started")).toBeTruthy();

    expect(container.querySelectorAll("h3")).toHaveLength(0);
    expect(screen.queryByText("After this phase you can", { exact: false })).toBeNull();
    expect(screen.queryByText("Optional extensions")).toBeNull();
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByText("Outline")).toBeNull();
  });

  it("counts every course in the headline and heads the list with the course count", () => {
    learningProgressStore.update((state) => completeCourse(state, "accounting-foundations"));
    renderRoadmap(markedManifest());

    expect(screen.getByText("1 of 2 courses done")).toBeTruthy();
    expect(screen.getByText("2 courses")).toBeTruthy();
  });
});
