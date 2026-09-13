# Plan: Resizable Docs Sidebar (ayokoding-www)

Make the docs sidebar in `ayokoding-www` **user-resizable** (drag + keyboard), with the resizing
mechanism extracted into a **new reusable `libs/web-ui` primitive** (`resizable-panel`). The chosen
width **persists across sessions** via `localStorage`, is constrained to a **relative 15%–35% of the
viewport**, and the sidebar's nav content **scrolls horizontally** when a label/tree is wider than
the current width. The mobile `Sheet` drawer gains **fixed preset widths**.

## Context

The docs content layout at
`apps/ayokoding-www/src/app/[locale]/(content)/layout.tsx:13` [Repo-grounded] renders a **fixed**
`w-[250px]` `<aside>` that is `hidden` below the `md` breakpoint. Readers cannot widen it to see
long, deeply-nested navigation labels, nor narrow it to reclaim reading space. This plan makes that
side rail adjustable and, in doing so, seeds a general-purpose resizable primitive the other `-www`
and `-app-web` apps can reuse later.

## Scope

**In scope**:

- New `libs/web-ui` primitive `resizable-panel` (Radix composition + CVA + `cn`), with unit tests,
  a Storybook story, and companion `specs/libs/web-ui` Gherkin. [Repo-grounded]
- `ayokoding-www` consumes the primitive for its desktop/tablet (`≥ md`) content-layout `<aside>`.
- Drag-handle **and** keyboard-accessible resize (`role="separator"`, `aria-orientation="vertical"`,
  arrow-key resize when focused). WCAG AA operable.
- Width persistence via `localStorage` (key `ayokoding-sidebar-width`), matching the existing raw
  `localStorage` precedent in `libs/web-ui/src/components/theme-toggle/theme-toggle.tsx`. [Repo-grounded]
- Relative min/max width: **15%–35% of viewport width**.
- **Horizontal scroll** of the sidebar nav content when it overflows the current width.
- Mobile `Sheet` drawer (`apps/ayokoding-www/src/features/app-shell/shell/mobile-nav.tsx`) gains a
  couple of **fixed preset widths**. [Repo-grounded]
- Companion `specs/` Gherkin for both the `web-ui` primitive and the `ayokoding-www` behavior
  (per Feature Change Completeness — both paths).

**Out of scope**:

- Redesigning the sidebar tree/nav visual style or content model.
- Resizing any other app's sidebars in this plan (the primitive enables it; no other app is wired).
- Server-side (cookie/SSR) width so the initial render is width-correct with no flash — explicitly
  deferred (see `brd.md` Non-Goals); `localStorage` accepts a first-paint at the default width.
- A full multi-panel split-view group (à la IDE panes); the primitive targets a single collapsible
  side rail, not an N-pane group.

**Affected projects**: `web-ui` (lib), `ayokoding-www` (app), `ayokoding-www-fe-e2e` (E2E),
`specs/libs/web-ui`, `specs/apps/ayokoding`.

## Approach Summary

A functional-core / imperative-shell split (repo convention for web apps and libs):

- **Core** — a pure width-model module (clamp to `[minPct, maxPct]` of a given viewport width,
  serialize/parse the persisted value) with exhaustive unit tests. No DOM.
- **Shell** — the `resizable-panel` primitive: a controlled panel + a `role="separator"` handle
  wired to pointer-drag and arrow-key handlers, plus a `use-resizable-width` hook that owns the
  `localStorage` read/write and the resize event wiring.
- **Consumption** — `ayokoding-www` swaps its fixed `<aside>` for the primitive and adds
  `overflow-x-auto` to the tree container; `mobile-nav.tsx` gains a preset-width control.

**Hard constraint**: the entire feature is built with **zero new external packages** (runtime OR
dev) — React, the existing `libs/web-ui` primitives and design tokens, the already-present Radix/CVA
deps, and the existing test tooling only. Enforced by an acceptance criterion (prd.md US-8) and a
delivery gate that diffs the manifests + lockfile against `origin/main`.

See `tech-docs.md` for the architecture, the mandated hand-rolled zero-dependency approach (DD-2),
and the full file-impact list.

## Documents

- [brd.md](./brd.md) — business rationale, impact, non-goals, risks
- [prd.md](./prd.md) — personas, user stories, Gherkin acceptance criteria, UI-design-funnel
- [tech-docs.md](./tech-docs.md) — architecture, design decisions, file impact, dependencies
- [delivery.md](./delivery.md) — phased, gated delivery checklist (start here to execute)
- [learnings.md](./learnings.md) — Knowledge Capture running log

## Delivery Mode

`worktree-to-pr` (default) — see `delivery.md` for the `## Worktree` and `## Delivery Mode` sections.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
