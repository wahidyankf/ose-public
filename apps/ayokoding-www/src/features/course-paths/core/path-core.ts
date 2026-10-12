import type { PrerequisitesByCourse } from "./prerequisites";

/**
 * Compute the core course set for `goals`: each goal plus every transitive prerequisite,
 * except prerequisites named in `assumes` (and anything beyond them).
 *
 * Breadth-first walk from `goals` over `prerequisitesByCourse`. A course named in `assumes`
 * is never added and never walked through (the closure stops there); a prerequisite ID
 * with no entry in `prerequisitesByCourse` is ignored (a resolver miss, never a crash —
 * the integrity rules surface dangling IDs separately). Shared prerequisites collapse
 * naturally through the visited set, so a diamond dependency counts once.
 *
 * Pure — no IO, never throws. The goals rule (R6) compares this expected set against the
 * manifest's actual core phases.
 */
export function computeCore(
  goals: readonly string[],
  prerequisitesByCourse: PrerequisitesByCourse,
  assumes?: readonly string[],
): ReadonlySet<string> {
  const assumed = new Set(assumes ?? []);
  const core = new Set<string>();
  const queue: string[] = [];

  for (const goal of goals) {
    if (!assumed.has(goal) && !core.has(goal)) {
      core.add(goal);
      queue.push(goal);
    }
  }

  while (queue.length > 0) {
    const courseId = queue.shift() as string;
    for (const prerequisiteId of prerequisitesByCourse[courseId] ?? []) {
      // Unknown IDs are ignored; assumed courses stop the walk (never added, never expanded).
      if (!(prerequisiteId in prerequisitesByCourse) || assumed.has(prerequisiteId)) {
        continue;
      }
      if (!core.has(prerequisiteId)) {
        core.add(prerequisiteId);
        queue.push(prerequisiteId);
      }
    }
  }

  return core;
}
