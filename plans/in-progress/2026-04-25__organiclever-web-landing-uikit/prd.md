# Product Requirements Document

## Product Overview

This plan delivers two parallel products:

1. **ts-ui library additions** — `Textarea` and `Badge` components added to
   `libs/ts-ui/`. These are generic primitives usable by all platform apps.

2. **OrganicLever landing page** — A polished static marketing page at `/` in
   `apps/organiclever-web/`, replacing the current stub. The page communicates product
   value to early visitors and is independent of any app screen or authentication layer.

The two deliverables are developed in parallel (Phase A and Phase B) and validated together
in Phase C.

## Personas

Solo maintainer wearing the following hats for this plan:

- **Library Author** — implements `Textarea` and `Badge` in `ts-ui`; ensures correct API,
  test coverage ≥ 70 %, and Storybook stories.
- **Frontend Engineer** — ports the landing page from the `organic-lever` handoff bundle
  into a pixel-close Next.js implementation.
- **Visitor to organiclever.com** — sees the landing page and understands the product value
  before any account or sign-up is required.

Consuming agents: `plan-executor`, `swe-typescript-dev`, `swe-e2e-dev`.

## User Stories

- As a visitor to organiclever.com, I want to see a polished landing page so that I can
  understand the product value before signing up.
- As a frontend engineer, I want a `Textarea` component in `ts-ui` so that I can build
  multi-line input forms without reimplementing a styled textarea in every app.
- As a frontend engineer, I want a `Badge` component in `ts-ui` so that I can render
  status chips and category tags consistently across all platform apps.
- As a frontend engineer consuming `organiclever-web-app`, I want `Badge` and `Textarea`
  available in `ts-ui` before the app plan starts so that I do not duplicate primitives.

## Product Scope

### In Scope

- `ts-ui`: `Textarea` component (styled, forwarded ref, native props forwarded)
- `ts-ui`: `Badge` component (CVA variants: `default`, `outline`, `secondary`,
  `destructive`; hue prop; sizes `sm` and `md`)
- `organiclever-web`: Full landing page at `/` (Nav, Hero, Alpha Warning Banner, Features,
  Weekly Rhythm Demo, Principles, Footer)
- Gherkin acceptance criteria for all components and the landing page
- Responsive layout at 375 px (mobile) and 1280 px (desktop)

### Out of Scope

- App screens (handled in `2026-04-25__organiclever-web-app`)
- Authentication, backend, cloud sync
- App-specific components (`WeekRhythmStrip`, `RoutineCard`, etc.)
- `FormField` wrapper
- Dynamic data in the landing page (all content is static)

## Product Risks

| Risk                                                                                                                                         | Mitigation                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Prototype-to-implementation pixel fidelity gap — the handoff bundle's visual design may not translate exactly to Tailwind v4 utility classes | Delivery checklist includes manual Playwright MCP verification at both viewport sizes                                           |
| Orb animation performance on low-end devices — three animated blurred `div`s may cause jank                                                  | Orbs use CSS `will-change: transform` implicitly via Tailwind; no JavaScript animation loop                                     |
| `IntersectionObserver` scroll reveal may conflict with SSR hydration — the component is `'use client'` but reveals fire after mount          | `useEffect` mounts the observer post-hydration; initial state (`opacity: 0`) may flash if JS is slow — acceptable for pre-alpha |
| Badge `hue` prop uses CSS variable bridge — token names must match `ts-ui-tokens` exactly                                                    | Delivery checklist verifies typecheck passes; `HueName` type is reused from `hue-picker`                                        |

## Part 1 — ts-ui Components

### Textarea

A styled `<textarea>` that matches the existing `Input` aesthetic: same border radius,
border color, background, padding, focus ring, disabled state. Forwarded ref. Accepts all
native `<textarea>` props plus an optional `className`.

**Usage in organiclever-web**: `NotesField` in all event loggers.

**Usage in other apps**: any multi-line text input.

**API**:

```tsx
<Textarea placeholder="Add notes…" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
```

### Badge

Compact inline label / tag. Comes in `variant` (default solid, outline) and maps to any
semantic hue via a `hue` prop, plus neutral `secondary` and `destructive`.

**Usage in organiclever-web**:

- Landing page: "Pre-Alpha" badge (honey outline, animated pulse)
- App home: event-type tags (`workout`, `reading`, `focus`, …)
- App workout: "Day N" streak badge (honey)
- App history: session type label

**Usage in other apps**: status chips, category tags, version labels.

**API**:

```tsx
<Badge variant="default" hue="teal">workout</Badge>
<Badge variant="outline" hue="honey">Day 3</Badge>
<Badge variant="outline">Pre-Alpha</Badge>
```

**Variants**:

| variant       | appearance                                   |
| ------------- | -------------------------------------------- |
| `default`     | solid hue background, white text             |
| `outline`     | hue border + wash background + ink text      |
| `secondary`   | `--color-secondary` bg, secondary foreground |
| `destructive` | destructive colors                           |

**Sizes**: `sm` (default, 11 px text, 20 px height), `md` (13 px text, 24 px height).

---

## Part 2 — Landing Page

### Layout Sections

**Nav**

- Left: OrganicLever logo mark (teal rounded square with lever SVG icon) + brand name
  "OrganicLever". Entire left group is a button that navigates to the app.
- Right: "Pre-Alpha" `Badge` (honey outline, animated pulse).
- Bottom: thin warm border separating nav from content.

**Hero**

- Background: animated ambient gradient orbs + SVG noise texture overlay.
- Eyebrow: teal uppercase label — "Personal life-event tracker".
- H1: "Your life," / "tracked." / "Analyzed." — teal and sage colored accent spans.
- Description: short product value statement, max readable width.
- CTA: large "Open the app" button with play icon and pulsing glow animation.
- Sub-note: "⚡ Free · works offline · no sign-up".
- Pills row: iOS, Android (coming soon), GitHub link, Fork link — each a `Badge` outline
  with icon.
- Single column layout (no phone preview image).

**Alpha Warning Banner**

- Honey-tinted container (background + border).
- "⚗️" emoji on the left.
- Title "Pre-Alpha — expect breaking changes" with descriptive text and highlighted
  key terms.

**Features Section**

- Section eyebrow + H2 "Out of the box, / or roll your own."
- 5-column event-type card grid (collapses to 1 column on mobile):
  - Workouts, Reading, Learning, Meals, Focus — each card hue-colored to its event type.
  - Each card shows: icon, title, description, and a monospace example entry.
- Custom-type card: indicates the user can define their own event types.

**Weekly Rhythm Demo**

- Section eyebrow + H2 "See the week, / not just the workout."
- Demo container showing a hardcoded sample week:
  - Header: "Last 7 days" + sample date label.
  - 7-column stacked bar chart: each column represents one day; segments stacked
    bottom-up with event-type colors; heights proportional to time logged.
  - Day labels with "today" indicator.
  - Legend with 5 event-type color swatches.
  - 4 summary stat boxes: events logged, time tracked, modules touched, active streak.

**Principles Section**

- Section eyebrow + H2 "Built for people who want to pay attention."
- Table with 6 rows listing the product principles: Local-first, Yours to take,
  Flexible, Quiet, Open, Multilingual. Each row shows a number, title, and description.

**Footer**

- "© 2026 OrganicLever · Pre-Alpha" on the left.
- "Open app →" link button on the right.
- Stacks vertically and centers on mobile.

**Scroll Reveal**

- Sections below the fold reveal with a fade-in + slide-up transition as the visitor
  scrolls them into view.

---

## Gherkin Acceptance Criteria

### Feature: Landing Page

```gherkin
Feature: OrganicLever landing page

  Background:
    Given I navigate to "/"

  Scenario: Hero heading visible
    Then I see text "Your life,"
    And I see text "tracked."
    And I see text "Analyzed."

  Scenario: CTA button present and functional
    Given I see a button "Open the app"
    When I click "Open the app"
    Then the URL hash contains "/app"

  Scenario: Footer link navigates to app
    Given I see text "Open app →"
    When I click "Open app →"
    Then the URL hash contains "/app"

  Scenario: Pre-Alpha badge visible in nav
    Then I see text "Pre-Alpha"

  Scenario: Alpha warning banner visible
    Then I see text "Pre-Alpha — expect breaking changes"

  Scenario: All five event type cards visible
    Then I see text "Workouts"
    And I see text "Reading"
    And I see text "Learning"
    And I see text "Meals"
    And I see text "Focus"

  Scenario: Custom event card visible
    Then I see text "Plus your own."

  Scenario: Weekly rhythm demo visible
    Then I see text "Last 7 days"

  Scenario: All six principles visible
    Then I see text "Local-first"
    And I see text "Yours to take"
    And I see text "Flexible"
    And I see text "Quiet"
    And I see text "Open"
    And I see text "Multilingual"
```

### Feature: Responsive behavior

```gherkin
Feature: Responsive behavior

  Scenario: Responsive layout at mobile width
    Given the viewport width is 375px
    When I navigate to "/"
    Then I see text "Your life,"
    And I see a button "Open the app"

  Scenario: Responsive layout at desktop width
    Given the viewport width is 1280px
    When I navigate to "/"
    Then I see text "Your life,"
    And I see a 5-column features grid
```

### Feature: ts-ui Textarea

```gherkin
Feature: Textarea component

  Scenario: Renders with placeholder
    Given I render a Textarea with placeholder "Write here…"
    Then I see the textarea element
    And the placeholder text is "Write here…"

  Scenario: Accepts input
    Given I render a controlled Textarea
    When I type "hello"
    Then the textarea value is "hello"

  Scenario: Disabled state
    Given I render a Textarea with disabled prop
    Then the textarea is not interactive

  Scenario: Focus ring visible on keyboard focus
    Given I render a Textarea
    When I focus the textarea via keyboard
    Then a focus ring is visible
```

### Feature: ts-ui Badge

```gherkin
Feature: Badge component

  Scenario: Renders default variant
    Given I render a Badge with text "workout"
    Then I see text "workout"
    And the badge has solid background

  Scenario: Renders outline variant with hue
    Given I render a Badge variant "outline" hue "honey"
    Then the badge has honey wash background
    And the badge has honey border

  Scenario: Renders secondary variant
    Given I render a Badge variant "secondary"
    Then the badge has background color from --color-secondary

  Scenario: Renders destructive variant
    Given I render a Badge variant "destructive"
    Then the badge uses destructive colors

  Scenario: Renders md size
    Given I render a Badge with size "md"
    Then the badge has class containing "text-[13px]"
    And the badge has class containing "px-2.5"
```
