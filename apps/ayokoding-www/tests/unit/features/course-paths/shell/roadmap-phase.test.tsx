import { renderToString } from "react-dom/server";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PathPhase } from "../../../../../src/features/course-paths/core/schemas";

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
import { RoadmapPhase } from "../../../../../src/features/course-paths/shell/roadmap-phase";
// eslint-disable-next-line import/first
import { learningProgressStore } from "../../../../../src/features/learning-progress/shell/progress-storage";
// eslint-disable-next-line import/first
import { setPageComplete } from "../../../../../src/features/learning-progress/core/progress-state";

afterEach(cleanup);

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

const PATH_ID = "careers/immediately-effective/backend-track";

const CORE: PathPhase = {
  id: "shell-foundations",
  title: "Shell foundations",
  kind: "core",
  outcome: { can: "edit code quickly", cannotYet: "build a backend" },
  courses: ["just-enough-bash", "backend-essentials"],
};

const EXTENSION: PathPhase = {
  id: "optional-shell",
  title: "Optional shell workflow",
  kind: "extension",
  courses: ["sql-essentials"],
};

const CARDS: Record<string, RoadmapCourseData> = {
  "just-enough-bash": { title: "Just Enough Bash", format: "primer", estimatedHours: 3, isOutline: false },
  "backend-essentials": { title: "Backend Essentials", format: "by-example", estimatedHours: 6, isOutline: false },
  "sql-essentials": { title: "SQL Essentials", isOutline: true },
};

const SEQUENCES = {
  "just-enough-bash": ["learning/beginner"],
  "backend-essentials": ["learning/overview"],
  "sql-essentials": ["learning/beginner"],
};

describe("RoadmapPhase — a core milestone (S19)", () => {
  it("is a labelled section with a stable #phase-<id> anchor that the context bar links to", () => {
    const { container } = render(
      <RoadmapPhase
        locale="en"
        pathId={PATH_ID}
        phase={CORE}
        phaseNumber={1}
        startPosition={1}
        courseCards={CARDS}
        sequences={SEQUENCES}
      />,
    );

    const section = container.querySelector("#phase-shell-foundations");
    expect(section).not.toBeNull();
    const heading = within(section as HTMLElement).getByRole("heading", { level: 3, name: /Phase 1/ });
    expect(section?.getAttribute("aria-labelledby")).toBe(heading.getAttribute("id"));
    expect(heading.textContent).toContain("Shell foundations");
  });

  it("shows the outcome lines and the phase's own done count", () => {
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    const { container } = render(
      <RoadmapPhase
        locale="en"
        pathId={PATH_ID}
        phase={CORE}
        phaseNumber={2}
        startPosition={3}
        courseCards={CARDS}
        sequences={SEQUENCES}
      />,
    );

    const section = within(container.querySelector("#phase-shell-foundations") as HTMLElement);
    expect(section.getByText("After this phase you can edit code quickly")).toBeTruthy();
    expect(section.getByText("You cannot yet build a backend")).toBeTruthy();
    expect(section.getByText("In progress")).toBeTruthy();
    expect(section.getByText("1 of 2 done")).toBeTruthy();
    // Positions come from the caller so numbering continues across phases.
    expect(section.getAllByRole("listitem").map((row) => row.textContent?.match(/^\d+/)?.[0])).toEqual(["3", "4"]);
  });

  it("omits the outcome lines for a core phase that declares none", () => {
    const { container } = render(
      <RoadmapPhase
        locale="en"
        pathId={PATH_ID}
        phase={{ ...CORE, outcome: undefined }}
        phaseNumber={1}
        startPosition={1}
        courseCards={CARDS}
        sequences={SEQUENCES}
      />,
    );

    expect(container.textContent).not.toContain("After this phase you can");
    expect(container.textContent).not.toContain("You cannot yet");
  });
});

describe("RoadmapPhase — an extension phase is closed by default (S23)", () => {
  it("renders a details element with the title, the course count, and the phase progress in its summary", () => {
    const { container } = render(
      <RoadmapPhase
        locale="en"
        pathId={PATH_ID}
        phase={EXTENSION}
        startPosition={3}
        courseCards={CARDS}
        sequences={SEQUENCES}
      />,
    );

    const details = container.querySelector("details");
    expect(details?.hasAttribute("open")).toBe(false);
    const summary = container.querySelector("details summary");
    expect(summary?.textContent).toContain("Optional shell workflow");
    expect(summary?.textContent).toContain("1 course");
    expect(summary?.textContent).toContain("Not started");
    expect(summary?.textContent).toContain("0 of 1 done");
    // Extension phases carry no number, and their courses keep the continuing position numbers.
    expect(summary?.textContent).not.toContain("Phase");
    expect(details?.querySelector("ol > li")?.textContent).toMatch(/^3\s*SQL Essentials/);
  });

  it("shows a phase as done once every course in it is done", () => {
    learningProgressStore.update((state) => setPageComplete(state, "sql-essentials", "learning/beginner", true));
    const { container } = render(
      <RoadmapPhase
        locale="en"
        pathId={PATH_ID}
        phase={EXTENSION}
        startPosition={3}
        courseCards={CARDS}
        sequences={SEQUENCES}
      />,
    );

    expect(container.querySelector("summary")?.textContent).toContain("1 of 1 done");
    expect(container.querySelector("summary")?.textContent).toContain("Done");
  });

  it("hides the card meta row in the pending-restructure flat list", () => {
    const html = renderToString(
      <div>
        <RoadmapPhase
          locale="en"
          pathId={PATH_ID}
          phase={{ id: "all-courses", title: "All courses", kind: "core", courses: ["sql-essentials"] }}
          startPosition={1}
          courseCards={CARDS}
          sequences={SEQUENCES}
          showCardMeta={false}
        />
      </div>,
    );

    expect(html).toContain("SQL Essentials");
    expect(html).not.toContain("Outline");
    expect(html).not.toContain("6 h");
  });
});

describe("RoadmapPhase — the server render", () => {
  it("shows the phase progress placeholder instead of a count before hydration", () => {
    const html = renderToString(
      <RoadmapPhase
        locale="en"
        pathId={PATH_ID}
        phase={CORE}
        phaseNumber={1}
        startPosition={1}
        courseCards={CARDS}
        sequences={SEQUENCES}
      />,
    );

    expect(html).not.toContain("of 2 done");
    expect(html).toContain('aria-hidden="true"');
  });

  it("names the phase courses as links into path context", () => {
    render(
      <RoadmapPhase
        locale="en"
        pathId={PATH_ID}
        phase={CORE}
        phaseNumber={1}
        startPosition={1}
        courseCards={CARDS}
        sequences={SEQUENCES}
      />,
    );

    expect(screen.getByRole("link", { name: "Backend Essentials" }).getAttribute("href")).toBe(
      `/en/learn/courses/backend-essentials?path=${PATH_ID}`,
    );
  });
});
