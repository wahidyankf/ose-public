import type { PathManifest, PathManifestFile } from "./schemas";

// Decision 39: plan 06 removes the accounting entries; plan 07 deletes this module
/**
 * The closed allowlist of skills paths awaiting restructure (decision 39): each entry maps
 * a skills path ID to the plan that restructures it in the same PR as its filled courses.
 * Plan 06 removes the accounting entries; plan 07 removes the ERP entries and deletes
 * this module together with the `restructurePendingIn` field.
 */
export const SKILLS_RESTRUCTURE_ALLOWLIST: ReadonlyMap<string, "plan-06" | "plan-07"> = new Map([
  ["skills/conventional-accounting", "plan-06"],
  ["skills/sharia-accounting", "plan-06"],
  ["skills/conventional-erp", "plan-07"],
  ["skills/sharia-erp", "plan-07"],
]);

/**
 * True when `file` has exactly the mechanical shape a marked manifest must keep until its
 * owning plan restructures it: one `all-courses` core phase with no outcome, no goals,
 * and an empty `assumes`.
 *
 * Pure — no IO, never throws.
 */
export function isMarkedShape(file: PathManifestFile): boolean {
  if (file.phases.length !== 1) {
    return false;
  }
  const [phase] = file.phases;
  return (
    phase !== undefined &&
    phase.id === "all-courses" &&
    phase.kind === "core" &&
    phase.outcome === undefined &&
    file.goals === undefined &&
    file.assumes.length === 0
  );
}

/**
 * True when `manifest` carries the restructure marker (so the flat render and the core-rule
 * exemption apply). The schema already proves an allowlisted path with its own plan;
 * this predicate only reads the marker's presence.
 *
 * Pure — no IO, never throws.
 */
export function isPendingSkillsRestructure(manifest: PathManifest): boolean {
  return manifest.restructurePendingIn !== undefined;
}

/**
 * Check marker usage across the whole published manifest set (rule R9): every allowlist
 * entry must be used by its real manifest carrying exactly its allowlisted marker, and no
 * other manifest may carry a marker.
 *
 * Pure — no IO, never throws.
 */
export function checkMarkerUsage(manifests: readonly PathManifest[]): {
  unusedAllowlistEntries: string[];
  unexpectedMarkers: string[];
} {
  const unusedAllowlistEntries = [...SKILLS_RESTRUCTURE_ALLOWLIST.entries()]
    .filter(
      ([pathId, plan]) =>
        !manifests.some((manifest) => manifest.pathId === pathId && manifest.restructurePendingIn === plan),
    )
    .map(([pathId]) => pathId);

  const unexpectedMarkers = manifests
    .filter(
      (manifest) =>
        manifest.restructurePendingIn !== undefined &&
        SKILLS_RESTRUCTURE_ALLOWLIST.get(manifest.pathId) !== manifest.restructurePendingIn,
    )
    .map((manifest) => manifest.pathId);

  return { unusedAllowlistEntries, unexpectedMarkers };
}
