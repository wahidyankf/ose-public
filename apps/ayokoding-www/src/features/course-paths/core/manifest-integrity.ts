import { normalizeCourseRef } from "./manifest";
import { computeCore } from "./path-core";
import { corePhases } from "./path-phases";
import type { PrerequisitesByCourse } from "./prerequisites";
import type { PathManifest } from "./schemas";
import { SKILLS_RESTRUCTURE_ALLOWLIST, isPendingSkillsRestructure } from "./skills-restructure-allowlist";

/** Result of {@link checkManifestIntegrity}. */
export interface ManifestIntegrityResult {
  /** Course IDs listed in `courseOrder` that do not resolve to a real library course. */
  unresolvedIds: readonly string[];
  /** Course IDs that appear more than once in `courseOrder` (reported once each). */
  duplicateIds: readonly string[];
}

/** Flattened course IDs of `manifest`'s derived `courseOrder`, in order. */
function orderedCourseIds(manifest: PathManifest): string[] {
  return manifest.courseOrder.map((ref) => normalizeCourseRef(ref).id);
}

/** R1 — course IDs with no matching library course, deduplicated, in first-seen order. */
function checkUnresolvedIds(courseIds: readonly string[], libraryCourseIds: readonly string[]): string[] {
  const knownCourseIds = new Set(libraryCourseIds);
  return [...new Set(courseIds.filter((id) => !knownCourseIds.has(id)))];
}

/** R2 — course IDs listed more than once across all phases, reported once each. */
function checkDuplicateIds(courseIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const id of courseIds) {
    if (seen.has(id)) {
      duplicateIds.add(id);
    }
    seen.add(id);
  }
  return [...duplicateIds];
}

/**
 * Check that every `courseOrder` entry in `manifest` resolves to a real course in the library and
 * that no course ID repeats.
 *
 * Pure — no IO, never throws.
 */
export function checkManifestIntegrity(
  manifest: PathManifest,
  libraryCourseIds: readonly string[],
): ManifestIntegrityResult {
  const courseIds = orderedCourseIds(manifest);
  return { unresolvedIds: checkUnresolvedIds(courseIds, libraryCourseIds), duplicateIds: checkDuplicateIds(courseIds) };
}

/** Inputs to {@link checkPathModelIntegrity}: real frontmatter-derived data, never fixtures. */
export interface PathModelContext {
  prerequisitesByCourse: PrerequisitesByCourse;
  outlineCourseIds: ReadonlySet<string>;
  libraryCourseIds: readonly string[];
}

/** Every integrity rule's findings for one manifest (rules R1–R9 in tech-docs/005). */
export interface PathModelViolations {
  unresolvedIds: string[];
  duplicateIds: string[];
  duplicatePhaseIds: string[];
  emptyPhaseIds: string[]; // also enforced by the schema; kept for synthetic inputs
  coreAfterExtension: string[]; // phase IDs of core phases that follow an extension phase
  closure: { courseId: string; missingPrerequisite: string }[];
  outlineInCore: string[];
  goalsOutsideCore: string[];
  coreMismatch: { missing: string[]; extra: string[] } | null; // only when goals are declared
  unusedAssumes: string[];
  assumesInsidePath: string[];
  unresolvedAssumes: string[];
  skillsExtension: string[]; // extension phase IDs in a skills/ path
  markerNotAllowed: boolean; // decision 39: marker on a path or value the allowlist does not name
}

/** R3 — phase IDs repeated, phases with no courses, and core phases after an extension phase. */
function checkPhaseShape(manifest: PathManifest): {
  duplicatePhaseIds: string[];
  emptyPhaseIds: string[];
  coreAfterExtension: string[];
} {
  const seen = new Set<string>();
  const duplicatePhaseIds = new Set<string>();
  for (const phase of manifest.phases) {
    if (seen.has(phase.id)) {
      duplicatePhaseIds.add(phase.id);
    }
    seen.add(phase.id);
  }

  const emptyPhaseIds = manifest.phases.filter((phase) => phase.courses.length === 0).map((phase) => phase.id);

  const coreAfterExtension: string[] = [];
  let extensionSeen = false;
  for (const phase of manifest.phases) {
    if (phase.kind === "extension") {
      extensionSeen = true;
    } else if (extensionSeen) {
      coreAfterExtension.push(phase.id);
    }
  }

  return { duplicatePhaseIds: [...duplicatePhaseIds], emptyPhaseIds, coreAfterExtension };
}

/** Core course IDs of `manifest`, in flattened path order. */
function coreCourseIdsInOrder(manifest: PathManifest): string[] {
  return corePhases(manifest).flatMap((phase) => phase.courses.map((ref) => normalizeCourseRef(ref).id));
}

/**
 * R4 (closure) — for each core course, each prerequisite must be a course earlier in the
 * path or be listed in `assumes`. A prerequisite that is neither is reported, whether or
 * not it resolves to a library course (dangling IDs are data errors, never silent).
 */
function checkClosure(
  manifest: PathManifest,
  prerequisitesByCourse: PrerequisitesByCourse,
): { courseId: string; missingPrerequisite: string }[] {
  const orderedIds = orderedCourseIds(manifest);
  // Keep the FIRST index for a duplicated course ID (mirrors checkPrerequisiteConsistency):
  // a later re-listing must not turn an earlier, correctly-ordered occurrence into a violation.
  const indexById = new Map<string, number>();
  orderedIds.forEach((id, index) => {
    if (!indexById.has(id)) {
      indexById.set(id, index);
    }
  });
  const assumed = new Set(manifest.assumes);
  const coreIds = new Set(coreCourseIdsInOrder(manifest));

  const closure: { courseId: string; missingPrerequisite: string }[] = [];
  const reported = new Set<string>();
  orderedIds.forEach((courseId, courseIndex) => {
    if (!coreIds.has(courseId)) {
      return;
    }
    for (const prerequisiteId of prerequisitesByCourse[courseId] ?? []) {
      if (assumed.has(prerequisiteId)) {
        continue;
      }
      const prerequisiteIndex = indexById.get(prerequisiteId);
      if (prerequisiteIndex === undefined || prerequisiteIndex > courseIndex) {
        const key = `${courseId} → ${prerequisiteId}`;
        if (!reported.has(key)) {
          reported.add(key);
          closure.push({ courseId, missingPrerequisite: prerequisiteId });
        }
      }
    }
  });
  return closure;
}

/** R5 (no outline in core) — core courses carrying `status: outline`, in path order. */
function checkOutlineInCore(manifest: PathManifest, outlineCourseIds: ReadonlySet<string>): string[] {
  return [...new Set(coreCourseIdsInOrder(manifest).filter((id) => outlineCourseIds.has(id)))];
}

/**
 * R6 (goals) — each goal must sit in a core phase, and the set of core courses must equal
 * `computeCore(goals, …, assumes)`. Returns a null mismatch when the core matches exactly.
 */
function checkGoals(
  manifest: PathManifest,
  prerequisitesByCourse: PrerequisitesByCourse,
): { goalsOutsideCore: string[]; coreMismatch: { missing: string[]; extra: string[] } | null } {
  if (manifest.goals === undefined) {
    return { goalsOutsideCore: [], coreMismatch: null };
  }
  const coreIds = new Set(coreCourseIdsInOrder(manifest));
  const goalsOutsideCore = manifest.goals.filter((goal) => !coreIds.has(goal));
  const expectedCore = computeCore(manifest.goals, prerequisitesByCourse, manifest.assumes);
  const missing = [...expectedCore].filter((id) => !coreIds.has(id)).sort();
  const extra = [...coreIds].filter((id) => !expectedCore.has(id)).sort();
  return { goalsOutsideCore, coreMismatch: missing.length === 0 && extra.length === 0 ? null : { missing, extra } };
}

/**
 * R7 (exact `assumes`) — each assumed ID must resolve to a library course, must not sit
 * inside the path, and must be a declared prerequisite of at least one core course.
 */
function checkAssumes(
  manifest: PathManifest,
  context: PathModelContext,
): { unusedAssumes: string[]; assumesInsidePath: string[]; unresolvedAssumes: string[] } {
  const knownCourseIds = new Set(context.libraryCourseIds);
  const inPath = new Set(orderedCourseIds(manifest));
  const neededByCore = new Set<string>();
  for (const courseId of coreCourseIdsInOrder(manifest)) {
    for (const prerequisiteId of context.prerequisitesByCourse[courseId] ?? []) {
      neededByCore.add(prerequisiteId);
    }
  }
  return {
    unusedAssumes: manifest.assumes.filter((id) => !neededByCore.has(id)),
    assumesInsidePath: manifest.assumes.filter((id) => inPath.has(id)),
    unresolvedAssumes: manifest.assumes.filter((id) => !knownCourseIds.has(id)),
  };
}

/** R8 (skills shape) — a `skills/` path must have no extension phase. */
function checkSkillsExtension(manifest: PathManifest): string[] {
  if (!manifest.pathId.startsWith("skills/")) {
    return [];
  }
  return manifest.phases.filter((phase) => phase.kind === "extension").map((phase) => phase.id);
}

/**
 * Check every path-model rule that applies to `manifest` (R1–R9).
 *
 * A marked manifest (decision 39) skips the core rules — closure, outline-in-core, goals,
 * `assumes`, skills shape, and the schema-level outcome rule — and keeps the ID, duplicate,
 * phase-shape, marker, and ordering checks. Pure — no IO, never throws.
 */
export function checkPathModelIntegrity(manifest: PathManifest, context: PathModelContext): PathModelViolations {
  const marked = isPendingSkillsRestructure(manifest);
  const courseIds = orderedCourseIds(manifest);
  const { duplicatePhaseIds, emptyPhaseIds, coreAfterExtension } = checkPhaseShape(manifest);
  const { goalsOutsideCore, coreMismatch } = marked
    ? { goalsOutsideCore: [], coreMismatch: null }
    : checkGoals(manifest, context.prerequisitesByCourse);
  const { unusedAssumes, assumesInsidePath, unresolvedAssumes } = marked
    ? { unusedAssumes: [], assumesInsidePath: [], unresolvedAssumes: [] }
    : checkAssumes(manifest, context);
  return {
    unresolvedIds: checkUnresolvedIds(courseIds, context.libraryCourseIds),
    duplicateIds: checkDuplicateIds(courseIds),
    duplicatePhaseIds,
    emptyPhaseIds,
    coreAfterExtension,
    closure: marked ? [] : checkClosure(manifest, context.prerequisitesByCourse),
    outlineInCore: marked ? [] : checkOutlineInCore(manifest, context.outlineCourseIds),
    goalsOutsideCore,
    coreMismatch,
    unusedAssumes,
    assumesInsidePath,
    unresolvedAssumes,
    skillsExtension: marked ? [] : checkSkillsExtension(manifest),
    // Set again even though the schema already rejects such a file, so a synthetic manifest
    // built in a test (which skips the schema) cannot slip through.
    markerNotAllowed:
      manifest.restructurePendingIn !== undefined &&
      SKILLS_RESTRUCTURE_ALLOWLIST.get(manifest.pathId) !== manifest.restructurePendingIn,
  };
}

/** True when every rule field is empty, the core matches (or no goals are declared), and no marker is misused. */
export function isCleanPathModel(violations: PathModelViolations): boolean {
  return (
    violations.unresolvedIds.length === 0 &&
    violations.duplicateIds.length === 0 &&
    violations.duplicatePhaseIds.length === 0 &&
    violations.emptyPhaseIds.length === 0 &&
    violations.coreAfterExtension.length === 0 &&
    violations.closure.length === 0 &&
    violations.outlineInCore.length === 0 &&
    violations.goalsOutsideCore.length === 0 &&
    violations.coreMismatch === null &&
    violations.unusedAssumes.length === 0 &&
    violations.assumesInsidePath.length === 0 &&
    violations.unresolvedAssumes.length === 0 &&
    violations.skillsExtension.length === 0 &&
    !violations.markerNotAllowed
  );
}
