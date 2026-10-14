import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import { parseProgress, setPageComplete } from "@/features/learning-progress/core/progress-state";
import { CourseProgressAction } from "@/features/learning-progress/shell/course-progress-action";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
import { BASH_SEQUENCE } from "./lesson-fixtures";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

const COURSE_ID = "just-enough-bash";
const START_SLUG = "learn/courses/just-enough-bash/learning/overview";
const PATH_ID = "careers/immediately-effective/backend-track";

function action(overrides: { locale?: string; startSlug?: string | null; pathId?: string | null } = {}) {
  return (
    <CourseProgressAction
      locale={overrides.locale ?? "en"}
      courseId={COURSE_ID}
      sequence={BASH_SEQUENCE}
      startSlug={overrides.startSlug === undefined ? START_SLUG : overrides.startSlug}
      pathId={overrides.pathId ?? null}
    />
  );
}

function complete(pagePaths: readonly string[]): void {
  learningProgressStore.update((state) =>
    pagePaths.reduce((next, pagePath) => setPageComplete(next, COURSE_ID, pagePath, true), state),
  );
}

function storedState() {
  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).state;
}

describe("CourseProgressAction — the server render and a fresh reader", () => {
  it("offers Start course to plan 03's start slug before any progress is known", () => {
    const html = renderToString(action());

    const container = document.createElement("div");
    container.innerHTML = html;
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/en/learn/courses/just-enough-bash/learning/overview");
    expect(link?.textContent).toBe("Start course");
  });

  it("keeps offering Start course once the store is ready but nothing is done", () => {
    render(action());

    expect(screen.getByRole("link", { name: "Start course" }).getAttribute("href")).toBe(
      "/en/learn/courses/just-enough-bash/learning/overview",
    );
  });
});

describe("CourseProgressAction — a returning reader", () => {
  it("offers Continue course with the next unfinished page's title", () => {
    complete(["learning/overview"]);
    render(action());

    const link = screen.getByRole("link", { name: "Continue course: Beginner Examples" });
    expect(link.getAttribute("href")).toBe("/en/learn/courses/just-enough-bash/learning/beginner");
  });

  it("keeps ?path= on the target when a validated path id is given", () => {
    complete(["learning/overview"]);
    render(action({ pathId: PATH_ID }));

    expect(screen.getByRole("link", { name: "Continue course: Beginner Examples" }).getAttribute("href")).toBe(
      `/en/learn/courses/just-enough-bash/learning/beginner?path=${PATH_ID}`,
    );
  });

  it("offers Review course to the first learning page once every page is done", () => {
    complete(BASH_SEQUENCE.map((page) => page.pagePath));
    render(action());

    const link = screen.getByRole("link", { name: "Review course" });
    expect(link.getAttribute("href")).toBe("/en/learn/courses/just-enough-bash/learning/overview");
  });

  it("records the visit on the course, with the URL's path id when there is one", () => {
    render(action({ pathId: PATH_ID }));

    expect(storedState().lastPath).toEqual({ pathId: PATH_ID, courseId: COURSE_ID });
    expect(storedState().lastCourse).toEqual({ courseId: COURSE_ID });
  });

  it("records a visit without a path when the URL carries none", () => {
    render(action());

    expect(storedState().lastCourse).toEqual({ courseId: COURSE_ID });
    expect(storedState().lastPath).toBeNull();
  });

  it("localizes every mode on the id locale", () => {
    const { unmount } = render(action({ locale: "id" }));
    expect(screen.getByRole("link", { name: "Mulai kursus" })).toBeTruthy();
    unmount();

    complete(["learning/overview"]);
    const { unmount: unmountSecond } = render(action({ locale: "id" }));
    expect(screen.getByRole("link", { name: "Lanjutkan kursus: Beginner Examples" })).toBeTruthy();
    unmountSecond();

    complete(BASH_SEQUENCE.map((page) => page.pagePath));
    render(action({ locale: "id" }));
    expect(screen.getByRole("link", { name: "Ulas kursus" })).toBeTruthy();
  });
});
