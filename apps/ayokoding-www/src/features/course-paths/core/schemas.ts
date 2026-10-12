import { z } from "zod";
import { SKILLS_RESTRUCTURE_ALLOWLIST, isMarkedShape } from "./skills-restructure-allowlist";

// pathId is variable-depth by design (R2, R8): `careers/<arc>/<role>` (3 segments) or
// `skills/<subject>` (2 segments), and no depth beyond the category segment is ever fixed —
// a future `skills/<arc>/<subject>` (3 segments) or any deeper careers id must keep validating.
// The refine below therefore matches the WHOLE string against one anchored regex: a literal
// category segment (`careers`/`skills`) followed by one or more `/`-separated kebab-case segments
// (`[a-z0-9]+(-[a-z0-9]+)*` — lowercase alphanumerics joined by single hyphens, never empty, never
// leading/trailing a hyphen). Restricting to this charset is defense-in-depth for
// `manifests/README.md`'s documented segment-by-segment directory mapping
// (`careers/interview-ready/software-engineer` -> `manifests/careers/interview-ready/software-engineer.yaml`)
// AND closes two round-trip hazards a looser per-segment check missed (PR review finding #1/#2,
// `pr-review-synthesis-maker` review 4770318960, cycle 2):
// (1) `contentUrl` interpolates `pathId` into a `?path=` query string unencoded, so any character
//     outside this charset (`&`, `=`, `#`, `%`, whitespace, `.`/`..`, backslash, null byte) could
//     silently truncate or corrupt the query string on its `URLSearchParams` round-trip in
//     `parsePathContext`;
// (2) matching the ENTIRE string against one anchored pattern — rather than counting segments after
//     a `.split("/").filter(Boolean)` that drops empty tokens — rejects a trailing slash or a
//     doubled slash outright, instead of silently normalizing it into the same canonical id as its
//     clean form.
const PATH_ID_CATEGORIES = ["careers", "skills"] as const;
const KEBAB_SEGMENT = "[a-z0-9]+(?:-[a-z0-9]+)*";
const pathIdPattern = new RegExp(`^(?:${PATH_ID_CATEGORIES.join("|")})(?:/${KEBAB_SEGMENT}){1,}$`);

const pathIdSchema = z.string().refine((pathId) => pathIdPattern.test(pathId), {
  message:
    "pathId must start with 'careers/' or 'skills/', carry at least one further kebab-case segment " +
    "(lowercase alphanumerics and single internal hyphens only, no empty/trailing/doubled slash), " +
    "and contain no traversal, backslash, null-byte, or other non-kebab character",
});

const courseFramingSchema = z.object({
  intro: z.string().optional(),
  outro: z.string().optional(),
});

const courseRefSchema = z.union([
  z.string(),
  z.object({
    id: z.string(),
    framing: courseFramingSchema.optional(),
  }),
]);

const phaseIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const phaseOutcomeSchema = z
  .object({ can: z.string().min(1), cannotYet: z.string().min(1).optional() })
  .strict();

export const pathPhaseSchema = z
  .object({
    id: phaseIdSchema,
    title: z.string().min(1),
    kind: z.enum(["core", "extension"]),
    outcome: phaseOutcomeSchema.optional(),
    courses: z.array(courseRefSchema).min(1),
  })
  .strict();

/** On-disk shape of a phase-shaped manifest file (after the contract step, the only shape). */
const phaseShapedFileSchema = z
  .object({
    pathId: pathIdSchema,
    // `arc` is required on every manifest regardless of category (R8) — for `skills/*` paths the
    // arc is omitted from the URL, but it is never optional in the manifest data.
    arc: z.string(),
    title: z.string(),
    description: z.string(),
    // Decision 39: plan 06 removes the accounting entries; plan 07 deletes this module
    restructurePendingIn: z.enum(["plan-06", "plan-07"]).optional(),
    goals: z.array(z.string()).min(1).optional(),
    assumes: z.array(z.string()).default([]),
    phases: z.array(pathPhaseSchema).min(1),
  })
  .strict()
  .superRefine((file, ctx) => {
    const marker = file.restructurePendingIn;
    if (marker !== undefined) {
      // Closed allowlist: exact path ID and exact plan, or the file fails to parse.
      if (SKILLS_RESTRUCTURE_ALLOWLIST.get(file.pathId) !== marker) {
        ctx.addIssue({ code: "custom", path: ["restructurePendingIn"], message: "marker not allowed" });
      }
      if (!isMarkedShape(file)) {
        ctx.addIssue({ code: "custom", path: ["phases"], message: "marked manifest must be one all-courses phase" });
      }
      return; // a marked manifest's single core phase has no outcome
    }
    // The core-outcome rule lives here (not on the phase schema) because only the manifest
    // knows whether it is marked.
    file.phases.forEach((phase, index) => {
      if (phase.kind === "core" && phase.outcome === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["phases", index, "outcome"],
          message: "a core phase must declare an outcome",
        });
      }
    });
  });

// expand-contract: removed in Phase 6
const legacyManifestFileSchema = z
  .object({
    pathId: pathIdSchema,
    // `arc` is required on every manifest regardless of category (R8) — for `skills/*` paths the
    // arc is omitted from the URL, but it is never optional in the manifest data.
    arc: z.string(),
    title: z.string(),
    description: z.string(),
    courseOrder: z.array(courseRefSchema),
  })
  .strict();

/**
 * On-disk shape of a manifest file during the expand step: either the phase shape above or
 * the legacy `{courseOrder}` shape, normalized to phases (a legacy file becomes one core
 * `all-courses` phase with no outcome — the outcome refine applies only to the new shape,
 * so every existing legacy manifest keeps parsing).
 */
export const PathManifestFileSchema = z.union([phaseShapedFileSchema, legacyManifestFileSchema]).transform((file) =>
  "courseOrder" in file
    ? {
        pathId: file.pathId,
        arc: file.arc,
        title: file.title,
        description: file.description,
        goals: undefined as string[] | undefined,
        assumes: [] as string[],
        phases: [
          {
            id: "all-courses",
            title: file.title,
            kind: "core" as const,
            courses: file.courseOrder,
          },
        ],
      }
    : file,
);

/** Domain shape: the file shape plus the derived, flattened order. */
export const PathManifestSchema = PathManifestFileSchema.transform((file) => ({
  ...file,
  courseOrder: file.phases.flatMap((phase) => phase.courses),
}));

export type PathPhase = z.infer<typeof pathPhaseSchema>;
export type PathManifestFile = z.output<typeof PathManifestFileSchema>;
export type PathManifest = z.output<typeof PathManifestSchema>;
export type CourseRef = z.infer<typeof courseRefSchema>;
