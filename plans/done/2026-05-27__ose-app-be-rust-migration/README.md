# ose-app-be Rust Migration

Rewrite `apps/ose-app-be/` from F#/Giraffe/.NET 10 to Rust/Axum, mirroring the structure and
strict quality settings of `apps/organiclever-be/`.

## Context

`apps/ose-app-be/` is the OSE Application platform backend (port 8302). It currently implements
five DDD bounded contexts in F#/Giraffe: one real (`health`) and four empty stubs
(`regulatory-source`, `internal-policy`, `gap-analysis`, `ai-orchestration`). The Rust rewrite
ports all five contexts using the same hexagonal DDD module layout proven in `organiclever-be`,
deletes all F#/.NET artifacts, and re-wires the Nx workspace targets.

> **Note on bounded-contexts.yaml**: `specs/apps/ose-app/ddd/bounded-contexts.yaml` currently
> lists only four contexts (`regulatory-source`, `internal-policy`, `gap-analysis`,
> `ai-orchestration`). The `health` context exists in code but has no YAML entry. This plan
> updates `code_lang` and `code` paths for the four YAML-listed contexts only. The health
> context is code-only; adding a `health` entry to the YAML is out of scope for this plan.

## Scope

**In scope:**

- Delete all F# and .NET files from `apps/ose-app-be/`
- Scaffold a Rust/Axum project with the same structure as `apps/organiclever-be/`
- Implement the `health` context returning `{"status": "healthy"}` on `GET /api/v1/health`
- Port four bounded-context stubs (`regulatory-source`, `internal-policy`, `gap-analysis`,
  `ai-orchestration`) as empty module hierarchies (domain / application / infrastructure / api
  layers, each as a `mod.rs`)
- Update `project.json` with full Rust target set (matching `organiclever-be`)
- Update `specs/apps/ose-app/ddd/bounded-contexts.yaml` — change `code_lang` from `[fs]` to
  `[rs]` and update `code` paths to `apps/ose-app-be/src/contexts/<context-name>`
- Update `apps/ose-app-be/README.md` for Rust
- Wire cucumber integration test harness against
  `specs/apps/ose-app/behavior/be/gherkin/health/health.feature`

**Out of scope:**

- Implementing any real logic in the four stub contexts
- Adding OpenRouter HTTP client code (ai-orchestration stub notes the dependency only)
- Generating Rust contracts from OpenAPI spec (codegen target uses same placeholder as
  organiclever-be)
- Updating `ose-app-be-e2e` Playwright tests (those target the running app, not the codebase)
- Database migrations beyond an empty `migrations/` directory with `sqlx::migrate!()`

## Document Map

| Document                       | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, affected roles, success metrics, risks |
| [prd.md](./prd.md)             | User stories, Gherkin acceptance criteria, product scope   |
| [tech-docs.md](./tech-docs.md) | Architecture, file impact, design decisions, dependencies  |
| [delivery.md](./delivery.md)   | Phased delivery checklist (TDD-shaped, execution-grade)    |

## Quick Links

- Reference implementation: `apps/organiclever-be/` [Repo-grounded]
- Gherkin spec: `specs/apps/ose-app/behavior/be/gherkin/health/health.feature` [Repo-grounded]
- DDD spec: `specs/apps/ose-app/ddd/bounded-contexts.yaml` [Repo-grounded]
- Current `project.json`: `apps/ose-app-be/project.json` [Repo-grounded]

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
