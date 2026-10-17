import { z } from "zod";

/** The one `localStorage` key the progress record lives under (plan 04, tech-docs/002). */
export const PROGRESS_STORAGE_KEY = "ayokoding-learn-progress-v1";
export const PROGRESS_VERSION = 1;

const SEGMENT = "[a-z0-9]+(?:-[a-z0-9]+)*";
export const courseIdSchema = z
  .string()
  .max(120)
  .regex(new RegExp(`^${SEGMENT}$`));
export const pagePathSchema = z
  .string()
  .max(200)
  .regex(new RegExp(`^${SEGMENT}(?:/${SEGMENT})*$`));
export const pathIdSchema = z
  .string()
  .max(200)
  .regex(new RegExp(`^(?:careers|skills)(?:/${SEGMENT})+$`));

export const progressStateSchema = z
  .object({
    version: z.literal(PROGRESS_VERSION),
    completed: z.record(courseIdSchema, z.array(pagePathSchema).max(500)),
    lastPath: z.object({ pathId: pathIdSchema, courseId: courseIdSchema }).strict().nullable(),
    lastCourse: z.object({ courseId: courseIdSchema }).strict().nullable(),
  })
  .strict()
  .refine((value) => Object.keys(value.completed).length <= 500, "too many courses");

export type ProgressState = z.infer<typeof progressStateSchema>;
