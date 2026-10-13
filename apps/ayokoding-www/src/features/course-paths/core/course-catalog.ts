import type { ContentMeta } from "@/features/content/core/types";
import { groupByCourseCategory, type CourseCategory } from "@/features/content/core/course-categories";
import type { PathManifest } from "./schemas";
import { courseRootIdFromSlug, derivePathBadges } from "../shell/course-path-nav";

/**
 * The course catalog data (plan 03, tech-docs/005 S1). Pure — no IO. Keeps only course roots
 * for `locale`, groups them by category, sorts each group by title.
 */

export interface CourseCatalogEntry {
  courseId: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  format?: string;
  estimatedHours?: number;
  isOutline: boolean;
  pathCount: number;
}

export interface CourseCatalogGroup {
  category: CourseCategory | null;
  entries: CourseCatalogEntry[];
}

export function buildCourseCatalog(
  contentMap: ReadonlyMap<string, ContentMeta>,
  manifests: readonly PathManifest[],
  locale: string,
): CourseCatalogGroup[] {
  const entries: CourseCatalogEntry[] = [];

  for (const [key, meta] of contentMap) {
    if (!key.startsWith(`${locale}:`)) continue;
    const courseId = courseRootIdFromSlug(meta.slug);
    if (courseId === null) continue;
    entries.push({
      courseId,
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      category: meta.category,
      format: meta.format,
      estimatedHours: meta.estimatedHours,
      isOutline: meta.status === "outline",
      pathCount: derivePathBadges(manifests, courseId).length,
    });
  }

  const groups = groupByCourseCategory(entries, (entry) => entry.category);
  return groups.map((group) => ({
    category: group.category,
    entries: [...group.items].sort((a, b) => a.title.localeCompare(b.title, "en")),
  }));
}
