# Decisions, File Impact, and Recovery

## Decision record

These are final solution choices, not a history of editorial changes. The user resolved material
options before authoring; repository evidence settles the supporting implementation constraints.

| Decision               | Selected and reason                                                                                                                                      | Alternatives and rejection                                                                                                                                        | Consequence / revisit trigger                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| D1 — Product scope     | Full current parity, including tools and private progress; this is the requested replacement experience.                                                 | A learning-only slice omits existing tools; a shell-only foundation does not satisfy the approved completion scope.                                               | More implementation work; revisit only if the user explicitly changes scope.                                         |
| D2 — Coexistence       | Keep both apps on separate ports and preserve current content ownership; ongoing work can continue.                                                      | Immediate old-app removal conflicts with local parallel development; a duplicated content corpus causes drift.                                                    | Two implementations remain; production cutover is separately authorized.                                             |
| D3 — Source placement  | Read Markdown/manifests/assets in place; no cross-app code imports.                                                                                      | Moving into the new app disrupts active course plans; moving into a shared content tree expands their edit scope.                                                 | Shared files may change on main; reconcile already-merged deltas at each boundary.                                   |
| D4 — Runtime interface | Native contexts and LiveView; all discovered old tRPC consumers are app/test internal.                                                                   | A tRPC compatibility layer adds transport work without a consumer; a separate REST/GraphQL service adds a boundary the local product does not need.               | New tests prove domain/UI semantics; revisit if a real external consumer is identified.                              |
| D5 — Rendering         | Elixir MDEx HTML/AST plus YAML parsing and small browser hooks; no Next runtime or Node content bridge.                                                  | Reusing a Node renderer reduces parser differences but retains a runtime/build bridge; hand-writing Markdown parsing duplicates mature libraries.                 | Compatibility fixtures and native dependency setup are mandatory.                                                    |
| D6 — Tool data         | Shared neutral JSON, old TS export adapters, direct Elixir readers, shared result vectors.                                                               | Copied data drifts; a TypeScript export pipeline remains a build-order dependency.                                                                                | Extraction is a coherent old-app-compatible unit; no price/rate/date refresh.                                        |
| D7 — BDD engine        | Copy the exact BeaverNest ExBdd snapshot with the complete attribution chain, as the user requested.                                                     | Installing original Cucumber lacks BeaverNest's strict extensions; writing another engine is unnecessary; a Git dependency does not satisfy copying into `libs/`. | Local integration changes are recorded; refresh manually at explicit commits.                                        |
| D8 — Execution order   | The plan-order DAG governs: Podman precedes Phoenix, and Phoenix precedes each AyoKoding plan; plan 14 also waits for plans 06–13 for its terminal gate. | Treating all work as independent would violate the user's order and plan 14's whole-series gate.                                                                  | Other declared-independent AyoKoding plans may run in parallel after Phoenix; reconcile against current merged main. |
| D9 — State/privacy     | No database/accounts; browser progress never enters LiveView state or messages.                                                                          | Server-stored progress changes the privacy contract; automatic cross-port transfer is a new product feature.                                                      | Preserve compatible local keys but explain origin isolation.                                                         |
| D10 — Ports            | Development 3102 and owned E2E 3191; flag, prefixed env, default precedence.                                                                             | Reusing 3101 prevents simultaneous apps; generic PORT risks retargeting unrelated services.                                                                       | Register defaults in the port reference; busy port fails without killing/reusing another process.                    |

Repository prior art is the existing site's core/shell boundary, its current URL codecs and tests,
the typed ordered redirect modules, and existing per-owner Gherkin coverage. External prior art is
the referenced BeaverNest library and the official Phoenix, LiveView, MDEx, YAML, and Playwright
documentation in the preceding companions, all inspected 2026-10-25.

## File-Impact Analysis

The tree is repository-relative. `[N]` means new; `[E]` edit; `[G]` generate/regenerate. No current
app or content deletion is planned. Bounded families are discovered and recorded before editing.

```text
.
├── apps/
│   ├── ayokoding-web/ [N] — one generated Phoenix application, customized below
│   │   ├── mix.exs, mix.lock, .formatter.exs, project.json, README.md [N]
│   │   ├── config/{config,dev,test,runtime}.exs [N] — local/test isolation
│   │   ├── lib/ayokoding/{content,course_paths,search,tools}/**/*.ex [N]
│   │   ├── lib/ayokoding_web/{live,components,controllers,plugs}/**/*.{ex,heex} [N]
│   │   ├── lib/mix/tasks/ayokoding.serve.ex [N] — validated --port launcher
│   │   ├── assets/{js,css}/**/*.{ts,js,css} [N] — browser hooks and existing visual tokens
│   │   ├── test/{unit,integration,behaviour,support,fixtures}/** [N]
│   │   ├── vitest.config.ts, tsconfig.json, behaviour-coverage.json [N]
│   │   └── .env.example [N] — placeholders and documented local-only settings
│   ├── ayokoding-web-e2e/
│   │   ├── project.json, package.json, tsconfig.json, README.md [N]
│   │   ├── playwright.config.ts, behaviour-coverage.json [N]
│   │   └── tests/e2e/{steps,support}/**/*.ts, fixtures/** [N]
│   └── ayokoding-www/
│       ├── src/features/ai-benchmark/core/data/{models,benchmarks,operators}.ts [E]
│       ├── src/features/cost-of-living-calculator/core/data/{cities,roles,fx}.ts [E]
│       ├── tests/unit/**/{benchmark,calculator,data}*.test.ts [N/E] — characterize imports/results
│       └── project.json [E] — shared-data dependency and cache-input edges only
├── libs/
│   ├── ex-bdd/** [N] — exact tracked licensed source subtree, no cache/deps/build output
│   ├── ex-bdd/lib/mix/tasks/ex_bdd.verify.ex [N] — recorded native verifier adaptation
│   ├── ex-bdd/{project.json,UPSTREAM.md,README.md} [E after import]
│   ├── ex-bdd/test/behaviour/** [N] — canonical OSE behavior adapters
│   ├── ayokoding-data/
│   │   ├── README.md, provenance.md, project.json, package.json [N]
│   │   ├── data/{ai-benchmark,cost-of-living,fx}.json [N]
│   │   ├── test-vectors/{benchmark,calculator,url-state}.json [N]
│   │   └── test/unit/data.test.ts, behaviour-coverage.json [N]
│   └── README.md [E] — annotated new-library entries
├── scripts/{behaviour-coverage.mjs,behaviour-coverage.test.mjs} [E]
├── scripts/workflow-language-lanes.test.mjs [E] — Elixir quality-lane regression
├── .github/workflows/pr-quality-gate.yml [E] — affected Elixir checks, no deployment
├── .github/actions/setup-elixir/action.yml [N] — pinned local-quality toolchain setup
├── repo-config.yml [E] — project/stack, metadata, and enforcement inventory
├── repo-governance/development/quality/stacks/repository-adapter.md [E]
├── repo-governance/development/quality/stacks/repository-adapter/adopter-decisions.md [E]
├── docs/reference/{monorepo-structure,web-sites}.md [E]
├── LICENSING-NOTICE.md [E]
├── package-lock.json [G] — only if new workspace/test dependencies require it
├── specs/apps/ayokoding/{README.md,web/**} [N/E]
├── specs/libs/{README.md,ex-bdd/**,ayokoding-data/**} [N/E]
├── specs/README.md [E] — owner/library navigation
├── plans/{README.md,backlog/README.md,in-progress/README.md,done/README.md} [E when lifecycle changes]
├── plans/{backlog,in-progress}/ayokoding-learn-revamp-*/README.md [E] — live plans 06–14 awareness only
└── plans/backlog/ayokoding-app-web/** [N] — this authoring package; lifecycle moves later
```

### More Detail

The generated Phoenix scaffold bounds the initial new app family; inventory its actual files
before editing. Existing-app test paths in the tree are bounded by the current unit tree and the
two named tool data consumers: discover them with `rg --files apps/ayokoding-www/tests/unit` and
the current `data` module imports, then record exact paths. Do not create speculative helpers
outside those families. The only cross-app source access is read-only content/manifests/assets;
both apps import shared data from `libs/`, not one another's executable modules.

The new data library gets its own three-entry specification corpus, with validation/provenance
behavior and adapter tests; it is not an excuse to add product runtime logic to a JSON library.
Library code/test targets use the capabilities that actually exist. The app project declares a
dependency on `ayokoding-data` and the read-only shared-source families; cache inputs include
source corpus/manifests, new Gherkin, shared JSON, `mix.lock`, and JS lockfiles so shared-source
changes invalidate proof. Do not add a reverse dependency that forces existing course plans to
wait for the rewrite or run Phoenix before that project has landed.

No deployment workflow, environment branch, Vercel resource, container stack, production config,
or sibling-repository file changes. The local quality-lane changes exist only so a PR cannot
silently skip new Elixir projects. Existing scheduled runtime-test selection is updated only where
the existing test contract requires it; it introduces no release/deploy job.

## Concrete rules and documentation impact

Only `ose-public` changes. The rules-propagation transaction has these inputs:

| Input                                                                                                                                                                                 | Narrow canonical home                                                                                 | Enforcement disposition                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| This app explicitly selects Elixir/Phoenix instead of the new-backend F# default; ExUnit/ExBdd, Credo, compiler warnings, and browser-helper TypeScript checks are the adopted tools. | Repository adapter and adopter decisions; `repo-config.yml` mirrors only the project/stack inventory. | Gated by named project targets and affected language lane.                                  |
| `ex-bdd` retains its upstream identity; `ayokoding-data` is a language-neutral shared-data package.                                                                                   | Library naming section in the monorepo reference and the repository adapter's local decisions.        | Unenforced by decision; review the two named exceptions, without changing unrelated naming. |
| Native Elixir BDD adapters must provide verified expanded identities and a real 99% Unit coverage gate.                                                                               | Existing BDD/coverage enforcement and its documented adapter contract.                                | Gated by `behaviour-coverage.mjs` and regression tests using ExBdd's native verification.   |
| New local listener uses 3102 and test listener 3191, with existing port precedence rules.                                                                                             | `docs/reference/web-sites.md` owner table; no duplicate global port policy.                           | Existing review disposition plus new Unit configuration and coexistence tests.              |
| Imported code retains its original notices and fork chain.                                                                                                                            | Imported LICENSE/UPSTREAM and root licensing notice.                                                  | Existing licensing policy; provenance tests and review.                                     |

Execution freezes each statement, scans the whole rules surface for conflicts, places each on the
narrowest home, updates enforcement in the same unit, records covered/gated/unenforced disposition,
generates harness mirrors only if their canonical input changes, verifies the resulting surfaces,
and runs the rules quality gate. Do not copy BeaverNest governance or agent files wholesale.

Docs Propagation accompanies every delivery unit that changes an app/library README, architecture,
specification, owner inventory, local port, or licensing fact. The authoritative architecture updates
only when the corresponding implementation exists; the initial planned-status text is replaced
with the actual as-built boundary in that same unit.

## Delivery boundaries and recovery

Use natural coherent units: imported engine plus verifier/language enforcement; shared datasets
plus compatible old-app adapters; the complete local app plus its tests/specs/docs; and final
parity/hardening. The app's domain packets may be implemented concurrently inside its cohesive
unit, but a partially bound corpus or failing runtime suite does not merge as a scaffold. The new
application is not connected to any production entrypoint. No production feature flag or rollout
is needed because this plan exposes no production route, environment branch, or deploy trigger.

If a slice fails, stop at its TDD packet and repair the owning boundary. Keep the last passing
catalog/data behavior; never hide an error with a skip, retry, timeout increase, or weakened test.
If native MDEx setup cannot satisfy the locked dependency on the host, diagnose the documented
native-build/precompiled-NIF requirements; do not silently switch back to a Node runtime renderer.

To abandon local runtime use, stop the HIPPO-owned Phoenix service and keep using the existing app.
No content/progress migration needs rollback. To revert a shared-data extraction after delivery,
revert that complete coherent commit/PR with its old-app adapters, data, tests, and inventories;
never remove shared JSON while leaving either consumer pointing at it. The content source is not
rewritten by this plan and must not be reset to a historical snapshot.

No rollback command kills an unrelated port listener, deletes another worktree's files, or resets
main. Worktree/branch cleanup follows the repository's proof-gated cleanup workflow after delivered
head verification, not a guessed plan completion date.
