import { renderToString } from "react-dom/server";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import type { CoursePathClientData } from "@/features/course-paths/shell/course-path-nav";
import { setPageComplete } from "@/features/learning-progress/core/progress-state";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Same shape as the real hook: before a runtime refresh lands, `data` is the `initial`
// fallback the server render captured — which is what lets a case override it.
vi.mock("@/features/course-paths/shell/use-runtime-course-path-data", () => ({
  useRuntimeCoursePathData: (_locale: string, initial: CoursePathClientData) => ({ data: initial, isReady: true }),
}));

// eslint-disable-next-line import/first
import { ContextBar } from "@/features/learning-progress/shell/context-bar";
// eslint-disable-next-line import/first
import { LessonContextProvider, type LessonProps } from "@/features/learning-progress/shell/lesson-context-provider";
// eslint-disable-next-line import/first
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
// eslint-disable-next-line import/first
import { BACKEND_TRACK, BACKEND_TRACK_PATH_DATA, BASH_SEQUENCE } from "./lesson-fixtures";

const PATH_HREF = "/en/learn/paths/careers/immediately-effective/backend-track";

function lessonProps(overrides: Partial<LessonProps> = {}): LessonProps {
  return {
    locale: "en",
    courseId: "just-enough-bash",
    courseTitle: "Just Enough Bash",
    pagePath: "learning/beginner",
    sequence: BASH_SEQUENCE,
    initialPathData: BACKEND_TRACK_PATH_DATA,
    pathParam: BACKEND_TRACK.pathId,
    ...overrides,
  };
}

/** The bar's landmark, rendered inside the provider with the given props. */
function renderBar(overrides: Partial<LessonProps> = {}) {
  render(
    <LessonContextProvider {...lessonProps(overrides)}>
      <ContextBar />
    </LessonContextProvider>,
  );

  return screen.getByRole("navigation", { name: "Lesson location" });
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("ContextBar", () => {
  it("shows the path, the phase, the course position, and the page position in path mode", () => {
    const contextBar = renderBar();

    const pathLink = within(contextBar).getByRole("link", { name: "Backend Track" });
    expect(pathLink.getAttribute("href")).toBe(PATH_HREF);

    const phaseLink = within(contextBar).getByRole("link", { name: "Phase 1 · Fixture core" });
    expect(phaseLink.getAttribute("href")).toBe(`${PATH_HREF}#phase-fixture-core`);

    const courseLink = within(contextBar).getByRole("link", { name: "Course 1 of 3" });
    expect(courseLink.getAttribute("href")).toBe(`/en/learn/courses/just-enough-bash?path=${BACKEND_TRACK.pathId}`);

    expect(contextBar.textContent).toContain("Page 2 of 3");
    expect(contextBar.textContent).toContain("0 of 3 pages done");
  });

  it("names the landmark and keeps a growing minimum-height slot at every breakpoint (UWT-004)", () => {
    const contextBar = renderBar();

    // min-h-[4.75rem] fits the 44px breadcrumb row + gap + counts row (44 + 4 + 20 = 68)
    // and grows when wrapped 44px links need a second row, so content never escapes the
    // border at 375/768 the way the old fixed h- did.
    const classes = contextBar.className.split(/\s+/);
    expect(classes).toContain("min-h-[4.75rem]");
    expect(classes).toContain("sm:min-h-[4.5rem]");
    expect(classes).not.toContain("h-[4.75rem]");
    expect(classes).not.toContain("sm:h-[4.5rem]");
  });

  it("gives every breadcrumb link a 44px minimum target while keeping the inline layout (UIW-002)", () => {
    for (const overrides of [{}, { pathParam: null }]) {
      const contextBar = renderBar(overrides as Partial<LessonProps>);
      const links = within(contextBar).getAllByRole("link");

      expect(links.length).toBeGreaterThan(0);
      for (const link of links) {
        // min-h-11 (2.75rem = 44px): plan criterion 2 (44x44 at 375). The
        // links stay inline flex items of the same wrapping breadcrumb row.
        expect(link.className.split(/\s+/)).toContain("min-h-11");
      }
      cleanup();
    }
  });

  it("counts the pages done from the saved progress", () => {
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/overview", true));

    const contextBar = renderBar();

    expect(contextBar.textContent).toContain("1 of 3 pages done");
    const meter = contextBar.querySelector('[aria-hidden="true"] div[style*="width"]');
    expect(meter?.getAttribute("style")).toContain("33.333");
  });

  it("shows the course title and no path or phase link without a path context", () => {
    const contextBar = renderBar({ pathParam: null });

    expect(within(contextBar).getAllByRole("link")).toHaveLength(1);
    const courseLink = within(contextBar).getByRole("link", { name: "Just Enough Bash" });
    expect(courseLink.getAttribute("href")).toBe("/en/learn/courses/just-enough-bash");
    expect(contextBar.textContent).toContain("Page 2 of 3");
    expect(contextBar.textContent).toContain("0 of 3 pages done");
  });

  it("shows an extension phase's title without a phase number or a phase link", () => {
    const extensionManifest: PathManifest = {
      ...BACKEND_TRACK,
      phases: [
        {
          id: "fixture-extension",
          title: "Optional depth",
          kind: "extension",
          courses: ["just-enough-bash", "backend-essentials", "sql-essentials"],
        },
      ],
    };

    const contextBar = renderBar({ initialPathData: { ...BACKEND_TRACK_PATH_DATA, manifests: [extensionManifest] } });

    expect(contextBar.textContent).toContain("Optional depth");
    expect(contextBar.textContent).not.toContain("Phase 1");
    expect(within(contextBar).getByRole("link", { name: "Optional depth" }).getAttribute("href")).toBe(PATH_HREF);
  });

  it("shows no phase link for a course the manifest lists outside its phases", () => {
    const flatManifest: PathManifest = {
      ...BACKEND_TRACK,
      phases: [
        {
          id: "fixture-core",
          title: "Fixture core",
          kind: "core",
          outcome: { can: "complete this fixture path" },
          courses: ["backend-essentials", "sql-essentials"],
        },
      ],
      courseOrder: ["just-enough-bash", "backend-essentials", "sql-essentials"],
    };

    const contextBar = renderBar({ initialPathData: { ...BACKEND_TRACK_PATH_DATA, manifests: [flatManifest] } });

    expect(within(contextBar).getByRole("link", { name: "Course 1 of 3" })).toBeTruthy();
    expect(contextBar.textContent).not.toContain("Phase 1");
  });

  it("fills the slot with placeholders before the progress snapshot is known", () => {
    const html = renderToString(
      <LessonContextProvider {...lessonProps()}>
        <ContextBar />
      </LessonContextProvider>,
    );

    const container = document.createElement("div");
    container.innerHTML = html;

    const rendered = container.querySelector("nav");
    expect(rendered?.textContent).not.toContain("Page 2 of 3");
    expect(rendered?.textContent).not.toContain("pages done");
    expect(rendered?.querySelectorAll("span.bg-muted").length).toBe(2);
  });
});
