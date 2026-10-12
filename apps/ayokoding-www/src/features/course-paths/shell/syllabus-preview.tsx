import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";

export interface SyllabusPreviewProps {
  locale: string;
  /** The first phase's title — rendered in the "Starts with Phase 1 · <title>:" label. */
  phaseTitle: string;
  /** The first phase's course titles, in path order — every one is shown. */
  courseTitles: readonly string[];
}

/**
 * The single-role arc landing's first-phase syllabus preview (plan 02, Phase 4, FR-8) — a small
 * `<ol>` of the manifest's first phase's courses, sharing the same "number is order" list
 * semantics `path-landing.tsx`'s own syllabus uses, so a lone role card never reads as a stub
 * next to a fabricated empty second card.
 *
 * Every item renders its path position (`index + 1` in the first phase, which opens the path)
 * as inline text before the title (plan ayokoding-learn-revamp-01 §4.2). Prepending the number
 * is safe now — the DWT-002 collision is closed: the Phase 3 strip removed every catalogue and
 * pass number from the course titles, so the rendered position number is the only number an
 * item can show; no item renders a doubled number any more. The `<ol>` itself already carries
 * the "number is order" semantics (matching `path-landing.tsx`'s sibling syllabus).
 */
export function SyllabusPreview({ locale, phaseTitle, courseTitles }: SyllabusPreviewProps) {
  return (
    // A <div>, not a <p>: <p> only permits phrasing content, and the block-level <ol> below is
    // invalid as a <p> descendant — browsers silently close the <p> early to recover, which
    // diverges SSR output from the hydrated client tree (a real hydration-mismatch defect found
    // live via Playwright MCP, see this file's regression test).
    <div className="mt-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        {t(locale as Locale, "pathsStartsWith")} {t(locale as Locale, "pathsPhaseLabel")} 1 · {phaseTitle}:
      </span>{" "}
      <ol className="inline">
        {courseTitles.map((title, index) => (
          <li key={title} className="inline">
            {index > 0 && " · "}
            <span className="tabular-nums">{index + 1}</span> {title}
          </li>
        ))}
      </ol>
      {" →"}
    </div>
  );
}
