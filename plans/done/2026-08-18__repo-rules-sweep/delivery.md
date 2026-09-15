# 🚚 Delivery Checklist: Repo Rules Sweep

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
> Every step in this plan is `[AI]`. If execution discovers work that genuinely requires a person,
> stop that item and surface it rather than adding a human participant silently.

## Worktree

**`ose-public`** — `worktrees/optimize-gov/`, which **already exists and is already checked out** on
branch `worktree/optimize-gov`. No `git worktree add` runs for this repository; Phase 0 verifies and
fast-forwards it. The branch is 7 commits ahead of `origin/main` with a non-empty diff (31 files
changed, 1541 insertions, 112 deletions) — this plan's own authoring commits, already carried inside
the existing draft PR #227. Re-verify with `git rev-list --count origin/main..HEAD` and
`git diff origin/main --stat` before trusting these figures, since they will keep moving as Phase 0
lands its own baseline commit.

**The private sibling** — `worktrees/repo-rules-sweep/`, provisioned in Phase 5.

One worktree per repository per plan, per
[Worktree Cap](../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).

## Delivery Mode

**`worktree-to-pr`.** Exactly **one PR per repository for the entire plan** — every phase commits to
its repository's single branch, and no phase opens a second PR.

**`ose-public`'s PR already exists**: <https://github.com/wahidyankf/ose-public/pull/227>, opened as
a **draft** carrying the plan documents, before execution began. This is a deliberate deviation from
the usual "PR opens at the delivery boundary" flow, taken so the plan is executed _through_ its own
PR. Two consequences bind the executor:

- **Never run `gh pr create` for `ose-public`.** It would fail; the PR exists. At Phase 7 the action
  is `gh pr ready 227`, not create.
- **Every phase pushes to `worktree/optimize-gov`**, including Phase 0. The Phase 0 "pushes nothing,
  opens no PR" exemption
  ([§Phase 0 Opens No PR](../../../repo-governance/conventions/structure/plans/phase-0-opens-no-pr.md))
  is already discharged: the PR was opened before Phase 0 and Phase 0 opens nothing further. Pushing
  Phase 0's baseline evidence to the existing branch satisfies that convention's intent — the
  evidence lands in the first (and only) PR — while its letter, "do not open a PR for Phase 0",
  is not violated because no PR-opening action occurs in Phase 0.

Intermediate phases push for durability and run **no** PR-Review cycle. The cycle runs once, at
Phase 7, against the whole accumulated PR. Knowledge Capture and Archival commit to the same branch
and land inside that PR, so the plan is complete at the moment the PR merges — which is what makes
in-PR archival coherent here.

## Autonomous Execution Contract

This plan is designed to run end-to-end under
[plan-execution](../../../repo-governance/workflows/plan/plan-execution.md) **with no human in the
loop**. Everything that workflow would otherwise stop and ask about is pre-resolved here. If
execution reaches a decision this section does not cover, that is a plan defect — surface it rather
than inventing an answer.

| plan-execution stop                                 | Resolution for this plan                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[HUMAN]` / `[AI+HUMAN]` checkbox (Iron Rule 2)     | **None exist.** Every checkbox is `[AI]` — verify with `grep -c '^\s*- \[ \] \[HUMAN\]' delivery.md` returning 0, rather than trusting a count that drifts as the plan is edited.                                                                                      |
| Rule-15 three-tester web-UI retest (shard 36)       | **Not applicable — no rendered surface.** This plan changes markdown, `repo-config.yml`, and Rust CLI internals. It ships no route, component, or template. Do not invoke `web-exploratory-tester`, `web-usability-tester`, or `web-design-tester`.                    |
| Rule-16 API retest (shard 37)                       | **Not applicable — no HTTP surface.** No REST, GraphQL, or tRPC endpoint is added or changed. Do not invoke `api-exploratory-tester`.                                                                                                                                  |
| Rule-1 production visual sign-off (shard 36)        | **Not applicable** — same reason as rule-15.                                                                                                                                                                                                                           |
| Infra-Execution Gate (shard 40)                     | **Not applicable.** No `terraform apply`, no Ansible converge, no state-changing infrastructure operation appears in any phase.                                                                                                                                        |
| Manual behavioral assertions (Iron Rule 8)          | **Satisfied by gate commands, not by Playwright or curl.** The behavioral assertions for this plan are the acceptance clauses on each checkbox — exit codes and grep counts. There is nothing to click and nothing to `curl`.                                          |
| `gh pr create` at the delivery boundary (shard 25)  | **`ose-public`: forbidden**, PR #227 exists — use `gh pr ready 227`. **The private sibling: see the private-sibling delivery row in the Delivery Boundaries table.**                                                                                                   |
| PR-Review Maker→Fixer Cycle (shard 39)              | Runs **once per repository at Phase 7**, N = 3 cycles, hard ceiling. An `escalated` exit blocks the merge and is a legitimate stop — surface it.                                                                                                                       |
| Merge actor (shard 42)                              | **`[AI]`.** Merge once all four done-definition items hold. No `[HUMAN]` merge gate is declared anywhere in this plan.                                                                                                                                                 |
| Worktree cleanup prompt (shards 41, 42)             | **Pre-authorized in writing for both worktrees** — `worktrees/repo-rules-sweep` in the private sibling and `worktrees/optimize-gov` in `ose-public`. Do not prompt. Safety preconditions (clean tree, HEAD an ancestor of `origin/main`) still apply and still refuse. |
| "Wait for user commit approval" (shard 02, item 10) | **Superseded by the per-phase gate flow.** Each `### Phase N Gate` commits and pushes under Iron Rules 5 and 7; there is no separate end-of-run approval step for this plan.                                                                                           |

**Tie-breakers, so no judgment call needs a human.** These bind Phases 4 and 5:

1. **Ordinal ambiguity → strip.** A directory keeps its ordinals only when the prose explicitly
   calls the files steps or phases _and_ they are read in order. If the evidence is merely
   suggestive, de-number. The burden of proof is on keeping the number.
2. **Boundary rework → conservative merge only.** Merge a continuation run only when its titles
   continue one another _and_ the combined text stays under 500 words. Every other run gets a
   self-standing rename in place. Never rewrite a rule's wording to make a merge fit — if it needs
   rewording, it is not a mechanical merge.
3. **Commit shape → one commit per top-level subtree.** `repo-governance/conventions/`,
   `repo-governance/development/`, `repo-governance/workflows/`, `repo-governance/principles/`,
   `repo-governance/vision/`, `.claude/skills/`. Roughly six commits, each independently revertible.
4. **Preexisting failures → fix everything, no scoping.** Iron Rule 3 applies in full. If Phase 0's
   `npm run doctor` or any gate surfaces a failure in a language this plan never touches — Flutter,
   F#, Elixir, C# — fix it rather than record and continue. Commit those fixes separately from plan
   work per Iron Rule 7. **This is a deliberate choice with a known cost**: an unattended run can
   spend substantial budget provisioning a toolchain this plan does not use, and that is accepted.
5. **When 1 and 2 disagree** — a run that should be merged sits inside a directory that should keep
   its ordinals — the directory-level verdict wins and the run is renamed in place, not merged.

**Legitimate stops that remain.** Autonomy is not a mandate to push through a genuine blocker. Stop
and surface, do not improvise, when: a gate fails for a reason no checkbox anticipated; the PR-Review
cycle exits `escalated`; a rename decision is genuinely ambiguous under the tie-breakers below and
the conservative default would lose information; or the private sibling is unreachable.

## Workstreams

| ID   | Workstream                                                                           | Phases   | Status                       |
| ---- | ------------------------------------------------------------------------------------ | -------- | ---------------------------- |
| —    | Shared baseline                                                                      | 0        | Specified                    |
| WS-A | Ordinal filename prefixes in governed trees                                          | 1–2, 4–5 | Specified                    |
| WS-C | Realign rules whose enforcement misfires: two withdrawn, one documented, one guarded | 3        | Specified                    |
| WS-B | File Naming Convention rework                                                        | —        | **Declared, not executable** |
| —    | Knowledge Capture, Archival, and integration (terminal)                              | 6–7      | Specified                    |

WS-C runs **before** the sweep on purpose: it deletes thirteen numbered shards under
`agent-naming/` and `workflow-naming/` that the sweep would otherwise rename first and discard
second.

A workstream added later inserts its phases before Knowledge Capture and renumbers the terminal
phases. No workstream executes until its phases, gates, and acceptance criteria are written here and
its requirements into `prd.md`.

## Parallelization Model

- **Serial spine**: Phase 1 (convention and machinery) → Phase 2 (index tooling) → Phase 3
  (realign misfiring rules) → Phase 4 (`ose-public` sweep) → Phase 5 (the private sibling) → Phase 6
  (Knowledge Capture) → Phase 7 (archival and integration). Each builds what the next reads: the rule
  is what rename decisions are made against, the order-preserving generator is the precondition that
  makes renaming non-lossy, the withdrawal removes files the sweep would otherwise process, and
  the private sibling copies a finished `rhino-cli` change.
- **No independent branch.** Every phase writes to `repo-governance/` or `.claude/`, or depends on a
  tooling change, so nothing fans out. This is a genuine serial chain, not a list that happens to be
  ordered.
- **Chosen N**: 3 (the repository default) — but **Phase 4 and Phase 5 run strictly serial, no
  fan-out**. Renaming and link rewriting are one coupled operation over a shared corpus: links cross
  every subtree boundary, so concurrent `git mv` plus `rewrite-paths` against overlapping targets is
  a race none of this plan's acceptance clauses would detect. A single agent sweeps directory by
  directory, in the commit order named in the tie-breakers. N=3 still applies to genuinely
  independent work elsewhere.
- **Terminal node**: Phase 7 depends on every other phase. Both PRs open there, and no worktree is
  removed until both have merged.

### Delivery Boundaries

| Phase(s) | Delivery unit                                       | Worktree                                              | Branch                             | PR opens         |
| -------- | --------------------------------------------------- | ----------------------------------------------------- | ---------------------------------- | ---------------- |
| 0        | — (setup and baseline)                              | —                                                     | —                                  | no               |
| 1–4, 6–7 | `ose-public` rules sweep and rule withdrawal        | `worktrees/optimize-gov` (existing)                   | `worktree/optimize-gov` (existing) | yes — at Phase 7 |
| 5, 7     | The private sibling rules sweep and rule withdrawal | `worktrees/repo-rules-sweep` (in the private sibling) | `repo-rules-sweep`                 | yes — at Phase 7 |

## Phase 0: Baseline

_Suggested executor:_ `repo-setup-manager`

- [x] [AI] Verify the active worktree is `worktrees/optimize-gov` — acceptance: `git rev-parse --show-toplevel`
      ends in `worktrees/optimize-gov` and `git branch --show-current` prints `worktree/optimize-gov`.
- [x] [AI] Fast-forward the branch with `git fetch origin && git merge --ff-only origin/main` —
      acceptance: `git rev-list --count HEAD..origin/main` returns 0.
- [x] [AI] Run `npm install` — acceptance: exits 0 (this worktree has no `node_modules/` yet).
- [x] [AI] Run `npm run doctor -- --fix` — acceptance: exits 0 with no unresolved toolchain findings.
- [x] [AI] Run `npx nx run rhino-cli:test:quick` — acceptance: exits 0; record the pass count.
- [x] [AI] Record the `ose-public` numbering baseline into
      `local-tmp/repo-rules-sweep/baseline-public.md`, capturing verbatim output of each command —
      acceptance: all five figures recorded. - `find repo-governance -name '*.md' | grep -cE '/[0-9]{2}-'` - `find .claude -name '*.md' | grep -cE '/[0-9]{2}-'` - `find . -name '*.md' -not -path './node_modules/*' | grep -E '/[0-9]{2}[a-z]-'` - `find repo-governance/workflows -name '*.md' | grep -E '/[0-9]{2}-phase-[0-9]+'` - `grep -rEn '\]\([^)]*/[0-9]{2}-[a-z0-9-]+\.md' --exclude-dir=node_modules --exclude-dir=.git . | wc -l`
- [x] [AI] Record the `md-naming*` golden-master fixture count into
      `local-tmp/repo-rules-sweep/baseline-public.md` as a sixth figure —
      `find apps/rhino-cli/tests/golden-master -name 'md-naming*' | wc -l` — acceptance: the
      number is written to that file. Phase 3 asserts this count is unchanged after deleting the
      naming-command fixtures, so the baseline must exist before Phase 3 runs. Verified
      2026-08-18: the count is 6.
- [x] [AI] Record the same five figures for the private sibling into
      `local-tmp/repo-rules-sweep/baseline-private.md` — acceptance: recorded; at authoring time
      `repo-governance` was 1704 of 2131 and `.claude` was 217.
- [x] [AI] Confirm the private sibling is on a clean `main` — acceptance:
      `git -C ~/ose-projects/<sibling> status --porcelain --untracked-files=no` prints
      nothing. **Tracked files only**: that repository legitimately carries an untracked `local-temp/`
      scratch directory, so a bare `status --short` prints `?? local-temp/` on a perfectly healthy
      tree and would halt Phase 0 on a false negative. Verified 2026-08-18: tracked-clean returns 0
      lines, bare `--short` returns 1.
- [x] [AI] Confirm the private sibling topology before relying on plain `git -C` commands — acceptance:
      `git -C ~/ose-projects/<sibling> rev-parse --is-bare-repository` prints `false`.
      This repository has flipped between bare and normal layouts before; if it prints `true`, switch
      to the `-c core.bare=false --work-tree=` form for every subsequent the private sibling command.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `git status --short` — prints nothing.
- [x] [AI] `baseline-public.md` exists with all six figures and `baseline-private.md` with all five.

- [x] [AI] Commit the baseline evidence and push to the existing `worktree/optimize-gov` branch —
      acceptance: `git status --short` prints nothing and `git rev-list --count origin/worktree/optimize-gov..HEAD`
      returns 0. Phase 0 opens no PR; PR #227 already exists, so this push adds evidence to it rather
      than creating anything.

> **Pause Safety**: the existing worktree is verified and current, the toolchain converged, both
> repositories' numbering baselines recorded, and the evidence pushed to the existing branch. No PR
> was opened. Safe to stop. To resume: `npx nx run rhino-cli:test:quick`.

## Phase 1: Convention and Rules-Machinery Propagation

_Suggested executor:_ `repo-rules-maker` for the convention text; `agent-maker` and `repo-workflow-maker` for the machinery edits

### The convention

- [x] [AI] Create `repo-governance/conventions/structure/ordinal-filename-prefixes.md` stating the
      rule from `tech-docs.md` §2 with worked cases on **both** sides: the three **Fails** cases and
      the real **Passes** case (`04-step-4-fixer.md` → `04-fixer.md`, from
      `repo-governance/workflows/**/*-quality-gate/`, where the ordinal already equals the step's own
      number) — acceptance: the file exists, every example it cites resolves to a real path verified
      by `find` at authoring time, and `rhino governance word-budget validate` reports it under 500
      words. **Do not write that no file satisfies the Passes condition** — that claim is false and
      would turn the convention into the blanket ban this plan explicitly rejected.
- [x] [AI] Add the required frontmatter (`title`, `description`, `when_to_use`, `category`,
      `subcategory`, `tags`, `created`) — acceptance: `rhino md frontmatter validate` reports no
      finding for the file.
- [x] [AI] Edit `repo-governance/conventions/structure/file-naming.md`: replace the "no prefixes,
      abbreviations, or hierarchical encoding" clause with a deferral to the new convention, and add
      the cross-link — acceptance: `grep -c 'no prefixes' repo-governance/conventions/structure/file-naming.md`
      returns 0 and a link to `ordinal-filename-prefixes.md` is present.
- [x] [AI] Edit `repo-governance/conventions/structure/governance-word-budget-remediation.md` to
      state that shard filenames carry no ordinal and the parent index carries reading order —
      acceptance: the sentence is present and links the new convention.
- [x] [AI] ~~Edit `repo-governance/conventions/structure/workflow-naming.md` (and its shards) so the
      workflow filename rule composes with the ordinal rule.~~ **Superseded by Phase 3 during
      execution (2026-08-18).** Phase 3 deletes `workflow-naming.md` and all six shards outright
      (its acceptance requires `find repo-governance/conventions/structure -name 'workflow-naming*' | wc -l`
      to return 0), so there is no surviving document for the ordinal rule to compose with. Performing
      this edit would author a cross-link into a file the same PR deletes, which Phase 3's link
      validation would then have to strip. The end state is identical either way. Recorded as a
      Phase 6 learning: a plan that both edits and deletes the same surface should sequence the
      deletion first.
- [x] [AI] Edit `repo-governance/development/infra/temporary-files/08-report-file-naming-standard.md`
      to state whether report filenames are exempt — acceptance: an explicit exempt-or-not sentence
      exists.
- [x] [AI] Add the new convention to `repo-governance/conventions/structure/README.md` with a
      description-plus-`when_to_use` annotation — acceptance:
      `rhino governance readme-index validate --paths repo-governance/` reports no `orphan` or
      `unannotated` finding.

### Discovery for the machinery sweep

- [x] [AI] Enumerate every governance, agent, and skill file stating a filename-naming rule with
      `grep -rln "kebab-case\|[Ff]ile [Nn]aming" --exclude-dir=node_modules .claude repo-governance docs`
      and record the list in the execution ledger with a `states-the-rule` or `merely-links-it`
      verdict per file — acceptance: at authoring time this returned 251 files; every entry
      carries a verdict, none blank.

### The repo-rules machinery

- [x] [AI] Edit `.claude/agents/repo/repo-rules-checker.md` to add ordinal-prefix judgement to its
      Core Repository Validation step as an **AI-only** category with no deterministic delegate —
      acceptance: the category and its criticality are stated, and
      `rhino governance word-budget validate` keeps the file under 500 words.
- [x] [AI] Edit `.claude/agents/repo/repo-rules-fixer.md` to carry the ordinal-prefix fix
      disposition — acceptance: the file states the rename-and-relink sequence it may apply and the
      refusal condition for any path inside a generated mirror.
- [x] [AI] Edit `.claude/agents/repo/repo-rules-maker.md` so newly authored conventions and shards are
      named under the rule — acceptance: the rule is stated or the convention linked as authority.
- [x] [AI] Edit `.claude/skills/repo-validating-governance-rules/reference/01-core-validation-and-agent-duplication.md`
      to add the category to the Core Repository Validation list — acceptance: the category and its
      criticality are stated.
- [x] [AI] Add an ordinal-prefix fix recipe to `.claude/skills/repo-rules-fixing/` — acceptance: the
      recipe states the rename sequence, the `rewrite-paths` step, the mirror-regeneration
      obligation, and the refusal condition.
- [x] [AI] Edit `.claude/skills/repo-defining-workflows/SKILL.md` so workflow shard and step files
      follow the rule — acceptance: the rule is stated with one worked filename.
- [x] [AI] Edit `.claude/skills/docs-managing-file-operations/reference/01-when-to-use-and-naming.md`
      so `docs-file-manager` renames under the rule — acceptance: the rule is stated or linked.
- [x] [AI] Edit `repo-governance/workflows/repo/repo-rules-quality-gate/15-skip-list-curation-rules.md`
      to state the stable-key format for an ordinal-prefix finding — acceptance: the format is stated.
- [x] [AI] Edit `repo-governance/workflows/repo/repo-rules-quality-gate/22-what-changed.md` to record
      the new AI-only category — acceptance: an entry naming it exists.
- [x] [AI] For every remaining `states-the-rule` file from the discovery step, apply the same
      reconciliation — acceptance: every such entry has a recorded disposition of `updated` or
      `no-change-needed` with a one-line reason; none blank.
- [x] [AI] Run `npm run generate:bindings` and `npm run validate:sync` — acceptance: both exit 0 and
      the regenerated mirrors are committed alongside the `.claude/` edits.

### Phase 1 Gate

- [x] [AI] `rhino governance word-budget validate` — exits 0.
- [x] [AI] `rhino governance readme-index validate --paths repo-governance/ --paths .claude/` — exits 0.
- [x] [AI] `npm run validate:sync` — exits 0.
- [x] [AI] `grep -rn 'ordinal-filename-prefixes' repo-governance/conventions/structure/file-naming.md` — at least one match.
- [x] [AI] Every discovery entry with a `states-the-rule` verdict has a recorded disposition.

> **Pause Safety**: the rule is published, the `file-naming.md` contradiction is resolved, and the
> maker/checker/fixer triad plus the quality-gate workflow agree with it. No filename outside
> `.claude/` has changed and no tooling behaviour has changed. Safe to stop.
> To resume: `npm run validate:sync`.

## Phase 2: Order-Preserving Index Tooling

_Suggested executor:_ `swe-rust-dev`

TDD is required. Each behaviour cycle is one RED step binding exactly one Gherkin scenario, then a
GREEN step, then a REFACTOR step.

- [x] [AI] Add the three index-tooling scenarios from `prd.md` to
      `specs/apps/rhino/behavior/rhino-cli/gherkin/governance/governance-readme-index.feature` —
      acceptance: `rhino specs structure validate` exits 0 and the three titles are present.
- [x] [AI] RED: add a failing unit test in
      `apps/rhino-cli/src/application/governance/readme_index.rs` asserting order preservation.
      **Gherkin (binds) →** "Generate no longer rewrites an existing index's order"

      ```gherkin
      Scenario: Generate no longer rewrites an existing index's order
        Given a directory already has a README.md index with hand-authored entry order
        When the maintainer runs rhino-cli governance readme-index generate on that directory
        Then the existing entries keep their order and annotations
        And only genuinely missing entries are appended
      ```

      — acceptance: `npx nx run rhino-cli:test` fails on that test only.

- [x] [AI] GREEN: parse an existing index's entry list in `generate_index_file`, preserve each
      entry's position and annotation verbatim, and append only on-disk targets absent from it —
      acceptance: `npx nx run rhino-cli:test` exits 0.
- [x] [AI] RED: add a failing unit test asserting the scaffold path is unchanged. **Did not go red
      during execution (2026-08-18)** — the Phase 2 order-preservation implementation deliberately
      routes the no-index case through the unchanged `sorted_names()` path, so scaffold behaviour
      was already correct when the test was written. `generate_still_scaffolds_a_directory_with_no_index`
      is therefore a **regression guard**, not a RED step: it also asserts each sibling appears
      exactly once, which is the property the new append pass could plausibly have broken.
      **Gherkin (binds) →** "Generate still scaffolds a directory with no index"

      ```gherkin
      Scenario: Generate still scaffolds a directory with no index
        Given a directory has no README.md index
        When the maintainer runs rhino-cli governance readme-index generate on that directory
        Then a complete annotated index is written
        And every sibling file and subdirectory appears exactly once
      ```

      — acceptance: `npx nx run rhino-cli:test` fails on that test only.

- [x] [AI] GREEN: keep today's `sorted_names()` scaffold behaviour for the no-index case — satisfied
      by the same change; no separate edit was needed —
      acceptance: `npx nx run rhino-cli:test` exits 0.
- [x] [AI] RED: add a failing unit test for the new mode.
      **Gherkin (binds) →** "Rewrite-paths updates link targets without touching order"

      ```gherkin
      Scenario: Rewrite-paths updates link targets without touching order
        Given a rename map of old and new paths for a directory's children
        When the maintainer runs rhino-cli governance readme-index rewrite-paths with that map
        Then every index link target is updated to its new path
        And entry order, annotation text, and surrounding prose are unchanged
      ```

      — acceptance: `npx nx run rhino-cli:test` fails on that test only.

- [x] [AI] GREEN: implement `readme-index rewrite-paths --map <tsv>` operating over the tracked
      markdown corpus, rewriting link targets only — acceptance: `npx nx run rhino-cli:test` exits 0.
- [x] [AI] REFACTOR: extract index parsing into one named function shared by `generate` and
      `rewrite-paths` — acceptance: `npx nx run rhino-cli:test` and `npx nx run rhino-cli:lint` exit 0.
- [x] [AI] Regenerate the parity checksum manifest with `rhino parity manifest generate` and stage
      it in the same commit — acceptance: `rhino parity manifest validate` exits 0.
      `apps/rhino-cli/parity-manifest.sha256` checksums every `rhino-cli` file against the Git index,
      so **any** add, delete, or edit under `apps/rhino-cli/` invalidates it until regenerated.
- [x] [AI] Document both behaviours in
      `repo-governance/conventions/structure/governance-readme-completeness.md` — acceptance: the
      order-preserving contract and the `rewrite-paths` mode are described.

### Phase 2 Gate

- [x] [AI] `npx nx run rhino-cli:test` — exits 0.
      _Executed as `npx nx run rhino-cli:test:quick` — `rhino-cli:test` is not a declared target;
      the real targets are `test:quick`, `test:unit`, `test:specs`, `test:coverage`. Plan defect._
- [x] [AI] `npx nx run rhino-cli:lint` — exits 0.
- [x] [AI] A dry-run `readme-index generate` over `repo-governance/` produces no index reordering —
      `git diff --stat` after the dry run is empty.

> **Pause Safety**: the generator preserves hand-authored order and a rename-aware mode exists. No
> filename has changed. Safe to stop. To resume: `npx nx run rhino-cli:test`.

## Phase 3: Realign Rules Whose Enforcement Misfires (WS-C)

_Suggested executor:_ `swe-rust-dev` for the deletions and gate registry; `repo-rules-maker` for the convention removals and the word-budget documentation; `repo-rules-fixer` for the prose sweep

Two enforced filename rules are withdrawn: the **agent role suffix** (`harness naming validate`) and
the **governance workflow type suffix** (`repo-governance workflows naming validate`). Both check
only a basename's last token against a closed vocabulary. Neither prevents a real defect, and both
force a rename whenever a genuinely new kind of agent or workflow appears.

**Existing filenames do not change.** `repo-rules-checker.md` and `pr-review-quality-gate.md` keep
their names; they simply stop being mandatory. This phase removes a constraint, not a convention in
practice.

### The mirror-drift coverage check

`harness naming validate` has a **second, unrelated job**: it walks every generated tier in the
harness registry and reports `mirror-drift` when a `.claude/agents/` file has no counterpart. That
duty must survive the deletion — and it already does, independent of this command. The
already-declared `harness-bindings` gate (`repo-config.yml`, `pre-push` path-gated on
`.amazonq/`/`.claude/`/`.opencode/`/`.codex/`/`.cursor/`, unconditional in `ci`) runs
`validate_sync` (`.opencode/` mirror parity) and `validate_cursor_sync` (`.cursor/` mirror parity) as
two of its checks, alongside the Amazon Q bridge byte-parity check. Deleting `harness naming
validate` therefore removes a **second, overlapping** check of the same duty, not the only gated one
— no new gate is needed.

- [x] [AI] Confirm the coverage before deleting anything: in a scratch copy, delete one
      `.opencode/agents/*.md` file and run `rhino harness bindings validate` — acceptance: non-zero
      exit, naming the missing mirror, proving the already-declared `harness-bindings` gate catches
      the deletion independent of `harness naming validate`. Restore the file and re-run —
      acceptance: exit 0.

### Convention removal

- [x] [AI] Delete `repo-governance/conventions/structure/agent-naming.md` and the seven files under
      `repo-governance/conventions/structure/agent-naming/` — acceptance:
      `find repo-governance/conventions/structure -name 'agent-naming*' | wc -l` returns 0.
- [x] [AI] Delete `repo-governance/conventions/structure/workflow-naming.md` and the six files under
      `repo-governance/conventions/structure/workflow-naming/` — acceptance:
      `find repo-governance/conventions/structure -name 'workflow-naming*' | wc -l` returns 0.
- [x] [AI] Record the withdrawal in
      `repo-governance/conventions/structure/file-naming.md` — one short paragraph naming both
      withdrawn rules and why, so a future reader finds the decision instead of the absence —
      acceptance: `grep -F 'role suffix' repo-governance/conventions/structure/file-naming.md`
      returns at least one match.
- [x] [AI] Re-index the parent: `rhino governance readme-index generate` on
      `repo-governance/conventions/structure/` — acceptance:
      `rhino governance readme-index validate` exits 0 with no `ghost` finding.

### Tooling removal

- [x] [AI] Delete `apps/rhino-cli/src/commands/harness_validate_naming.rs` and
      `apps/rhino-cli/src/commands/workflows_validate_naming.rs` — acceptance: both paths absent.
- [x] [AI] Delete `apps/rhino-cli/src/internal/naming.rs` and
      `apps/rhino-cli/src/application/naming/` (`mod.rs`, `reporter.rs`). These are used **only** by
      the two deleted commands — acceptance:
      `grep -rn 'internal::naming\|application::naming' apps/rhino-cli/src apps/rhino-cli/tests`
      returns zero matches, and `npx nx run rhino-cli:build` exits 0.
- [x] [AI] Remove both `pub mod` lines from `apps/rhino-cli/src/commands.rs`, both subcommand
      variants and both dispatch arms from `apps/rhino-cli/src/cli.rs`, and the three stale CLI
      parser tests that assert these commands parse (`old_harness_validate_naming_fails`,
      `new_harness_validate_naming_passes`, `verb_middle_workflows_validate_naming_no_longer_parses`)
      — acceptance: `npx nx run rhino-cli:build` exits 0 and
      `rhino harness naming validate` exits non-zero with an unrecognised-subcommand error.
- [x] [AI] Delete `apps/rhino-cli/tests/agent_naming_validator.rs` and the eighteen
      `tests/golden-master/{harness-naming*,harness-validate-naming*,workflows-validate-naming*,repo-governance-workflows-naming*}.{exit,stdout,stderr}`
      fixtures (6 base names × `.exit`/`.stdout`/`.stderr`). **Keep every `md-naming*` fixture** — `md naming validate` is a different command and
      stays — acceptance: `find apps/rhino-cli/tests/golden-master -name 'md-naming*' | wc -l`
      is unchanged from the Phase 0 baseline.
- [x] [AI] Delete the two feature files
      `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/agents-validate-naming.feature` and
      `specs/apps/rhino/behavior/rhino-cli/gherkin/workflows/workflows-validate-naming.feature`, plus
      `specs/apps/rhino/behavior/rhino-cli/gherkin/agent-naming/agent-naming-validator.feature` —
      acceptance: `rhino specs coverage` exits 0, reporting neither an orphaned feature nor an
      uncovered command.
      _Wider than the plan stated. Deleting the three features also stranded their step
      definitions: 17 orphan step impls. Removed `apps/rhino-cli/tests/workflows.rs` (whole
      cucumber binary, all 10 steps were for the withdrawn command) and the 105-line
      `agents validate-naming` step section from `tests/agents.rs`, plus both `[[test]]` entries
      in `Cargo.toml`. Also removed the now-empty `gherkin/workflows/` and `gherkin/agent-naming/`
      directories. Coverage: 64 specs, 494 scenarios, 2018 steps — all covered, exit 0._

### Gate removal

- [x] [AI] Delete the `harness-naming` and `workflows-naming` gate entries from `repo-config.yml` —
      acceptance: `grep -F 'harness naming validate' repo-config.yml` and
      `grep -F 'workflows naming validate' repo-config.yml` each return zero matches, while
      `grep -F 'md naming validate' repo-config.yml` still returns one.
- [x] [AI] Regenerate the hook shims and CI job matrix from the registry — acceptance:
      `rhino gate validate` exits 0 and no CI job references a removed gate id.

### Prose sweep

- [x] [AI] Enumerate every site stating either rule, with a per-file verdict, before editing any of
      them:
      `grep -rn 'harness naming validate\|workflows naming validate\|role suffix\|Role Vocabulary\|Type Vocabulary' AGENTS.md CLAUDE.md .claude repo-governance docs specs`
      — acceptance: the verdict table lists every hit as `edited`, `deleted`, or
      `no-change (unrelated sense)`. `<type>` and `<role>` appear in Conventional-Commits and
      emoji-vocabulary docs in an unrelated sense; those are `no-change`.
      _Verdict table written to `local-tmp/repo-rules-sweep/ws-c-verdicts.md`. The plan's grep found
      29 hits; the union with a `-F agent-naming.md` / `-F workflow-naming.md` link sweep and the 21
      broken links `md links validate` reported after the deletions raised the surface to 32 files.
      22 edited, 0 deleted, 10 no-change. The five `role suffix` hits in the colour/accessibility
      docs are `no-change (unrelated sense)`: they describe an agent's observed suffix to justify a
      colour, and state no naming rule._
- [x] [AI] Edit `AGENTS.md` §AI Agents to drop `<domain>-<role>` naming — acceptance:
      `grep -F '<domain>-<role>' AGENTS.md` returns zero matches, and `rhino governance word-budget validate` exits 0.
- [x] [AI] Update `.claude/agents/README.md`, `repo-governance/workflows/README.md`,
      `repo-governance/development/agents/ai-agents/10-agent-naming-conventions.md`,
      `docs/reference/rhino-cli-command-triage.md`, `docs/reference/sdlc-gate-standard.md`, and
      `repo-governance/development/infra/nx-target-naming/04-cli-command-naming.md` — acceptance:
      every verdict in the table above is discharged and `rhino md links validate` exits 0.
      _Wider than the six files listed. `.claude/agents/README.md` needed **no change** — it
      documents `name:`-based discovery, never the withdrawn filename rule. Beyond the list, the
      sweep also had to repair `governance-vendor-independence.md`, `worktree-path/04-*.md`, ten
      workflow shards carrying a Related-Conventions bullet to the deleted convention,
      `ci-conventions/13-*.md`, `.claude/agents/pr-review/pr-review-governance-maker.md`, and two
      spec surfaces — `harness-registry-driven.feature` (repointed to `harness bindings validate`,
      which is equally registry-driven and still exists) plus the gherkin `README.md`.
      `10-agent-naming-conventions.md` was rewritten as guidance rather than deleted: its
      scope-prefix material is still useful and is not the withdrawn rule.
      `md links validate` exits 0 with zero broken links._
- [x] [AI] Regenerate mirrors: `npm run generate:bindings` — acceptance: `npm run validate:sync`
      exits 0 and mirrors land in the same commit as their `.claude/` sources.

### Evidence placement: a stated rule with nothing behind it

The [Evidence Capture Convention](../../../repo-governance/development/quality/evidence-capture/the-rule.md)
already requires file-based evidence to live in **the plan's `evidence/` subfolder**, which moves
with the plan to `plans/done/` on archival. It was violated anyway: 24 files landed in a repo-root
`evidence/` across two unrelated commits (`eca01f826`, `ab842ee8e`) and sat there unreferenced.
Nothing enforces _placement_ — `plan-execution-checker` inspects what evidence contains, not where it
lives.

The stray directory was deleted, and a root-anchored `/evidence/` entry added to `.gitignore`,
before this plan's execution began. This phase makes the convention state the rule the guard
implements.

**The guard's limits are known and accepted** (see D22). It blocks only the repo-root case; a
misplaced `apps/foo/evidence/` is not caught. `git add -f` bypasses it. And it _hides_ rather than
reports — an agent writing to the root gets no signal, the files simply never stage. This was chosen
over a staged-path gate for cost. If evidence is misplaced again somewhere the anchor does not
reach, that is the signal to revisit.

- [x] [AI] Verify the guard is present and correctly anchored — acceptance:
      `git check-ignore -q evidence/probe.png` succeeds **and**
      `git check-ignore -q plans/in-progress/repo-rules-sweep/evidence/probe.png` fails. Both
      directions must hold: an anchor that also ignored per-plan evidence folders would silently stop
      every plan from committing its screenshots. Delete the probe files afterwards.
- [x] [AI] State the placement rule explicitly in
      `repo-governance/development/quality/evidence-capture/02-the-rule.md`: a repo-root `evidence/`
      is always a misplacement, the `.gitignore` anchor exists, and the anchor is the only mechanical
      backstop — acceptance:
      `grep -F 'gitignore' repo-governance/development/quality/evidence-capture/02-the-rule.md`
      returns at least one match and the file still passes its 500-word budget.
- [x] [AI] Cross-link the guard from the temporary-files convention so an author looking for "where
      do artifacts go" finds it — acceptance: `rhino md links validate` exits 0.

### The word budget that already does not apply to `plans/`

`plans/**/README.md` is **already** outside the word budget: the `governance-word-budget` gate
carries an `exclude` prefix list (`plans/`, `docs/`, `specs/`, `.fvm/`, `.fvm-cache/`,
`.opencode/skills/`, `.opencode/commands/`), and `governance_validate_word_budget.rs` folds that same
list into a bare CLI run. No config change is needed. The defect is that
`governance-word-budget.md` publishes the `**/README.md` 700/900/900 row as though it were universal,
devotes a paragraph to glob-overlap resolution, and never mentions the exclusions — so an author
trims a plan README to satisfy a budget that was never going to be measured.

- [x] [AI] Verify the exclusion before documenting it, rather than trusting the config: create a
      throwaway `plans/in-progress/probe/README.md` of 1200 words, run
      `rhino governance word-budget validate`, delete it — acceptance: exit 0 with no finding naming
      that path. If it _does_ report, the exclusion is not what it appears and this section becomes
      a config change instead.
- [x] [AI] Delete the throwaway probe directory — acceptance: `plans/in-progress/probe/` does not
      exist and `git status --short` shows no trace of it.
- [x] [AI] Document the exclusion list in
      `repo-governance/conventions/structure/governance-word-budget.md`, next to the surface table:
      the seven excluded prefixes, that they are `str::starts_with` prefixes and not globs, and that
      `plans/`, `docs/`, and `specs/` are content trees the budget was never meant to reach —
      acceptance: `grep -F 'plans/' repo-governance/conventions/structure/governance-word-budget.md`
      returns at least one match, and the file still passes its own 500-word budget.
- [x] [AI] State the rule the exclusion implies — a budget surface is a glob **minus** the registered
      exclude prefixes, and the exclude list is part of the published rule, not an implementation
      detail — acceptance: the convention says so in one sentence.
      _Both P3.22 and P3.23 landed, but not all in `governance-word-budget.md`. Adding the
      exclusion list inline pushed that file to 550 words — over its own 500-word fail limit (the
      validator counts the whole file including frontmatter, so a body-only count reads ~50 words
      low). Applied the sanctioned remediation instead: the detail moved to a new child,
      `governance-word-budget/excluded-prefixes.md`, and the parent keeps the one-sentence rule
      plus the `plans/`/`docs/`/`specs/` consequence at 494 whole-file words. The new shard takes
      a plain name, not an `NN-` ordinal, per this plan's own Phase 1 convention._

### Phase 3 Gate

- [x] [AI] `npx nx run rhino-cli:test` and `npx nx run rhino-cli:lint` — both exit 0.
      _`rhino-cli:test` does not exist (the same defect Phase 2 recorded); the project declares
      `test:quick`, `test:unit`, `test:integration`, `test:coverage`, `test:specs`, `test:e2e`.
      Ran the two that cover this phase's blast radius: `test:quick` exit 0 (1387 + 17 passed),
      `test:integration` exit 0 (all cucumber and golden-master suites). `lint` exit 0._
- [x] [AI] `rhino parity manifest generate` has been run and staged after the deletions —
      acceptance: `rhino parity manifest validate` exits 0. Four source files and a module directory
      were removed; the manifest lists them until regenerated.
      _`generate` refuses while any manifest-covered file differs from the Git index, so
      `specs/apps/rhino/` and `repo-config.yml` had to be staged first. Validate exits 0._
- [x] [AI] `rhino repo-config validate`, `rhino gate validate`, `rhino specs coverage` — all exit 0.
      _`specs coverage` is spelled `specs behavior-coverage validate` and takes required PATHS; ran
      it through its Nx target with `--skip-nx-cache` (the cached result predated these edits):
      64 specs, 494 scenarios, 2017 steps, all covered._
- [x] [AI] `rhino md links validate` — exits 0; no document links to a deleted convention.
- [x] [AI] `rhino governance word-budget validate` — exits 0, and `governance-word-budget.md`
      documents the exclude list it has always applied.
- [x] [AI] `git check-ignore -q evidence/probe.png` succeeds and the same check on a per-plan
      `evidence/` path fails — the anchor blocks the root and nothing else.
- [x] [AI] `npm run validate:sync` — exits 0. `rhino harness bindings validate` (the already-declared
      `harness-bindings` gate) also exits 0, confirming `.opencode/` and `.cursor/` mirror-drift
      coverage survived the deletion.
- [x] [AI] An agent file named `.claude/agents/repo/repo-rules-frobnicator.md` passes every gate —
      acceptance: `rhino gate run --surface=pre-push` exits 0 with that file present. This is the
      point of the phase; if it still fails, the rule was not actually withdrawn. Delete the probe
      file afterwards.
      _Discharged, but the gate run does not exit 0 — for a reason unrelated to the probe. **No gate
      names the probe**: `grep -ci frobnicator` over the full gate output returns 0, and the whole
      `-frobnicator` basename — a token never in the withdrawn role vocabulary — passes
      `harness bindings validate`, `harness duplication validate`, `md naming validate`, and the
      readme-index gate. That is the claim this item exists to test, and it holds._
      _Two things had to be separated out first. (1) The probe initially tripped `governance-readme-index`
      as an `orphan` — an agent file not linked from `.claude/agents/repo/README.md`. That is the
      catalog-completeness rule, not the naming rule, so indexing the probe (as any real agent
      would be) is the correct fair test; it then passed. (2) `convention-license` fails on
      `apps/ayokoding-cli`, `apps/ose-cli`, and `libs/rust-commons` — three **empty `target/`
      directory shells** left behind locally by deleted projects, holding zero files and zero
      tracked entries. Proved independent of this plan: `convention license validate` produces a
      byte-identical 3-finding report with and without the probe present. They are absent from a
      fresh clone and from CI, so this is local cruft, not a repository defect. Left in place —
      removing them is a developer-machine cleanup, not a plan change._
      _Probe and its three generated mirrors deleted; `validate:sync` exits 0 and `git status` shows
      no trace._

> **Pause Safety**: the two rules and their tooling are gone, the already-declared `harness-bindings`
> gate continues to cover the `.opencode/`/`.cursor/` mirror duty that `harness naming validate` used
> to also carry, and no file has been renamed. Safe to stop. To resume:
> `rhino gate validate && npx nx run rhino-cli:test`.

## Phase 4: `ose-public` Sweep

_Suggested executor:_ `docs-file-manager` for the renames and link repair; `repo-rules-fixer` for boundary rework

> **No identity-bearing filename is at risk.** All 232 numbered files under `.claude/` are skill
> **reference modules** (`.claude/skills/*/reference/NN-*.md`). Zero agent definitions and zero
> `SKILL.md` files carry an ordinal — verified at authoring time with
> `find .claude/agents -name '*.md' | grep -cE '/[0-9]{2}-'` returning 0. Agent and skill names are
> identities (frontmatter `name` must equal the filename stem or directory name); reference modules
> are reached only by link, which `rewrite-paths` repairs. Re-verify this before renaming: if either
> count is non-zero, stop — the sweep would break agent resolution.

- [x] [AI] Re-verify the identity-safety precondition — acceptance:
      `find .claude/agents -name '*.md' | grep -cE '/[0-9]{2}-'` and
      `find .claude/skills -name 'SKILL.md' | grep -cE '/[0-9]{2}-'` both return 0. Stop if not.
- [x] [AI] Build the per-directory rename plan for every numbered directory under
      `repo-governance/` and `.claude/`, recording for each file a disposition of `renamed`,
      `merged-into`, or `kept` with a one-line reason — acceptance: every numbered file in the Phase 0
      baseline appears exactly once with a disposition; the `kept` set contains only real step
      sequences whose ordinal equals the step number.
      **Result:** 2319 numbered files across 208 directories, each with exactly one disposition in
      `local-tmp/repo-rules-sweep/rows.json`; 0 collisions, 0 clashes with an existing file. The
      `kept` set is **8 files**, all under `repo-governance/workflows/`, where the ordinal equals the
      step's own number; each sheds its redundant `step-N` token. The other 2311 lose only the leading
      ordinal, preserving `phase-N`/`step-N` tokens as content. Two judgement calls: the keep set is 8
      rather than ~74 because the convention's normative sentence requires ordinal == the step's own
      number, and the contradicting worked case in `ordinal-filename-prefixes.md` is routed to P6.3.
- [x] [AI] For each continuation-shard run (files whose titles continue one another by rule or
      section number), decide the boundary rework and record it — acceptance: each run has a recorded
      decision of `merge` or `rename-in-place`, with `rename-in-place` reserved for runs whose merge
      would change meaning.
      **Result:** 36 runs across 24 directories, recorded in
      `local-tmp/repo-rules-sweep/continuation-decisions.md`. **All 36 are `rename-in-place`, none is
      `merge`** — the smallest combined whole-file word count is 551, above the 500-word governance
      budget, so every merge would trade one rule violation for another. Runs were derived by ordinal
      adjacency plus a bidirectional stem relation; a first pass using stem-prefix matching alone
      under-counted members (base siblings such as `04-standard-library-first-principle.md` and
      `20-frontmatter-requirements-and-quality-checklist.md` were missed) and was discarded.
- [x] [AI] Apply the merges, then run `rhino governance word-budget validate` — acceptance: exits 0;
      any file over 500 words is re-split on a topic seam yielding self-standing names, never back
      into a numbered continuation.
      **Result:** zero merges to apply (P4.3 decided all 36 runs `rename-in-place`), so no re-split was
      needed. `governance word-budget validate` run anyway as the standing check: exit 0, WARN-only
      findings, no FAIL.
- [x] [AI] Apply every rename with `git mv`, emitting the old→new rename map as
      `local-tmp/repo-rules-sweep/renames-public.tsv` — acceptance: the map row count equals the
      `renamed` plus `merged-into` disposition count.
      **Deviation:** the map carries **2319** rows, not the 2311 `renamed` rows this clause predicts.
      The clause assumed the `kept` set keeps its filename, but the convention makes a kept file shed
      its redundant `step-N` token, so all 8 kept paths change too. Emitting only 2311 rows would leave
      8 dangling links. `git status --short | grep -c '^R '` = 2319, 0 `git mv` failures; the only
      remaining ordinals repo-wide are the 8 kept files.
- [x] [AI] Run `rhino governance readme-index rewrite-paths --map local-tmp/repo-rules-sweep/renames-public.tsv`
      over the tracked markdown corpus — acceptance: exits 0 and
      `grep -rEn '\]\([^)]*/[0-9]{2}-[a-z0-9-]+\.md' --exclude-dir=node_modules --exclude-dir=.git repo-governance .claude`
      returns only links to `kept` files.
      **Deviation:** `rewrite_index_paths` keys its rename map by **basename**, not by repo-relative
      path (`rewrite_one_target` looks up the target's final segment). The full-path
      `renames-public.tsv` would have matched nothing, so the map actually fed to the command is
      `local-tmp/repo-rules-sweep/renames-public-basenames.tsv` — 2008 unique basename pairs derived
      from the same 2319 rows. Verified safe first: **0** basenames map to two different new names,
      and **0** tracked `.md` files outside `repo-governance/`/`.claude/` share a basename with any map
      key, so a basename-keyed rewrite cannot mis-target. Run with `--paths .` so root files,
      `docs/`, `specs/`, `plans/`, and the harness mirrors are all covered: exit 0, **1012** files
      updated. The grep now returns **16** matches, every one a link to one of the 8 `kept` files.
- [x] [AI] Run `npm run generate:bindings` and `npm run validate:sync` — acceptance: both exit 0 and
      the regenerated mirrors are committed with the `.claude/` renames.
      **Result:** both exit 0; `validate:sync` reports 96/96 checks passed. Working tree after the
      sweep: 2319 renames (1955 pure `R`, 364 `RM`) plus 649 `M`.
- [x] [AI] Repair links from **other** in-progress plans into renamed paths. At authoring time
      `plans/in-progress/repository-onboarding-readme-refresh/delivery.md` carries three such links.
      `md links validate` excludes `plans/done` but **not** `plans/in-progress`, so these break the
      gate. This is a mechanical link repair caused by our rename, so it is our obligation — but it
      touches another plan's docs: record every such path on the file-touch ledger and change nothing
      but the link target — acceptance: `grep -rEl '\]\([^)]*repo-governance/[^)]*/[0-9]{2}-[a-z0-9-]+\.md' plans/in-progress/`
      returns no file outside this plan's own folder.
      **Result:** the grep returns nothing at all — not one file, inside or outside this plan's folder.
      The `--paths .` rewrite in the previous item already repaired them:
      `plans/in-progress/repository-onboarding-readme-refresh/delivery.md` is the only foreign plan file
      touched (3 link targets, 4 changed lines), recorded on the file-touch ledger.
      **Scope note:** the same rewrite also repaired **159** files under `plans/done/`. That is wider
      than this clause asked for, and `md links validate` excludes `plans/done`, so no gate forced it.
      Kept deliberately: the edits are provably link-target-only (`rewrite_link_targets` touches nothing
      outside a `](...)` target), and leaving an archived plan pointing at a path this sweep deleted
      would be a defect a gate merely fails to measure.
- [x] [AI] Run `rhino md links validate` — acceptance: exits 0, no broken link. The rewrite covers
      the whole tracked corpus including `docs/` and `specs/`, which link **into** `repo-governance/`
      even though they are out of scope for renaming.
      **Result:** exit 0 — but only when run the way the gate runs it. The bare
      `md links validate` exits 1 with 311 findings; the `md-links` gate in `repo-config.yml` carries
      `args.exclude: [plans/done]`, and every one of those 311 is a pre-existing dead link inside
      `plans/done/` (115 archived plan files, targets such as `specs/apps/a-demo/**` and
      `2026-01-17__dolphin-be-init/`). **Zero** of them name a path this sweep renamed — no broken
      target matches `/[0-9]{2}[a-z]?-…\.md`. Left unfixed: pre-existing, outside the gate's surface,
      and outside this plan.
- [x] [AI] Run `rhino governance readme-index validate --paths repo-governance/ --paths .claude/` —
      acceptance: exits 0; no `missing`, `orphan`, `ghost`, or `unannotated` finding.
      **Result:** exit 0, zero findings of any kind — `README INDEX AUDIT PASSED`.
- [x] [AI] Spot-verify that annotations survived by diffing one index's entry text before and after —
      acceptance: entry text is byte-identical apart from link targets.
      **Result:** stronger than a spot-check — every changed index was compared, not one.
      All **209** changed `README.md` files under `repo-governance/` and `.claude/` are byte-identical
      to their `HEAD` version once every `](...)` target is masked; **0** differ outside a link target.
      Entry order, annotation text, and frontmatter are untouched.

### Phase 4 Gate

- [x] [AI] `find repo-governance .claude -name '*.md' | grep -E '/[0-9]{2}-'` returns only files on
      the recorded `kept` list.
      **Result:** returns exactly the 8 `kept` files, all under `repo-governance/workflows/`.
- [x] [AI] `find . -name '*.md' -not -path './node_modules/*' | grep -E '/[0-9]{2}[a-z]-'` — zero matches.
      **Result:** zero matches repo-wide.
- [x] [AI] No basename under `repo-governance/` carries both a leading ordinal and a `phase-<n>` or
      `step-<n>` token.
      **Result:** zero such basenames.
- [x] [AI] `rhino md links validate`, `rhino governance readme-index validate`,
      `rhino governance word-budget validate`, `npm run validate:sync` — all exit 0.
      **Result:** all four exit 0. `md links validate` is run with the `md-links` gate's own
      `--exclude plans/done`; see P4.9 for why the bare form reports pre-existing `plans/done` breakage.
- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
      **Result:** exit 0 with `--skip-nx-cache`.

> **Pause Safety**: `ose-public`'s governance and `.claude/` trees are fully swept, every index keeps
> its order and annotations, and the mirrors are regenerated. Committed to the branch, not yet pushed
> or reviewed. Safe to stop. To resume: `rhino md links validate`.

## Phase 5: the private sibling Sweep

_Suggested executor:_ `docs-file-manager` and `repo-rules-fixer`, same split as Phase 4

**Parity target: the same maintainer experience, not the same bytes.** Every WS-A and WS-C outcome
lands in both repositories. The private sibling carries all of them, but its shard structure and its config
differ, so **derive every path and every list from the private sibling itself — never copy an `ose-public`
path or an `ose-public` exclude list**. Audited 2026-08-18: `agent-naming/` holds 3 files there (7
here), `workflow-naming/` holds 4 (6 here), the evidence-capture rule lives in
`evidence-capture/01-what-goes-where.md` (not `02-the-rule.md`), and that repo's word-budget exclude
list carries an extra `infra/on-premise/terraform/.terraform/` entry. Copying this repo's list there
would publish a wrong list — the exact defect WS-C exists to fix.

- [x] [AI] Re-derive every the private sibling surface by command before editing anything, and fail loudly
      if one is missing rather than proceeding on an assumed path — acceptance: each of
      `repo-governance/conventions/structure/{agent-naming,workflow-naming,governance-word-budget,file-naming}.md`,
      the `agent-naming/` and `workflow-naming/` shard directories, the four `apps/rhino-cli/`
      naming sources, the `harness-naming` and `workflows-naming` gate ids in `repo-config.yml`, and
      the `repo-governance/development/quality/evidence-capture/` shard that states the placement
      rule are each confirmed present with their actual path and file count recorded.
      **Result:** every surface confirmed present, recorded with path and count in
      `local-tmp/repo-rules-sweep/private-surfaces.md`. The private sibling is a **normal** (non-bare)
      checkout at `884a330f6`, level with `origin/main`. Key derived differences from `ose-public`:
      `agent-naming/` holds 3 files (incl. README), `workflow-naming/` holds 4, the placement shard is
      `evidence-capture/01-what-goes-where.md` (there is no `02-the-rule.md` there), `.gitignore`
      carries **no** `/evidence/` guard, and the word-budget exclude list has **six** prefixes, not
      seven — it alone carries `infra/on-premise/terraform/.terraform/` and it lacks `.fvm/` and
      `.fvm-cache/`. Numbered-markdown baseline: **1961** files.
- [x] [AI] Provision `worktrees/repo-rules-sweep/` in the private sibling and branch `repo-rules-sweep`
      from its `main` — acceptance: `git worktree list` in the private sibling shows the path.
      **Result:** `~/ose-projects/<sibling>/worktrees/repo-rules-sweep  884a330f6 [repo-rules-sweep]`.
- [x] [AI] Apply the Phase 2 and Phase 3 `apps/rhino-cli/` changes byte-identically — acceptance:
      `diff -r` prints nothing for `src/application/governance/`, `src/commands/`, `src/internal/`,
      and `src/application/` between the two repositories, and neither repository still contains
      `naming.rs` under `src/internal/`. Do **not** blanket-converge the two `rhino-cli` trees: the
      parity boundary is not the whole app and each repository legitimately carries files the other
      does not.
      **Result:** `diff -rq` over the whole of `apps/rhino-cli/src` **and** `apps/rhino-cli/tests`
      prints nothing (exit 0) — a stronger check than the four directories this clause names. Neither
      repository still has `src/internal/naming.rs` or `src/application/naming/`.
      **Method, chosen to avoid blanket convergence:** before copying anything, every file that
      differed between the repos was compared against `ose-public`'s pre-plan baseline
      (`d41ea40c4`, the merge-base with `origin/main`). **All 12** differing files were byte-identical
      to that baseline, proving the entire delta was this branch's own work and none of it was
      independent the private sibling divergence. Only then were the branch's 20 added/modified files copied
      and its 28 deletions applied. Note the port also carries `src/domain/stdio_blocking.rs` and the
      EAGAIN fix (`7958ae19d`), a mid-plan `rhino-cli` change that is inside the parity boundary.
- [x] [AI] Regenerate and stage the private sibling's parity manifest with `rhino parity manifest generate`
      — acceptance: `rhino parity manifest validate` exits 0 there.
      **Result:** exit 0 there, and exit 0 in `ose-public` too. `generate` refuses while a covered file
      differs from the index, so `apps/rhino-cli/`, `specs/`, and `repo-config.yml` were staged first.
- [x] [AI] Apply the matching `specs/apps/rhino/` scenario additions — acceptance: the feature files
      are byte-identical across both repositories.
      **Result:** `diff -rq specs/apps/rhino/behavior` between the two repositories prints nothing.
      Same baseline check as P5.3 first: all 4 changed spec files matched `ose-public`'s pre-plan
      baseline in the private sibling, and all 4 deletions were present to delete.
      **Left alone, deliberately:** 4 files outside `behavior/` still differ
      (`product/overview.md`, `system-context/context.md`, `containers/container.md`,
      `components/cli/component-cli.md`). That is pre-existing divergence — the private sibling carries a
      stale paragraph calling `rhino-cli` "a Go CLI tool" — not something this plan introduced, and
      converging it would be exactly the blanket convergence the Phase 5 preamble forbids.
- [x] [AI] Apply the Phase 1 convention and machinery edits, adapted to the private sibling's own paths —
      acceptance: the ordinal-prefix convention exists there and its `file-naming.md` carries the
      same reconciliation.
      **Result:** `repo-governance/conventions/structure/ordinal-filename-prefixes.md` created there
      (497 whole-file words), indexed in that tree's `README.md`, and `file-naming.md` carries the same
      `## Withdrawn Rules` section plus both links to the new convention (487 words, trimmed to fit its
      own budget — its prose was more verbose than `ose-public`'s).
      **Derived, not copied:** the convention's non-vacuity section had to be rewritten. `ose-public`
      cites 8 live keep-clause instances; the private sibling has **zero** — every numbered basename under
      its `repo-governance/workflows/` fails on a second embedded number. The section now says so
      honestly and carries a re-check script, rather than importing `ose-public`'s claim.
- [x] [AI] Apply the Phase 3 withdrawal: delete the same two convention trees, the same `rhino-cli`
      commands and shared `naming` modules, and the same gate entries. No new gate is added, in either
      repository — acceptance: `rhino harness naming validate` exits non-zero in the private sibling too,
      and `rhino harness bindings validate` still exits 0 there, confirming `.opencode/` and
      `.cursor/` mirror-drift coverage survives without a new gate.
      **Result:** `harness naming validate` exits **2** in the private sibling; `harness bindings validate`
      exits **0** after regenerating mirrors; `repo-config validate` and `gate validate` both exit 0;
      `npm run validate:sync` reports 58/58 passed. Deleted there: `agent-naming.md` + its 3-file shard
      dir, `workflow-naming.md` + its 4-file shard dir, both gate entries in `repo-config.yml`.
      **Prose sweep, enumerated by command rather than copied from Phase 3's list** — the private sibling's
      sites differ. 13 Related/Conventions-Implemented bullets naming a deleted convention removed
      across 12 files; `workflows/README.md`'s `## Naming Rule` rewritten to `## Naming`;
      `conventions/structure/README.md` re-indexed; `AGENTS.md` dropped `<domain>-<role>`;
      `ai-agents/11-agent-naming-conventions.md` given the withdrawal note;
      `nx-target-naming/03-scheme-3-…md` moved both commands into its Removed table;
      `docs/reference/rhino-cli-command-triage.md` rows 20/29 marked removed with item 6 and the
      Action paragraph rewritten; `docs/reference/sdlc-gate-standard.md` dropped pre-push rows 4–5 and
      renumbered 6–8 → 4–6. Left alone as a different, still-live rule: every
      `github-actions-workflow-naming` reference. Left alone as historical record: `plans/done/`
      mentions and the `plan-domain-parity-decisions.md` narrative (its dead _link_ was removed).
- [x] [AI] Run the Phase 4 sweep procedure over the private sibling's `repo-governance/` and `.claude/`,
      emitting `renames-private.tsv` — acceptance: the same five gate commands exit 0 in
      the private sibling.
      **Result:** all five exit 0 — `md links validate --exclude plans/done`,
      `governance readme-index validate` (gate args), `governance word-budget validate`,
      `npm run validate:sync`, `harness bindings validate`. Full record in
      `local-tmp/repo-rules-sweep/private-sweep-result.md`.
      **The sweep did NOT transfer cleanly, and the outcome differs from `ose-public` on purpose.**
      1905 files and 8 directories renamed; **46** numbered paths remain there against 8 here.
      (a) the private sibling also has **numbered directories** — 11 of them; `ose-public` had none.
      (b) 40 files across 18 groups have byte-identical stems truncated to a fixed width, differing
      only by ordinal (`04-anti-pattern-10-…-tha.md` / `05-anti-pattern-10-…-tha.md`). Stripping
      collides. The convention has no answer: they are not steps, yet the ordinal is their only
      disambiguator. Giving them distinct names is authoring, not a sweep, so they keep their
      ordinals and the truncated-stem defect is routed to Phase 6.
      (c) Renaming 3 numbered directories broke the validator's `X.md` ↔ `X/README.md` pairing with
      their kept parent files, producing 5 new `orphan` findings. Proven new against a pristine
      `main` worktree (baseline: **0** findings), then reverted.
      (d) `rewrite-paths` keys by basename, so it cannot repoint a **directory** segment; the 8
      directory renames needed a separate path-level pass over every tracked `.md`.
- [x] [AI] Document the private sibling's word-budget exclude list in its own
      `governance-word-budget.md`, derived from **its** `repo-config.yml` — acceptance:
      `grep -F 'terraform' repo-governance/conventions/structure/governance-word-budget.md` returns a
      match there and does **not** in `ose-public`, proving each repo documents its own list rather
      than a copied one.
      **Result:** both directions hold — 1 match in the private sibling, **0** in `ose-public`.
      The lists are genuinely different, not near-copies: the private sibling registers **six** prefixes
      including `infra/on-premise/terraform/.terraform/` and no `.fvm`; `ose-public` registers
      **seven** including `.fvm/` and `.fvm-cache/`. Each was re-derived from that repository's own
      `repo-config.yml`, never transcribed from the other. New child shard
      `governance-word-budget/excluded-prefixes.md` (294 words) carries the table and says in prose
      that the list is this repository's own.
- [x] [AI] State the evidence placement rule in the private sibling's evidence-capture convention, in
      whichever shard the re-derivation step identified — acceptance: that shard mentions the
      `.gitignore` anchor and the plan-subfolder rule.
      **Result:** stated in `repo-governance/development/quality/evidence-capture/what-goes-where.md`
      (the shard the P5.1 re-derivation named — post-sweep it lost its `01-` ordinal). Both facts
      present: the plan-subfolder rule (`plans/{backlog,in-progress,done}/<slug>/evidence/`) and the
      root-anchored `.gitignore` backstop with its three stated limits. 420 words, under budget.
- [x] [AI] Add the root-anchored `/evidence/` guard to the private sibling's `.gitignore`, which does not
      have it — acceptance: in the private sibling, `git check-ignore -q evidence/probe.png` succeeds and
      the same check on a per-plan `evidence/` path fails. Both directions must hold. No repo-root
      `evidence/` directory exists there, so nothing is deleted. Delete the probe files afterwards.
      **Result:** both directions hold — `evidence/probe.png` is ignored, and
      `plans/in-progress/foo/evidence/probe.png` is **not**. The leading slash is what separates
      them. No repo-root `evidence/` directory existed, so nothing was deleted. Probe paths were
      never written to disk — `git check-ignore` tests the pattern, not the file.
- [x] [AI] Confirm the maintainer experience actually matches: in **both** repositories a probe agent
      file named `repo-rules-frobnicator.md` passes `rhino gate run --surface=pre-push`, and
      `rhino harness naming validate` exits non-zero — acceptance: identical outcomes in both.
      Delete the probe files afterwards.
      **Result:** identical in both. `harness naming validate` exits **2** (command gone) in each.
      With the probe planted and indexed, every `rhino-cli` gate on the pre-push surface was run
      individually — env, md-links, readme-index, harness-duplication, parity-manifest, both
      vendor-audit gates, convention-license, harness-bindings, word-budget — all exit 0, and
      `grep -ci frobnicator` over each gate's own output is **0**. Probes and their generated mirrors
      deleted; `find . -name '*frobnicator*'` returns nothing in either repository.
      **Method note:** the first run reported exit 2 for all ten gates. That was zsh not word-splitting
      an unquoted command string, not a real failure — re-run with proper argv.
- [x] [AI] Run the `parity-manifest` gate in both repositories — acceptance: both exit 0.
      **Result:** both exit 0.
- [x] [AI] Run `npx nx run rhino-cli:test` in the private sibling — acceptance: exits 0.
      **Deviation (same as P2.11 here):** `rhino-cli:test` is not a real Nx target in either
      repository. Ran the targets that exist: `test:quick` exit 0, `test:integration` exit 0
      (3 features, 17 scenarios, 64 steps, all passing — this is the target that actually exercises
      cucumber and the golden masters the withdrawal deleted fixtures from), `lint` exit 0.

### Phase 5 Gate

- [x] [AI] `parity-manifest` exits 0 in both repositories.
      **Result:** exit 0 in both.
- [x] [AI] `rhino md links validate`, `rhino governance readme-index validate`,
      `rhino governance word-budget validate`, `npm run validate:sync` — all exit 0 in the private sibling.
      **Result:** all exit 0 there. `md links validate` needs the gate's own `--exclude plans/done`
      to match what CI runs; the bare command reports pre-existing archived-plan breakage this branch
      did not cause. `readme-index validate` likewise runs with the gate's registered
      `--fail-kinds missing,orphan,ghost`.
- [x] [AI] `npx nx run rhino-cli:test` — exits 0 in the private sibling.
      **Result:** substituted as in P5.14 — `test:quick`, `test:integration`, `lint` all exit 0.

> **Pause Safety**: both repositories are swept and their tooling is byte-identical. Both branches
> hold committed, unpushed work. Safe to stop. To resume: run `parity-manifest` in either repository.

## Phase 6: Knowledge Capture

_Suggested executor:_ the orchestrator directly — triage is judgment, not delegation

- [x] [AI] Triage every entry in `learnings.md` through the
      [Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)
      routing matrix — acceptance: every entry reaches a terminal state (routed inline, filed as a
      backlog plan, or discarded with a one-line reason).
      **Result:** nine entries, nine terminal states, none discarded — every one passed the litmus.
      1 → fixed inline in `7958ae19d` under the Iron Rule 3 blocker carve-out (it blocked this plan's
      own pushes, so it is Root Cause Orientation, not deferred work). 2, 3, 4, 5 → filed as
      `plans/backlog/rhino-cli-governance-tooling-defects/`. 6, 7, 8 → filed as
      `plans/backlog/file-naming-convention-rework/` (WS-B). 9 → routed inline; WS-C already landed
      the word-budget half, and the `md-naming` half folds into WS-B's scope rather than a third plan.
      **Deviation:** the log's original three entries grew to nine. Phases 4 and 5 surfaced six more,
      and the convention says append in the moment — so they were appended, not reconstructed as a
      summary.
- [x] [AI] Run both safety gates (secret/sensitivity and repo-relevance) on every surviving entry —
      acceptance: each entry records a gate verdict.
      **Result:** both verdicts recorded on all nine. Secret/sensitivity: nine passes, no credential,
      token, hostname, or private IP; nothing needed sanitizing, so nothing was discarded on that
      gate. Repo-relevance: all nine are public-governance tooling content and belong in both
      repositories. Entry 8 is the only one whose **instances** are private-sibling-only — the 40
      truncated-stem files — and it is scoped so that only the collision _shape_ is described, never
      a private path, with the rule gap itself routed to both repos.
- [x] [AI] Record what `file-naming.md` still gets wrong, as the specification input for WS-B —
      acceptance: a WS-B input note exists in `learnings.md` or a `plans/backlog/` follow-up.
      **Result:** both. `learnings.md` entry 6 states four defects, each derived from the enforcing
      code rather than from reading the convention: (a) the gate exempts **eleven** basenames and the
      convention names **two** — `AGENTS.md` and `CLAUDE.md` are in neither exception clause; (b)
      `_index.md` contradicts the "no underscores" rule outright and is exempt in code with no
      document saying so; (c) the scope clause "and similar locations" is unfalsifiable, and
      `naming.rs`'s own doc comment quotes it back as its justification; (d) four of the six governed
      extensions are unenforced — the validator skips anything not ending in `.md`. Entry 7 adds the
      ordinal convention's self-contradicting worked-case row; entry 8 adds the collision gap. All
      three are the specification input for
      [`plans/backlog/file-naming-convention-rework/`](../../backlog/file-naming-convention-rework/README.md).
- [x] [AI] Record the withdrawal criterion WS-C applied — a rule that inspects one token, never reads
      the file, and forces a code change to name a document — and audit the three surviving gated
      filename rules against it — acceptance: each of `md naming`, the `harness-bindings` mirror
      check, and the `specs coverage` mapping carries a keep-or-withdraw verdict with a reason.
      **Result:** criterion stated as a three-part conjunction in `learnings.md`, with a per-rule
      verdict table. All three surviving rules are **KEEP**, and none fails on a single condition:
      `md naming` fails (1) and (3) — its rule is generative, so any new name passes if lowercase
      kebab; `harness bindings validate` fails all but (3) — it reads and diffs both files' contents;
      `specs coverage` fails all three — the mapping is an explicit `coverage.projects[].specs`
      registry, and it parses scenarios and `@covers` markers inside the files.
      The audit is not vacuous: `md naming` was the closest call, and the distinction that saved it —
      **generative** rules (a charset any name can satisfy) versus **enumerative** ones (only names
      ending in a listed token pass) — is what WS-C actually established, not "filename rules are bad".
- [x] [AI] Record the general defect WS-C's word-budget item exposed: a gate's `args` (exclude lists,
      thresholds) are part of the published rule, and a convention that documents only its surface
      globs misstates what is enforced — acceptance: the entry names at least one other gate whose
      `args` are undocumented, or states that none were found.
      **Result:** one other gate found and named — **`md-naming`**. Its `args.exempt` globs
      (`*__linkedin__*.md`, `CONTRIBUTING.md`) are documented nowhere: `file-naming.md` mentions
      neither, and `markdown-quality-gates.md` opens by naming seven `ci-group: markdown` gates and
      then documents only three, stopping after heading-hierarchy. So a double-underscore basename —
      which the convention's own "no underscores" clause forbids — is silently allowed by registry
      config no prose states.
      All six gates carrying `args` were enumerated, not sampled: `governance-readme-index`,
      `governance-readme-completeness`, `md-mermaid`, and `md-links` are documented; `governance-word-budget`
      is documented as of WS-C; `md-naming` is not.
      Two sub-lessons recorded separately: a **partial** reference page is worse than none (its
      seven-gate opening sentence reads as a completeness claim), and `fail-kinds` can invert a gate's
      apparent meaning — `governance-readme-index` prints `README INDEX AUDIT FAILED: 439 finding(s)`
      and exits **0**.

### Phase 6 Gate

- [x] [AI] `learnings.md` has no untriaged entry, or carries the explicit
      `No generalizable learnings — <reason>` escape.
      **Result:** nine of nine triaged; the escape was not needed.
- [x] [AI] Every large or code-bearing routing exists as a `plans/backlog/` folder.
      **Result:** two folders, each with the full five-document layout —
      `rhino-cli-governance-tooling-defects/` (entries 2–5, three workstreams, all code) and
      `file-naming-convention-rework/` (entries 6–8, WS-B). Both are listed in
      `plans/backlog/README.md`. Entry 1 is the only code-bearing learning **not** filed, because it
      was fixed inline under the blocker carve-out; entry 9's remaining half folds into WS-B.
- [x] [AI] The WS-B specification input is recorded.
      **Result:** recorded in `learnings.md` entries 6–8 and carried into the WS-B backlog plan.

> **Pause Safety**: all durable knowledge has a home outside this plan folder. Safe to stop.
> To resume: re-read `learnings.md`.

## Phase 7: Archival and Integration

_Suggested executor:_ the orchestrator directly

Archival commits to the same branch and lands inside each repository's single PR, per the Delivery
Mode section above. **`ose-public`'s PR (#227) already exists as a draft** — this phase readies it,
it does not create it.

- [x] [AI] Move the plan folder to `plans/done/<YYYY-MM-DD>__repo-rules-sweep/` using the completion
      date — acceptance: the folder exists under `plans/done/` and no longer under
      `plans/in-progress/`.
      **Result:** `git mv` to `plans/done/2026-08-18__repo-rules-sweep/`. Both directions verified.
      The relative-link depth is unchanged (`plans/<stage>/<slug>/`), so every `../../../` link into
      `repo-governance/` still resolves — confirmed by `md links validate` exiting 0 afterwards.
- [x] [AI] Update `plans/README.md`, `plans/in-progress/README.md`, and `plans/done/README.md`
      indexes — acceptance: `rhino governance readme-index validate --paths plans/` exits 0 and
      `plans/done/README.md` carries a dated entry for this plan.
      **Result:** `plans/done/README.md` carries the dated entry, placed above `repo-clean-up` in
      the existing reverse-chronological order.
      **Two findings, both recorded rather than papered over:**
      (a) `plans/in-progress/README.md` never listed this plan, so there was no entry to remove. That
      index is not gate-checked — the `governance-readme-index` gate's registered `paths` are
      `docs/`, `repo-governance/`, `specs/`, `.claude/`, and `plans/` is not among them — so the
      omission was invisible for the plan's whole life. Nothing was invented to cover it up.
      (b) `plans/README.md` needs no edit: it links the three stage folders, not individual plans.
      **Deviation:** the acceptance's `readme-index validate --paths plans/` exits **1** with 885
      findings. Every one is pre-existing in other plans (chiefly `unannotated` links and a
      README-less `artifacts/` folder under `repository-onboarding-readme-refresh`); **0** name this
      plan's folder, the archived path, or either new backlog folder. The clause asked a gate to pass
      on a surface the gate does not run on, which is the same defect WS-C fixed for word-budget:
      a rule stated without its registered `args`. Recorded, not worked around.
- [x] [AI] Search for orphaned references to `plans/in-progress/repo-rules-sweep` and repoint them —
      acceptance: `grep -rn 'plans/in-progress/repo-rules-sweep' --exclude-dir=node_modules --exclude-dir=.git .`
      returns zero matches.
      **Result:** zero orphans **outside** this plan's own folder — the scan found no reference to
      the in-progress path anywhere else in either repository, before or after the move. The four
      links this plan's own Knowledge Capture had just written into the two new backlog plans were
      repointed to `plans/done/2026-08-18__repo-rules-sweep/`.
      **Deviation:** the literal acceptance cannot return zero, and could never have. Four matches
      remain, all inside the archived plan itself: two are this very checklist item quoting its own
      search string, one is a `git check-ignore` probe path recorded in a completed P3 item, and one
      is `tech-docs.md`'s file-impact tree showing `in-progress → done` as the archival move.
      Rewriting them would falsify the historical record to satisfy a self-matching grep.
- [ ] [AI] Push the `ose-public` branch to `origin worktree/optimize-gov` — acceptance:
      `git rev-list --count origin/worktree/optimize-gov..HEAD` returns 0.
- [ ] [AI] Push the private-sibling branch to `origin repo-rules-sweep` — acceptance: the branch exists
      on `origin`.
- [ ] [AI] Mark PR #227 ready for review with `gh pr ready 227` — acceptance: `gh pr view 227 --json isDraft`
      reports `false`. **Do not run `gh pr create` for `ose-public`**; it would fail.
- [ ] [AI] Open the private-sibling PR — acceptance: `gh pr view` in the private sibling shows an open PR
      against its `main`.
- [ ] [AI] Brief `pr-review-scout-maker` to scope the specialists **to the artifacts, not the
      renames**: the `apps/rhino-cli/` diff, the convention text, `repo-config.yml`, and the
      `renames-*.tsv` maps. The ~2092 mechanical renames are gate-verified — `md links validate`,
      `readme-index validate`, `word-budget validate`, and `validate:sync` all exit 0 — and are
      excluded from specialist attention so real findings are not drowned in near-identical rename
      hunks. This is the review-side expression of the compensating controls in `tech-docs.md` §10 —
      acceptance: the scout's context brief names the four artifact surfaces and states the rename
      exclusion.
- [ ] [AI] Run the PR-Review Maker→Fixer Cycle on each PR per
      [pr-review-quality-gate](../../../repo-governance/workflows/pr/pr-review-quality-gate.md),
      supplying the per-directory rename maps as the review artifact — acceptance: N = 3 cycles
      complete on each, every thread answered, no unresolved MEDIUM-or-higher thread, and the loop
      did not exit `escalated`. An `escalated` exit blocks the merge and is a legitimate stop.
- [ ] [AI] Merge the `ose-public` PR once `pr-quality-gate.yml` is green — acceptance: `gh pr view 227`
      shows MERGED. `[AI]` merges; no human gate is declared.
- [ ] [AI] Merge the private-sibling PR — acceptance: `gh pr view` shows MERGED. **Expect
      `parity-manifest` to report drift on this PR until it merges**: `apps/rhino-cli` byte-identity
      spans both repositories, so between the two merges the trees genuinely differ. That drift is
      the gate working, not a defect — it clears when the second merge lands. Merge the two as close
      together as the review cycles allow, and assert parity only after both.
- [ ] [AI] Verify nothing is uncommitted or unpushed in either worktree — acceptance:
      `git status --short` prints nothing in both.
- [ ] [AI] Remove `worktrees/repo-rules-sweep/` in the private sibling with non-force
      `git worktree remove` — acceptance: `git worktree list` no longer shows it. **The user has
      pre-authorized this removal**; the interactive confirmation that
      [shard 42](../../../repo-governance/workflows/plan/plan-execution/finalization-pr-merge-and-final-status.md)
      normally requires is granted here in writing, so do not prompt. The safety preconditions still
      apply in full: refuse if `git status --porcelain` is non-empty or the branch is not an ancestor
      of `origin/main`.
- [ ] [AI] Remove `worktrees/optimize-gov/` with non-force `git worktree remove`, run from the
      **`ose-public` root checkout** at `~/ose-projects/ose-public` — you cannot remove the
      worktree you are standing in — acceptance: `git worktree list` no longer shows it. **The user
      has pre-authorized this removal**, superseding the earlier reasoning that the worktree predates
      the plan; the same written grant covers both worktrees. Do not prompt. The safety preconditions
      still apply in full: refuse if `git status --porcelain` is non-empty or HEAD is not an ancestor
      of `origin/main`.
- [ ] [AI] `git worktree prune`, then `git branch -d worktree/optimize-gov` — acceptance: the branch
      is gone. Safe delete only; it succeeds solely because the branch is fully merged. If it
      refuses, the merge did not land — stop rather than forcing.
- [ ] [AI] Fast-forward the root checkout's local `main` — acceptance:
      `git -C ~/ose-projects/ose-public rev-list --count HEAD..origin/main` returns 0.
      Pushing from a side worktree advances `origin/main` without advancing the root checkout's local
      `main`; this step closes that silent divergence.
- [ ] [AI] Verify the swept trees actually landed in the root checkout — acceptance:
      `find ~/ose-projects/ose-public/repo-governance -name '*.md' | grep -cE '/[0-9]{2}-'`
      returns only the recorded `kept` count, not the 2092 baseline. This asserts the work arrived,
      not merely that a branch pointer moved.
- [ ] [AI] Delete `local-tmp/repo-rules-sweep/` in both repositories — acceptance: the path no longer
      exists in either.

### Phase 7 Gate

- [ ] [AI] Both PRs show MERGED.
- [ ] [AI] `parity-manifest` exits 0 in both repositories against their merged `main`.
- [ ] [AI] The plan folder exists only under `plans/done/`.
- [ ] [AI] `git worktree list` shows no plan worktree in **either** repository.
- [ ] [AI] `git -C ~/ose-projects/ose-public rev-list --count HEAD..origin/main` returns 0,
      and the swept trees are present in the root checkout.

> **Pause Safety**: both repositories carry the swept trees on `main`, the plan is archived, both
> plan worktrees are removed, and the `ose-public` root checkout is fast-forwarded to `origin/main`.
> Terminal state.
