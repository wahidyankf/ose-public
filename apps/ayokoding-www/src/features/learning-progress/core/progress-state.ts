import { PROGRESS_VERSION, progressStateSchema, type ProgressState } from "./progress-schema";

/**
 * The empty progress record — the state of a reader who has never marked a page or visited a
 * lesson page. Pure — no IO, never throws.
 */
export function emptyProgress(): ProgressState {
  return { version: PROGRESS_VERSION, completed: {}, lastPath: null, lastCourse: null };
}

/**
 * Read a stored progress record. `null` (no key), unparseable JSON, and a schema violation all
 * resolve to the empty state; only the last two are `recovered: true`, so the store can tell a
 * fresh reader from a record it is about to replace. Nothing is deleted here. Pure — no IO.
 */
export function parseProgress(raw: string | null): { state: ProgressState; recovered: boolean } {
  if (raw === null) {
    return { state: emptyProgress(), recovered: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: emptyProgress(), recovered: true };
  }

  const result = progressStateSchema.safeParse(parsed);
  if (!result.success) {
    return { state: emptyProgress(), recovered: true };
  }

  return { state: result.data, recovered: false };
}

/**
 * Write a progress record deterministically: object keys sorted, page arrays sorted and unique, so
 * the same state always produces the same string. Pure — no IO, never throws.
 */
export function serializeProgress(state: ProgressState): string {
  const completed = Object.fromEntries(
    Object.entries(state.completed)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([courseId, pages]) => [courseId, [...new Set(pages)].sort()]),
  );

  return JSON.stringify({
    completed,
    lastCourse: state.lastCourse === null ? null : { courseId: state.lastCourse.courseId },
    lastPath: state.lastPath === null ? null : { courseId: state.lastPath.courseId, pathId: state.lastPath.pathId },
    version: state.version,
  });
}

/**
 * Mark `pagePath` of `courseId` complete or incomplete. Adding is idempotent; removing the last
 * page of a course drops that course's key (tech-docs/002 field guide). Returns a new object and
 * never mutates the input. Pure — no IO, never throws.
 */
export function setPageComplete(
  state: ProgressState,
  courseId: string,
  pagePath: string,
  complete: boolean,
): ProgressState {
  const pages = state.completed[courseId] ?? [];
  const nextPages = complete
    ? pages.includes(pagePath)
      ? pages
      : [...pages, pagePath]
    : pages.filter((page) => page !== pagePath);

  const completed = { ...state.completed };
  if (nextPages.length === 0) {
    delete completed[courseId];
  } else {
    completed[courseId] = nextPages;
  }

  return { ...state, completed };
}

/**
 * Record a visit to `courseId`, optionally inside `pathId`. Without a path id the remembered path
 * survives only while it belongs to the same course; otherwise it is cleared (tech-docs/002 pure
 * operations). Returns a new object and never mutates the input. Pure — no IO, never throws.
 */
export function recordVisit(state: ProgressState, courseId: string, pathId: string | null): ProgressState {
  const lastPath =
    pathId !== null
      ? { pathId, courseId }
      : state.lastPath !== null && state.lastPath.courseId === courseId
        ? state.lastPath
        : null;

  return { ...state, lastCourse: { courseId }, lastPath };
}
