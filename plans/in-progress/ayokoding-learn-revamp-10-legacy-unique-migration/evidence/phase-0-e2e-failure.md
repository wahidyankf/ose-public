# Phase 0 E2E Baseline Failure + Fix (2026-10-20)

## The failure

Full `ayokoding-www-fe-e2e:test:e2e` (3 browsers, ~10.5 min): 1231 passed, 1 error.

- Spec: `course-landing-progress` S34 "A finished course offers a review", Firefox only
  (chromium/webkit green).
- Error: `page.waitForURL: Test timeout of 150000ms exceeded` in
  `tests/e2e/steps/support/complete-course.ts:78` (`markCompleteAndContinue`): the
  "Mark complete & continue" click resolved, but no navigation committed within 150 s.
- Forensics: no trace/screenshot survived (`trace: on-first-retry`, no retry ran);
  `test-results/junit.xml` + `.last-run.json` confirm exactly 1 failing test id.

## Root cause

A single swallowed click under full-suite load: three browser projects in parallel
starve the Firefox process badly enough that the link click resolves yet its navigation
never commits. Not a product bug and not deterministic:

- Same spec, Firefox only, right after: 2/2 passed (6.8 s for S34).
- Full Firefox project rerun: 410 passed, 2 skipped, 0 failed (4.3 min).
- Chromium/webkit runs of S34 in the failing run: green.

The helper's single click + single 150 s wait had no recovery when the browser stalls
mid-step: it burned the whole step budget on one stalled attempt.

## The fix

`tests/e2e/steps/support/complete-course.ts` (`markCompleteAndContinue`): wrapped the
click + `waitForURL` pair in `expect(...).toPass({ timeout: 150000 })` with a 15 s
per-attempt wait budget, so a stalled attempt re-tries the pair instead of hanging the
step. Same click-and-verify pattern the `course-landing-progress` steps already use for
the completion toggle. The bar position check below still pins the exact page, so a
double advance would fail loudly, not skip silently. No assertion was loosened; total
step budget unchanged (150 s).

## Verification

- Affected spec, all 3 browsers: 6/6 passed (15.9 s).
- `ayokoding-www-fe-e2e:typecheck` + `:lint`: both exit 0.
- Full `test:e2e` rerun (same command): see phase-0-baseline.md.
