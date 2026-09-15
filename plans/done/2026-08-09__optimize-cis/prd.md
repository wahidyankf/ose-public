# Product Requirements — Optimize CIs

## Product Overview

The "product" here is the quality-gate lifecycle itself: the three Husky hooks, the generated
`lint-staged` block, and the `pr-quality-gate` workflow, all dispatching through
[`apps/rhino-cli`](../../../apps/rhino-cli/README.md).

This plan changes **how gates are invoked and scheduled**, never **what they check**. Every user
story below is a latency, cost, or footprint story; none adds or removes a validator.

**Not UI-bearing** — no user-facing screen or component under `apps/` or `libs/` changes, so the
UI-design-funnel binding does not apply. **Not learning-bearing** — no course or curriculum content is
authored, so the syllabus-record binding does not apply.

## Personas

### P1 — The solo maintainer

Works across four repos, often with several agent sessions running concurrently on the same disk and
the same shared cargo target cache. Commits frequently and in small increments per Trunk Based
Development. Feels the gate cost most acutely on documentation and governance edits, where a 3.5 s
commit tax dwarfs the edit itself.

**Needs**: a commit that feels instant for doc-shaped changes; a push that does not invite
context-switching; confidence that speed did not come out of coverage.

### P2 — An AI agent executing a plan

Runs unattended, commits often, and multiplies every fixed cost by the parallel fan-out (N=3 default)
and by the three PR-review cycles. Cannot judge whether a slow gate is broken or merely slow, and has
a standing instruction never to bypass gates.

**Needs**: gates fast enough that a normal run never looks hung; a clear failing gate id even when
checks are grouped; a binary that resolves correctly after the ambient sweeper deletes `target/`.

### P3 — The CI runner pool

Four repos share a limited pool — free `ubuntu-latest` for three, a small self-hosted pool for
the private sibling where job queueing already runs at p50 18:42. Every unnecessary job is contention
imposed on the other three repos.

**Needs**: fewer, denser jobs; no job that installs a toolchain it never uses.

## User Stories

### US-1 — Fast doc commits

**As** the solo maintainer, **I want** a markdown-only commit to complete in well under half a
second, **so that** documentation work does not carry a tax larger than the edit.

### US-2 — Fast pre-push

**As** the solo maintainer, **I want** `test:quick` on `rhino-cli` to finish in about a minute and a
half, **so that** pushing is not a decision I have to schedule around.

### US-3 — Cheap PR gate

**As** the CI runner pool, **I want** the PR quality gate to consume roughly a third of today's
runner-seconds for the same coverage, **so that** four repos can share one pool without queueing each
other out.

### US-4 — Provably unchanged coverage

**As** the solo maintainer, **I want** machine-checkable proof that the same set of gates runs before
and after, **so that** I can accept a large speedup without wondering what it cost me.

### US-5 — Diagnosable grouped failures

**As** an AI agent, **I want** a failing grouped CI job to name the individual gate that failed, **so
that** grouping does not make failures harder to act on.

### US-6 — A binary that always resolves

**As** an AI agent, **I want** gate invocation to work even immediately after the ambient sweeper
deletes `target/`, **so that** a swept artifact produces a slow run, never a broken hook.

### US-7 — Bounded disk

**As** the solo maintainer, **I want** build artifacts and scratch space to stay bounded, **so that**
the working set does not creep back to 28 GB.

### US-8 — A registry that still tells the truth

**As** the solo maintainer, **I want** CI job composition declared in `repo-config.yml` rather than
hand-maintained in a workflow file, **so that** the registry cannot drift from what CI actually runs.

### US-9 — One Rust version

**As** the solo maintainer, **I want** exactly one Rust version declared across every repo and
installed on my machine, **so that** `doctor` reporting healthy actually means my environment matches
what builds, and CI stops installing toolchains it never uses.

## Acceptance Criteria

### AC-1 — Pre-commit latency (US-1)

```gherkin
Scenario: A markdown-only commit completes well under half a second
  Given ten markdown files are staged in a clean worktree
  When the lint-staged pre-commit path runs to completion
  Then the mean wall time over three runs is at most 900 milliseconds
  And every markdown gate that ran at the Phase 0 baseline has run again
  And no gate reports a different result than it did at baseline
```

### AC-2 — Pre-push latency (US-2)

```gherkin
Scenario: The rhino-cli pre-push gate finishes in about ninety seconds
  Given a cold Nx cache and an empty cargo target directory
  When "npx nx run rhino-cli:test:quick --skip-nx-cache" runs to completion
  Then the mean wall time over two runs is at most 90 seconds
  And the list of executed test names is identical to the Phase 0 capture
```

### AC-3 — PR gate cost (US-3)

```gherkin
Scenario: The PR quality gate costs roughly a third of its former runner-seconds
  Given five completed pr-quality-gate runs after the topology change
  When each run's job durations are summed from the GitHub Actions jobs API
  Then the median total is at most 3500 runner-seconds
  And the median wall-clock duration is no greater than the Phase 0 baseline
```

### AC-4 — Coverage invariance (US-4)

```gherkin
Scenario: Every gate that ran before still runs after
  Given the Phase 0 capture of executed gate ids for every surface
  When the gate set is enumerated again after all axes have landed
  Then the set of gate ids for each of pre-commit, pre-push, commit-msg, and ci is byte-identical to the capture
  And the union of gate ids across all CI groups equals the former per-gate matrix list
```

### AC-5 — No gate may escape the matrix (US-4, US-8)

```gherkin
Scenario: A gate declared without a CI group fails validation
  Given a gate entry in repo-config.yml carrying a ci surface and no ci_group field
  When "rhino-cli gate validate" runs
  Then it exits non-zero
  And its output names the offending gate id
  And its output states that ci_group is required
```

### AC-6 — Grouped failures stay diagnosable (US-5)

```gherkin
Scenario: A failing gate inside a group is named in the output
  Given a CI group containing several gates where exactly one fails
  When "rhino-cli gate run --surface=ci --group=<id>" runs
  Then it exits non-zero
  And its output contains a per-gate summary line for every gate in the group
  And the failing gate id appears on a line marked FAIL
```

### AC-7 — Binary resolution survives the sweeper (US-6)

```gherkin
Scenario: A swept target directory produces a slow run, not a failure
  Given the rhino-cli binary is absent because the ambient sweeper removed target/
  When a generated gate command runs through the resolver shim
  Then the shim builds the binary and then executes the requested gate
  And the gate reports the same result it would have reported with the binary present
  And a subsequent invocation reuses the built binary without rebuilding
```

### AC-8 — Explicit override is honoured (US-6)

```gherkin
Scenario: RHINO_CLI_BIN takes precedence over discovery
  Given the environment variable RHINO_CLI_BIN points at an executable rhino-cli binary
  When a generated gate command runs through the resolver shim
  Then the shim executes the binary at that path
  And it performs no cargo build
```

### AC-9 — CI gate jobs need no Rust toolchain (US-3)

```gherkin
Scenario: Gate group jobs consume a prebuilt binary
  Given the build-rhino job has published the rhino-cli artifact for the run
  When a gate group job executes
  Then it downloads the artifact rather than building from source
  And it runs no cargo install command
  And its step list contains no Rust toolchain setup
```

### AC-10 — Node setup is skipped where unused (US-3)

```gherkin
Scenario: A gate group with no node tooling skips npm ci
  Given a CI gate group whose gates require no node-resolved tool
  When that group's job executes
  Then its step list contains no npm ci invocation
  And every gate in the group still reports its baseline result
```

### AC-11 — Cache stays under the ceiling (US-7)

```gherkin
Scenario: The Nx cache key stops minting an entry per commit
  Given ten consecutive commits have been pushed after the cache-key change
  When the repository's Actions caches are enumerated
  Then the summed cache size is at most 60 percent of the 10 GiB ceiling
  And no single key family accounts for more than half of the total
```

### AC-12 — Build footprint (US-7)

```gherkin
Scenario: One test:quick run no longer produces 2.7 GB of build output
  Given an empty isolated cargo target directory
  When "nx run rhino-cli:test:quick" runs to completion
  Then the resulting target directory is at most 1.2 gigabytes
  And the test-name list is identical to the Phase 0 capture
```

### AC-13 — Coverage enforcement is relocated, not weakened (US-4)

```gherkin
Scenario: Coverage still gates merge after moving off test:quick
  Given test:coverage no longer runs as part of the test:quick chain
  When the PR quality gate runs on a change that drops line coverage below ninety percent
  Then the coverage job fails
  And the overall quality-gate job reports failure
```

### AC-14 — Disk hygiene is encoded (US-7)

```gherkin
Scenario: Scratch space cannot silently regrow
  Given local-temp has been reclaimed to its post-cleanup size
  When the recorded retention rule is applied
  Then content older than the retention window is removed
  And no tracked file, .env file, generated-report, worktree, or git ref is touched
```

### AC-15 — Cross-repo parity holds (US-8)

```gherkin
Scenario: The byte-identity gate passes after propagation
  Given the change set has been propagated to ose-primer and private-sibling
  When "rhino-cli parity manifest validate" runs in each of the three repos
  Then each run exits zero
  And the reported manifest hash is identical across all three
```

### AC-16 — Generated rhino-cli commands carry no `cargo run` (US-1)

```gherkin
Scenario: Rhino CLI kind renders a resolver shim invocation
  Given the registry declares a gate of kind "rhino-cli" on surface "pre-commit"
  When "rhino-cli gate emit --surface=pre-commit" runs
  Then the generated command invokes the resolver shim at "apps/rhino-cli/scripts/rhino-bin.sh"
  And the generated command contains no "cargo run" substring
```

### AC-17 — Node-resolved tools render a repository-local bin path (US-1)

```gherkin
Scenario: Node-resolved external tools render a repository-local bin path
  Given the registry declares an external gate whose tool resolves from node_modules
  When "rhino-cli gate emit --surface=pre-commit" runs
  Then the generated command invokes that tool through "node_modules/.bin"
  And the generated command contains no "npx" substring
```

### AC-18 — CI gates can be enumerated by declared group (US-8)

```gherkin
Scenario: Enumeration can group CI gates by declared group
  Given every ci-surface gate in the registry declares a ci_group
  When "rhino-cli gate list --surface=ci --format=json --by-group" runs
  Then it emits one entry per distinct ci_group value
  And each entry lists its member gate ids in registry declaration order
```

### AC-19 — Every repo declares one Rust version (US-9)

> **`.feature` binding note.** AC-20 describes `rhino-cli` application behavior (what `doctor`
> reports) and is bound to `specs/apps/rhino/behavior/rhino-cli/gherkin/system/doctor.feature` with a
> RED/GREEN/REFACTOR cycle in `delivery.md` Phase 4. AC-19 and AC-21 describe cross-repo file-content
> and machine-toolchain state, not `rhino-cli` behavior — there is no `rhino-cli` command whose
> output these scenarios assert against, so they are verified directly by shell commands in
> `delivery.md`'s Phase 4/10 gates instead of a `.feature` file. This mirrors how the plan already
> treats other non-application-behavior criteria (e.g. AC-14's disk-retention rule, prose-only).

```gherkin
Scenario: Toolchain channel and MSRV agree within a repo
  Given a repository among ose-public, ose-primer, and private-sibling
  When every rust-toolchain.toml channel and every Cargo.toml rust-version is collected
  Then both sets contain exactly one distinct value
  And that value is the same in both sets
```

### AC-20 — The environment check validates the channel, not the floor (US-9)

```gherkin
Scenario: doctor compares rustc against the toolchain that builds
  Given the installed rustc differs from the pinned rust-toolchain.toml channel
  When "npm run doctor" runs
  Then it reports the Rust toolchain as mismatched
  And it names the pinned channel as the expected value
```

### AC-21 — No unpinned toolchain remains installed (US-9)

```gherkin
Scenario: Installed toolchains are limited to those the repos pin
  Given the set of channels pinned by rust-toolchain.toml across the three repos
  When "rustup toolchain list" is compared against that set
  Then every installed toolchain appears in the pinned set or is the retained stable default
  And a rebuild of rhino-cli succeeds without fetching an absent toolchain
```

## Product Scope

### In scope

- Invocation form of every generated gate command (hooks, `lint-staged`, CI).
- CI job composition and the registry field that declares it.
- Cargo profile selection for gate-path builds.
- Composition of the `test:quick` chain.
- Build-artifact and scratch-space retention.
- Propagation of the above across the repos each parity boundary requires.

### Out of scope

- The identity, logic, or strictness of any individual validator.
- New `rhino-cli` subcommands or flags beyond those DD-3/DD-4 require (`--by-group`, `--group`).
- The `TypeScript quality gate`'s real `nx affected` work.
- `rhino-cli` type-safety hardening (`indexing_slicing`, `arithmetic_side_effects`).
- Any language rewrite.

## Product Risks

| Risk                                              | Mitigation                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Grouping changes failure ergonomics for the worse | AC-6 makes per-gate PASS/FAIL output a hard acceptance criterion, not a nicety                    |
| A fast path is taken that quietly skips work      | AC-2, AC-4, and AC-12 all assert the executed set is unchanged, so a "speedup" by omission fails  |
| The shim adds a new failure mode on a hot path    | AC-7 and AC-8 cover both the swept-artifact and override paths with their own scenarios and tests |
| Wall-clock regresses while runner-seconds improve | AC-3 carries wall-clock as an explicit no-regression clause alongside the cost target             |
