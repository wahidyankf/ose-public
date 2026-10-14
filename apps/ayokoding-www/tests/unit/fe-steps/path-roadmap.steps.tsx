import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PathLanding } from "@/features/course-paths/shell/path-landing";
// eslint-disable-next-line import/first
import type { RoadmapCourseData } from "@/features/course-paths/shell/roadmap-course-card";
// eslint-disable-next-line import/first
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
// eslint-disable-next-line import/first
import type { SequenceIndex } from "@/features/learning-progress/core/progress-derivations";
// eslint-disable-next-line import/first
import { setPageComplete } from "@/features/learning-progress/core/progress-state";
// eslint-disable-next-line import/first
import type { ProgressState } from "@/features/learning-progress/core/progress-schema";
// eslint-disable-next-line import/first
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";

// ---------------------------------------------------------------------------
// plan ayokoding-learn-revamp-04-learning-experience, Phase 4 — the path roadmap
// (course-paths/path-roadmap.feature, S19–S26). The browser bindings for the same scenarios live in
// `apps/ayokoding-www-fe-e2e/tests/e2e/steps/path-roadmap.steps.ts`.
//
// The fixture path is synthetic: two core phases — the first declaring both outcome lines, the
// second only what the reader can do — plus one extension phase whose course is an outline course.
// That covers every branch the feature names, including a phase that declares no `cannotYet` and an
// outline card that shows the badge instead of an estimate. The marked skills path is the
// mechanical pending-restructure shape, exactly as `skills/conventional-accounting` ships it.
// ---------------------------------------------------------------------------

const PATH_ID = "careers/fundamentally-strong/generalist-track";
const FIRST_COURSE = "computer-science-foundations";
const SECOND_COURSE = "software-engineering-practices";
const THIRD_COURSE = "data-structures-and-algorithms-essentials";
const EXTENSION_COURSE = "capstone-secure-service";

const ACCOUNTING_PATH_ID = "skills/conventional-accounting";
const ACCOUNTING_COURSES = ["accounting-foundations", "journal-entries-and-posting-mechanics"] as const;

/** The path's core courses, in path order — what the headline counts and "done" applies to. */
const CORE_COURSES = [FIRST_COURSE, SECOND_COURSE, THIRD_COURSE] as const;

/** The first and second pages of the second core course — where "Continue" must resume. */
const SECOND_COURSE_FIRST_PAGE = "learning/overview";
const SECOND_COURSE_NEXT_PAGE = "learning/beginner";

function roadmapManifest(): PathManifest {
  return manifestFixture({
    pathId: PATH_ID,
    arc: "fundamentally-strong",
    title: "Generalist Track",
    description: "A deep route through the foundations.",
    phases: [
      {
        id: "foundations",
        title: "Foundations",
        kind: "core",
        outcome: { can: "build a small service", cannotYet: "run it in production" },
        courses: [FIRST_COURSE, SECOND_COURSE],
      },
      {
        id: "depth",
        title: "Depth",
        kind: "core",
        outcome: { can: "reason about a system's limits" },
        courses: [THIRD_COURSE],
      },
      {
        id: "practice",
        title: "Optional practice",
        kind: "extension",
        courses: [EXTENSION_COURSE],
      },
    ],
  });
}

function markedManifest(): PathManifest {
  return manifestFixture({
    pathId: ACCOUNTING_PATH_ID,
    arc: "conventional-accounting",
    title: "Conventional Accounting",
    description: "A mechanical one-phase shape awaiting its content plan.",
    restructurePendingIn: "plan-06",
    phases: [
      {
        id: "all-courses",
        title: "All courses",
        kind: "core",
        courses: [...ACCOUNTING_COURSES],
      },
    ],
  });
}

const COURSE_TITLES: Record<string, string> = {
  [FIRST_COURSE]: "Computer Science Foundations",
  [SECOND_COURSE]: "Software Engineering Practices",
  [THIRD_COURSE]: "Data Structures & Algorithms Essentials",
  [EXTENSION_COURSE]: "Capstone · Secure Service",
  [ACCOUNTING_COURSES[0]]: "Accounting Foundations",
  [ACCOUNTING_COURSES[1]]: "Journal Entries and Posting Mechanics",
};

const COURSE_CARDS: Record<string, RoadmapCourseData> = {
  [FIRST_COURSE]: {
    title: "Computer Science Foundations",
    format: "annotated-concept",
    estimatedHours: 5,
    isOutline: false,
  },
  [SECOND_COURSE]: {
    title: "Software Engineering Practices",
    format: "annotated-concept",
    estimatedHours: 5,
    isOutline: false,
  },
  [THIRD_COURSE]: {
    title: "Data Structures & Algorithms Essentials",
    format: "primer",
    estimatedHours: 6,
    isOutline: false,
  },
  [EXTENSION_COURSE]: { title: "Capstone · Secure Service", isOutline: true },
  [ACCOUNTING_COURSES[0]]: { title: "Accounting Foundations", isOutline: true },
  [ACCOUNTING_COURSES[1]]: { title: "Journal Entries and Posting Mechanics", isOutline: true },
};

/** Every course's lesson page paths — a course counts as done only when all of them are done. */
const SEQUENCES: SequenceIndex = {
  [FIRST_COURSE]: ["learning/overview", "learning/beginner"],
  [SECOND_COURSE]: [SECOND_COURSE_FIRST_PAGE, SECOND_COURSE_NEXT_PAGE],
  [THIRD_COURSE]: ["learning/beginner"],
  [EXTENSION_COURSE]: ["learning/beginner", "learning/advanced"],
  [ACCOUNTING_COURSES[0]]: ["learning/overview", "learning/beginner"],
  [ACCOUNTING_COURSES[1]]: ["learning/beginner"],
};

/** Render the path page every scenario opens; each render starts from a clean tree. */
function renderPathLanding(manifest: PathManifest = roadmapManifest()): void {
  cleanup();
  render(
    <PathLanding
      locale="en"
      manifest={manifest}
      courseTitles={COURSE_TITLES}
      courseCards={COURSE_CARDS}
      sequences={SEQUENCES}
    />,
  );
}

function generalistNav(): HTMLElement {
  return screen.getByRole("navigation", { name: "Generalist Track syllabus" });
}

function accountingNav(): HTMLElement {
  return screen.getByRole("navigation", { name: "Conventional Accounting syllabus" });
}

/** The roadmap's core phase sections, in path order. */
function coreSections(): HTMLElement[] {
  return Array.from(generalistNav().querySelectorAll<HTMLElement>("section[id^='phase-']"));
}

/** Every roadmap course row, core phases first and the extension's own cards last. */
function courseRows(nav: HTMLElement = generalistNav()): HTMLElement[] {
  return Array.from(nav.querySelectorAll<HTMLElement>("ol > li"));
}

/** The one extension phase, rendered as a closed `<details>` section. */
function extensionSection(): HTMLDetailsElement {
  const details = generalistNav().querySelector("details");
  if (details === null) {
    throw new Error("the roadmap rendered no extension section");
  }
  return details as HTMLDetailsElement;
}

/** A course's lesson page paths, in sequence order. */
function sequenceOf(courseId: string): readonly string[] {
  return SEQUENCES[courseId] ?? [];
}

/**
 * The completed page paths the store holds for `courseId` — what the UI renders from. Sorted,
 * because a record the store has written is re-read in `serializeProgress`'s sorted order.
 */
function completedPagesFor(courseId: string): readonly string[] {
  const snapshot = learningProgressStore.getSnapshot();
  const pages = snapshot.status === "ready" ? (snapshot.state.completed[courseId] ?? []) : [];
  return [...pages].sort();
}

/** Every page of `courseId`, in sorted order — the comparison form of `sequenceOf`. */
function sortedSequenceOf(courseId: string): readonly string[] {
  return [...sequenceOf(courseId)].sort();
}

/** Complete every page of `courseId`: a course counts as done only when all of them are done. */
function completeEveryPage(state: ProgressState, courseId: string): ProgressState {
  return sequenceOf(courseId).reduce((next, pagePath) => setPageComplete(next, courseId, pagePath, true), state);
}

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-roadmap.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      learningProgressStore.reset();
      window.localStorage.clear();
    });
  });

  Scenario("Each core phase is a milestone with its outcome and progress", ({ When, Then, And }) => {
    When("a reader opens a path page", () => {
      renderPathLanding();
    });

    Then(
      'each core phase shows its number, title, and "After this phase you can" outcome when the path defines one',
      () => {
        const nav = generalistNav();
        expect(within(nav).getByRole("heading", { level: 3, name: "Phase 1 · Foundations" })).toBeTruthy();
        expect(within(nav).getByRole("heading", { level: 3, name: "Phase 2 · Depth" })).toBeTruthy();

        const [foundations, depth] = coreSections();
        expect(
          within(foundations as HTMLElement).getByText("After this phase you can build a small service"),
        ).toBeTruthy();
        expect(within(foundations as HTMLElement).getByText("You cannot yet run it in production")).toBeTruthy();
        // The second core phase declares only what the reader can do, so it states that line alone.
        expect(
          within(depth as HTMLElement).getByText("After this phase you can reason about a system's limits"),
        ).toBeTruthy();
        expect(within(depth as HTMLElement).queryByText("You cannot yet", { exact: false })).toBeNull();
      },
    );

    And('each core phase shows "x of y done" for its courses', () => {
      const [foundations, depth] = coreSections();
      expect(within(foundations as HTMLElement).getByText("0 of 2 done")).toBeTruthy();
      expect(within(depth as HTMLElement).getByText("0 of 1 done")).toBeTruthy();
    });
  });

  Scenario("Course cards show order, time, format, and status in words", ({ When, Then, And }) => {
    When("a reader opens a path page", () => {
      renderPathLanding();
    });

    Then("each course card shows its position number, title, estimated time, and format", () => {
      const rows = courseRows();
      // Two core courses in the first phase, the third in the second, then the extension's course.
      expect(rows).toHaveLength(4);

      const [first, second, third] = rows as [HTMLElement, HTMLElement, HTMLElement];
      expect(first.textContent).toMatch(/^1\s*Computer Science Foundations/u);
      expect(within(first).getByRole("link", { name: "Computer Science Foundations" })).toBeTruthy();
      expect(within(first).getByText("Concept walkthrough")).toBeTruthy();
      expect(within(first).getByText("About 5 h")).toBeTruthy();

      expect(second.textContent).toMatch(/^2\s*Software Engineering Practices/u);
      expect(within(second).getByText("About 5 h")).toBeTruthy();

      expect(third.textContent).toMatch(/^3\s*Data Structures & Algorithms Essentials/u);
      expect(within(third).getByText("Language primer")).toBeTruthy();
    });

    And('each course card shows "Done", "In progress", or "Not started" as text', () => {
      const rows = courseRows();
      expect(rows).toHaveLength(4);

      for (const row of rows) {
        // The status is a word a reader can read, never a colour alone. A row's own text runs its
        // parts together, so the status is asserted on the label element that carries it.
        expect(within(row).getByText(/^(Done|In progress|Not started)$/u)).toBeTruthy();
      }
      // A reader who has marked nothing sees the not-started words.
      expect(within(rows[0] as HTMLElement).getByText("Not started", { exact: true })).toBeTruthy();
    });

    And('an outline course card shows an "Outline" badge', () => {
      const outlineRow = courseRows()[3] as HTMLElement;
      expect(outlineRow.textContent).toContain("Capstone · Secure Service");
      expect(within(outlineRow).getByText("Outline", { exact: true })).toBeTruthy();
      // An outline course declares no estimate, so the badge stands where the hours text would be.
      expect(outlineRow.textContent).not.toContain("About");
    });
  });

  Scenario("A new reader sees one Start button", ({ Given, When, Then, And }) => {
    Given("a reader has no saved progress", () => {
      learningProgressStore.reset();
      window.localStorage.clear();
      expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    });

    When("the reader opens a path page", () => {
      renderPathLanding();
    });

    Then('exactly one primary button reads "Start:" followed by the first course\'s title', () => {
      const buttons = within(generalistNav()).getAllByRole("link", { name: /^(Start|Continue):/ });
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.textContent).toBe("Start: Computer Science Foundations");
    });

    And("it links to that course's landing page in path context", () => {
      const button = within(generalistNav()).getByRole("link", { name: /^Start:/ });
      expect(button.getAttribute("href")).toBe(`/en/learn/courses/${FIRST_COURSE}?path=${PATH_ID}`);
    });
  });

  Scenario("A returning reader sees Continue with the next course", ({ Given, When, Then, And }) => {
    Given("a reader completed some learning pages of the path's second course", () => {
      learningProgressStore.update((state) =>
        setPageComplete(completeEveryPage(state, FIRST_COURSE), SECOND_COURSE, SECOND_COURSE_FIRST_PAGE, true),
      );
      // The reader finished the first course and started the second, so the second is the first
      // unfinished core course — exactly when a path offers "Continue".
      expect(completedPagesFor(FIRST_COURSE)).toEqual(sortedSequenceOf(FIRST_COURSE));
      expect(completedPagesFor(SECOND_COURSE)).toEqual([SECOND_COURSE_FIRST_PAGE]);
    });

    When("the reader opens the path page", () => {
      renderPathLanding();
    });

    Then('the primary button reads "Continue:" followed by the second course\'s title', () => {
      const buttons = within(generalistNav()).getAllByRole("link", { name: /^(Start|Continue):/ });
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.textContent).toBe("Continue: Software Engineering Practices");
    });

    And("it links to the first learning page of that course the reader has not completed", () => {
      const button = within(generalistNav()).getByRole("link", { name: /^Continue:/ });
      expect(button.getAttribute("href")).toBe(
        `/en/learn/courses/${SECOND_COURSE}/${SECOND_COURSE_NEXT_PAGE}?path=${PATH_ID}`,
      );
      // Never back to the page the reader already completed.
      expect(button.getAttribute("href")).not.toContain(SECOND_COURSE_FIRST_PAGE);
    });
  });

  Scenario("Optional extensions are separate and closed by default", ({ When, Then, And }) => {
    When("a reader opens a path that has extension phases", () => {
      renderPathLanding();
    });

    Then('an "Optional extensions" heading follows the last core phase', () => {
      const nav = generalistNav();
      const extensionsHeading = within(nav).getByRole("heading", { level: 2, name: "Optional extensions" });
      const lastCorePhase = coreSections()[1] as HTMLElement;
      expect(lastCorePhase.compareDocumentPosition(extensionsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    And('each extension phase is a closed section that shows its title and "x of y done"', () => {
      const details = extensionSection();
      expect(details.hasAttribute("open")).toBe(false);

      const summary = details.querySelector("summary");
      expect(summary?.textContent).toContain("Optional practice");
      expect(summary?.textContent).toContain("1 course");
      expect(summary?.textContent).toContain("0 of 1 done");
      // An extension is optional, so it is never numbered as a core phase.
      expect(summary?.textContent).not.toContain("Phase");
    });

    And("opening an extension phase shows its course cards", () => {
      const details = extensionSection();
      // Opening a `<details>` is a state change, not a fetch: the cards are already inside the
      // closed section, so activating its summary reveals them wherever scripts have not run.
      details.open = true;
      expect(details.hasAttribute("open")).toBe(true);

      const rows = Array.from(details.querySelectorAll<HTMLElement>("ol > li"));
      expect(rows).toHaveLength(1);
      const extensionCourse = rows[0] as HTMLElement;
      expect(extensionCourse.textContent).toMatch(/^4\s*Capstone · Secure Service/u);
      expect(
        within(extensionCourse).getByRole("link", { name: "Capstone · Secure Service" }).getAttribute("href"),
      ).toBe(`/en/learn/courses/${EXTENSION_COURSE}?path=${PATH_ID}`);
    });
  });

  Scenario("The path headline counts core courses only", ({ Given, When, Then, And }) => {
    Given("a reader completed every learning page of one extension course and nothing else", () => {
      learningProgressStore.update((state) => completeEveryPage(state, EXTENSION_COURSE));

      expect(completedPagesFor(EXTENSION_COURSE)).toEqual(sortedSequenceOf(EXTENSION_COURSE));
      for (const courseId of CORE_COURSES) {
        expect(completedPagesFor(courseId)).toEqual([]);
      }
    });

    When("the reader opens the path page", () => {
      renderPathLanding();
    });

    Then('the headline reads "0 of N core courses done"', () => {
      expect(within(generalistNav()).getByText("0 of 3 core courses done")).toBeTruthy();
    });

    And('that extension phase shows "1 of M done"', () => {
      const summary = extensionSection().querySelector("summary");
      expect(summary?.textContent).toContain("Done");
      expect(summary?.textContent).toContain("1 of 1 done");
    });
  });

  Scenario("Finishing the core path shows completion", ({ Given, When, Then, And }) => {
    Given("a reader completed every core course of a path", () => {
      learningProgressStore.update((state) =>
        CORE_COURSES.reduce((next, courseId) => completeEveryPage(next, courseId), state),
      );

      for (const courseId of CORE_COURSES) {
        expect(completedPagesFor(courseId)).toEqual(sortedSequenceOf(courseId));
      }
    });

    When("the reader opens the path page", () => {
      renderPathLanding();
    });

    Then("the headline says the core path is complete", () => {
      const nav = generalistNav();
      expect(within(nav).getByText("3 of 3 core courses done")).toBeTruthy();
      expect(within(nav).getByText("Core path complete. The optional extensions are below.")).toBeTruthy();
    });

    And('no "Start" or "Continue" button is shown', () => {
      expect(within(generalistNav()).queryAllByRole("link", { name: /^(Start|Continue):/ })).toHaveLength(0);
    });
  });

  Scenario(
    "A skills path waiting for its restructure shows one flat list with progress",
    ({ Given, When, Then, And }) => {
      let manifest: PathManifest;

      Given("a skills path is marked as pending restructure", () => {
        manifest = markedManifest();
        expect(manifest.restructurePendingIn).toBe("plan-06");
      });

      When("a reader opens that path page", () => {
        renderPathLanding(manifest);
      });

      Then("its courses appear in one list in today's order with status in words", () => {
        const nav = accountingNav();
        const rows = courseRows(nav);
        expect(rows).toHaveLength(2);
        expect(rows[0]?.textContent).toMatch(/^1\s*Accounting Foundations/u);
        expect(rows[1]?.textContent).toMatch(/^2\s*Journal Entries and Posting Mechanics/u);

        for (const row of rows) {
          expect(row.textContent).toContain("Not started");
        }
        expect(
          within(rows[0] as HTMLElement)
            .getByRole("link")
            .getAttribute("href"),
        ).toBe(`/en/learn/courses/${ACCOUNTING_COURSES[0]}?path=${ACCOUNTING_PATH_ID}`);
      });

      And('no phase heading, outcome line, or "Optional extensions" heading appears', () => {
        const nav = accountingNav();
        expect(nav.querySelectorAll("h3")).toHaveLength(0);
        expect(nav.querySelector("details")).toBeNull();
        expect(within(nav).queryByText("After this phase you can", { exact: false })).toBeNull();
        expect(within(nav).queryByText("Optional extensions")).toBeNull();
      });
    },
  );
});
