# P3 API and UI-feature scope dispositions

This file closes the Phase 3 item "Record API/UI-feature scope dispositions" in `delivery.md`. It states what the
runtime migration changed, which gates that triggers, and what is left for the maintainer. It cites the ledgers
instead of repeating them.

Date: 2026-10-29. Head: `60a35faf1`. The changed-file facts come from `git diff origin/main...HEAD --name-only`.

## 1. API contracts: no change

- No file under any `contracts/` folder, no OpenAPI document, no tRPC router, no database schema, and no SQL migration
  is in the branch diff. The matches for the words "contract" and "schema" in the diff are one unit test file name
  (`apps/organiclever-app-web/tests/unit/e2e-fixture-contracts.unit.test.ts`) and one rules text file.
- The changed behaviour specs are the `ayokoding-cli` runner features, the AyoKoding frontend and build-tool features,
  and two OrganicLever app-web routing features. They describe runner behaviour, UI behaviour and routes, not a
  request or response contract.
- The Rule-16 API-feature retests (exploratory API testing of a changed feature) are therefore **not applicable**:
  no API contract changed. The existing read-only API requests that the plan asks for were still made as container
  wire proof (`manual/backends.md`, `manual/ose-www.md`) and are not a substitute for that rule.
- If a later change touches any API contract, stop, reconcile the scope, and add the API gates before continuing, as
  the delivery item says.

## 2. UI features: one prerequisite repair, gates complete

The migration itself changes no UI feature. The one UI behaviour change in the branch is the prerequisite repair to
`apps/ayokoding-www` that the plan authorizes before delivery:

- Change (a), Mermaid keyboard access: `src/features/content/shell/mermaid.tsx`. The fallback source `<pre>` is
  keyboard-focusable while rendering is pending or failed, and leaves the focus order once the SVG renders. Its
  focus indicator was repaired after the design pass (DWT-006).
- Change (b), sidebar layout boundary: `src/app/[locale]/(content)/layout.tsx` and
  `src/features/course-paths/shell/sidebar-host.tsx`. Non-course routes render the generic sidebar directly; the
  course-path host is wrapped in Suspense on course routes only.
- Specifications that landed with commit `60a35faf1`: `content-rendering.feature` (4 new scenarios),
  `canonical-fallback.feature` (1 new outline, 4 example rows) and `sidebar-course-categories.feature` (1 new
  scenario). Static mapping rose from 63 features and 500 scenarios to 63 and 509; Vitest rose from 4,240 to 4,291
  tests (`target-matrix.md`, notes F and G).
- Browser proof of the changed Ayo frontend scenarios on `60a35faf1`: 45 of 45 passed across Chromium, Firefox and
  WebKit, zero retries (`target-matrix.md`, "Browser matrix for the changed e2e scenarios (final head)").
- `apps/ayokoding-www/src/build-workers.ts` also changed. It is outside both judged changes and the UI gate did not
  review it (`ui-gates/ui-web-quality-gate.md`, scope caveat). Its behaviour is specified by the new
  `build-workers.feature`.

### The sequential triad is done

| Pass                               | Record                                                      | Result                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| EWT (exploratory, spec-aware)      | [ewt.md](./ui-gates/ewt.md)                                 | COMPLETE. 10 findings (0 CRITICAL, 0 HIGH, 7 MEDIUM, 3 LOW), 7 spec-gap proposals                            |
| UWT (usability, spec-blind)        | [uwt.md](./ui-gates/uwt.md)                                 | CLOSED. 30 findings (1 CRITICAL, 6 HIGH, 16 MEDIUM, 7 LOW)                                                   |
| DWT (design fidelity)              | [dwt.md](./ui-gates/dwt.md)                                 | COMPLETE. 10 findings (0 CRITICAL, 2 HIGH, 4 MEDIUM, 4 LOW); DWT-006 repaired and re-checked in cycle 2      |
| UI web quality gate (spec charter) | [ui-web-quality-gate.md](./ui-gates/ui-web-quality-gate.md) | Cycle 1 verdict FAIL (advisory), one open blocking row UWQ-001 (HIGH). Cycle 2 re-checked DWT-006 only: PASS |

The advisory FAIL does not stop delivery by itself. The workflow's FAIL rule asks for an owner for each open
blocking row; this record names none, by the coordinator's instruction, and lists the rows for the maintainer below.

## 3. Decision recorded: EWT-002 (sidebar state across the course boundary)

**Decision A: accept and document.** EWT-002 (LOW, scope IN-B): when a client-side navigation crosses the course and
non-course boundary, the sidebar `<nav>` element is replaced, open sections fall back to the default set and the
scroll position resets (Chromium, Firefox and WebKit alike). Navigation inside one side of the boundary keeps state.
No data is lost.

The behaviour follows from the plan's own repair. `evidence/P0/readiness.md` already records that the A-prime layout
returns generic children directly on non-course routes and keeps the course host under an inner Suspense boundary,
and that this "does not guarantee identity for every eligible-course fallback". The alternative that would keep
identity (the earlier state and effect bridge) was withdrawn for a React design-standard conflict. EWT-002 is the
observed cost of that decision. The coordinator accepted it. The spec-gap proposal SG-002 in `ewt.md` stays a proposal;
no scenario was added and no code was changed.

## 4. Open findings for the maintainer

No owner is assigned here. "Pre-existing" means the cited component is unchanged from `main` according to the ledger,
so the plan did not introduce the behaviour. Statuses are from the ledgers, not re-judged.

### Findings on the two changed surfaces

| ID      | Criticality | Scope                                 | Status in the ledger                                                                                                                                                                                    |
| ------- | ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EWT-002 | LOW         | IN-B, regression                      | Accepted (decision A above)                                                                                                                                                                             |
| EWT-003 | LOW         | IN-A                                  | Open. Focus falls to the document body when the focused Mermaid source is hidden by the render; keyboard order is kept. WCAG 2.4.3 is not violated. Spec-gap SG-001. The coordinator has not decided it |
| EWT-001 | MEDIUM      | Neighbour of IN-B                     | Open, not caused by the sidebar change. The course-path request on non-course `?path=` routes comes from `mobile-nav.tsx`, unchanged from `main` (UWQ-002 propagation: not-applicable)                  |
| DWT-006 | MEDIUM      | IN-A                                  | Repaired and re-checked in all three engines, light and dark, at 1280 wide (cycle 2)                                                                                                                    |
| DWT-007 | LOW         | IN-A cue, scrolling pre-existing      | Open. The fallback source scrolls sideways with no visible cue; code blocks behave the same                                                                                                             |
| DWT-008 | LOW         | IN-B surface, same before the diff    | Open. Generic tree shows first on `?path=` course pages, then swaps to the path rail                                                                                                                    |
| EWT-010 | MEDIUM      | IN-B route test, same before the diff | Open. Behaviour is identical before the diff, so not a regression                                                                                                                                       |

### Pre-existing findings (components unchanged from `main`)

| Record              | Rows                                                                            | Criticality                |
| ------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| UI web quality gate | UWQ-001 (rendered Mermaid keeps the light theme in dark; contrast about 1.58:1) | HIGH, the one blocking row |
|                     | UWQ-003, UWQ-004, UWQ-005, UWQ-006                                              | MEDIUM                     |
|                     | UWQ-007                                                                         | LOW                        |
| DWT                 | DWT-001 (same defect as UWQ-001), DWT-002 (focus-ring token fails in dark)      | HIGH                       |
|                     | DWT-003, DWT-004, DWT-005                                                       | MEDIUM                     |
|                     | DWT-009, DWT-010                                                                | LOW                        |
| EWT                 | EWT-004, EWT-006, EWT-007, EWT-008, EWT-009                                     | MEDIUM                     |
|                     | EWT-005                                                                         | LOW                        |
| UWT (spec-blind)    | UWT-014 (language switch leads to "Not Found" from almost every content page)   | CRITICAL                   |
|                     | UWT-001, UWT-003, UWT-005, UWT-008, UWT-015, UWT-020                            | HIGH                       |
|                     | 16 MEDIUM and 7 LOW rows (see the totals in `uwt.md`)                           | MEDIUM, LOW                |

The UWT record is spec-blind and does not scope its rows to the two changes. The cited rows concern language routing,
Indonesian pages, search, navigation labels and diagram legibility, none of which the two changes touch. The DWT
completeness check re-verified UWT-002, UWT-003, UWT-004 and UWT-023 and EWT-004 and EWT-006 as unchanged by the diff.
UWT rows beyond those were not individually re-attributed to a source change.

## 5. What this leaves open

- The maintainer decides, per blocking row, a fix owner or an explicit deferral. The Plan Archival item "Verify
  every substantive checklist item is ticked ... all applicable exploratory defect findings are fixed" forbids
  self-deferring a required defect, so the archival item needs that decision.
- EWT-003 is a changed-surface finding that is neither repaired nor decided.
- Cycle 2 of the UI gate re-checked one row. No full second cycle is claimed, and no later cycle re-judged UWQ-001.
- AC-09 (learning-content hash and peer worktrees) holds: [ac-09.md](./ac-09.md). `git diff 24a4c54d4..60a35faf1` on
  `apps/ayokoding-www/content` is empty, so the hash recorded at `24a4c54d4` still describes the content tree.
