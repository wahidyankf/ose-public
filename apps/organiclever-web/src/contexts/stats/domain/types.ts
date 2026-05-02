// stats context — domain layer.
//
// Pure types and pure projection helpers — no `effect`, no IO, no
// infrastructure imports. The Effect-typed use-cases that read from
// the journal live in `application/stats.ts` and consume these
// projections.

// ---------------------------------------------------------------------------
// Value types
// ---------------------------------------------------------------------------

export interface WeeklyStats {
  workoutsThisWeek: number;
  streak: number;
  totalMins: number;
  totalSets: number;
}

export interface DayEntry {
  date: Date;
  label: string;
  durationMins: number;
  sessions: number;
}

export interface ExerciseProgressPoint {
  date: string;
  weight: number;
  reps: number;
  estimated1RM: number | null;
  isPR: boolean;
}

export interface ExerciseProgress {
  routineName: string | null;
  points: ExerciseProgressPoint[];
}

// ---------------------------------------------------------------------------
// Pure projection helpers
// ---------------------------------------------------------------------------

/**
 * Parse a weight string like `"60kg"` or `"45lb"` into a numeric weight.
 * Returns 0 for null, empty, or non-numeric input.
 */
export function parseWeight(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 0;
  const match = raw.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1] ?? "0") : 0;
}

/**
 * Brzycki 1-rep-max estimator. Returns null for rep counts outside the
 * formula's reliable range (1..10) or when the denominator collapses.
 */
export function brzycki1RM(weight: number, reps: number): number | null {
  if (reps < 1 || reps > 10) return null;
  if (reps === 1) return weight;
  const denominator = 37 - reps;
  if (denominator <= 0) return null;
  return weight * (36 / denominator);
}

/**
 * Coerce a string/number/bigint/null to a finite number. `null` and
 * unparseable strings collapse to 0.
 */
export function toNumber(val: string | number | bigint | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === "bigint") return Number(val);
  if (typeof val === "string") return parseFloat(val) || 0;
  return val;
}

/**
 * Coerce a string/Date/null to an ISO `YYYY-MM-DD` date string. `null`
 * collapses to today's date.
 */
export function toDateStr(val: string | Date | null | undefined): string {
  if (val == null) return new Date().toISOString().slice(0, 10);
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return val.toString().slice(0, 10);
}

/**
 * Internal-shape week-row used by `computeStreak`. The application layer
 * builds rows of this shape from a journal aggregation query and feeds
 * them in here for streak computation.
 */
export interface WeekWorkoutRow {
  week_start: string | Date;
  workout_count: string | number;
}

/**
 * Compute the user's current streak in qualifying weeks. A week
 * "qualifies" if it contains >= 2 workout entries. The streak counts
 * consecutive qualifying weeks ending at the current Monday-based
 * week start.
 */
export function computeStreak(rows: WeekWorkoutRow[]): number {
  if (rows.length === 0) return 0;

  // Build a set of week-start ISO strings with >= 2 workouts
  const qualifyingWeeks = new Set<string>();
  for (const row of rows) {
    if (toNumber(row.workout_count) >= 2) {
      qualifyingWeeks.add(toDateStr(row.week_start));
    }
  }

  // Current week start (Monday-based, matching date_trunc('week'))
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - daysSinceMonday);
  currentWeekStart.setHours(0, 0, 0, 0);

  let streak = 0;
  const weekCursor = new Date(currentWeekStart);

  // Walk backwards week by week
  for (let i = 0; i < 52; i++) {
    const weekStr = weekCursor.toISOString().slice(0, 10);
    if (qualifyingWeeks.has(weekStr)) {
      streak++;
      weekCursor.setDate(weekCursor.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}
