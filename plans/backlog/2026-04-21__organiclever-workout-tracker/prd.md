# Product Requirements

## Product Overview

This plan adopts the OrganicLever (OL) design system — warm OKLCH palette, Nunito and
JetBrains Mono typography, rounded geometry, and semantic dark mode — from the Claude
Design handoff bundle into the shared `ts-ui-tokens` and `ts-ui` component libraries.
The adoption covers: one new token file (`organiclever.css`) opt-in imported by
`organiclever-fe`; updates to three existing components (Button, Alert, Input) adding
OL-brand variants; and ten new components (Icon, Toggle, ProgressRing, Sheet, AppHeader,
StatCard, InfoTip, HuePicker, TabBar, SideNav). Typography is wired into `organiclever-fe`
via `next/font/google`. App screens are out of scope — this plan delivers only the
building blocks.

---

## Personas

- **Developer hat** — imports `ts-ui` components to build `organiclever-fe` screens.
  Wants typed, accessible components with correct OL tokens already applied, so building
  a new screen requires only composition — no inline style derivation.
- **Designer hat** — opens Storybook to verify that rendered components match the Claude
  Design handoff visually. The canonical source of truth is the handoff bundle; this
  persona's goal is fulfilled when Storybook + the live site are pixel-accurate.

---

## Product Scope

### In Scope

- OL warm OKLCH token file (`libs/ts-ui-tokens/src/organiclever.css`) with full palette,
  radius scale, shadow scale, semantic overrides, and dark mode
- Dark mode variant fix in `libs/ts-ui-tokens/src/tokens.css` (additive selector change)
- Typography wiring in `apps/organiclever-fe` — Nunito + JetBrains Mono via `next/font/google`
- Token import + font `@theme` mapping in `apps/organiclever-fe/src/app/globals.css`
- Storybook preview import of `organiclever.css` in `libs/ts-ui/.storybook/preview.ts`
- Updated existing components: Button (teal/sage variants, xl size), Alert (success/warning/info
  variants), Input (44 px height)
- 10 new `libs/ts-ui` components with tests and Storybook stories: Icon, Toggle, ProgressRing,
  Sheet, AppHeader, StatCard, InfoTip, HuePicker, TabBar, SideNav

### Out of Scope

- Workout app screens (Home, Workout, Finish, EditRoutine, History, Progress, Settings) — next plan
- Data layer (`db.ts`, `types.ts`) — separate plan
- New routes or pages in `organiclever-fe` — separate plan
- Landing page content changes — separate plan
- Changes to `ts-ui-tokens/src/tokens.css` neutral baseline beyond the dark variant selector fix
- `ose-primer` propagation of OL brand tokens (product-specific, classified `neither`)

---

## User Stories

### Tokens

**US-T-1**
As a developer I want a single CSS import (`@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css`)
that installs the complete OL warm OKLCH design system — palette, radius, shadows,
semantic overrides, dark mode — so I can reference `var(--hue-teal)` or `var(--warm-500)`
anywhere without copy-pasting values.

**US-T-2**
As a developer I want the existing Tailwind semantic utilities (`bg-primary`,
`text-muted-foreground`, `rounded-md`, `shadow-sm`, etc.) to resolve to OL values in
`organiclever-fe` so that `ts-ui` components auto-adopt the brand without code changes
to the components themselves.

**US-T-3**
As a developer I want dark mode to activate on `[data-theme="dark"]` (set via
JavaScript) AND `.dark` class (set via Tailwind dark variant) so I can choose the
activation method that fits my runtime context without maintaining parallel CSS overrides.

### Typography

**US-TY-1**
As a user I want to see Nunito as the body font and JetBrains Mono for numeric values
in `organiclever-fe` so the site matches the design exactly.

### Updated Existing Components

**US-C-1 (Button — brand variants)**
As a developer I want `<Button variant="teal">` and `<Button variant="sage">` so I can
use the OL brand hues for primary actions without ad-hoc inline styles.

**US-C-2 (Button — xl size)**
As a developer I want `<Button size="xl">` (60 px height, 28 px horizontal padding) so I
can render hero-level CTAs that match the OL design's largest button size without custom
inline styles.

**US-C-3 (Alert — semantic variants)**
As a developer I want `<Alert variant="success">`, `<Alert variant="warning">`, and
`<Alert variant="info">` that use the OL sage/honey/sky wash + ink tokens so I can
surface status messages in brand-consistent colors.

**US-C-4 (Input — touch target)**
As a user on mobile I want the default Input height to be 44 px so that interactive
inputs meet touch-target accessibility standards.

### New Components

**US-N-1 (Icon)**
As a developer I want `<Icon name="dumbbell" size={20} filled />` to render the OL
inline SVG icon set (30+ icons) so I have a consistent icon language without an
external icon dependency.

**US-N-2 (Toggle)**
As a developer I want `<Toggle value={bool} onChange={fn} label="Dark mode" />` so I can
offer a slide-switch input with teal active state and smooth 200 ms animation.

**US-N-3 (ProgressRing)**
As a developer I want `<ProgressRing size={80} stroke={6} progress={0.75} color="var(--hue-teal)" bg="var(--warm-100)" />`
so I can display a circular SVG progress indicator with `strokeDashoffset` animation.

**US-N-4 (Sheet)**
As a developer I want `<Sheet title="…" onClose={fn}>…</Sheet>` so I can present a
bottom-anchored modal sheet (max-width 480 px, 24 px top-radius) with scrim overlay and
slide-up animation without reinventing focus-trap logic.

**US-N-5 (AppHeader)**
As a developer I want `<AppHeader title="…" subtitle="…" onBack={fn} trailing={node} />`
so I can render a consistent 40 px square back-button + title + optional trailing action
header on every screen.

**US-N-6 (StatCard)**
As a developer I want `<StatCard label="Streak" value={7} unit="days" hue="terracotta" icon="flame" info="…" />`
so I can render a dashboard stat tile (96 px min height, mono value, hue icon, optional
InfoTip) without custom layout code.

**US-N-7 (InfoTip)**
As a developer I want `<InfoTip title="…" text="…" />` for a 20 px "ⓘ" circle that opens
a Sheet explanation, so contextual help follows the OL bottom-sheet pattern.

**US-N-8 (HuePicker)**
As a developer I want `<HuePicker value="teal" onChange={fn} />` so I can present a row
of 32 px color swatches covering all 6 OL hues with selected-state outline.

**US-N-9 (TabBar)**
As a developer I want `<TabBar tabs={[…]} current="home" onChange={fn} />` so I can
render a 60 px mobile bottom navigation bar with teal active indicator.

**US-N-10 (SideNav)**
As a developer I want `<SideNav brand={{ name: "OrganicLever", icon: "dumbbell", hue: "teal" }} tabs={[…]} current="home" onChange={fn} />`
so I can render a 220 px desktop side navigation with brand logo row and teal-wash active
state.

### Documentation

**US-D-1**
As a developer I want all design system documentation updated — `apps/organiclever-fe/README.md`,
`libs/ts-ui/README.md`, `libs/ts-ui-tokens/README.md`,
`governance/development/frontend/design-tokens.md`, and the organiclever-fe SKILL — so I can
understand how to use OL tokens and components without reading source code.

---

## Product Risks

- **Coverage regression** — Adding 10 new components to `libs/ts-ui` must maintain the
  ≥ 70% LCOV coverage threshold enforced by `nx run ts-ui:test:quick`. Mitigation: every
  new component ships with unit tests in the same delivery phase before the coverage gate
  runs.
- **Component API incompatibility** — The dark mode `@custom-variant` selector change
  (adding `[data-theme="dark"]`) must not break Storybook's `withThemeByClassName`
  decorator or any existing app that uses `.dark`. Mitigation: change is additive
  (comma-separated selectors); existing `.dark` path is preserved.
- **Storybook preview compatibility** — Adding `organiclever.css` import to
  `libs/ts-ui/.storybook/preview.ts` may cause token conflicts if a story overrides
  a CSS custom property. Mitigation: `organiclever.css` only overrides `--color-*`,
  `--radius-*`, and `--shadow-*` in `@theme`; it does not remove or rename any token.
- **Input height regression** — Changing Input `h-9` → `h-11` (36 px → 44 px) is the
  only potentially breaking layout change. Mitigation: verify `nx build organiclever-fe`
  passes; rollback path is `h-11` → `h-9` + adding a size prop.

---

## Gherkin Acceptance Criteria

```gherkin
Feature: OL Token Adoption

  Scenario: Warm palette available in organiclever-fe
    Given organiclever-fe globals.css imports organiclever.css
    When the page is loaded
    Then the CSS custom property "--hue-teal" resolves to an OKLCH value
    And the CSS custom property "--warm-0" resolves to a near-white warm value
    And the Tailwind utility "bg-primary" resolves to the sage OKLCH value
    And the Tailwind utility "rounded-md" resolves to 12 px

  Scenario: Dark mode activates on data-theme attribute
    Given the OL token file is loaded
    When document.documentElement has attribute data-theme="dark"
    Then "--color-background" resolves to the warm-dark value
    And "--hue-teal" resolves to the lifted dark-mode value

  Scenario: Nunito font applied
    Given organiclever-fe layout.tsx loads Nunito via next/font/google
    When the page is loaded
    Then the computed font-family of body includes "Nunito"

Feature: Button — Brand Variants

  Scenario: Teal variant renders
    Given a Button with variant="teal"
    When the component renders
    Then background-color equals var(--hue-teal)
    And the text color is white

  Scenario: Sage variant renders
    Given a Button with variant="sage"
    When the component renders
    Then background-color equals var(--hue-sage)

  Scenario: XL size renders
    Given a Button with size="xl"
    When the component renders
    Then min-height is 60 px
    And horizontal padding is 28 px

Feature: Alert — Semantic Variants

  Scenario: Success variant renders
    Given an Alert with variant="success"
    When the component renders
    Then background uses var(--hue-sage-wash)
    And text uses var(--hue-sage-ink)

  Scenario: Warning variant renders
    Given an Alert with variant="warning"
    When the component renders
    Then background uses var(--hue-honey-wash)

  Scenario: Info variant renders
    Given an Alert with variant="info"
    When the component renders
    Then background uses var(--hue-sky-wash)

Feature: Input — Touch Target

  Scenario: Default height is 44 px
    Given an Input with no size prop
    When the component renders
    Then its rendered height is 44 px

Feature: New Components

  Scenario: Icon renders known name
    Given an Icon with name="dumbbell" size={24}
    When the component renders
    Then an SVG element is present in the DOM
    And its width and height attributes equal 24

  Scenario: Icon returns fallback for unknown name
    Given an Icon with name="xyz-unknown"
    When the component renders
    Then an SVG element is still rendered (fallback circle)

  Scenario: Toggle switches state
    Given a Toggle with value={false}
    When the user clicks it
    Then onChange is called with true

  Scenario: ProgressRing renders correct arc
    Given a ProgressRing with progress={0.5}
    When the component renders
    Then strokeDashoffset equals half the full circumference

  Scenario: Sheet renders title
    Given a Sheet is mounted with title="Test"
    When the component is rendered
    Then the title text "Test" is visible

  Scenario: Sheet close button triggers callback
    Given a Sheet is mounted with title="Test" and onClose={fn}
    When the close button is clicked
    Then onClose is called

  Scenario: AppHeader back button triggers callback
    Given an AppHeader with onBack={fn}
    When the back button is clicked
    Then fn is called once

  Scenario: StatCard renders label and value
    Given a StatCard with label="Streak" value={7} unit="days"
    When the component renders
    Then "Streak" text is present
    And "7" text is present
    And "days" text is present

  Scenario: InfoTip opens Sheet on click
    Given an InfoTip with title="Help" text="Some help text"
    When the info button is clicked
    Then a Sheet with title "Help" appears

  Scenario: HuePicker calls onChange with selected hue
    Given a HuePicker with value="teal"
    When the user clicks the "sage" swatch
    Then onChange is called with "sage"

  Scenario: TabBar highlights current tab
    Given a TabBar with current="home"
    When the component renders
    Then the "home" tab button has the active color style

  Scenario: SideNav highlights current tab
    Given a SideNav with current="history"
    When the component renders
    Then the "history" nav item has the teal-wash background

Feature: Accessibility

  Scenario: All new components pass axe
    Given each new component rendered in Storybook
    When axe accessibility analysis runs
    Then axe reports zero violations for each

Feature: Design System Documentation

  Scenario: organiclever-fe README has Design System section
    Given the file apps/organiclever-fe/README.md is read
    When the Design System section is located
    Then it contains a palette table with all 6 OL hues
    And it contains a typography table with Nunito and JetBrains Mono
    And it contains dark mode activation instructions
    And it contains the token import CSS snippet

  Scenario: ts-ui component catalog is complete
    Given the file libs/ts-ui/README.md is read
    When the OrganicLever components table is located
    Then it lists all 10 OL-specific components with their props

  Scenario: ts-ui-tokens README documents organiclever.css
    Given the file libs/ts-ui-tokens/README.md is read
    When the Per-App Brand Token Files section is located
    Then it describes the organiclever.css opt-in import pattern

  Scenario: governance design-tokens doc has OKLCH section
    Given the file governance/development/frontend/design-tokens.md is read
    When the OKLCH Brand Tokens section is located
    Then it explains why OKLCH is used for OrganicLever
    And it shows the data-theme="dark" selector in the @custom-variant example

  Scenario: SKILL file documents design system
    Given the organiclever-fe SKILL.md is read
    When the Design System section is located
    Then it shows the token import chain including organiclever.css
    And it shows ts-ui component usage examples with OL variants
```
