# Phase-4 RED/GREEN/REFACTOR Summary — Path Position Numbers

> Written at archival time per the completeness audit: the phase-4 economics live in the delivery
> checklist's implementation notes; this file collects them for the committed evidence set
> (a Proof file named by Phase 4's row).

## RED (unit + component)

| Binding                                                                                                  | File                                                                          | Result                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `<PathPositionNumber position={85} />` renders "85" (`tabular-nums`, `text-right`, no `aria-hidden`)     | `tests/unit/features/course-paths/shell/path-position-number.test.tsx` (new)  | exit 1 — module not found (the GREEN component did not exist)                                                                   |
| Syllabus rows show number then title; link accessible name unchanged                                     | `path-landing.test.tsx` row test                                              | exit 1 — `expected 'Just Enough Python' to match /^1\s*Just Enough Python$/u`                                                   |
| Rail rows show the position, `aria-current="page"`, `▸`, `bg-accent` intact                              | `path-rail.test.tsx`                                                          | exit 1 — only the new numbered-rows test                                                                                        |
| Arc preview replaces the DWT-002 workaround; items carry "1 Just Enough Python", " · 2 Data Structures…" | `syllabus-preview.test.tsx` (replaces the DWT-002 locked test at lines 38–44) | exit 1 — only the replaced test (also closed Phase 3's three known closed-list literals)                                        |
| Scenario bindings S1–S3 unit + e2e (syllabus/rail/preview across the fixture pages)                      | `fe-steps/path-position-numbers.steps.tsx` + `course-paths.steps.ts`          | unit 16/17 (only the new Then failed initially); targeted e2e failures with numbered- and missing-number assertions as expected |

## GREEN

- `path-position-number.tsx` created exactly per tech-docs §4.2; `path-landing.tsx` (li
  `flex items-baseline gap-2`, number outside the link per WCAG 2.5.3), `path-rail.tsx`
  (numbered rows), `syllabus-preview.tsx` (number span + a doc comment explaining that titles no
  longer carry numbers).
- Results on the re-run: four component tests 25/25; scenario unit 16/16 (S1–S4); targeted e2e
  9 passed in all three browsers; a fresh `--skip-nx-cache` fixture build; tsc + oxlint clean.

## REFACTOR

- `PathLanding` doc comment updated to point at `PathPositionNumber`; one breadcrumb-steps
  assertion adjusted to read each row's link text (the number now sits outside the link).
- QUICK exit 0 with 99% line coverage kept; the narrow-rail truncation check was deferred to
  Phase 8's manual verification at 375/768/1280 and holds there (see `phase-8-manual.md`).

## Gate

QUICK + full E2E exit 0 (evidence in the delivery notes and `evidence/phase-0/`-8 series);
`test:coverage:behaviour` exit 0.
