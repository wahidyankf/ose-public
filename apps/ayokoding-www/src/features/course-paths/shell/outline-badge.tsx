import { Badge } from "@open-sharia-enterprise/web-ui";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";

/**
 * The Outline badge (plan ayokoding-learn-revamp-02-path-model, Phase 4, FR-6) — a thin wrapper
 * around the shared `Badge` (`variant="secondary"`, `size="sm"`), shown next to every course
 * whose frontmatter carries `status: outline` wherever a path lists it: the landing syllabus,
 * the rail, and the drawer.
 *
 * Pure — no IO. The text is interface chrome, so it localizes (decision 35 keeps only course
 * *data* in English).
 */
export function OutlineBadge({ locale }: { locale: string }) {
  return (
    <Badge variant="secondary" size="sm">
      {t(locale as Locale, "pathsOutlineBadge")}
    </Badge>
  );
}
