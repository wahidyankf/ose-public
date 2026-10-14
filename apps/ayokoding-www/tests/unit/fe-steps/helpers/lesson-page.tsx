import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { CoursePageContent } from "@/features/course-paths/shell/course-page-content";
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import { parseProgress } from "@/features/learning-progress/core/progress-state";
import type { LessonProps } from "@/features/learning-progress/shell/lesson-context-provider";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
import { BACKEND_TRACK_PATH_DATA, BASH_SEQUENCE } from "../../features/learning-progress/lesson-fixtures";

/**
 * The lesson page the `learning-progress` unit step files render: the real `CoursePageContent`
 * with a `lesson` prop built from the synthetic three-course manifest (the same three courses as
 * the backend-track E2E fixture), so a unit assertion and its browser binding describe one reader
 * experience. Shared by `lesson-navigation.steps.tsx` and `progress-store.steps.tsx`.
 */
export function lessonProps(overrides: Partial<LessonProps> = {}): LessonProps {
  return {
    locale: "en",
    courseId: "just-enough-bash",
    courseTitle: "Just Enough Bash",
    pagePath: "learning/beginner",
    sequence: BASH_SEQUENCE,
    initialPathData: BACKEND_TRACK_PATH_DATA,
    pathParam: BACKEND_TRACK_PATH_DATA.manifests[0]?.pathId ?? null,
    ...overrides,
  };
}

/** Render (or re-render) one lesson page; every page starts from a clean tree. */
export function openLessonPage(overrides: Partial<LessonProps> = {}): void {
  cleanup();
  const props = lessonProps(overrides);
  render(
    <CoursePageContent
      locale={props.locale}
      slug={`learn/courses/${props.courseId}/${props.pagePath}`}
      title="Beginner Examples"
      html="<p>Lesson body.</p>"
      headings={[]}
      breadcrumbSegments={[{ label: "Home", slug: "" }]}
      renderData={{ activeContext: null, prerequisiteLinks: [], pathBadges: [], prev: null, next: null }}
      courseId={props.courseId}
      lesson={props}
    />,
  );
}

/** The context bar's landmark, which only a lesson page renders. */
export function contextBar(): HTMLElement {
  return screen.getByRole("navigation", { name: "Lesson location" });
}

/** The action row's landmark, which keeps today's `Page navigation` name (U4). */
export function actionRow(): HTMLElement {
  return screen.getByRole("navigation", { name: "Page navigation" });
}

/** The action row's primary control in its not-yet-complete state. */
export function primaryLink(): HTMLElement {
  return within(actionRow()).getByRole("link", { name: /Mark complete & continue/ });
}

/** Where the primary control pointed when it was activated, plus its second line. */
export interface ActivatedTarget {
  href: string;
  text: string;
}

/**
 * Activate "Mark complete & continue" and keep what it pointed at. The label becomes "Continue"
 * the moment the page is marked complete (tech-docs/003), so the target has to be read before the
 * click — which is also exactly what a reader's browser follows.
 */
export function activatePrimary(): ActivatedTarget {
  const link = primaryLink();
  const target = { href: link.getAttribute("href") ?? "", text: link.textContent ?? "" };
  fireEvent.click(link);
  return target;
}

/** The action row's completion toggle, whatever its current state. */
export function completionToggle(): HTMLElement {
  return within(actionRow()).getByRole("button");
}

/** The completed page paths the store holds for `courseId`. */
export function completedPages(courseId = "just-enough-bash"): readonly string[] {
  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).state.completed[courseId] ?? [];
}

/** A reader with no saved progress and no page completed. */
export function noSavedProgress(): void {
  learningProgressStore.reset();
  window.localStorage.clear();
}
