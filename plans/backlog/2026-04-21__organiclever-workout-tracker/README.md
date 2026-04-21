# OrganicLever Design System Adoption

## Overview

Adopt the complete design system from the `organic-lever` Claude Design handoff bundle
into `libs/ts-ui-tokens` and `libs/ts-ui`, then wire the tokens into
`apps/organiclever-fe`.

**This plan covers design system only.** Workout app screens, data layer, and routing are
a separate follow-on plan.

### What "adoption" means

1. **Tokens** — Add `libs/ts-ui-tokens/src/organiclever.css`: the full OL warm OKLCH
   palette (6 hues × 3 tints, warm neutral scale, radius scale, shadow scale, semantic
   overrides, dark mode) as a per-app import that leaves the shared neutral baseline
   untouched.

2. **Updated existing components** — Button gets `teal`/`sage` brand variants and an `xl`
   size; Alert gets `success`/`warning`/`info` semantic variants; Input gets 44 px height
   (OL touch-target standard). These extend ts-ui without breaking other apps.

3. **New components** — Ten new components ported from `Components.jsx` and `Icon.jsx`
   added to `libs/ts-ui`: `Icon`, `Toggle`, `ProgressRing`, `Sheet`, `AppHeader`,
   `StatCard`, `InfoTip`, `HuePicker`, `TabBar`, `SideNav`. Each ships with a unit test
   file and a Storybook story.

4. **Typography wiring** — `organiclever-fe/layout.tsx` loads Nunito + JetBrains Mono via
   `next/font/google`; `organiclever-fe/globals.css` imports the OL token file and
   maps font variables into Tailwind's `@theme`.

5. **Documentation** — design system reference in organiclever-fe README, ts-ui component
   catalog, ts-ui-tokens per-app brand files, governance OKLCH section, SKILL design
   system guide.

## Source design

- **Bundle**: `https://api.anthropic.com/v1/design/h/u9IUx9JniNI8qMaQJF36iw`
  (Bundle contains: `colors_and_type.css`, `Components.jsx`, `Icon.jsx` — accessed
  2026-04-21) _(private Anthropic Design URL — requires authenticated session to access)_
- **Design system files**: `colors_and_type.css`, `Components.jsx`, `Icon.jsx`

> **Note on folder name**: This plan folder is named `organiclever-workout-tracker` for
> historical reasons (it was originally conceived as part of the workout tracker project).
> The active worktree is `organiclever-adopt-design-system` and the plan content covers
> design system adoption only. The workout tracker screens are a separate follow-on plan.

## Scope

**Subrepo**: `ose-public` — worktree `organiclever-adopt-design-system`.
**Modified libs**: `libs/ts-ui-tokens`, `libs/ts-ui`
**Modified app**: `apps/organiclever-fe` (layout + globals only — no new routes or screens)

All commits go directly to `main` (trunk-based development) — no feature branches, no draft
PRs.

## Navigation

| Document                       | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| [README.md](./README.md)       | This file — overview + navigation                           |
| [brd.md](./brd.md)             | Business rationale                                          |
| [prd.md](./prd.md)             | Product requirements + Gherkin acceptance criteria          |
| [tech-docs.md](./tech-docs.md) | Technical specification (tokens, component APIs, file tree) |
| [delivery.md](./delivery.md)   | Step-by-step delivery checklist                             |
