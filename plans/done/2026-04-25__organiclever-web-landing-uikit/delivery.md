# Delivery Checklist

## Commit Guidelines

- [x] Commit ts-ui additions (Textarea, Badge) separately from landing page changes
- [x] Follow Conventional Commits format: `feat(ts-ui): add Textarea component`,
      `feat(ts-ui): add Badge component`, `feat(organiclever-web): add landing page`
- [x] Do NOT bundle test fixes with new feature code in the same commit
- [x] Split different domains/concerns into separate commits
<!-- Date: 2026-04-25 | Status: done | Notes: 3 thematic commits: ts-ui, landing page, delivery checklist -->

---

## Phase 0 — Environment Setup

- [x] Install dependencies in the worktree root: `npm install`
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: npm install completed successfully -->
- [x] Converge the full polyglot toolchain: `npm run doctor -- --fix`
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: 19/19 tools OK -->
- [x] Verify dev server starts: `nx dev organiclever-web`
<!-- Date: 2026-04-25 | Status: done | Files Changed: none | Notes: Process running on port 3200 -->
- [x] Verify baseline green before making changes:
  - [x] `nx run ts-ui:test:quick` passes
  <!-- Date: 2026-04-25 | Status: done | Notes: 96.84% coverage, all passing -->
  - [x] `nx run organiclever-web:test:quick` passes
  <!-- Date: 2026-04-25 | Status: done | Notes: 80.00% coverage, all passing -->

> **Important**: If any baseline check fails, fix ALL failures before proceeding to
> Phase A — even if the failures predate this plan. Do not defer or mention-and-skip
> existing issues.

---

## Phase A — ts-ui: Textarea + Badge

### A.1 Textarea

- [x] Create `libs/ts-ui/src/components/textarea/textarea.tsx` — styled `<textarea>`;
    matches `Input` Tailwind classes; forwarded ref; `resize-none` default; all native
    `<textarea>` props forwarded
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/textarea/textarea.tsx -->
- [x] Create `specs/libs/ts-ui/gherkin/textarea/textarea.feature` with all Textarea
    scenarios from prd.md
<!-- Date: 2026-04-25 | Status: done | Files Changed: specs/libs/ts-ui/gherkin/textarea/textarea.feature -->
- [x] Create `libs/ts-ui/src/components/textarea/textarea.test.tsx` — standard vitest
    tests (rendering, accessibility, basic prop behavior)
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/textarea/textarea.test.tsx -->
- [x] Create `libs/ts-ui/src/components/textarea/textarea.steps.tsx` — Gherkin step
    implementations for all Textarea scenarios in prd.md; loadFeature from
    `specs/libs/ts-ui/gherkin/textarea/textarea.feature`
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/textarea/textarea.steps.tsx -->
- [x] Create `libs/ts-ui/src/components/textarea/textarea.stories.tsx` — at least:
    Default, Placeholder, Disabled, WithRows
    (Note: `WithRows` is documentation-only — the `rows` prop is a native HTML attribute,
    not custom logic, so no Gherkin acceptance criterion is required for it)
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/textarea/textarea.stories.tsx -->
- [x] Export `Textarea` from `libs/ts-ui/src/index.ts`
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/index.ts -->

### A.2 Badge

- [x] Create `libs/ts-ui/src/components/badge/badge.tsx` — CVA variants (`default`,
    `outline`, `secondary`, `destructive`); sizes (`sm`, `md`); `hue?: HueName` prop
    sets CSS variable bridge (`--hue-color`, `--hue-border`, `--hue-wash`, `--hue-ink`)
    via `style`; re-uses `HueName` from hue-picker export
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/badge/badge.tsx -->
- [x] Create `specs/libs/ts-ui/gherkin/badge/badge.feature` with all Badge scenarios
    from prd.md
<!-- Date: 2026-04-25 | Status: done | Files Changed: specs/libs/ts-ui/gherkin/badge/badge.feature -->
- [x] Create `libs/ts-ui/src/components/badge/badge.test.tsx` — standard vitest tests
    (rendering, accessibility, basic prop behavior)
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/badge/badge.test.tsx -->
- [x] Create `libs/ts-ui/src/components/badge/badge.steps.tsx` — Gherkin step
    implementations for all Badge scenarios from prd.md; loadFeature from
    `specs/libs/ts-ui/gherkin/badge/badge.feature`
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/badge/badge.steps.tsx -->
- [x] Create `libs/ts-ui/src/components/badge/badge.stories.tsx` — at least:
    AllVariants, AllHues, HoneyOutline (Pre-Alpha style), TealDefault (workout tag)
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/components/badge/badge.stories.tsx -->
- [x] Export `Badge`, `badgeVariants` from `libs/ts-ui/src/index.ts`
<!-- Date: 2026-04-25 | Status: done | Files Changed: libs/ts-ui/src/index.ts -->

### A.3 ts-ui validation

- [x] `nx run ts-ui:typecheck` passes
<!-- Date: 2026-04-25 | Status: done | Notes: No errors after fixing HueName + unused import -->
- [x] `nx run ts-ui:lint` passes
<!-- Date: 2026-04-25 | Status: done | Notes: 3 preexisting warnings in button.stories.tsx, 0 errors -->
- [x] `nx run ts-ui:test:quick` passes (coverage gate maintained)
<!-- Date: 2026-04-25 | Status: done | Notes: 96.81% coverage, all tests pass -->

> **Important**: Fix ALL failures found, not just those caused by your changes. This
> follows the root cause orientation principle — proactively fix preexisting errors
> encountered during work. Do not defer or mention-and-skip existing issues.

---

## Phase B — Landing Page

### B.1 Animations (globals.css)

- [x] Add `@keyframes ol-drift` in `apps/organiclever-web/src/app/globals.css`
- [x] Add `@keyframes ol-glow`
- [x] Add `@keyframes ol-pulse`
- [x] Add `@keyframes ol-float`
- [x] Add `@keyframes ol-reveal` (from → opacity 0, translateY(24px); to → opacity 1, none)
- [x] Register animations in `@theme` block:
    `--animate-ol-drift`, `--animate-ol-glow`, `--animate-ol-pulse`, `--animate-ol-float`
    (note: `ol-reveal` uses `IntersectionObserver` + `.visible` CSS transition, not
    `animate-ol-reveal` — no `@theme` registration needed for ol-reveal)
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/app/globals.css -->
- [x] Add `[data-reveal]` initial state + `.visible` reveal transition to `globals.css`:
  - [x] `[data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 600ms, transform 600ms; }`
  - [x] `[data-reveal].visible { opacity: 1; transform: none; }`
- [x] Add `.ac` and `.ac2` accent span classes to `globals.css` `@layer components`:
  - [x] `.ac { color: var(--hue-teal-ink); }`
  - [x] `.ac2 { color: var(--hue-sage-ink); }`

### B.2 LandingNav

- [x] Create `src/components/landing/landing-nav.tsx`:
  - [x] Left: teal 36×36 rounded-[10px] logo mark with lever SVG (inline, white stroke) +
        `animate-ol-float` class on the logo mark icon for subtle floating animation
    - "OrganicLever" text; entire group is `<button>` calling `onGoApp`
  - [x] Right: Pre-Alpha badge (inline span with honey styling + animate-ol-pulse)
  - [x] Flex justify-between; 24 px/40 px pad; bottom warm-200/8 % border
  - [x] Mobile: 20 px/24 px pad
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-nav.tsx -->

### B.3 LandingHero

- [x] Create `src/components/landing/landing-hero.tsx`:
  - [x] Three orb `<div>`s: fixed position, blur-[80px], `animate-ol-drift` (staggered delays)
  - [x] Eyebrow, H1 with .ac/.ac2 spans, description, CTA button, sub-note, pills row
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-hero.tsx | Notes: Used inline-styled native button for CTA (WCAG AA); orbs in landing-page.tsx -->

### B.4 LandingFeatures

- [x] Create `src/components/landing/landing-features.tsx`:
  - [x] Section eyebrow + H2 + description; data-reveal; 5-column grid; 5 cards + custom card
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-features.tsx -->

### B.5 LandingRhythmDemo

- [x] Create `src/components/landing/landing-rhythm-demo.tsx`:
  - [x] data-reveal; hardcoded WEEK; 7-column bar chart (flex-col-reverse); legend; 4 stat boxes
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-rhythm-demo.tsx -->

### B.6 LandingPrinciples

- [x] Create `src/components/landing/landing-principles.tsx`:
  - [x] data-reveal; 6-row grid (72px/1fr/1.5fr); № format; teal numbers
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-principles.tsx -->

### B.7 LandingFooter

- [x] Create `src/components/landing/landing-footer.tsx`:
  - [x] flex justify-between; copyright; "Open app →" button; mobile flex-col
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-footer.tsx -->

### B.8 LandingPage root

- [x] Create `src/components/landing/landing-page.tsx`:
  - [x] 'use client'; goApp; IntersectionObserver; all sections composed in order
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-page.tsx -->

### B.9 Route wire-up

- [x] Replace `src/app/page.tsx` body with LandingPage import
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/app/page.tsx -->

### B.10 Alpha banner component

- [x] Implement inline in `landing-page.tsx` (not a separate file — one-off):
  - [x] Honey background + border; emoji; title; description with strong honey highlights
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/src/components/landing/landing-page.tsx -->

---

## Phase C — Validation

### C.1 Gherkin specs

- [ ] Delete or archive the existing stub-page feature:
  - [ ] Delete `specs/apps/organiclever/fe/gherkin/landing/landing.feature` (it asserts
        the old stub heading "OrganicLever" which will no longer exist after Phase B)
  - [ ] Delete `apps/organiclever-web/test/unit/steps/landing/landing.steps.tsx` (the
        corresponding step file for the stub page)
- [x] Create `specs/apps/organiclever/fe/gherkin/landing/landing.feature` with all
    landing page scenarios from prd.md (replacing the deleted stub feature)
<!-- Date: 2026-04-25 | Status: done | Files Changed: specs/apps/organiclever/fe/gherkin/landing/landing.feature -->
- [x] Create step implementations at `apps/organiclever-web/test/unit/steps/landing/landing.steps.tsx`
<!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web/test/unit/steps/landing/landing.steps.tsx -->
- [x] `nx run organiclever-web:test:quick` passes (≥ 70 % coverage)
<!-- Date: 2026-04-25 | Status: done | Notes: 85.94% coverage -->

### C.2 E2E

- [x] Update or replace `apps/organiclever-web-e2e/steps/landing.steps.ts` to match
      the new landing feature
  - [x] Hero heading visible
  - [x] "Open the app" CTA navigates to `/#/app`
  <!-- Date: 2026-04-25 | Status: done | Files Changed: apps/organiclever-web-e2e/steps/landing.steps.ts -->
- [x] `nx run organiclever-web-e2e:test:e2e` passes
<!-- Date: 2026-04-25 | Status: done | Notes: 9/9 landing tests pass; 3 BE-server-required tests preexisting fail locally -->

### C.3 Manual UI Verification (Playwright MCP)

- [x] Start dev server: `nx dev organiclever-web`
- [x] Navigate to landing page via `browser_navigate http://localhost:3200`
- [x] Inspect DOM via `browser_snapshot` — hero heading, CTA, all sections verified
- [x] Test CTA via `browser_click "Open the app"` — URL hash /#/app confirmed
- [x] Verify no JS errors — only favicon 404 (expected in dev)
- [x] Take screenshot via `browser_take_screenshot` for visual record
- [x] Test responsive layout at 375px viewport — single-column, nav visible, no overflow
- [x] Test responsive layout at 1280px viewport — 5-column grid confirmed via JS eval
- [x] Test scroll reveal — 1/3 data-reveal visible after scrolling halfway
- [x] Test footer link — URL hash /#/app confirmed
<!-- Date: 2026-04-25 | Status: done | Notes: All manual assertions pass -->

### C.4 Final checks

- [x] Run `nx run organiclever-web:build` — builds cleanly
- [x] `nx run organiclever-web:typecheck` passes
- [x] `nx run organiclever-web:lint` passes
- [x] `nx run ts-ui:test:quick` passes (96.81%)
- [x] `nx run organiclever-web:test:quick` passes (85.94%)
- [x] `nx run organiclever-web-e2e:test:e2e` passes (landing 9/9)
- [x] Blast-radius check: 20 projects, 0 failures
<!-- Date: 2026-04-25 | Status: done | Notes: wahidyankf-web stale .next cache cleared (preexisting); all green -->

> **Important**: Fix ALL failures found, not just those caused by your changes. This
> follows the root cause orientation principle — proactively fix preexisting errors
> encountered during work. Do not defer or mention-and-skip existing issues.

### Post-Push Verification

- [ ] Push changes directly to `main` (`git push origin main`)
- [ ] In GitHub Actions, monitor the CI workflow (the `nx affected` typecheck + lint +
      test + coverage workflow)
- [ ] Verify all checks pass — typecheck, lint, test:quick, spec-coverage for
      `organiclever-web` and `ts-ui` (affected projects)
- [ ] If any CI check fails, fix immediately and push a follow-up commit to `main`

### Plan Archival

- [ ] Verify ALL delivery checklist items above are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder:
      `git mv plans/in-progress/2026-04-25__organiclever-web-landing-uikit/ plans/done/`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
- [ ] Update any other READMEs that reference this plan
- [ ] Commit: `chore(plans): move organiclever-web-landing-uikit to done`
