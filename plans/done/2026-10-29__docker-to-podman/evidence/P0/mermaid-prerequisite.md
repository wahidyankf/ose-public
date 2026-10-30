# Mermaid fallback keyboard prerequisite

## Proven defect and limits

The existing component exposes diagram source while asynchronous rendering is pending or after
render failure. That source remains in the layout after SVG success and becomes invisible, so
progress controls retain their position. The exposed source could not receive sequential
keyboard focus, preventing keyboard access to overflowing content in browsers that require a
focusable scroll region.

Fresh serial Firefox/WebKit observations did not reproduce the original full frontend failures.
Actual learning-page observations identified two Mermaid PREs with horizontal overflow and no
tabindex or focusable descendants, but both were already hidden after SVG success. Their
measured widths were 766 pixels versus scroll widths of 4,787 and 4,350 pixels. Original failed
axe node HTML remains unavailable. This establishes the real component geometry, not the exact
cause of the historical WebKit axe failure.

## Test-first repair

The new component regression uses the real renderer and controlled third-party render promises.
It exercises actual Tab navigation between surrounding buttons and the source, rather than
mirroring an attribute assignment. Existing accessibility and rendered-SVG Gherkin contracts
remain the authority; no scenario is removed or weakened.

- Native RED `18737`: three tests discovered; pending and rejected states failed because Tab
  skipped the source and focused the following button. The resolved SVG state passed.
- Minimal renderer change: `tabIndex={svg === "" ? 0 : -1}` on the existing PRE. All original
  classes, chart source, reserved node, rendering effect, warning and SVG remain intact.
- Same-file GREEN `16053`: all three tests passed. The resolved case additionally preserves
  the identical source node and SVG while Tab skips the hidden reserved PRE.
- App typecheck `66615` passed. The first app lint `94891` exposed a real
  `no-noninteractive-tabindex` warning, so those initial statuses alone did not close the quality
  issue. Review accepted the exact candidate and the coordinator approved one documented,
  next-line lint exception under the existing policy.

Exact source footprint:

- `apps/ayokoding-www/src/features/content/shell/mermaid.tsx`
- `apps/ayokoding-www/tests/unit/features/content/shell/mermaid.test.tsx`

## Documented lint exception

The repository's existing [Lint Strictness policy](../../../../../repo-governance/development/quality/cross-language-lint-strictness/policy.md)
permits a documented point waiver when applying a rule reduces clarity or reproducibility for
no real safety gain. Its caller-decision route does not reserve approval to a human. Independent
review accepted the exact two-comment candidate and the coordinator approved this specific
exception; no general rule or lint configuration changed.

The applied comments document the keyboard-scroll reason immediately before the existing
conditional `tabIndex` and disable only `jsx-a11y/no-noninteractive-tabindex` for that line. The
hidden source still stays outside sequential focus. A fake interactive role or a derived-value
lint escape would misrepresent the behavior and was not selected. This is a one-point exception,
not a general lint waiver or configuration change.

[WCAG keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) and
[axe scroll-region guidance](https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable)
support keyboard-reachable scroll content. The generic lint rule does not infer runtime overflow.
This exception retains both the real keyboard regressions and the original zero-violation axe
requirement.

Native isolated validation `97029` used the exact effective app configuration. Each control
checked one actual file with 131 rules: the current renderer produced one warning and exit 1;
the candidate produced zero warnings and exit 0; a separate unwaived PRE added outside that point
again produced one warning and exit 1. The exact owned fixture was removed. Earlier zero-file
attempts remain failed evidence, never lint proof. Independent validation `61966` confirmed the
candidate hash, exact two-comment delta and native boundary proof.

The reviewed two-comment waiver candidate
`95542f36211f4ee8e601b05a05165830a0a284acc76373ef15347241101258e2` is applied to the renderer.
Its unit test remains unchanged at SHA-256
`69daddf542f7b4e2754bf0a682832d338ca7c40cf6703342d4161fbd726f3808`. The application lint target
exited 0 and reported longstanding warnings in untouched files. A separate exact-file Oxlint run
with `--deny-warnings` emitted no diagnostics and exited 0. Prettier checked both affected files,
and `git diff --check` passed. The detailed native receipt is retained in the ignored
`local-tmp/swe-developer/mermaid-point-waiver-apply/native-scope-checks.md`.

The original WebKit axe node identity remains unknown; serial observations did not reproduce the
historical failure. The regression proves the component's pending/rejected fallback keyboard
contract, not the cause of that old axe result. Full fresh Ayo source closures, real keyboard
behavior, four-screen axe, progress-layout regressions and the post-repair baseline remain pending
before P0/delivery closes.
The reachable fallback keyboard change also carries the applicable running UI gates and triad;
the original container-only UI exemption does not discharge them.
