---
description: The required and forbidden headings in app READMEs, and the hard line-count caps per README location.
when_to_use: Use when writing or reviewing an app or infra README and checking its headings and length against the required shape.
---

# Standard 2 and 3 — Required/Forbidden README Sections, and Line-Count Caps

## Standard 2 — Required and Forbidden Sections in App READMEs

**Required headings (Category A content):**

- `## Quick Start` — dev server commands
- `## Nx Targets` — table of all `nx run` targets for this app
- `## Environment Variables` — env vars consumed at runtime (omit if none)
- `## Project Layout` — top-level directory listing (NOT per-context recursion)
- `## Tech Stack` — versions pinned via Volta or toolchain files
- `## Behaviour and Architecture` — one paragraph + link to `specs/apps/<app-family>/`

**Forbidden content in app READMEs:**

- Routes tables listing URL paths (belongs in `components/web/routes-and-screens.md`)
- API endpoint tables (belongs in `components/be/api.md`)
- Architecture diagrams showing internal structure deeper than one level (belongs in `components/`)
- Design system palettes, font specs, or component variant catalogs (belongs in `components/web/design-system.md`)
- Full `src/contexts/<bc>/...` directory recursion (belongs in architecture.md)

## Standard 3 — Line-Count Caps

| Location                    | Hard cap  |
| --------------------------- | --------- |
| `apps/<app>/README.md`      | 120 lines |
| `infra/dev/<app>/README.md` | 60 lines  |

These caps are enforced by `rules-checker`. Exceeding a cap is a HIGH finding. The cap exists because a README that exceeds it almost certainly contains Category B content.
