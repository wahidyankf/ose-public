import { renderToString } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CoursePathClientData } from "@/features/course-paths/shell/course-path-nav";
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import { parseProgress, setPageComplete } from "@/features/learning-progress/core/progress-state";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Same shape as the real hook: before a runtime refresh lands, `data` is the `initial`
// fallback the server render captured.
vi.mock("@/features/course-paths/shell/use-runtime-course-path-data", () => ({
  useRuntimeCoursePathData: (_locale: string, initial: CoursePathClientData) => ({ data: initial, isReady: true }),
}));

// eslint-disable-next-line import/first
import { ContextBar } from "@/features/learning-progress/shell/context-bar";
// eslint-disable-next-line import/first
import { LessonContextProvider, type LessonProps } from "@/features/learning-progress/shell/lesson-context-provider";
// eslint-disable-next-line import/first
import { LessonNav } from "@/features/learning-progress/shell/lesson-nav";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
// eslint-disable-next-line import/first
import { BACKEND_TRACK, BACKEND_TRACK_PATH_DATA, BASH_SEQUENCE, SQL_SEQUENCE } from "./lesson-fixtures";

const PATH_ID = BACKEND_TRACK.pathId;

function lessonProps(overrides: Partial<LessonProps> = {}): LessonProps {
  return {
    locale: "en",
    courseId: "just-enough-bash",
    courseTitle: "Just Enough Bash",
    pagePath: "learning/beginner",
    sequence: BASH_SEQUENCE,
    initialPathData: BACKEND_TRACK_PATH_DATA,
    pathParam: PATH_ID,
    ...overrides,
  };
}

function renderNav(overrides: Partial<LessonProps> = {}) {
  render(
    <LessonContextProvider {...lessonProps(overrides)}>
      <ContextBar />
      <LessonNav />
    </LessonContextProvider>,
  );

  return screen.getByRole("navigation", { name: "Page navigation" });
}

function storedState() {
  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).state;
}

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

afterEach(cleanup);

describe("LessonNav", () => {
  it("links the primary control to the next page and its second line to that page's title", () => {
    const nav = renderNav();

    const primary = within(nav).getByRole("link", { name: /Mark complete & continue/ });
    expect(primary.getAttribute("href")).toBe(`/en/learn/courses/just-enough-bash/learning/advanced?path=${PATH_ID}`);
    expect(primary.textContent).toContain("Next: Advanced Examples");
  });

  it("writes the completion of the current page before navigating", () => {
    const nav = renderNav();

    fireEvent.click(within(nav).getByRole("link", { name: /Mark complete & continue/ }));

    expect(storedState().completed["just-enough-bash"]).toEqual(["learning/beginner"]);
  });

  it("reads Continue and writes nothing when the page is already complete", () => {
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    const nav = renderNav();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    const primary = within(nav).getByRole("link", { name: /Continue/ });
    expect(primary.textContent).toContain("Next: Advanced Examples");
    fireEvent.click(primary);

    expect(setItem).not.toHaveBeenCalled();
    expect(storedState().completed["just-enough-bash"]).toEqual(["learning/beginner"]);
    setItem.mockRestore();
  });

  it("leads from a course's last page to the next course in the path", () => {
    const nav = renderNav({ pagePath: "learning/advanced" });

    const primary = within(nav).getByRole("link", { name: /Mark complete & continue/ });
    expect(primary.getAttribute("href")).toBe(`/en/learn/courses/backend-essentials?path=${PATH_ID}`);
    expect(primary.textContent).toContain("Next course: Backend Essentials");
  });

  it("leads from the path's last page back to the path page", () => {
    const nav = renderNav({
      courseId: "sql-essentials",
      courseTitle: "SQL Essentials",
      pagePath: "learning/advanced",
      sequence: SQL_SEQUENCE,
    });

    const primary = within(nav).getByRole("link", { name: /Mark complete & continue/ });
    expect(primary.getAttribute("href")).toBe("/en/learn/paths/careers/immediately-effective/backend-track");
    expect(primary.textContent).toContain("Back to the path");
  });

  it("leads from a last page without a path context back to the course landing page", () => {
    const nav = renderNav({ pagePath: "learning/advanced", pathParam: null });

    const primary = within(nav).getByRole("link", { name: /Mark complete & continue/ });
    expect(primary.getAttribute("href")).toBe("/en/learn/courses/just-enough-bash");
    expect(primary.textContent).toContain("Back to the course");
  });

  it("leads Previous to the course landing page on the first page, then to the previous page", () => {
    const first = renderNav({ pagePath: "learning/overview" });

    expect(
      within(first)
        .getByRole("link", { name: /Previous: Just Enough Bash/ })
        .getAttribute("href"),
    ).toBe(`/en/learn/courses/just-enough-bash?path=${PATH_ID}`);
    cleanup();

    const second = renderNav({ pagePath: "learning/beginner" });

    expect(
      within(second)
        .getByRole("link", { name: /Previous: Overview/ })
        .getAttribute("href"),
    ).toBe(`/en/learn/courses/just-enough-bash/learning/overview?path=${PATH_ID}`);
  });

  it("toggles the completion state and announces it, with the pages-done count following", () => {
    const nav = renderNav();
    const toggle = within(nav).getByRole("button", { name: /Mark as complete/ });

    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);

    expect(
      within(nav)
        .getByRole("button", { name: /Completed/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("Beginner Examples marked as complete. 1 of 3 pages done.");
    expect(storedState().completed["just-enough-bash"]).toEqual(["learning/beginner"]);
    expect(screen.getByRole("navigation", { name: "Lesson location" }).textContent).toContain("1 of 3 pages done");

    fireEvent.click(within(nav).getByRole("button", { name: /Completed/ }));

    expect(
      within(nav)
        .getByRole("button", { name: /Mark as complete/ })
        .getAttribute("aria-pressed"),
    ).toBe("false");
    expect(screen.getByRole("status").textContent).toBe("Beginner Examples marked as not complete. 0 of 3 pages done.");
    expect(storedState().completed["just-enough-bash"]).toBeUndefined();
    expect(screen.getByRole("navigation", { name: "Lesson location" }).textContent).toContain("0 of 3 pages done");
  });

  it("mirrors a completion written to the store after it mounted", () => {
    const nav = renderNav({ pathParam: null });

    act(() => {
      learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    });

    expect(
      within(nav)
        .getByRole("button", { name: /Completed/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("disables the toggle and shows no progress while the snapshot is unknown", () => {
    const html = renderToString(
      <LessonContextProvider {...lessonProps()}>
        <ContextBar />
        <LessonNav />
      </LessonContextProvider>,
    );

    const container = document.createElement("div");
    container.innerHTML = html;

    const toggle = container.querySelector("nav[aria-label='Page navigation'] button");
    expect(toggle?.hasAttribute("disabled")).toBe(true);
    expect(toggle?.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector('[role="status"]')?.textContent).toBe("");
  });

  it("names the nav Page navigation with the target titles in its link names", () => {
    const nav = renderNav();

    expect(nav.getAttribute("aria-label")).toBe("Page navigation");
    expect(within(nav).getByRole("link", { name: /Previous: Overview/ })).toBeTruthy();
    expect(within(nav).getByRole("link", { name: /Next: Advanced Examples/ })).toBeTruthy();
  });

  it("keeps every course link in path context", () => {
    const nav = renderNav();

    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toContain(`/en/learn/courses/just-enough-bash/learning/overview?path=${PATH_ID}`);
    expect(hrefs).toContain(`/en/learn/courses/just-enough-bash/learning/advanced?path=${PATH_ID}`);
  });

  it("renders no navigation for a page outside the lesson sequence", () => {
    render(
      <LessonContextProvider {...lessonProps({ pagePath: "learning/capstone/overview" })}>
        <LessonNav />
      </LessonContextProvider>,
    );

    expect(screen.queryByRole("navigation", { name: "Page navigation" })).toBeNull();
  });
});
