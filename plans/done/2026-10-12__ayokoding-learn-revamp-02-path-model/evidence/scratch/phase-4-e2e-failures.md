# Phase 4 E2E unexpected failures — root-cause notes

## F1 (real defect, fixed): path-phases S1 position assertion vs Outline badge (chromium full run)

- Signature: `expect(locator).toHaveText(expected) failed — Locator: ... syllabus ... locator('ol > li').nth(2) — Expected pattern: /^3\s*Capstone · Secure Service$/u — Received string: "3Capstone · Secure ServiceOutline"`.
- Root cause: test-authoring bug in the new E2E binding — the row-text regex anchored at `$`,
  but the outline row legitimately renders its `Outline` badge text after the title.
- Fix: relaxed the row match to anchor at the leading position number
  (`^${position}\s*${title}`), keeping the link-name assertion exact. One-line change in
  `apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-paths.steps.ts`.
- Verification: `-g "A path landing groups its courses under titled phases"` passes solo on
  chromium; full chromium suite re-run below must confirm.

## F2 (load flake, no product cause): course-rehome-redirects "resolves every re-homed course" (chromium full run)

- Root cause: resource contention under the parallel full-suite run — the scenario passes solo
  on chromium (`1 passed (14.0s)`), and neither this plan's diff nor the new steps touch the
  redirect surfaces.
- Verification: full chromium suite re-run below must confirm.

## F3 (load flake, no product cause): ia-navigation-revamp "Internal content links emit bare URLs" (webkit full run)

- Root cause: same as F2 — passes solo on webkit (`1 passed (8.0s)`); the diff touches no
  navigation-link emission surface.
- Verification: full webkit suite re-run below must confirm.
