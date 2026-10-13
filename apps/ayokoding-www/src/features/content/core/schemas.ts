import { z } from "zod";

export const frontmatterSchema = z.object({
  title: z.string(),
  date: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  weight: z.number().default(0),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  layout: z.string().optional(),
  type: z.string().optional(),
  cascade: z.record(z.string(), z.unknown()).optional(),
  breadcrumbs: z.boolean().optional(),
  bookCollapseSection: z.boolean().optional(),
  bookFlatSection: z.boolean().optional(),
  // Declared course prerequisites (course-paths plan, cycle 2.4) — already authored on every
  // real course `_index.md` by the upstream schema-and-prerequisite-dag plan; this schema is the
  // first place that PARSES the field rather than silently dropping it. Resolved against the
  // library and rendered by `course-paths/shell/prerequisite-list.tsx` in both the canonical and
  // path-aware views.
  prerequisites: z.array(z.string()).default([]),
  // Marker honesty: course-frontmatter.unit.test.ts fails if a sub-1000-word course lacks this status.
  status: z.enum(["outline"]).optional(),
  // Course catalog metadata (plan 03): tolerant at runtime so a typo never hides a page;
  // the strict check lives in course-metadata.ts and runs in tests. An explicitly empty
  // string carries no meaning, so it normalizes to absent (unknown) rather than the wire.
  category: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => (value !== undefined && value.trim() === "" ? undefined : value)),
  format: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => (value !== undefined && value.trim() === "" ? undefined : value)),
  estimatedHours: z.number().optional().catch(undefined),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
