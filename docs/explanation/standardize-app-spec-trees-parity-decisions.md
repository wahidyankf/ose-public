# Standardize App Spec Trees — Parity Decisions

**Historical decision record.** The current canonical corpus uses recursive `behaviours/` trees as
defined by the [BDD standard](../../repo-governance/development/behaviour-driven-development.md).
Legacy `behavior/.../gherkin/` paths below are preserved as historical evidence, not current
authoring guidance.

> **Audience**: Engineers, Technical Product/Project Managers
>
> **Plain-language summary**: This document records the architectural decisions made
> during the `standardize-app-spec-trees` plan (2026-06-11). It explains why the spec
> tree surface-naming convention changed from bare slugs (`be/`, `web/`, `cli/`) to
> flat product-surface compound names (`organiclever-be/`, `ayokoding-web/`, etc.),
> why `ose-app` and `ose-platform` spec trees were merged into a single `ose/` tree,
> and why `build-tools` was renamed to `ayokoding-build-tools` rather than retired.

## Context

The spec tree under `specs/apps/` grew organically as new applications joined the
repository. Each app family (`organiclever`, `ayokoding`, `ose-app`, `ose-platform`,
`rhino`, `crane`, `wahidyankf`) independently named its `behavior/` subdirectories
using bare surface slugs (`be/`, `web/`, `cli/`, `api/`). This produced paths like:

```
specs/apps/organiclever/behavior/be/gherkin/
specs/apps/ayokoding/behavior/api/gherkin/
specs/apps/ose-platform/behavior/cli/gherkin/
```

When navigating or grepping across families, bare slugs produced ambiguous matches and
made it impossible to identify which product a path belonged to without walking up the
directory tree. The plan standardized all behaviour surface directories to the
`<product>-<surface>` compound form.

## Decision 1: Flat `<product>-<surface>` Naming for Behaviour Directories

**Decision**: Rename all `behavior/<surface>/gherkin/` directories to
`behavior/<product>-<surface>/gherkin/`. The product name is the Nx project-family
identifier (e.g. `organiclever`, `ayokoding`, `ose`).

**Why**:

- **Unambiguous at any depth**: `specs/apps/organiclever/behavior/organiclever-be/gherkin/`
  is self-identifying. A developer who lands there via search knows the product without
  reading parent directories.
- **Single naming rule, zero exceptions**: Every behaviour directory follows the same
  `<product>-<surface>` pattern regardless of whether it is a backend, frontend, CLI,
  or build-time surface. No special cases for single-surface apps.
- **Consistent with existing compound naming**: The Nx project convention already uses
  compound names (`organiclever-be`, `organiclever-app-web`). Spec tree paths that mirror
  those names are easier to cross-reference from project README files and step files.
- **grep locality**: Searching for `organiclever-be` uniquely identifies both the Nx
  project and its spec path. Searching for `be/` matched dozens of unrelated paths.

**Alternatives rejected**:

- _Keep bare slugs_: Rejected because it preserves ambiguity and makes the allowlist
  retired in-tree Rhino validator unable to enforce family isolation.
- _Nest under a product directory inside behavior_: e.g.
  `behavior/organiclever/be/gherkin/`. Rejected because it adds a third level of
  indirection without enabling the self-identifying property at the behaviour-surface
  level.

## Decision 2: Merge `ose-app` + `ose-platform` into a Single `ose/` Tree

**Decision**: Consolidate `specs/apps/ose-app/` and `specs/apps/ose-platform/` into
`specs/apps/ose/`. Within the merged tree, surfaces are named:

- `behavior/app-be/gherkin/` — OSE Application backend (api.oseplatform.com)
- `behavior/app-web/gherkin/` — OSE Application frontend (app.oseplatform.com)
- `behavior/platform-be/gherkin/` — OSE Platform backend tRPC API
- `behavior/platform-web/gherkin/` — OSE Platform marketing site

**Why**:

- **One product, two sub-surfaces**: `ose-app` and `ose-platform` are both OSE-domain
  applications. They share the same DDD bounded contexts, the same OpenAPI contract
  namespace, and the same Nx domain tag. Keeping them in separate spec trees required
  duplicate `product/`, `system-context/`, and DDD artifacts.
- **Unified domain tag**: All `ose-*` Nx projects use `domain:ose`. A single spec tree
  per domain tag is the natural corresponding unit.
- **Reduce index clutter**: `specs/README.md` previously listed `ose-app` and
  `ose-platform` as separate rows. Merging them to a single `ose` row matches how the
  domain appears in every other index (AGENTS.md, project dependency graph, nx-targets).
- **Allowlist simplification**: The retired in-tree allowlist previously tracked `ose-app` as the
  DDD entry. After the merge it tracked `ose`, matching the unified tree name.

**Surface sub-naming rationale** (why `app-be`, not `ose-app-be`):

Within the already-namespaced `specs/apps/ose/behavior/` directory, the product prefix
`ose` is implicit. Using the full `ose-app-be` would repeat the product name. The
two-segment `app-be` / `platform-be` form distinguishes the sub-surface clearly while
keeping paths at a readable length.

**Alternatives rejected**:

- _Keep separate trees_: Rejected because it prevents a unified DDD and contracts
  section and violates the one-tree-per-domain-tag principle.
- _Use `ose-app-be` / `ose-platform-be` inside ose/_: Rejected because the parent path
  `specs/apps/ose/behavior/` already provides the `ose` prefix; repeating it in the
  child name adds noise without clarity.

## Decision 3: Rename `build-tools` to `ayokoding-build-tools` (Not Retire)

**Decision**: The ayokoding spec tree's `behavior/build-tools/gherkin/` directory was
renamed to `behavior/ayokoding-build-tools/gherkin/`. It was NOT retired or inlined
into another surface.

**Why**:

- **Active surface**: `ayokoding-build-tools` is a real surface with live Gherkin feature
  coverage. Retiring it would leave those feature files without a home.
- **Follows the `<product>-<surface>` rule**: `build-tools` is a surface type (CLI
  tooling), `ayokoding` is the product. The compound form `ayokoding-build-tools`
  satisfies the same naming convention as `ayokoding-web` and `ayokoding-be`.
- **Distinguishable from other surfaces**: `ayokoding-build-tools` covers content-pipeline
  tooling with its own feature set, distinct from the web and backend surfaces. Keeping it
  separate prevents feature file confusion.

**Alternatives rejected**:

- _Merge into a general CLI surface_: Rejected because `ayokoding-build-tools` covers
  build-time content-pipeline tooling, which is distinct from any deployed surface.
  Merging would blur the product boundary.
- _Retire and inline_: Rejected because active feature files would be lost or
  orphaned. No inactive surface should be deleted while it has live coverage.

## Decision 4: Surface Naming for `be` vs `api`

**Decision**: All backend HTTP surfaces use the `be` suffix, not `api`. The ayokoding
spec tree historically used `api/gherkin/` for its backend surface. This was renamed
to `ayokoding-be/gherkin/`.

**Why**:

- **Consistent perspective**: `be` signals the server-side (backend) perspective.
  `api` is ambiguous — it could mean the HTTP contract, the client SDK, or the server
  implementation. The repo convention uses `be` for server-side surfaces uniformly.
- **One suffix per surface type**: Using both `be` and `api` would require teams to
  remember which apps used which suffix. A single suffix eliminates the cognitive load.

## Allowlist Impact

The retired in-tree `AppsWithDDD` allowlist controlled which spec families were checked for
bounded-context artifacts. After this plan it contained:

```rust
pub fn apps_with_ddd() -> &'static [&'static str] {
    &["organiclever", "ose"]
}
```

`wahidyankf`, `ayokoding`, `rhino`, `crane` are intentionally absent — those families
have not adopted DDD. The previous documentation had incorrectly listed five entries;
this plan corrected both the code and the convention doc.

## Related Documents

- [Specs Directory Structure Convention](../../repo-governance/conventions/structure/specs-directory-structure.md)
- [App README vs Specs Convention](../../repo-governance/conventions/structure/app-readme-vs-specs.md)
- Plan: standardize-app-spec-trees
