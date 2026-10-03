# Shared `ayokoding-www` app-shell tap targets fall below the WCAG 24x24 CSS px minimum

One-line summary: the site header's "Learn"/"Tools" nav links and the footer's "MIT" license link
render **shorter than 24 CSS px** in both locales at every measured breakpoint — a WCAG 2.2 SC 2.5.8
failure on chrome that appears on every page of the site — and the fix has to decide whether the
`ai-benchmark` feature's existing `TAP_TARGET_MIN_CLASS` pattern transplants into the shell's own
layout or needs its own treatment.

> Demoted from a full `backlog/` plan to a two-pager on 2026-08-05. It originated as Rule-15 finding
> `EWT-005`, deferred out of
> [`ayokoding-www-ai-benchmark-responsive-overhaul`](../../done/2026-08-01__ayokoding-www-ai-benchmark-responsive-overhaul/delivery.md)'s
> Phase 11 three-tester retest: the defect is real but sits outside that plan's
> `apps/ayokoding-www/src/features/ai-benchmark/` blast radius, so it was recorded rather than fixed.

## Problem / context

The Phase 11 `swe-web-tester` (exploratory charter) retest (2026-07-31) measured two shared app-shell tap targets
below the WCAG 2.2 SC 2.5.8 24x24 CSS px minimum, reproduced across `en` and `id` at all five tested
breakpoints (320 / 390 / 768 / 1280 / 1440 px):

- `apps/ayokoding-www/src/features/app-shell/shell/header.tsx` — the "Learn"
  (`a[href="/en/browse"]`) and "Tools" (`a[href="/en/tools"]`) primary-nav links measured
  approximately **37.1x20** and **35x20** CSS px at 1280px.
- `apps/ayokoding-www/src/features/app-shell/shell/footer.tsx` — the "MIT" license link
  (`href="https://github.com/wahidyankf/ose-public/blob/main/LICENSE"`) measured approximately
  **24.4x17** CSS px at 390px, in both locales.

Both are 17-20 px tall against a 24 px floor. Because this is shared chrome rendered on every page,
the failure is site-wide rather than confined to one route. It survived the originating plan's gates
only because that plan's AC-58 e2e assertion is correctly scoped to `[data-testid="ai-bench-page"]`
(`apps/ayokoding-www-fe-e2e/tests/e2e/steps/ai-benchmark.steps.ts`) and therefore never measures the shell.

## Why now

Nothing in CI measures rendered tap-target geometry outside the `ai-benchmark` page's own scoped
assertion, so this defect has no automatic signal and will not resurface on its own — it was found
only because Rule 15 mandates observing the whole rendered page during a delivery retest. The
in-repo remedy already exists and is proven: the responsive-overhaul plan shipped
`apps/ayokoding-www/src/features/ai-benchmark/shell/tap-target.ts` exporting
`TAP_TARGET_MIN_CLASS = "min-h-6 min-w-6 py-1"`, applied across six `ai-benchmark` components. The
window is open while that pattern and its rationale (DD-30) are still fresh, and while a decision
about promoting it out of one feature folder into shared use is still cheap.

## Prior art / precedents

- **WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA** — the 24x24 CSS px threshold this fails.
  [w3.org](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- **The repo's own `TAP_TARGET_MIN_CLASS` + DD-30 decision** — one shared class string, sized
  directly rather than leaning on the WCAG spacing exception (rejected because dense adjacent
  targets and longer Indonesian label text both erode the required gap). See the originating plan's
  [tech-docs](../../done/2026-08-01__ayokoding-www-ai-benchmark-responsive-overhaul/tech-docs.md).
- **User-Facing Delivery Hardening, Rule 15** — the near-end retest mandate that surfaced this at
  all. [user-facing-delivery-hardening.md](../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
- **Accessibility-First principle** — WCAG AA is a first-class repo principle, not a nice-to-have.
  [principles](../../../repo-governance/principles/README.md)
- **[`web-ui-alert-destructive-dark-contrast`](./web-ui-alert-destructive-dark-contrast.md)** — the
  same shape of idea: a real accessibility defect deliberately deferred out of a plan's scope because
  the fix lands in shared code with a wider blast radius.

## Proposed direction (sketch)

Bring both app-shell targets to at least 24x24 CSS px by sizing them directly, mirroring the
established `min-h-6 min-w-6 py-1` treatment rather than inventing a second convention. The open
design decision is where that class string should live once a second feature area consumes it:
leaving it in `features/ai-benchmark/shell/` while `app-shell` imports it would invert the intended
dependency direction, so promoting it to a shared location is the likely move. Pair the fix with an
assertion that measures the shell's own links — the existing e2e coverage cannot catch a regression
here because it is scoped to a single page's test id.

## Rough scope & non-goals

In scope: the header's "Learn"/"Tools" primary-nav links, the footer's "MIT" license link, the
decision on whether `TAP_TARGET_MIN_CLASS` applies unchanged to app-shell chrome or needs its own
treatment given the shell's layout constraints (the header nav sits inside a fixed `h-16` bar), and
regression coverage that fails if either target shrinks again.

Out of scope: `ayokoding-www-ai-benchmark-responsive-overhaul` explicitly excluded this work — it is
shared app-shell chrome, not `ai-benchmark`-feature code, and pulling a site-wide header/footer
change into that plan would have widened its blast radius. Also out of scope: a general automated
tap-target linting gate across all apps, and any redesign of the header or footer beyond the minimum
needed to reach the size floor.

## Risks & open questions

- Whether the fix belongs in `app-shell` alone or requires promoting `TAP_TARGET_MIN_CLASS` out of
  `features/ai-benchmark/shell/tap-target.ts` into shared code, and if so where. (open)
- Whether padding the header nav links to 24 px tall disturbs the header's fixed `h-16` bar or its
  `gap-6` nav spacing at the narrow breakpoints. (open)
- Whether other app-shell links share the defect but were never measured — the footer's column links
  all share a single `columnLink` class that the `EWT-005` repro did not size, so the measured set of
  two may undercount the real total. (open)
- Whether the WCAG spacing exception would cover the header nav as rendered. DD-30 rejected relying
  on it for the `ai-benchmark` table, partly because Indonesian labels are longer and shrink the
  gap; the same reasoning plausibly applies to the shell, but it has not been evaluated there. (open)
- Because this is chrome on every page, verification is site-wide rather than route-local; a change
  here can regress layout on pages nobody thinks to check.

## What success looks like + promotion signal

Success: every interactive target in `ayokoding-www`'s shared header and footer measures at least
24x24 CSS px in both locales across mobile, tablet, and desktop viewports; the header and footer
layouts are visually unchanged apart from the added target area; and a test fails if either link
drops below the floor again.

Promotion signal: promote to a full plan once someone enumerates the complete set of under-sized
app-shell targets — not just the two `EWT-005` named — and settles where the shared minimum-size
class should live. Those two answers turn this from an open design question into ordinary execution
work, at which point the remaining effort is a scoped edit plus site-wide visual verification.
