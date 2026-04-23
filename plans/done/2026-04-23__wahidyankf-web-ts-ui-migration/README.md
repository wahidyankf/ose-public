# wahidyankf-web Component Migration to ts-ui

**Status**: In Progress
**Created**: 2026-04-23
**Scope**: `ose-public` — `apps/wahidyankf-web`, `libs/ts-ui`

## Description

Migrate four pure-React components (`HighlightText`, `ScrollToTop`, `SearchComponent`,
`ThemeToggle`) from `apps/wahidyankf-web/src/components/` into the shared `libs/ts-ui`
component library. Each component is refactored to accept flexible props so any OSE app can
consume it with different styles or behaviour — `wahidyankf-web` passes props that reproduce
its current appearance exactly. Export the components from the library's public index, wire the
workspace dependency in `wahidyankf-web`, and update every import site.

`Navigation.tsx` stays local because it imports Next.js-specific packages that would contaminate
the framework-agnostic library.

## Documents

| Document                       | Purpose                                                       |
| ------------------------------ | ------------------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, goals, success metrics, risks             |
| [prd.md](./prd.md)             | User stories, acceptance criteria, product scope              |
| [tech-docs.md](./tech-docs.md) | Technical approach, file moves, import changes, code snippets |
| [delivery.md](./delivery.md)   | Step-by-step delivery checklist with quality gates            |
