---
description: "Why uncommitted generated output makes spec/codegen drift unrepresentable, which BE-client pairs participate in contract-first development, and related pattern documentation."
when_to_use: "Use when generated contract output is missing or stale, or checking whether a given app participates in contract-first codegen."
---

# Drift Prevention, Scope, and Related

## Drift Prevention

Generated output is not committed, so spec/codegen drift is not detected after the fact — it is
made unrepresentable. `typecheck` and `build` (and, where the compiler needs generated code,
`test:unit`) declare `dependsOn: ["codegen"]`, so every consumer regenerates from the committed
spec before it runs. There is no committed generated artifact that can disagree with the spec, and
correspondingly no `git diff --exit-code` drift job in CI.

Regenerate explicitly when a language server needs the output, which does not go through Nx:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run <app>:codegen
```

See [Per-Project Generated Sources](../../workflow/worktree-setup/per-project-generated-sources.md)
for the freshly-provisioned-worktree case, and
[Codegen Dependency Chain](../../infra/nx-targets/codegen-dependency-chain.md) for the wiring.

## Scope

Contract-first development covers these backend↔client pairs:

| Backend           | Client                 | Spec                                                |
| ----------------- | ---------------------- | --------------------------------------------------- |
| `organiclever-be` | `organiclever-app-web` | `specs/apps/organiclever/be/contracts/openapi.yaml` |
| `ose-be`          | `ose-app-web`          | `specs/apps/ose/be/contracts/openapi.yaml`          |
| `ose-lms-be`      | — (server only)        | `specs/apps/ose/lms-be/contracts/openapi.yaml`      |
| `roots-be`        | — (server only)        | `specs/apps/roots/be/contracts/openapi.yaml`        |

A backend with no client still participates: `codegen` generates its server interface, so an
operation added to the spec fails compilation until it is served.

Apps outside this table — CLI tools and content-only web apps such as `ayokoding-www` and
`ose-www` — do not participate in contract-first codegen.

## Related

- **[Hexagonal Architecture + DDD — Backend Apps](../hexagonal-architecture-be.md)** — Where generated types land in
  the layer structure (`api/http/` boundary); domain types are never generated
- **[Functional Core / Imperative Shell — Web Apps](../functional-core-imperative-shell-web.md)** — Where generated
  TypeScript client types land in the web app structure (`features/<name>/shell/`, the imperative shell)
