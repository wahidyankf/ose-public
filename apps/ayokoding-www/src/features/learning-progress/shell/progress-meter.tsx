const TONE_CLASSES: Record<ProgressMeterProps["tone"], string> = {
  primary: "bg-primary",
  progress: "bg-amber-700",
  done: "bg-green-700",
};

export interface ProgressMeterProps {
  value: number;
  max: number;
  tone: "primary" | "progress" | "done";
}

/**
 * A progress bar (plan 04, tech-docs/004 Shared Rules). Decoration only: it is `aria-hidden`, so
 * the visible text beside it carries the value. The width is `value / max`; `max = 0` renders an
 * empty track. Only the width animates, and only when the reader has not asked for reduced motion.
 * Pure — no IO.
 */
export function ProgressMeter({ value, max, tone }: ProgressMeterProps) {
  const width = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="h-2 w-full rounded-full bg-muted" aria-hidden="true">
      <div
        className={`h-2 rounded-full motion-safe:transition-[width] motion-safe:duration-300 ${TONE_CLASSES[tone]}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
