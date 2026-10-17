import type { CoursePathClientData } from "@/features/course-paths/shell/course-path-nav";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import type { LessonPage } from "@/features/learning-progress/core/lesson-sequence";

/**
 * The synthetic three-course library the lesson-chrome tests (component tests and the
 * `learning-progress` unit step files) share: the same three courses, in the same order, as the
 * `careers/immediately-effective/backend-track` E2E fixture manifest — so a unit assertion and its
 * browser binding describe the same reader experience.
 */
export const BACKEND_TRACK: PathManifest = {
  pathId: "careers/immediately-effective/backend-track",
  arc: "immediately-effective",
  title: "Backend Track",
  description: "Write shell scripts, serve an HTTP backend, and store its data.",
  assumes: ["just-enough-python"],
  phases: [
    {
      id: "fixture-core",
      title: "Fixture core",
      kind: "core",
      outcome: { can: "complete this fixture path" },
      courses: ["just-enough-bash", "backend-essentials", "sql-essentials"],
    },
  ],
  courseOrder: ["just-enough-bash", "backend-essentials", "sql-essentials"],
};

function pages(courseId: string, entries: { pagePath: string; title: string }[]): LessonPage[] {
  return entries.map((entry) => ({
    pagePath: entry.pagePath,
    slug: `learn/courses/${courseId}/${entry.pagePath}`,
    title: entry.title,
  }));
}

export const BASH_SEQUENCE = pages("just-enough-bash", [
  { pagePath: "learning/overview", title: "Overview" },
  { pagePath: "learning/beginner", title: "Beginner Examples" },
  { pagePath: "learning/advanced", title: "Advanced Examples" },
]);

export const BACKEND_SEQUENCE = pages("backend-essentials", [
  { pagePath: "learning/overview", title: "Overview" },
  { pagePath: "learning/beginner", title: "Beginner Examples" },
]);

export const SQL_SEQUENCE = pages("sql-essentials", [
  { pagePath: "learning/beginner", title: "Beginner Examples" },
  { pagePath: "learning/advanced", title: "Advanced Examples" },
]);

export const LESSON_SEQUENCES: Record<string, LessonPage[]> = {
  "just-enough-bash": BASH_SEQUENCE,
  "backend-essentials": BACKEND_SEQUENCE,
  "sql-essentials": SQL_SEQUENCE,
};

export const COURSE_TITLES: Record<string, string> = {
  "just-enough-bash": "Just Enough Bash",
  "backend-essentials": "Backend Essentials",
  "sql-essentials": "SQL Essentials",
};

export const BACKEND_TRACK_PATH_DATA: CoursePathClientData = {
  manifests: [BACKEND_TRACK],
  prerequisitesByCourse: {},
  libraryCourseIds: Object.keys(LESSON_SEQUENCES),
  outlineCourseIds: [],
  courseLinks: Object.fromEntries(
    Object.entries(COURSE_TITLES).map(([courseId, title]) => [courseId, { title, slug: `learn/courses/${courseId}` }]),
  ),
};
