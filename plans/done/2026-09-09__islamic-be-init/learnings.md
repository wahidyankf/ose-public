# Learnings — islamic-be-init

Transient running log. Append an entry the moment something generalizable is noticed during
execution — never reconstruct this file from memory afterwards. The Knowledge Capture phase
(`delivery.md` Phase 7) drains it before archival, and nothing durable may depend on it surviving.

## Format

Each entry records what was observed, why it generalizes beyond this plan, and — once Phase 7 runs —
its terminal disposition.

```markdown
### <short title>

- **Observed**: <what happened, with the file or command that surfaced it>
- **Generalizes because**: <why this matters outside this plan>
- **Disposition**: _pending Phase 7_
```

## Entries

### Pre-execution: Go was half-provisioned, and the gap was invisible

- **Observed**: `Brewfile`, `repo-config.yml`'s gofmt gates, `scripts/verify-gofmt.sh`, and
  `rhino-cli`'s `TestCoverage.Format.Go` all survived the deletion of `a-demo-be-golang-gin`, while
  the CI job, the behaviour-coverage extractor, the tag vocabulary, and the env scanner did not.
  Nothing in the repository reported the partial state.
- **Generalizes because**: deleting the last project in a language leaves orphaned platform
  machinery that reads as working support. A future language removal or reintroduction faces the
  same trap, and a `lang:` value with no CI job routes silently into another language's job rather
  than failing loudly.
- **Disposition**: **Reported without plan authorization.** The instance is closed — Go now has a CI
  job, a binding-extractor arm, a coverage-threshold arm, a tag value, a Doctor row, and an
  env-scanner arm. The general claim needs two mechanisms this plan may not build: a
  language-removal checklist, and an assertion that every `lang:` value in use resolves to exactly
  one CI job. Both are `.github/workflows/` and `repo-config.yml` changes, so the code-routing
  downstream rule holds them for an authorized delivery. Handoff evidence: this entry plus
  "deleting a language job leaves its exclusion hole behind" below — the same defect with the arrow
  reversed.

### Pre-execution: exclude-list CI routing fails open, not closed

- **Observed**: `pr-quality-gate.yml`'s `typescript` (`:302`), `dotnet` (`:334`), and `flutter`
  (`:358`) jobs select projects by _excluding_ known language tags rather than _including_ their
  own. An unrecognised `lang:` value is therefore picked up by all three jobs instead of none. The
  first draft of this plan said "two jobs"; reading all three `--exclude` lists against the current
  commit corrected it.
- **Generalizes because**: this is a fail-open default in a merge-blocking gate. Any future language
  addition inherits the same defect unless the selection is inverted to an allowlist.
- **Disposition**: **Reported without plan authorization**, consolidated into the confirmation entry
  below, which carries the handoff. Kept separate because this one is the prediction and the next is
  the measurement; collapsing them would erase the evidence that the cost function is real.

### Pre-execution: the fail-open prediction was confirmed within a day

- **Observed**: the entry above predicted that "any future language addition inherits the same
  defect unless the selection is inverted to an allowlist." `lms-init` DU2 then merged as #493 and
  did exactly that. It added `tag:lang:java` to the three existing jobs — closing the Java leak —
  and added a new `java` job that also selects by exclusion, naming `ts,fsharp,csharp,rust,dart`
  and no `go` (`pr-quality-gate.yml:377`). The Go leak went from three jobs to four as a direct
  consequence of fixing the Java leak.
- **Generalizes because**: the exclusion strategy has a cost function nobody is paying attention
  to. Each language added costs every _future_ language one more exclusion entry, so the work grows
  quadratically while looking linear at each step. Five jobs now need editing to add language six.
  The fix — invert to `--projects=tag:lang:<x>` per job — is small, but it is invisible from inside
  any single language plan, because each plan only ever sees "add my tag to N lists" and N looks
  manageable.
- **Why this plan does not fix it**: changing the selection strategy for five jobs is a
  quality-surface refactor, not a Go lane. Doing it here would couple an unrelated structural change
  to a new-app delivery. Recorded for Phase 7 routing instead.
- **Disposition**: **Reported without plan authorization.** The home is
  `.github/workflows/pr-quality-gate.yml`, which the code-routing downstream rule keeps out of an
  inline landing. Handoff evidence, sufficient to execute without rediscovery: replace each language
  job's `--exclude=tag:lang:...` list with `--projects=tag:lang:<own>`; the five jobs are
  `typescript`, `dotnet`, `flutter`, `java`, and `go`; the same inversion simultaneously closes the
  latent `tag:lang:rust` hole and the untagged-project hole recorded in the two entries below, so
  all three defects have one fix.

### Pre-execution: two same-shaped plans collide on one generated parity file

- **Observed**: `lms-init` and `islamic-be-init` are both "teach the monorepo a language, then ship
  an app on it" plans. They overlap in six files, five of which rebase mechanically. The sixth,
  `apps/rhino-cli/parity-manifest.sha256`, is generated from staged bytes and regenerated by both
  plans in two repositories each — so concurrent parity PR pairs can produce a transient one-sided
  state that reddens the nightly audit for reasons unrelated to either change.
- **Generalizes because**: overlap analysis between plans usually stops at "which files does each
  touch". That is insufficient when a shared file is _generated from_ the others: the conflict is
  not textual and does not surface as a merge conflict. Any two plans touching the parity boundary
  need a sequencing constraint, not a rebase.
- **Disposition**: **Reported without plan authorization.** The multi-repo parity workflow now
  carries the per-file byte-identity check (see the DU5 entry below), but not this one: a
  _cross-plan_ sequencing constraint on the parity boundary is a different rule from anything the
  workflow states today, and writing it needs a decision about who owns arbitration between two
  concurrent plans — not a call this plan gets to make alone. Handoff evidence: `lms-init` and
  `islamic-be-init` overlapped on six files, five of which rebased mechanically; only
  `apps/rhino-cli/parity-manifest.sha256` could not, because it is generated from the others and
  regenerated by both plans in two repositories each.

### Pre-execution: reading a sibling plan found a defect self-review had not

- **Observed**: the "which CI jobs sweep an unknown language in" error above survived this plan's own
  authoring and its draft PR. It was found by diffing conventions against `lms-init` (PR #487),
  which had enumerated all three jobs correctly.
- **Generalizes because**: a sibling plan solving the same problem for a different input is a
  stronger review instrument than re-reading one's own plan, because it independently re-derives the
  same repository facts. Where two plans exist for one problem shape, cross-reading them should be a
  named step rather than an accident.
- **Disposition**: **Reported without plan authorization.** The litmus test is what decides this:
  prose telling an author to cross-read a sibling plan would not be caught by anything next time.
  The version that would is a `plan-checker` rule — when another plan in `plans/in-progress/` shares
  a problem shape, require the new plan to state what it took from it — and that is an agent
  definition plus its generated mirrors, a governance delivery of its own. Handoff evidence: this
  plan's three-jobs-not-two error survived its own authoring and its draft PR, and fell to one diff
  against `lms-init` (PR #487).

### Pre-execution: a dependency verified by commit title is not verified

- **Observed**: `lms-init` DU1 and DU2 landed as `c6fffc3` and #493, whose titles read exactly like
  the prerequisites. Reading the tree instead of the titles confirmed both — and found that DU2 had
  also widened this plan's CI defect from three jobs to four, which no commit title mentioned.
- **Generalizes because**: an upstream dependency check that greps merge history proves the work
  was _named_, not that it left the shape the downstream plan assumed. Phase 0 checks should assert
  against files and line numbers, which is why this plan's Upstream Verification lists
  `RepoConfig.fs:284` and `behaviour-coverage.mjs:302` rather than PR numbers alone.
- **Disposition**: **Reported without plan authorization**, same home and same reason as the entry
  above: the mechanism that would catch it is a `plan-checker` rule requiring an Upstream
  Verification section to cite file paths and line numbers rather than PR numbers. Handoff evidence:
  this plan's own Upstream Verification cites `RepoConfig.fs:284` and `behaviour-coverage.mjs:302`,
  and that is what caught DU2 widening the CI defect from three jobs to four — something no commit
  title mentioned.

### DU1: a controlled vocabulary with no gate is not controlled

- **Observed**: the rules-propagation preflight for admitting `go`/`gin`/`islamic` found no rule
  contradicting the amendment, but did find the vocabulary itself out of sync with the tags projects
  declare. `lang:` omits `fsharp` (five projects, the second most-used value) while listing `dotnet`
  (unused in `ose-public`); `platform:` omits `giraffe` (`ose-be`, `organiclever-be`) while listing
  `axum` (unused); `domain:` omits `config` (`ts-env-loader`, `fsharp-env-loader`). Meanwhile
  `pr-quality-gate.yml` excludes `tag:lang:fsharp`, `tag:lang:csharp`, and `tag:lang:dart` — three
  values the convention never admits.
- **Enforcement disposition**: **unenforced by decision.** No `repo-config.yml` gate, `rhino-cli`
  subcommand, or script validates `project.json` tags against the scheme. The drift is the direct
  consequence.
- **Generalizes because**: a document that calls its list "controlled" states an invariant. With no
  gate, the claim decays silently in the one direction nobody reads — new tags get added to
  `project.json`, never back to the table. Either arm a check or drop the word.
- **Disposition**: **Reported without plan authorization.** Enforcement disposition recorded above:
  **unenforced by decision**. Arming a validator that checks `project.json` tags against the scheme
  is an `apps/rhino-cli` change, and it would fail immediately on three pre-existing gaps, coupling
  a repo-wide correction to a Go lane. Handoff evidence: `lang:` omits `fsharp` and lists unused
  `dotnet`; `platform:` omits `giraffe` and lists unused `axum`; `domain:` omits `config`; and
  `pr-quality-gate.yml` excludes three values the convention never admits.

### DU1: untagged projects fail open in exactly the way this plan is fixing

- **Observed**: `specs/apps/ose/be/contracts/project.json` and its `organiclever` counterpart declare
  no `tags` at all, though the convention requires `type:` and `domain:` always. Because every
  language job in `pr-quality-gate.yml` selects by _excluding_ known `tag:lang:` values, a project
  with no tags is excluded by nothing and runs its targets in **every** language job — the same
  fail-open shape this plan's DU1 fixes for `lang:go`, reached by a different route.
- **Generalizes because**: an exclusion-based selector treats "tag absent" and "tag unknown"
  identically. Both fail open. Auditing for unknown tags is not enough; the audit has to cover
  untagged projects too.
- **Disposition**: **Reported without plan authorization**, consolidated into the CI-selection
  handoff above — inverting the selection closes this without a separate fix. Handoff evidence: the
  two live instances are `specs/apps/ose/be/contracts/project.json` and its `organiclever`
  counterpart. Neither is this plan's to tag; `islamic-contracts` ships with
  `["type:lib", "domain:islamic"]` so it does not join them.

### DU1: a gate's command shape is a claim about the tool, and it was wrong

- **Observed**: the plan specified `command: golangci-lint run` behind `scope: affected-file-type,
glob: "*.go"`, by analogy with `shellcheck` and `format-verify-gofmt`. The analogy does not hold.
  Probing 2.11.3 showed `golangci-lint run pkg/a/a.go pkg/b/b.go` exits **7** with `named files must
all be in one directory`, and invoking it where there is no `go.mod` exits **5** with `no go files
to analyze`. Both were certain to fire — the first on any commit touching two Go packages, the
  second on every run, since the gate invokes from the repository root.
- **Generalizes because**: `scope: affected-file-type` is a promise that the tool accepts an
  arbitrary flat file list from the repository root. `shellcheck` and `gofmt` honour it because they
  work file-at-a-time; a package-oriented tool cannot. Adding a gate for an unfamiliar linter should
  begin by running it against a two-directory input, not by copying the nearest entry.
- **Disposition**: **Reported without plan authorization**, consolidated with "a gate's invocation
  shape is part of its contract" below — one subject, two symptoms. The instance is fixed here by
  `scripts/lint-golangci.sh`, following the `scripts/verify-gofmt.sh` precedent. The general rule —
  probe an unfamiliar tool against a two-directory input before claiming `scope:
affected-file-type` — has no non-code home today: the gate schema is documented in
  `repo-config.yml`'s own comment block, so stating it durably means editing that schema, which
  belongs to a gate-machinery delivery. Handoff evidence: golangci-lint 2.11.3 exits 7 with `named
files must all be in one directory` and 5 with `no go files to analyze`.

### DU1: the config-driven doctor inventory reaches further than D-9 claimed

- **Observed**: D-9 justified `doctor.extra-tools` as a way to get a `go` row without a `rhino-cli`
  edit. It turned out to do more: `repo-config validate` rejected `lint-golangci` with `unknown
Doctor tool "golangci-lint"` until the linter was declared there too. So `extra-tools` also
  satisfies a gate's `doctor-tools:` dependency — meaning a new gate can declare an unknown external
  tool without touching F# at all. Two tools registered, still zero `rhino-cli` diff.
- **Generalizes because**: a decision record predicts a benefit from a mechanism's stated purpose.
  Executing it measures the mechanism's actual reach, which can be larger. Worth re-reading D-9's
  cost/benefit line against what shipped rather than leaving the smaller claim standing.
- **Disposition**: **Routed inline** to
  [Tool Inventory](../../../repo-governance/workflows/infra/development-environment-setup/tool-inventory.md),
  which now records that a gate's `doctor-tools:` dependency resolves against the same closed set —
  so declaring a tool under `doctor.extra-tools` is what lets a new gate depend on an external
  binary with no `apps/rhino-cli` change. The same pass corrected three claims this plan
  falsified: that the repository declares no extra tools, that Go is not checked by Doctor, and — in
  [Phase 4](../../../repo-governance/workflows/infra/development-environment-setup/phase-4-go-ecosystem.md)
  — that Go is a formatter-only dependency with no `go.mod` pinning a version. Correcting doc drift
  a delivery unit created is ordinary execution, not a deferred learning.

### DU1: the leak gate caught what every deterministic gate had passed

- **Observed**: PR #488 was green across `pr-quality-gate` on three successive heads. The focused
  leak review then found this machine's absolute worktree path in 126 lines of committed evidence
  and in five `delivery.md` steps. No Prettier, markdownlint, or word-budget check looks for it.
- **Generalizes because**: captured tool output is the natural carrier for machine-specific paths,
  and evidence files are exactly where a plan is encouraged to paste raw captures. Sanitizing the
  prefix at capture time — rather than at review time — costs nothing and removes a whole finding
  class. Worth a Phase 7 proposal: have the evidence-capture step pipe through a prefix rewrite.
- **Disposition**: **Reported without plan authorization.** Sanitizing the worktree prefix at
  capture time rather than at review time is the right shape, but there is nothing to edit that
  would make the next plan inherit it: the capture step lives in each plan's own delivery checklist,
  not in a shared script. Making it automatic means a capture helper — new tooling, and a delivery
  of its own. Handoff evidence: 126 lines across `evidence/` plus five `delivery.md` steps on PR
  #488, all found by the leak review after three green `pr-quality-gate` runs on three heads.

### DU1: deleting a language job leaves its exclusion hole behind

- **Observed**: measuring the exclusion matrix across all six `--exclude` lists in
  `pr-quality-gate.yml` showed every language appearing in every list but its own job's — except
  `tag:lang:rust`, which appears in four of six. Its job was deleted in Phase 9d and
  `tag:lang:rust` was never added to `dotnet`'s two lists, so a `lang:rust` project would run in the
  `dotnet` job on a runner with no Rust toolchain. Latent, not live: no project carries `lang:rust`
  today, `rhino-cli` having moved to `lang:fsharp`.
- **Generalizes because**: adding a language means touching N places; **removing** one means the
  opposite — every other job's exclude list still names it, and the deleted job's absence turns
  "excluded everywhere but its own job" into "runs nowhere it should, somewhere it shouldn't". The
  removal checklist is not the addition checklist reversed.
- **Disposition**: **Reported without plan authorization**, consolidated into the CI-selection
  handoff above. Latent, not live: no project carries `lang:rust` today. Handoff evidence:
  `tag:lang:rust` appears in four of six `--exclude` lists, missing from `dotnet`'s two, because the
  Rust job was deleted in Phase 9d and the reverse checklist was never run.

### DU1: `doctor-tools:` provisions unconditionally, but gates run file-scoped

- **Observed**: `lint-golangci` is scoped `affected-file-type, glob: "*.go"`, so on a PR with no Go
  files the gate never runs. Its `doctor-tools: [golangci-lint]` was still enforced: the `gate`
  matrix job provisions the union of a group's declared tools **before** any gate runs and without
  consulting file scope, so CI went red demanding a linter it had no reason to invoke.
- **Generalizes because**: two different scopes are in play and only one is visible at the
  declaration site. A gate entry reads as "this tool is needed when this gate runs"; the
  provisioning step reads it as "this tool is needed whenever this group runs". Adding
  `doctor-tools:` to a narrowly-scoped gate therefore widens a requirement far past the gate — and
  the cost lands on every unrelated PR, not on the Go PRs the gate was written for.
- **Second-order**: the tool must be installable on **every** platform the group's CI runs on, not
  just the author's. A correct decision to omit `apt` — Debian's package is 1.x, which cannot read a
  `version: "2"` config — became a total absence of a Linux path.
- **Disposition**: **Reported without plan authorization.** Resolved in-flight for this lane by
  provisioning the `lint` group properly. The general fix — intersect provisioning with a gate's
  declared file scope, so a dormant gate costs nothing — spans `apps/rhino-cli` and
  `.github/workflows/`, both code. Handoff evidence: `lint-golangci` is scoped `affected-file-type,
glob: "*.go"`, yet its `doctor-tools: [golangci-lint]` is provisioned on every PR the `lint` group
  runs on, and the tool must therefore be installable on every platform that group runs on.

### DU1/DU2: an `all-file-type` gate makes the working tree part of the delivery unit

- **Observed**: DU1's push was rejected by `md-links` for four broken links **in DU2's files**.
  DU2's specs corpus was prepared in the same worktree while DU1's PR was in flight, and it links to
  `apps/islamic-be`, which DU3 creates. The links were correct-in-intent and unresolvable-in-fact.
  Nothing in DU1's own diff was wrong.
- **Generalizes twice over**:
  1. A gate declared `scope: all-file-type` reads the whole tree, not the change. Preparing a later
     delivery unit's files in the same worktree therefore puts them on the current unit's critical
     path — a cost that is invisible until the push is rejected. One worktree per plan is a cap on
     concurrency, not just on disk.
  2. A specs corpus written to the house shape always cross-links to its implementing project. When
     the corpus lands in an earlier delivery unit than the project, that link cannot be written yet.
     **The link belongs to the DU that makes it resolvable**, not to the DU that wants it.
- **Disposition**: **Routed inline** to
  [Delivery Checklists Express a DAG](../../../repo-governance/conventions/structure/plans/delivery-checklists-express-a-dag.md),
  which now states that a declaration belongs to the delivery unit that makes it resolvable, names
  both mechanisms that make a backwards edge unavoidable — an `all-file-type` gate reading the whole
  working tree, and a validator reading a declaration literally — and forbids the three silencing
  remedies. The rule is stated once there and covers the DU3 adapter case below as well.

### DU1: a conflicted PR emits no CI at all, which is not the same as a slow CI

- **Observed**: two pushes to `islamic-be-init/du1-go-lane` produced **zero** workflow runs. Not
  queued, not failed — absent. `gh run list` showed nothing newer than the first commit's run, so
  the obvious reading was "still queued" and the obvious response was to keep waiting. Both wrong.
- **Cause**: `origin/main` had advanced to #495, which touched the same three files DU1 touches, so
  PR #496 went to `mergeStateStatus: DIRTY`. GitHub builds `refs/pull/<n>/merge` before dispatching
  a `pull_request` event; for a conflicted PR that ref cannot be constructed, so `synchronize` never
  fires. The moment the rebase landed, `DIRTY` became `BLOCKED` and both workflows dispatched
  within seconds — the causal link is not inferred, it was observed.
- **Generalizes**: "no run exists for this SHA" and "the run for this SHA has not finished" look
  identical in `gh run list` and mean opposite things. Only the first is actionable by the author.
  A CI poll keyed on _run status_ cannot distinguish them, because there is no run to have a status.
- **Disposition**: **Routed inline** to
  [Application in Plan Execution (Step 2c)](../../../repo-governance/development/workflow/ci-monitoring/application-in-plan-execution-step-2c.md),
  which now requires asserting that a run exists for the pinned head before waiting on that run's
  conclusion, and gives the two commands that separate "conflicted, dispatches nothing" from "queued
  and slow".

### DU2: three incompatible shapes for `contracts/generated/` now coexist

- **Observed**: `ose-be` tracks `openapi-bundled.{yaml,json}` **and** a hand-written README, though
  its own README claims the folder is gitignored. `ose-lms-be` — landed by #495 mid-flight — ignores
  `generated/` wholesale and carries no README. This plan's checkbox names a README explicitly,
  producing a third shape: `generated/*` ignored by glob, README negated back in.
- **Why the third shape is the one to keep**: a bare `generated/` ignore cannot un-ignore a child,
  so lms-be's form permanently forecloses documenting the folder; and tracking build output as
  `ose-be` does invites bundle-vs-source drift that no gate currently detects.
- **Generalizes**: a convention that is only ever expressed as copied precedent, never as a rule,
  will fork silently every time two delivery units run concurrently. Neither author was careless —
  there was simply nothing to be wrong against.
- **Disposition**: **Reported without plan authorization.** Recorded, not resolved: reconciling
  `ose-be`, `ose-lms-be`, and `islamic-be` on one shape means editing two apps this plan does not
  own, and choosing between them is a convention decision, not an execution one. Handoff evidence:
  `ose-be` tracks bundled output plus a README while its own README claims the folder is ignored;
  `ose-lms-be` ignores `generated/` wholesale, which permanently forecloses documenting the folder
  because a bare directory ignore cannot un-ignore a child; `islamic-be` ignores by glob and negates
  the README back in, which is the only one of the three that keeps both properties.

### DU3: a validator can read a language without being able to gate it

- **Observed**: DU1 extended `behaviour-coverage.mjs` to extract Godog bindings from `.go` files,
  and every DU1 gate passed. DU3 then failed on `owner test:unit must enforce at least 99% line
coverage` — with a real, demonstrated 100% floor in place. `unitLineCoverageThreshold` recognises
  vitest, Coverlet, the XPlat collector, and JaCoCo; it had no Go arm.
- **Generalizes**: adding a language to a validator has **two** independent halves — _reading_ the
  language's binding syntax, and _recognising_ the language's gate declarations. They live in
  different functions, and passing the first tells you nothing about the second. DU1's own tests
  could not have caught this: there was no Go project yet to declare a floor.
- **Also**: the four existing arms are all toolchain-specific because each language's coverage gate
  is expressed in its build tool's own flags. Go has no equivalent, so the floor lives in a repo
  script — which is exactly the case where the threshold could vanish from the command surface.
  Requiring both a script marker and a `COVERAGE_MINIMUM` flag keeps the number reviewable.
- **Disposition**: **Reported without plan authorization.** Resolved in-flight by TDD — the Go arm
  of `unitLineCoverageThreshold` shipped in DU3. The general rule (admitting a language to the
  binding extractor obliges a threshold arm in the same change, or the gap surfaces only when that
  language's first project tries to ship) belongs in `scripts/behaviour-coverage.mjs` and its test
  suite, which is code. Handoff evidence: DU1 passed every gate it had while leaving
  `unitLineCoverageThreshold` blind to Go, and DU1's own tests could not have caught it because no
  Go project existed yet to declare a floor.

### DU3: the plan required two things that could not both be true

- **Observed**: the plan's DU3 checkbox required `behaviour-coverage.json` to declare `unit` **and**
  `e2e` adapters; its Phase 3 Gate required `islamic-be:test:quick` to exit zero; and its Pause
  Safety note stated `test:coverage:e2e` would report unbound scenarios until Phase 4. The middle
  requirement is unsatisfiable given the other two, because `islamic-be-e2e` does not exist until
  DU4. The failure was concrete, not theoretical: `E2E driver does not exist`.
- **Generalizes**: a plan that sequences a producer after a consumer will encode the contradiction
  in whichever artefact declares the dependency — the adapter map here, a Markdown link earlier in
  this same plan. Both were fixed by the same rule: **the declaration belongs to the delivery unit
  that makes it resolvable.** That rule is worth stating once rather than rediscovering per artefact.
- **What made it dangerous**: three ways to make the gate green were available and all were wrong —
  an `@e2e-exempt` tag, an `allowedUnbound` entry, or dropping `test:coverage` from `test:quick`.
  Each silences a validator that is telling the truth. The scenarios really do need E2E proof; it
  simply arrives in DU4.
- **Disposition**: **Routed inline**, as the second instance of the rule now stated at
  [Delivery Checklists Express a DAG](../../../repo-governance/conventions/structure/plans/delivery-checklists-express-a-dag.md)
  — a declaration belongs to the delivery unit that makes it resolvable. That entry's inline note
  covers this one; recorded separately because the two instances differ in artefact (a Markdown link
  versus an adapter map) and only the pair shows the rule is not about links. The three tempting
  green-makers — an `@e2e-exempt` tag, an `allowedUnbound` entry, dropping `test:coverage` from
  `test:quick` — are named in the durable rule as forbidden.

### DU3: a gate's invocation shape is part of its contract

- **Observed**: `apps/islamic-be/tools.go` carried the conventional `//go:build tools` pin. Local
  `nx run islamic-be:lint` — `golangci-lint run` over `./...` — reported zero issues. CI's `lint`
  group failed with `typechecking error: build constraints exclude all Go files in
apps/islamic-be`. Same source tree, same linter, same version; the gate passes an explicit
  per-directory list derived from the changed files, and `./...` silently skips a directory whose
  files are all build-excluded while a named directory becomes a hard typecheck failure.
- **Generalizes because**: "it passes locally" is only evidence about the shape you ran. A gate that
  computes its own argument list from a diff is a _different program_ from the whole-tree
  invocation a developer runs, and the difference is invisible until a file exists that the two
  shapes disagree about. Every changed-file-driven gate in this repository has this property.
- **What the fix had to cover**: the instance (drop `tools.go` for Go 1.24+'s `tool` directive, so
  the module root holds no `.go` files at all) and the class (`scripts/lint-golangci.sh` now drops
  directories `go list -e` reports with zero `GoFiles` and zero `TestGoFiles`). Fixing only the
  instance would have re-armed the trap for the first `//go:build linux` file anyone adds.
- **Also**: the class fix was proven by planting a `//go:build neverbuilt` probe package and
  watching the wrapper report `0 issues.` at exit 0, then removing it. A guard asserted but never
  fired against is not a guard.
- **Disposition**: **Reported without plan authorization**, carrying the consolidated handoff for
  itself and "a gate's command shape is a claim about the tool" above. Both halves are fixed here:
  the instance by dropping `tools.go` for Go 1.24+'s `tool` directive, and the class by
  `scripts/lint-golangci.sh` dropping directories `go list -e` reports with zero `GoFiles` and zero
  `TestGoFiles`. The durable proposal — exercise every changed-file-driven gate once against a
  deliberately awkward input before it lands — needs the gate schema to carry the obligation, which
  is a `repo-config.yml` and `apps/rhino-cli` delivery. Handoff evidence: the class fix was proven
  by planting a `//go:build neverbuilt` probe package and watching the wrapper report `0 issues.`
  at exit 0.

### DU3: a gate that runs on a clean checkout cannot depend on a gitignored artefact

- **Observed**: `internal/router/router.go` imports the module's own generated contract types.
  `nx run islamic-be:lint` passes, because the target declares `dependsOn: ["codegen"]`. CI's
  `lint` gate group fails with `could not import .../generated-contracts`, because that job invokes
  the gate binary directly — no Nx graph, no `dependsOn`, and `generated-contracts/` is gitignored
  by repository-wide convention.
- **Generalizes because**: the repository has two ways to run the same predicate — through the Nx
  target graph, and through the flat gate registry — and only one of them materializes derived
  inputs. Any gate whose tool typechecks (golangci-lint, `tsc`, a compiler-backed linter) inherits
  this the moment its language's project generates code. The pre-commit surface hides it
  permanently: a developer's working tree already holds the generated output, so the gate can be
  red on every clean checkout and green on every machine that has ever built the project.
- **What made the fix non-obvious**: three tempting shortcuts were all wrong. Committing the
  generated file breaks the repository-wide `generated-contracts/` convention. Dropping the gate's
  `ci` surface deletes coverage of Go files no Nx project owns. Narrowing its glob to skip the
  module is a silent exemption. The honest fix was to provision the job properly — give the `lint`
  group the `setup-go` composite and one `nx affected -t codegen` scoped to Go projects — which
  removes no gate and weakens nothing.
- **Also**: the hand-rolled `go install golangci-lint` step in that job predated `setup-go`, which
  already pins the same version. Fixing the provisioning gap also deleted the duplicate.
- **Disposition**: **Reported without plan authorization.** Resolved in-flight by giving the `lint`
  group the `setup-go` composite and one `nx affected -t codegen` scoped to Go projects — which also
  deleted a hand-rolled `go install` step that `setup-go` already covered. The durable proposal —
  require a gate declaring a `ci` surface to state whether its inputs are all tracked — is a
  `repo-config.yml` schema change. Handoff evidence: the pre-commit surface hides this class
  permanently, because a developer's working tree already holds the generated output, so such a gate
  can be red on every clean checkout and green on every machine that has ever built the project.

### Incidental: the pre-commit surface never lints workflow files

- **Observed**: committing a change to `.github/workflows/pr-quality-gate.yml` printed
  `Skipping gate actionlint` and `Skipping gate artifact-retention`. Reproduced deliberately with
  `GATE_CHANGED_BASE=HEAD~1 rhino-bin.sh gate run --surface=pre-commit` against a commit that
  changes exactly that file: both gates skip. Both declare
  `glob: ".github/workflows/*.{yml,yaml}"`, and every other pre-commit glob in `repo-config.yml`
  is basename-only (`*.go`, `*.md`, `*.{ex,exs}`), so the matcher most likely does not handle a
  path-bearing pattern.
- **Not caused by this plan**: both gates predate it; DU1 added only `lint-golangci`. Recorded
  because it was found here, not because it belongs here.
- **Why it stayed invisible**: both gates also declare `ci: { scope: all-file-type }`, so CI's
  `shell-docker-actions` group lints every workflow on every PR regardless. The pre-commit half
  has been dead without any red signal — the CI half covers for it.
- **Generalizes because**: a gate declared on two surfaces can be silently dead on one of them.
  Nothing asserts that a declared surface actually resolves any file, so a glob the matcher cannot
  interpret degrades to "always skip" rather than to an error.
- **Disposition**: **Reported without plan authorization.** Not caused by this plan — both gates
  predate it, and DU1 added only `lint-golangci`. Correcting the matcher or the glob is a
  gate-machinery change. Handoff evidence: reproduced deliberately with
  `GATE_CHANGED_BASE=HEAD~1 rhino-bin.sh gate run --surface=pre-commit` against a commit changing
  exactly `.github/workflows/pr-quality-gate.yml`; both `actionlint` and `artifact-retention` print
  `Skipping gate`. Every other pre-commit glob in `repo-config.yml` is basename-only, and the CI
  half (`scope: all-file-type`) has been covering for the dead pre-commit half with no red signal.

### DU4: an E2E suite that reuses a listener proves nothing about the build

- **Observed**: `apps/islamic-be-e2e` initially copied `ose-be-e2e`'s `ensureBackendStarted`, which
  starts the service only `if (!(await endpointResponds()))`. Three health scenarios passed. Then a
  deliberate mutation — `StatusHealthy` changed from `"healthy"` to `"ok"` — **also** reported three
  green scenarios. A stray `islamic-be` from the DU3 manual health check had held port 8402 since
  the previous day, so the harness never spawned the binary it had just built and every assertion
  ran against day-old code.
- **Generalizes because**: "reuse whatever answers on the port" is a convenience that silently
  converts an E2E suite into a test of _some_ process rather than _the_ process. It fails open, and
  it fails open in exactly the situation where a developer is most likely to have a stray server
  running — while iterating on the service. Every project that copies this shape inherits it;
  `ose-be-e2e`, `organiclever-be-e2e`, and the other backend suites all carry the same predicate.
- **The fix that generalizes**: reuse only a process the harness itself started and still owns, and
  treat a foreign listener as a hard error with an actionable message. Targeting a real deployed
  environment is a different intent and already has a different door — `API_BASE_URL`.
- **The deeper lesson is about method, not ports**: the passing run was captured as evidence before
  the mutation was tried. Had the mutation step been skipped — and nothing in the checklist demanded
  it — this suite would have shipped green, permanently unable to fail, with a captured artefact
  "proving" it worked. A green test is a claim about the test, not about the code, until it has been
  shown to go red.
- **Disposition**: **Split, both halves terminal.** The method half is **routed inline** to
  [The Red-Green-Refactor Cycle](../../../repo-governance/development/workflow/test-driven-development/the-red-green-refactor-cycle.md),
  which now requires a new harness to be driven red deliberately before it is trusted, and requires
  the red run to be the captured evidence rather than the green one. The port half is **reported
  without plan authorization**: `ose-be-e2e`, `organiclever-be-e2e`, and the other backend suites
  all carry the same `if (!(await endpointResponds()))` predicate, and they are not this plan's to
  change. Handoff evidence: with a stray `islamic-be` holding port 8402, mutating `StatusHealthy`
  from `"healthy"` to `"ok"` still reported three green scenarios.

### DU5: a static env scanner needs the key literal to be reachable, and Go hid it

- **Observed**: `tech-docs.md` specified `scanGoReads` as two regexes matching `os.Getenv("K")` and
  `os.LookupEnv("K")`. Run against the real `apps/islamic-be`, that pair returns **zero** keys.
  `main.go` passes `os.LookupEnv` as a _function value_ into a pure resolver, and the key lives in
  `const PortVariable = "ISLAMIC_BE_PORT"`, consumed as `lookup(PortVariable)`. No literal ever
  appears at a call site.
- **Why it nearly became a suppressed gate**: the failure would not have surfaced until DU6
  registered the surface, and it would have surfaced as `ISLAMIC_BE_PORT` reported
  declared-but-unread. The obvious remedy at that moment — add it to the surface `allowlist:` — would
  have silenced a drift detector on a variable that is genuinely read. The allowlist is for keys that
  are legitimately not read; using it for keys the scanner merely cannot see converts a correctness
  gate into decoration.
- **The repo had already solved it, in F#**: `ose-be`'s `Program.fs` has the identical
  dependency-injection shape, and `Env.fs` handles it with a _second_ regex,
  `fsharpReaderWrapperRegex`, matching the reader identifier immediately followed by the key literal.
  The convention is not "call the reader directly" but "make the key visible at the composition
  root". Go simply had no expression of that convention yet.
- **Generalizes because**: any static scanner over a language that supports passing functions as
  values will miss dependency-injected reads. Injecting the reader is _good_ design — it is what
  lets `ResolvePort` be Unit-tested without touching the OS — so the scanner must meet the codebase
  where good design puts it, rather than the codebase degrading to direct calls to stay visible.
- **Disposition**: **Routed inline** to
  [`rhino-cli env` Toolchain](../../../repo-governance/conventions/security/secrets-and-env-standards/rhino-cli-env-toolchain.md),
  which now states that `env validate` is a static scanner, that the convention is to keep the key
  literal at the composition root beside the reader rather than to call the reader directly, and
  that `allowlist:` must never be used to silence a key the scanner merely cannot see. Both code
  halves shipped: DU5 added the third regex, DU6 gave `ResolvePort` a key parameter.

### DU5: believe the discovery step over the plan's own layer wording

- **Observed**: the plan said to add `scanGoReads` cases "to the RhinoCli **unit** test project
  beside the existing `scanFsharpReads` cases", and in the same breath prescribed the grep that
  locates them. The grep proves every `scanFsharpReads`, `scanRustReads`, and `scanTsReads` case
  lives in the **integration** project — correctly, since they read the real filesystem and the
  functions carry `[<ExcludeFromCodeCoverage>]`.
- **Generalizes because**: when a plan names both a layer and a landmark, the landmark is evidence
  and the layer is an assumption. Following the layer would have put a filesystem-touching test in
  the Unit adapter, violating the Test Boundaries rule to satisfy a sentence.
- **What the contract actually wanted**: both layers. Unit binds the scenario through the pure
  `validateAppKeys` with injected lists; Integration exercises the real scanner against a temp
  directory; E2E drives it across the published CLI boundary. Three adapters, one scenario.
- **Disposition**: **Discarded.** The existing conventions were right and were followed; the error
  was one sentence in this plan, already corrected in flight. Nothing would be caught next time by
  routing it, because no mechanism can tell a plan's landmark from its layer label — which is what
  the litmus test asks. The three-adapter outcome it describes is already required by the BDD
  contract.

### DU5: "Nx detected a flaky task" can mean a missing dependency

- **Observed**: `rhino-cli:test:coverage:unit` failed in the private-sibling worktree with
  `ERR_MODULE_NOT_FOUND: @cucumber/gherkin`, then passed after `npm install`. Nx saw one task hash
  produce two outcomes and labelled it flaky.
- **Why it matters here**: the repo rule is to fix a flaky test at its root cause and never retry
  around it. Taking the label at face value would have started a hunt for nondeterminism in a
  validator that has none. The root cause was an unprovisioned worktree; `node_modules` is not a
  declared Nx input, so the hash could not distinguish the two runs.
- **Generalizes because**: the flaky label describes the _observation history of a task hash_, not a
  property of the test. Before treating one as a defect, check whether something outside the declared
  inputs changed between the two runs — a fresh worktree, a toolchain install, a cache wipe.
  Confirmed stable here by running the validator three times at exit zero.
- **Disposition**: **Routed inline**, to two surfaces. The binding rule went to
  [Flaky tests are defects](../../../repo-governance/development/workflow/test-driven-development/flaky-tests-are-defects.md),
  which now requires naming what changed outside Nx's declared inputs before the flake rule applies
  — the rule binds on "the same code", and a task hash does not establish that. The symptom went to
  [What Goes Wrong Without Both Steps](../../../repo-governance/development/workflow/worktree-setup/what-goes-wrong-and-nx-node-modules-dependency.md),
  which already owned the `node_modules`/Nx-cache subject but never named the label it surfaces
  under. Neither weakens the never-retry rule: both point at a root cause instead of past one.

### DU5: a manifest-covered change opens a divergence window until both PRs land

- **Observed**: `Env.fs` and `env-validate-app-drift.feature` are inside
  `apps/rhino-cli/parity-manifest.sha256`, which the `parity manifest validate` gate enforces in both
  repositories. Changing them in `ose-public` alone makes the private sibling's manifest stale the moment
  the public PR merges.
- **The obligation**: the two PRs are one delivery unit with two heads. Both must be opened
  cross-referencing each other and merged in the same session; neither is independently shippable,
  and stopping between them leaves the private sibling red on a gate it did nothing to break.
- **Mechanical detail worth keeping**: `parity manifest generate` reads the **git index**, not the
  worktree — it refuses to run while a covered file is unstaged. So the sequence is stage the source
  edits, generate, stage the manifest, commit as one. Regenerating before staging cannot work.
- **Also worth keeping**: the four `EnvValidate*` test files were byte-identical across the two
  repositories at HEAD even though `tests/**` sits _outside_ the manifest, so they were carried
  byte-for-byte rather than re-formatted per repo. Two `Doctor*` test files do diverge, so
  "outside the manifest" must be checked per file, not assumed either way.
- **Disposition**: **Routed inline**, one half; the rest discarded as already documented. The
  paired-PR obligation and the generate-reads-the-git-index detail were both already stated at
  [Step 4 — Execution Phase (continued)](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning-and-execution/step-4-execution-phase-continued.md),
  so re-recording them would have been theatre. What was missing is now added there: byte-identity is
  a per-file fact, so a path outside the manifest must be diffed rather than assumed either way —
  the four `EnvValidate*` files were identical across repos while two `Doctor*` files beside them
  were not.

### DU5/DU6: parallel agents sharing one scratchpad corrupted a posted review

- **Observed**: the two DU5 leak reviews were launched concurrently, one per repository. Both wrote
  their review body to the same generic filename in the shared session scratchpad. One overwrote the
  other between write and read, and `ose-public#500` was briefly posted with `<private-sibling>#169`'s
  marker — wrong repository, wrong PR number, wrong head SHA.
- **How it was caught**: the agent read back what it had posted instead of trusting the API call's
  exit status, spotted the mismatch, rewrote the body to a uniquely-named file, verified the content
  in the same step, and `PATCH`ed the review. An independent check afterwards confirmed each PR holds
  exactly one review with its own correct coordinates and `pass` 0/0/0.
- **Generalizes because**: the scratchpad is documented as session-isolated, which is true — but
  "session" includes every concurrently running subagent. Isolation from _other sessions_ is not
  isolation from _your own fan-out_. Any generic filename (`review-body.md`, `out.json`, `tmp.txt`)
  is a shared mutable global the moment two agents run at once.
- **Why it mattered here specifically**: the corrupted artefact was a _merge precondition_. A leak
  review carrying the wrong `head_sha` is not merely untidy — it is evidence for a commit nobody
  reviewed, and the merge protocol would have accepted it if the marker had happened to name the
  right head. Read-back verification is what separated "posted" from "posted correctly".
- **This was an orchestration error, not an agent defect**: the two agents were told to work
  concurrently and given no distinct working paths. Either sequence them, or hand each a
  task-unique directory.
- **Disposition**: **Routed inline** to
  [Anti-Patterns — Batching and Stuck-Detection Mistakes](../../../repo-governance/development/agents/subagent-orchestration/anti-patterns-batching-and-detection.md)
  as a fifth anti-pattern: handing concurrent agents the same working filename. It carries both
  fixes — a task-unique path per concurrently-running agent, and read-back verification rather than
  exit-status trust for anything posted to an external system — and states why it matters more than
  untidiness when the artefact is a merge precondition. The orchestration error was mine, not the
  agents'.
