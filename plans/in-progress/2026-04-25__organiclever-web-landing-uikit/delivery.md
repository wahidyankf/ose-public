# Delivery Checklist

## Commit Guidelines

- [ ] Commit ts-ui additions (Textarea, Badge) separately from landing page changes
- [ ] Follow Conventional Commits format: `feat(ts-ui): add Textarea component`,
      `feat(ts-ui): add Badge component`, `feat(organiclever-web): add landing page`
- [ ] Do NOT bundle test fixes with new feature code in the same commit
- [ ] Split different domains/concerns into separate commits

---

## Phase 0 — Environment Setup

- [ ] Install dependencies in the worktree root: `npm install`
- [ ] Converge the full polyglot toolchain: `npm run doctor -- --fix`
- [ ] Verify dev server starts: `nx dev organiclever-web`
- [ ] Verify baseline green before making changes:
  - [ ] `nx run ts-ui:test:quick` passes
  - [ ] `nx run organiclever-web:test:quick` passes

> **Important**: If any baseline check fails, fix ALL failures before proceeding to
> Phase A — even if the failures predate this plan. Do not defer or mention-and-skip
> existing issues.

---

## Phase A — ts-ui: Textarea + Badge

### A.1 Textarea

- [ ] Create `libs/ts-ui/src/components/textarea/textarea.tsx` — styled `<textarea>`;
      matches `Input` Tailwind classes; forwarded ref; `resize-none` default; all native
      `<textarea>` props forwarded
- [ ] Create `specs/libs/ts-ui/gherkin/textarea/textarea.feature` with all Textarea
      scenarios from prd.md
- [ ] Create `libs/ts-ui/src/components/textarea/textarea.test.tsx` — standard vitest
      tests (rendering, accessibility, basic prop behavior)
- [ ] Create `libs/ts-ui/src/components/textarea/textarea.steps.tsx` — Gherkin step
      implementations for all Textarea scenarios in prd.md; loadFeature from
      `specs/libs/ts-ui/gherkin/textarea/textarea.feature`
- [ ] Create `libs/ts-ui/src/components/textarea/textarea.stories.tsx` — at least:
      Default, Placeholder, Disabled, WithRows
      (Note: `WithRows` is documentation-only — the `rows` prop is a native HTML attribute,
      not custom logic, so no Gherkin acceptance criterion is required for it)
- [ ] Export `Textarea` from `libs/ts-ui/src/index.ts`

### A.2 Badge

- [ ] Create `libs/ts-ui/src/components/badge/badge.tsx` — CVA variants (`default`,
      `outline`, `secondary`, `destructive`); sizes (`sm`, `md`); `hue?: HueName` prop
      sets CSS variable bridge (`--hue-color`, `--hue-border`, `--hue-wash`, `--hue-ink`)
      via `style`; re-uses `HueName` from hue-picker export
- [ ] Create `specs/libs/ts-ui/gherkin/badge/badge.feature` with all Badge scenarios
      from prd.md
- [ ] Create `libs/ts-ui/src/components/badge/badge.test.tsx` — standard vitest tests
      (rendering, accessibility, basic prop behavior)
- [ ] Create `libs/ts-ui/src/components/badge/badge.steps.tsx` — Gherkin step
      implementations for all Badge scenarios from prd.md; loadFeature from
      `specs/libs/ts-ui/gherkin/badge/badge.feature`
- [ ] Create `libs/ts-ui/src/components/badge/badge.stories.tsx` — at least:
      AllVariants, AllHues, HoneyOutline (Pre-Alpha style), TealDefault (workout tag)
- [ ] Export `Badge`, `badgeVariants` from `libs/ts-ui/src/index.ts`

### A.3 ts-ui validation

- [ ] `nx run ts-ui:typecheck` passes
- [ ] `nx run ts-ui:lint` passes
- [ ] `nx run ts-ui:test:quick` passes (coverage gate maintained)

> **Important**: Fix ALL failures found, not just those caused by your changes. This
> follows the root cause orientation principle — proactively fix preexisting errors
> encountered during work. Do not defer or mention-and-skip existing issues.

---

## Phase B — Landing Page

### B.1 Animations (globals.css)

- [ ] Add `@keyframes ol-drift` in `apps/organiclever-web/src/app/globals.css`
- [ ] Add `@keyframes ol-glow`
- [ ] Add `@keyframes ol-pulse`
- [ ] Add `@keyframes ol-float`
- [ ] Add `@keyframes ol-reveal` (from → opacity 0, translateY(24px); to → opacity 1, none)
- [ ] Register animations in `@theme` block:
      `--animate-ol-drift`, `--animate-ol-glow`, `--animate-ol-pulse`, `--animate-ol-float`
      (note: `ol-reveal` uses `IntersectionObserver` + `.visible` CSS transition, not
      `animate-ol-reveal` — no `@theme` registration needed for ol-reveal)
- [ ] Add `[data-reveal]` initial state + `.visible` reveal transition to `globals.css`:
  - [ ] `[data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 600ms, transform 600ms; }`
  - [ ] `[data-reveal].visible { opacity: 1; transform: none; }`
- [ ] Add `.ac` and `.ac2` accent span classes to `globals.css` `@layer components`:
  - [ ] `.ac { color: var(--hue-teal-ink); }`
  - [ ] `.ac2 { color: var(--hue-sage-ink); }`

### B.2 LandingNav

- [ ] Create `src/components/landing/landing-nav.tsx`:
  - [ ] Left: teal 36×36 rounded-[10px] logo mark with lever SVG (inline, white stroke) +
        `animate-ol-float` class on the logo mark icon for subtle floating animation
    - "OrganicLever" text; entire group is `<button>` calling `onGoApp`
  - [ ] Right: `<Badge variant="outline" hue="honey">⚗️ Pre-Alpha</Badge>` with
        `animate-ol-pulse` class
  - [ ] Flex justify-between; 24 px/40 px pad; bottom warm-200/8 % border
  - [ ] Mobile: 20 px/24 px pad

### B.3 LandingHero

- [ ] Create `src/components/landing/landing-hero.tsx`:
  - [ ] Three orb `<div>`s: fixed position, blur-[80px], `animate-ol-drift` (staggered
        delays −6 s, −12 s); colors teal/8 %, sage/7 %, honey/6 %
  - [ ] SVG noise texture overlay (fixed, pointer-events-none, opacity-50)
  - [ ] `data-reveal` wrapper
  - [ ] Eyebrow: teal uppercase + 28 px leading rule line
  - [ ] H1: `clamp(3rem, 6vw, 5.5rem)` extrabold; teal `.ac` span + sage `.ac2` span
  - [ ] Description: Nunito 18 px/1.65 warm-500 max-w-[620px]
  - [ ] CTA: `<Button size="xl" variant="teal" onClick={onGoApp}>` with play SVG icon +
        "Open the app"; `animate-ol-glow` class
  - [ ] Sub-note: "⚡ Free · works offline · no sign-up"
  - [ ] Pills row: iOS, Android, GitHub, Fork — each `<Badge variant="outline">` with
        inline SVG (Apple, Android, GitHub icons) as leading node

### B.4 LandingFeatures

- [ ] Create `src/components/landing/landing-features.tsx`:
  - [ ] Section eyebrow + H2 + description; `data-reveal`
  - [ ] 5-column CSS grid (below 900 px → 1 col) — each card:
    - [ ] Hued background 22 px emoji icon box
    - [ ] Hued title (17 px extrabold)
    - [ ] Description (Nunito 14 px)
    - [ ] Example row: 6 px dot + monospace 12 px example text; top border separator
  - [ ] Custom-type card: dashed 18 % border; "+" icon box (1.5 px foreground border);
        "Plus your own." copy

### B.5 LandingRhythmDemo

- [ ] Create `src/components/landing/landing-rhythm-demo.tsx`:
  - [ ] `data-reveal`; hardcoded `WEEK` array (7 days, Mon–Sun with Fri = today)
  - [ ] Section eyebrow + H2 "See the week, / not just the workout." + description
  - [ ] Implement demo container with `bg-2`, `rounded-[20px]`, 32 px pad:
    - [ ] Render "Last 7 days" header + "Sample · April 14–20" label (intentionally static
          hardcoded date — not a bug)
    - [ ] Implement 7-column stacked bar chart: `grid-cols-7`, 200 px tall; each column
          uses `flex flex-col-reverse`; segments use `flex: <minutes>` proportion + hue
          background color
    - [ ] Render day label row: today (Fri) in teal-ink bold + "today" sub-label
    - [ ] Render legend: 5 color swatches (14×14 `rounded-[4px]`) + labels
    - [ ] Render 4 summary stat boxes: events logged, time tracked (h), modules touched,
          streak

### B.6 LandingPrinciples

- [ ] Create `src/components/landing/landing-principles.tsx`:
  - [ ] `data-reveal`
  - [ ] Section eyebrow + H2
  - [ ] 6-row table (border-[1px] overflow-hidden rounded-[20px]):
    - [ ] `grid grid-cols-[72px_1fr_1.5fr]` each row
    - [ ] № column: teal 800 tracking-wide
    - [ ] Title column: 17 px extrabold
    - [ ] Description column: Nunito 14 px/1.6 warm-500
    - [ ] Bottom border between rows (none on last)

### B.7 LandingFooter

- [ ] Create `src/components/landing/landing-footer.tsx`:
  - [ ] Flex justify-between; top warm-200/8 % border; max-w-[1200px] centered
  - [ ] Left: "© 2026 OrganicLever · Pre-Alpha" (warm-400 13 px)
  - [ ] Right: `<button onClick={onGoApp}>Open app →</button>` (teal link style)
  - [ ] Mobile: flex-col, text-center, gap-12 px

### B.8 LandingPage root

- [ ] Create `src/components/landing/landing-page.tsx`:
  - [ ] `'use client'`
  - [ ] `goApp = () => { window.location.hash = '#/app'; }`
  - [ ] `useEffect` mounting `IntersectionObserver` on all `[data-reveal]` elements;
        threshold 0.1; adds class `visible`; disconnects on unmount
  - [ ] Compose `LandingPage` to render in order: `<LandingNav>`, `<LandingHero>`, alpha
        banner (inline), `<LandingFeatures>`, `<LandingRhythmDemo>`, `<LandingPrinciples>`,
        `<LandingFooter>`
  - [ ] Note: `[data-reveal]` CSS is already added to `globals.css` in B.1 — do not
        re-add here

### B.9 Route wire-up

- [ ] Replace `src/app/page.tsx` body with:

  ```tsx
  import { LandingPage } from "@/components/landing/landing-page";
  export default function RootPage() {
    return <LandingPage />;
  }
  ```

### B.10 Alpha banner component

- [ ] Implement inline in `landing-page.tsx` (not a separate file — one-off):
  - [ ] Honey 8 % background + 25 % border; 16 px radius; flex gap-18 px
  - [ ] "⚗️" emoji; title in honey-ink 800; description with `<strong>` honey highlights

---

## Phase C — Validation

### C.1 Gherkin specs

- [ ] Delete or archive the existing stub-page feature:
  - [ ] Delete `specs/apps/organiclever/fe/gherkin/landing/landing.feature` (it asserts
        the old stub heading "OrganicLever" which will no longer exist after Phase B)
  - [ ] Delete `apps/organiclever-web/test/unit/steps/landing/landing.steps.tsx` (the
        corresponding step file for the stub page)
- [ ] Create `specs/apps/organiclever/fe/gherkin/landing/landing.feature` with all
      landing page scenarios from prd.md (replacing the deleted stub feature)
- [ ] Create step implementations at `apps/organiclever-web/test/unit/steps/landing/landing.steps.tsx`
      (`.tsx` extension — matches existing pattern; uses `@testing-library/react`)
- [ ] `nx run organiclever-web:test:quick` passes (≥ 70 % coverage)

### C.2 E2E

- [ ] Update or replace `apps/organiclever-web-e2e/steps/landing.steps.ts` to match
      the new landing feature (the existing step file covers the old stub-page scenarios;
      it must be rewritten to match the new feature file created in C.1):
  - [ ] Hero heading visible
  - [ ] "Open the app" CTA navigates to `/#/app`
- [ ] `nx run organiclever-web-e2e:test:e2e` passes

### C.3 Manual UI Verification (Playwright MCP)

- [ ] Start dev server: `nx dev organiclever-web`
- [ ] Navigate to landing page via `browser_navigate http://localhost:3200`
- [ ] Inspect DOM via `browser_snapshot` — verify hero heading, CTA button, all five event
      type cards visible
- [ ] Test CTA via `browser_click "Open the app"` — verify URL hash contains `/app`
- [ ] Verify no JS errors via `browser_console_messages` — must be zero errors
- [ ] Take screenshot via `browser_take_screenshot` for visual record
- [ ] Test responsive layout at 375px viewport:
  - [ ] Navigate to `http://localhost:3200` at 375px viewport width
  - [ ] `browser_snapshot` — verify single-column hero + features layout
  - [ ] `browser_snapshot` — verify nav shows brand + badge (no overflow)
- [ ] Test responsive layout at 1280px viewport:
  - [ ] `browser_snapshot` — verify 5-column features grid
  - [ ] Verify orb animations running (visible gradient shapes in hero background)
- [ ] Test scroll reveal:
  - [ ] Trigger scroll reveal: use `browser_evaluate` with
        `window.scrollTo(0, document.body.scrollHeight / 2)` to scroll past the fold;
        then `browser_snapshot` to verify `[data-reveal]` elements are visible
- [ ] Test footer link via `browser_click "Open app →"` — verify URL hash contains `/app`

### C.4 Final checks

- [ ] Run `nx run organiclever-web:build` to verify consuming app builds cleanly with new ts-ui exports
- [ ] `nx run organiclever-web:typecheck` passes
- [ ] `nx run organiclever-web:lint` passes
- [ ] `nx run ts-ui:test:quick` passes
- [ ] `nx run organiclever-web:test:quick` passes
- [ ] `nx run organiclever-web-e2e:test:e2e` passes
- [ ] Run blast-radius check: `nx affected -t typecheck lint test:quick spec-coverage`
      (catches any downstream breakage from ts-ui changes)

> **Important**: Fix ALL failures found, not just those caused by your changes. This
> follows the root cause orientation principle — proactively fix preexisting errors
> encountered during work. Do not defer or mention-and-skip existing issues.

### Post-Push Verification

- [ ] Push changes to `main` via PR from worktree branch `worktree-organiclever-v0`
- [ ] In the PR on GitHub, monitor the CI workflow (the `nx affected` typecheck + lint +
      test + coverage workflow)
- [ ] Verify all checks pass — typecheck, lint, test:quick, spec-coverage for
      `organiclever-web` and `ts-ui` (affected projects)
- [ ] If any CI check fails, fix immediately and push a follow-up commit to the worktree
      branch
- [ ] Do NOT merge the PR until all CI checks are green

### Plan Archival

- [ ] Verify ALL delivery checklist items above are ticked
- [ ] Verify ALL quality gates pass (local + CI)
- [ ] Move plan folder:
      `git mv plans/in-progress/2026-04-25__organiclever-web-landing-uikit/ plans/done/`
- [ ] Update `plans/in-progress/README.md` — remove the plan entry
- [ ] Update `plans/done/README.md` — add the plan entry with completion date
- [ ] Update any other READMEs that reference this plan
- [ ] Commit: `chore(plans): move organiclever-web-landing-uikit to done`
