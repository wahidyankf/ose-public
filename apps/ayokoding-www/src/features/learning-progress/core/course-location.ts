/** The slug prefix every course page carries. */
const COURSE_SLUG_PREFIX = "learn/courses/";

/**
 * Where a content slug sits inside a course: its course ID and, for a page below the course root,
 * its page path relative to the course (`null` on the course landing page) — or `null` for the
 * course catalog slug, for anything outside `learn/courses/`, and for any slug carrying an empty
 * segment. Pure — no IO, never throws.
 */
export function courseLocationFromSlug(slug: string): { courseId: string; pagePath: string | null } | null {
  const rest = slug.startsWith(COURSE_SLUG_PREFIX) ? slug.slice(COURSE_SLUG_PREFIX.length) : "";
  const segments = rest.split("/");
  const courseId = segments[0] ?? "";
  const pageSegments = segments.slice(1);

  if (courseId === "" || pageSegments.includes("")) {
    return null;
  }

  const pagePath = pageSegments.join("/");
  return { courseId, pagePath: pagePath === "" ? null : pagePath };
}
