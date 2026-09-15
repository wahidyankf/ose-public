# File-Impact Analysis

Markers: `[E]` edit, `[N]` new, `[D]` delete, `[G]` generated from canonical `.claude/` sources.

**Temporal status:** the root trees and finite allocation blocks below preserve the paths and
transitions recorded when Phase 0 allocated the work; their markers do not assert the current
filesystem state after a delivery lands. The `D-O-PUB-RHINO` and `D-O-PRI-RHINO` deliveries moved
the live Rhino test root to `apps/rhino-cli/tests/**`. Every remaining command and future allocation
must use that live root. Any `apps/rhino-cli/src/tests/**` occurrence below is historical input to a
completed relocation/allocation and must not be reused as a current path.

## `ose-public` Root

```text
.
├── [E] repo-config.yml
├── [E] package.json
├── [E] package-lock.json
├── [E] nx.json
├── [E] AGENTS.md
├── [E] apps/<DISC-PUBLIC-PROJECT-ROOT>/project.json — finite Phase 0 Nx/root ledger only
├── [E] libs/<DISC-PUBLIC-PROJECT-ROOT>/project.json — finite Phase 0 Nx/root ledger only
├── [D] apps/*/package.json — exact Phase 0 no-boundary subset of 17 direct candidates
├── [D] libs/*/package.json — exact Phase 0 no-boundary subset of 3 direct candidates
├── [E] apps/*/package.json — trim only retained direct-boundary subset
├── [E] libs/*/package.json — trim only retained direct-boundary subset
├── [N] apps/<DISC-PUBLIC-PROJECT-ROOT>/tests/{unit,integration,e2e}/<DISC-TEST-FILE>
├── [N] libs/<DISC-PUBLIC-PROJECT-ROOT>/tests/{unit,integration,e2e}/<DISC-TEST-FILE>
├── [D] apps/<DISC-PUBLIC-PROJECT-ROOT>/{src/tests,src/<DISC-NESTED-ROOT>/__tests__,test}/<DISC-TEST-FILE>
├── [D] libs/<DISC-PUBLIC-PROJECT-ROOT>/{src/tests,src/<DISC-NESTED-ROOT>/__tests__,test}/<DISC-TEST-FILE>
├── [E] apps/rhino-cli/
│   ├── [E] project.json
│   ├── [E] src/RhinoCli.Application/
│   │   ├── [E] RhinoCli.Application.fsproj — compile `TestContract.fs` after config types
│   │   ├── [D] src/Ddd.fs
│   │   ├── [E] src/RepoConfig.fs — remove DDD keys; add registry, lifecycle, and compatibility projection
│   │   ├── [E] src/Specs.fs — remove domain-coverage dispatch; add logical-corpus validation
│   │   ├── [E] src/Glossary.fs — remove only DDD-specific help/term registration
│   │   ├── [N] src/TestContract.fs — typed registry/facade only
│   │   ├── [N] src/TestContractBdd.fs — exact recursive BDD policy
│   │   └── [N] src/TestContractCoverage.fs — native 99% coverage policy
│   ├── [E] src/RhinoCli.Cli/
│   │   ├── [E] src/Dispatch.fs — add `test-contract validate` and strict fixture parsing
│   │   └── [E] src/HelpText.fs — document owner/check/fixture arguments and exit codes
│   ├── [D] src/tests/unit/Steps/DddSteps.fs
│   ├── [D] src/tests/unit/ — move every remaining executable test to project-root `tests/unit/`
│   ├── [N] tests/unit/RhinoCli.UnitTests.fsproj — final compile registration after `OM-03`
│   ├── [N] tests/unit/Steps/{GateDeclarationSteps,GlossarySteps,RepoConfigSteps,RepoConfigUnitTests,SpecsSteps,WaveEFDispatchUnitTests}.fs — moved final paths with admitted registry/policy assertions
│   ├── [N] tests/unit/Steps/TestContractRegistryUnitTests.fs
│   ├── [N] tests/unit/Steps/TestContractBddUnitTests.fs
│   ├── [N] tests/unit/Steps/TestContractCoverageUnitTests.fs
│   ├── [N] tests/unit/Steps/SpecsLogicalCorpusUnitTests.fs
│   ├── [N] tests/unit/TestContractClosureUnitTests.fs — terminal compatibility and lifecycle cases
│   ├── [N] tests/unit/Fixtures/TestContract/Closure/closure.json — one section per closure case
│   ├── [N] tests/unit/Fixtures/TestContract/{Bdd,Coverage,Layout,Manifest}/<named-case>.json
│   └── [N] tests/unit/Fixtures/SpecsLogicalCorpus/<named-case>.json
├── [N] apps/rhino-cli/tests/fixtures/test-contract/owners/<DISC-PUBLIC-OWNER-ID>/{layout-misplaced,coverage-98,bdd-missing-step,manifest-proxy}.json
├── [N] apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-FS-ENV/{bootstrap-empty,active-empty,reverse-transition,mapping-mismatch,layout-misplaced,coverage-98,bdd-missing-step,manifest-proxy}.json
├── [E] apps/<DISC-PUBLIC-OWNER-ROOT>/<DISC-OWNER-EDIT>
├── [E] libs/<DISC-PUBLIC-OWNER-ROOT>/<DISC-OWNER-EDIT>
├── [E] libs/fsharp-env-loader/project.json — add seed target, then bind the active driver/corpus
├── [N] libs/fsharp-env-loader/tests/unit/Behavior/FsharpEnvLoaderBehaviorDriver.fs
├── [E] libs/fsharp-env-loader/tests/unit/fsharp-env-loader-unit-tests.fsproj — compile the behavior driver/tests
├── [E] specs/LICENSE — retain the repository-root MIT notice unchanged; it is not a delivery change path
├── [E] specs/README.md
├── [E] specs/apps/README.md
├── [N] specs/apps/ayokoding/www/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature}
├── [N] specs/apps/crane/cli/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature}
├── [N] specs/apps/organiclever/{app-web,be,www}/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature,contracts/<DISC-CONTRACT-FILE>}
├── [N] specs/apps/ose/{app-web,be,www}/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature,contracts/<DISC-CONTRACT-FILE>}
├── [N] specs/apps/rhino/cli/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature}
├── [N] specs/apps/wahidyankf/www/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature}
├── [D] specs/apps/{ayokoding,crane,organiclever,ose,rhino,wahidyankf}/{product,system-context,containers,components,behavior}/<DISC-LEGACY-SPEC-FILE>
├── [E] specs/libs/README.md
├── [N] specs/libs/{fsharp-crane-core,ts-env-loader,web-ui,web-ui-token}/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature}
├── [N] specs/libs/fsharp-env-loader/{README.md,architecture.md}
├── [N] specs/libs/fsharp-env-loader/behaviors/environment-loading.feature
├── [D] specs/libs/{fsharp-crane-core,ts-env-loader,web-ui,web-ui-token}/{product,system-context,containers,components,behavior}/<DISC-LEGACY-SPEC-FILE>
├── [D] specs/apps/organiclever/ddd/<DISC-DDD-SPEC-FILE>
├── [E] specs/apps/organiclever/components/app-web/component-web.md — remove its inbound
│       `bounded-contexts.yaml` source-of-truth link when that DDD tree is retired
├── [E] specs/apps/organiclever/containers/container.md — remove its inbound DDD-enforcement link
│       when that DDD tree is retired
├── [E] specs/apps/organiclever/{README.md,behavior/README.md,components/README.md,
│       components/app-web/{README.md,architecture.md},app-web/behaviors/README.md}
│       — remove live consumers of the retired DDD registry
├── [E] .claude/skills/apps-organiclever-www-developing-content/{SKILL.md,README.md,
│       reference/{README.md,bounded-context-architecture.md,common-patterns.md,domain-driven-design.md}}
│       — retire OrganicLever DDD registry guidance and preserve applicable layer guidance
├── [E] .claude/skills/{README.md,specs-scaffolding/reference/surface-profile-trees.md,
│       specs-validating-structure/reference/fixer-execution-and-safety.md}
│       — remove retired OrganicLever DDD registry consumers
├── [E] repo-governance/conventions/structure/specs-directory-structure/
│       deterministic-validation-allowlist-code-lang-multi-perspective-severity.md
│       — align the documented DDD-area default with `repo-config.yml`
├── [G] .agents/skills/<matching-non-vendored-.claude-sources> — regenerate canonical skill mirrors
├── [D] specs/apps/ose/ddd/<DISC-DDD-SPEC-FILE>
├── [D] specs/apps/rhino/cli/behaviors/ddd/<DISC-DDD-SPEC-FILE>
├── [D] specs/apps/rhino/cli/behaviors/specs/domain-coverage.feature
├── [E] repo-governance/development/infra/nx-targets.md
├── [E] repo-governance/development/infra/nx-targets/<DISC-RULE-FILE>.md
├── [E] repo-governance/development/quality/three-level-testing-standard.md
├── [E] repo-governance/development/quality/three-level-testing-standard/<DISC-RULE-FILE>.md
├── [E] repo-governance/development/quality/feature-change-completeness.md
├── [N] repo-governance/development/quality/code-coverage.md
├── [N] repo-governance/development/quality/gherkin-bdd-coverage.md
├── [E] repo-governance/conventions/structure/specs-directory-structure.md
├── [E] repo-governance/conventions/structure/specs-directory-structure/<DISC-RULE-FILE>.md
├── [E] repo-governance/conventions/structure/app-readme-vs-specs.md
├── [E] repo-governance/conventions/structure/app-readme-vs-specs/<DISC-RULE-FILE>.md
├── [E] repo-governance/development/pattern/<DISC-RULE-FILE>.md
├── [E] docs/explanation/software-engineering/<DISC-RULE-FILE>.md
├── [E] .github/workflows/<DISC-RULE-CONSUMER>.yml
├── [E] .husky/<DISC-RULE-CONSUMER>
├── [E] .claude/agents/{ci,repo,specs,swe}/<DISC-RULE-SOURCE>.md
├── [E] .claude/skills/{ci-standards,specs-scaffolding,specs-validating-structure,swe-developing-applications-common}/<DISC-RULE-SOURCE>.md
├── [G] .agents/<generated-from-admitted-.claude-source>
├── [G] .opencode/<generated-from-admitted-.claude-source>
├── [G] .codex/<generated-from-admitted-.claude-source>
├── [E] plans/in-progress/adopt-beavernest-test-automation/{README.md,brd.md,prd.md,delivery.md,learnings.md,tech-docs/*.md}
├── [N] plans/in-progress/adopt-beavernest-test-automation/implementation-notes.md — sole tracked sanitized evidence ledger
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/public/phase-0/{R-PUB,owners,corpus-ownership,delivery-splits}/<declared-file>
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/public/phase-0/registry/{registry-owner-projects.tsv,registry-delegate-projects.tsv,registry-behavior-free-projects.tsv,registry-project-closure.tsv,registry-project-closure.sha,nx-projects.txt}
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/public/prospective/<binding-from-62-row-catalog>/{allocation.txt,estimates.tsv}
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/public/{owners,rules,delivery,gates,orchestration,final,post-archive}/<resolver-declared-path>
├── [D] plans/in-progress/adopt-beavernest-test-automation/<13-plan-documents> — move sources from the preliminary allocation, including the three plan-state files
├── [N] plans/done/<completion-date>__adopt-beavernest-test-automation/<13-plan-documents> — actual destinations from `move.tsv`
├── [E] plans/in-progress/README.md
├── [E] plans/done/README.md
└── [N] generated-reports/rules-propagation__<uuid>__manifest.md
```

### OrganicLever DDD retirement sequential configuration allocation

Before the later Phase 4 registry-foundation edit, `D-P1-PUB` makes one exact `repo-config.yml`
change: remove `organiclever` from `specs.ddd-areas` when Phase 1 deletes its DDD tree. The
existing Phase 4 registry allocation retains the same path only for its later distinct foundation
change. This is bounded sequential shared plumbing, not shared ownership or an added delivery unit.

### FS-ENV finite delivery allocation

`D-O-PUB-FS-ENV` has exactly 17 implementation/configuration paths. This list is the Phase-0
allocation source of truth; it is not a glob and the executor may not append a discovered path at
runtime:

- Eight new fixtures under
  `apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-FS-ENV/`:
  `bootstrap-empty.json`, `active-empty.json`, `reverse-transition.json`,
  `mapping-mismatch.json`, `layout-misplaced.json`, `coverage-98.json`,
  `bdd-missing-step.json`, and `manifest-proxy.json`.
- Three new spec files: `specs/libs/fsharp-env-loader/README.md`,
  `specs/libs/fsharp-env-loader/architecture.md`, and
  `specs/libs/fsharp-env-loader/behaviors/environment-loading.feature`.
- One new driver:
  `libs/fsharp-env-loader/tests/unit/Behavior/FsharpEnvLoaderBehaviorDriver.fs`.
- Five existing implementation/configuration files:
  `libs/fsharp-env-loader/tests/unit/fsharp-env-loader-unit-tests.fsproj`,
  `libs/fsharp-env-loader/tests/unit/Tests/PortResolverTests.fs`,
  `libs/fsharp-env-loader/tests/unit/Tests/EnvTierTests.fs`,
  `libs/fsharp-env-loader/project.json`, and `repo-config.yml`.
  These paths form the cohesive implementation and consistency set. The delivery also updates
  `delivery.md` and `implementation-notes.md`, plus `learnings.md` only when a learning is recorded.
  No other tracked path below `libs/fsharp-env-loader/` changes:
  the Phase 8B terminal gate compares the committed, staged, unstaged, and untracked union below that
  root against the exact five library paths above. `package-lock.json`, the library README, source
  files, license, F# project, lint configuration, coverage output, runner configuration, and every
  other existing unit-test path must have zero diff. The complete delivery union must equal the 17
  implementation/configuration allocation rows plus those plan-state updates. A missing or additional
  row stops delivery until the plan is amended and the natural seam, internal consistency, and exact
  resulting `main` deployability are revalidated; the file count does not determine the boundary.

## The private sibling Root

```text
.
├── [E] repo-config.yml
├── [E] package.json
├── [E] package-lock.json
├── [E] nx.json
├── [E] AGENTS.md
├── [E] apps/rhino-cli/<DISC-SHARED-RHINO-FILE> — byte-identical parity manifest only
├── [N] apps/rhino-cli/src/RhinoCli.Application/src/TestContract.fs
├── [E] apps/rhino-cli/src/RhinoCli.Application/RhinoCli.Application.fsproj
├── [D] apps/rhino-cli/src/RhinoCli.Application/src/Ddd.fs
├── [E] apps/rhino-cli/src/RhinoCli.Application/src/RepoConfig.fs
├── [E] apps/rhino-cli/src/RhinoCli.Application/src/Specs.fs
├── [E] apps/rhino-cli/src/RhinoCli.Application/src/Glossary.fs
├── [N] apps/rhino-cli/src/RhinoCli.Application/src/TestContractBdd.fs
├── [N] apps/rhino-cli/src/RhinoCli.Application/src/TestContractCoverage.fs
├── [E] apps/rhino-cli/src/RhinoCli.Cli/src/Dispatch.fs
├── [E] apps/rhino-cli/src/RhinoCli.Cli/src/HelpText.fs
├── [D] apps/rhino-cli/src/tests/unit/Steps/DddSteps.fs
├── [D] apps/rhino-cli/src/tests/unit/ — move every remaining executable test to project-root `tests/unit/`
├── [N] apps/rhino-cli/tests/unit/RhinoCli.UnitTests.fsproj
├── [N] apps/rhino-cli/tests/unit/Steps/{GateDeclarationSteps,GlossarySteps,RepoConfigSteps,RepoConfigUnitTests,SpecsSteps,WaveEFDispatchUnitTests}.fs
├── [N] apps/rhino-cli/tests/unit/Steps/TestContractRegistryUnitTests.fs
├── [N] apps/rhino-cli/tests/unit/Steps/TestContractBddUnitTests.fs
├── [N] apps/rhino-cli/tests/unit/Steps/TestContractCoverageUnitTests.fs
├── [N] apps/rhino-cli/tests/unit/Steps/SpecsLogicalCorpusUnitTests.fs
├── [N] apps/rhino-cli/tests/unit/TestContractClosureUnitTests.fs
├── [N] apps/rhino-cli/tests/unit/Fixtures/TestContract/Closure/closure.json
├── [N] apps/rhino-cli/tests/unit/Fixtures/TestContract/{Bdd,Coverage,Layout,Manifest}/<named-case>.json
├── [N] apps/rhino-cli/tests/unit/Fixtures/SpecsLogicalCorpus/<named-case>.json
├── [N] apps/rhino-cli/tests/fixtures/test-contract/owners/{O-PRI-RHINO,O-PRI-TS-TOKEN,O-PRI-TS-UI}/{layout-misplaced,coverage-98,bdd-missing-step,manifest-proxy}.json
├── [E] apps/rhino-cli/src-fsharp/project.json — only when still present on current `origin/main`
├── [E] libs/{ts-ui,ts-ui-tokens}/project.json
├── [D] libs/{ts-ui,ts-ui-tokens}/package.json — only exact no-boundary Phase 0 subset
├── [E] libs/{ts-ui,ts-ui-tokens}/package.json — only retained direct-boundary subset
├── [N] apps/rhino-cli/tests/{unit,integration,e2e}/<DISC-TEST-FILE>
├── [N] libs/{ts-ui,ts-ui-tokens}/tests/{unit,integration,e2e}/<DISC-TEST-FILE>
├── [D] apps/rhino-cli/tests/ddd.rs
├── [D] specs/apps/rhino/cli/behaviors/ddd/<DISC-DDD-SPEC-FILE>
├── [D] specs/apps/rhino/cli/behaviors/specs/domain-coverage.feature
├── [N] specs/apps/rhino/cli/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature}
├── [N] specs/libs/{ts-ui,ts-ui-tokens}/{README.md,architecture.md,behaviors/<DISC-BEHAVIOR-FILE>.feature}
├── [D] specs/apps/rhino/{product,system-context,containers,components,behavior}/<DISC-LEGACY-SPEC-FILE>
├── [D] specs/libs/{ts-ui,ts-ui-tokens}/{product,system-context,containers,components,behavior}/<DISC-LEGACY-SPEC-FILE>
├── [E] repo-governance/development/{infra,quality,workflow}/<DISC-RULE-FILE>.md
├── [E] repo-governance/development/quality/three-level-testing-standard.md
├── [E] repo-governance/development/quality/three-level-testing-standard/<DISC-RULE-FILE>.md
├── [E] repo-governance/conventions/structure/<DISC-RULE-FILE>.md
├── [E] docs/explanation/software-engineering/<DISC-RULE-FILE>.md
├── [E] .github/workflows/<DISC-RULE-CONSUMER>.yml
├── [E] .husky/<DISC-RULE-CONSUMER>
├── [E] .claude/agents/{ci,repo,specs,swe}/<DISC-RULE-SOURCE>.md
├── [E] .claude/skills/{ci-standards,specs-scaffolding,specs-validating-structure,swe-developing-applications-common}/<DISC-RULE-SOURCE>.md
├── [G] .agents/<generated-from-admitted-.claude-source>
├── [G] .opencode/<generated-from-admitted-.claude-source>
├── [G] .codex/<generated-from-admitted-.claude-source>
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/private/phase-0/{R-PRI,owners,corpus-ownership,delivery-splits}/<declared-file>
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/private/phase-0/registry/{registry-owner-projects.tsv,registry-delegate-projects.tsv,registry-behavior-free-projects.tsv,registry-project-closure.tsv,registry-project-closure.sha,nx-projects.txt}
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/private/prospective/<binding-from-22-row-catalog>/{allocation.txt,estimates.tsv}
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/private/delivery/<binding-from-22-row-catalog>/{manifest.tsv,summary.md,<resolver-declared-path>}
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/evidence/runtime/private/{owners,rules,gates,final,post-archive}/<resolver-declared-path>
├── [N, ignored] local-tmp/adopt-beavernest-test-automation/public-export/<manifest-admitted-path>
└── [N] generated-reports/rules-propagation__<uuid>__manifest.md
```

## More Detail

### Bounded project discovery

`<DISC-PUBLIC-PROJECT-ROOT>` is not an authoring placeholder. Phase 0 materializes its finite values
by running `rtk nx show projects --json`, then `rtk nx show project <project-name> --json` once per
returned name and recording each `root` plus `projectFile` in
`local-tmp/adopt-beavernest-test-automation/evidence/runtime/<public|private>/phase-0/<R-PUB|R-PRI>/owner-ledger.md`.
The executor replaces no text in this document; later tasks read only those recorded finite rows. Public inferred
`organiclever-contracts` and `ose-contracts` are changed at their recorded Nx definition source.
Private transitional `rhino-cli-fsharp` is included only if private `origin/main` returns it. Any
project lacking a root/project-file row blocks implementation.

`<DISC-TEST-FILE>` is the exact output of
`rtk rg --files <recorded-project-root> | rtk rg '(^|/)(test|tests|__tests__)/'`, classified in the
owner ledger as executable unit, integration, E2E, or non-executable fixture/support before a move.
Every source appears once and has one exact destination. An unclassified or multiply classified
path blocks the delivery unit. `<DISC-NESTED-ROOT>` is the finite path segment immediately between
`src/` and an existing `__tests__/` path in that same output; it never authorizes a new directory.

`<DISC-PUBLIC-OWNER-ROOT>` is one exact public root from that same owner ledger.
`<DISC-OWNER-EDIT>` is limited to the exact existing runner/config/test/README files returned by
`rtk rg -l 'test|coverage|behavior|gherkin|project.json|package.json' <recorded-owner-root>` plus the
new test paths listed explicitly in the tree. The owner delivery packet saves this finite path list
before its RED step; any additional production path requires a plan amendment.

`<DISC-PUBLIC-OWNER-ID>` is bounded to the 14 public stable owner IDs other than `O-PUB-FS-ENV`
declared in `delivery.md`'s Stable Owner IDs table. Each such owner gets exactly the four named JSON
files in the tree. `O-PUB-FS-ENV` owns its complete eight-file bootstrap packet shown separately.
The three
private owner IDs are enumerated literally in the private tree. Phase 4 implements the single
fixture consumer specified in `target-contract-and-project-matrix.md`; no discovery glob, ad hoc
environment variable, or owner-specific parser may add another fixture path.

`<DISC-BEHAVIOR-FILE>`, `<DISC-CONTRACT-FILE>`, `<DISC-LEGACY-SPEC-FILE>`, and
`<DISC-DDD-SPEC-FILE>` are the exact relative **tracked** files recorded by
`rtk git ls-files -- specs/apps specs/libs | rtk sort -u` in the Phase 0 corpus and DDD ledgers.
This discovery includes tracked hidden files, and every source allocator must consume this same
source-of-truth list rather than a plain `rg --files` result. Every old path maps to one new
behavior/contract path or one deletion; new empty placeholders and unledgered files are forbidden.

`<DISC-SHARED-RHINO-FILE>` is a path in the finite shared-path parity manifest produced by
`rtk git ls-tree -r --name-only origin/main apps/rhino-cli` in each repository and intersected
byte-for-byte before Phase 3. The only bounded exception is the named private DDD-retirement test
source, its compile registration, and the resulting parity-manifest checksum delta, as recorded in
the Phase 0 delivery record. A private-only or public-only path outside that three-part exception
is not authorized by this marker.

`<DISC-RULE-FILE>`, `<DISC-RULE-CONSUMER>`, and `<DISC-RULE-SOURCE>` are finite, recorded paths,
not permission to edit a directory. Before the first rules-propagation edit in each repository, run
`rtk rg -l -i 'DDD|domain-driven|domain coverage|domain-coverage|test:quick|test:coverage|behavior:coverage|test:layout|package-manifest|specs:structure|C4' repo-governance docs/explanation/software-engineering .github/workflows .husky .claude/agents .claude/skills` and write its sorted output to that repository's ignored Phase 0
`local-tmp/adopt-beavernest-test-automation/evidence/runtime/<public|private>/phase-0/<R-PUB|R-PRI>/rules-subject-ledger.md`.
Classify every returned path as `edit`, `verified unchanged`, or `evict`
for one named rule subject before opening it for modification. `<DISC-RULE-FILE>` is restricted to
the recorded `repo-governance/**` and `docs/explanation/software-engineering/**` rows;
`<DISC-RULE-CONSUMER>` to recorded `.github/workflows/**` and `.husky/**` rows; and
`<DISC-RULE-SOURCE>` to recorded canonical `.claude/agents/**` and `.claude/skills/**` rows.
An empty result for a named subject, an unclassified match, or any path absent from this ledger
blocks the rules unit and requires a plan amendment rather than a broader glob.

`<binding-from-62-row-catalog>` and `<binding-from-22-row-catalog>` are not open globs: Phase 0
materializes their exact public and private binding rows, verifies the frozen split-file bijection,
and hashes each allocation and estimate. `<declared-file>` and `<resolver-declared-path>` mean only
the finite filenames assigned by the resolver table and concrete checklist task. The private
sanitized export contains only `<manifest-admitted-path>` rows recorded by Phase 21.

`<named-case>` is bounded to these new JSON fixture basenames; no runtime discovery may add another
case without a plan amendment:

- BDD: `missing-feature`, `missing-example`, `missing-scenario`, `missing-step`, `missing-binding`,
  `missing-owner-adapter`, `unused-binding`, `duplicate-binding`, `rounded-999-of-1000`.
- Coverage: `98-percent`, `missing-threshold`, `lower-threshold`, `conflicting-threshold`,
  `echo-placeholder`, `broad-exclusion`, `omitted-slice`, `overlapping-output`,
  `e2e-no-denominator`.
- Layout: `src-root`, `generic-test-root`, `dunder-tests-root`, `overlapping-runner`,
  `executable-support`.
- Manifest: `unclassified`, `no-consumer`, `forwarding-script`, `npm-prefix`, `proxy-script`,
  `deleted-dependency`.
- Specs logical corpus: `duplicate-owner`, `unowned-feature`, `stale-link`, `missing-entry`,
  `old-new-split`, `proposal-in-as-built-c4`.

### Phase 4 finite allocation

The following entries replace every Phase 4 `<named-case>` and governance placeholder. They are
the complete implementation/configuration allocations before the three public plan-state paths are
reserved. A shared plumbing path may occur in a later sequential leaf only where that leaf's
declared RED/GREEN changes it; it is never an unbounded ownership claim.

`D-P4-PUB-REGISTRY` and `D-P4-PRI-REGISTRY-PARITY` each contain exactly these eight paths:

```text
repo-config.yml
apps/rhino-cli/src/RhinoCli.Application/RhinoCli.Application.fsproj
apps/rhino-cli/src/RhinoCli.Application/src/RepoConfig.fs
apps/rhino-cli/src/RhinoCli.Application/src/TestContract.fs
apps/rhino-cli/src/RhinoCli.Cli/src/Dispatch.fs
apps/rhino-cli/src/RhinoCli.Cli/src/HelpText.fs
apps/rhino-cli/src/tests/unit/RhinoCli.UnitTests.fsproj
apps/rhino-cli/src/tests/unit/Steps/TestContractRegistryUnitTests.fs
```

`D-P4-PUB-BDD` contains exactly these fourteen paths:

```text
apps/rhino-cli/project.json
apps/rhino-cli/src/RhinoCli.Application/RhinoCli.Application.fsproj
apps/rhino-cli/src/RhinoCli.Application/src/TestContractBdd.fs
apps/rhino-cli/src/tests/unit/RhinoCli.UnitTests.fsproj
apps/rhino-cli/src/tests/unit/Steps/TestContractBddUnitTests.fs
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/missing-feature.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/missing-example.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/missing-scenario.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/missing-step.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/missing-binding.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/missing-owner-adapter.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/unused-binding.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/duplicate-binding.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Bdd/rounded-999-of-1000.json
```

`D-P4-PUB-COVERAGE` contains exactly these fourteen paths:

```text
apps/rhino-cli/project.json
apps/rhino-cli/src/RhinoCli.Application/RhinoCli.Application.fsproj
apps/rhino-cli/src/RhinoCli.Application/src/TestContractCoverage.fs
apps/rhino-cli/src/tests/unit/RhinoCli.UnitTests.fsproj
apps/rhino-cli/src/tests/unit/Steps/TestContractCoverageUnitTests.fs
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/98-percent.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/missing-threshold.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/lower-threshold.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/conflicting-threshold.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/echo-placeholder.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/broad-exclusion.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/omitted-slice.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/overlapping-output.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Coverage/e2e-no-denominator.json
```

`D-P4-PUB-LAYOUT-MANIFEST` contains exactly these fourteen paths:

```text
apps/rhino-cli/project.json
apps/rhino-cli/src/RhinoCli.Application/src/TestContract.fs
apps/rhino-cli/src/tests/unit/Steps/TestContractRegistryUnitTests.fs
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Layout/src-root.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Layout/generic-test-root.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Layout/dunder-tests-root.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Layout/overlapping-runner.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Layout/executable-support.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Manifest/unclassified.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Manifest/no-consumer.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Manifest/forwarding-script.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Manifest/npm-prefix.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Manifest/proxy-script.json
apps/rhino-cli/src/tests/unit/Fixtures/TestContract/Manifest/deleted-dependency.json
```

`D-P4-PUB-FIXTURES-A` contains exactly these sixteen complete owner-packet paths:

```text
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-CRANE/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-CRANE/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-CRANE/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-CRANE/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-FS-CORE/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-FS-CORE/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-FS-CORE/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-FS-CORE/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-RHINO/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-RHINO/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-RHINO/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-RHINO/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-TS-ENV/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-TS-ENV/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-TS-ENV/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-TS-ENV/manifest-proxy.json
```

`D-P4-PUB-FIXTURES-B` contains exactly these twenty complete owner-packet paths and carries its
finite complete-owner natural-seam exception:

```text
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-AYO/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-AYO/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-AYO/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-AYO/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WEB/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WEB/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WEB/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WEB/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WAHID/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WAHID/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WAHID/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WAHID/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-TOKEN/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-TOKEN/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-TOKEN/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-TOKEN/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-UI/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-UI/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-UI/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-WEB-UI/manifest-proxy.json
```

`D-P4-PUB-FIXTURES-C` contains exactly these twenty complete owner-packet paths and carries the
same finite complete-owner natural-seam exception:

```text
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-BE/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-BE/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-BE/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-BE/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WWW/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WWW/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WWW/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OL-WWW/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-BE/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-BE/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-BE/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-BE/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WEB/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WEB/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WEB/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WEB/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WWW/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WWW/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WWW/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PUB-OSE-WWW/manifest-proxy.json
```

Every public fixture entry is one of the four exact owner-fixture basenames in the owner RED
fixture injection contract; no FS-ENV path may appear in these three lists.

`D-P4-PRI-POLICY-PARITY` is the exact 38-path union of the 29 fixture paths listed for the three
public policy leaves above and these nine private shared paths:

```text
apps/rhino-cli/project.json
apps/rhino-cli/src/RhinoCli.Application/RhinoCli.Application.fsproj
apps/rhino-cli/src/RhinoCli.Application/src/TestContract.fs
apps/rhino-cli/src/RhinoCli.Application/src/TestContractBdd.fs
apps/rhino-cli/src/RhinoCli.Application/src/TestContractCoverage.fs
apps/rhino-cli/src/tests/unit/RhinoCli.UnitTests.fsproj
apps/rhino-cli/src/tests/unit/Steps/TestContractRegistryUnitTests.fs
apps/rhino-cli/src/tests/unit/Steps/TestContractBddUnitTests.fs
apps/rhino-cli/src/tests/unit/Steps/TestContractCoverageUnitTests.fs
```

This inventory is one natural cohesive private Phase 4 seam, alongside the public complete-owner
seams `D-P4-PUB-FIXTURES-B` and `D-P4-PUB-FIXTURES-C`. It keeps the byte-identical shared-foundation
parity proof and private test-project compile closure atomic after the four public leaves; it does
not repeat policy design. A partial port cannot prove the whole shared contract or leave the exact
resulting private `main` state immediately production-deployable. The path inventory is consistency
evidence, never a count-derived boundary.

`D-P4-PRI-FIXTURES` owns only these twelve repository paths; its compact manifest is ignored
evidence and is never a delivery path:

```text
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-RHINO/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-RHINO/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-RHINO/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-RHINO/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-TOKEN/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-TOKEN/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-TOKEN/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-TOKEN/manifest-proxy.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-UI/layout-misplaced.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-UI/coverage-98.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-UI/bdd-missing-step.json
apps/rhino-cli/tests/fixtures/test-contract/owners/O-PRI-TS-UI/manifest-proxy.json
```

The public governance list contains exactly these thirteen canonical paths; generated bindings are
derived from the two named `.claude/` sources and are accounted for by their generated-ownership
map, not hand-authored allocation rows:

```text
AGENTS.md
repo-governance/development/infra/nx-targets.md
repo-governance/development/infra/nx-targets/mandatory-targets-summary-matrix.md
repo-governance/development/quality/three-level-testing-standard.md
repo-governance/development/quality/feature-change-completeness.md
repo-governance/development/quality/code-coverage.md
repo-governance/development/quality/gherkin-bdd-coverage.md
repo-governance/conventions/structure/specs-directory-structure.md
repo-governance/conventions/structure/app-readme-vs-specs.md
docs/explanation/software-engineering/development/test-driven-development-tdd/three-tier-testing.md
.claude/agents/general/ci-checker.md
.claude/agents/general/ci-fixer.md
.claude/skills/ci-standards/SKILL.md
```

The private governance list has the same intent and count, with its repository-existing counterparts
for the two non-shared documents:

```text
AGENTS.md
repo-governance/development/infra/nx-targets.md
repo-governance/development/infra/nx-targets/mandatory-targets-by-project-type.md
repo-governance/development/quality/three-level-testing-standard.md
repo-governance/development/quality/feature-change-completeness.md
repo-governance/development/quality/code-coverage.md
repo-governance/development/quality/gherkin-bdd-coverage.md
repo-governance/conventions/structure/specs-directory-structure.md
repo-governance/conventions/structure/specs-directory-structure/enforcement-and-related.md
docs/explanation/software-engineering/development/test-driven-development-tdd/three-tier-testing.md
.claude/agents/general/ci-checker.md
.claude/agents/general/ci-fixer.md
.claude/skills/ci-standards/SKILL.md
```

### Bounded adapter edits

Each app/library glob is limited to existing test configuration, BDD drivers/bindings/support,
coverage configuration/exclusion manifests, project README target documentation, and the minimum
production seam required for testability.
Observable product changes require an explicit plan amendment and new PRD criterion.

### Test-root moves

The `[N]`/`[D]` test patterns apply only to executable tests owned by the per-repository matrices. Phase 0
records the exact source → one target-layer mapping before any move. Empty layer directories are not
created. Fixtures/support remain under named non-executable `tests/` siblings, and dedicated E2E
suites move to `tests/e2e/` inside their existing E2E project. Git-aware moves preserve history
where practical; runner globs, imports, configs, Nx inputs/outputs, and IDE settings change in the
same delivery unit.

### Package-manifest classification

The package globs are bounded to the 20 public and two private direct manifests listed in the
technical inventory; nested AyoKoding examples and generated/vendor manifests are excluded. Phase
0 partitions them per repository into two
exact, non-overlapping sets before editing:

- `[D]`: no publishing, package-resolution, deploy/build-tool, workspace dependency, or other
  direct consumer; move commands to `project.json`, relocate dependencies, and delete without a
  proxy;
- `[E]`: a direct consumer is proven; record it and retain only the required package fields.

No file can remain “undecided” at the package-manifest phase gate.

### DDD deletions

Every DDD-specific artifact under either repository's `specs/**` is deleted without a retention
classification. Outside specs, the classification test in [DDD Retirement](./ddd-retirement.md)
preserves production code, AyoKoding education, archived plans, and accurate generic guidance.

### Specs/C4 migration

The `[N]`/`[D]` pairs represent git-aware moves and consolidation from the five-folder tree into
logical owner entries. Preserve current as-built statements and diagram relationships unless
evidence marks them stale or duplicated. Optional contract paths are created only for the surface
that currently owns a contract; braces do not authorize empty placeholder directories.

### Generated bindings

Edit only canonical `.claude/` sources, then run `rtk npm run generate:bindings`. Generated mirrors
must remain byte-synchronized; no mirror is hand-authored.

### Rules propagation and C4

Testing-target and specs conventions trigger the rules-propagation workflow and manifest. C4 is
applicable to the specs-document organization even though deployed topology does not change:
execution moves/reconciles existing as-built models, validates canonical indexes/diagrams, and
repairs stale DDD links without inventing topology.

### Recovery disposition

No destructive persisted-product-data migration exists. The repository registry/config schema uses
explicit per-project transition state until closure. DDD deletion is git-recoverable and isolated
to its delivery unit; test migration rolls back per project family, not by reverting other families.
