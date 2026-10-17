import { resolveCourseStartSlug } from "@/features/content/core/course-start";
import { findSubtree } from "@/features/content/core/tree-builder";
import { loadRoutePathData } from "@/features/course-paths/shell/route-path-data";
import type { Locale } from "@/features/i18n/core/config";
import { serverCaller } from "@/lib/trpc/server";
import { buildLessonSequence, type LessonPage } from "../core/lesson-sequence";

/** The content-tree slug every course lives under — the one place courses are enumerated. */
const COURSES_SLUG = "learn/courses";

/** A locale's lesson sequences and their page paths, built in one walk of the content tree. */
export interface LessonSequenceIndex {
  sequences: Readonly<Record<string, LessonPage[]>>;
  pagePaths: Readonly<Record<string, readonly string[]>>;
}

/**
 * Server-only lesson sequences (plan ayokoding-learn-revamp-04, tech-docs/003 Server Helper).
 *
 * Both exports share one per-locale index, built from `serverCaller.content.getTree` and
 * `loadRoutePathData`'s content map — the same two sources plan 03's start-slug resolution uses —
 * and hold it for the life of the server process, so a render that needs the whole library pays
 * for it once. Server-only by construction: no `"use client"` module imports this file; `page.tsx`
 * passes the plain serializable result on to the client components. It deliberately carries no
 * `import "server-only"`: the Node unit project imports it directly, and this repository's other
 * server helpers (`route-path-data.ts`, `manifest-repository.ts`) leave that guard to the module
 * that reads secrets, not to one that reads content.
 *
 * A promise is memoized rather than its result, so concurrent callers share one build.
 */
export async function loadLessonSequence(locale: string, courseId: string): Promise<LessonPage[]> {
  const index = await loadSequenceIndex(locale);
  return index.sequences[courseId] ?? [];
}

/** Page paths only (no titles) for every course of the locale — the roadmap and card payload. */
export async function loadLessonPagePaths(locale: string): Promise<Readonly<Record<string, readonly string[]>>> {
  return (await loadSequenceIndex(locale)).pagePaths;
}

const indexByLocale = new Map<string, Promise<LessonSequenceIndex>>();

function loadSequenceIndex(locale: string): Promise<LessonSequenceIndex> {
  const existing = indexByLocale.get(locale);
  if (existing !== undefined) {
    return existing;
  }

  const index = buildSequenceIndex(locale);
  indexByLocale.set(locale, index);
  return index;
}

async function buildSequenceIndex(locale: string): Promise<LessonSequenceIndex> {
  const tree = await serverCaller.content.getTree({ locale: locale as Locale });
  const { contentMap } = await loadRoutePathData(locale);
  const isRealPage = (slug: string) => contentMap.has(`${locale}:${slug}`);
  const coursesNode = findSubtree([...tree], COURSES_SLUG);

  const sequences: Record<string, LessonPage[]> = {};
  const pagePaths: Record<string, readonly string[]> = {};

  for (const courseNode of coursesNode?.children ?? []) {
    const sequence = buildLessonSequence(courseNode, isRealPage, resolveCourseStartSlug(courseNode, isRealPage));
    const courseId = lastSegment(courseNode.slug);
    sequences[courseId] = sequence;
    pagePaths[courseId] = sequence.map((page) => page.pagePath);
  }

  return { sequences, pagePaths };
}

function lastSegment(slug: string): string {
  return slug.slice(slug.lastIndexOf("/") + 1);
}
