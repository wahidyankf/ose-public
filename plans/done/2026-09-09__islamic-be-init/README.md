# Plan: islamic-be-init (Complete)

Stand up `islamic-be` — a Go/Gin REST API serving generic Islamic tools — and its Playwright
companion `islamic-be-e2e`, on top of the Go language lane this monorepo still lacks.

**Status**: Complete — all eight phases delivered; six delivery units merged to `origin/main` as PRs #496–#501 in `ose-public` and #169 in the private sibling
**Delivery Mode**: `worktree-to-pr`
**Depends on**: [`lms-init`](../../in-progress/lms-init/README.md) DU1 and DU2 — **both merged and verified**
(`c6fffc3` and #493)

## Context

The repository serves three product domains (`ose`, `organiclever`, `ayokoding`) across two
F#/Giraffe backends [Repo-grounded — `apps/ose-be/project.json`]. Generic Islamic tooling — prayer
times, qibla direction, hijri conversion — is a distinct product with a different audience and a
different runtime profile from `ose-be`'s compliance gap-analysis API: it is stateless, cacheable,
and computation-bound rather than database- and model-bound. It earns its own deployable.

Go is **half-provisioned** here. `Brewfile` installs it, `repo-config.yml` registers the
`format-gofmt` and `format-verify-gofmt` gate pair [Repo-grounded — `repo-config.yml:547`, `:556`],
and `rhino-cli` already parses Go `cover.out`. All of it is residue from the deleted
`a-demo-be-golang-gin` demo, and none of it is load-bearing. Four surfaces still mis-handle Go:

| Surface                                 | Verified failure mode                                                                                                                                                                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.github/workflows/pr-quality-gate.yml` | No `has-go` output and no `lang:go` detect arm; the `typescript` (`:306`), `dotnet` (`:335`, `:338`), `flutter` (`:362`), and `java` (`:377`) jobs each select by _excluding_ known `lang:` tags, and none excludes `go` — so a Go project runs in **all four**, on runners with no Go toolchain |
| `scripts/behaviour-coverage.mjs`        | `BINDING_FILE` matches only `.ts`, `.tsx`, `.fs` (`:20`), and `extractBindings` dispatches `.fs` to F# and everything else to TypeScript (`:374`) — Godog registrations parse as nothing, so every scenario reports `undefined Unit binding`                                                     |
| `rhino-cli` `Env.fs:1592`               | The env-contract scanner returns `Error "unsupported lang: %s"` for anything but `typescript` and `fsharp`                                                                                                                                                                                       |
| Tag vocabulary                          | `lang:go`, `platform:gin`, and `domain:islamic` are outside the controlled vocabulary, and inventing values is a named anti-pattern                                                                                                                                                              |

`Env.fs` sits at line 9 of `apps/rhino-cli/parity-manifest.sha256`, which makes the scanner change a
**two-repository delivery**.

## Why this plan depends on `lms-init`

`lms-init` [Repo-grounded — `plans/in-progress/lms-init/`] solves the same class of problem for
Java, and its first two delivery units generalize the exact seams Go needs:

- **DU1** made the `rhino-cli` doctor tool inventory config-driven via `doctor.extra-tools`.
  `builtinDoctorToolInventory` and `doctorToolInventoryFor (config)` now split the resolution
  [Repo-grounded — `RepoConfig.fs:174`, `:284`], and `go` remains absent from the built-in list, so
  registering it is a `repo-config.yml` entry with **no `rhino-cli` change and no parity cost** —
  the saving D-4 of `lms-init` was designed to produce. The private sibling already carries
  `extra-tools: []` [Repo-grounded — the private sibling `repo-config.yml:272`], so the key set is
  identical and this plan adds a list item, not a key.
- **DU2** taught `behaviour-coverage.mjs` a fourth language and factored the shared
  feature-reference scan into `featureReferences(source, literalPattern)`
  [Repo-grounded — `scripts/behaviour-coverage.mjs:302`], added the `has-java` CI detect/job pattern
  with a `setup-java` composite action, and added `tag:lang:java` to the other three jobs. Go
  follows that established pattern instead of inventing one.

Landing Go first would have forced `lms-init` to rebase every one of those seams. Landing it second
made the Go lane roughly 40% smaller. Both units are now merged and Phase 0 has verified them
against the tree, so this plan is unblocked. See [`tech-docs.md`](./tech-docs.md) §2 D-0.

## Scope

**Repositories**: `ose-public` (primary) and the private sibling (one paired parity PR for the
byte-identical `Env.fs` change and its regenerated manifest).

**New projects**: `islamic-be` (Go 1.26 / Gin, port 8402), `islamic-be-e2e` (Playwright + BDD),
`islamic-contracts` (OpenAPI 3.1 at `specs/apps/islamic/be/contracts/`).

**Platform changes**: Go CI detect arm, job, and three exclude-list entries; `setup-go` composite
action; Go binding extractor; `golangci-lint` gate; `go` under `doctor.extra-tools`; Go
env-contract scanner; three tag-vocabulary amendments.

**Out of scope**: every Islamic-tool endpoint. v1 serves `GET /api/v1/health` and nothing else. No
CD — no GHCR publish, no `stag-islamic-be` branch, no k3s manifest.

## Approach Summary

Six delivery units in `ose-public`; DU5 additionally lands a paired PR in the private sibling:

1. **DU1 — Go platform lane** — tag vocabulary, `setup-go`, `go` CI job, three exclude-list fixes,
   `lint-golangci` gate, `go` doctor declaration, behaviour-coverage Go extractor.
2. **DU2 — Specs corpus** — `specs/apps/islamic/be/` behaviours, architecture, OpenAPI contract.
3. **DU3 — The service** — Gin server, `oapi-codegen` types and `ServerInterface`, Godog unit
   bindings, Dockerfile, dev compose.
4. **DU4 — The E2E suite** — Playwright BDD against the running process.
5. **DU5 — rhino-cli Go env scanner** — paired byte-identical change plus regenerated
   `parity-manifest.sha256` in both repositories.
6. **DU6 — Registry and docs** — env-contract registration, port table, app map, architecture
   reference.

Phase 7 captures knowledge; Phase 8 archives the plan.

## Navigation

- [`brd.md`](./brd.md) — why this exists, who it serves, business risks and non-goals
- [`prd.md`](./prd.md) — personas, user stories, and Gherkin acceptance criteria
- [`tech-docs.md`](./tech-docs.md) — architecture, pinned versions, decisions with rejected
  alternatives, the file-impact tree, and rollback
- [`delivery.md`](./delivery.md) — the ordered, execution-grade checklist and its phase gates
- [`learnings.md`](./learnings.md) — the transient Knowledge Capture log

## Related

- [`lms-init`](../../in-progress/lms-init/README.md) — the Java lane plan this one builds on; authored in PR
  #487, execution pending
- [BDD standard](../../../repo-governance/development/behaviour-driven-development.md)
- [Nx Target Standards](../../../repo-governance/development/infra/nx-targets.md)
- [Cross-Repo rhino-cli Byte-Identity Standard](../../../repo-governance/development/infra/nx-targets/cache-cross-repo-byte-identity.md)
