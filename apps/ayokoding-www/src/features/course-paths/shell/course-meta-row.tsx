import { Badge } from "@open-sharia-enterprise/web-ui";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { tf } from "@/features/i18n/core/fill";
import { courseFormatLabelKey } from "@/features/content/core/course-metadata";
import { OutlineBadge } from "./outline-badge";

/**
 * The shared meta row (plan 03): format badge or Outline badge, "About N h" (unless outline),
 * category label (header variant), and "In N path(s)" (card variant). Text, never color alone.
 */
export interface CourseMetaRowProps {
  locale: string;
  format?: string;
  estimatedHours?: number;
  isOutline: boolean;
  categoryLabel?: string;
  pathCount?: number;
}

export function CourseMetaRow({
  locale,
  format,
  estimatedHours,
  isOutline,
  categoryLabel,
  pathCount,
}: CourseMetaRowProps) {
  const loc = locale as Locale;
  const formatKey = format ? courseFormatLabelKey(format) : null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {isOutline ? (
        <OutlineBadge locale={locale} />
      ) : formatKey ? (
        <Badge variant="secondary" size="sm">
          {t(loc, formatKey)}
        </Badge>
      ) : null}
      {!isOutline && estimatedHours !== undefined ? (
        <span>{tf(loc, "courseEstimatedHours", { hours: estimatedHours })}</span>
      ) : null}
      {categoryLabel ? <span>{categoryLabel}</span> : null}
      {pathCount !== undefined ? (
        <span>{tf(loc, pathCount === 1 ? "coursePathCountOne" : "coursePathCountMany", { count: pathCount })}</span>
      ) : null}
    </div>
  );
}
