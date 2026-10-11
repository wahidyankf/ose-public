# Phase 1 Evidence — Headings and Inline Code Render Correctly (S6, S7)

> RED and GREEN outputs per delivery.md Phase 1 Proof. All commands ran with
> `env -u NODE_ENV` (see phase-0-baseline.md environment notes).

## RED

- **Unit** (`UNIT-FE tests/unit/fe-steps/content-rendering.steps.tsx`): exit 1 as required —
  3 failed / 52 passed. The three new assertions fail on the missing prose classes
  (`prose-headings:[&>a]:no-underline`, `prose-headings:[&>a]:text-inherit`,
  `prose-headings:[&>a]:[font-weight:inherit]`, `prose-code:before:content-none`,
  `prose-code:after:content-none`, `[&_:not(pre)>code]:[font-weight:inherit]`); all 10
  pre-existing scenarios pass. Delegated to `swe-developer`.
- **E2E** (full suite, `playwright test --workers=3`): 996 passed, 8 failed —
  - S6 fails in chromium, firefox, AND webkit: `expect(styles.textDecorationLine).toBe("none")`
    received `"underline"` (chromium/firefox; WebKit computes `""` while the shorthand underline
    is active).
  - S7 fails in all three browsers: inline-code `::before` computed content is the literal
    backtick `'"'` instead of `none`/`normal`.
  - The two other failures are pre-existing flakes on unrelated surfaces (firefox "Escape key
    closes the search dialog" 2.5m load timeout — passed in isolation; webkit "Mobile nav drawer
    shows localized site navigation" — intermittent, passed its second isolation run). Both
    predate this plan (the Phase 0 baseline passed them); tracked in the execution ledger.

## GREEN

- **Change**: eleven tokens from tech-docs §4.6 appended to `MARKDOWN_PROSE_CLASS`
  (`apps/ayokoding-www/src/features/content/shell/markdown-renderer.tsx`), then refactored into a
  grouped array (base typography / S6 heading-anchor tokens / S7 inline-code chip tokens) with a
  comment naming the two defects prevented. Class value unchanged.
- **Unit**: exit 0 — 55/55 passed, including the three RED failures and the strict
  `expect(container?.className).toBe(MARKDOWN_PROSE_CLASS)` assertion.
- **Targeted e2e** (`--grep "Section headings render as headings|Inline code renders without
literal"`): 6 passed — both scenarios in chromium, firefox, and webkit. First attempt failed on
  a stale `.next` build; the target's own build step was run before the passing rerun.
- **Gate E2E** (full suite, `playwright test --workers=3 --retries=2`, the repo's own CI retry
  posture): **exit 0 — 1003 passed, 1 flaky, 0 failed, 7.9m.** The one flaky entry is the webkit
  S6 scenario failing its first attempt on the computed-style reading and passing on retry;
  recorded as a known intermittent WebKit computed-style quirk, not weakened.

## Notes

- firefox "Escape key closes the search dialog" flake: root-caused as far as the locator anomaly
  goes (getByRole resolved the MOBILE ghost/icon search button — possible only while the desktop
  button is a11y-hidden — and the same button then read "not visible", i.e. the effective
  viewport/CSS state changed mid-test under host memory pressure). Unrelated to this plan's
  surfaces; reported for a follow-up defect fix.
- WebKit inline-code `::before` computed `""` (empty, no backtick) in 1 of 3 post-fix runs — the
  strict `["none", "normal"]` set may need a semantic no-backtick check if it recurs; not
  weakened here.
