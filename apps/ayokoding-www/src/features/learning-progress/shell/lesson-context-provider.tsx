"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { normalizeCourseRef } from "@/features/course-paths/core/manifest";
import { phaseOfCourse } from "@/features/course-paths/core/path-phases";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { humanizeKebabSlug, type CoursePathClientData } from "@/features/course-paths/shell/course-path-nav";
import { useRuntimeCoursePathData } from "@/features/course-paths/shell/use-runtime-course-path-data";
import type { LessonPage } from "../core/lesson-sequence";
import { resolveLessonPathContext } from "../core/lesson-path-context";
import { recordVisit } from "../core/progress-state";
import { learningProgressStore, type ProgressSnapshot } from "./progress-storage";
import { useLearningProgress } from "./use-learning-progress";

/**
 * What a lesson page hands its context bar and action row (plan ayokoding-learn-revamp-04,
 * tech-docs/004). Everything here is serializable, so `page.tsx` can pass it from the server
 * render straight into this client provider.
 */
export interface LessonProps {
  locale: string;
  courseId: string;
  /** The course's own title — the course landing link's name, not this page's title. */
  courseTitle: string;
  /** Page path relative to the course, e.g. `learning/beginner`. */
  pagePath: string;
  /** This course's pages, in reading order — already filtered to the lesson sequence. */
  sequence: LessonPage[];
  /** The runtime-manifest fallback `page.tsx` captured at render time. */
  initialPathData: CoursePathClientData;
  /**
   * `searchParams.get("path")`. The client wrapper passes the live value; the static shell passes
   * nothing, which is why the server render is the canonical one (tech-docs/003 active path rule).
   */
  pathParam?: string | null;
}

/** The active path of a lesson page: the path, the phase that holds the course, and what follows. */
export interface LessonPathContext {
  pathId: string;
  title: string;
  /** 1-based position of this course within the whole path. */
  coursePosition: number;
  totalCourses: number;
  /** The phase that contains the course; `null` when the manifest lists it outside its phases. */
  phase: { id: string; title: string; index: number; isExtension: boolean } | null;
  nextCourse: { courseId: string; title: string } | null;
}

export interface LessonContextValue {
  locale: string;
  courseId: string;
  courseTitle: string;
  pagePath: string;
  /** This page's own title, or `""` for a page outside the sequence. */
  pageTitle: string;
  sequence: readonly LessonPage[];
  /** 0-based position of this page in `sequence`, or `-1` when it is not part of it. */
  index: number;
  snapshot: ProgressSnapshot;
  path: LessonPathContext | null;
}

const LessonContext = createContext<LessonContextValue | null>(null);

/** The lesson page's shared context; throws when a component reads it outside its provider. */
export function useLessonContext(): LessonContextValue {
  const value = useContext(LessonContext);

  if (value === null) {
    throw new Error("A lesson component read the lesson context outside LessonContextProvider.");
  }

  return value;
}

/**
 * The lesson page's path context, progress snapshot, and visit record (plan 04, tech-docs/004).
 *
 * The URL stays the authority: `pathParam` resolves only against the runtime manifests, and the
 * remembered path is used only when the URL carries none and the store remembers this same course
 * (tech-docs/003 active path rule). Until those manifests arrive — and on the server, where no
 * URL is known at all — the value is the canonical one, so the static HTML and the first client
 * render agree and hydration never mismatches. The visit is recorded once the URL's path id has
 * been validated, or immediately when there is none.
 */
export function LessonContextProvider({
  locale,
  courseId,
  courseTitle,
  pagePath,
  sequence,
  initialPathData,
  pathParam = null,
  children,
}: LessonProps & { children: ReactNode }) {
  const snapshot = useLearningProgress();
  const lastPath = snapshot.status === "ready" ? snapshot.state.lastPath : null;
  const needsPathData = pathParam !== null || (lastPath !== null && lastPath.courseId === courseId);
  const { data, isReady } = useRuntimeCoursePathData(locale, initialPathData, needsPathData);

  const path = useMemo(() => {
    if (!isReady) {
      return null;
    }

    const resolved = resolveLessonPathContext({ pathParam, manifests: data.manifests, courseId, lastPath });
    return resolved === null ? null : buildLessonPathContext(resolved.manifest, courseId, data.courseLinks);
  }, [courseId, data, isReady, lastPath, pathParam]);

  const validatedPathId = pathParam !== null && path?.pathId === pathParam ? pathParam : null;

  useEffect(() => {
    if (pathParam !== null && !isReady) {
      return;
    }

    learningProgressStore.update((state) => recordVisit(state, courseId, validatedPathId));
  }, [courseId, isReady, pathParam, validatedPathId]);

  const index = sequence.findIndex((page) => page.pagePath === pagePath);
  const value = useMemo<LessonContextValue>(
    () => ({
      locale,
      courseId,
      courseTitle,
      pagePath,
      pageTitle: sequence[index]?.title ?? "",
      sequence,
      index,
      snapshot,
      path,
    }),
    [courseId, courseTitle, index, locale, pagePath, path, sequence, snapshot],
  );

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

/** The path context around one course: its phase, its position, and the course after it. */
function buildLessonPathContext(
  manifest: PathManifest,
  courseId: string,
  courseLinks: CoursePathClientData["courseLinks"],
): LessonPathContext {
  const order = manifest.courseOrder.map(normalizeCourseRef);
  const position = order.findIndex((reference) => reference.id === courseId);
  const location = phaseOfCourse(manifest, courseId);
  const next = order[position + 1];

  return {
    pathId: manifest.pathId,
    title: manifest.title,
    coursePosition: position + 1,
    totalCourses: order.length,
    phase:
      location === null
        ? null
        : {
            id: location.phase.id,
            title: location.phase.title,
            index: location.phaseIndex + 1,
            isExtension: location.phase.kind === "extension",
          },
    nextCourse:
      next === undefined
        ? null
        : { courseId: next.id, title: courseLinks[next.id]?.title ?? humanizeKebabSlug(next.id) },
  };
}
