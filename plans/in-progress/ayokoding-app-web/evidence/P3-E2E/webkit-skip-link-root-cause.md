# WebKit skip-link failure: root cause and fix

Scenario: `Keyboard readers can skip the repeated navigation` (`behaviours/shell/bilingual-shell.feature`), run by the fe
home on the `bdd-webkit` project on an arm64 macOS host.

## Confirmed behaviour

[webkit-focus-probe.cjs](./webkit-focus-probe.cjs) launches WebKit (`playwright-core`) against the built binary and
records the focused element after each key. Output: [webkit-focus-probe.txt](./webkit-focus-probe.txt).

- `Tab`: focus stays on `BODY`.
- `Alt+Tab` (Option+Tab on macOS): focus moves to `A.skip-link` with `href="#main"`.

On macOS, WebKit moves focus to links on plain Tab only when the system setting for keyboard navigation (Press Tab to
highlight each item) is on. Option+Tab focuses them regardless. Chromium and Firefox focus links on Tab, and the
scenario passed on both before the fix.

## Fix

`apps/ayokoding-web-fe-e2e/tests/e2e/steps/shell.steps.ts`: a helper `focusNextLinkKey(browserName)` returns `Alt+Tab`
for WebKit on darwin and `Tab` elsewhere. The step takes `browserName` from the Playwright fixtures. The assertion is
unchanged (`expect(active).toContain("skip-link")`).

## Verification

- Isolated run on the `bdd-webkit` project: [webkit-skip-link-fixed.raw.txt](./webkit-skip-link-fixed.raw.txt), 1 passed.
- Full fe `test:e2e` on the final tree: 276 passed across chromium, firefox, and webkit
  ([fe-e2e-4.raw.txt](./fe-e2e-4.raw.txt)).

The scenario is the regression test: before the fix it fails on WebKit on this host, and after the fix it passes.
