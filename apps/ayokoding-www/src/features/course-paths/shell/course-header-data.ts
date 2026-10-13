import type { ContentMeta, TreeNode } from "@/features/content/core/types";
import { findSubtree } from "@/features/content/core/tree-builder";
import { courseCategoryById, type CourseCategory } from "@/features/content/core/course-categories";
import { resolveCourseStartSlug } from "@/features/content/core/course-start";
import { slugForCourseId } from "./course-path-nav";

/**
 * Builds the course-header data (plan 03, S2) from a loaded content index and tree.
 * Null when the course meta is missing. IO-free: callers pass already-loaded data.
 */
export interface CourseHeaderData {
  courseId: string;
  description?: string;
  category: CourseCategory | null;
  format?: string;
  estimatedHours?: number;
  isOutline: boolean;
  startSlug: string | null;
}

export function buildCourseHeaderData(
  contentMap: ReadonlyMap<string, ContentMeta>,
  tree: readonly TreeNode[],
  courseId: string,
  locale: string,
): CourseHeaderData | null {
  const meta = contentMap.get(`${locale}:${slugForCourseId(courseId)}`);
  if (!meta) {
    return null;
  }
  const courseNode = findSubtree([...tree], slugForCourseId(courseId));
  const isRealPage = (slug: string) => contentMap.has(`${locale}:${slug}`);
  const startSlug = courseNode ? resolveCourseStartSlug(courseNode, isRealPage) : null;

  return {
    courseId,
    description: meta.description,
    category: meta.category ? courseCategoryById(meta.category) : null,
    format: meta.format,
    estimatedHours: meta.estimatedHours,
    isOutline: meta.status === "outline",
    startSlug,
  };
}
