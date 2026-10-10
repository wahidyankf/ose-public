/** How many leading courses count as the "first phase" preview (Cycle 3.1c-ii, R7). */
const FIRST_PHASE_PREVIEW_COUNT = 3;

export interface SyllabusPreviewProps {
  /** Already-resolved course titles, in manifest `courseOrder`. Only the first 3 are shown. */
  courseTitles: readonly string[];
}

/**
 * The single-role arc landing's inline first-phase syllabus preview (Cycle 3.1c-ii, R7) — a small
 * `<ol>` of the manifest's first courses, sharing the same "number is order" list semantics
 * `path-landing.tsx`'s own syllabus uses (Cycle 3.1's REFACTOR note), so a lone role card never
 * reads as a stub next to a fabricated empty second card.
 *
 * `PathManifest` has no explicit phase-boundary field, so "first phase" is approximated as the
 * first {@link FIRST_PHASE_PREVIEW_COUNT} courses in `courseOrder` — a documented simplification,
 * not a hidden one.
 *
 * Every item renders its path position (`index + 1` in `courseOrder`) as inline text before the
 * title (plan ayokoding-learn-revamp-01 §4.2). Prepending the number is safe now — the DWT-002
 * collision is closed: the Phase 3 strip removed every catalogue and pass number from the course
 * titles, so the rendered position number is the only number an item can show; no item renders a
 * doubled number any more. The `<ol>`
 * itself already carries the "number is order" semantics (matching `path-landing.tsx`'s sibling
 * syllabus).
 */
export function SyllabusPreview({ courseTitles }: SyllabusPreviewProps) {
  const preview = courseTitles.slice(0, FIRST_PHASE_PREVIEW_COUNT);

  return (
    // A <div>, not a <p>: <p> only permits phrasing content, and the block-level <ol> below is
    // invalid as a <p> descendant — browsers silently close the <p> early to recover, which
    // diverges SSR output from the hydrated client tree (a real hydration-mismatch defect found
    // live via Playwright MCP, see this file's regression test).
    <div className="mt-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Starts with:</span>{" "}
      <ol className="inline">
        {preview.map((title, index) => (
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
