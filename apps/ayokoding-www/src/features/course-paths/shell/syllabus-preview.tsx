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
 * No manually-rendered `{index + 1}.` prefix (DWT-002 fix, phase-5 rule-15 design-tester retest):
 * this component previously prepended its own local list index in front of each course title, and
 * the old titles still embedded their own catalog numbers, so the two numbers collided into a
 * doubled number in front of every preview item. Titles no longer carry catalog numbers
 * (plan ayokoding-learn-revamp-01), so this plan's Phase 4 adds the path position number
 * explicitly as the only visible number. The `<ol>`
 * itself already carries the "number is order" semantics (matching `path-landing.tsx`'s sibling
 * syllabus, which renders no added index either).
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
            {title}
          </li>
        ))}
      </ol>
      {" →"}
    </div>
  );
}
