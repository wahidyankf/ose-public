# Delivery — Rhino speccoverage multi-line scenario scan

> **Legend** — `[AI]`: an agent performs the step (the default; unmarked steps are `[AI]`).
> `[HUMAN]`: only a human can do it (physical action, out-of-band approval, real-secret or
> privileged-credential handling). `[AI+HUMAN]`: agent prepares, human approves or finishes.
>
> **Phase Gate** — every phase ends with a `### Phase N Gate` (must-pass verification) plus a
> `> **Pause Safety**:` note (the safe-to-stop state and the single command to resume). A phase is
> not complete until its gate is green; do not start phase N+1 while any gate check fails.

## Worktree

Worktree path: `worktrees/rhino-speccoverage-multiline-scenario-scan/`

Optional manual pre-provisioning (run from repo root):

```bash
claude --worktree rhino-speccoverage-multiline-scenario-scan
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest
`origin/main` when missing, syncs with `origin/main` before implementing, and prompts before
deleting the worktree after the plan is archived and pushed.

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

## Delivery Mode: worktree-to-pr

Work in `worktrees/rhino-speccoverage-multiline-scenario-scan/`; open a draft PR against `main`;
`[HUMAN]` merges when ready. The finalization phase runs the **PR-Review Maker→Fixer Cycle**
(`pr-review-maker` → `pr-review-fixer`, default 3 sequential CI-gated cycles) before the `[HUMAN]`
merge. "Done" is a green, fully-reviewed PR handed off; "merged" happens on the maintainer's own
schedule. See
[Plans Organization Convention §Delivery Mode](../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)
and the [PR Review Quality Gate workflow](../../../repo-governance/workflows/pr/pr-review-quality-gate.md).
`ose-primer` and `ose-infra` resolve this same `worktree-to-pr` mode independently, each inside its
own repo — see the Multi-Repo rhino-cli Delivery note immediately below.

## Multi-Repo rhino-cli Delivery

This plan changes `apps/rhino-cli` — inside the byte-identity boundary (see
[README.md § Key constraint](./README.md#key-constraint-rhino-cli-byte-identity)) — so the rhino-cli
change (`checker.rs`, the spec-coverage feature scenario, the gherkin README count row, and
`tests/spec_coverage.rs`) MUST land byte-identically in **all three repos**: `ose-public`,
`ose-primer`, `ose-infra`. Each repo goes through its **own full delivery, independently**: its own
draft PR (Phase 1 for `ose-public`; Phase 3 for the siblings), its own `pr-review-maker` →
`pr-review-fixer` **3 sequential CI-gated review cycles**, its own confirmation that ALL quality
gates are green (local `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` + CI),
and only THEN its own `[HUMAN]` merge (Phase 4). **Three peer PRs, each independently reviewed (3
cycles), gated, and merged — never a single PR with side-propagation.** The `libs/web-ui`
`// prettier-ignore` hack removal (Phase 2) is `ose-public`-only and sits outside this tri-repo rule
(`libs/web-ui` is outside the byte-identity boundary). Knowledge Capture and the plan-folder
archival-in-PR (Phase 5 + Plan Archival) happen ONLY in the `ose-public` PR, since this plan's folder
lives in `ose-public` alone.

---

## Phase 0: Environment Setup and Baseline

> _Executor: repo-setup-manager_

- [x] [AI] Plan already promoted from backlog to in-progress (date prefix stripped) during planning
      — acceptance: folder exists at `plans/in-progress/rhino-speccoverage-multiline-scenario-scan/`
- [x] [AI] Provision/enter the worktree per the `## Worktree` section above
      — acceptance: shell cwd is `worktrees/rhino-speccoverage-multiline-scenario-scan/`
      — done: `git worktree add worktrees/rhino-speccoverage-multiline-scenario-scan -b rhino-speccoverage-multiline-scenario-scan origin/main`; cwd confirmed
- [x] [AI] Install dependencies in the root worktree: `npm install`
      — acceptance: exits 0, `node_modules/` synchronized
      — done: exited 0, 1572 packages added
- [x] [AI] Converge the polyglot toolchain in the root worktree: `npm run doctor -- --fix`
      — acceptance: exits 0 with no unresolved drift (Rust toolchain + cargo present)
      — done: "Summary: 16/16 tools OK, 0 warning, 0 missing" — nothing to fix
- [x] [AI] Record the rhino-cli baseline:
      `npx nx run rhino-cli:test:unit && npx nx run rhino-cli:specs:behavior:coverage`
      — acceptance: baseline pass/fail recorded in `learnings.md`; preexisting failures documented
      — done: both green, recorded in learnings.md (4 features/26 scenarios/102 steps; 57 specs/316 scenarios/1313 steps)
- [x] [AI] Record the web-ui baseline: `npx nx run web-ui:specs:behavior:coverage`
      — acceptance: baseline pass/fail recorded (expected: passes because the hacks are still present)
      — done: green, recorded in learnings.md (21 specs/118 scenarios/311 steps)
- [x] [AI] Resolve any preexisting failures before proceeding
      — acceptance: no unresolved preexisting failures remain
      — done: none found; all three baselines green on first run

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `npm install` exited 0 and `npm run doctor -- --fix` reports no unresolved drift
- [x] [AI] `npx nx run rhino-cli:test:unit` baseline recorded (green) and any preexisting failure resolved
- [x] [AI] `npx nx run rhino-cli:specs:behavior:coverage` baseline recorded (green)

> **Pause Safety**: only the toolchain was verified and the baseline recorded — no feature work
> exists yet. Safe to stop indefinitely. To resume: re-run
> `npx nx run rhino-cli:test:unit && npx nx run rhino-cli:specs:behavior:coverage` and confirm green.

---

## Phase 1: rhino-cli scanner fix + companion Gherkin

> _Suggested executor: `swe-rust-dev`_
>
> TDD cycle — RED substeps reproduce the cross-line miss at both the behavior and unit level, GREEN
> applies the whole-content scan, REFACTOR tidies. Each substep is its own checkbox.

### 1a. Behavior-level reproducer (cucumber-rs binder)

- [x] [AI] **RED** — Add the AC-4 scenario to
      `specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature`
      and its cucumber step definitions to `apps/rhino-cli/tests/spec_coverage.rs`. The step def
      builds a fixture whose covering test contains a `Scenario(` token with its title on the NEXT
      physical line, then drives `rhino-cli specs behavior-coverage validate` and asserts success.
      **Gherkin (binds) →** "A scenario whose title wraps onto a following physical line is still
      recognized as covered"
      — command: `cargo test --manifest-path apps/rhino-cli/Cargo.toml --test spec_coverage`
      — acceptance: the new test FAILS (the wrapped-title scenario is reported as an unimplemented
      gap by the current per-line scanner):
      — done: confirmed FAIL — "Missing scenarios (1): specs/wrapped-title.feature → Scenario:
      \"Wrapped title covers\"" (9 passed, 1 failed / 10 scenarios)

  ```gherkin
  Scenario: A scenario whose title wraps onto a following physical line is still recognized as covered
    Given a feature file whose scenario is bound by a test whose Scenario(...) title wraps onto the next physical line
    When the developer runs behavior-coverage validate on the specs and app directories
    Then the command exits successfully
    And the output does not report the wrapped-title scenario as an unimplemented scenario
  ```

### 1b. Unit-level reproducers (pure-core fixtures)

- [x] [AI] **RED** — Add a unit fixture in the `#[cfg(test)]` module of
      `apps/rhino-cli/src/application/speccoverage/checker.rs` (alongside
      `extract_ts_scenario_titles_picks_up_double_quoted_title` at ~line 1153) named
      `extract_ts_scenario_titles_picks_up_cross_line_double_quoted_title`, writing a file whose
      content is `Scenario(\n  \"Wrapped double title\",\n  () => {});\n` and asserting the title set
      contains `Wrapped double title`.
      **Gherkin (underpins) →** AC-1.
      — command: `cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib extract_ts_scenario_titles_picks_up_cross_line_double_quoted_title`
      — acceptance: the new test FAILS (title missing under per-line scan)
      — done: confirmed FAIL — `assertion failed: titles.contains("Wrapped double title")`
- [x] [AI] **RED** — Add a unit fixture
      `extract_ts_scenario_titles_picks_up_cross_line_single_quoted_title` writing
      `Scenario(\n  'Wrapped single title',\n  () => {});\n` and asserting the set contains
      `Wrapped single title`.
      **Gherkin (underpins) →** AC-2.
      — command: `cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib extract_ts_scenario_titles_picks_up_cross_line_single_quoted_title`
      — acceptance: the new test FAILS
      — done: confirmed FAIL — `assertion failed: titles.contains("Wrapped single title")`
- [x] [AI] **GUARD** (characterization, not RED) — Add an explicit same-line guard fixture
      `extract_ts_scenario_titles_preserves_same_line_titles_alongside_cross_line_titles` asserting
      a double-quoted same-line title, a single-quoted same-line title, AND a cross-line title all
      extract correctly from one shared file. This locks the pre-change behavior so the GREEN
      whole-content rewrite cannot silently regress it — specifically the combination the isolated
      RED/pre-existing fixtures never jointly exercise: a same-line title surviving in a file that
      also contains a cross-line title; it PASSES on current code by design. (Renamed and
      differentiated in the PR #62 Cycle 3 review cycle — the original fixture was byte-identical to
      the pre-existing `extract_ts_scenario_titles_picks_up_double_quoted_title` test and added no
      incremental regression coverage; see that PR's review thread for the finding.)
      **Gherkin (underpins) →** AC-3.
      — command: `cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib extract_ts_scenario_titles_preserves_same_line_titles_alongside_cross_line_titles`
      — acceptance: the guard test PASSES against the current code, and MUST still pass after the GREEN step
      — done: confirmed PASS on current (pre-GREEN) code; re-confirmed PASS after differentiation
      against the post-GREEN (already-rewritten) code in Cycle 3

### 1c. Implementation

- [x] [AI] **GREEN** — Rewrite `extract_ts_scenario_titles` (`checker.rs:613-625`) to scan the whole
      file: replace `for line in content.lines() { for caps in scenario_def_re().captures_iter(line)`
      with a single `for caps in scenario_def_re().captures_iter(&content)` loop (keep the
      `dq`/`sq`/`unescape_string`/`normalize_ws` body unchanged).
      — command: `cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib extract_ts_scenario_titles`
      — acceptance: all `extract_ts_scenario_titles*` unit tests PASS (cross-line + same-line)
      — done: confirmed PASS — 4 passed, 1142 filtered out
- [x] [AI] **GREEN** — Re-run the behavior binder:
      `cargo test --manifest-path apps/rhino-cli/Cargo.toml --test spec_coverage`
      — acceptance: the AC-4 test PASSES (no false gap for the wrapped binding)
      — done: confirmed PASS — 10 scenarios (10 passed), 38 steps (38 passed)

### 1d. Refactor + spec housekeeping

- [x] [AI] **REFACTOR** — Optionally add a `(?s)` flag to `scenario_def_re()` (`checker.rs:31`) for
      symmetry with `step_def_re()`, with an inline comment noting it is functionally inert for this
      pattern (no `.` metacharacter); update the function doc comment to state the scan is
      whole-content.
      — command: `cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib`
      — acceptance: all lib tests still PASS; `npx nx run rhino-cli:lint` exits 0 (clippy clean)
      — done: confirmed — 1145 passed/0 failed/1 ignored; clippy clean (exit 0)
- [x] [AI] Update the scenario-count table row for `spec-coverage-validate.feature` in the
      **top-level** `specs/apps/rhino/behavior/rhino-cli/gherkin/README.md` (row ~line 94; the table
      lives ONLY in this top-level README — `.../spec-coverage/README.md` is a plain bullet list with
      no count table and must NOT be edited for this). The row currently shows `6`, but the file
      already contains 9 scenarios before this plan's AC-4 addition — a preexisting under-count; this
      single edit reconciles both the preexisting 6-vs-9 drift and the +1 from the new AC-4 scenario.
      — command: `grep -c "^  Scenario:" specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature`
      — acceptance: the `gherkin/README.md` row count equals the grep count (expected: 10 after AC-4 is added)
      — done: grep confirmed 10; README.md row updated 6→10

### Specs & Gherkin Delivery (gate)

- [x] [AI] Run the behavior-coverage gate:
      `npx nx run rhino-cli:specs:behavior:coverage`
      — acceptance: exits 0; the new AC-4 scenario is reported covered
      — done: "Spec coverage valid! 57 specs, 317 scenarios, 1317 steps — all covered."
- [x] [AI] Run cardinality + structure validators on the edited feature file:
      `npx nx run rhino-cli:specs:gherkin-cardinality-validation && npx nx run rhino-cli:specs:structure-validation`
      — acceptance: both exit 0
      — done: both PASSED (cardinality audit passed; structure validate 0 findings all workspaces)

### Local Quality Gates (Before Push) — Phase 1

- [x] [AI] `npx nx affected -t typecheck` — exits 0
      — done: "Successfully ran target typecheck for 25 projects and 6 tasks they depend on"
- [x] [AI] `npx nx affected -t lint` — exits 0
      — done: "Successfully ran target lint for 25 projects and 8 tasks they depend on" (preexisting
      `no-empty-pattern` eslint warnings in unrelated ose-www-be-e2e generated spec files — warnings,
      not errors, gate still exits 0, out of this plan's scope)
- [x] [AI] `npx nx affected -t test:quick` — exits 0
      — done: "Successfully ran target test:quick for 25 projects and 11 tasks they depend on"
- [x] [AI] `npx nx affected -t specs:behavior:coverage` — exits 0
      — done: "Successfully ran target specs:behavior:coverage for 25 projects"
- [x] [AI] `npx nx run rhino-cli:test:integration` — exits 0 (runs the cucumber `spec_coverage` binder)
      — done: "Successfully ran target test:integration for project rhino-cli" (includes the
      spec_coverage binder's 10/10 passing scenarios)

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes.
> This follows the Root Cause Orientation principle — proactively fix preexisting errors encountered
> during work. Commit preexisting fixes separately with appropriate conventional commit messages.

### Commit Guidelines — Phase 1

- [x] [AI] Commit thematically, Conventional Commits format, split by concern:
      `fix(rhino-cli): scan whole file content for TS scenario titles` (source + unit fixtures);
      `test(rhino-cli): add cross-line scenario-coverage behavior scenario` (feature + binder);
      `docs(specs): update spec-coverage scenario count` (README table)
      — done: 4 commits — the 3 named above plus `chore(plans): track Phase 0-1 delivery progress`
      for the plan-tracking docs
- [x] [AI] Commit and push to origin `rhino-speccoverage-multiline-scenario-scan` (the PR branch)
      — done: pushed, new branch tracking `origin/rhino-speccoverage-multiline-scenario-scan`
- [x] [AI] Create the ose-public draft PR (skip if a PR for this branch already exists):
      `gh pr create --draft --title "fix(rhino-cli): scan whole file content for TS scenario titles" --body "Fixes the speccoverage multi-line Scenario(...) title scan (see plans/in-progress/rhino-speccoverage-multiline-scenario-scan/ for full context)." --base main --head rhino-speccoverage-multiline-scenario-scan`
      — acceptance: `gh pr view --json state` shows OPEN
      — done: PR #62 created — https://github.com/wahidyankf/ose-public/pull/62

### Post-Push CI Verification — Phase 1

- [x] [AI] Monitor GitHub Actions workflows triggered by the push: poll
      `gh run view --json status,conclusion` every ~2 min per the
      [CI monitoring convention](../../../repo-governance/development/workflow/ci-monitoring.md) —
      no tight-loop, never `gh run watch`
      — done: polled via background job, no tight-loop
- [x] [AI] Verify ALL CI checks pass; if any fails, fix at root cause and push a follow-up commit
      — done: `gh pr checks 62` — 20 passed, 0 failed
- [x] [AI] Do NOT proceed to Phase 2 until CI is fully green
      — done: confirmed fully green before starting Phase 2

### Phase 1 Gate

> All checks below must pass before starting Phase 2.

- [x] [AI] `cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib extract_ts_scenario_titles` — all pass
- [x] [AI] `cargo test --manifest-path apps/rhino-cli/Cargo.toml --test spec_coverage` — AC-4 passes
- [x] [AI] `npx nx run rhino-cli:specs:behavior:coverage` — exits 0
- [x] [AI] CI is green on the pushed commit — 20/20 checks passed on PR #62

> **Pause Safety**: the scanner is fixed and fully covered; the web-ui hacks are untouched and still
> valid. The repo compiles and all gates pass. Safe to stop. To resume:
> `npx nx run rhino-cli:test:quick`.

---

## Phase 2: web-ui prettier-ignore hack removal (ose-public only)

> _Suggested executor: `swe-typescript-dev`_

- [x] [AI] Remove the `// prettier-ignore` comment above the two wrapped `Scenario(` calls in
      `libs/web-ui/src/primitives/code-block/code-block.steps.tsx` (comments at lines 155 and 190),
      then run Prettier so it re-wraps the calls naturally:
      `npx prettier --write libs/web-ui/src/primitives/code-block/code-block.steps.tsx`
      — acceptance: `grep -n "prettier-ignore" libs/web-ui/src/primitives/code-block/code-block.steps.tsx` returns no matches
      — done: both removed; prettier re-wrapped both titles onto their own line
- [x] [AI] Remove the `// prettier-ignore` comment above the wrapped `Scenario(` call in
      `libs/web-ui/src/primitives/code-block/copy-button.steps.tsx` (comment at line 45), then run
      `npx prettier --write libs/web-ui/src/primitives/code-block/copy-button.steps.tsx`
      — acceptance: `grep -n "prettier-ignore" libs/web-ui/src/primitives/code-block/copy-button.steps.tsx` returns no matches
      — done: removed; prettier reformatted
- [x] [AI] Verify the web-ui spec-coverage gate stays green now that titles are re-wrapped:
      `npx nx run web-ui:specs:behavior:coverage`
      — acceptance: exits 0 with zero scenario gaps (AC-5)
      — done: "Spec coverage valid! 21 specs, 118 scenarios, 311 steps — all covered."
- [x] [AI] Verify the web-ui unit tests still pass (step files still execute):
      `npx nx run web-ui:test:unit`
      — acceptance: exits 0
      — done: "Successfully ran target test:unit for project web-ui"

### Local Quality Gates (Before Push) — Phase 2

- [x] [AI] `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` — all exit 0
      — done: "Successfully ran targets typecheck, lint, test:quick, specs:behavior:coverage for 26
      projects and 6 tasks they depend on"
- [x] [AI] Fix ALL failures found, including preexisting ones (Root Cause Orientation)
      — done: no failures found

### Commit Guidelines — Phase 2

- [x] [AI] Commit: `chore(web-ui): drop prettier-ignore hacks now that speccoverage scans whole file`
      — done: plus a `chore(plans)` tracking commit
- [x] [AI] Commit and push to origin `rhino-speccoverage-multiline-scenario-scan` (the PR branch)
      — done: pushed `abc115147..b1f358f31`

### Post-Push CI Verification — Phase 2

- [x] [AI] Monitor GitHub Actions: poll `gh run view --json status,conclusion` every ~2 min per the
      [CI monitoring convention](../../../repo-governance/development/workflow/ci-monitoring.md) —
      no tight-loop, never `gh run watch`; verify ALL checks pass; fix at root cause and re-push on
      failure
      — done: polled via background job, no tight-loop
- [x] [AI] Do NOT proceed to Phase 3 until CI is fully green
      — done: `gh pr checks 62` — 20 passed, 0 failed

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `grep -rn "prettier-ignore" libs/web-ui/src/primitives/code-block/` — no matches
- [x] [AI] `npx nx run web-ui:specs:behavior:coverage` — exits 0
- [x] [AI] CI is green on the pushed commit — 20/20 checks passed on PR #62

> **Pause Safety**: ose-public carries the full fix and the hacks are gone; coverage is green. The
> sibling repos still carry the old scanner but are internally consistent (byte-identity is
> temporarily diverged but each repo independently passes its own gates). Safe to stop. To resume:
> re-verify `npx nx run web-ui:specs:behavior:coverage` and proceed to parity.

---

## Phase 3: byte-identical rhino-cli parity to ose-primer + ose-infra

> _Executor: direct byte-identical propagation. No cross-repo design deviation exists here — the
> change is a single verbatim diff — so the
> [multi-repo parity **planning** workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)
> (which authors one full plan-per-repo via a grilled deviation matrix) does not apply; that
> workflow's output is a plan document, not an execution mechanism. The heavier
> [plan-multi-repo-parity-planning-and-execution workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning-and-execution.md)
> — which composes planning AND execution across repos behind its own three-grill contract — is
> likewise the wrong tool here: it exists for cross-repo objectives that need per-repo
> deviation-matrix grilling and independent plan authoring, not for propagating a single
> already-decided verbatim diff. This phase instead applies the identical `checker.rs` / feature /
> README / test changes directly and lands each sibling repo's change via its own PR — reviewed,
> gated, and merged independently in Phase 4 — per the Sibling Delivery Mode below._
>
> The byte-identity boundary covers `apps/rhino-cli/src/…/checker.rs`, the
> `spec-coverage-validate.feature` scenario, its scenario-count row in the top-level
> `gherkin/README.md` table, and (for crate coherence) the `tests/spec_coverage.rs` binder — see
> `tech-docs.md §4`. The `libs/web-ui` change from Phase 2 is NOT propagated (ose-public-only).
>
> **Sibling Delivery Mode**: `worktree-to-pr` for both `ose-primer` and `ose-infra` — each sibling
> repo provisions its own worktree at `worktrees/rhino-speccoverage-multiline-scenario-scan/` (the
> same [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md)
> applied within that sibling's own checkout), commits the byte-identical change on a
> same-named branch, pushes, and opens its own draft PR against its `main`. This phase (3a/3b) only
> gets the draft PR open; each sibling's own 3-cycle review, quality gates, and `[HUMAN]` merge run
> in Phase 4 below, independently and on its own schedule — separate from the ose-public PR, whose
> merge is deferred past Phase 5 (Knowledge Capture + archival-in-PR).

### 3a. ose-primer propagation

- [x] [AI] Provision the ose-primer worktree:
      `git -C ~/ose-projects/ose-primer worktree add worktrees/rhino-speccoverage-multiline-scenario-scan -b rhino-speccoverage-multiline-scenario-scan origin/main`
      — acceptance: directory exists at
      `~/ose-projects/ose-primer/worktrees/rhino-speccoverage-multiline-scenario-scan/`
      — done: provisioned, confirmed on branch `rhino-speccoverage-multiline-scenario-scan`
- [x] [AI] Copy the byte-identical files into the ose-primer worktree, then run the sibling tests
      — acceptance: both `cargo test` commands exit 0:

  ```bash
  OSE_PRIMER_WT=$HOME/ose-projects/ose-primer/worktrees/rhino-speccoverage-multiline-scenario-scan
  cp ~/ose-projects/ose-public/apps/rhino-cli/src/application/speccoverage/checker.rs \
     "$OSE_PRIMER_WT/apps/rhino-cli/src/application/speccoverage/checker.rs"
  cp ~/ose-projects/ose-public/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature \
     "$OSE_PRIMER_WT/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature"
  cp ~/ose-projects/ose-public/specs/apps/rhino/behavior/rhino-cli/gherkin/README.md \
     "$OSE_PRIMER_WT/specs/apps/rhino/behavior/rhino-cli/gherkin/README.md"
  cp ~/ose-projects/ose-public/apps/rhino-cli/tests/spec_coverage.rs \
     "$OSE_PRIMER_WT/apps/rhino-cli/tests/spec_coverage.rs"
  cd "$OSE_PRIMER_WT" && cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib extract_ts_scenario_titles && cargo test --manifest-path apps/rhino-cli/Cargo.toml --test spec_coverage
  ```

  — done: **CORRECTED SOURCE PATH BUG** — the command above (and the two diff commands below) as
  originally written in this plan sourced from `~/ose-projects/ose-public/apps/...`, the
  PRIMARY ose-public checkout (on `main`, no Phase 1/2 changes) — not
  `~/ose-projects/ose-public/worktrees/rhino-speccoverage-multiline-scenario-scan/apps/...`,
  the worktree where all Phase 1/2 work actually lives. Same worktree-vs-primary-checkout confusion
  class as Plan 1's incident, this time in the plan text itself. First copy attempt silently pulled
  stale pre-fix content (only 1/4 unit tests found); caught immediately because the sibling test run
  only found 1 test instead of 4. Re-copied from the worktree path; all 4 unit tests + all 10
  behavior scenarios then passed.

- [x] [AI] Verify byte-identity of `checker.rs` between ose-public and the ose-primer worktree:
      `diff ~/ose-projects/ose-public/apps/rhino-cli/src/application/speccoverage/checker.rs ~/ose-projects/ose-primer/worktrees/rhino-speccoverage-multiline-scenario-scan/apps/rhino-cli/src/application/speccoverage/checker.rs`
      — acceptance: no diff output (byte-identical)
      — done: re-run against the corrected worktree source path — no diff (byte-identical)
- [x] [AI] Verify byte-identity of the behavior feature file between ose-public and ose-primer:
      `diff ~/ose-projects/ose-public/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature ~/ose-projects/ose-primer/worktrees/rhino-speccoverage-multiline-scenario-scan/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature`
      — acceptance: no diff output (AC-6)
      — done: no diff (byte-identical); also verified `tests/spec_coverage.rs` and `gherkin/README.md` no diff
- [x] [AI] Run the ose-primer parity gate:
      `cd ~/ose-projects/ose-primer/worktrees/rhino-speccoverage-multiline-scenario-scan && npx nx run rhino-cli:specs:behavior:coverage`
      — acceptance: exits 0
      — done: "Spec coverage valid! 57 specs, 317 scenarios, 1317 steps — all covered." (matches
      ose-public exactly)
- [x] [AI] Commit, push, and open the ose-primer draft PR
      — acceptance: `gh pr view --json state` (run from that worktree) shows OPEN:
      — done: PR #6 created — https://github.com/wahidyankf/ose-primer/pull/6. Pre-push `nx affected`
      initially failed on unrelated, preexisting polyglot-demo toolchain gaps in this fresh worktree
      (missing `mix deps.get` for `elixir-cabbage`/`elixir-gherkin`/`elixir-openapi-codegen`/
      `crud-be-elixir-phoenix`, missing `dotnet restore` for `crud-be-fsharp-giraffe`) — these show up
      as "affected" because nearly every project's `specs:*`/`lint` targets shell out through the
      rhino-cli binary, so touching rhino-cli marks the whole graph affected. Fetched the missing
      deps (mechanical, non-destructive); re-ran affected — all green; push then succeeded.

  ```bash
  cd ~/ose-projects/ose-primer/worktrees/rhino-speccoverage-multiline-scenario-scan
  git add apps/rhino-cli/src/application/speccoverage/checker.rs \
          specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature \
          specs/apps/rhino/behavior/rhino-cli/gherkin/README.md \
          apps/rhino-cli/tests/spec_coverage.rs
  git commit -m "fix(rhino-cli): scan whole file content for TS scenario titles"
  git push -u origin rhino-speccoverage-multiline-scenario-scan
  gh pr create --draft --title "fix(rhino-cli): scan whole file content for TS scenario titles" \
    --body "Byte-identical parity port from the ose-public fix." \
    --base main --head rhino-speccoverage-multiline-scenario-scan
  ```

### 3b. ose-infra propagation

- [x] [AI] Provision the ose-infra worktree:
      `git -C ~/ose-projects/ose-infra worktree add worktrees/rhino-speccoverage-multiline-scenario-scan -b rhino-speccoverage-multiline-scenario-scan origin/main`
      — acceptance: directory exists at
      `~/ose-projects/ose-infra/worktrees/rhino-speccoverage-multiline-scenario-scan/`
      — done: provisioned, confirmed on branch `rhino-speccoverage-multiline-scenario-scan`
- [x] [AI] Copy the byte-identical files into the ose-infra worktree, then run the sibling tests
      — acceptance: both `cargo test` commands exit 0: **(source: the ose-public WORKTREE at
      `~/ose-projects/ose-public/worktrees/rhino-speccoverage-multiline-scenario-scan/...`,
      not the primary checkout — see Phase 3a's caught bug)**
      — done: copied from the corrected worktree source; all 4 unit tests + all 10 behavior
      scenarios passed on first attempt (no repeat of Phase 3a's bug)

  ```bash
  OSE_INFRA_WT=$HOME/ose-projects/ose-infra/worktrees/rhino-speccoverage-multiline-scenario-scan
  cp ~/ose-projects/ose-public/apps/rhino-cli/src/application/speccoverage/checker.rs \
     "$OSE_INFRA_WT/apps/rhino-cli/src/application/speccoverage/checker.rs"
  cp ~/ose-projects/ose-public/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature \
     "$OSE_INFRA_WT/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature"
  cp ~/ose-projects/ose-public/specs/apps/rhino/behavior/rhino-cli/gherkin/README.md \
     "$OSE_INFRA_WT/specs/apps/rhino/behavior/rhino-cli/gherkin/README.md"
  cp ~/ose-projects/ose-public/apps/rhino-cli/tests/spec_coverage.rs \
     "$OSE_INFRA_WT/apps/rhino-cli/tests/spec_coverage.rs"
  cd "$OSE_INFRA_WT" && cargo test --manifest-path apps/rhino-cli/Cargo.toml --lib extract_ts_scenario_titles && cargo test --manifest-path apps/rhino-cli/Cargo.toml --test spec_coverage
  ```

- [x] [AI] Verify byte-identity of `checker.rs` between ose-public and the ose-infra worktree:
      `diff ~/ose-projects/ose-public/apps/rhino-cli/src/application/speccoverage/checker.rs ~/ose-projects/ose-infra/worktrees/rhino-speccoverage-multiline-scenario-scan/apps/rhino-cli/src/application/speccoverage/checker.rs`
      — acceptance: no diff output (byte-identical)
      — done: no diff (byte-identical)
- [x] [AI] Verify byte-identity of the behavior feature file between ose-public and ose-infra:
      `diff ~/ose-projects/ose-public/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature ~/ose-projects/ose-infra/worktrees/rhino-speccoverage-multiline-scenario-scan/specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature`
      — acceptance: no diff output (AC-6)
      — done: no diff (byte-identical); also verified `tests/spec_coverage.rs` and `gherkin/README.md` no diff
- [x] [AI] Run the ose-infra parity gate:
      `cd ~/ose-projects/ose-infra/worktrees/rhino-speccoverage-multiline-scenario-scan && npx nx run rhino-cli:specs:behavior:coverage`
      — acceptance: exits 0
      — done: "Spec coverage valid! 57 specs, 317 scenarios, 1317 steps — all covered." (matches
      ose-public and ose-primer exactly)
- [x] [AI] Commit, push, and open the ose-infra draft PR
      — acceptance: `gh pr view --json state` (run from that worktree) shows OPEN:
      — done: PR #9 created — https://github.com/wahidyankf/ose-infra/pull/9. No polyglot-toolchain
      gap this time (ose-infra's affected set is just `rhino`/`coralpolyp`); push succeeded cleanly
      on first attempt.

  ```bash
  cd ~/ose-projects/ose-infra/worktrees/rhino-speccoverage-multiline-scenario-scan
  git add apps/rhino-cli/src/application/speccoverage/checker.rs \
          specs/apps/rhino/behavior/rhino-cli/gherkin/spec-coverage/spec-coverage-validate.feature \
          specs/apps/rhino/behavior/rhino-cli/gherkin/README.md \
          apps/rhino-cli/tests/spec_coverage.rs
  git commit -m "fix(rhino-cli): scan whole file content for TS scenario titles"
  git push -u origin rhino-speccoverage-multiline-scenario-scan
  gh pr create --draft --title "fix(rhino-cli): scan whole file content for TS scenario titles" \
    --body "Byte-identical parity port from the ose-public fix." \
    --base main --head rhino-speccoverage-multiline-scenario-scan
  ```

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] `checker.rs` and `spec-coverage-validate.feature` are byte-identical across all three repos (diffs empty)
      — done: verified pairwise ose-public↔ose-primer and ose-public↔ose-infra, all 4 tracked files
- [x] [AI] `npx nx run rhino-cli:specs:behavior:coverage` exits 0 in ose-public, ose-primer, ose-infra
      — done: all three report identical "57 specs, 317 scenarios, 1317 steps — all covered."
- [x] [AI] Each sibling repo's rhino-cli change is committed, pushed, and its own draft PR is OPEN
      (`gh pr view --json state` shows OPEN when run from each sibling's worktree)
      — done: ose-public #62, ose-primer #6, ose-infra #9 — all `{"isDraft":true,"state":"OPEN"}`

> **Pause Safety**: all three repos carry the byte-identical fixed scanner, pass their coverage
> gates, and each sibling has its own open draft PR. Safe to stop. To resume: re-run the three-way
> `diff` on `checker.rs` and confirm empty, and re-check both sibling PRs' state.

---

## Phase 4: Multi-Repo PR-Review Cycles, Quality Gates & Merge

> _Executors: `pr-review-maker` → `pr-review-fixer`, per the
> [PR Review Quality Gate workflow](../../../repo-governance/workflows/pr/pr-review-quality-gate.md).
> Per the [Multi-Repo rhino-cli Delivery](#multi-repo-rhino-cli-delivery) rule above, all three legs
> below run the identical shape — default 3 strictly-sequential CI-gated review cycles, then a
> confirmed-green quality-gate check, then `[HUMAN]` merge. The only asymmetry: `ose-public`'s merge
> is deferred past Phase 5 (Knowledge Capture + archival-in-PR, `ose-public`-only), while
> `ose-primer` and `ose-infra` merge as soon as their own leg is green, since neither carries this
> plan's folder._

### 4a. ose-public — PR-Review Cycle (merge deferred to Plan Archival)

- [x] [AI] Verify the draft PR created in Phase 1's Commit Guidelines step is OPEN with CI green
      (branch `rhino-speccoverage-multiline-scenario-scan`)
      — acceptance: `gh pr view --json state,statusCheckRollup` shows OPEN + all checks green
      — done: `gh pr checks 62` — 20 passed, 0 failed
- [x] [AI] Cycle 1 — `pr-review-maker` reviews via the GitHub Reviews API; `pr-review-fixer`
      addresses every finding and pushes to the PR branch; wait for CI green
      — acceptance: all cycle-1 findings resolved; CI green
      — done: review posted (pullrequestreview-4724110607), 2 MEDIUM findings; fixer corrected the
      `(?s)` doc comment and removed a duplicate cucumber-rs step fn, pushed `1bea27f0`; both
      threads resolved; CI confirmed green (20/20) at new head
- [x] [AI] Cycle 2 — repeat maker→fixer; wait for CI green
      — acceptance: all cycle-2 findings resolved; CI green
      — done: review posted (pullrequestreview-4724313824), zero blocking findings — independently
      re-derived (not trusted) that both Cycle 1 fixes landed correctly; no fixer push needed; CI
      already green (20/20) at head `1bea27f0`
- [x] [AI] Cycle 3 — repeat maker→fixer; wait for CI green
      — acceptance: all cycle-3 findings resolved; CI green; no new findings outstanding
      — done: review posted (pullrequestreview-4724367120), 1 MEDIUM finding (duplicate GUARD
      test); fixer differentiated it into a genuine same-line+cross-line combined regression
      guard, pushed `64a70fef0cccbe1b109e0188f4d5ee9675a9e6fb`; thread resolved (0 unresolved of 3
      total across all 3 cycles); CI confirmed green (20/20) at final head
- [x] [AI] Confirm ALL quality gates green on the ose-public PR:
      `npx nx affected -t typecheck lint test:quick specs:behavior:coverage` (run from the
      ose-public worktree) then `gh pr checks rhino-speccoverage-multiline-scenario-scan`
      — acceptance: the local command exits 0; `gh pr checks` reports every check passing
      — done: affected gates green (26 projects, 6 dependent tasks); `gh pr checks 62` — 20 passed,
      0 failed at final head `64a70fef0cccbe1b109e0188f4d5ee9675a9e6fb`
- [x] [AI] Do NOT merge yet — the `ose-public` `[HUMAN]` merge happens in Plan Archival, after Phase
      5 (Knowledge Capture) and archival-in-PR are committed to this PR branch
      — done: acknowledged; not merging ose-public PR #62 now — deferred to Plan Archival

### 4b. ose-primer — PR-Review Cycle, Quality Gates & Merge

- [x] [AI] Verify the draft PR opened in Phase 3a is OPEN with CI green (branch
      `rhino-speccoverage-multiline-scenario-scan`, run from the ose-primer worktree)
      — acceptance: `gh pr view --json state,statusCheckRollup` shows OPEN + all checks green
      — done: `gh pr checks 6` — 26 passed, 0 failed
- [x] [AI] Cycle 1 — `pr-review-maker` reviews the ose-primer PR via the GitHub Reviews API;
      `pr-review-fixer` addresses every finding and pushes to the PR branch; wait for CI green
      — acceptance: all cycle-1 findings resolved; CI green
      — done: review posted (pullrequestreview-4724137199), zero blocking findings (state
      COMMENTED) — no fixer push needed; CI already green at head `c4dff502d2b625dc45e92c3061`
- [x] [AI] Cycle 2 — repeat maker→fixer; wait for CI green
      — acceptance: all cycle-2 findings resolved; CI green
      — done: review posted (pullrequestreview-4724194271) re-confirmed the same 2 issues Cycle 1
      deferred as "belongs upstream" — since fixed on ose-public #62 (commit `1bea27f0`); fixer
      re-synced the 4 corrected files verbatim (byte-identity via `diff`), pushed
      `17f9dd9ee35351144c403d0ea06098087f4e47ef`; mergeStateStatus CLEAN, 26/26 checks green
- [x] [AI] Cycle 3 — repeat maker→fixer; wait for CI green
      — acceptance: all cycle-3 findings resolved; CI green; no new findings outstanding
      — done: review posted (pullrequestreview-4724583636), 1 HIGH finding (stale `checker.rs` vs
      ose-public's final head `64a70fef`); fixer re-synced verbatim, byte-identity confirmed via
      `diff`, pushed `2c09a691f024e04253a6a009e3bcb22a592b1483`; thread resolved (0 unresolved);
      CI poll in progress
- [x] [AI] Confirm ALL quality gates green on the ose-primer PR
      — acceptance: `npx nx affected` exits 0 and `gh pr checks` reports every check passing:
      — done: affected gates green (26 projects, 18 dependent tasks; 1 flaky-task retry noted on
      unrelated `crud-be-elixir-phoenix`, non-blocking); `gh pr checks 6` — 26 passed, 0 failed at
      final head `2c09a691f024e04253a6a009e3bcb22a592b1483`

  ```bash
  cd ~/ose-projects/ose-primer/worktrees/rhino-speccoverage-multiline-scenario-scan
  npx nx affected -t typecheck lint test:quick specs:behavior:coverage
  gh pr checks rhino-speccoverage-multiline-scenario-scan
  ```

- [x] [AI] Merge the ose-primer PR to `main` now that its review cycle is complete and all
      quality gates pass — acceptance: `gh pr view --json state` (run from the ose-primer worktree)
      shows MERGED
      — done: merged per user's standing session override (AI merges once gates green, no human
      wait) — squash-merged 2026-07-17T17:16:13Z, `gh pr view 6 --json state` → MERGED

### 4c. ose-infra — PR-Review Cycle, Quality Gates & Merge

- [x] [AI] Verify the draft PR opened in Phase 3b is OPEN with CI green (branch
      `rhino-speccoverage-multiline-scenario-scan`, run from the ose-infra worktree)
      — acceptance: `gh pr view --json state,statusCheckRollup` shows OPEN + all checks green
      — done: `gh pr checks 9` — 21 passed, 0 failed
- [x] [AI] Cycle 1 — `pr-review-maker` reviews the ose-infra PR via the GitHub Reviews API;
      `pr-review-fixer` addresses every finding and pushes to the PR branch; wait for CI green
      — acceptance: all cycle-1 findings resolved; CI green
      — done: review posted (pullrequestreview-4724223360), 3 CRITICAL findings — PR #9 was opened
      before ose-public #62's Cycle-1 correction and needed resync; fixer re-copied the 3 corrected
      files verbatim from ose-public worktree (commit `1bea27f0`), byte-identity confirmed via
      `cmp`, all local gates green, pushed `01b2911b5500c46d8feebafe23d32e97273963b8`; all 3 threads
      resolved; CI confirmed green (21/21) at new head
- [x] [AI] Cycle 2 — repeat maker→fixer; wait for CI green
      — acceptance: all cycle-2 findings resolved; CI green
      — done: review posted (pullrequestreview-4724582360), 1 CRITICAL finding (stale `checker.rs`
      vs ose-public's final head `64a70fef`); fixer re-synced verbatim, byte-identity confirmed via
      `diff`/`cmp`/sha256, pushed `4f4fbf348`; thread resolved (0 unresolved of 4 total); CI poll
      in progress
- [x] [AI] Cycle 3 — repeat maker→fixer; wait for CI green
      — acceptance: all cycle-3 findings resolved; CI green; no new findings outstanding
      — done: review posted (pullrequestreview-4724865345), clean — byte-identity independently
      re-derived (diff + sha256) across all 4 files vs ose-public's final head `64a70fef`, all 4
      prior CRITICAL threads confirmed resolved, no new findings; CI green (21/21)
- [x] [AI] Confirm ALL quality gates green on the ose-infra PR
      — acceptance: `npx nx affected` exits 0 and `gh pr checks` reports every check passing:
      — done: affected gates green (5 projects, 3 dependent tasks); `gh pr checks 9` — 21 passed,
      0 failed at final head `4f4fbf348960ca3c75a442721d89ec53322b6a5f`

  ```bash
  cd ~/ose-projects/ose-infra/worktrees/rhino-speccoverage-multiline-scenario-scan
  npx nx affected -t typecheck lint test:quick specs:behavior:coverage
  gh pr checks rhino-speccoverage-multiline-scenario-scan
  ```

- [x] [AI] Merge the ose-infra PR to `main` now that its review cycle is complete and all quality
      gates pass — acceptance: `gh pr view --json state` (run from the ose-infra worktree) shows
      MERGED
      — done: merged per user's standing session override (AI merges once gates green, no human
      wait) — squash-merged 2026-07-17T17:45:02Z, `gh pr view 9 --json state` → MERGED

### Phase 4 Gate

> All checks below must pass before starting Phase 5.

- [x] [AI] `ose-public`: three maker→fixer cycles completed, each CI-gated; quality gates confirmed
      green; PR remains OPEN (merge deferred) with no unresolved review findings
      — done: `gh pr view 62` → state OPEN, isDraft true; GraphQL `reviewThreads` unresolved count
      → 0; final head `64a70fef0cccbe1b109e0188f4d5ee9675a9e6fb`
- [x] [AI] `ose-primer`: three maker→fixer cycles completed, quality gates confirmed green, PR shows
      MERGED
      — done: `gh pr view 6` → state MERGED, mergedAt 2026-07-17T17:16:13Z
- [x] [AI] `ose-infra`: three maker→fixer cycles completed, quality gates confirmed green, PR shows
      MERGED
      — done: `gh pr view 9` → state MERGED, mergedAt 2026-07-17T17:45:02Z

> **Pause Safety**: `ose-primer` and `ose-infra` are fully delivered and merged; `ose-public`'s PR is
> green and fully reviewed, awaiting Knowledge Capture + archival before its own merge. Safe to
> stop. To resume: `gh pr view` (per repo, from that repo's worktree) to confirm state before
> continuing.

---

## Phase 5: Knowledge Capture

> _Triage every surviving `learnings.md` entry before archival. See the
> [Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md)._

- [x] [AI] Apply the litmus test to every `learnings.md` entry — keep only if a durable surface would
      catch this automatically next time; discard the rest with a one-line reason
      — acceptance: every entry has either a route or a discard reason
      — done: 4 entries assessed (1 baseline record, 3 candidate learnings); Triage Log recorded in
      `learnings.md`
- [x] [AI] Apply the **secret/sensitivity gate** to every surviving entry — sanitize any secret,
      credential, token, or private hostname to a `<placeholder>` token, or discard if unsanitizable
      — acceptance: `learnings.md` contains no raw secret
      — done: no secrets/credentials/tokens/private hostnames in any entry — clean, no sanitization
      needed
- [x] [AI] Apply the **repo-relevance gate** — infra-private content stays in `ose-infra` only and is
      never cross-routed into `ose-public`/`ose-primer`; public-governance content may propagate via
      the parity loop
      — acceptance: no infra-private content appears in this repo's routed output
      — done: all 3 candidates are general dev-workflow governance content, none `ose-infra`-private;
      safe to land in `ose-public`
- [x] [AI] Route each surviving learning to exactly one durable home per the open-ended routing
      matrix — non-code homes may land inline (small edit) or as a `plans/backlog/` follow-up (large);
      code homes (`apps/`, `libs/`, tests) are ALWAYS filed as a separate `plans/backlog/<slug>/`
      plan and NEVER landed inline
      — acceptance: every `learnings.md` entry records its terminal routing state
      — done: 2 routed inline (`worktree-setup.md` new subsection; `pr-review-quality-gate.md` new
      Notes bullet), 1 discarded as a duplicate of a prior plan's fix, 1 baseline record needing no
      routing; no code-homed learning surfaced
- [x] [AI] If no generalizable learning surfaced, record the explicit escape in `learnings.md`:
      `No generalizable learnings — <one-line reason>`
      — acceptance: `learnings.md` is never silently empty
      — done: N/A — 2 genuine learnings did surface and were routed; escape hatch not needed

### Phase 5 Gate

> All checks below must pass before Plan Archival.

- [x] [AI] Every `learnings.md` entry is in a terminal state (routed inline, filed as backlog, or
      discarded with reason), or the file records the explicit "none" escape
      — done: Triage Log in `learnings.md` records a terminal state for all 4 entries
- [x] [AI] No code-homed learning landed inline in this plan's own commits/PR
      — done: both routed learnings are governance-doc edits (`repo-governance/`), not
      `apps/`/`libs/`/test changes; no code-homed learning surfaced at all

> **Pause Safety**: `learnings.md` is fully triaged (or explicitly recorded as empty); no future
> process depends on querying it later. Safe to stop. To resume: re-read `learnings.md` and confirm
> every entry is terminal.

---

## Plan Archival

- [x] [AI] Verify ALL delivery checklist items are ticked
      — done: swept delivery.md for `- [ ]`; only the archival-move steps below and the final
      `[HUMAN]`/AI-override merge item remain, as expected at this point in the sequence
- [x] [AI] Verify the Knowledge Capture phase is complete — every `learnings.md` entry reached a
      terminal state or the file records the explicit `No generalizable learnings — <reason>` escape;
      both safety gates applied to every surviving entry
      — done: Triage Log confirms all 4 entries terminal; secret + repo-relevance gates applied
- [x] [AI] Verify ALL quality gates pass (local + CI) across ose-public, ose-primer, ose-infra
      — done: ose-public affected gates green + `gh pr checks 62` 20/0 at final tracking head
      `37acab679`; ose-primer/ose-infra gates confirmed green pre-merge (Phase 4)
- [x] [AI] Verify the `ose-primer` and `ose-infra` PRs already show MERGED (completed in Phase 4):
      `gh pr view --json state --jq .state` run from each sibling's worktree — acceptance: prints
      `MERGED` for both
      — done: both print `MERGED`
- [x] [AI] Verify `checker.rs` and `spec-coverage-validate.feature` are byte-identical across the three repos
      — done: `diff` zero-output on all 4 tracked files (`checker.rs`, `spec_coverage.rs`,
      `spec-coverage-validate.feature`, gherkin `README.md`) across all 3 worktrees, pairwise
- [x] [AI] Move and rename: `git mv plans/in-progress/rhino-speccoverage-multiline-scenario-scan plans/done/YYYY-MM-DD__rhino-speccoverage-multiline-scenario-scan` using today's date as the completion date
      — done: `git mv` to `plans/done/2026-07-18__rhino-speccoverage-multiline-scenario-scan/`
- [x] [AI] Update `plans/in-progress/README.md` — remove the plan entry
      — done: entry removed
- [x] [AI] Update `plans/done/README.md` — add the plan entry with completion date
      — done: entry added at top of Completed Projects, dated 2026-07-18
- [x] [AI] Update any other READMEs that reference this plan (e.g., `plans/README.md`)
      — done: swept all READMEs for the plan slug; found and fixed a pre-existing broken relative
      link in `plans/done/2026-07-17__rhino-cli-source-drift-reconciliation/README.md` (pointed at
      the never-existent `plans/done/rhino-speccoverage-multiline-scenario-scan/`, now corrected to
      the actual archived path); `plans/README.md` and `plans/ideas.md` had no references
- [x] [AI] Commit the archival: `chore(plans): move rhino-speccoverage-multiline-scenario-scan to done`
      — done: `16033fb6d` (rename) + `e360366fd` (content), pushed
- [x] [AI] Merge the ose-public PR to `main` when ready — acceptance: PR shows MERGED (this sits
      outside the plan's done-boundary; the plan is "done" once the PR is green and fully reviewed)
      — done: merged per the standing session override (AI merges once gates are green, no human
      wait) — branch updated against `main` first (`gh pr update-branch`), CI re-confirmed green
      (20/20), squash-merged 2026-07-17T18:52:19Z, `gh pr view 62 --json state` → MERGED
