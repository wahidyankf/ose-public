import { Circle, CircleCheck, CircleDashed, type LucideIcon } from "lucide-react";
import type { CourseStatus } from "@/features/learning-progress/core/progress-derivations";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";

const STATUS: Record<CourseStatus, { key: string; icon: LucideIcon; className: string }> = {
  done: { key: "statusDone", icon: CircleCheck, className: "text-green-700" },
  "in-progress": { key: "statusInProgress", icon: CircleDashed, className: "text-amber-700" },
  "not-started": { key: "statusNotStarted", icon: Circle, className: "text-muted-foreground" },
};

/**
 * A course's status in words (plan 04, tech-docs/004 Shared Rules): a hidden icon plus one of
 * `statusDone` / `statusInProgress` / `statusNotStarted`. Colour is only the second signal, never
 * the only one. Pure — no IO.
 */
export function CourseStatusLabel({
  status,
  locale,
  size = "md",
}: {
  status: CourseStatus;
  locale: string;
  size?: "sm" | "md";
}) {
  const { key, icon: Icon, className } = STATUS[status];
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className={`inline-flex items-center gap-1 text-sm ${className}`}>
      <Icon className={iconSize} aria-hidden="true" />
      {t(locale as Locale, key)}
    </span>
  );
}
