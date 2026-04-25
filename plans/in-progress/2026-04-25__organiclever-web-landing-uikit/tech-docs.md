# Technical Documentation

## Raw Design Files

Prototype source files are in `raw/`. See `raw/README.md` for the full file list and
confirmed design decisions. The two key files:

- `raw/index.html` — `LandingPage` React component (line ~159); authoritative for layout,
  class names, and all hardcoded content.
- `raw/colors_and_type.css` — complete design token system; authoritative for all
  `--hue-*`, `--warm-*`, `--color-*`, font, radius, and shadow values.

When any implementation detail is unclear, read the raw source before guessing.

## Propagation Decision Log

The following table documents every prototype component considered for ts-ui promotion
and the ruling:

| Prototype component                             | Decision             | Reason                                                                                                   |
| ----------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| `Textarea` / `NotesField`                       | **Promote to ts-ui** | Generic primitive; missing from library; needed in all 5 loggers + any future multi-line form            |
| `Badge` (event tags, streak badge, "Pre-Alpha") | **Promote to ts-ui** | Generic tag/chip pattern; used across landing + app; other platform apps will need it                    |
| `TextInput` (labeled Input wrapper)             | **Keep in app**      | `Label` + `Input` composition; not worth a new component; implement inline in each logger                |
| `WeekRhythmStrip`                               | **Keep in app**      | Color map tied to OL event types; not generically reusable without heavy parameterization                |
| `RoutineCard`                                   | **Keep in app**      | Workout-domain specific; dual-button layout unique to this context                                       |
| `SessionCard`                                   | **Keep in app**      | History list item tied to `LoggedEvent` union type                                                       |
| `ExerciseProgressCard`                          | **Keep in app**      | Progress analytics domain-specific                                                                       |
| `WeeklyBarChart`                                | **Keep in app**      | Simple inline SVG; too domain-specific to generalize                                                     |
| `ActivityStrip` (generic WeekRhythmStrip)       | **Defer**            | Could be generic but no other consumer yet; YAGNI                                                        |
| `LoggerShell`                                   | **Keep in app**      | Bottom-sheet pattern with specific header/footer; `Sheet` in ts-ui + app-level composition is sufficient |

## Textarea

### File layout

```text
libs/ts-ui/src/components/textarea/
├── textarea.tsx
├── textarea.test.tsx
├── textarea.steps.tsx
└── textarea.stories.tsx
```

### Implementation

Mirrors `Input` exactly — same Tailwind classes, same CVA-less approach, forwarded ref:

```tsx
// textarea.tsx
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2",
        "text-base shadow-xs transition-[color,box-shadow] outline-none",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-input/30",
        "resize-none", // app-default; overridable via className
        className,
      )}
      {...props}
    />
  );
}
```

Export: `export { Textarea }` from `src/index.ts`.

## Badge

### File layout

```text
libs/ts-ui/src/components/badge/
├── badge.tsx
├── badge.test.tsx
├── badge.steps.tsx
└── badge.stories.tsx
```

### Implementation

CVA with `variant` and `size` axes. Hue applied via inline CSS variable lookup
(`bg-[var(--hue-{hue})]` etc.) — same pattern as `Button` teal/sage variants.

```tsx
const badgeVariants = cva("inline-flex items-center font-bold uppercase tracking-wide rounded-full", {
  variants: {
    variant: {
      default: "bg-[var(--hue-color)] text-white",
      outline: "border border-[var(--hue-border)] bg-[var(--hue-wash)] text-[var(--hue-ink)]",
      secondary: "bg-secondary text-secondary-foreground",
      destructive: "bg-destructive text-white",
    },
    size: {
      sm: "text-[11px] px-2 py-0.5 gap-1",
      md: "text-[13px] px-2.5 py-1 gap-1.5",
    },
  },
  defaultVariants: { variant: "default", size: "sm" },
});

// hue prop maps to CSS variable names via inline style
function Badge({ hue, variant, size, className, ...props }) {
  const style = hue
    ? {
        "--hue-color": `var(--hue-${hue})`,
        "--hue-border": `var(--hue-${hue})`,
        "--hue-wash": `var(--hue-${hue}-wash)`,
        "--hue-ink": `var(--hue-${hue}-ink)`,
      }
    : {};
  return <span style={style} className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
```

`hue?: HueName` (re-uses `HueName` type already exported from `hue-picker`).

Export: `export { Badge, badgeVariants }` from `src/index.ts`.

## Landing Page Architecture

### Route

`/` → `apps/organiclever-web/src/app/page.tsx`

The landing page is a **Server Component** by default. The only client-side behaviour is:

1. `IntersectionObserver` scroll reveal — requires `'use client'` on the root component
2. `window.location.hash` navigation (CTA and footer link) — also requires client

Therefore `LandingPage` is `'use client'`. Sub-components that have no interactivity
(static content, principles table, features grid) are plain TSX rendered inside it — no
need to split into separate server/client boundaries for this static page.

### File layout

```text
apps/organiclever-web/src/
├── app/
│   └── page.tsx                    ← renders <LandingPage />
└── components/
    └── landing/
        ├── landing-page.tsx        ← 'use client'; root; IntersectionObserver
        ├── landing-nav.tsx
        ├── landing-hero.tsx
        ├── landing-features.tsx
        ├── landing-rhythm-demo.tsx ← static demo chart; pure JSX
        ├── landing-principles.tsx
        └── landing-footer.tsx
```

### CSS strategy

All landing-page styles are **Tailwind utility classes** (v4). The prototype's `l-*`
custom classes translate to `ol-*` named Tailwind equivalents or small `@layer components`
overrides in `globals.css`. Animations (`ol-drift`, `ol-float`, `ol-glow`, `ol-pulse`,
`ol-reveal`) are defined in `globals.css` as `@keyframes` and referenced via
`animate-*` utility classes via `@theme`.

Design tokens from `organiclever.css` (`--warm-*`, `--hue-*`, `--color-*`) are already
imported in `globals.css` — no extra imports needed.

**Accent span classes**: The H1 uses two helper classes for colored text spans:

```css
/* globals.css — @layer components */
.ac {
  color: var(--hue-teal-ink);
}
.ac2 {
  color: var(--hue-sage-ink);
}
```

These are defined in `@layer components` in `globals.css` as part of B.1 (or B.3). Used
as `<span class="ac">tracked.</span>` and `<span class="ac2">Analyzed.</span>` in the H1.

### Component prop contracts

```tsx
// landing-page.tsx
// No external props — all navigation handled internally via window.location.hash

// landing-nav.tsx
interface LandingNavProps {
  onGoApp: () => void;
}

// landing-hero.tsx
interface LandingHeroProps {
  onGoApp: () => void;
}

// landing-features.tsx — no props (static)

// landing-rhythm-demo.tsx — no props (static, hardcoded sample data)

// landing-principles.tsx — no props (static)

// landing-footer.tsx
interface LandingFooterProps {
  onGoApp: () => void;
}
```

### Animation implementation

```css
/* globals.css additions */
@keyframes ol-drift {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(30px, -40px) scale(1.05);
  }
}
@keyframes ol-glow {
  0%,
  100% {
    box-shadow: 0 0 0 0 oklch(52% 0.12 195 / 0.35);
  }
  50% {
    box-shadow: 0 0 0 12px oklch(52% 0.12 195 / 0);
  }
}
@keyframes ol-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
@keyframes ol-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
@keyframes ol-reveal {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

Tailwind v4 registers these via a `@theme` block:

```css
@theme {
  --animate-ol-drift: ol-drift 18s ease-in-out infinite alternate;
  --animate-ol-glow: ol-glow 3s infinite;
  --animate-ol-pulse: ol-pulse 3s infinite;
  --animate-ol-float: ol-float 4s ease-in-out infinite;
}
```

They are applied as `animate-ol-drift`, `animate-ol-glow`, etc. utility classes.

**Negative animation-delay note**: Orbs use staggered negative `animation-delay` values
(e.g., `animation-delay: -6s; -12s`). These are intentional — they start each orb at a
different point in the 18 s cycle, creating visual variety without JavaScript timing.

**Orb position**: The three orb `<div>`s use `position: fixed` so they remain visible in
the background throughout the entire page scroll (i.e., they stay anchored to the
viewport, not to the hero section). This is a deliberate design choice for a full-page
ambient background effect.

**`ol-reveal` implementation note**: `ol-reveal` is defined as a `@keyframes` block but
the scroll reveal behavior is implemented via `IntersectionObserver` + a `.visible` CSS
class transition (`opacity: 0 → 1; transform: translateY(24px) → none`), not via
`animate-ol-reveal` utility. The `@keyframes ol-reveal` exists in `globals.css` for
reference but does not need a `@theme` registration — the transition approach is used
instead.

**`ol-float` usage**: The logo mark in `<LandingNav>` receives `animate-ol-float` to
create a subtle floating animation on the teal icon mark.

### Rhythm demo chart

Pure React JSX — no chart library. Seven stacked flex columns; each column's segments
are `div`s with `flex: <minutes>` inside a `flex-col-reverse` container. Heights are
purely proportional via `flexbox` flex values — no pixel math needed.

**Hardcoded date note**: The week label "Sample · April 14–20" is intentionally static
and does not auto-compute from the current date. Future maintainers: this is a demo
visualization, not a live data display.

## Dependencies

The following packages and versions are required. All must already be present in
`libs/ts-ui/package.json` or `apps/organiclever-web/package.json` before plan execution.

| Package                                | Used by                     | Notes                                                                    |
| -------------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `cva` (class-variance-authority)       | `ts-ui` (Badge)             | Already used by Button; verify import                                    |
| `tailwindcss` v4                       | `ts-ui`, `organiclever-web` | Already configured                                                       |
| `@open-sharia-enterprise/ts-ui-tokens` | `organiclever-web`          | Token CSS vars (`--hue-*`, `--warm-*`) already imported in `globals.css` |
| `react`                                | `ts-ui`, `organiclever-web` | Already present                                                          |
| `next` 16                              | `organiclever-web`          | Already present                                                          |
| `@amiceli/vitest-cucumber`             | `ts-ui`, `organiclever-web` | Already used in existing tests                                           |
| `vitest`                               | `ts-ui`, `organiclever-web` | Already present                                                          |
| `@testing-library/react`               | `ts-ui`, `organiclever-web` | Already present                                                          |

No new dependencies are introduced. If any of the above are missing, install and verify
before starting Phase A.

## Rollback

All changes in this plan are additive or replacement with no database or migration
involvement.

**ts-ui rollback**: The `Textarea` and `Badge` additions are additive exports. Reverting
requires removing the new component files and the `export` lines from `src/index.ts`.
This is a single commit revert — no downstream breakage unless a consumer has already
imported the new components.

**Landing page rollback**: The landing page replaces `src/app/page.tsx` (formerly the
stub) with a `<LandingPage />` import, and adds files under
`src/components/landing/`. Reverting requires:

1. Restoring the original stub `page.tsx`
2. Deleting `src/components/landing/`
3. Reverting the `globals.css` animation additions

No database migrations, no environment variable changes, no infrastructure changes.

## Testing Strategy

### ts-ui components (Textarea, Badge)

- **Framework**: Vitest + `@amiceli/vitest-cucumber` (same as existing ts-ui tests)
- **Coverage threshold**: ≥ 70 % (enforced by `nx run ts-ui:test:quick`)
- **Step file location**: `libs/ts-ui/src/components/<name>/<name>.steps.tsx`
- **Test file location**: `libs/ts-ui/src/components/<name>/<name>.test.tsx`
- **Gherkin spec location**: `specs/apps/organiclever/fe/gherkin/<name>/` (or ts-ui's own
  spec dir if one exists)
- **Rendering**: `@testing-library/react` render; assertions via `screen` queries

### Landing page (organiclever-web)

- **Unit/integration**: Vitest + `@amiceli/vitest-cucumber`; step files at
  `apps/organiclever-web/test/unit/steps/landing/landing.steps.tsx`
- **Coverage threshold**: ≥ 70 % (enforced by `nx run organiclever-web:test:quick`)
- **Gherkin spec**: `specs/apps/organiclever/fe/gherkin/landing/landing.feature` (replace
  the existing stub-page feature)
- **E2E**: Playwright (`apps/organiclever-web-e2e`) for hero heading + CTA navigation
- **Manual assertion**: Playwright MCP for responsive layout verification (Phase C)
