/**
 * The 14 course categories (plan ayokoding-learn-revamp-03, tech-docs/003) — the fixed
 * taxonomy the catalog page and the sidebar groups share. Display order runs from the first
 * things a new learner needs (tools, a language) to specialist domains (accounting, ERP).
 *
 * Pure — no IO. Labels and blurbs are translation keys so the `id` dictionary stays complete
 * even though `content/id/` has no courses today.
 */

export const COURSE_CATEGORY_IDS = [
  "tools-and-practices",
  "programming-languages",
  "computer-science",
  "application-development",
  "data-and-databases",
  "systems-and-networking",
  "architecture-and-distributed-systems",
  "infrastructure-and-operations",
  "security",
  "ai-engineering",
  "product-and-leadership",
  "interview-preparation",
  "accounting",
  "erp-systems",
] as const;

export type CourseCategoryId = (typeof COURSE_CATEGORY_IDS)[number];

export interface CourseCategory {
  id: CourseCategoryId;
  /** 1-14, display order. */
  order: number;
  labelKey: string;
  blurbKey: string;
}

function category(id: CourseCategoryId, order: number, name: string): CourseCategory {
  return { id, order, labelKey: `courseCategory${name}`, blurbKey: `courseCategory${name}Blurb` };
}

export const COURSE_CATEGORIES: readonly CourseCategory[] = [
  category("tools-and-practices", 1, "ToolsAndPractices"),
  category("programming-languages", 2, "ProgrammingLanguages"),
  category("computer-science", 3, "ComputerScience"),
  category("application-development", 4, "ApplicationDevelopment"),
  category("data-and-databases", 5, "DataAndDatabases"),
  category("systems-and-networking", 6, "SystemsAndNetworking"),
  category("architecture-and-distributed-systems", 7, "ArchitectureAndDistributedSystems"),
  category("infrastructure-and-operations", 8, "InfrastructureAndOperations"),
  category("security", 9, "Security"),
  category("ai-engineering", 10, "AiEngineering"),
  category("product-and-leadership", 11, "ProductAndLeadership"),
  category("interview-preparation", 12, "InterviewPreparation"),
  category("accounting", 13, "Accounting"),
  category("erp-systems", 14, "ErpSystems"),
];

const CATEGORY_BY_ID = new Map<string, CourseCategory>(COURSE_CATEGORIES.map((c) => [c.id, c]));

export function isCourseCategoryId(value: string): value is CourseCategoryId {
  return CATEGORY_BY_ID.has(value);
}

export function courseCategoryById(id: string): CourseCategory | null {
  return CATEGORY_BY_ID.get(id) ?? null;
}

export interface CourseCategoryGroup<T> {
  /** Null is the final "Other courses" group (missing or unknown category). */
  category: CourseCategory | null;
  items: T[];
}

/**
 * Group items by course category in display order. Empty categories are skipped; items with
 * a missing or unknown category land in one final `category: null` group, present only when
 * such an item exists. Input order is preserved inside each group.
 */
export function groupByCourseCategory<T>(
  items: readonly T[],
  categoryOf: (item: T) => string | undefined,
): CourseCategoryGroup<T>[] {
  const byId = new Map<CourseCategoryId, T[]>();
  const other: T[] = [];

  for (const item of items) {
    const raw = categoryOf(item);
    if (raw !== undefined && isCourseCategoryId(raw)) {
      const list = byId.get(raw) ?? [];
      list.push(item);
      byId.set(raw, list);
    } else {
      other.push(item);
    }
  }

  const groups: CourseCategoryGroup<T>[] = [];
  for (const cat of COURSE_CATEGORIES) {
    const list = byId.get(cat.id);
    if (list && list.length > 0) {
      groups.push({ category: cat, items: list });
    }
  }
  if (other.length > 0) {
    groups.push({ category: null, items: other });
  }
  return groups;
}
