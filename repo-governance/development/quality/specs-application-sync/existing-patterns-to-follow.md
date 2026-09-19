---
description: "Worked spec-organization patterns for organiclever, ayokoding-www, and CLI apps."
when_to_use: "Use when structuring specs/ for a new app and want an existing pattern to follow."
---

# Existing Patterns to Follow

## organiclever specs

`specs/apps/organiclever/` carries one [logical owner corpus](../../../conventions/structure/specs-directory-structure/logical-owner-corpus.md) per surface OrganicLever deploys:

- `specs/apps/organiclever/be/` — the F# backend: `architecture.md`, `behaviours/`, and `contracts/`, the OpenAPI 3.1 spec the backend serves and the app frontend consumes
- `specs/apps/organiclever/app-web/` — the authenticated application frontend
- `specs/apps/organiclever/www/` — the marketing site, whose `behaviours/` splits into `frontend/` and `backend/` because one deployed site owns both

The contract sits inside `be/` rather than in a shared folder because the backend is what serves it. When a new endpoint is added to the OpenAPI spec in `organiclever-contracts`, the backend corpus gains both the scenarios and the `architecture.md` component in the same delivery unit.

## ayokoding-www specs

`specs/apps/ayokoding/www/` is a [logical owner corpus](../../../conventions/structure/specs-directory-structure/logical-owner-corpus.md) for the one site AyoKoding deploys:

- `specs/apps/ayokoding/www/architecture.md` — the as-built C4 view, kept current with the App Router structure and the tRPC routers
- `specs/apps/ayokoding/www/behaviours/backend/` — scenarios for tRPC procedures, consumed by `ayokoding-www-be-e2e`
- `specs/apps/ayokoding/www/behaviours/frontend/` — scenarios for what a learner sees

When a new tRPC router is added to `apps/ayokoding-www/`, `architecture.md` gains the component and `behaviours/backend/` gains the scenarios, in the same delivery unit.

## CLI apps

Executable tools (`Rhino`, `crane-cli`) use the same project-local enforcement path:

- Each active scenario has exactly one mandatory Unit binding.
- Applicable local-resource and public-process concerns have exactly one Integration or E2E
  binding; a genuine boundary mismatch uses the canonical explicit exemption plus named
  alternative proof.
- Each tool's `test:coverage:*` targets validate its own corpus and adapters. The aggregate static
  target is part of `test:quick`; runtime Integration and E2E remain manual-impacted and
  scheduled-full.

See [Behaviour-Driven Development](../../behaviour-driven-development.md) for the full CLI mapping rules.
