# `web-ui` Alert `destructive` variant fails WCAG AA in dark mode

One-line summary: the shared `Alert variant="destructive"` renders at **1.99:1** in dark mode —
below the 4.5:1 AA floor, on an error component — and the obvious token-level fix is unsafe, so the
correction has to be scoped to `Alert`'s own variant class across every consuming app.

> Split out of PR #80 (`fix/ayokoding-ui-high-findings-b06d32`) on 2026-07-22. That PR fixed
> `ayokoding-www`'s `Callout` by routing its `warning` type away from the `destructive` variant; the
> underlying `destructive` defect was deliberately left out of scope because `alert.tsx` is shared.

## Problem / context

`libs/web-ui/src/components/alert/alert.tsx` renders its `destructive` variant as
`bg-card text-destructive`. In dark mode those tokens resolve — for `ayokoding-www` — to
`--color-destructive: hsl(0 62.8% 30.6%)` on `--color-card: hsl(222.2 84% 4.9%)`: a dark red on a
near-black surface, computing to **1.99:1**. `AlertDescription` renders at 90% opacity and is worse
at **1.81:1**. WCAG AA requires 4.5:1 for body text.

This is the worst possible component to have it on: error text is precisely what a user must be able
to read. Light mode is fine (6.20:1), which is why it has gone unnoticed — and why a light-only
review misses it entirely.

Every other semantic variant in the same file already uses a `wash`/`ink` token pair that inverts
correctly for dark (`success`, `warning`, `info`). `destructive` is the lone hold-out still keyed to
a raw `--color-destructive`.

## Why now

Two independent audits looked straight past it. The originating `swe-reviewer` audit flagged the
Callout wiring but never evaluated dark mode, and its stated contrast figures did not reproduce —
they appear to omit the sRGB gamma transfer, so its numbers should be treated as directionally
useful and numerically unreliable. The defect was only found by recomputing from resolved token
values. Nothing in CI checks rendered contrast, so there is no signal that would surface this on its
own.

## Prior art / precedents

- **WCAG 2.2 SC 1.4.3 Contrast (Minimum)** — the 4.5:1 body-text threshold this fails.
  [w3.org](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- **OKLCH / Oklab colour space** — the space the repo's hue tokens are authored in; needed to compute
  contrast correctly from the token source. [bottosson.github.io](https://bottosson.github.io/posts/oklab/)
- **The repo's own `wash`/`ink` token pattern** — `libs/web-ui-token/src/*.css` already ships
  per-hue `-wash` and `-ink` values with `.dark` inversions; this is the established in-repo solution,
  not a new invention.
- **Accessibility-First principle** — WCAG AA and colour-blind-friendly are first-class repo
  principles. [principles](../../../repo-governance/principles/README.md)

## Proposed direction (sketch)

- Repoint **only** `Alert`'s `destructive` variant class to the `--hue-terracotta-wash` /
  `--hue-terracotta-ink` pair, matching how `success`/`warning`/`info` are already written.
- Leave `--color-destructive` itself untouched.
- Update `alert.test.tsx` (asserts the current classname) and add a regression test pinning the
  dark-mode contrast so the failure cannot silently return.

## Rough scope & non-goals

In scope: `libs/web-ui/src/components/alert/alert.tsx`, its unit test, companion Gherkin if any
user-facing behaviour changes, and verification across all four app token files.

Out of scope: repointing `--color-destructive`. **This was investigated and rejected with numbers** —
`Button` and `Badge` both hardcode `bg-destructive text-white`, and repointing the token drops that
pairing from a healthy 10.02:1 to a failing **1.48:1**. The naive fix trades one AA failure for a
worse one. Also out of scope: a general contrast-linting gate (worth its own idea).

## Risks & open questions

- `alert.tsx` is shared: `nx show projects --affected` reports **9 affected projects** beyond
  `web-ui` (organiclever-app-web/-www, wahidyankf-www, ose-app-web and their e2e pairs), plus
  `ayokoding-www` consuming it via `callout.tsx`. This is a cross-app change needing all of them
  green, not a one-app edit.
- The required `--hue-terracotta-wash` / `--hue-terracotta-ink` tokens were confirmed present in all
  four app token files (`ayokoding.css`, `organiclever.css`, `ose.css`, `wahidyankf.css`), and all
  eight light/dark combinations were computed clear of AA with margin (**6.54:1–9.02:1**) — so the
  fix is verified safe on paper, but has not been rendered or visually confirmed. (open)
- Whether any consumer relies on the current `bg-card` surface for layout reasons is unverified. (open)

## What success looks like + promotion signal

Success: `Alert variant="destructive"` clears 4.5:1 in both themes in all four apps, `Button`/`Badge`
keep their 10.02:1 pairing, and a regression test fails if either regresses. Ready to promote once
someone confirms the visual result in dark mode for at least one app — the arithmetic is done; what
remains is cross-app verification, which is execution work rather than design work.
