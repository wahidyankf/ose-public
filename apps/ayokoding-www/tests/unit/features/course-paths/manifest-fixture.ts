import {
  PathManifestSchema,
  type CourseRef,
  type PathManifest,
  type PathPhase,
} from "../../../../src/features/course-paths/core/schemas";

/**
 * Options for {@link manifestFixture}. Every field is optional; the fixture builds a parsed
 * `PathManifest` with one core phase by default. `courses` is shorthand for that default
 * phase's course list — pass `phases` for multi-phase manifests. Anything the fixture parses
 * (including `phases` and the marker in AC-2.5) must satisfy `PathManifestSchema`; shapes that
 * must fail the schema are built as raw objects, never through this helper.
 */
export interface ManifestFixtureOptions {
  pathId?: string;
  arc?: string;
  title?: string;
  description?: string;
  /** Full phase list. When omitted, one core phase is built from `courses`. */
  phases?: PathPhase[];
  /** Shorthand for the default single core phase's courses. */
  courses?: readonly CourseRef[];
  goals?: string[];
  assumes?: readonly string[];
  restructurePendingIn?: "plan-06" | "plan-07";
}

const DEFAULT_FIXTURE_COURSES: readonly string[] = ["foundations", "application", "advanced"];

/**
 * Build a parsed `PathManifest` for tests — the shared replacement for hand-written
 * `PathManifest` literals with a legacy `courseOrder` key (plan 02 replaced the file shape
 * with `phases`, so literals no longer satisfy the domain type).
 *
 * Pure — parses an in-memory object through `PathManifestSchema`, so the returned manifest
 * always carries the derived `courseOrder` exactly as production manifests do. Throws when
 * the options do not satisfy the schema (fail fast, never a silently invalid fixture).
 */
export function manifestFixture(options: ManifestFixtureOptions = {}): PathManifest {
  const courses = options.courses ?? DEFAULT_FIXTURE_COURSES;
  const defaultPhase: PathPhase = {
    id: "phase-a",
    title: "Phase A",
    kind: "core",
    outcome: { can: "complete this fixture path" },
    courses: [...courses],
  };

  // The marker spread is untyped on purpose: `restructurePendingIn` joins the schema in
  // AC-2.5, and a spread property is never excess-checked, so this helper compiles both
  // before and after that step. No caller passes a marker until AC-2.5.
  const marker =
    options.restructurePendingIn !== undefined ? { restructurePendingIn: options.restructurePendingIn } : {};

  return PathManifestSchema.parse({
    pathId: options.pathId ?? "skills/example",
    arc: options.arc ?? "example",
    title: options.title ?? "Example",
    description: options.description ?? "A deterministic in-memory fixture",
    ...(options.goals !== undefined ? { goals: options.goals } : {}),
    ...(options.assumes !== undefined ? { assumes: [...options.assumes] } : {}),
    ...marker,
    phases: options.phases ?? [defaultPhase],
  });
}
