type ExerciseSpec = {
  type: "reps" | "duration" | "oneoff";
  targetSets: number;
  targetReps: number;
  targetWeight: string | null;
  targetDuration: number | null;
  bilateral: boolean;
};

/**
 * Format seconds as M:SS (when >= 60) or Ns (when < 60).
 *
 * fmtTime(90)   → "1:30"
 * fmtTime(45)   → "45s"
 * fmtTime(0)    → "0s"
 * fmtTime(3600) → "60:00"
 * fmtTime(125)  → "2:05"
 */
export function fmtTime(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format grams as a human-readable weight string.
 * Values >= 1000 are shown as kg with up to 1 decimal (trailing ".0" trimmed).
 *
 * fmtKg(1500) → "1.5k"
 * fmtKg(1000) → "1k"
 * fmtKg(850)  → "850"
 */
export function fmtKg(val: number): string {
  if (val >= 1000) {
    return `${parseFloat((val / 1000).toFixed(1))}k`;
  }
  return String(val);
}

/**
 * Format an exercise spec as a human-readable string.
 *
 * Reps mode:     "{sets} × {reps}[ LR] @ {weight}"  (weight optional)
 * Duration mode: "{sets} × {fmtTime(targetDuration)}"
 * One-off mode:  "1 set"
 */
export function fmtSpec(exercise: ExerciseSpec): string {
  const { type, targetSets, targetReps, targetWeight, targetDuration, bilateral } = exercise;

  if (type === "oneoff") return "1 set";

  if (type === "duration") {
    const duration = targetDuration ?? 0;
    return `${targetSets} × ${fmtTime(duration)}`;
  }

  // reps
  const laterality = bilateral ? " LR" : "";
  const repsStr = `${targetSets} × ${targetReps}${laterality}`;
  if (targetWeight) return `${repsStr} @ ${targetWeight}`;
  return repsStr;
}
