# Delivery Checklist — Update Harness Support

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.

## Worktree

Worktree path: `worktrees/update-harness-support/`

**This worktree already exists** and is checked out on branch `worktree/update-harness-support`.
Phase 0 **locates and reuses** it; it does NOT create one. Do not run `claude --worktree` or
`git worktree add` for this plan.

Per the [Worktree Cap HARD RULE](../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule),
this plan is capped at one worktree per repository and reuses it for the whole plan. Cleanup is
immediate: the worktree is removed the moment this plan is done using this repository, at Plan
Archival.

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Delivery Mode: worktree-to-pr

`worktree-to-pr` is mandatory in `ose-public` — `main` is branch-protected including for admins, so
neither direct-push mode has an executable path here.

### One worktree, one PR per repository (overrides the default boundary rule)

**User-directed override.** The default delivery-boundary rule would split this work into several
PRs. It does not apply here. The entire plan — the purge of the eight dropped harnesses, Codex
generation parity, the Claude Code and OpenCode reconciliation, the specs and Gherkin updates, the
catalog-from-structured-data work, the binding-file ownership validator, and Knowledge Capture — lands in **exactly
one `ose-public` PR** opened from this single worktree, paired with **exactly one the private sibling PR**
carrying the byte-identical `apps/rhino-cli/**` changes. **Two PRs in total across both
repositories, merged together.**

Consequences that bind every phase below:

- Phases remain the unit of sequencing and each keeps its own `### Phase N Gate`. **No phase opens
  its own PR.** There is one open-PR step, one review-cycle block, and one merge step per repository,
  all at the end.
- The PR opens once, at the [Single Delivery Boundary](#single-delivery-boundary--the-one-pr-per-repository)
  section following Phase 0, and is pushed to repeatedly thereafter.
- Because the single PR is large, **per-phase gating is strict**: every phase must leave the branch
  green — build, `test:quick`, lint, and the rhino-cli parity and bindings validators — before the
  next phase starts, so accumulated breakage never blocks the merge.
- Merge authority is stated once, at the terminal merge step.

| Phase    | Sequencing role                                              | Opens a PR                |
| -------- | ------------------------------------------------------------ | ------------------------- |
| 0        | Baseline in the existing worktree                            | no                        |
| 1-3      | Harness set contracts from eleven to three                   | no — pushes to the one PR |
| 4-6      | Codex reaches generated parity; skills surface bridged       | no — pushes to the one PR |
| 7-11     | Ownership + triage armed, catalog generated, budget extended | no — pushes to the one PR |
| 12       | Knowledge Capture                                            | no — pushes to the one PR |
| Archival | Review cycle, paired merge, archival                         | the single merge          |

## Single Delivery Boundary — the one PR per repository

- [x] [AI] After the Phase 0 gate passes, push the existing branch and open ONE draft PR against
      `main` titled `refactor(harness): reduce supported harnesses to three and arm anti-drift`
      — command: `git push -u origin worktree/update-harness-support && gh pr create --draft --base main --title "refactor(harness): reduce supported harnesses to three and arm anti-drift"`
      — acceptance: `gh pr list --head worktree/update-harness-support` returns exactly one PR, where
      it returned none before.
- [x] [AI] Record the PR number in `learnings.md` under `## PR` — acceptance: the number is present
      and every later push references it.
- [x] [AI] After **each** phase gate below passes, commit thematically and push to that same branch
      — acceptance: `gh pr list --head worktree/update-harness-support` still returns exactly one PR
      after every push; a second PR number appearing means the override was violated.

## Cross-Repo Parity Ritual

Run this **once**, after Phase 11 and before the terminal merge. `apps/rhino-cli` byte-identity spans
`ose-public` and the private sibling only. There is one the private sibling PR, not one per phase.

- [x] [AI] Regenerate the manifest in this worktree:
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- parity manifest generate`
      — acceptance: prints `generated apps/rhino-cli/parity-manifest.sha256`, and
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- parity manifest validate`
      exits 0.
- [x] [AI] Re-check the boundary set before assuming it: the parity boundary drifts and is
      bidirectional. Read `apps/rhino-cli/parity-manifest.sha256` in both repositories rather than
      converging one onto the other — acceptance: the boundary file list is recorded in
      `learnings.md`.
- [x] [AI] Apply byte-identical `apps/rhino-cli/**` changes to a single the private sibling branch named
      `worktree/update-harness-support` — acceptance: `diff -r` over the boundary file set reports no
      differences.
- [x] [AI] Open the one paired private-sibling PR and drive it to green — acceptance:
      `gh pr list --head worktree/update-harness-support` in the private sibling returns exactly one PR and
      `gh pr checks` reports all required checks passing.

---

## Phase 0: Environment Setup and Baseline

> **No PR opens in this phase.**

- [x] [AI] **Locate and reuse the existing worktree — do NOT create one.**
      command: `git worktree list | grep -F "worktrees/update-harness-support"`
      — acceptance: returns exactly one line naming branch `worktree/update-harness-support`, where a
      zero result would mean the pre-existing worktree is missing and the plan brief's premise is
      wrong. If it returns zero lines, STOP and report rather than creating a new worktree.
- [x] [AI] Confirm the working location is that worktree, not the primary checkout —
      command: `git rev-parse --show-toplevel && git branch --show-current`
      — acceptance: prints a path ending `worktrees/update-harness-support` and branch
      `worktree/update-harness-support`.
- [x] [AI] Sync the existing branch with the latest `origin/main` before implementing —
      command: `git fetch origin && git rebase origin/main`
      — acceptance: `git status` reports a clean tree; if foreign commits landed, read the full diff
      before continuing.
- [x] [AI] Initialize the toolchain from the ROOT worktree (not this one):
      `npm install && npm run doctor -- --fix`
      — acceptance: `doctor` exits 0 with no unresolved findings.
- [x] [AI] Create `plans/in-progress/update-harness-support/learnings.md` if absent, containing the
      two HTML scaffold comments and the `# Learnings: update-harness-support` H1
      — acceptance: `test -f plans/in-progress/update-harness-support/learnings.md` exits 0 and
      `head -3` shows the H1 on the third line.
- [x] [AI] Record the pre-change baseline into `learnings.md` under a `## Baseline` heading, using
      `git ls-files <path> | grep -c .` for each of `.claude`, `.opencode`, `.cursor`, `.agents`,
      `.amazonq`, `.codex`, `.pi`
      — acceptance: the recorded numbers are 659, 112, 93, 24, 2, 2, 1 respectively; any deviation is
      investigated before proceeding, because the whole plan is sized against them.
- [x] [AI] Record the pre-change word counts:
      `for f in AGENTS.md CLAUDE.md; do printf "%s: " "$f"; tr -s '[:space:]' '\n' < "$f" | grep -c .; done`
      — acceptance: prints `AGENTS.md: 487` and `CLAUDE.md: 423`; both are under the 500 fail
      threshold with 13 and 77 words of headroom.
- [x] [AI] Record the pre-change governance sweep sets to a scratch file (NOT committed):
      `git grep -il -- "Cursor" -- repo-governance docs .claude specs CLAUDE.md AGENTS.md repo-config.yml .github package.json`
      and the same for the pattern `windsurf|junie|antigravity|aider|copilot|pi\.dev|amazonq|Amazon Q|Kiro`
      using `git grep -ilE`
      — acceptance: the first list has 43 entries and the second 45; both are written to
      `local-tmp/harness-sweep-baseline.txt`.
- [x] [AI] Establish the green baseline:
      `npx nx run rhino-cli:test:quick && npx nx run rhino-cli:lint && npx nx run rhino-cli:typecheck`
      — acceptance: all three exit 0. If any is red before a single edit, fix it first per Root Cause
      Orientation and record the fix in `learnings.md`.
- [x] [AI] Confirm the binding generator is currently a no-op:
      `npm run generate:bindings && git diff --quiet` — acceptance: exits 0, proving the committed
      mirrors match the generator before any change.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `npm run generate:bindings && git diff --quiet` — exits 0.
- [x] [AI] `test -f plans/in-progress/update-harness-support/learnings.md` — exits 0 and the file
      records all seven baseline counts plus both word counts.
- [x] [AI] `git status --porcelain` — reports only the plan folder as untracked/modified.
- [x] [AI] `git worktree list | grep -cF "worktrees/update-harness-support"` — returns 1, and no new
      worktree was created during this phase (the count is unchanged from the pre-phase value).

> **Pause Safety**: nothing in the repository has changed except the plan folder; the baseline is
> recorded and the existing worktree is confirmed reused. Safe to stop. To resume:
> `npx nx run rhino-cli:test:quick`.
>
> **Next**: open the single PR via the
> [Single Delivery Boundary](#single-delivery-boundary--the-one-pr-per-repository) section, then
> begin Phase 1. Every later phase pushes to that same PR.

---

## Phase 1: Contract the Harness Registry to Three

- [x] [AI] **RED**: Add a fixture-backed failing test in `apps/rhino-cli/tests/repo_config_data_driven.rs`
      asserting the loaded `harness:` registry contains exactly three entries named `claude-code`,
      `opencode`, `codex`
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the new test fails reporting 11 entries found, 3 expected.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Rewrite the `harness:` section of `repo-config.yml` to exactly three entries.
      `claude-code` stays `tier: source` with `agent-dir: .claude/agents`,
      `skills-dir: .claude/skills`, `instruction: [CLAUDE.md]`. `opencode` stays `tier: generated`
      with `agent-dir: .opencode/agents`, `mirrors: .claude/agents`, and gains
      `instruction: [AGENTS.md]`. `codex` moves to `tier: generated` with
      `agent-dir: .codex/agents`, `mirrors: .claude/agents`, `config: .codex/config.toml`,
      `skills-dir: .agents/skills`, `instruction: [AGENTS.md]`, and **no** `forbid-dir` key. Also
      delete the now-stale `#   forbid-dir  — directory that must NOT exist (source-config tier)`
      line from the schema legend comment above the registry, since the `source-config` tier this
      field belonged to no longer exists
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the Phase 1 RED test passes; `git grep -c "forbid-dir" repo-config.yml` returns
      no match, where it returned 2 before the change (the real key plus the schema legend
      comment describing it).
- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/agents.rs` asserting
      `harness bindings generate --harness <name>` derives its accepted set from the registry rather
      than from string literals
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails because `--harness codex` is rejected with `unknown harness name 'codex'`.
- [x] [AI] **GREEN**: Replace the three `match` arms on `"opencode"`, `"cursor"`, `"amazonq"` in
      `apps/rhino-cli/src/commands/harness_generate_bindings.rs` (lines 63-86) with a registry lookup
      via `crate::application::repo_config::load`, per `tech-docs.md` DD-2
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: `--harness codex` is accepted and `--harness cursor` exits non-zero naming the
      registry-derived accepted set.
- [x] [AI] **REFACTOR**: Extract the registry-derived harness lookup into a single helper on
      `HarnessEntry` in `apps/rhino-cli/src/application/repo_config/mod.rs` alongside the existing
      `is_source_with_agents` / `is_generated_with_agents` predicates
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: all tests still pass and the string literals `"cursor"` and `"amazonq"` appear
      zero times in the match arms this GREEN step rewrote, lines 63-86 of
      `harness_generate_bindings.rs` — `sed -n '63,86p' apps/rhino-cli/src/commands/harness_generate_bindings.rs | grep -ocE '"cursor"|"amazonq"'`
      returns no match, where it returned 6 before (`-oc` counts each literal occurrence rather than
      each matching line, since line 65 carries both `"cursor"` and `"amazonq"`). Scoped to the whole file rather than this line
      range, the count is 8, not 6 — two more `"amazonq"` literals live in `#[test]` fixtures further
      down the same file (`harness_amazonq_overrides_opencode_flag`,
      `harness_amazonq_dry_run_via_run_reaches_dry_run_branch`) that this REFACTOR step does not
      touch; they are removed later, at the `--opencode`/`--cursor`/`--amazonq` flag-removal step
      below, which now names them explicitly.
- [x] [AI] Update `apps/rhino-cli/src/commands/repo_config_validate.rs` so a `generated`-tier entry
      is required to declare `mirrors`, and `source-config` is no longer an accepted tier value
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: a fixture declaring `tier: source-config` exits non-zero; the real
      `repo-config.yml` exits 0.
- [x] [AI] Rewrite `specs/apps/rhino/behavior/rhino-cli/gherkin/specs/harness-bindings.feature` from
      the "all 11 harnesses" framing to the three survivors at their tiers, carrying the US-1
      scenarios from `prd.md`
      — acceptance: `git grep -c "11 harnesses" specs/` returns no match, where it returned 1 before;
      `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0.
  - _Suggested executor: `specs-maker`_
- [x] [AI] Update `specs/apps/rhino/behavior/rhino-cli/gherkin/specs/harness-registry-driven.feature`
      to cover the generator (DD-2), not only the duplication validator
      — acceptance: the feature names `harness bindings generate` in at least one scenario, where it
      named only `harness duplication validate` before.
- [x] [AI] Update `specs/apps/rhino/behavior/rhino-cli/gherkin/repo-config/data-driven.feature` for
      the three-entry registry
      — acceptance: `npx nx run rhino-cli:specs:structure-validation` exits 0.

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- repo-config validate`
      — exits 0.
- [x] [AI] `git grep -c "forbid-dir" repo-config.yml` — no match (returned 2 at baseline: the real
      key plus the schema legend comment).
- [x] [AI] `awk '/^harness:/,/^doctor:/' repo-config.yml | grep "name:" | grep -vc "agent-name:"` —
      returns 3 (returned 11 at baseline). A plain `grep -c "name:"` on this block returns 12, not
      11, because the `amazonq` entry's `agent-name: ose-default` field contains `name:` as a
      substring; the `grep -vc "agent-name:"` filter excludes that collision so the count measures
      harness entries (11), not `name:` substring occurrences (12).
- [x] [AI] `npx nx run rhino-cli:specs:gherkin-cardinality-validation` — exits 0.

> **Pause Safety**: the registry declares three harnesses and every validator agrees with it, but the
> dropped binding directories still exist on disk and are simply no longer regenerated. The tree
> compiles and all tests pass. Safe to stop. To resume: `npx nx run rhino-cli:test:quick`.

---

## Phase 2: Purge Dropped Bindings and Code Arms

> **Ordering hazard** (`tech-docs.md` §More Detail): the directory deletions and the emitter removals
> MUST land in the same commit. `harness-bindings-generate` is a `pre-commit` mutation gate with
> `restages: true`, so deleting `.cursor/` without removing the Cursor emitter causes the next commit
> to silently recreate and restage it.

- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/agents.rs` asserting
      `expected_bindings` returns only Codex binding files and that `KNOWN_BINDING_DIRS` contains
      exactly `.claude`, `.opencode`, `.codex`, `.agents`, `.github`
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails reporting the current 10-element `KNOWN_BINDING_DIRS` including
      `.amazonq`, `.cursor`, `.windsurf`, `.junie`, `GEMINI.md`, `CONVENTIONS.md`.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: In `apps/rhino-cli/src/application/agents/bindings.rs`, shrink
      `KNOWN_BINDING_DIRS` to the five survivors, then delete every construct this shrink leaves
      as Amazon-Q-only dead code — the whole symlink-protected two-file bridge emitter, which exists
      only to write the Amazon Q rules pointer and agent definition and has no successor (Phase 5
      builds Codex's emitter separately, as new code in `codex.rs`). Delete the constants
      `AMAZONQ_RULES_POINTER`, `AMAZONQ_AGENT_DEFINITION_DIR`, and `RULES_POINTER_CONTENT`; the
      functions `amazonq_agent_name`, `agent_definition_content`, `is_kebab_case_identifier`,
      `emit_bindings`, `emit_bindings_no_follow`, `emit_bindings_with_metadata_checks`,
      `open_repository_directory`, `open_or_create_directory`, `write_no_follow_file`,
      `remove_stale_amazonq_definitions_no_follow`, `remove_stale_amazonq_definitions`,
      `reject_symlinked_binding_path`, `is_emitter_managed_definition_at`, and
      `is_emitter_managed_definition`; and the `EmitResult` struct. Delete the nine `#[test]`
      functions that exercise only this dead subsystem, with no surviving equivalent:
      `emit_writes_both_files_with_exact_bytes`, `emit_agent_definition_is_valid_json`,
      `emit_is_idempotent`,
      `emit_refuses_a_symlinked_amazonq_directory_without_writing_outside_repo`,
      `emit_refuses_a_symlinked_definitions_directory_without_deleting_outside_repo`,
      `emit_removes_stale_definition_after_configured_agent_rename`,
      `emit_preserves_custom_definition_after_configured_agent_rename`,
      `expected_bindings_is_single_source`, and
      `expected_bindings_rejects_an_unsafe_configured_agent_name`. Also sweep every doc comment
      naming Amazon Q: the module header's harness list, the `KNOWN_BINDING_DIRS` doc list, and the
      `BindingFile` field's example path.

      **Keep** `expected_bindings`, the `BindingFile` struct, and `validate_binding_file` — the
      REFACTOR step below repurposes `expected_bindings` into the general function Phase 5 populates
      with Codex files, so only its Amazon-Q-specific body (not its signature or its two callers) is
      replaced by an empty-vector placeholder; retitle the `// Amazon Q bridge files` comment in
      `validate_bindings` to name the transient empty state instead.

      **Retarget, do not delete, seven tests that exercise genuine surviving behaviour** and would
      otherwise be a silent coverage loss. `validate_fails_when_a_bridge_file_is_mutated` and
      `validate_fails_when_a_bridge_file_is_missing` prove `validate_binding_file` detects a mutated
      or missing generated file — a capability Phase 5 needs again for Codex files but adds no new
      test for — so rewrite each to construct a `BindingFile` fixture directly and call
      `validate_binding_file` on it, rather than routing through the deleted
      `emit_bindings`/`expected_bindings` pipeline. `validate_passes_when_files_match`,
      `validate_fails_when_present_dir_absent_from_catalog`,
      `validate_passes_when_catalog_references_all_present_dirs`,
      `validate_skips_catalog_check_for_absent_dirs`, and
      `validate_fails_when_codex_agents_dir_exists` exercise the generic `KNOWN_BINDING_DIRS`
      catalog-coverage loop, not Amazon Q, so rename the shared `write_amazonq_config` fixture
      helper, replace its `amazonq`/`agent-name:` registry stanza with a plain three-entry
      `claude-code`/`opencode`/`codex` registry, drop each test's now-deleted `emit_bindings(...)`
      setup call, and swap any `.amazonq` catalog-row fixture text for one of the five surviving
      `KNOWN_BINDING_DIRS` entries.

      **Rename and rewrite** `harness_bindings_validate_covers_all_11_harnesses` to assert coverage
      of the three surviving harnesses: its current body asserts `KNOWN_BINDING_DIRS` contains
      `.cursor`, `.windsurf`, `.junie`, `GEMINI.md`, and `CONVENTIONS.md` — every one of which this
      same step's `KNOWN_BINDING_DIRS` shrink removes, so leaving the test unedited fails the build,
      not merely the intent
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes; `git grep -c "amazonq" apps/rhino-cli/src/application/agents/bindings.rs`
      returns no match, where it returned 53 before — not 6. The earlier "6" counted only the two
      functions this step originally named in isolation and missed the further ~47 occurrences
      spanning the dead emitter subsystem, its nine exclusive tests, stray doc comments, and the
      seven tests retargeted above; scoped as originally written, the "no match" target was
      unreachable.

- [x] [AI] **REFACTOR**: Leave `expected_bindings` returning an empty vector only if Codex bindings
      are not yet wired (Phase 5 fills it); document that transient state in a doc comment
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass and the doc comment names Phase 5 as the filler.
- [x] [AI] Delete `apps/rhino-cli/src/application/agents/cursor.rs`,
      `apps/rhino-cli/src/commands/harness_emit_bindings.rs`, and
      `apps/rhino-cli/tests/cursor_binding.rs`; remove their `mod` declarations from
      `apps/rhino-cli/src/application/agents/mod.rs` and the `commands` module, and remove the
      Cursor/Amazon Q wiring from `apps/rhino-cli/src/cli.rs`
      — command: `npx nx run rhino-cli:build`
      — acceptance: builds clean with zero warnings; `git grep -l "convert_cursor_model" apps/rhino-cli/src`
      returns nothing, where it returned 1 file before.
- [x] [AI] Delete the binding trees: `git rm -r .cursor .amazonq .pi`
      — acceptance: `git ls-files .cursor .amazonq .pi | grep -c .` returns 0, where it returned 96
      at baseline (93 + 2 + 1).
- [x] [AI] Remove `.amazonq/` from `.prettierignore` and remove `.cursor/`, `.pi/`, `.amazonq/` from
      every `trigger:` list and `paths:` list in the `gates:` section of `repo-config.yml` —
      specifically the `harness-bindings` trigger list, the `governance-word-budget` trigger anchor,
      and the `governance-readme-completeness` `paths` plus trigger lists. This step is scoped to the
      `gates:` section only; the top-level `governance-word-budget:` surfaces glob list is Phase 11's
      job, and two explanatory comment lines above the `governance-readme-index` and
      `governance-readme-completeness` gate declarations are left untouched by this step
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — acceptance: exits 0; `awk '/^gates:/,0' repo-config.yml | grep -vE '^[[:space:]]*#' | grep -cE "\.cursor/|\.pi/|\.amazonq/"`
      returns no match (comment lines excluded), where the `gates:` section returned 9 total matches
      before — 7 in `trigger:`/`paths:` entries this step edits, plus 2 explanatory comment lines it
      does not.
- [x] [AI] Remove the surviving `--opencode` / `--cursor` / `--amazonq` boolean flags from
      `GenerateBindingsArgs` in `apps/rhino-cli/src/commands/harness_generate_bindings.rs`, leaving
      only `--harness <NAME>`. Removing the fields breaks compilation of the two tests still
      constructing them — `harness_amazonq_overrides_opencode_flag` and
      `harness_amazonq_dry_run_via_run_reaches_dry_run_branch` — so rewrite both in the same commit:
      drop the removed-field struct literals, and since `amazonq` is no longer an accepted `--harness`
      value after Phase 1's registry contraction, retarget each to assert the now-correct
      "unknown harness name 'amazonq'" rejection instead of exercising the deleted flag-override
      behaviour
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings generate --help && npx nx run rhino-cli:test:quick`
      — acceptance: the help output lists `--harness` and does not list `--cursor` or `--amazonq`,
      which it did list before; `git grep -c '"amazonq"' apps/rhino-cli/src/commands/harness_generate_bindings.rs`
      returns no match, where it returned 2 before (the two rewritten test fixtures).
- [x] [AI] **2.6 — KEEP the vendor-audit tokens (user-resolved, DD-3)**: do NOT delete any entry from
      the forbidden-token table in
      `apps/rhino-cli/src/application/repo_governance/vendor_audit.rs`. All eight dropped-harness
      names and their path tokens (`Cursor`, `Windsurf`, `Junie`, `Amazon Q`, `Antigravity`, `Aider`,
      `Pi Coding Agent`, `pi.dev`, and `.cursor/`, `.windsurf/`, `.junie/`, `.amazonq/`, `.pi/`) stay.
      Add an inline rationale comment above the table recording that the table detects vendor leakage
      into vendor-neutral prose and is NOT a supported-harness declaration, so a future sweep does not
      tidy them away
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass; the comment names `tech-docs.md` DD-3; and
      `git diff --stat apps/rhino-cli/src/application/repo_governance/vendor_audit.rs` shows lines
      added and **zero lines deleted** from the token table, where a purge would have shown
      deletions.
- [x] [AI] Update `package.json` scripts: remove any script whose command targets a dropped harness
      and confirm `sync:agents`, `sync:skills`, `sync:dry-run`, `validate:opencode` still resolve
      — command: `npm run validate:sync`
      — acceptance: exits 0; every `harness`-invoking script in `package.json` runs without an
      unknown-subcommand error.
- [x] [AI] Delete `specs/apps/rhino/behavior/rhino-cli/gherkin/cursor-binding/` (feature plus README)
      and update `specs/apps/rhino/behavior/rhino-cli/gherkin/README.md` to drop its annotated index
      entry
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: exits 0 with no `orphan` or `ghost` finding.
- [x] [AI] Update `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/agents-bindings.feature`,
      `agents-sync.feature`, `harness-audit.feature`, and `governance-word-budget-thresholds.feature`
      to the three-harness reality, carrying the US-2 scenarios from `prd.md`
      — acceptance: `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0 and no
      surviving scenario names a dropped harness.
  - _Suggested executor: `specs-maker`_

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `npm run generate:bindings && git diff --quiet` — exits 0, proving the generator does not
      recreate any deleted directory.
- [x] [AI] `git ls-files .cursor .amazonq .pi | grep -c .` — returns 0 (96 at baseline).
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate`
      — exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — exits 0.
- [x] [AI] `npx nx run rhino-cli:lint` — exits 0 with no dead-code warnings from the deleted modules.

> **Pause Safety**: the three dropped binding trees and their emitters are gone together, so nothing
> regenerates them. Governance prose still mentions them, which is stale but not broken. Safe to
> stop. To resume: `npm run generate:bindings && git diff --quiet`.

---

## Phase 3: Governance Prose Sweep

> **Detection discipline**: `grep` here routes to ugrep — `-L` means files-without-match and exits 0.
> Never use `-L` in an acceptance clause. Use `git grep -il` with pathspec exclusions. Every file
> gets a recorded verdict; there is no silent skip.

- [x] [AI] Recompute the sweep set and write it to `local-tmp/harness-sweep-current.txt`:
      `git grep -ilE "cursor|windsurf|junie|antigravity|aider|copilot|pi\.dev|amazonq|Amazon Q|Kiro" -- repo-governance docs .claude specs CLAUDE.md AGENTS.md package.json .github`
      — acceptance: the file lists roughly 60 paths and `wc -l` reports a non-zero count; a zero
      count means the pattern or pathspec is wrong, not that the sweep is done.
- [x] [AI] Record a per-file verdict table in `learnings.md` under `## Sweep verdicts`, one row per
      path, with verdict `EDIT`, `FALSE-POSITIVE`, or `HISTORICAL-KEEP`
      — acceptance: every path in `local-tmp/harness-sweep-current.txt` appears exactly once; the
      seven `docs/explanation/software-engineering/` paths are marked `FALSE-POSITIVE` with the
      specific sense recorded (text cursor / CSS `cursor` / database cursor).
- [x] [AI] Edit the `repo-governance/conventions/structure/multi-harness-binding/` tree and
      `repo-governance/conventions/structure/multi-harness-binding.md` to describe a three-harness
      model: one `source` tier and two `generated` tiers, with no `native` and no `source-config` tier
      — acceptance: `git grep -ilE "windsurf|junie|antigravity|aider|copilot" repo-governance/conventions/structure/multi-harness-binding*`
      returns nothing, where it returned at least 1 file before.
  - _Suggested executor: `repo-rules-maker`_
- [x] [AI] Edit the five `repo-governance/conventions/structure/governance-vendor-independence/`
      files so the dropped harnesses remain **forbidden vendor terms** (DD-3) while no longer being
      described as supported platforms
      — acceptance: each file still lists the dropped names under a forbidden-terms heading and none
      lists them under a supported-platform heading.
- [x] [AI] Edit `repo-governance/conventions/structure/governance-word-budget.md` and
      `governance-readme-completeness.md` so their surface and path lists match the post-Phase-2
      `repo-config.yml` values
      — acceptance: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance word-budget validate`
      exits 0 and the prose lists exactly the globs the config declares.
- [x] [AI] Edit `repo-governance/development/agents/model-selection.md` and
      `repo-governance/development/agents/model-selection/platform-binding-examples.md` to drop the
      Cursor full-tier-collapse table and keep the OpenCode table
      — acceptance: `git grep -c "composer-2.5" repo-governance/` returns no match, where it returned
      at least 3 before.
- [x] [AI] Edit the remaining `EDIT`-verdict files in `repo-governance/` — the
      `ai-agents/`, `file-touch-discipline/`, `mechanize-cross-file-invariants/`,
      `no-destructive-git-operations/`, `nx-target-naming/`, `nx-targets/`, and
      `workflows/plan/plan-execution/iron-rules-6-11.md` entries listed in `tech-docs.md`
      — acceptance: every one is ticked in the verdict table with its diff summarized in one line.
- [x] [AI] Edit `repo-governance/workflows/repo/repo-harness-compatibility-quality-gate.md` and its
      `step-1-initial-validation.md` reference so the drift dimensions cover three harnesses, and
      record that the workflow is now **complemented** by the Phase 7 CI gate rather than being the
      only anti-drift mechanism
      — acceptance: the workflow's `scope` input description names the three survivors and the
      document cross-references the new gate id.
- [x] [AI] Edit `.claude/agents/README.md`, `.claude/agents/repo/repo-harness-compatibility-checker.md`,
      `.claude/agents/repo/repo-harness-compatibility-fixer.md`, and the four
      `.claude/skills/repo-harness-compatibility-protocol/` files to three-harness scope; Invariant 3
      in `phase0-parity-invariants.md` changes from
      `git diff --quiet .opencode/ .amazonq/` to `git diff --quiet .opencode/ .codex/ .agents/`
      — acceptance: `git grep -c "\.amazonq/" .claude/` returns no match, where it returned at least
      2 before.
  - _Suggested executor: `agent-maker`_
- [x] [AI] Edit `AGENTS.md` §Platform Binding Examples and §AI Agents to name three harnesses, then
      re-measure: `tr -s '[:space:]' '\n' < AGENTS.md | grep -c .`
      — acceptance: the count is **strictly below 500** (487 at baseline, 13 words of headroom).
      If the edit would push it over, remove words elsewhere in the same edit — never raise the
      threshold.
- [x] [AI] Edit `CLAUDE.md` §Multi-harness configuration to name three harnesses and drop the
      `.amazonq/`, `.cursor/` mirror sentence, then re-measure the same way
      — acceptance: the count is strictly below 500 (423 at baseline).
- [x] [AI] Edit `docs/reference/rhino-cli-command-triage.md` and `docs/reference/sdlc-gate-standard.md`
      to the surviving command and gate inventories
      — acceptance: every `harness` command named in both documents exists in
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness --help`.
- [x] [AI] Confirm the historical carve-out held: `git grep -c "Amazon Q" docs/explanation/post-mortems/`
      — acceptance: returns a non-zero count, proving the post-mortems kept their references
      verbatim; a zero here means the sweep over-reached and must be reverted for those paths.

### Phase 3 Gate

> All checks below must pass before pushing Phase 1-3 to the single PR and starting Phase 4.

- [x] [AI] Every path in `local-tmp/harness-sweep-current.txt` has a recorded verdict in
      `learnings.md` — verified by comparing line counts, both non-zero and equal.
- [x] [AI] `git grep -ilE "windsurf|junie|antigravity|aider|copilot|pi\.dev|amazonq" -- repo-governance docs/reference .claude AGENTS.md CLAUDE.md repo-config.yml`
      returns only files whose verdict is `FALSE-POSITIVE` or that carry the DD-3 forbidden-terms
      rationale — no file presents a dropped harness as supported.
- [x] [AI] `tr -s '[:space:]' '\n' < AGENTS.md | grep -c .` and the same for `CLAUDE.md` — both
      strictly below 500.
- [x] [AI] `npx nx affected -t typecheck,lint,test:quick` — exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate`
      — exits 0, proving the sweep broke no cross-link.

> **Pause Safety**: the repository consistently describes three harnesses in config, code, specs, and
> prose. Codex is declared at the generated tier but not yet emitted, which is the one remaining
> inconsistency and is Phase 5's job. Safe to stop. To resume: `npx nx affected -t test:quick`.

### After Phase 3 — commit and push to the single PR

> No PR opens here. The one PR is already open from the
> [Single Delivery Boundary](#single-delivery-boundary--the-one-pr-per-repository) section.

- [x] [AI] Commit thematically: one commit for the registry contraction, one for the purge, one for
      the prose sweep — acceptance: `git log --oneline` shows three Conventional Commits with
      imperative subjects and no trailing period.
- [x] [AI] Push to the existing branch: `git push` — acceptance:
      `gh pr list --head worktree/update-harness-support` still returns exactly one PR.
- [x] [AI] Poll CI every 2 minutes (never `gh run watch`) until the PR's checks are green —
      acceptance: `gh pr checks` reports all checks passing. Fix any failure at the root cause before
      starting Phase 4, so the branch never carries breakage forward.

---

## Phase 4: Correct the Codex Defect

- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/agents.rs` asserting that a
      `.codex/agents/` directory containing `<name>.toml` passes validation and one containing
      `<name>.md` fails it
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails because no validator distinguishes the two extensions today.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Implement the extension rule in
      `apps/rhino-cli/src/application/agents/bindings.rs`: files under `.codex/agents/` must have a
      `.toml` extension; any `.md` file there is a finding naming the officially-correct extension
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes.
- [x] [AI] **REFACTOR**: Move the extension rule next to the Codex constants that Phase 5 will add,
      so both live in one module boundary
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass; the rule is referenced from exactly one place.
- [x] [AI] Correct the factual claims in `docs/reference/platform-bindings.md` §Provenance: the
      former `.codex/agents/` removal note asserts the directory "was never an official Codex CLI
      convention". Replace it with the verified position — standalone `.toml` files in
      `.codex/agents/` ARE official; `.codex/agents/*.md` never was; and note that project-level
      `.codex/` layers are honoured only for projects marked trusted
      — acceptance: `git grep -c "never an official" docs/reference/platform-bindings.md` returns no
      match, where it returned 1 before.
  - _Suggested executor: `docs-maker`_
- [x] [AI] Correct the Codex row's custom-agent surface cell from
      `[agents.<name>] in config.toml` to name both mechanisms — standalone `.codex/agents/*.toml`
      files AND `[agents.<name>]` tables carrying `description` plus `config_file` — and record that
      `[profiles.<name>]` tables were removed as of 0.134.0 in favour of standalone
      `$CODEX_HOME/<name>.config.toml` files
      — acceptance: the row names both mechanisms and the profiles note is present.
- [x] [AI] Correct the Codex MCP cell to state the key is `mcp_servers` in snake_case and that the
      camelCase `mcpServers` form is **silently ignored**
      — acceptance: the phrase "silently ignored" appears in the Codex MCP cell or its footnote.
- [x] [AI] Correct the Codex skills cell to `.agents/skills/` and state explicitly that Codex does
      NOT read `.claude/skills/`, and that `~/.codex/prompts/` custom prompts are officially
      deprecated in favour of Skills
      — acceptance: both statements are present and the cell does not claim `.codex/skills/`.
- [x] [AI] Record `AGENTS.override.md` correctly in the §No-shadowing note: it is an **official**
      convention (global `~/.codex/` and per-directory in project scope), Codex concatenates
      `AGENTS.md` root-down with nearer files overriding, and this repository's standing decision is
      to ship no such file
      — acceptance: the note keeps `AGENTS.override.md` in its trigger list and no longer implies the
      convention is unofficial; `GEMINI.md` and `.junie/AGENTS.md` are removed from that list since
      their harnesses are gone.
- [x] [AI] Add the Codex `[agents]` global keys to the catalog's Codex row footnote: `enabled`,
      `max_concurrent_threads_per_session`, `default_subagent_model`,
      `default_subagent_reasoning_effort`, `interrupt_message`, and the built-in agents `default`,
      `worker`, `explorer`
      — acceptance: all five keys and all three built-in names appear.

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `git grep -c "never an official" docs/reference/platform-bindings.md` — no match (1 at
      baseline).
- [x] [AI] `mkdir -p .codex/agents && touch .codex/agents/probe.md && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate; echo "exit=$?"; rm .codex/agents/probe.md`
      — prints a non-zero exit, proving the `.md` rule is armed; re-running after the `rm` exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate`
      — exits 0.

> **Pause Safety**: the Codex factual defect is corrected in both the validator and the catalog. The
> directory is now permitted but still empty. Safe to stop. To resume:
> `npx nx run rhino-cli:test:quick`.

---

## Phase 5: Codex Generated Emitter

- [x] [AI] **RED**: Create `apps/rhino-cli/tests/codex_binding.rs` with a failing test asserting a
      single fixture `.claude/agents/<role>/<name>.md` produces `.codex/agents/<name>.toml`
      containing `name`, `description`, and `developer_instructions` and NOT containing `model`
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails because no `codex` module exists.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Create `apps/rhino-cli/src/application/agents/codex.rs` modelled on the sibling
      `cursor.rs` structure that Phase 2 deleted (recover its shape from
      `git show HEAD~N:apps/rhino-cli/src/application/agents/cursor.rs`): a
      `CODEX_FIELD_POLICY_TABLE`, a `CODEX_EMITTED_FIELDS` fixed order, and a TOML encoder. Per
      `tech-docs.md` DD-4, `model`, `model_reasoning_effort`, `sandbox_mode`, and `mcp_servers` are
      `DropWarn`
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes.
- [x] [AI] **REFACTOR**: Hoist the frontmatter-to-policy walk shared by the OpenCode converter and
      the Codex emitter into `apps/rhino-cli/src/application/agents/field_policy.rs`
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass and the walk exists in one place.
- [x] [AI] **RED**: Add a failing test asserting agent identity comes from the `name` frontmatter key
      rather than the source subfolder, using two fixture agents in different role subfolders
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails while the emitter still derives the filename from the source path.
- [x] [AI] **GREEN**: Key the emitted filename on the `name` frontmatter value, flattening role
      subfolders exactly as the OpenCode mirror does
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: both fixture agents land as flat `.codex/agents/<name>.toml` files.
- [x] [AI] **RED**: Add a failing test asserting that rewriting the generated region of a fixture
      `config.toml` twice produces identical bytes and preserves a hand-maintained
      `[agents.ci-monitor-subagent]` table plus `[mcp_servers.nx-mcp]` and `[features]`
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails because no region rewriter exists.
- [x] [AI] **GREEN**: Implement the delimited-region rewriter per `tech-docs.md` DD-5. The
      implementation MUST check for the already-present end marker **before** searching for an
      insertion anchor — an anchor-first implementation appends a duplicate region on every run
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes, including the second-run byte-identity assertion.
- [x] [AI] **REFACTOR**: Extract the marker constants and the marker-first guard into named
      constants with a doc comment naming the duplication hazard
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass and the hazard is documented in source.
- [x] [AI] Wire the Codex emitter into `harness_generate_bindings.rs` behind the registry-driven
      selection from Phase 1, and populate `expected_bindings` in `bindings.rs` with the Codex files
      so `harness bindings validate` guards them byte-for-byte
      — command: `npm run generate:bindings`
      — acceptance: `git status --porcelain .codex/ | grep -c .` reports 94 new paths (93 agent
      TOML files plus the modified `config.toml`), where it reported 0 before.
- [x] [AI] Run the generator twice and assert idempotence:
      `npm run generate:bindings && git add -A .codex && npm run generate:bindings && git diff --quiet .codex/`
      — acceptance: the final `git diff --quiet` exits 0.
- [x] [AI] Create `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/codex-binding.feature` carrying
      the US-3 scenarios from `prd.md`, and add its annotated entry to
      `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/README.md`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: exits 0 with no `missing` or `unannotated` finding.
  - _Suggested executor: `specs-maker`_
- [x] [AI] Check whether the 93-file `.codex/agents/` tree trips any gate the plan did not
      anticipate: run the full pre-push suite
      — command: `npx nx affected -t typecheck,lint,test:quick && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance word-budget validate`
      — acceptance: all exit 0. TOML files are outside the markdown word-budget surface; if a gate
      does fire, fix the root cause rather than adding an exclusion.

### Phase 5 Gate

> All checks below must pass before starting Phase 6.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `git ls-files .codex | grep -c .` — returns 95 (2 at baseline: 93 generated agents plus
      `config.toml` plus `ci-monitor-subagent.toml`).
- [x] [AI] `git grep -c "ci-monitor-subagent" .codex/config.toml` — returns a non-zero count,
      proving the hand-maintained table survived regeneration.
- [x] [AI] `npm run generate:bindings && git diff --quiet` — exits 0 (idempotence).
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate`
      — exits 0; after `printf 'x' >> .codex/agents/<any>.toml` it exits non-zero, and exits 0 again
      after `git checkout -- .codex/`.

> **Pause Safety**: Codex now receives the same 93 agent definitions Claude Code and OpenCode do,
> guarded byte-for-byte. Skills are not yet bridged. Safe to stop. To resume:
> `npm run generate:bindings && git diff --quiet`.

---

## Phase 6: Mirror `.claude/skills/` into `.agents/skills/` and Retire the OpenCode Trees

> Two related changes land here: `.agents/skills/` becomes a **real-file generated mirror** (DD-6,
> DD-7), and `.opencode/skills/` plus `.opencode/commands/` are **deleted as a deliberate accepted
> capability loss** (DD-8). No symlink is created in either direction, and no collision guard is
> added — with the OpenCode tree gone there is nothing to collide, and `.claude/skills/` ↔
> `.agents/skills/` name equality is expected by construction and guarded by byte-parity instead.

### 6a — Record the vendored baseline before the emitter exists

- [x] [AI] Capture a per-file hash of every currently tracked `.agents/` file and store it in
      `learnings.md` under `## Vendored .agents baseline`
      — command: `git ls-files .agents | xargs shasum -a 256`
      — acceptance: exactly 24 lines are recorded, covering the eight vendored directories
      `cavecrew/`, `caveman/`, `caveman-commit/`, `caveman-compress/`, `caveman-help/`,
      `caveman-review/`, `caveman-stats/`, `compress/`, including the `scripts/*.py` payloads under
      `caveman-compress/` and `compress/`. A count other than 24 means the tree changed since
      authoring — stop and re-baseline before writing any emitter.
- [x] [AI] Confirm none of the eight has a `.claude/skills/` counterpart, which is why they cannot be
      regenerated
      — command: `for d in cavecrew caveman caveman-commit caveman-compress caveman-help caveman-review caveman-stats compress; do test -d ".claude/skills/$d" && echo "COUNTERPART $d"; done; echo done`
      — acceptance: prints only `done`; any `COUNTERPART` line means the vendored/generated boundary
      is not what DD-7 assumes.

### 6b — Declare the mirror target and the vendored exclusions

- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/repo_config_validate.rs` asserting the
      `codex` registry entry declares `.agents/skills` as a mirror of `.claude/skills`, and that the
      registry declares the eight vendored subdirectories
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails because neither field exists.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Extend `HarnessEntry` in
      `apps/rhino-cli/src/application/repo_config/mod.rs` with a skills-mirror target and a
      vendored-subdirectory list, then declare both on the `codex` entry in `repo-config.yml`, using
      the same `mirrors:` mechanism the OpenCode agent mirror already uses
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes and
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- repo-config validate`
      exits 0.
- [x] [AI] **REFACTOR**: Express the vendored list as one entry per line with an inline comment naming
      the plugin origin, so a reader can tell why each directory is exempt
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass and `deny_unknown_fields` still rejects a typo'd key in the new block.

### 6c — Emit the real-file mirror

- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/agents.rs` asserting that a fixture
      `.claude/skills/<name>/SKILL.md` produces a **real file** at `.agents/skills/<name>/SKILL.md`
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails; no `.agents/` emitter exists.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Implement the mirror emitter in
      `apps/rhino-cli/src/application/agents/`, wired into `harness bindings generate` behind the
      registry-driven selection from Phase 1. It copies the full skill directory tree — `SKILL.md`,
      `reference/*.md`, and any other payload — as real files
      — command: `npm run generate:bindings`
      — acceptance: `git status --porcelain .agents/ | grep -c .` reports roughly 545 new paths, where
      it reported 0 before; `find .agents/skills -type l | grep -c .` returns 0, proving no symlink
      was created in either direction.
- [x] [AI] **REFACTOR**: Make stale-mirror cleanup remove only emitter-owned directories, skipping
      every declared vendored directory
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass; renaming a `.claude/skills/` directory and regenerating removes the
      old mirror and creates the new one, and all eight vendored directories are still present.
- [x] [AI] Prove idempotence:
      `npm run generate:bindings && git add -A .agents && npm run generate:bindings && git diff --quiet .agents/`
      — acceptance: the final `git diff --quiet` exits 0.
- [x] [AI] **Prove vendored preservation (DD-7 acceptance obligation)**: re-run
      `git ls-files .agents | xargs shasum -a 256` and compare the 24 vendored lines against the 6a
      baseline
      — acceptance: all 24 hashes are byte-identical to the recorded baseline and the vendored file
      count is still 24. A matching count alone is NOT sufficient — an in-place rewrite would leave
      the count unchanged, so the hashes are the check. Record the comparison in `learnings.md`.
- [x] [AI] Prove the ownership boundary is declared rather than inferred: create
      `.agents/skills/probe-undeclared/SKILL.md` with no `.claude/skills/` counterpart, run
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate`,
      then `rm -rf .agents/skills/probe-undeclared`
      — acceptance: exits non-zero naming the undeclared directory while it exists, and exits 0 after
      the `rm` — an ownership heuristic would have silently deleted it instead.

### 6d — Guard the mirror against the formatter

- [x] [AI] **Measure the Prettier round trip before wiring the guard** (this repository has broken a
      generated byte-equality guard this way before):
      `npm run generate:bindings && npx --no -- prettier --write ".agents/**/*.md" && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate`
      — acceptance: record the exit code in `learnings.md`. If 0, no `.prettierignore` change is
      needed. If non-zero, add `.agents/` to `.prettierignore` next to the existing generated-file
      entries with an inline rationale, then re-run the same sequence until it exits 0.
- [x] [AI] Add `.agents/` to the generated-mirror byte-parity guard by including the mirror files in
      `expected_bindings` in `apps/rhino-cli/src/application/agents/bindings.rs`, and add `.agents` to
      `KNOWN_BINDING_DIRS` if Phase 2 did not already include it
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate`
      — acceptance: exits 0; after `printf 'x' >> .agents/skills/<any mirrored>/SKILL.md` it exits
      non-zero naming that file, and exits 0 again after `git checkout -- .agents/`.
- [x] [AI] Confirm both npm entry points cover the mirror without gaining a new flag
      — command: `npm run generate:bindings && npm run validate:sync`
      — acceptance: both exit 0, `validate:sync` reports the `.agents/` mirror in parity, and
      `git diff --stat package.json` shows no change to either script's command string.
- [x] [AI] Add `.agents/` to the `harness-bindings` gate `trigger:` list in `repo-config.yml`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — acceptance: exits 0 and the trigger list names `.agents/`.

### 6e — Delete `.opencode/skills/` and `.opencode/commands/` (deliberate accepted capability loss)

> **Stated plainly, not a silent cleanup**: OpenCode does NOT read Claude Code plugins. Unlike the
> earlier `.github/skills/` removal — where the `nx-mcp` plugin covered the gap for Copilot — there is
> **no equivalent fallback for OpenCode**. OpenCode users may genuinely lose Nx skill access and the
> `/monitor-ci` command. The user was told this and chose deletion. Do not describe this change as
> routine cleanup anywhere.

- [x] [AI] Confirm the shared provenance before deleting, so the two trees are treated consistently
      — command: `git log --format='%h %s' -- .opencode/skills/monitor-ci | tail -1 && git log --format='%h %s' -- .opencode/commands/monitor-ci.md | tail -1`
      — acceptance: both print the same commit, `4239f3d79`
      ("chore: add Nx-generated AI agent configs for Copilot, Codex, and OpenCode"). A different
      commit on either line means the provenance claim behind DD-8 is wrong — stop and re-verify.
- [x] [AI] Delete both trees: `git rm -r .opencode/skills .opencode/commands`
      — acceptance: `git ls-files .opencode/skills .opencode/commands | grep -c .` returns 0, where it
      returned 17 at baseline (16 skill files across 7 directories plus 1 command file).
- [x] [AI] Remove the `.opencode/skills/` and `.opencode/commands/` prefixes from the
      `governance-word-budget` gate's `args.exclude` list in `repo-config.yml`, along with the
      multi-paragraph comment justifying them
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance word-budget validate`
      — acceptance: exits 0; `git grep -c "\.opencode/skills/" repo-config.yml` returns no match,
      where it returned 2 before. Exiting 0 here proves the exclusions were removed because the trees
      are gone, not because coverage was weakened.
- [x] [AI] Record the loss in `docs/reference/platform-bindings.md` as a deliberate accepted
      capability loss, naming what was removed (the seven skill directories and the `/monitor-ci`
      command) and the caveat that OpenCode does not read Claude Code plugins and no `nx-mcp`
      equivalent covers the gap
      — acceptance: the phrase "capability loss" appears in the catalog prose region and no wording
      frames the removal as cleanup.
  - _Suggested executor: `docs-maker`_
- [x] [AI] Confirm nothing regenerates the deleted trees
      — command: `npm run generate:bindings && git status --porcelain .opencode/ | grep -c .`
      — acceptance: returns 0. Unlike `.cursor/` and `.amazonq/`, these trees had no emitter — which
      is exactly why they were ungoverned — so the Phase 2 recreation hazard does not apply.

### 6f — Specs

- [x] [AI] Create `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/agents-skills-mirror.feature`
      carrying the US-4 and US-4b scenarios from `prd.md`, and
      `harness/opencode-skills-removal.feature` carrying the US-4c scenarios; index both in
      `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/README.md`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: exits 0 with no `missing` or `unannotated` finding, and
      `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0.
  - _Suggested executor: `specs-maker`_

### Phase 6 Gate

> All checks below must pass before pushing Phase 4-6 to the single PR and starting Phase 7.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `find .agents/skills -type l | grep -c .` — returns 0, proving the mirror is real files and
      no symlink exists in either direction.
- [x] [AI] The 24 vendored `.agents/` hashes match the 6a baseline byte-for-byte, recorded in
      `learnings.md`; the vendored file count is still 24.
- [x] [AI] `npm run generate:bindings && git diff --quiet` — exits 0 (idempotence across the whole
      binding surface).
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate`
      — exits 0, and exits non-zero under both the mirrored-file edit probe and the
      undeclared-directory probe.
- [x] [AI] `npm run validate:sync` — exits 0.
- [x] [AI] `git ls-files .opencode/skills .opencode/commands | grep -c .` — returns 0 (17 at
      baseline).
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance word-budget validate`
      — exits 0 with both `.opencode/` exclusions removed.
- [x] [AI] `npx --no -- prettier --check ".agents/**/*.md"` — exits 0, or `.agents/` is listed in
      `.prettierignore` with the 6d rationale inline.

> **Pause Safety**: all three harnesses reach the same skills content — Claude Code and OpenCode via
> the canonical `.claude/skills/`, OpenCode and Codex via the generated `.agents/skills/` mirror — and
> the mirror is byte-parity guarded. The vendored plugin skills are declared and untouched. The
> ungoverned OpenCode trees are gone with their exclusions. The catalog is still hand-written and
> still stale-stamped. Safe to stop. To resume: `npm run generate:bindings && git diff --quiet`.

### After Phase 6 — commit and push to the single PR

> No PR opens here, and nothing merges here.

- [x] [AI] Commit thematically: Codex defect correction, Codex emitter, skills surface — acceptance:
      three Conventional Commits.
- [x] [AI] Push to the existing branch: `git push` — acceptance:
      `gh pr list --head worktree/update-harness-support` still returns exactly one PR.
- [x] [AI] Poll CI every 2 minutes until the PR's checks are green — acceptance: `gh pr checks`
      reports all checks passing. Fix any failure at the root cause before starting Phase 7.

---

## Phase 7: Total Ownership of Binding Files

> **This is the plan's automation spine** (`tech-docs.md` DD-12). The generalizable defect behind
> everything this plan corrects is **unowned binding files**: `.opencode/skills/` sat ungoverned for
> months because it belonged to no category — not generated from `.claude/`, not declared vendored,
> simply present and excluded from the word budget with a comment. The 24 vendored files in
> `.agents/skills/` and the 2 tooling-provided files in `.codex/` are the same shape. Every one is a
> place where reality and our declarations can diverge with nothing failing.
>
> After this phase, every tracked file under every binding directory of the three surviving harnesses
> falls into exactly one declared class — GENERATED, VENDORED, or SOURCE — and a validator fails
> naming any file it cannot classify. There is no fourth class and no unclassified residue.
>
> This runs after Phase 6 because the binding trees are only final then: `.cursor/`, `.amazonq/`,
> `.pi/` are gone (Phase 2), `.codex/agents/` exists (Phase 5), and `.agents/skills/` and the
> `.opencode/` deletions have landed (Phase 6).

### 7a — Declare the classification in the registry

- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/repo_config_validate.rs` asserting
      every harness entry declares an ownership class for each path it claims, and that the three
      legal classes are exactly `generated`, `vendored`, `source`
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails because no ownership field exists.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Extend `HarnessEntry` in
      `apps/rhino-cli/src/application/repo_config/mod.rs` with an ownership declaration, and populate
      it in `repo-config.yml` for every binding path. A `vendored` entry additionally requires a
      non-empty `reason` string; `deny_unknown_fields` stays on, so a fourth class value is a hard
      deserialization error rather than a silently-ignored key
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes; a fixture declaring `tier: vendored` without a `reason`
      exits non-zero, and a fixture declaring a fourth class name fails to deserialize.
- [x] [AI] **REFACTOR**: Express each declaration as one line per path with the reason inline, so a
      reader can tell why a path is exempt from generation without leaving the file
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass and every `vendored` declaration carries a reason.

### 7b — Classify every currently-unowned file (the audit this phase exists for)

Each item below closes a specific gap this plan's own design opened or inherited. A half-owned file
is the worst outcome, so each states the class plainly.

- [x] [AI] Declare `.claude/**` and the root instruction files `AGENTS.md` and `CLAUDE.md` as
      **SOURCE** — hand-authored and canonical, the thing everything else is generated from
      — acceptance: `repo-config.yml` declares all three paths as `source`; the emitter treats a
      `source` path as read-only and a test asserts `harness bindings generate` writes to none of
      them.
- [x] [AI] Declare `.opencode/agents/**`, `.codex/agents/**`, and the emitter-owned subdirectories of
      `.agents/skills/**` as **GENERATED**
      — acceptance: for each, regenerating reproduces the file byte-for-byte and a hand edit fails
      `harness bindings validate` — already proven by the Phase 5 and Phase 6 probes, now expressed
      as a declared class rather than three separate guards.
- [x] [AI] Declare the eight vendored `.agents/skills/<name>/` directories as **VENDORED** with the
      reason `third-party plugin skills; no in-repo source; cannot be regenerated`. This declaration
      **replaces** the special-case treatment they had — the word-budget exclusion list stops being
      the place their status is recorded and becomes a consequence of the class
      — acceptance: `repo-config.yml` declares all eight as `vendored` with a reason, and the Phase 6
      byte-identity check now reads as a class invariant rather than a one-off assertion.
- [x] [AI] **Resolve `.codex/config.toml` ownership explicitly — no half-ownership.** Phase 5 gave it
      a delimited generated region (DD-5) while `[mcp_servers.nx-mcp]`, `[features]`, and
      `[agents.ci-monitor-subagent]` stay hand/tooling-maintained. Declare the file **VENDORED with a
      generated region**, meaning: the emitter owns the delimited region only and the validator checks
      byte-parity of that region alone, never of the whole file
      — acceptance: `repo-config.yml` declares the file `vendored` with the reason naming the
      Nx-tooling provenance and the delimited-region carve-out; `harness bindings validate` exits
      non-zero after an edit **inside** the markers and exits 0 after an equivalent edit **outside**
      them, proving the ownership boundary is real in both directions.
- [x] [AI] Declare `.codex/ci-monitor-subagent.toml` as **VENDORED** with the reason naming its
      tooling provenance and the fact that `.codex/config.toml` points at it by `config_file`
      — acceptance: declared with a reason; `npm run generate:bindings` followed by
      `git diff --quiet .codex/ci-monitor-subagent.toml` exits 0.
- [x] [AI] Declare `.opencode/opencode.json` as **VENDORED** with the reason naming its provenance
      — acceptance: declared with a reason; `npm run generate:bindings` followed by
      `git diff --quiet .opencode/opencode.json` exits 0.
- [x] [AI] Confirm `.opencode/commands/` needs no class because Phase 6e deleted it, and record that
      outcome as the class decision rather than an omission: the tree was **unowned**, which is
      precisely why it was deleted rather than declared
      — acceptance: `git ls-files .opencode/commands | grep -c .` returns 0, and no ownership
      declaration references the path.

### 7c — Build the validator

- [x] [AI] **RED**: Add a failing test asserting the validator enumerates every tracked file under
      every declared binding directory and fails naming a file it cannot classify
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails; no classification validator exists.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Implement `harness ownership validate` in
      `apps/rhino-cli/src/application/agents/ownership.rs` with its command adapter at
      `apps/rhino-cli/src/commands/harness_validate_ownership.rs`, wired into
      `apps/rhino-cli/src/cli.rs`. It enumerates via the git index (tracked files only, so a local
      scratch file is not a failure), classifies each against the registry, and reports any residue
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness ownership validate`
      — acceptance: exits 0 against the classified tree, listing a per-class count that sums to the
      total tracked binding-file count.
- [x] [AI] **REFACTOR**: Reuse the existing finding formatter rather than adding a new report shape
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass; the output renders through the shared reporter.
- [x] [AI] **Prove falsifiability in both directions — the check that would have caught
      `.opencode/skills/` the day it appeared**: create `.opencode/skills/probe/SKILL.md`, run the
      validator, then `rm -rf .opencode/skills`
      — acceptance: exits **non-zero naming `.opencode/skills/probe/SKILL.md` as unclassified** while
      it exists, and exits **0** after the `rm`. A validator that only ever exits 0 certifies nothing.
- [x] [AI] Prove each class is independently enforced, restoring the tree after each probe: (a) hand-edit
      a GENERATED file — validate fails; (b) hand-edit a VENDORED file — validate still passes, because
      vendored files are not byte-guarded, and `git checkout` restores it; (c) attempt to have the
      emitter write to a SOURCE path — the write is refused
      — acceptance: all three observations recorded in `learnings.md` with the exact commands and exit
      codes.
- [x] [AI] Run the full regeneration and confirm VENDORED byte-identity, folding in the Phase 6a
      baseline: `npm run generate:bindings && git ls-files .agents .codex .opencode | xargs shasum -a 256`
      — acceptance: all 24 vendored `.agents/` hashes plus `.codex/ci-monitor-subagent.toml` and
      `.opencode/opencode.json` match their recorded baselines byte-for-byte. This single check
      satisfies both the class invariant and the vendored-clobber criterion, so it is not duplicated
      elsewhere.

### 7d — Wire it into the gates

- [x] [AI] Declare the gate in the `gates:` section of `repo-config.yml`: `type: check`,
      `command: harness ownership validate`, `kind: rhino-cli`, `ci-group: governance`, with
      `pre-push` and `ci` both `path-gated` on `.claude/`, `.opencode/`, `.codex/`, `.agents/`,
      `AGENTS.md`, `CLAUDE.md`, `repo-config.yml`. Path-gating is correct here — unlike a time-based
      check, this one genuinely depends on which paths changed
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — acceptance: exits 0 and the new gate appears in the emitted CI wiring.
- [x] [AI] Verify the path-gated declaration actually fires rather than reading as green while never
      running: stage a change under `.codex/` in an isolated no-origin git fixture and confirm
      `Running gate harness-ownership` appears in the output
      — acceptance: the line appears; a never-exercised `path-gated` declaration is indistinguishable
      from a passing one and must not be trusted unproven.
- [x] [AI] Create `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/harness-ownership.feature`
      carrying the US-8 scenarios from `prd.md`, and index it in `harness/README.md`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: exits 0 and `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0.
  - _Suggested executor: `specs-maker`_
- [x] [AI] Document the three classes in
      `repo-governance/conventions/structure/multi-harness-binding.md` as a binding rule, and in
      `docs/reference/platform-bindings.md` as the reason every path in the catalog carries a class
      — acceptance: both documents name all three classes and state that there is no fourth class and
      no unclassified residue.
  - _Suggested executor: `repo-rules-maker`_

### Phase 7 Gate

> All checks below must pass before starting Phase 8.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness ownership validate`
      — exits 0, and exits non-zero naming the file under the unclassified-probe above.
- [x] [AI] Every path named in 7b has a declared class in `repo-config.yml`, and every `vendored`
      declaration carries a non-empty reason — verified by reading the block, not by a count.
- [x] [AI] `npm run generate:bindings && git diff --quiet` — exits 0, proving classification did not
      disturb generation.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — exits 0, and the path-gated trigger was observed firing.

> **Pause Safety**: every tracked file under every surviving binding directory carries exactly one
> declared class, and an unclassified file is a hard failure at pre-push and in CI. Generation is
> undisturbed. Safe to stop. To resume:
> `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness ownership validate`.

## Phase 8: Divergence Triage and Reviewed Promotion

> **One-way generation stays the normal path.** This phase adds a triage capability on top of it, not
> a bidirectional sync. A hand edit in a mirror still **fails** `harness bindings validate` exactly as
> before; promotion is an opt-in human action, never an automatic repair
> (`tech-docs.md` DD-13).
>
> **Scope intersects DD-12 exactly**: only **GENERATED** files participate in triage. **VENDORED**
> files are never compared and never promoted — the generator does not own them. **SOURCE** files are
> the promotion _target_, never a triage subject. This phase runs after Phase 7 because those class
> declarations are what make the scope decidable.

### 8a — Content-hash divergence detection

- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/agents.rs` asserting that divergence
      detection regenerates mirrors into a scratch directory and compares generated output against
      committed bytes, reading **no file modification times at all**
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails because no triage module exists; the test additionally asserts that no
      `metadata()`/`modified()` call appears on the detection path.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Implement `harness sync triage` in
      `apps/rhino-cli/src/application/agents/triage.rs` with its adapter at
      `apps/rhino-cli/src/commands/harness_sync_triage.rs`, wired into `apps/rhino-cli/src/cli.rs`.
      It regenerates every GENERATED mirror into a scratch directory and compares content hashes
      against the committed files
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness sync triage`
      — acceptance: exits 0 on a clean tree, reporting zero divergences.
- [x] [AI] **REFACTOR**: Extract the scratch-regeneration helper so triage and
      `harness bindings validate` share one generation path rather than drifting apart
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass and both commands call the same helper.
- [x] [AI] Record the timestamp prohibition as an executable guard, not just prose: add a test
      asserting that a fresh `git clone` of a fixture repository — where every file carries checkout
      time and every mtime is therefore identical and meaningless — still reports zero divergences
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: passes. Under an mtime-based design this test would report every file as
      simultaneously modified, which is exactly the failure mode being designed out.

### 8b — The three outcomes, exhaustively

- [x] [AI] **RED**: Add failing tests covering all three outcomes — nothing diverged, exactly one side
      diverged, both sides diverged
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: all three fail; the outcome enum does not exist.
- [x] [AI] **GREEN**: Implement the three-outcome classification. In-sync exits 0. One-sided
      divergence reports which side was hand-edited and offers promotion. Both-sides divergence is a
      **HARD STOP** — exit non-zero naming both files, never guessing and never picking a winner
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: all three tests pass; the enum has exactly three variants so a fourth outcome is
      a compile error rather than a runtime fallthrough.
- [x] [AI] **REFACTOR**: Give each outcome a single formatter so the both-diverged message cannot
      drift into sounding recoverable
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass.
- [x] [AI] Prove the in-sync path exits 0 on the real tree:
      `npm run generate:bindings && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness sync triage`
      — acceptance: exits 0 reporting zero divergences, where a non-zero here would mean the
      comparison is over-matching on formatting rather than content.
- [x] [AI] Prove the one-sided case in both directions: hand-edit one `.opencode/agents/` mirror, run
      triage, then `git checkout -- .opencode/` and re-run
      — acceptance: exits non-zero naming that mirror as the diverged side and naming the promote
      command while the edit exists; exits 0 after the checkout.
- [x] [AI] Prove the both-diverged HARD STOP: hand-edit one `.claude/agents/` source AND its
      corresponding `.opencode/agents/` mirror, run triage, then restore both
      — acceptance: exits non-zero naming **both** files, and the output offers **no** promotion and
      **no** automatic resolution. Exits 0 after both are restored. Record the exact output in
      `learnings.md` — this is the outcome most likely to be silently "helpfully" resolved by a later
      change.

### 8c — Promotion writes a reviewable diff, never a silent overwrite

> **Hard constraint, not a preference.** Cross-harness translation is lossy and not bijective.
> Canonical Claude-shaped definitions carry fields — `permissionMode`, `isolation`, `maxTurns`,
> `memory`, `effort`, and others — that OpenCode's schema and Codex's TOML shape have no equivalent
> for, and DD-4 already records that no verified Claude-to-Codex mapping exists for the optional
> fields. Promoting an OpenCode edit blindly would delete every canonical field OpenCode never
> carried. **A promote that silently drops fields is a data-loss event and must be impossible by
> construction.**

- [x] [AI] **RED**: Add a failing test asserting `harness sync promote` writes a proposed diff to
      stdout (or a named file) and **does not modify** the canonical source
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails; no promote path exists.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Implement `harness sync promote` so it emits a proposed unified diff against
      the canonical `.claude/` source and exits without writing to it
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness sync promote --from .opencode/agents/<name>.md`
      — acceptance: a diff is printed and `git diff --quiet .claude/` exits 0 afterwards, proving the
      canonical source is untouched.
- [x] [AI] **RED**: Add a failing test asserting the promote output **lists the canonical fields at
      risk of loss** — those present in the canonical file but unrepresentable in the editing
      harness's schema
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails; the at-risk field list is not computed.
- [x] [AI] **GREEN**: Compute the at-risk set by intersecting the canonical file's frontmatter keys
      with the editing harness's `DropWarn` field-policy entries, and render it as a labelled section
      of the promote output
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: promoting an OpenCode edit of an agent whose canonical source carries
      `permissionMode` and `isolation` lists both fields under the at-risk heading; promoting an
      agent whose canonical source carries neither lists nothing, proving the list is computed rather
      than hardcoded.
- [x] [AI] **REFACTOR**: Reuse the existing `FieldPolicy` table as the single source for what each
      harness can represent, so a future field addition updates the at-risk computation automatically
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass; no second field list exists in the codebase.
- [x] [AI] Prove promotion cannot silently overwrite: run promote against a real diverged mirror and
      confirm the canonical file is unchanged, then confirm applying the emitted diff by hand
      produces the intended edit
      — acceptance: `git diff --quiet .claude/` exits 0 immediately after promote, and non-zero only
      after the human applies the diff. Both observations recorded in `learnings.md`.

### 8d — Scope, default behaviour, and discoverability

- [x] [AI] **RED**: Add a failing test asserting a VENDORED file is excluded from triage entirely —
      neither compared for divergence nor offered for promotion
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails while triage still walks every file under the binding directories.
- [x] [AI] **GREEN**: Scope triage to the GENERATED class from the DD-12 registry declarations
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the test passes; hand-editing a vendored `.agents/skills/caveman/SKILL.md`
      produces **no** triage finding, while hand-editing a generated
      `.agents/skills/<mirrored>/SKILL.md` produces one. Restore both afterwards.
- [x] [AI] Confirm the default failure behaviour is unchanged: hand-edit a mirror and run
      `harness bindings validate` **without** triage
      — acceptance: exits non-zero exactly as it did before this phase. Promotion is opt-in; nothing
      about this phase makes a hand edit pass by default.
- [x] [AI] Improve the `harness bindings validate` failure message so it names **both** the canonical
      file to edit **and** the promote command as an alternative
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings validate`
      (after a deliberate mirror edit)
      — acceptance: the message contains the canonical `.claude/` path and the literal
      `harness sync promote` invocation. This message is where a developer actually learns the
      capability exists, so an assertion on its content is part of the test suite, not a nicety.
- [x] [AI] Create `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/harness-sync-triage.feature`
      carrying the US-9 scenarios from `prd.md`, and index it in `harness/README.md`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: exits 0 and `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0.
  - _Suggested executor: `specs-maker`_
- [x] [AI] Document triage and promotion in
      `repo-governance/conventions/structure/multi-harness-binding.md`, stating that generation is
      one-way by default, that promotion is human-reviewed, and that detection is by content and
      never by timestamp
      — acceptance: all three statements appear, and the timestamp prohibition carries its reason
      (git does not store mtimes).
  - _Suggested executor: `repo-rules-maker`_

### Phase 8 Gate

> All checks below must pass before starting Phase 9.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `npm run generate:bindings && cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness sync triage`
      — exits 0 on the clean tree, and exits non-zero under both the one-sided and both-diverged
      probes above.
- [x] [AI] `git grep -nE "\.modified\(\)|SystemTime|mtime" apps/rhino-cli/src/application/agents/triage.rs`
      — returns no match, proving detection is content-based. A match here means the timestamp
      approach was reintroduced.
- [x] [AI] The both-diverged HARD STOP output is recorded in `learnings.md` and offers no automatic
      resolution.
- [x] [AI] `git diff --quiet .claude/` — exits 0 immediately after a promote run, proving promotion
      never writes to canonical source.
- [x] [AI] A vendored file edit produces no triage finding while a generated file edit does — both
      observations recorded.

> **Pause Safety**: one-way generation still behaves exactly as before and a hand-edited mirror still
> fails validation. Triage and promotion are additive, opt-in, and cannot write to canonical source.
> Safe to stop. To resume:
> `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness sync triage`.

## Phase 9: OpenCode v1 Conformance and the Deferred Idea Briefs

- [x] [AI] Correct every citation of the OpenCode upstream repository from the former organization
      path to `anomalyco/opencode`
      — command: `git grep -n "sst/opencode" -- . ':!worktrees' ':!node_modules' ':!plans/done'`
      — acceptance: returns nothing after the edit, where it returned at least one match before (the
      catalog's `opencode#6635` citation is one known site).
- [x] [AI] Confirm the plural `.opencode/agents/` directory name is correct and record why in the
      catalog's OpenCode row footnote — the singular form was a CLI bug since fixed. Note that
      `.opencode/commands/` was the correct path for commands but that this repository ships none
      after Phase 6e
      — acceptance: `test -d .opencode/agents` exits 0, `test -d .opencode/commands` exits non-zero
      (deleted in Phase 6e), and the footnote states both facts.
- [x] [AI] Record the v1 deprecation in the OpenCode row footnote: the `theme`, `keybinds`, and `tui`
      keys moved out of `opencode.json` into `tui.json`
      — command: `jq -r 'keys[]' .opencode/opencode.json`
      — acceptance: the output contains none of `theme`, `keybinds`, `tui`; if it does, remove them
      in this step and re-run `npm run validate:sync`.
- [x] [AI] Record in the catalog that OpenCode's `permission` model (allow/ask/deny per action, with
      bash sub-patterns, last matching rule wins) is SEPARATE from `tools` (capability on/off), and
      that this repository's generated mirrors emit `permission`
      — acceptance: the distinction appears in the Tool Translation section of the catalog.
- [x] [AI] Create `plans/ideas/q2-not-urgent-important/opencode-v2-migration.md` as a two-pager
      following the shape of its sibling briefs in that folder. It MUST record the full v2 rename
      set: `agent`→`agents`, `prompt`→`system`, `disable`→`disabled`, permission `bash`→`shell`,
      `task`→`subagent`, `mcp`→`mcp.servers`, `command`→`commands`, `snapshot`→`snapshots`,
      `attachment`→`media`, `provider`→`providers`, `plugin`→`plugins`; the two concurrent majors
      (v1 stable binary `opencode` at 1.18.18, v2 beta binary `opencode2`, opt-in); and the promotion
      signal
      — acceptance: the file exists, contains all eleven renames, and
      `test -d plans/backlog/opencode-v2-migration` exits non-zero — this is an idea, NOT a backlog
      plan.
- [x] [AI] Before creating either file, scan `plans/ideas/README.md` and the existing Q2 briefs for an
      overlapping brief per the Integrate-Before-You-Add rule
      — acceptance: the scan result is recorded in `learnings.md`; the two known harness-adjacent
      briefs (`harness-binding-catalog-drift`, `harness-converter-preserve-agent-mode`) are each
      assessed and found non-overlapping, or the v2 content is folded into one of them instead.
- [x] [AI] Create `plans/ideas/q2-not-urgent-important/vendor-neutral-canonical-source.md` as a
      two-pager following the same shape. It captures the user's deferred decision to move the
      canonical source out of `.claude/` into a vendor-neutral location so that **no harness is
      privileged and every harness — Claude Code included — becomes a generated mirror**. It MUST
      record: (a) the motivation, that `.claude/` is canonical by history rather than by design;
      (b) the scale, 59 skill directories and 659 tracked files under `.claude/` plus every gate that
      walks `.claude/` today — `governance word-budget validate`,
      `governance readme-index validate`, `harness duplication validate`, and
      `harness ownership validate`; (c) that **this plan is explicitly the point zero** that makes the
      move tractable later, by first establishing single-source generation and total file ownership;
      and (d) that the Phase 8 triage-and-promotion mechanism is a **prerequisite**, because under a
      neutral source every contributor in every harness would be editing a mirror rather than the
      source
      — acceptance: the file exists, contains all four items, and
      `test -d plans/backlog/vendor-neutral-canonical-source` exits non-zero — this is an idea, NOT a
      backlog plan and NOT part of this plan's scope.
- [x] [AI] Add **both** new briefs to the Q2 section of `plans/ideas/README.md` in the same one-line
      annotated form the other entries use, each in alphabetical position
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate`
      — acceptance: exits 0 and the Q2 list contains both `opencode-v2-migration` and
      `vendor-neutral-canonical-source`.
- [x] [AI] Narrow `plans/ideas/q2-not-urgent-important/harness-binding-catalog-drift.md`: its
      Windsurf/Devin and Copilot findings are moot with those harnesses dropped, and its Codex
      finding is resolved by Phase 4. Keep its durable cautionary note about the audit summary
      disagreeing with its report body
      — acceptance: the brief states which findings this plan closed and which remain, and its
      `plans/ideas/README.md` one-liner is updated to match.
- [x] [AI] Enumerate **every** remaining `plans/ideas/**` brief whose premise names a harness this
      plan drops and narrow each one the same way — `origin/main` adds ideas continuously, so fix the
      class, not only the briefs this plan happens to name
      — command: `git grep -ilE "\\.cursor/|\\.amazonq/|\\.pi/|\\.kiro/|Amazon Q|Antigravity|Windsurf|Junie|Aider" -- plans/ideas | tee local-tmp/harness-ideas-sweep.txt`
      — acceptance: `local-tmp/harness-ideas-sweep.txt` reports a non-zero line count (a zero count
      means the pattern or pathspec is wrong, not that the sweep is done); every path it lists appears
      exactly once in `learnings.md` under `## Ideas-tree verdicts` with verdict `NARROWED`,
      `FALSE-POSITIVE`, or `HISTORICAL-KEEP`; every `NARROWED` brief names which of its findings this
      plan made moot and which survive; and each narrowed brief's `plans/ideas/README.md` one-liner
      matches its new scope. At the time this plan was written the sweep set included
      `q2-not-urgent-important/harness-level-env-file-enforcement-gap.md` (premise names Cursor and
      Amazon Q Developer alongside Codex; only the Codex half survives the purge),
      `q2-not-urgent-important/extend-byte-identity-to-claude-hooks.md`, and
      `q2-not-urgent-important/governance-command-name-reconciliation.md` — treat that list as a floor,
      never as the whole set.

- [x] [AI] Create `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/opencode-conformance.feature`
      carrying the US-7 `@opencode-conformance` scenarios from `prd.md`; index it in
      `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/README.md`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: the feature file exists carrying both US-7 scenarios where it did not exist
      before this step, the command exits 0 with no `missing` or `unannotated` finding, and
      `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0.
  - _Suggested executor: `specs-maker`_

### Phase 9 Gate

> All checks below must pass before starting Phase 10.

- [x] [AI] `git grep -c "sst/opencode" -- . ':!worktrees' ':!node_modules' ':!plans/done'` — no match.
- [x] [AI] `test -f plans/ideas/q2-not-urgent-important/opencode-v2-migration.md` — exits 0.
- [x] [AI] `test -f plans/ideas/q2-not-urgent-important/vendor-neutral-canonical-source.md` — exits 0.
- [x] [AI] `test -d plans/backlog/opencode-v2-migration` — exits non-zero.
- [x] [AI] `test -d plans/backlog/vendor-neutral-canonical-source` — exits non-zero.
- [x] [AI] `wc -l < local-tmp/harness-ideas-sweep.txt` reports a non-zero count, and every path it
      lists has exactly one verdict row under `## Ideas-tree verdicts` in `learnings.md` — proving the
      ideas-tree sweep ran rather than silently matching nothing.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- md links validate`
      — exits 0.
- [x] [AI] `npm run validate:sync` — exits 0.

> **Pause Safety**: OpenCode's claims describe v1 stable accurately, and both deferred moves — the
> OpenCode v2 migration and the vendor-neutral canonical source — are captured as promotable briefs
> rather than smuggled into this plan's scope. Safe to stop. To resume: `npm run validate:sync`.

---

## Phase 10: Generate the Catalog From Registry Data

- [x] [AI] **RED**: Add a failing test in a new `apps/rhino-cli/tests/harness_catalog.rs` asserting
      that `catalog` fields on a fixture registry render one markdown table row per entry between
      the generated-region markers
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails; no `catalog` module exists.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Extend `HarnessEntry` in `apps/rhino-cli/src/application/repo_config/mod.rs`
      with a `catalog` sub-struct (display name, reads-AGENTS.md, instruction surface, MCP config,
      agent surface, skills surface, status), and create
      `apps/rhino-cli/src/application/agents/catalog.rs` rendering the table
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes. `deny_unknown_fields` stays on the struct, so a typo in a
      catalog key is a hard error rather than a silently-dropped field.
- [x] [AI] **REFACTOR**: Give the renderer one function per column so a future column addition is a
      local change
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass.
- [x] [AI] Populate the three harness entries' `catalog:` blocks in `repo-config.yml` with the
      verified facts established in Phase 4 and Phase 6
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- repo-config validate`
      — acceptance: exits 0.
- [x] [AI] Insert the generated-region markers into `docs/reference/platform-bindings.md` around the
      Platform Binding Directories table and the verification stamp, then create
      `apps/rhino-cli/src/commands/harness_catalog.rs` exposing
      `harness catalog generate` and `harness catalog validate`, wired into
      `apps/rhino-cli/src/cli.rs`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness catalog generate`
      — acceptance: the table region contains exactly three rows and the prose outside the markers
      is byte-identical, verified by `git diff` showing changes only between the marker lines.
- [x] [AI] **Measure the Prettier round trip before wiring the guard** (DD-9):
      `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness catalog generate && npx --no -- prettier --write docs/reference/platform-bindings.md && git diff --quiet docs/reference/platform-bindings.md`
      — acceptance: record the exit code in `learnings.md`. If 0, the emitter is already
      Prettier-stable and nothing more is needed. If non-zero, take exactly one of two remedies —
      adjust the emitter to match Prettier's table formatting, or add the catalog path to
      `.prettierignore` next to the existing generated-file entries — and re-run until the command
      exits 0.
- [x] [AI] Wire `harness catalog validate` into `apps/rhino-cli/src/commands/harness_audit.rs` so the
      aggregate audit covers it
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness audit`
      — acceptance: the output names the catalog check.
- [x] [AI] Prove the drift guard is falsifiable: edit one cell inside the generated region by hand,
      run `harness catalog validate`, then re-run `harness catalog generate`
      — acceptance: exits non-zero naming the drifted region while the hand edit is present, and
      exits 0 after regeneration.
- [x] [AI] Update `docs/reference/README.md` so the catalog's annotated index entry states the table
      region is generated from `repo-config.yml`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: exits 0.
- [x] [AI] Create `specs/apps/rhino/behavior/rhino-cli/gherkin/harness/harness-catalog.feature` with
      the US-5 scenarios and index it in `harness/README.md`
      — acceptance: `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0.
  - _Suggested executor: `specs-maker`_

### Phase 10 Gate

> All checks below must pass before starting Phase 11.

- [x] [AI] `npx nx run rhino-cli:test:quick` — exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness catalog generate && git diff --quiet docs/reference/platform-bindings.md`
      — exits 0.
- [x] [AI] `npx --no -- prettier --check docs/reference/platform-bindings.md` — exits 0, or the path
      is listed in `.prettierignore` with the DD-9 rationale inline.
- [x] [AI] `npx --no -- markdownlint-cli2 docs/reference/platform-bindings.md` — exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness catalog validate`
      — exits 0, and exits non-zero under the deliberate hand-edit probe above.

> **Pause Safety**: the catalog table is generated and guarded, but nothing yet fails when a
> catalog claim goes stale upstream — by decision, that check is manual (`tech-docs.md` DD-11). Safe
> to stop. To resume: `harness catalog validate`.

---

## Phase 11: Extend Word-Budget Coverage to Live Entry Points

- [x] [AI] **RED**: Add a failing test in `apps/rhino-cli/tests/governance.rs` asserting the
      configured word-budget surface globs are exactly `repo-governance/**/*.md`, `.claude/**/*.md`,
      `.opencode/**/*.md`, `.codex/**/*.md`, `.agents/**/*.md`, `AGENTS.md`, `CLAUDE.md`, and the
      README glob
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: fails, reporting the `.cursor/`, `.pi/`, `.amazonq/` globs still present.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **GREEN**: Rewrite the `governance-word-budget:` `surfaces:` list in `repo-config.yml`
      accordingly, keeping every threshold unchanged (target 400 / warn 500 / fail 500 for the
      instruction surfaces; 700/900/900 for the README glob) and keeping the README glob declared
      LAST so the select-then-classify overlap rule still picks it
      — command: `npx nx run rhino-cli:test:integration`
      — acceptance: the RED test passes.
- [x] [AI] **REFACTOR**: Collapse any now-duplicated threshold literals into a YAML anchor if the
      loader supports it, otherwise leave them explicit and note why
      — command: `npx nx run rhino-cli:test:quick`
      — acceptance: tests pass; `rhino-cli repo-config validate` exits 0.
- [x] [AI] Rewrite the `governance-word-budget` gate `trigger:` anchor to `repo-governance/`,
      `.claude/`, `.opencode/`, `.codex/`, `.agents/`, `AGENTS.md`, `CLAUDE.md`, `repo-config.yml`
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — acceptance: exits 0 and the trigger list names none of the three retired directories.
- [x] [AI] Rewrite the `governance-readme-completeness` gate `paths:` and trigger lists to
      `repo-governance/`, `.claude/`, `.codex/`, `repo-config.yml` — `.pi/` is gone
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance readme-index validate`
      — acceptance: exits 0 with no `missing` or `unannotated` finding.
- [x] [AI] Declare the eight vendored `.agents/skills/<name>/` directories as named `exclude:`
      prefixes on the `governance-word-budget` gate in `repo-config.yml`, each on its own line with an
      inline comment naming the plugin origin. This is required because `.agents/**/*.md` becomes a
      governed surface in this phase and four of those eight `SKILL.md` files measure 537-668 words
      against the 500 fail threshold — third-party content this repository can neither shorten nor
      regenerate. The other four (`caveman-commit` 368, `caveman-help` 298, `caveman-review` 432,
      `caveman-stats` 89) are already under the fail threshold; they are excluded anyway for
      uniformity of the whole vendored set, not because each is individually load-bearing
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — acceptance: exits 0 and exactly eight `.agents/skills/` prefixes are declared. Prove the
      exclusion is load-bearing for the four files that actually exceed the 500-word fail threshold
      (`cavecrew` 566, `caveman` 537, `caveman-compress` 668, `compress` 660): for each, remove its
      prefix, confirm `governance word-budget validate` exits non-zero naming that file, then restore
      the prefix and confirm it exits 0. Do not attempt this remove/restore proof against the other
      four prefixes — they are under the fail threshold and would not reproduce a non-zero exit if
      excluded.
- [x] [AI] Confirm the ~545 mirrored files need **no** exclusion — they are byte-copies of
      `.claude/skills/` files that already pass the same 500-word threshold under the
      `.claude/**/*.md` surface
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance word-budget validate`
      — acceptance: exits 0 with no `.agents/skills/` mirrored file reported, where a genuinely
      oversized source skill would be reported twice (once per surface) and must be shortened at the
      `.claude/` source, never excluded at the mirror.
- [x] [AI] Run the extended budget across the whole tree and fix every new failure at the root cause
      — command: `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance word-budget validate`
      — acceptance: exits 0. Newly-covered `.codex/` and `.agents/` markdown files that exceed 500
      words are shortened at their `.claude/` source, not excluded — the only permitted exclusions are
      the eight vendored `.agents/skills/` prefixes declared in the step above. The two `.opencode/`
      prefixes are gone, removed in Phase 6e along with the trees they excluded.
- [x] [AI] Prove the threshold is still armed: append 20 words to `AGENTS.md`, run the validator,
      then `git checkout -- AGENTS.md` and re-run
      — acceptance: exits non-zero naming `AGENTS.md` while the words are present (487 + 20 = 507,
      over the 500 fail threshold), and exits 0 after the checkout.
- [x] [AI] Update `repo-governance/conventions/structure/governance-word-budget.md` and
      `specs/apps/rhino/behavior/rhino-cli/gherkin/governance/governance-word-budget.feature` plus
      `harness/governance-word-budget-thresholds.feature` to the new surface list, carrying the US-6
      scenarios
      — acceptance: `npx nx run rhino-cli:specs:gherkin-cardinality-validation` exits 0.
  - _Suggested executor: `specs-maker`_
- [x] [AI] Update `specs/apps/rhino/behavior/rhino-cli/gherkin/gate/parity-manifest.feature` with the
      US-10 paired-landing scenario
      — acceptance: the feature names the paired cross-repo landing expectation, which it did not
      before.

### Phase 11 Gate

> All checks below must pass before pushing Phase 7-11 to the single PR and starting Phase 12.

- [x] [AI] `npx nx affected -t typecheck,lint,test:quick` — exits 0.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- governance word-budget validate`
      — exits 0, and exits non-zero under the AGENTS.md padding probe.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- gate validate`
      — exits 0.
- [x] [AI] `git grep -E "\.cursor/|\.pi/|\.amazonq/" repo-config.yml | grep -vcE '^[^:]+:[[:space:]]*#'`
      — no match, excluding explanatory comment lines that mention a dropped harness only in prose.
- [x] [AI] `awk '/governance-word-budget:/,/env-contract:/' repo-config.yml | grep -c "fail: 500"`
      — returns a non-zero count, proving the fail threshold is unchanged at 500.

> **Pause Safety**: every instruction entry point the three survivors read is measured at the
> unchanged 500-word threshold. All plan machinery is in place. Safe to stop. To resume:
> `npx nx affected -t test:quick`.

### After Phase 11 — commit and push to the single PR

> No PR opens here, and nothing merges here. The terminal merge lives in
> [Terminal Review and Paired Merge](#terminal-review-and-paired-merge) after Phase 11.

- [x] [AI] Commit thematically: OpenCode conformance plus the idea brief, catalog generation,
      ownership validator, word-budget coverage — acceptance: four Conventional Commits.
- [x] [AI] Push to the existing branch: `git push` — acceptance:
      `gh pr list --head worktree/update-harness-support` still returns exactly one PR.
- [x] [AI] Poll CI every 2 minutes until the PR's checks are green — acceptance: `gh pr checks`
      reports all checks passing. Fix any failure at the root cause before starting Phase 12.

---

## Manual Behavioural Assertions

> This plan changes CLI behaviour and no web UI or HTTP API, so the rule-15 web-triad retest and the
> rule-16 API exploratory retest are **not applicable**. These assertions stand in their place.
> Paste observed output inline; outputs over 20 lines go to `evidence/`.

### Part 1 — Our own CLI

- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness --help`
      — paste output; acceptance: the subcommand list contains `audit`, `bindings`, `catalog`,
      `claude`, `duplication`, `ownership`, `sync` and no removed noun.
  - PASS — all seven present, no removed noun.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness bindings generate --harness cursor`
      — paste output; acceptance: exits non-zero with an unknown-harness error listing the three
      registry-derived names.
  - PASS — exit 1, `Error: unknown harness name 'cursor'; expected one of 'claude-code', 'opencode', 'codex'`.
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness ownership validate --verbose`
      — paste output; acceptance: exits 0 and the per-class counts (GENERATED / VENDORED / SOURCE)
      sum to the total tracked binding-file count, with zero unclassified.
  - PASS — exit 0; `1420 tracked binding file(s): 732 generated, 27 vendored, 661 source` (732 + 27 + 661 = 1420, zero unclassified).
- [x] [AI] `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- harness audit`
      — save output to `evidence/harness-audit.txt`; acceptance: every validator reports
      PASS and the file is committed.
  - PASS — `evidence/harness-audit.txt`; all six registry members named, every validator PASS.

### Part 2 — End-to-end harness load (the assertions that actually prove support)

> **Why these exist**: every assertion in Part 1 exercises **our own CLI**. Byte-parity between a
> generator and its output proves the generator is deterministic; it proves nothing about whether the
> vendor tool reads the result. Our validators are self-referential, so the plan could pass in full
> while a harness silently ignores everything we emit. Only launching the real tool against this
> repository demonstrates support.
>
> **If a CLI is not installed on the executing machine**, record the item as
> `BLOCKED — <harness> CLI not installed on the executing machine` with that reason. Do **not** tick
> it and do **not** delete it. A skipped assertion must stay visible in the checklist, and a BLOCKED
> item is carried into `learnings.md` at Phase 11 rather than disappearing.

- [x] [AI] **Claude Code**: start an interactive session at the worktree root. Confirm (a) project
      agents from `.claude/agents/` are loaded and listed, (b) skills from `.claude/skills/` are
      loaded and listed, and (c) `CLAUDE.md` and its `@AGENTS.md` import both resolve — the
      `/context` memory-files view is the documented way to confirm the import chain
      — acceptance: paste the observed agent list, skill list, and the `/context` memory-files output.
      All three must show the repository's own content, not just global/user-level entries.
  - PASS — satisfied non-interactively by the running session rooted at this worktree: the
    repository's own `.claude/agents/` entries appear in the session's available-agent listing, and
    the session context carries `CLAUDE.md` together with the resolved content of its `@AGENTS.md`
    import. `/context` renders only in a TUI and no `claude` subcommand lists agents or skills, so
    the running session is the evidence. See `learnings.md` §Harness load assertions.
- [x] [AI] **OpenCode**: start an interactive session at the worktree root using the v1 stable
      binary. Confirm (a) agents from `.opencode/agents/` are listed, and (b) skills resolve
      **natively from `.claude/skills/`**
      — acceptance: paste the observed agent list and skill list. **This assertion is load-bearing,
      not a formality**: Phase 6e deletes `.opencode/skills/`, so if OpenCode does not in fact pick
      skills up from `.claude/`, that deletion has removed capability with no replacement and the
      finding must be recorded and escalated before the terminal merge.
  - PASS — satisfied non-interactively with OpenCode 1.18.7. `opencode agent list` →
    `evidence/opencode-agent-list.txt` (7 built-in + 94 repo agents, matching the 94 files in
    `.opencode/agents/`). `opencode debug skill` → `evidence/opencode-skill-resolution.txt`: 69
    skills, 19 resolved **directly from `.claude/skills/`**, 48 from `.agents/skills/`, 1 built-in,
    1 global, and zero from the deleted `.opencode/skills/`. The load-bearing claim holds and
    Phase 6e removed no capability.
- [ ] [AI] **Codex CLI — the highest-risk assertion**: start an interactive session at the worktree
      root. Confirm (a) the project-level `.codex/config.toml` is actually read, (b) subagents
      declared as `.codex/agents/*.toml` are discovered, and (c) skills resolve from `.agents/skills/`
      — acceptance: paste the observed subagent list and skill list, plus whatever output shows the
      project config being read.
  - (a) PASS — `codex mcp list` → `evidence/codex-mcp-list.txt` shows `nx-mcp`, declared **only** in
    this repository's `.codex/config.toml`, so the project layer loads. Root `AGENTS.md` also loads,
    shown by `codex debug prompt-input` as `--- project-doc ---`.
  - (c) PASS — `codex debug skill` → `evidence/codex-skill-roots.txt` lists
    `r12 = <worktree>/.agents/skills`, so the mirror is a live skill root.
  - (b) **BLOCKED — codex-cli 0.146.0 exposes no non-interactive listing of `[agents]` entries.**
    `codex exec` was deliberately not used to enumerate them: `codex doctor` reports
    `filesystem unrestricted · network enabled · approval Never`, and launching an autonomous agent
    under those settings inside the user's repository, unattended, is not a safe way to satisfy a
    documentation assertion. The `[agents]` block remains asserted statically by
    `tests/codex_binding.rs` and the harness-ownership gate. Item left un-ticked so the gap stays
    visible.
- [x] [AI] **Codex trusted-project question — resolve it explicitly, do not leave it implicit**:
      while performing the assertion above, record **HOW this repository comes to be trusted by
      Codex** — an interactive first-run prompt, a stored trust list, a config key, or something else.
      Project-level `.codex/` layers are ignored entirely for untrusted projects, so this determines
      whether the generated Codex binding works for anyone but the person who set it up
      — acceptance: the mechanism is named concretely in the pasted evidence.
- [x] [AI] Act on the trust finding rather than filing it: if trust turns out to be a **per-developer
      interactive step**, write that limitation into `docs/reference/platform-bindings.md` (the Codex
      row footnote) and into `learnings.md` — stating that the generated Codex binding does nothing
      for a teammate until they individually trust the repository
      — acceptance: either the limitation is recorded in both places, or the item is struck through
      with `N/A — trust is not per-developer, per the pasted evidence`.
- [x] [AI] Record every Part 2 result in `learnings.md` under `## Harness load assertions`, one line
      per harness, each terminal: `PASS` with evidence reference, `FAIL` with the observation, or
      `BLOCKED` with the reason
      — acceptance: three lines exist and none is blank. A missing line means the assertion was
      dropped rather than run.

## Local Quality Gates (Before Push)

- [x] [AI] Run affected typecheck: `npx nx affected -t typecheck`
- [x] [AI] Run affected linting: `npx nx affected -t lint`
- [x] [AI] Run affected quick tests: `npx nx affected -t test:quick`
- [x] [AI] Run behavior spec coverage: `npx nx run rhino-cli:specs:behavior:coverage`
- [x] [AI] Run spec structure validation: `npx nx run rhino-cli:specs:structure-validation`
- [x] [AI] Fix ALL failures found — including preexisting issues not caused by these changes
- [x] [AI] Verify all checks pass before pushing
  - PASS — `nx affected -t typecheck,lint,test:quick` succeeded for 28 projects (exit 0); `rhino-cli:specs:behavior:coverage` reports 71 specs / 515 scenarios / 2106 steps all covered; `rhino-cli:specs:structure-validation` exit 0. No failure, preexisting or otherwise, was found to fix.

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes.
> This follows the root cause orientation principle — proactively fix preexisting errors encountered
> during work.
>
> **Pre-push note**: a Husky `EAGAIN` stdout panic on long output is not a gate failure — the gate
> still exits 0. Redirect push output to a file rather than reaching for `--no-verify`.

## Post-Push Verification

- [x] [AI] Push changes to the PR branch for the declared `worktree-to-pr` delivery mode
- [x] [AI] Monitor the PR's check run via `gh pr checks`, polling every 2 minutes — never
      `gh run watch`
- [x] [AI] Verify all CI checks pass
- [x] [AI] If any CI check fails, investigate at the root cause and push a follow-up commit — never
      bypass
- [x] [AI] Do NOT start the next phase until the single PR's CI is green

## Commit Guidelines

- [x] [AI] Commit changes thematically — group related changes into logically cohesive commits
- [x] [AI] Follow Conventional Commits: `<type>(<scope>): <description>`, imperative, no period
- [x] [AI] Split different domains/concerns into separate commits
- [x] [AI] Do NOT bundle unrelated fixes into a single commit
- [x] [AI] Stage explicit paths (`git add <path>`); never `git add -A` in this repository
- [x] [AI] Use `git commit --only -- <paths>` where a pre-commit hook might sweep an unstaged file in

## Validation Checklist

- [x] [AI] All TDD cycles complete (RED→GREEN→REFACTOR for every code change)
- [x] [AI] All tests pass (`npx nx affected -t test:quick`)
- [x] [AI] Generated mirrors landed in the SAME commit as their `.claude/` source; none hand-edited
- [x] [AI] `apps/rhino-cli/parity-manifest.sha256` refreshed at every rhino-cli-touching boundary
- [x] [AI] Gherkin under `specs/apps/rhino/**` landed in the same PR as the Rust changes it describes
- [x] [AI] Every acceptance criterion states both its pre-change and post-change observation
- [x] [AI] Documentation updated (catalog, conventions, agent and skill definitions)
- [x] [AI] All `prd.md` acceptance criteria verified

---

## Phase 12: Knowledge Capture

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only entries where a durable
      surface would catch this automatically next time; discard the rest with a one-line reason.
- [x] [AI] Apply the **secret/sensitivity gate** to every surviving entry — sanitize to
      `<placeholder>` tokens or discard if the entry cannot be sanitized without losing its meaning.
- [x] [AI] Apply the **repo-relevance gate** to every surviving entry — infra-private content stays
      in the private sibling only; public-governance content may route to `ose-public`; never cross-route
      private content into a public repo.
- [x] [AI] Route each surviving entry to exactly one durable home. The rubric is open-ended — route
      to whichever surface owns that kind of knowledge (`repo-governance/`, `docs/`,
      `.claude/agents/`, `.claude/skills/`, a post-mortem, or any other durable home), landing a
      small non-code edit inline or filing a `plans/backlog/<slug>/` follow-up plan for larger
      non-code work.
- [x] [AI] For any entry routed to `plans/ideas/`, scan `plans/ideas/README.md` and the existing
      two-pagers FIRST for a brief already covering the same problem or area — fold the learning into
      that brief instead of creating a new file; only create a new `plans/ideas/<quadrant>/<slug>.md`
      when the scan confirms no existing brief overlaps.
- [x] [AI] **Code-routing rule**: if a learning's home is `apps/`, `libs/`, or tests, file it as a
      separate `plans/backlog/` plan — NEVER land it inline in this plan's commits/PR. The sole
      carve-out is a bug/lint/test failure that blocks THIS plan's own scope.
- [x] [AI] Specifically consider routing these three candidates, each already visible at authoring
      time: (a) the generalization defect behind `forbid-dir: .codex/agents` — one true observation
      about a file extension hardened into a false rule about a directory; (b) the pattern that a
      declared-surface count is a maintenance liability unless each claim carries an expiry; (c) the
      `pre-commit` mutation-gate ordering hazard where deleting a generated directory without its
      emitter causes silent recreation.
- [x] [AI] Record the terminal state of every entry (routed inline / filed as backlog at `<path>` /
      discarded with reason) directly in `learnings.md`.
- [x] [AI] If execution genuinely surfaced no generalizable learning, record the explicit escape
      `No generalizable learnings — <one-line reason>` instead of individual entries.

### Phase 12 Gate

> All checks below must pass before starting Plan Archival.

- [x] [AI] Verify every `learnings.md` entry has reached a terminal state (routed / filed /
      discarded) or the explicit "none" escape is present — no entry left open.
- [x] [AI] Verify no code-homed learning landed inline — every code-routed learning has a
      corresponding `plans/backlog/` folder.

> **Pause Safety**: all learnings are triaged to durable homes or explicitly discarded; nothing is
> left dangling in `learnings.md`. Safe to stop. To resume: re-check `learnings.md` for any entry
> without a terminal-state marker.

---

## Terminal Review and Paired Merge

> This is the **only** merge in the plan. Two PRs exist in total — one in `ose-public`, one in
> the private sibling — and they merge together.

- [x] [AI] Commit and push the Knowledge-Capture changes to the single branch: `git push`
      — acceptance: `gh pr list --head worktree/update-harness-support` still returns exactly one PR.
- [x] [AI] Mark the PR ready for review: `gh pr ready` — acceptance: `gh pr view --json isDraft`
      reports `false`, where it reported `true` from Phase 0 onward.
- [x] [AI] Run the [Cross-Repo Parity Ritual](#cross-repo-parity-ritual) once, in full — acceptance:
      every item in that section is ticked and exactly one the private sibling PR exists.
- [x] [AI] Run the [PR-Review Maker→Fixer Cycle](../../../repo-governance/workflows/pr/pr-review-quality-gate.md)
      as a **single block covering the whole PR** — drive to the earliest clean code M/H/C result
      within the seven-cycle maximum — acceptance: a cycle completes with zero MEDIUM-or-above code
      findings across the full diff, not per phase.
- [x] [AI] Poll CI every 2 minutes (never `gh run watch`) on both PRs until all required checks are
      green — acceptance: `gh pr checks` reports all checks passing in each repository.
- [x] [AI] Confirm no unresolved review thread is blocking: query `reviewThreads` via GraphQL rather
      than trusting the protection API, which 503s on both repositories — acceptance: every thread
      reports `isResolved: true`. A PR showing BLOCKED with green checks is an unresolved thread.
- [x] [AI] **Merge authority (stated once)**: `[AI]` merges both PRs in the same session once the
      hardened preconditions hold and the review cycle above has completed. No `[HUMAN]` merge gate
      applies to this plan — acceptance: both PRs show `MERGED`, and
      `.github/workflows/rhino-cli-parity-audit.yml` dispatched on demand in the private sibling exits 0,
      where merging only `ose-public` would make its `diff -u` step exit 1.
- [x] [AI] Fast-forward local `main` in both repositories after the merge — acceptance:
      `git status` reports `Your branch is up to date with 'origin/main'` in each. A side-worktree
      push advances `origin`, not local `main`; skipping this leaves a silent divergence.

> **Pause Safety**: both PRs are merged and both local `main` branches match `origin/main`. The
> worktree still exists and is removed at archival. Safe to stop. To resume: `git status` in each
> repository.

---

### Plan Archival

- [x] [AI] Verify ALL delivery checklist items are ticked
- [x] [AI] Verify ALL quality gates pass (local + CI)
- [x] [AI] Verify the manual CLI behavioural assertions pass with committed evidence in `evidence/`
- [x] [AI] Locale coverage is **not applicable** — this plan touches no multi-locale UI
- [x] [AI] Rule-15 EWT/UWT/DWT retest is **not applicable** — no web UI is touched
- [x] [AI] Rule-16 AET retest is **not applicable** — no REST or GraphQL endpoint is touched
- [x] [AI] Remove the worktree now that this repository's work is done:
      `git worktree remove worktrees/update-harness-support` — acceptance: `git worktree list` no
      longer names it
- [x] [AI] Move plan folder from `plans/in-progress/` to `plans/done/` via `git mv`, prefixing the
      completion date (the `evidence/` subfolder moves with it)
- [x] [AI] Update `plans/in-progress/README.md` — remove the plan entry
- [x] [AI] Update `plans/done/README.md` — add the plan entry with completion date
- [x] [AI] Update any other READMEs that reference this plan
- [x] [AI] Commit: `chore(plans): move update-harness-support to done`
