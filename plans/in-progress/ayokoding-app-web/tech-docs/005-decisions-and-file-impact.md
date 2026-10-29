# Decisions, File Impact, and Recovery

## Decision record

These are final solution choices, not a history of editorial changes. The user resolved material
options before authoring; repository evidence settles the supporting implementation constraints.

| Decision               | Selected and reason                                                                                                                            | Alternatives and rejection                                                                                                                                                                                                     | Consequence / revisit trigger                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| D1 — Product scope     | Full current parity, including tools and private progress; this is the requested replacement experience.                                       | A learning-only slice omits existing tools; a shell-only foundation does not satisfy the approved completion scope.                                                                                                            | More implementation work; revisit only if the user explicitly changes scope.                                             |
| D2 — Coexistence       | Keep both apps on separate ports and preserve current content ownership; ongoing work can continue.                                            | Immediate old-app removal conflicts with local parallel development; a duplicated content corpus causes drift.                                                                                                                 | Two implementations remain; production cutover is separately authorized.                                                 |
| D3 — Source placement  | Read Markdown/manifests/assets in place; no cross-app code imports.                                                                            | Moving into the new app disrupts active course plans; moving into a shared content tree expands their edit scope.                                                                                                              | Shared files may change on main; reconcile already-merged deltas at each boundary.                                       |
| D4 — Runtime interface | Native Go `net/http` handlers with `html/template` pages and htmx fragment endpoints; all discovered old tRPC consumers are app/test internal. | A tRPC compatibility layer adds transport work without a consumer; a separate REST/GraphQL service adds a boundary the local product does not need; a Go web framework adds an unneeded dependency — the user resolved stdlib. | New tests prove domain/UI semantics; revisit if a real external consumer is identified.                                  |
| D5 — Rendering         | Go goldmark HTML/GFM plus `yaml.v3` parsing, bluemonday sanitization, and small vanilla scripts; no Next runtime or Node content bridge.       | Reusing a Node renderer retains a runtime/build bridge; hand-writing Markdown parsing duplicates mature libraries.                                                                                                             | Compatibility fixtures and go.mod dependency pins are mandatory.                                                         |
| D6 — Tool data         | Shared neutral JSON, old TS export adapters, direct Go readers, shared result vectors.                                                         | Copied data drifts; a TypeScript export pipeline remains a build-order dependency.                                                                                                                                             | Extraction is a coherent old-app-compatible unit; no price/rate/date refresh.                                            |
| D7 — BDD engine        | godog as a normal Go module dependency following the `ayokoding-cli` pattern; nothing is vendored into `libs/`.                                | Copying BeaverNest's Elixir ExBdd subtree would drag an Elixir toolchain into a Go app; installing original Cucumber separately duplicates what godog already proves in this repo.                                             | Bindings live in the app repo; refresh by bumping the module pin.                                                        |
| D8 — Execution order   | The plan-order DAG governs: Podman precedes Go, and Go precedes each AyoKoding plan; plan 14 also waits for plans 06–13 for its terminal gate. | Treating all work as independent would violate the user's order and plan 14's whole-series gate.                                                                                                                               | Other declared-independent AyoKoding plans may run in parallel after the rewrite; reconcile against current merged main. |
| D9 — State/privacy     | No database/accounts; browser progress never enters htmx or fragment requests.                                                                 | Server-stored progress changes the privacy contract; automatic cross-port transfer is a new product feature.                                                                                                                   | Preserve compatible local keys but explain origin isolation.                                                             |
| D10 — Ports            | Development 3102 and owned E2E 3191; flag, prefixed env, default precedence.                                                                   | Reusing 3101 prevents simultaneous apps; generic PORT risks retargeting unrelated services.                                                                                                                                    | Register defaults in the port reference; busy port fails without killing/reusing another process.                        |

Repository prior art is the existing site's core/shell boundary, its current URL codecs and tests,
the typed ordered redirect modules, existing per-owner Gherkin coverage, and `ayokoding-cli`'s Go
module: godog BDD, coverage-gate script, golangci-lint/nilaway/shfmt lint shape, and Nx
`lang:go` quality lane. External prior art is the official Go, goldmark, bluemonday, yaml.v3,
htmx, and Playwright documentation in the preceding companions.

## File-Impact Analysis

The tree is repository-relative. `[N]` means new; `[E]` edit; `[G]` generate/regenerate. No current
app or content deletion is planned. Bounded families are discovered and recorded before editing.

```text
.
├── apps/
│   ├── ayokoding-web/ [N] — one new Go module, customized below
│   │   ├── go.mod, go.sum [N] — module github.com/wahidyankf/ose-public/apps/ayokoding-web, go 1.26, godog/goldmark/bluemonday/yaml pins
│   │   ├── cmd/ayokoding-web/main.go [N] — validated --port launcher, env resolution, listener
│   │   ├── internal/{content,coursepaths,search,tools/benchmark,tools/calculator,web}/**/*.go [N]
│   │   ├── internal/web/templates/**/*.html [N] — pages, fragments, layout primitives
│   │   ├── assets/{js,css}/**/*.{js,css} [N] — htmx vendor pin, vanilla progress/theme/copy/math hooks, existing visual tokens
│   │   ├── tests/{bdd,integration,fixtures}/** [N] — godog features glue, httptest suites, synthetic corpus
│   │   ├── scripts/coverage-gate.sh [N] — COVERAGE_MINIMUM=99 gate reused from ayokoding-cli shape
│   │   ├── behaviour-coverage.json [N] — unit/integration/e2e adapters over tests/bdd + specs corpus
│   │   ├── project.json, README.md [N]
│   │   └── .env.example [N] — placeholders and documented local-only settings
│   ├── ayokoding-web-e2e/
│   │   ├── project.json, package.json, tsconfig.json, README.md [N]
│   │   ├── playwright.config.ts, behaviour-coverage.json [N]
│   │   └── tests/e2e/{steps,support}/**/*.ts, fixtures/** [N]
│   ├── ayokoding-cli/
│   │   └── (unchanged precedent only; no edits — godog/coverage/lint shape is referenced, not modified)
│   └── ayokoding-www/
│       ├── src/features/ai-benchmark/core/data/{models,benchmarks,operators}.ts [E]
│       ├── src/features/cost-of-living-calculator/core/data/{cities,roles,fx}.ts [E]
│       ├── tests/unit/**/{benchmark,calculator,data}*.test.ts [N/E] — characterize imports/results
│       └── project.json [E] — shared-data dependency and cache-input edges only
├── libs/
│   ├── ayokoding-data/
│   │   ├── README.md, provenance.md, project.json, package.json [N]
│   │   ├── data/{ai-benchmark,cost-of-living,fx}.json [N]
│   │   └── test-vectors/{benchmark,calculator,url-state}.json [N]
│   │   └── test/unit/data.test.ts, behaviour-coverage.json [N]
│   └── README.md [E] — annotated new-library entries
├── scripts/{behaviour-coverage.mjs,behaviour-coverage.test.mjs} [E only if a Go binding gap is proven; the .go extractor already exists]
├── scripts/workflow-language-lanes.test.mjs [E] — Go-owner lane regression already covers lang:go; extend only with the new project tags
├── .github/workflows/pr-quality-gate.yml [E] — no new job: the Go lane already detects lang:go; register the new projects' tags only
├── repo-config.yml [E] — project/stack, metadata, and enforcement inventory
├── repo-governance/development/quality/stacks/repository-adapter.md [E]
├── repo-governance/development/quality/stacks/repository-adapter/adopter-decisions.md [E]
├── docs/reference/{monorepo-structure,web-sites}.md [E]
├── package-lock.json [G] — only if new workspace/test dependencies require it
├── specs/apps/ayokoding/{README.md,web/**} [N/E] — proof-ownership wording Go-ified in the landing unit; behavior contracts unchanged
├── specs/README.md [E] — owner/library navigation
├── plans/{README.md,backlog/README.md,in-progress/README.md,done/README.md} [E when lifecycle changes]
├── plans/{backlog,in-progress}/ayokoding-learn-revamp-*/README.md [E] — live plans 06–14 awareness only
└── plans/backlog/ayokoding-app-web/** [N] — this authoring package; lifecycle moves later
```

No `libs/ex-bdd` subtree, no `UPSTREAM.md` import record, no Elixir toolchain action, and no
`.github/actions/setup-elixir` appear anywhere: the Go lane reuses the existing
`.github/actions/setup-go` and the `lang:go` detection already in `pr-quality-gate.yml`.

### More Detail

The Go module shape bounds the initial new-app family; inventory `ayokoding-cli`'s `project.json`
targets before writing the new `project.json`. Existing-app test paths in the tree are bounded by
the current unit tree and the two named tool data consumers: discover them with
`rg --files apps/ayokoding-www/tests/unit` and the current `data` module imports, then record
exact paths. Do not create speculative helpers outside those families. The only cross-app source
access is read-only content/manifests/assets; both apps import shared data from `libs/`, not one
another's executable modules.

The new data library gets its own three-entry specification corpus, with validation/provenance
behavior and adapter tests; it is not an excuse to add product runtime logic to a JSON library.
Library code/test targets use the capabilities that actually exist. The app project declares a
dependency on `ayokoding-data` and the read-only shared-source families; cache inputs include
source corpus/manifests, new Gherkin, shared JSON, `go.mod`/`go.sum`, and JS lockfiles so
shared-source changes invalidate proof. Do not add a reverse dependency that forces existing
course plans to wait for the rewrite or run the Go server before that project has landed.

No deployment workflow, environment branch, Vercel resource, container stack, production config,
or sibling-repository file changes. The local quality-lane changes exist only so a PR cannot
silently skip new Go projects — the `lang:go` tag and `setup-go` action already exist, so this
is registration, not new machinery. Existing scheduled runtime-test selection is updated only
where the existing test contract requires it; it introduces no release/deploy job.

## Concrete rules and documentation impact

Only `ose-public` changes. The rules-propagation transaction has these inputs:

| Input                                                                                                                                                                                     | Narrow canonical home                                                                                 | Enforcement disposition                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| This app explicitly selects Go stdlib + htmx instead of the new-backend F# default; `go test`, godog, golangci-lint, nilaway, and browser-helper TypeScript checks are the adopted tools. | Repository adapter and adopter decisions; `repo-config.yml` mirrors only the project/stack inventory. | Gated by named project targets and the existing Go language lane.                      |
| `ayokoding-data` is a language-neutral shared-data package consumed by TypeScript and Go readers.                                                                                         | Library naming section in the monorepo reference and the repository adapter's local decisions.        | Unenforced by decision; review the named exception, without changing unrelated naming. |
| Native Go BDD bindings must provide verified expanded identities and a real 99% Unit coverage gate via the coverage-gate script.                                                          | Existing BDD/coverage enforcement and its documented adapter contract.                                | Gated by `behaviour-coverage.mjs` and the coverage-gate script using godog bindings.   |
| New local listener uses 3102 and test listener 3191, with existing port precedence rules.                                                                                                 | `docs/reference/web-sites.md` owner table; no duplicate global port policy.                           | Existing review disposition plus new Unit configuration and coexistence tests.         |
| No vendored engine is imported; godog/goldmark/bluemonday/yaml are pinned module dependencies.                                                                                            | App `go.mod`/`go.sum`; no root licensing-notice change for vendored code.                             | Existing licensing policy; dependency-pin review.                                      |

Execution freezes each statement, scans the whole rules surface for conflicts, places each on the
narrowest home, updates enforcement in the same unit, records covered/gated/unenforced disposition,
generates harness mirrors only if their canonical input changes, verifies the resulting surfaces,
and runs the rules quality gate. Do not copy BeaverNest governance or agent files wholesale.

Docs Propagation accompanies every delivery unit that changes an app/library README, architecture,
specification, owner inventory, local port, or licensing fact. The authoritative architecture updates
only when the corresponding implementation exists; the initial planned-status text is replaced
with the actual as-built boundary in that same unit.

## Delivery boundaries and recovery

Use natural coherent units: Go harness plus shared datasets; the complete local app plus its
tests/specs/docs; and final parity/hardening. The app's domain packets may be implemented
concurrently inside its cohesive unit, but a partially bound corpus or failing runtime suite
does not merge as a scaffold. The new application is not connected to any production entrypoint.
No production feature flag or rollout is needed because this plan exposes no production route,
environment branch, or deploy trigger.

If a slice fails, stop at its TDD packet and repair the owning boundary. Keep the last passing
catalog/data behavior; never hide an error with a skip, retry, timeout increase, or weakened test.
If goldmark cannot satisfy the locked dependency on the host, diagnose the documented module and
toolchain requirements; do not silently switch to a Node runtime renderer.

To abandon local runtime use, stop the HIPPO-owned Go service and keep using the existing app.
No content/progress migration needs rollback. To revert a shared-data extraction after delivery,
revert that complete coherent commit/PR with its old-app adapters, data, tests, and inventories;
never remove shared JSON while leaving either consumer pointing at it. The content source is not
rewritten by this plan and must not be reset to a historical snapshot.

No rollback command kills an unrelated port listener, deletes another worktree's files, or resets
main. Worktree/branch cleanup follows the repository's proof-gated cleanup workflow after delivered
head verification, not a guessed plan completion date.
