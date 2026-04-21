# Technical Documentation

## Repository Changes Overview

```
libs/
├── ts-ui-tokens/
│   └── src/
│       ├── tokens.css            ← CHANGE: update @custom-variant dark selector
│       └── organiclever.css      ← NEW: full OL warm OKLCH token system
└── ts-ui/
    └── src/
        ├── index.ts              ← CHANGE: export 10 new components + types
        └── components/
            ├── button/
            │   ├── button.tsx          ← CHANGE: add teal/sage variants, xl size
            │   ├── button.test.tsx     ← CHANGE: cover new variants/sizes
            │   ├── button.steps.tsx    ← CHANGE: add steps for new variants
            │   └── button.stories.tsx  ← CHANGE: add teal/sage/xl stories
            ├── alert/
            │   ├── alert.tsx           ← CHANGE: add success/warning/info variants
            │   ├── alert.test.tsx      ← CHANGE: cover new variants
            │   ├── alert.steps.tsx     ← CHANGE: add steps for new variants
            │   └── alert.stories.tsx   ← CHANGE: add semantic variant stories
            ├── input/
            │   ├── input.tsx           ← CHANGE: h-9 → h-11 (44 px)
            │   ├── input.test.tsx      ← CHANGE: assert h-11 class
            │   ├── input.steps.tsx     ← CHANGE: update height scenario
            │   └── input.stories.tsx   ← minor update
            ├── icon/             ← NEW (4 files: .tsx .test.tsx .steps.tsx .stories.tsx)
            ├── toggle/           ← NEW (4 files)
            ├── progress-ring/    ← NEW (4 files)
            ├── sheet/            ← NEW (4 files)
            ├── app-header/       ← NEW (4 files)
            ├── stat-card/        ← NEW (4 files)
            ├── info-tip/         ← NEW (4 files)
            ├── hue-picker/       ← NEW (4 files)
            ├── tab-bar/          ← NEW (4 files)
            └── side-nav/         ← NEW (4 files)

specs/libs/ts-ui/gherkin/
    ├── button/button.feature     ← CHANGE: add scenarios for teal/sage/xl
    ├── alert/alert.feature       ← CHANGE: add scenarios for success/warning/info
    ├── input/input.feature       ← CHANGE: update height scenario
    ├── icon/icon.feature         ← NEW
    ├── toggle/toggle.feature     ← NEW
    ├── progress-ring/progress-ring.feature  ← NEW
    ├── sheet/sheet.feature       ← NEW
    ├── app-header/app-header.feature  ← NEW
    ├── stat-card/stat-card.feature  ← NEW
    ├── info-tip/info-tip.feature ← NEW
    ├── hue-picker/hue-picker.feature  ← NEW
    ├── tab-bar/tab-bar.feature   ← NEW
    └── side-nav/side-nav.feature ← NEW

apps/organiclever-fe/src/app/
    ├── layout.tsx                ← CHANGE: add Nunito + JetBrains Mono
    └── globals.css               ← CHANGE: import organiclever.css + @theme font vars

libs/ts-ui/.storybook/
    └── preview.ts                ← CHANGE: also import organiclever.css

Documentation files (pre-written, verify accuracy during Phase 16.5):
    apps/organiclever-fe/README.md                           ← CHANGE: add Design System section
    libs/ts-ui/README.md                                     ← CHANGE: add OL component catalog
    libs/ts-ui-tokens/README.md                              ← CHANGE: add per-app brand files section
    governance/development/frontend/design-tokens.md         ← CHANGE: add OKLCH section, update dark variant
    .claude/skills/apps-organiclever-fe-developing-content/SKILL.md  ← CHANGE: add Design System section
```

> **Note on test artifacts per component**: Every ts-ui component needs four files:
> `{name}.tsx` (implementation), `{name}.test.tsx` (unit tests), `{name}.steps.tsx`
> (BDD Gherkin steps), `{name}.stories.tsx` (Storybook). The `.steps.tsx` file calls
> `loadFeature(path.resolve(..., "specs/libs/ts-ui/gherkin/{name}/{name}.feature"))` —
> the feature file MUST exist or `vitest run` will fail with "feature file not found".

---

## Dependencies

All required packages are already present in their respective `package.json` files. No
new dependencies need to be installed.

| Package                    | Where used                       | Already present in                                              |
| -------------------------- | -------------------------------- | --------------------------------------------------------------- |
| `radix-ui`                 | Sheet (Dialog primitive)         | `libs/ts-ui/package.json` (already used by dialog.tsx)          |
| `next/font/google`         | organiclever-fe layout.tsx       | `apps/organiclever-fe/package.json` (Next.js built-in)          |
| `@amiceli/vitest-cucumber` | All `.steps.tsx` files           | `libs/ts-ui/package.json` (already used by existing step files) |
| `class-variance-authority` | button.tsx, alert.tsx extensions | `libs/ts-ui/package.json` (already used)                        |
| `tailwind-merge` + `clsx`  | All components via `cn()`        | `libs/ts-ui/package.json` (already used)                        |

No `npm install` step is required for this plan beyond the standard `npm install` +
`npm run doctor -- --fix` in Prerequisites.

---

## Phase 1: `libs/ts-ui-tokens`

### 1A — Dark mode variant fix (`tokens.css`)

Current:

```css
@custom-variant dark (&:is(.dark *));
```

Replace with:

```css
@custom-variant dark (&:is([data-theme="dark"] *), &:is(.dark *));
```

Rationale: OL app sets `document.documentElement.setAttribute('data-theme','dark')`.
The `.dark` class path stays for backward compat with all other apps and Storybook
(which uses `withThemeByClassName({ dark: 'dark' })`). Adding the data-attribute
selector is purely additive — no existing app is broken.

### 1B — New file: `organiclever.css`

Canonical source: `organic-lever/project/workout-app/colors_and_type.css`.

> **Do NOT include** the `@import url("https://fonts.googleapis.com/...")` line from
> the prototype source. Fonts are loaded via `next/font/google` in `layout.tsx` which
> self-hosts them and avoids layout shift. The CDN import would double-load fonts.

Structure:

```css
/* NO @import url(google fonts) — fonts are loaded via next/font/google */

/* ── OL reference palette (raw vars, referenced by @theme and dark block) ─ */
:root {
  /* 6 semantic hues */
  --hue-terracotta: oklch(68% 0.13 35);
  --hue-honey: oklch(78% 0.13 80);
  --hue-sage: oklch(72% 0.1 145);
  --hue-teal: oklch(68% 0.1 195);
  --hue-sky: oklch(70% 0.1 235);
  --hue-plum: oklch(62% 0.11 310);

  /* ink — for text on wash backgrounds */
  --hue-terracotta-ink: oklch(42% 0.11 35);
  --hue-honey-ink: oklch(45% 0.1 75);
  --hue-sage-ink: oklch(38% 0.09 145);
  --hue-teal-ink: oklch(38% 0.09 195);
  --hue-sky-ink: oklch(40% 0.1 235);
  --hue-plum-ink: oklch(38% 0.1 310);

  /* wash — tinted backgrounds, chips, tags */
  --hue-terracotta-wash: oklch(95% 0.03 35);
  --hue-honey-wash: oklch(96% 0.04 80);
  --hue-sage-wash: oklch(95% 0.03 145);
  --hue-teal-wash: oklch(95% 0.03 195);
  --hue-sky-wash: oklch(95% 0.03 235);
  --hue-plum-wash: oklch(95% 0.03 310);

  /* warm neutral scale */
  --warm-0: oklch(99% 0.005 80);
  --warm-50: oklch(97% 0.008 80);
  --warm-100: oklch(94% 0.01 80);
  --warm-200: oklch(88% 0.012 80);
  --warm-300: oklch(78% 0.014 80);
  --warm-400: oklch(62% 0.015 80);
  --warm-500: oklch(48% 0.017 80);
  --warm-700: oklch(32% 0.018 70);
  --warm-800: oklch(24% 0.018 60);
  --warm-900: oklch(18% 0.018 60);
}

/* ── Tailwind @theme overrides (organiclever-specific, overrides tokens.css defaults) ─ */
@theme {
  /* Semantic color tokens */
  --color-background: var(--warm-0);
  --color-foreground: var(--warm-900);
  --color-card: #ffffff;
  --color-card-foreground: var(--warm-900);
  --color-popover: #ffffff;
  --color-popover-foreground: var(--warm-900);
  --color-primary: var(--hue-sage);
  --color-primary-foreground: #ffffff;
  --color-secondary: var(--warm-100);
  --color-secondary-foreground: var(--warm-900);
  --color-muted: var(--warm-100);
  --color-muted-foreground: var(--warm-500);
  --color-accent: var(--hue-honey-wash);
  --color-accent-foreground: var(--hue-honey-ink);
  --color-destructive: var(--hue-terracotta);
  --color-destructive-foreground: #ffffff;
  --color-border: var(--warm-200);
  --color-input: var(--warm-200);
  --color-ring: var(--hue-teal);

  /* OL radius scale */
  --radius: 0.75rem; /* 12 px — base */
  --radius-sm: 0.5rem; /* 8 px  */
  --radius-md: 0.75rem; /* 12 px */
  --radius-lg: 1rem; /* 16 px */
  --radius-xl: 1.25rem; /* 20 px */
  --radius-2xl: 1.75rem; /* 28 px */
  --radius-3xl: 1.75rem; /* 28 px (same as 2xl — OL has no larger step) */

  /* Warm-tinted shadow scale */
  --shadow-xs: 0 1px 2px 0 oklch(20% 0.02 60 / 0.06);
  --shadow-sm: 0 1px 3px 0 oklch(20% 0.02 60 / 0.08), 0 1px 2px -1px oklch(20% 0.02 60 / 0.06);
  --shadow-md: 0 4px 8px -2px oklch(20% 0.02 60 / 0.08), 0 2px 4px -2px oklch(20% 0.02 60 / 0.06);
  --shadow-lg: 0 12px 24px -6px oklch(20% 0.02 60 / 0.12), 0 4px 8px -4px oklch(20% 0.02 60 / 0.08);
}

/* ── Dark mode overrides ─────────────────────────────────────────────────── */
/* Matches both OL pattern (data-theme attr) and Storybook/Tailwind (.dark class) */
[data-theme="dark"],
.dark {
  /* Warm neutral scale — dark inverted */
  --warm-0: oklch(20% 0.012 60);
  --warm-50: oklch(23% 0.014 60);
  --warm-100: oklch(27% 0.016 60);
  --warm-200: oklch(33% 0.018 60);
  --warm-300: oklch(42% 0.018 60);
  --warm-400: oklch(58% 0.016 60);
  --warm-500: oklch(70% 0.014 70);
  --warm-700: oklch(82% 0.014 80);
  --warm-800: oklch(90% 0.012 80);
  --warm-900: oklch(96% 0.01 80);

  /* Hue wash — darker in dark mode */
  --hue-terracotta-wash: oklch(36% 0.07 35);
  --hue-honey-wash: oklch(36% 0.07 80);
  --hue-sage-wash: oklch(34% 0.06 145);
  --hue-teal-wash: oklch(34% 0.06 195);
  --hue-sky-wash: oklch(34% 0.06 235);
  --hue-plum-wash: oklch(36% 0.07 310);

  /* Hue base — slightly brighter in dark mode */
  --hue-terracotta: oklch(72% 0.15 35);
  --hue-honey: oklch(82% 0.15 80);
  --hue-sage: oklch(75% 0.12 145);
  --hue-teal: oklch(72% 0.12 195);
  --hue-sky: oklch(74% 0.12 235);
  --hue-plum: oklch(68% 0.13 310);

  /* Hue ink — bright on dark wash backgrounds */
  --hue-terracotta-ink: oklch(88% 0.13 35);
  --hue-honey-ink: oklch(90% 0.13 80);
  --hue-sage-ink: oklch(86% 0.11 145);
  --hue-teal-ink: oklch(86% 0.11 195);
  --hue-sky-ink: oklch(86% 0.11 235);
  --hue-plum-ink: oklch(84% 0.12 310);

  /* Semantic tokens that cannot auto-resolve (hardcoded in @theme) */
  --color-card: var(--warm-50); /* was #ffffff — must override in dark */
  --color-popover: var(--warm-50); /* was #ffffff — must override in dark */
}
```

> **Why `--color-card` and `--color-popover` need explicit dark overrides**: These are
> hardcoded `#ffffff` in the `@theme` block (not a `var()` reference). CSS cannot auto-
> derive dark values for literal hex colors. All other semantic tokens reference
> `--warm-*` or `--hue-*` vars which are updated in the dark block automatically.
>
> **Why separate file, not merged into `tokens.css`**: `tokens.css` is imported by all
> apps. Merging the warm OKLCH values would replace neutral defaults globally, breaking
> `ayokoding-web`, `oseplatform-web`, `wahidyankf-web`. A separate `organiclever.css`
> gives `organiclever-fe` opt-in override without affecting siblings.

---

## Phase 2: `apps/organiclever-fe`

### 2A — `layout.tsx`

```tsx
import { Nunito, JetBrains_Mono } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

// Apply both CSS variable names to <html>:
// <html className={`${nunito.variable} ${jetbrainsMono.variable}`}>
```

### 2B — `globals.css`

```css
@import "tailwindcss";
@source "../../../../libs/ts-ui/src/**/*.{ts,tsx}";
@import "@open-sharia-enterprise/ts-ui-tokens/src/tokens.css";
@import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css"; /* ← new */

/* Map next/font CSS variable names into Tailwind @theme font families */
@theme {
  --font-sans: var(--font-nunito), ui-rounded, system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background font-sans text-foreground;
  }
}
```

### 2C — `libs/ts-ui/.storybook/preview.ts`

Add `organiclever.css` import so Storybook stories render with the OL warm palette:

```ts
import "@open-sharia-enterprise/ts-ui-tokens/src/tokens.css";
import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css"; /* ← add */
import "./storybook.css";
```

The existing `withThemeByClassName({ dark: 'dark' })` decorator continues to work because
the updated `@custom-variant dark` now matches BOTH `.dark` class and `[data-theme="dark"]`.

---

## Phase 3: `libs/ts-ui` — Updated Existing Components

### 3A — `button.tsx`

Add to `buttonVariants` CVA **without** adding a `focus-visible:ring-*` override
(the base buttonVariants class already includes `focus-visible:ring-ring/50`):

```ts
variants: {
  variant: {
    // existing variants unchanged...
    teal: "bg-[var(--hue-teal)] text-white hover:bg-[var(--hue-teal)]/90",
    sage: "bg-[var(--hue-sage)] text-white hover:bg-[var(--hue-sage)]/90",
  },
  size: {
    // existing sizes unchanged...
    xl: "h-[60px] rounded-2xl px-7 text-lg has-[>svg]:px-5",
  },
},
```

> `px-7` = 28 px per side (matching OL design `padding: '0 28px'`). No `focus-visible`
> override needed — the base class handles it via `--color-ring` which is already teal.

Update `specs/libs/ts-ui/gherkin/button/button.feature`: add scenarios for teal variant,
sage variant, xl size.

Update `button.steps.tsx`: add Given/Then handlers for new scenarios.

### 3B — `alert.tsx`

Add to `alertVariants` CVA:

```ts
variants: {
  variant: {
    // existing...
    success: "bg-[var(--hue-sage-wash)] text-[var(--hue-sage-ink)] border-[var(--hue-sage)] *:data-[slot=alert-description]:text-[var(--hue-sage-ink)]/80",
    warning: "bg-[var(--hue-honey-wash)] text-[var(--hue-honey-ink)] border-[var(--hue-honey)] *:data-[slot=alert-description]:text-[var(--hue-honey-ink)]/80",
    info:    "bg-[var(--hue-sky-wash)] text-[var(--hue-sky-ink)] border-[var(--hue-sky)] *:data-[slot=alert-description]:text-[var(--hue-sky-ink)]/80",
  },
},
```

Update `specs/libs/ts-ui/gherkin/alert/alert.feature`: add scenarios for success/warning/info.
Update `alert.steps.tsx`: add steps for new scenarios.

### 3C — `input.tsx`

Change `h-9` → `h-11` in the className string (36 px → 44 px OL touch target).

Update `specs/libs/ts-ui/gherkin/input/input.feature`: update height scenario to assert `h-11`.
Update `input.steps.tsx`: update step matching `h-9` → `h-11`.

---

## Phase 4: `libs/ts-ui` — New Components

Each new component requires **four files**:

1. `{name}.tsx` — implementation
2. `{name}.test.tsx` — vitest unit tests
3. `{name}.steps.tsx` — vitest-cucumber BDD steps (loads `.feature` from `specs/`)
4. `{name}.stories.tsx` — Storybook stories

Plus one file in `specs/`: 5. `specs/libs/ts-ui/gherkin/{name}/{name}.feature` — Gherkin acceptance spec

### 4A — `icon/icon.tsx`

Direct TypeScript port of `Icon.jsx`. No `"use client"` needed (pure SVG, no hooks).

```tsx
export type IconName =
  | "dumbbell"
  | "check"
  | "check-circle"
  | "clock"
  | "timer"
  | "flame"
  | "trend"
  | "bar-chart"
  | "plus"
  | "plus-circle"
  | "minus"
  | "x"
  | "x-circle"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "chevron-right"
  | "chevron-down"
  | "chevron-up"
  | "home"
  | "history"
  | "calendar"
  | "settings"
  | "user"
  | "pencil"
  | "trash"
  | "grip"
  | "play"
  | "zap"
  | "moon"
  | "sun"
  | "rotate-ccw"
  | "more-vertical"
  | "info"
  | "save";

export interface IconProps {
  name: IconName | (string & {});
  size?: number;
  filled?: boolean;
  className?: string;
  "aria-label"?: string;
}
```

All 34 icons from the `Icon.jsx` switch statement ported verbatim. Unknown name renders
fallback `<circle cx="12" cy="12" r="8"/>`. All SVGs: `aria-hidden="true"` by default;
when `aria-label` is provided, set `role="img"` and remove `aria-hidden`.

### 4B — `toggle/toggle.tsx`

`"use client"` (uses `React.useState` if uncontrolled, or caller manages state via props).

```tsx
export interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}
```

`<button role="switch" aria-checked={value} disabled={disabled}>`. Thumb position via
**conditional className** based on the `value` prop — NOT `data-[checked=true]`:

```tsx
<span
  className={cn(
    "absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-xs transition-[left] duration-200",
    value ? "left-[23px]" : "left-[3px]",
  )}
/>
```

Track background: `value ? "bg-[var(--hue-teal)]" : "bg-[var(--warm-200)]"` via
conditional class on the button.

Wrap row in `<div>` with `flex justify-between items-center gap-3` when `label` set.

### 4C — `progress-ring/progress-ring.tsx`

No `"use client"` needed (pure SVG computation, no hooks).

```tsx
export interface ProgressRingProps {
  size?: number; // default 80
  stroke?: number; // default 6
  progress: number; // 0–1
  color?: string; // default "var(--hue-teal)"
  bg?: string; // default "var(--warm-100)"
}
```

```tsx
<svg
  width={size} height={size}
  style={{ transform: 'rotate(-90deg)' }}
  role="progressbar"
  aria-valuenow={Math.round(progress * 100)}
  aria-valuemin={0}
  aria-valuemax={100}
>
  <circle ... stroke={bg} />       {/* track */}
  <circle ... stroke={color}        {/* arc */}
    strokeDasharray={circ}
    strokeDashoffset={circ * (1 - progress)}
    style={{ transition: 'stroke-dashoffset 1s linear, stroke 300ms' }}
  />
</svg>
```

### 4D — `sheet/sheet.tsx`

`"use client"` required (event handlers, Radix Dialog primitive).

Use `radix-ui`'s `Dialog` primitive for focus-trap, Escape-key, and `aria-modal`.
Match the pattern already used in `dialog.tsx`:

```tsx
import { Dialog as DialogPrimitive } from "radix-ui";

// Overlay: semi-transparent scrim (click closes)
// Content: bottom-anchored panel, max-w-[480px], rounded-t-3xl
// Slide-up: data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom
//           data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom
```

No `showCloseButton` prop — always show the ✕ close button (per OL design).
`aria-label={title}` on `DialogPrimitive.Content` when title is set.

### 4E — `app-header/app-header.tsx`

No `"use client"` — all behaviour is driven by props with no local state.

```tsx
export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}
```

Back button: `w-10 h-10 rounded-xl bg-secondary flex items-center justify-center`.
Only rendered when `onBack` is set. `aria-label="Go back"`.
Title: `font-extrabold text-xl tracking-tight truncate flex-1 min-w-0`.
Subtitle: `text-xs text-muted-foreground mt-0.5`.
Trailing: `flex-shrink-0`.

### 4F — `stat-card/stat-card.tsx`

No `"use client"` needed (InfoTip has its own client state).

> **HueName** — imported from `../hue-picker/hue-picker`, not redefined here.

```tsx
import type { HueName } from "../hue-picker/hue-picker";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  hue: HueName;
  icon: string;
  info?: string;
}
```

**Icon box color is dynamic** — use inline style, NOT a constructed Tailwind class:

```tsx
<div
  style={{ backgroundColor: `var(--hue-${hue})` }}
  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white"
>
  <Icon name={icon as IconName} size={20} />
</div>
```

Card: `rounded-[20px] border bg-card shadow-sm min-h-[96px] p-3.5 flex flex-col gap-2`.
Value: `font-mono font-extrabold text-2xl tracking-tight leading-none`.
Unit: inline `<span className="font-sans text-[13px] font-bold text-muted-foreground ml-1">`.

### 4G — `info-tip/info-tip.tsx`

`"use client"` required (manages `open` state).

```tsx
export interface InfoTipProps {
  title: string;
  text: string;
}
```

Trigger: 20 px circle `bg-secondary text-muted-foreground rounded-full inline-flex
items-center justify-center`. Hover: `hover:bg-[var(--hue-sky-wash)]`.
`aria-label={title}`.

Open state: `const [open, setOpen] = React.useState(false)`. Click sets `open=true`.
When open, renders `<Sheet title={title} onClose={() => setOpen(false)}>`.
Sheet body: `<p>{text}</p>` + `<Button variant="outline" onClick={() => setOpen(false)}>Got it</Button>`.

### 4H — `hue-picker/hue-picker.tsx`

`"use client"` required (onChange event handlers; no local state in this component but
event handlers require client context in Next.js App Router).

```tsx
export const HUES = ["terracotta", "honey", "sage", "teal", "sky", "plum"] as const;
export type HueName = (typeof HUES)[number]; /* ← single source of truth */

export interface HuePickerProps {
  value: HueName;
  onChange: (hue: HueName) => void;
}
```

Each swatch: 32 px `rounded-[10px]`. **Background via inline style** (not constructed
Tailwind class):

```tsx
<button
  key={hue}
  onClick={() => onChange(hue)}
  aria-label={hue}
  aria-pressed={value === hue}
  style={{ backgroundColor: `var(--hue-${hue})` }}
  className={cn(
    "h-8 w-8 cursor-pointer rounded-[10px] transition-all",
    value === hue && "outline outline-[3px] outline-offset-2 outline-[var(--color-foreground)]",
  )}
/>
```

### 4I — `tab-bar/tab-bar.tsx`

`"use client"` — TabBar has an `onChange` event handler prop. Consistent with Toggle and
HuePicker: all `libs/ts-ui` components with event handler props include `"use client"` so
they are safe to import directly in Next.js App Router server component trees without
requiring the caller to add its own `"use client"` boundary.

```tsx
export interface TabItem {
  id: string;
  label: string;
  icon: string;
}

export interface TabBarProps {
  tabs: TabItem[];
  current: string;
  onChange: (id: string) => void;
}
```

`role="tablist"`, each button `role="tab" aria-selected={current===tab.id}`.
Height: `h-[60px] border-t bg-card flex flex-row`.
Safe-area: `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}`.
Active: `text-[var(--hue-teal)] font-bold`. Inactive: `text-muted-foreground font-medium`.
Each tab: `flex-1 min-h-[48px] flex flex-col items-center justify-center gap-[3px]`.
Label: `text-[10px]`.

### 4J — `side-nav/side-nav.tsx`

`"use client"` — onChange prop requires client context (consistent with §4I TabBar and
§4B Toggle rationale: all `libs/ts-ui` components with event handler props include
`"use client"` so they are safe to import directly in Next.js App Router server component
trees without requiring the caller to add its own `"use client"` boundary).

```tsx
import type { HueName } from "../hue-picker/hue-picker";
import type { TabItem } from "../tab-bar/tab-bar";

export interface SideNavBrand {
  name: string;
  icon: string;
  hue: HueName;
}

export interface SideNavProps {
  brand: SideNavBrand;
  tabs: TabItem[];
  current: string;
  onChange: (id: string) => void;
}
```

`w-[220px] border-r bg-card flex flex-col p-5 gap-0.5`.
Brand row: 32 px icon box with inline style (dynamic hue — NOT a constructed Tailwind
class):

```tsx
style={{ backgroundColor: `var(--hue-${brand.hue})` }}
```

Brand name text follows. Click calls `onChange('home')` — NOT
"navigate to first tab" (the home tab is always the OrganicLever entry point, regardless
of tab order).
Active tab: `bg-[var(--hue-teal-wash)] text-[var(--hue-teal-ink)] rounded-xl font-bold`.
Inactive: `transparent bg, text-foreground, font-medium`.
`role="navigation"`, `aria-label={brand.name}`.

---

## Phase 5: `libs/ts-ui` — Exports + Coverage

### `index.ts` additions

```ts
export { Icon } from "./components/icon/icon";
export type { IconName, IconProps } from "./components/icon/icon";
export { Toggle } from "./components/toggle/toggle";
export type { ToggleProps } from "./components/toggle/toggle";
export { ProgressRing } from "./components/progress-ring/progress-ring";
export type { ProgressRingProps } from "./components/progress-ring/progress-ring";
export { Sheet } from "./components/sheet/sheet";
export type { SheetProps } from "./components/sheet/sheet";
export { AppHeader } from "./components/app-header/app-header";
export type { AppHeaderProps } from "./components/app-header/app-header";
export { StatCard } from "./components/stat-card/stat-card";
export type { StatCardProps } from "./components/stat-card/stat-card";
export { InfoTip } from "./components/info-tip/info-tip";
export type { InfoTipProps } from "./components/info-tip/info-tip";
export { HuePicker, HUES } from "./components/hue-picker/hue-picker";
export type { HueName, HuePickerProps } from "./components/hue-picker/hue-picker";
export { TabBar } from "./components/tab-bar/tab-bar";
export type { TabItem, TabBarProps } from "./components/tab-bar/tab-bar";
export { SideNav } from "./components/side-nav/side-nav";
export type { SideNavBrand, SideNavProps } from "./components/side-nav/side-nav";
```

### Coverage requirement

Threshold: 70% LCOV (enforced by `rhino-cli test-coverage validate` in `test:quick`).
All new components must have `.test.tsx` tests. Both `.test.tsx` and `.steps.tsx` run
in `vitest run` and contribute to coverage.

---

## Component Storybook Category Map

| Category                  | Components                  |
| ------------------------- | --------------------------- |
| `Foundation/Icon`         | Icon                        |
| `Foundation/ProgressRing` | ProgressRing                |
| `Foundation/HuePicker`    | HuePicker                   |
| `Input/Toggle`            | Toggle                      |
| `Input/Button` (update)   | Button + new variants/sizes |
| `Input/Input` (update)    | Input                       |
| `Feedback/Alert` (update) | Alert + new variants        |
| `Feedback/Sheet`          | Sheet                       |
| `Display/StatCard`        | StatCard                    |
| `Display/InfoTip`         | InfoTip                     |
| `Navigation/AppHeader`    | AppHeader                   |
| `Navigation/TabBar`       | TabBar                      |
| `Navigation/SideNav`      | SideNav                     |

---

## Documentation Updates

The following documentation files are pre-written (target state) as part of this plan.
During Phase 16.5 execution, verify each section against the actual implementation and
correct any divergence before committing.

### `apps/organiclever-fe/README.md` — Design System section

Target content:

- Palette table: 6 hues × role (terracotta/honey/sage/teal/sky/plum)
- Warm neutral scale description (`--warm-0` through `--warm-900`)
- Typography table: Nunito (body) and JetBrains Mono (numeric)
- Dark mode: both `data-theme="dark"` attribute AND `.dark` class
- Token import CSS snippet showing 4-line `globals.css` import chain
- Opt-in note: other apps do NOT import `organiclever.css`
- Component catalog table: 13 OL additions (3 updated + 10 new)

### `libs/ts-ui/README.md` — Component catalog

Target content:

- Updated `Base components` table showing OL additions to Button/Alert/Input
- New `OrganicLever components` table listing all 10 new components with props
- Note that `organiclever.css` must be imported to activate warm tokens

### `libs/ts-ui-tokens/README.md` — Per-App Brand Token Files

Target content:

- `## Per-App Brand Token Files` section before `## Customization Layers`
- `organiclever.css` entry: 6 hues × 3 tints, warm neutral scale, semantic overrides,
  radius scale, shadows, dark mode block
- Correct 2-line import snippet (tokens.css then organiclever.css)
- Explicit opt-in statement: sibling apps not affected
- Updated Customization Layers (5 layers, now including brand token file as layer 2)

### `governance/development/frontend/design-tokens.md` — OKLCH section

Target content:

- `## OKLCH Brand Tokens (OrganicLever)` section with:
  - Why OKLCH (perceptual uniformity, wide-gamut, handoff fidelity)
  - OL token structure (hue × tint pattern, warm neutral scale, semantic overrides)
  - Dark mode block pattern (explicit `--color-card`/`--color-popover` overrides)
  - OKLCH naming convention (base/ink/wash semantics)
  - Dynamic hue background rule (inline style, not Tailwind template literal)
- Updated `@custom-variant dark` example using compound selector
  `(&:is([data-theme="dark"] *), &:is(.dark *))` with explanation of both activation methods

### `.claude/skills/apps-organiclever-fe-developing-content/SKILL.md` — Design System section

Target content:

- `## Design System` section before `## Component Architecture`
- Token import chain (4-line globals.css snippet)
- Font loading explanation (next/font/google → CSS variable → @theme)
- Dark mode activation (JavaScript attribute + Tailwind class, both supported)
- Key token reference (hue vars, warm scale, semantic aliases)
- ts-ui component usage examples (brand variants, OL-specific components)
- Dynamic hue inline style rule

## Testing Strategy

All `libs/ts-ui` components follow the four-file BDD testing pattern:

1. **`{name}.feature`** — Gherkin scenarios in `specs/libs/ts-ui/gherkin/{name}/`
2. **`{name}.steps.tsx`** — `@amiceli/vitest-cucumber` step definitions that load the
   feature file via `loadFeature(path.resolve(..., "specs/libs/ts-ui/gherkin/{name}/{name}.feature"))`
3. **`{name}.test.tsx`** — vitest unit tests (render, interaction, accessibility via axe)
4. **`{name}.stories.tsx`** — Storybook stories for visual verification

Both `.test.tsx` and `.steps.tsx` run as part of `vitest run` in `nx run ts-ui:test:quick`
and contribute to the coverage measurement.

**Coverage gate**: ≥ 70% LCOV, enforced by `rhino-cli test-coverage validate` inside
`test:quick`. Every new component must ship with tests before Phase 16 runs.

**Note**: The feature file MUST exist before `vitest run` executes — `loadFeature` throws
at import time if the file is not found. Create the `.feature` file in the same delivery
step as the `.steps.tsx` file.

---

## Rollback

- **Token file only**: Remove `@import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css"`
  from `apps/organiclever-fe/src/app/globals.css` — immediate revert, zero other files
  affected.
- **Font wiring**: Remove Nunito and JetBrains Mono imports from `layout.tsx` and the
  `@theme` font-family overrides from `globals.css`.
- **Component additions**: All new components and new variants are additive. No existing
  story, test, or component API is changed in a breaking way. Removing the exports from
  `libs/ts-ui/src/index.ts` reverts component availability without side effects.
- **Input h-11 change**: The only potentially breaking change. If height regression
  occurs in any `organiclever-fe` layout, revert `h-11` → `h-9` and add a size prop
  instead.
- **Dark variant selector**: The `@custom-variant dark` change is additive (adds a
  comma-separated selector). Reverting to `(&:is(.dark *))` alone is safe for all
  existing apps.
