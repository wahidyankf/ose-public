# Business Rationale

## Why

OrganicLever's first user-facing product (workout tracker, landing site) must look and
feel like a coherent brand. The Claude Design handoff bundle produced a production-quality
design system — `colors_and_type.css`, `Components.jsx`, `Icon.jsx` — that defines every
visual decision: OKLCH warm palette, 6 semantic hues, Nunito typography, rounded
touch-friendly geometry, CB-safe semantic roles, light + dark mode. Adopting it now
means every future OrganicLever feature starts from a finished design baseline rather
than deriving values ad hoc.

The current `ts-ui` components (Button, Card, Input, Alert, Dialog, Label) use neutral
HSL tokens and generic geometry. Once the OL tokens are in place and the missing
components added, `organiclever-fe` will render OL's brand exactly — and future app
screens can be built purely from `ts-ui` imports without reinventing visual primitives.

## Business Impact

### Pain Points

- `organiclever-fe` currently renders with neutral HSL tokens and generic geometry.
  Every new screen must hardcode OL brand values inline or approximate them, leading
  to inconsistency and rework as the design evolves.
- The existing `ts-ui` component set (Button, Card, Input, Alert, Dialog, Label) lacks
  the 10 OrganicLever-specific components (Icon, Toggle, ProgressRing, Sheet, AppHeader,
  StatCard, InfoTip, HuePicker, TabBar, SideNav) needed to build the workout tracker UI.
- Without a canonical OL token file, any future screen feature must rediscover design
  values from the Claude Design handoff bundle rather than importing a typed source.

### Expected Benefits

- A single `@import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css"` gives
  every future OrganicLever screen access to the complete OL warm OKLCH palette, radius
  scale, shadow scale, and dark mode — with no per-screen derivation work.
- Workout tracker screens (next plan) can be built entirely from `ts-ui` imports without
  any bespoke inline styles, reducing styling surface area and review cost.
- All new components ship with vitest-cucumber tests and Storybook stories — design review
  becomes a Storybook comparison rather than a code reading exercise.
- Other apps (`ayokoding-web`, `oseplatform-web`, `wahidyankf-web`) are unaffected because
  changes are additive: new file, new variants, new components — nothing removed or renamed.

## Affected Roles

- **Developer** — builds workout screens (next plan) against a complete, typed component
  library with consistent tokens. No bespoke inline styles needed.
- **Developer (as designer hat)** — wearing the designer hat, compares rendered Storybook
  with the Claude Design handoff to confirm pixel accuracy. Single-maintainer role.
- **Other apps** (`ayokoding-web`, `oseplatform-web`, `wahidyankf-web`) — unaffected.
  The shared `ts-ui-tokens/src/tokens.css` neutral baseline is not changed. New
  components are additive. Updated Button/Alert/Input variants are additive (new
  variants/sizes do not alter existing class names).

## Success Metrics

- `nx run ts-ui:test:quick` passes with coverage ≥ 70% after all new components added.
- `nx run ts-ui-tokens:typecheck` passes (no TypeScript errors in the token index).
- `nx build organiclever-fe` passes with zero type errors.
- OrganicLever brand tokens visible at `localhost:3200`: warm cream background,
  Nunito body font, JetBrains Mono for numerics, teal ring on focused inputs.
- Dark mode toggle (future app) sets `data-theme="dark"` on `<html>` and the palette
  shifts to the warm-dark scale.
- All new components accessible: `axe` reports zero violations in Storybook.

## Non-Goals

- **Workout app screens** — Home, Workout, Finish, EditRoutine, History, Progress,
  Settings are a separate follow-on plan. This plan delivers only the building blocks.
- **Data layer** (`db.ts`, `types.ts`) — separate plan.
- **New routes** in `organiclever-fe` — separate plan.
- **Changes to the landing page content** — separate plan.
- **`ts-ui-tokens` neutral baseline changes** — must not break other apps.
- **`ose-primer` propagation** — OL brand tokens are product-specific (`neither`);
  generic new ts-ui components can be propagated in a separate governance plan if needed.

## Business Risks

- **Token name collision with Tailwind builtins** — `--radius-sm`, `--shadow-sm` exist
  in both Tailwind defaults and the design system. Mitigation: use Tailwind v4 `@theme`
  override in `organiclever.css` so Tailwind utilities pick up the correct values; the
  non-Tailwind hue/warm vars (e.g. `--hue-teal`) have no collision risk.
- **Dark mode variant mismatch** — `ts-ui-tokens` defines dark mode via `.dark` class;
  the OL design uses `[data-theme="dark"]`. Mitigation: update `@custom-variant dark` in
  `ts-ui-tokens` to match both selectors — backward-compatible for all apps.
- **ts-ui coverage regression** — 10 new components must have tests or the 70% threshold
  fails. Mitigation: every new component ships with a unit test in the same commit.
