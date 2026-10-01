// AI BENCHMARK — shared minimum tap-target sizing (Phase 8, cycle 8.1, DD-30).
//
// WCAG 2.5.8 (Target Size, Minimum, AA) requires every pointer target measure at least 24x24 CSS
// px, unless an exception applies — a spacing exception (a 24px circle centred on the target does
// not intersect another target) or an equivalent-target exception. DD-30 rejects relying on the
// spacing exception: adjacent figure cells in a dense table/card cannot be relied on to satisfy it,
// and the exception is fragile under locale changes (Indonesian evidence-grade words are longer
// than their English counterparts, shrinking the gap further). Sizing the target directly, via one
// shared class, is the durable fix.
//
// Every link on the page applies this ONE class string rather than hand-declaring its own minimum —
// the methodology jump link, the table's score links, and the source links — so a future consumer
// inherits the guarantee instead of re-deriving it. min-width has no effect on an inline box, so a
// consumer also lays its link out as `inline-flex` (or `inline-block`).
export const TAP_TARGET_MIN_CLASS = "min-h-6 min-w-6 py-1";
