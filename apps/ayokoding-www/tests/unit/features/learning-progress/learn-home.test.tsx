import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { recordVisit, setPageComplete } from "@/features/learning-progress/core/progress-state";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
import { manifestFixture } from "../course-paths/manifest-fixture";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { LearnHome } from "../../../../src/features/learning-progress/shell/learn-home";

const INTRO = "Follow a path from your first course to a finished project, or pick single courses from the catalog.";

const CAREERS = manifestFixture({
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

const SKILLS = manifestFixture({
  pathId: "skills/just-enough-tools",
  arc: "just-enough-tools",
  title: "Just Enough Tools",
  description: "Get productive with the everyday tools a project needs.",
  courses: ["version-control-and-git"],
});

function meta(slug: string, title: string): [string, ContentMeta] {
  return [
    `en:${slug}`,
    {
      title,
      slug,
      locale: "en",
      weight: 0,
      tags: [],
      draft: false,
      isSection: true,
      filePath: `/content/en/${slug}/_index.md`,
    },
  ];
}

const CONTENT_MAP = new Map<string, ContentMeta>([
  meta("learn/paths/careers/immediately-effective", "Immediately Effective"),
  meta("learn/courses/just-enough-bash", "Just Enough Bash"),
  meta("learn/courses/backend-essentials", "Backend Essentials"),
  meta("learn/courses/sql-essentials", "SQL Essentials"),
  meta("learn/courses/version-control-and-git", "Version Control & Git"),
]);

const SEQUENCES = {
  "just-enough-bash": ["learning/overview", "learning/beginner"],
  "backend-essentials": ["learning/overview"],
  "sql-essentials": ["learning/beginner"],
  "version-control-and-git": ["learning/beginner"],
};

function renderHome() {
  return render(
    <LearnHome
      locale="en"
      title="Learn"
      description={INTRO}
      manifests={[CAREERS, SKILLS]}
      contentMap={CONTENT_MAP}
      sequences={SEQUENCES}
      catalogCounts={{ courses: 230, categories: 14 }}
    />,
  );
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("LearnHome — a landing page, not a list of courses (S27)", () => {
  it("shows the heading and the intro from the Learn index page", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 1, name: "Learn" })).toBeTruthy();
    expect(screen.getByText(INTRO)).toBeTruthy();
  });

  it("keeps the Continue/Start card area in its own section, in start mode for a new reader", () => {
    const { container } = renderHome();

    expect(screen.getByText("Start learning")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Choose a path" })).toBeTruthy();
    expect(container.querySelector(".h-44")).not.toBeNull();
  });

  it("groups career path cards under arc headings that link to the arc pages", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 2, name: "Career paths" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Immediately Effective" }).getAttribute("href")).toBe(
      "/en/learn/paths/careers/immediately-effective",
    );
    expect(screen.getByRole("link", { name: "Backend Track" }).getAttribute("href")).toBe(
      "/en/learn/paths/careers/immediately-effective/backend-track",
    );
  });

  it("shows the skills path cards in their own section", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 2, name: "Skill paths" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Just Enough Tools" }).getAttribute("href")).toBe(
      "/en/learn/paths/skills/just-enough-tools",
    );
  });

  it("links to the catalog with its counts, and to no individual course page", () => {
    renderHome();

    expect(screen.getByRole("link", { name: /Browse all courses/ }).getAttribute("href")).toBe("/en/learn/courses");
    expect(screen.getByRole("link", { name: /Browse all courses/ }).textContent).toContain(
      "230 courses in 14 categories.",
    );

    const coursePageLinks = Array.from(document.querySelectorAll("a"))
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("/en/learn/courses/"));
    expect(coursePageLinks).toEqual([]);
  });

  it("anchors the career paths section for the start card's link", () => {
    const { container } = renderHome();

    expect(container.querySelector("#career-paths")).not.toBeNull();
  });

  it("carries the browser-only note, the guarded reset, and the legacy line", () => {
    renderHome();

    expect(screen.getByText("Your progress is saved in this browser only. It is never sent anywhere.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset progress…" })).toBeTruthy();
    expect(screen.getByText("Looking for older material?")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Legacy" }).getAttribute("href")).toBe("/en/learn/legacy");
  });

  it("reads the remembered path in the card once progress exists", () => {
    learningProgressStore.update((state) =>
      recordVisit(
        setPageComplete(state, "just-enough-bash", "learning/overview", true),
        "just-enough-bash",
        CAREERS.pathId,
      ),
    );

    renderHome();

    expect(screen.getByText("Continue learning")).toBeTruthy();
    expect(screen.getAllByText("Backend Track").length).toBeGreaterThan(0);
  });

  it("still offers a way into each hub when no path is published yet", () => {
    render(
      <LearnHome
        locale="en"
        title="Learn"
        description={INTRO}
        manifests={[]}
        contentMap={CONTENT_MAP}
        sequences={SEQUENCES}
        catalogCounts={{ courses: 0, categories: 0 }}
      />,
    );

    expect(screen.getAllByText("New paths are being written — check back soon.")).toHaveLength(2);
  });
});
