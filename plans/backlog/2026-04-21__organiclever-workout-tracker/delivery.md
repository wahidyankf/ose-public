# Delivery Checklist

## Prerequisites

- [ ] Confirm worktree `organiclever-adopt-design-system` is on **`main` branch** —
      run `git branch` to verify; the worktree must track `main`, not a feature branch
- [ ] Sync with remote: `git fetch origin && git reset --hard origin/main` (ensures
      worktree is at HEAD of `origin/main` before any work begins)
- [ ] `npm install` from repo root
- [ ] `npm run doctor -- --fix` from repo root (polyglot toolchain convergence — the
      `postinstall` hook runs `doctor || true` and silently tolerates drift; explicit
      `--fix` is the only guarantee that all 18+ toolchains converge in a worktree session)
- [ ] Baseline passes: `npm exec nx run ts-ui:test:quick` — note current coverage %
- [ ] Baseline passes: `npm exec nx build organiclever-fe`

### Commit and push conventions

> **Intentional deviation from worktree default**: The default ose-public worktree
> convention routes commits through a draft PR. This plan explicitly overrides that
> convention — all commits push directly to `origin/main` (Trunk Based Development).
> This is a deliberate product decision, not a governance violation.

- Conventional Commits, imperative mood, no period
- Scope: `ts-ui-tokens` for token lib, `ts-ui` for component lib, `organiclever-fe` for app,
  `docs` for documentation-only changes
- One commit per phase group below; do NOT bundle unrelated changes from different phases
  or domains into a single commit
- **After every commit, push immediately: `git push origin main`** — no feature branches,
  no draft PRs
- Every commit step below is immediately followed by pushing to `origin/main`. The
  instruction is implied by this convention — no explicit push step is repeated per phase.

---

## Phase 1: `ts-ui-tokens` — dark mode variant + OL token file

### 1.1 — Fix dark mode variant in `tokens.css`

- [ ] **1.1.1** In `libs/ts-ui-tokens/src/tokens.css` replace:

  ```css
  @custom-variant dark (&:is(.dark *));
  ```

  with:

  ```css
  @custom-variant dark (&:is([data-theme="dark"] *), &:is(.dark *));
  ```

- [ ] **1.1.2** Verify `npm exec nx build organiclever-fe` still passes
- [ ] **1.1.3** Commit: `fix(ts-ui-tokens): add data-theme="dark" to dark variant selector`

### 1.2 — Create `organiclever.css`

- [ ] **1.2.1** Create `libs/ts-ui-tokens/src/organiclever.css`:
  - **No** `@import url(google fonts)` — fonts loaded via `next/font/google`
  - `:root {}`: 6 hues (base / ink / wash), `--warm-0` through `--warm-900`
  - `@theme {}`: semantic color overrides, OL radius scale (sm=0.5rem → 2xl=1.75rem),
    warm-tinted shadow scale. Full spec in `tech-docs.md § Phase 1B`
  - `[data-theme="dark"], .dark {}`: dark hue lifts + dark warm scale + **explicit
    overrides** for `--color-card: var(--warm-50)` and `--color-popover: var(--warm-50)`
    (these are hardcoded `#ffffff` in `@theme` so CSS cannot auto-derive them in dark)
- [ ] **1.2.2a** Verify `npm exec nx run ts-ui-tokens:typecheck` — no TS errors
- [ ] **1.2.2b** Verify `npm exec nx build organiclever-fe` — CSS is valid and imports
      resolve
- [ ] **1.2.3** Commit: `feat(ts-ui-tokens): add organiclever warm OKLCH token system`

---

## Phase 2: `organiclever-fe` — typography + token wiring

- [ ] **2.1** Update `apps/organiclever-fe/src/app/layout.tsx`:
  - Import `Nunito` with `variable: '--font-nunito'`, weights `['400','500','600','700','800']`,
    `display: 'swap'`, `subsets: ['latin']`
  - Import `JetBrains_Mono` with `variable: '--font-jetbrains-mono'`, weights
    `['400','500','600']`, `display: 'swap'`, `subsets: ['latin']`
  - Add `${nunito.variable} ${jetbrainsMono.variable}` to `<html>` className
- [ ] **2.2** Update `apps/organiclever-fe/src/app/globals.css`:
  - Add `@import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css"` after
    the base tokens import
  - Add `@theme { --font-sans: var(--font-nunito), ...; --font-mono: var(--font-jetbrains-mono), ...; }`
- [ ] **2.3** Update `libs/ts-ui/.storybook/preview.ts`:
  - Add `import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css";` after
    the existing `tokens.css` import so Storybook stories render with OL warm palette
- [ ] **2.4** Start dev server (`npm exec nx dev organiclever-fe`) and verify at `localhost:3200`:
  - [ ] Background is warm cream (not pure white)
  - [ ] Body font is Nunito
  - [ ] DevTools shows `--hue-teal` resolving to an OKLCH value
  - [ ] Focused input ring is teal
- [ ] **2.5** Run `npm exec nx build organiclever-fe` — passes

### Manual UI Verification (Playwright MCP)

- [ ] **2.6** Start dev server: `npm exec nx dev organiclever-fe`
- [ ] **2.7** Navigate: `browser_navigate` to `http://localhost:3200`
- [ ] **2.8** Inspect DOM: `browser_snapshot` — verify warm cream background is applied (not
      pure white), Nunito font visible in computed styles
- [ ] **2.9** Check console: `browser_console_messages` — must be zero JavaScript errors
- [ ] **2.10** Screenshot: `browser_take_screenshot` for visual documentation of baseline
      warm palette
- [ ] **2.11** Verify teal ring: `browser_click` on an input field, then `browser_snapshot`
      to confirm teal focus ring is applied
- [ ] **2.12** Commit: `feat(organiclever-fe): wire OL tokens and Nunito/JetBrains fonts`

---

## Phase 3: Update `Button`

- [ ] **3.1** In `libs/ts-ui/src/components/button/button.tsx` add to `buttonVariants`:
  - Variant `teal`: `"bg-[var(--hue-teal)] text-white hover:bg-[var(--hue-teal)]/90"`
  - Variant `sage`: `"bg-[var(--hue-sage)] text-white hover:bg-[var(--hue-sage)]/90"`
  - Size `xl`: `"h-[60px] rounded-2xl px-7 text-lg has-[>svg]:px-5"`
  - Do NOT add `focus-visible:ring-*` to new variants — base class already handles it
- [ ] **3.2** Update `specs/libs/ts-ui/gherkin/button/button.feature`:
  - Add scenario: "Renders variant teal"
  - Add scenario: "Renders variant sage"
  - Add scenario: "Renders size xl"
- [ ] **3.3** Update `libs/ts-ui/src/components/button/button.steps.tsx`:
  - Add Given/Then handlers for the three new scenarios
- [ ] **3.4** Update `libs/ts-ui/src/components/button/button.test.tsx`:
  - Test teal variant: renders with `data-variant="teal"`
  - Test sage variant: renders with `data-variant="sage"`
  - Test xl size: renders with `data-size="xl"`
  - Add axe tests for both new variants
- [ ] **3.5** Update `libs/ts-ui/src/components/button/button.stories.tsx`:
  - Add `"teal"` and `"sage"` to variant argType options
  - Add `"xl"` to size argType options
  - Add `VariantTeal`, `VariantSage`, `SizeXL` story exports
- [ ] **3.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **3.7** Commit: `feat(ts-ui): add teal/sage button variants and xl size`

---

## Phase 4: Update `Alert`

- [ ] **4.1** In `libs/ts-ui/src/components/alert/alert.tsx` add to `alertVariants`:
  - `success`: sage wash bg + sage ink text + sage border (full spec in `tech-docs.md § 3B`)
  - `warning`: honey wash bg + honey ink text + honey border
  - `info`: sky wash bg + sky ink text + sky border
- [ ] **4.2** Update `specs/libs/ts-ui/gherkin/alert/alert.feature`:
  - Add scenarios for success, warning, info variants
- [ ] **4.3** Update `libs/ts-ui/src/components/alert/alert.steps.tsx`:
  - Add steps for new scenarios
- [ ] **4.4** Update `libs/ts-ui/src/components/alert/alert.test.tsx`:
  - Render tests for all three new variants + axe tests
- [ ] **4.5** Update `libs/ts-ui/src/components/alert/alert.stories.tsx`:
  - Add `"success"`, `"warning"`, `"info"` to variant options
  - Add `VariantSuccess`, `VariantWarning`, `VariantInfo` story exports
- [ ] **4.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **4.7** Commit: `feat(ts-ui): add success/warning/info alert variants`

---

## Phase 5: Update `Input`

- [ ] **5.1** In `libs/ts-ui/src/components/input/input.tsx` change `h-9` → `h-11`
- [ ] **5.2** Update `specs/libs/ts-ui/gherkin/input/input.feature`: update height scenario
- [ ] **5.3** Update `libs/ts-ui/src/components/input/input.steps.tsx`: update height step
- [ ] **5.4** Update `libs/ts-ui/src/components/input/input.test.tsx`: assert `h-11` class
- [ ] **5.5** Update `libs/ts-ui/src/components/input/input.stories.tsx` if height mentioned
- [ ] **5.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **5.7** Commit: `fix(ts-ui): increase Input height to 44 px (OL touch target)`

---

## Phase 6: New component — `Icon`

- [ ] **6.1** Create `libs/ts-ui/src/components/icon/icon.tsx`:
  - TypeScript port of `organic-lever/project/workout-app/Icon.jsx`
  - Export `IconName` union (all 34 names), `IconProps` interface
  - `aria-hidden="true"` by default; if `aria-label` prop provided, set `role="img"`
    and omit `aria-hidden`
  - Unknown name: render fallback `<circle cx="12" cy="12" r="8"/>`
- [ ] **6.2** Create `specs/libs/ts-ui/gherkin/icon/icon.feature`:
  - Scenario: known icon renders SVG
  - Scenario: unknown name renders fallback circle
  - Scenario: aria-hidden is set on decorative icon
  - Scenario: aria-label accessible name
- [ ] **6.3** Create `libs/ts-ui/src/components/icon/icon.steps.tsx`
- [ ] **6.4** Create `libs/ts-ui/src/components/icon/icon.test.tsx`
- [ ] **6.5** Create `libs/ts-ui/src/components/icon/icon.stories.tsx`:
  - AllIcons grid / Sizes (16/20/24/32) / Filled variants
- [ ] **6.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **6.7** Commit: `feat(ts-ui): add Icon component with 34 OL SVG icons`

---

## Phase 7: New component — `Toggle`

- [ ] **7.1** Create `libs/ts-ui/src/components/toggle/toggle.tsx`:
  - `"use client"` — event handlers + potential local state
  - `role="switch"`, `aria-checked={value}`, `disabled` support
  - Thumb position via conditional className on `value` prop (NOT `data-[checked]`)
  - Track: conditional `bg-[var(--hue-teal)]` / `bg-[var(--warm-200)]` based on `value`
  - Full spec in `tech-docs.md § 4B`
- [ ] **7.2** Create `specs/libs/ts-ui/gherkin/toggle/toggle.feature`:
  - Scenario: renders off state / on state / click triggers onChange / disabled
- [ ] **7.3** Create `libs/ts-ui/src/components/toggle/toggle.steps.tsx`
- [ ] **7.4** Create `libs/ts-ui/src/components/toggle/toggle.test.tsx`
- [ ] **7.5** Create `libs/ts-ui/src/components/toggle/toggle.stories.tsx`:
  - On / Off / WithLabel / Disabled
- [ ] **7.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **7.7** Commit: `feat(ts-ui): add Toggle switch component`

---

## Phase 8: New component — `ProgressRing`

- [ ] **8.1** Create `libs/ts-ui/src/components/progress-ring/progress-ring.tsx`:
  - No `"use client"` — pure SVG, no hooks
  - `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`
  - `rotate(-90deg)` SVG transform
  - `strokeDashoffset = circ * (1 - progress)`, transition 1 s linear
  - Full spec in `tech-docs.md § 4C`
- [ ] **8.2** Create `specs/libs/ts-ui/gherkin/progress-ring/progress-ring.feature`:
  - Scenario: full / half / empty progress / aria attributes
- [ ] **8.3** Create `libs/ts-ui/src/components/progress-ring/progress-ring.steps.tsx`
- [ ] **8.4** Create `libs/ts-ui/src/components/progress-ring/progress-ring.test.tsx`
- [ ] **8.5** Create `libs/ts-ui/src/components/progress-ring/progress-ring.stories.tsx`:
  - Full / Half / Empty / CustomColor
- [ ] **8.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **8.7** Commit: `feat(ts-ui): add ProgressRing SVG component`

---

## Phase 9: New component — `Sheet`

- [ ] **9.1** Create `libs/ts-ui/src/components/sheet/sheet.tsx`:
  - `"use client"` — uses Radix Dialog primitive (same as `dialog.tsx`)
  - Built on `radix-ui` `Dialog.Root` for focus trap + Escape key + `aria-modal`
  - Panel: `fixed bottom-0 w-full max-w-[480px] rounded-t-3xl bg-card shadow-lg`
  - Overlay: `fixed inset-0 bg-[oklch(14%_0.01_60/0.45)]`
  - Slide-up: `data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom`
  - Full spec in `tech-docs.md § 4D`
- [ ] **9.2** Create `specs/libs/ts-ui/gherkin/sheet/sheet.feature`:
  - Scenario: title renders / close button closes / scrim click closes / a11y
- [ ] **9.3** Create `libs/ts-ui/src/components/sheet/sheet.steps.tsx`
- [ ] **9.4** Create `libs/ts-ui/src/components/sheet/sheet.test.tsx`
- [ ] **9.5** Create `libs/ts-ui/src/components/sheet/sheet.stories.tsx`:
  - WithTitle / WithoutTitle / LongContent
- [ ] **9.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **9.7** Commit: `feat(ts-ui): add Sheet bottom-sheet component`

---

## Phase 10: New component — `AppHeader`

- [ ] **10.1** Create `libs/ts-ui/src/components/app-header/app-header.tsx`:
  - No `"use client"` needed (no local state; event handlers via props)
  - Back button 40 px `rounded-xl bg-secondary` — only when `onBack` is set
  - `aria-label="Go back"` on back button
  - Full spec in `tech-docs.md § 4E`
- [ ] **10.2** Create `specs/libs/ts-ui/gherkin/app-header/app-header.feature`:
  - Scenario: renders title / back button click / no back when onBack absent / trailing
- [ ] **10.3** Create `libs/ts-ui/src/components/app-header/app-header.steps.tsx`
- [ ] **10.4** Create `libs/ts-ui/src/components/app-header/app-header.test.tsx`
- [ ] **10.5** Create `libs/ts-ui/src/components/app-header/app-header.stories.tsx`:
  - WithBack / WithoutBack / WithSubtitle / WithTrailing
- [ ] **10.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **10.7** Commit: `feat(ts-ui): add AppHeader navigation component`

---

## Phase 11: New component — `HuePicker`

- [ ] **11.1** Create `libs/ts-ui/src/components/hue-picker/hue-picker.tsx`:
  - `"use client"` — onChange event handler
  - Define `HUES`, `HueName` here — this is the **single source of truth** for both
  - Swatch background via **inline style** (dynamic hue — NOT a constructed Tailwind class); see `tech-docs.md § 4H` for the exact inline style expression
  - `aria-pressed={value===hue}` on each swatch button
  - Full spec in `tech-docs.md § 4H`
- [ ] **11.2** Create `specs/libs/ts-ui/gherkin/hue-picker/hue-picker.feature`:
  - Scenario: renders 6 swatches / click calls onChange / aria-pressed reflects selection
- [ ] **11.3** Create `libs/ts-ui/src/components/hue-picker/hue-picker.steps.tsx`
- [ ] **11.4** Create `libs/ts-ui/src/components/hue-picker/hue-picker.test.tsx`
- [ ] **11.5** Create `libs/ts-ui/src/components/hue-picker/hue-picker.stories.tsx`:
  - Default (teal selected) / ChangeSelection
- [ ] **11.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **11.7** Commit: `feat(ts-ui): add HuePicker color swatch selector`

---

## Phase 12: New component — `InfoTip`

- [ ] **12.1** Create `libs/ts-ui/src/components/info-tip/info-tip.tsx`:
  - `"use client"` — manages `open` state
  - Trigger: 20 px circle, `hover:bg-[var(--hue-sky-wash)]`, `aria-label={title}`
  - Open state: `useState(false)`; click sets open; Sheet renders when open
  - Sheet close: `setOpen(false)` — no external `onClose` prop on InfoTip
  - Full spec in `tech-docs.md § 4G`
- [ ] **12.2** Create `specs/libs/ts-ui/gherkin/info-tip/info-tip.feature`:
  - Scenario: trigger renders / click opens Sheet / Sheet close button sets open=false
- [ ] **12.3** Create `libs/ts-ui/src/components/info-tip/info-tip.steps.tsx`
- [ ] **12.4** Create `libs/ts-ui/src/components/info-tip/info-tip.test.tsx`:
  - Renders trigger, click opens Sheet, Sheet close hides Sheet (no `onClose` prop test)
- [ ] **12.5** Create `libs/ts-ui/src/components/info-tip/info-tip.stories.tsx`: Default
- [ ] **12.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **12.7** Commit: `feat(ts-ui): add InfoTip contextual help component`

---

## Phase 13: New component — `StatCard`

- [ ] **13.1** Create `libs/ts-ui/src/components/stat-card/stat-card.tsx`:
  - No `"use client"` (InfoTip has its own client state)
  - Import `HueName` from `../hue-picker/hue-picker` — do NOT redefine it (HuePicker
    created in Phase 11; InfoTip created in Phase 12 — both available at this point)
  - Icon box background via **inline style** (dynamic hue — NOT a constructed Tailwind
    class); see `tech-docs.md § 4F` for the exact inline style expression
  - Full spec in `tech-docs.md § 4F`
- [ ] **13.2** Create `specs/libs/ts-ui/gherkin/stat-card/stat-card.feature`:
  - Scenario: renders label/value/unit / all hues render / InfoTip when info set
- [ ] **13.3** Create `libs/ts-ui/src/components/stat-card/stat-card.steps.tsx`
- [ ] **13.4** Create `libs/ts-ui/src/components/stat-card/stat-card.test.tsx`
- [ ] **13.5** Create `libs/ts-ui/src/components/stat-card/stat-card.stories.tsx`:
  - AllHues grid / WithInfo / WithoutInfo
- [ ] **13.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **13.7** Commit: `feat(ts-ui): add StatCard dashboard tile component`

---

## Phase 14: New component — `TabBar`

- [ ] **14.1** Create `libs/ts-ui/src/components/tab-bar/tab-bar.tsx`:
  - `"use client"` — has `onChange` event handler (consistent with Toggle, HuePicker)
  - Export `TabItem` interface (used by SideNav)
  - `role="tablist"`, each tab `role="tab" aria-selected={current===id}`
  - Safe-area via inline style on the container
  - Min touch target: `flex-1 min-h-[48px]`
  - Full spec in `tech-docs.md § 4I`
- [ ] **14.2** Create `specs/libs/ts-ui/gherkin/tab-bar/tab-bar.feature`:
  - Scenario: renders tabs / click triggers onChange / aria-selected / a11y
- [ ] **14.3** Create `libs/ts-ui/src/components/tab-bar/tab-bar.steps.tsx`
- [ ] **14.4** Create `libs/ts-ui/src/components/tab-bar/tab-bar.test.tsx`
- [ ] **14.5** Create `libs/ts-ui/src/components/tab-bar/tab-bar.stories.tsx`:
  - FourTabs / HomeActive / HistoryActive
- [ ] **14.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **14.7** Commit: `feat(ts-ui): add TabBar mobile navigation component`

---

## Phase 15: New component — `SideNav`

- [ ] **15.1** Create `libs/ts-ui/src/components/side-nav/side-nav.tsx`:
  - `"use client"` — has `onChange` event handler (consistent with TabBar, HuePicker, Toggle)
  - Import `HueName` from `../hue-picker/hue-picker`
  - Import `TabItem` from `../tab-bar/tab-bar`
  - Brand icon box background via inline style (dynamic hue)
  - Brand row click calls `onChange('home')` — NOT "navigate to first tab"
  - Active tab background: `bg-[var(--hue-teal-wash)]` (hardcoded teal — not dynamic)
  - Full spec in `tech-docs.md § 4J`
- [ ] **15.2** Create `specs/libs/ts-ui/gherkin/side-nav/side-nav.feature`:
  - Scenario: renders brand / renders tabs / click triggers onChange / active state / a11y
- [ ] **15.3** Create `libs/ts-ui/src/components/side-nav/side-nav.steps.tsx`
- [ ] **15.4** Create `libs/ts-ui/src/components/side-nav/side-nav.test.tsx`
- [ ] **15.5** Create `libs/ts-ui/src/components/side-nav/side-nav.stories.tsx`:
  - FourTabs / HistoryActive
- [ ] **15.6** Run `npm exec nx run ts-ui:test:quick` — passes
- [ ] **15.7** Commit: `feat(ts-ui): add SideNav desktop navigation component`

---

## Phase 16: Wire exports + final validation

- [ ] **16.1** Update `libs/ts-ui/src/index.ts`:
  - Add all exports for 10 new components and their types
  - Full export list in `tech-docs.md § Phase 5`
- [ ] **16.2** Run `npm exec nx run ts-ui:typecheck` — zero errors
- [ ] **16.3** Run `npm exec nx run ts-ui:lint` — zero errors
- [ ] **16.4** Run `npm exec nx run ts-ui:test:quick` — passes, coverage ≥ 70%
- [ ] **16.5** Run `npm exec nx build organiclever-fe` — passes, zero type errors
- [ ] **16.6** Run `npm exec nx run organiclever-fe:test:quick` — passes
- [ ] **16.7** Run `npm run lint:md` — zero markdown violations
- [ ] **16.8** Storybook smoke test (`npm exec nx storybook ts-ui`):
  - [ ] Existing components render (no regressions)
  - [ ] All 10 new components visible under correct categories
  - [ ] Dark mode toggle (`.dark` class via Storybook addon-themes) shifts to warm-dark
  - [ ] Warm cream background visible in light mode (confirms `organiclever.css` loaded)
- [ ] **16.9** Browser smoke test — `npm exec nx dev organiclever-fe` at `localhost:3200`:
  - [ ] Warm cream background
  - [ ] Nunito body font
  - [ ] Teal focus ring on inputs
  - [ ] Primary button is sage green

### Manual UI Verification (Playwright MCP — Final Integration)

- [ ] **16.10** Navigate: `browser_navigate` to `http://localhost:3200`
- [ ] **16.11** Inspect DOM: `browser_snapshot` — verify warm palette applied, Nunito font
      visible in body, no fallback system font showing
- [ ] **16.12** Check console: `browser_console_messages` — must be zero JavaScript errors
      or React hydration warnings
- [ ] **16.13** Screenshot: `browser_take_screenshot` for final visual documentation
- [ ] **16.14** Interactive assertion: `browser_click` on a Toggle component, then
      `browser_snapshot` to verify the teal active state is visible — confirms event handlers
      work in the final integrated build
- [ ] **16.15** Commit: `feat(ts-ui): wire all new OL component exports`

---

## Phase 16.5: Documentation Updates

Update all related `.md` files so developers can understand the design system without
reading source code. These files were pre-written to describe the target state; verify
each section is accurate against the actual implementation before committing.

- [ ] **16.5.1** Verify `apps/organiclever-fe/README.md` — confirm the `## Design System`
      section accurately reflects the implemented palette table, font table, dark mode
      instructions, token import snippet, and component catalog
- [ ] **16.5.2** Verify `libs/ts-ui/README.md` — confirm the OrganicLever components table
      lists all 10 newly created components with correct prop signatures
- [ ] **16.5.3** Verify `libs/ts-ui-tokens/README.md` — confirm the `## Per-App Brand Token
    Files` section and `organiclever.css` entry are accurate
- [ ] **16.5.4** Verify `governance/development/frontend/design-tokens.md` — confirm the
      `## OKLCH Brand Tokens (OrganicLever)` section and updated `@custom-variant dark`
      example are accurate
- [ ] **16.5.5** Verify `.claude/skills/apps-organiclever-fe-developing-content/SKILL.md` —
      confirm the `## Design System` section accurately reflects imports, font usage, dark
      mode activation, and component usage examples
- [ ] **16.5.6** Run `npm run lint:md` — zero markdown violations across all updated files
- [ ] **16.5.7** Commit: `docs: update design system documentation across organiclever-fe and ts-ui`

---

## Phase 17: Full Blast-Radius Quality Gate

> **Important**: Fix ALL failures found during quality gates — including those not caused
> by your changes. Root cause orientation: proactively fix preexisting errors encountered
> during work. Do not defer or mention-and-skip existing failures.

- [ ] **17.1** Run affected typecheck: `npm exec nx affected -t typecheck`
- [ ] **17.2** Run affected linting: `npm exec nx affected -t lint`
- [ ] **17.3** Run affected quick tests: `npm exec nx affected -t test:quick`
- [ ] **17.4** Run affected spec coverage: `npm exec nx affected -t spec-coverage`
- [ ] **17.5** Fix ALL failures found — including preexisting issues not caused by your
      changes
- [ ] **17.6** Verify all checks pass before pushing
- [ ] **17.7** If any files were changed while fixing preexisting failures, review `git status`, stage the specific changed files (prefer explicit paths over `git add -A`), then commit: `git commit -m "fix: resolve preexisting failures found during blast-radius quality gate"`
- [ ] **17.8** If step 17.7 created a commit, push it: `git push origin main`

---

## Phase 18: Post-Push Verification

- [ ] **18.1** Confirm all commits are pushed: `git log origin/main..HEAD` must show nothing
      (all local commits already pushed via `git push origin main` after each phase, and via
      step 17.8 if step 17.7 fired)
- [ ] **18.2** Monitor GitHub Actions workflows for the final push (CI runs on `ubuntu-latest`)
- [ ] **18.3** Verify all CI checks pass (typecheck, lint, test:quick, spec-coverage)
- [ ] **18.4** If any CI check fails, fix immediately, push a follow-up commit to `origin/main`
- [ ] **18.5** Do NOT proceed to plan archival until CI is green

---

## Plan Archival

- [ ] **A.1** Verify ALL delivery checklist items are ticked
- [ ] **A.2** Verify ALL quality gates pass (local + CI)
- [ ] **A.3** Move plan folder to `plans/done/` via `git mv plans/backlog/2026-04-21__organiclever-workout-tracker plans/done/2026-04-21__organiclever-workout-tracker`
- [ ] **A.4** Update `plans/backlog/README.md` — remove this plan entry
- [ ] **A.5** Update `plans/done/README.md` — add this plan entry with completion date
- [ ] **A.6** Commit: `chore(plans): move organiclever-adopt-design-system to done`
- [ ] **A.7** Push archival commit: `git push origin main`

---

## Rollback

- **Token file only**: remove `@import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css"`
  from `globals.css` — immediate revert, zero other files affected.
- **Component additions**: all new components and new variants are additive. No existing
  story, test, or component API is changed in a breaking way. Removing the exports from
  `index.ts` reverts without side effects.
- **Input h-11 change**: the only potentially breaking change. If height regression occurs
  in any organiclever-fe layout, revert `h-11` → `h-9` and add a size prop instead.
