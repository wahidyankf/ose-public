<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry (or record the explicit "none" escape) before archival. -->

# Learnings: ayokoding-learn-revamp-01-navigation-and-display

## Triage outcome (2026-10-12, before archival)

**No generalizable learnings — the operational specifics this session faced (a hosting machine's
memory-pressure behaviour forcing a production-server workaround, Playwright cache
re-provisioning, HIPPO pressure-shedding absorption) are host- and toolchain-private facts that
belong outside this public repository, and every repo-level lesson they surfaced is already
landed durably inside this plan's own changes** (§ the segment-renderer token, the
course-content-hygiene test, the rail-bounded scroll shape, the DWT-003 scroll-geometry note in
the S5 fixture comment).

Litmus / secret / repo-relevance gates: no surviving public-route candidates; no sanitization
needed; nothing infra-private routed here. Code-routing rule respected (no learning landed
inline in `apps/` or tests via this log).

## Follow-ups recorded with handoff evidence (phase-10 obligation)

These are REPORTED. None of them is fixed in this repository by plan 01; each names its handoff
surface. None was given an authorized `plans/ideas/` artifact — **reported without plan
authorization** (no idea artifact was requested); the record below plus the linked evidence file
is the handoff.

| #   | Follow-up                                                                                                                               | Source                                                                                             | Handoff evidence                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | The 73 hand-authored "← Previous / Next →" cross-course lines encode the old linear journey                                             | README.md (plan)                                                                                   | `delivery.md` → Phase 10; plan-02 (path model) scope                                                                                              |
| 2   | Path context renders only after hydration on a direct load                                                                              | README.md (plan)                                                                                   | `delivery.md` → Phase 10; plan-04 (learning experience) scope                                                                                     |
| 3   | `syllabus-preview.tsx` hard-codes "Starts with:", the mobile banner hard-codes an English readout                                       | README.md (plan)                                                                                   | `delivery.md` → Phase 10; plan-04 (localization) scope                                                                                            |
| 4   | Id course library is absent — "Switch language" from any course page, plus the whole `/id/learn` directory, lands on 404                | EWT-004 / UWT-002 (phase-8 retest)                                                                 | `delivery.md` §UI Quality Gate and Rule-15 Retest → triage rows; evidence/phase-8-dwt                                                             | uwt captures; plans 02–13 |
| 5   | Homepage "Choose your path" Start cards point at nonexistent path URLs; "Browse the full course library" points at a two-card directory | UWT-001 / UWT-003 (phase-8 retest)                                                                 | same triage rows; pre-existing IA surfaces                                                                                                        |
| 6   | Path manifest prose exposes internal vocabulary ("Dangerous 2",Authoring plan bookkeeping) on landings                                  | UWT-004 (phase-8 retest)                                                                           | same triage rows; plan-02 (path model) rewriting scope                                                                                            |
| 7   | Rail "Where am I" naming; path-less membership cue (chipped on purpose), mobile breadcrumb clipping, opaque "Legacy" page               | UWT-006 (spec-anchored refutation: canonical fallback is spec'd), UWT-007/009/010 (phase-8 retest) | same triage rows; plan-04 UI work                                                                                                                 |
| 8   | Arc-card preview sits outside its card border (pre-existing DOM position)                                                               | DWT-002 (design charter)                                                                           | `evidence/phase-8-design-charter-dwt.md` (moved from a stray primary-checkout write into this worktree); plan-04 layout work                      |
| 9   | Banner "on path" lowercase vs mockup "On path"                                                                                          | DWT-004 (design charter)                                                                           | same evidence file; plan-04 banner localization (carries follow-up 3)                                                                             |
| 10  | References hedge renders as a blockquote while the mockup draws a plain bullet                                                          | DWT-005 (design charter)                                                                           | same evidence file; the §4.4 rule step 8 prescribes the blockquote form — owner decision between the two recorded for plan-08/09 content rewrites |
