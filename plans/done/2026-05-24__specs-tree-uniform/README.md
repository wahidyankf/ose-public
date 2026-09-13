# Specs Tree Uniformity Pass

Bring every spec area under `specs/` into compliance with the canonical C4-aware five-folder
tree defined in [Specs Directory Structure Convention](../../../repo-governance/conventions/structure/specs-directory-structure.md)
and [App README vs Specs Convention](../../../repo-governance/conventions/structure/app-readme-vs-specs.md).
Today the tree mixes canonical layouts (organiclever, ose-app, ayokoding, wahidyankf, ose-platform)
with legacy flat layouts (crane, partially rhino, ayokoding/build-tools) and a stale root README
that documents a pattern the repository abandoned.

## Status

**Not Started** — plan authored 2026-05-23.

## Documents

- [brd.md](./brd.md) — business rationale (validator gates, automation parity, PM-readable spec navigation)
- [prd.md](./prd.md) — product requirements with Gherkin acceptance criteria covering every gap
- [tech-docs.md](./tech-docs.md) — gap inventory matrix, per-app target structure, migration recipes
- [delivery.md](./delivery.md) — phased checklist (root README first, then per-app migrations, then validator runs)

## Scope Summary

**In scope** (under `specs/`):

| Area                                       | Current state                                                                                                              | Target state                                                                                                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/README.md`                          | Documents legacy `be/fe/fs/cli/gherkin/` flat tree; lists wrong app set; says contracts live at `apps/{domain}/contracts/` | Documents canonical five-folder tree; lists current apps (`ayokoding`, `organiclever`, `ose-app`, `ose-platform`, `wahidyankf`, `rhino`, `crane`); contracts at `containers/contracts/` |
| `specs/apps/crane/`                        | Flat `gherkin/<feature>.feature` at app root                                                                               | CLI-only five-folder layout — `behavior/cli/gherkin/<feature>.feature` (flat under cli/gherkin per CLI exception)                                                                       |
| `specs/apps/rhino/`                        | Only `behavior/cli/gherkin/` populated; no `product/`, `system-context/`, `containers/`, `components/cli/`                 | Full CLI-only surface profile per convention                                                                                                                                            |
| `specs/apps/ayokoding/build-tools/`        | Legacy flat root slug (`build-tools/gherkin/index-generation/`)                                                            | Migrated under `behavior/build-tools/gherkin/` OR documented as a permanent exception in the convention (decision in tech-docs)                                                         |
| CLI `gherkin/` trees (4 apps)              | crane, rhino, ayokoding-cli, ose-platform-cli all keep `.feature` files flat under `gherkin/`                              | Domain subdirs everywhere — `behavior/cli/gherkin/<domain>/<feature>.feature` — matching organiclever's existing pattern. Requires retiring the CLI-flat exception in the convention.   |
| `specs/libs/hugo-commons/`                 | Lib spec tree exists; `swe-hugo-dev` agent deprecated                                                                      | Verify lib still active; if defunct, archive both lib + spec tree in a separate plan; if active, retain                                                                                 |
| `apps/rhino-cli/src/internal/allowlist.rs` | `AppsWithDDD` allowlist = `organiclever`, `wahidyankf`, `ose-platform`, `ayokoding`                                        | Add `ose-app` once its DDD registry has at least one populated BC (or document exclusion rationale)                                                                                     |

**Out of scope**:

- New Gherkin scenarios (this plan is structural only — no behavioral changes)
- DDD registry content authoring (only structural folders and READMEs)
- Step-definition refactors (paths only update if Gherkin files move)
- Archival of `libs/hugo-commons` itself (separate plan if lib confirmed defunct)
- Renaming `ose-platform` spec folder to `ose-web` (intentional decoupling per existing ose-platform README — spec-folder name ≠ app name)

## Affected Apps and Libs

`ayokoding`, `crane`, `organiclever`, `ose-app`, `ose-platform`, `rhino`, `wahidyankf`, `apps-labs`,
`libs/golang-commons`, `libs/hugo-commons`, `libs/web-ui`, `rhino-cli`.

## Approach Summary

1. **Documentation first** — rewrite `specs/README.md` to reflect canonical structure and current app inventory.
2. **Per-app structural migrations** — atomic `git mv` per app (per convention §Migration Path) plus README updates and path-reference sweeps in the same commit. No staggered moves.
3. **Validator gates** — every migration commit re-runs `nx run rhino-cli:validate:specs-{adoption,tree,counts,links}` with `--apps` scoped to the changed app. Plan exits when all four exit 0 across the full repo.
4. **Allowlist sweep** — once `ose-app` is convention-compliant, evaluate adding it to `AppsWithDDD` (or document its exclusion).
5. **Domain-subdir sweep across CLI gherkin** — group every flat `.feature` file under `behavior/cli/gherkin/<domain>/` matching organiclever's existing BE/web pattern. Retire the CLI-flat carve-out in the convention.
6. **Repo-wide .md sweep** — every governance doc, convention, agent/skill, per-app README, new-app how-to, and BDD/testing reference markdown is updated to teach the uniform layout, so future apps inherit it automatically.
7. **Governance propagation** — delegate to `repo-rules-maker` to fold the new uniform state (including the CLI-flat-exception retirement and the repo-wide .md sweep) into `repo-governance/`, agent definitions, `AGENTS.md`, `docs/`, and per-app READMEs; then `repo-rules-checker` validates the propagation; then `npm run sync:claude-to-opencode` mirrors agent changes to `.opencode/`.

## Worktree

Worktree path: `worktrees/specs-tree-uniform/`

Provision before execution (run from repo root):

```bash
claude --worktree specs-tree-uniform
```

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md)
and [Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Trigger

User-initiated uniformity audit (2026-05-23): "create a plan to make sure the `specs/` folder is uniform".

## Related

- [Specs Directory Structure Convention](../../../repo-governance/conventions/structure/specs-directory-structure.md)
- [App README vs Specs Convention](../../../repo-governance/conventions/structure/app-readme-vs-specs.md)
- [BDD Spec-Test Mapping](../../../repo-governance/development/infra/bdd-spec-test-mapping.md)
- [Specs Validation Workflow](../../../repo-governance/workflows/specs/specs-quality-gate.md)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
