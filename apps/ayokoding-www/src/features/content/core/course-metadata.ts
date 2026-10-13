import { z } from "zod";
import { frontmatterSchema } from "./schemas";
import { COURSE_CATEGORY_IDS } from "./course-categories";

/**
 * The strict course-metadata check (plan ayokoding-learn-revamp-03, tech-docs/002). Runtime
 * parsing stays tolerant (`frontmatterSchema` `.catch` fields); this strict schema runs in
 * tests so the catalog never shows missing or stale facts. Pure — no IO, never throws.
 */

export const COURSE_FORMATS = [
  "by-example",
  "primer",
  "annotated-concept",
  "annotated-concept-no-code",
  "in-the-field",
  "capstone",
] as const;

export type CourseFormat = (typeof COURSE_FORMATS)[number];

const FORMAT_LABEL_KEYS: Record<CourseFormat, string> = {
  "by-example": "courseFormatByExample",
  primer: "courseFormatPrimer",
  "annotated-concept": "courseFormatAnnotatedConcept",
  "annotated-concept-no-code": "courseFormatAnnotatedConceptNoCode",
  "in-the-field": "courseFormatInTheField",
  capstone: "courseFormatCapstone",
};

export function courseFormatLabelKey(format: string): string | null {
  return (FORMAT_LABEL_KEYS as Record<string, string>)[format] ?? null;
}

const ONE_SENTENCE = /^[^\n·]*[.!?]$/;

export const courseMetadataSchema = z
  .object({
    category: z.enum(COURSE_CATEGORY_IDS),
    description: z
      .string()
      .min(20)
      .max(120)
      .regex(ONE_SENTENCE, "one line, no '·', ends with . ! or ?")
      .refine((text) => (text.match(/[.!?](\s|$)/g) ?? []).length === 1, "exactly one sentence"),
    format: z.enum(COURSE_FORMATS).optional(),
    estimatedHours: z.number().int().min(1).max(200).optional(),
    status: frontmatterSchema.shape.status,
  })
  .superRefine((value, ctx) => {
    if (value.status === "outline") return;
    if (value.format === undefined) {
      ctx.addIssue({ code: "custom", path: ["format"], message: "required unless status is outline" });
    }
    if (value.estimatedHours === undefined) {
      ctx.addIssue({ code: "custom", path: ["estimatedHours"], message: "required unless status is outline" });
    }
  });

export interface CourseMetadataIssue {
  courseId: string;
  field: string;
  message: string;
}

/** Validate one course's raw frontmatter; returns every issue, never throws. */
export function checkCourseMetadata(courseId: string, frontmatter: Record<string, unknown>): CourseMetadataIssue[] {
  const result = courseMetadataSchema.safeParse(frontmatter);
  const issues: CourseMetadataIssue[] = result.success
    ? []
    : result.error.issues.map((issue) => ({
        courseId,
        field: issue.path.join(".") || "(root)",
        message: issue.message,
      }));
  // The strict schema's superRefine only runs on a parsed object, so a course that fails a
  // field check would otherwise hide its missing-field issues. The guard must name every
  // failing field (Gherkin: "Invalid metadata names the course and the field").
  if (frontmatter["status"] !== "outline") {
    if (frontmatter["format"] === undefined && !issues.some((i) => i.field === "format")) {
      issues.push({ courseId, field: "format", message: "required unless status is outline" });
    }
    if (frontmatter["estimatedHours"] === undefined && !issues.some((i) => i.field === "estimatedHours")) {
      issues.push({ courseId, field: "estimatedHours", message: "required unless status is outline" });
    }
  }
  return issues;
}
