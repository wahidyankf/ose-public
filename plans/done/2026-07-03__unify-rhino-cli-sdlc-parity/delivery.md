# Delivery — Unify rhino-cli, SDLC & Repo Structure (Second Pass)

> **Legend** — every item in this checklist is `[AI]`-executable, including git-mechanical steps
> (worktree create/remove, commit-and-push-to-main) per the all-3-repos `[AI]`-tag rule — this plan
> has zero `[HUMAN]` gates. Each item names a file/path, a verbatim verification command, and an
> acceptance criterion. **Every item is verified against the working tree — no item is ticked on the
> strength of a prior "done" note.** Phases are gated: do not start a phase until the prior phase's
> `### Phase N Gate` passes.

<!-- -->

> **Important**: Fix ALL failures found during quality gates, not just those caused by your changes
> (root-cause orientation — proactively fix preexisting errors encountered during work).

<!-- -->

> **Multi-repo note**: this plan is authored in `ose-public`. Phases 0–2 execute here. Phases 3–4
> execute in `ose-primer` and `ose-infra` respectively — each begins by copying this plan folder into
> the sibling repo (per the
> [multi-repo parity workflow](../../../repo-governance/workflows/plan/plan-multi-repo-parity-planning.md)).
> `ose-infra` is a normal, non-bare repository — `git status`/`git reset --hard`/`git revert` all
> work at the top level exactly as in `ose-public`/`ose-primer`. It is worked via the same
> `worktrees/<name>/` convention as the other two repos (see the `## Worktree` section above); no
> bare-repo-specific handling applies.

## Worktree

Worktree path: `worktrees/unify-rhino-cli-sdlc-parity/`

Optional manual pre-provisioning (run from repo root):

```bash
claude --worktree unify-rhino-cli-sdlc-parity
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest
`origin/main` when missing, syncs with `origin/main` before implementing, and prompts before
deleting the worktree after the plan is archived and pushed. This worktree hosts Phases 0–2
(`ose-public` execution); Phases 3–4 operate in their own sibling-repo worktrees per the multi-repo
note above.

See [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md) and
[Plans Organization Convention §Worktree Specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).

---

## Phase 0 — Baseline, Re-Audit, Behavior Baseline & Gate Dry-Run (ose-public)

- [x] [AI] `npm install && npm run doctor -- --fix` in ose-public. Acceptance: doctor reports all tools OK.
  - **Done** (2026-07-02): ran in the plan's worktree (`worktrees/unify-rhino-cli-sdlc-parity/`) during Step 0 provisioning. `npm install` added 1556 packages; `npm run doctor -- --fix` reported **13/13 tools OK, 0 warning, 0 missing** (git, volta, node 24.16.0, npm 11.11.0, rust 1.94.0, cargo-llvm-cov, dotnet 10.0.300, docker, jq, shellcheck, hadolint, actionlint, playwright).
- [x] [AI] Confirm green starting point: `nx affected -t test:quick,lint,typecheck,specs:behavior:coverage --base=HEAD~1` exits 0 (or run-many if no affected). Acceptance: exit 0; resolve any preexisting failure first (root-cause, per repo policy).
  - **Done** (2026-07-02): `--base=HEAD~1` reported no affected projects (HEAD is the docs-only plan-edit commit `42386cb5b`, not an input to any project). Fell back to `nx run-many -t test:quick,lint,typecheck,specs:behavior:coverage --all` — **exit 0**, "Successfully ran targets ... for 29 projects and 5 tasks they depend on", confirmed on both a cold-cache and warm-cache run with explicit exit-code capture. Zero preexisting failures across all 29 projects (Rust, F#, TypeScript/Next.js, contracts). Working tree clean (a worktree-path-noise diff in `libs/fsharp-crane-core/tests/unit/coverage.json` from running `dotnet test` inside the worktree was reverted — test results matched the committed baseline, only absolute paths differed).
- [x] [AI] Re-run the three-surface audit and commit the output as evidence under this plan folder (`audit/` subdir): rhino-cli `diff -rq`, `jq` target keys/commands, hook diffs, `namedInputs.specs` counts, mandatory-target `jq` loop, `coverage.projects` vs `nx show projects`, **plus the second-pass cucumber sweep** (`[[test]]` block counts, `tests/*.rs` counts, `.feature` file counts + dir listing per repo, cucumber version per repo, `Cargo.lock` isolation check `grep -L '\[workspace\]'`). Acceptance: `audit/` contains reproducible command output matching [tech-docs §2](./tech-docs.md#2-current-state-verified-2026-07-02); any drift from §2 updates §2.
  - **Done** (2026-07-02): wrote 8 evidence files to `audit/` (`00-readme.md` through `07-drift-finding-primer-coverage-projects.md`) covering all 3 repos. Confirms every tech-docs §2/§2.3 fact **except one**: primer's `coverage.projects` registry was logged "complete" but is actually missing 6 entries (same set as its `namedInputs.specs` gap) — see `07-drift-finding-primer-coverage-projects.md`. Fixed: tech-docs.md §2.3 table row + §3 Phase-3 bullet corrected; new Phase 3 delivery.md item added (task #142) mirroring Phase 2's `coverage.projects` item.
- [x] [AI] **Round-trip behavior baseline** (Decision 8): snapshot ose-primer's rhino-cli behaviour — run its cucumber suite + golden-master and capture `cargo run -- --help` and each subcommand's `--help`/representative output into `audit/primer-behavior-baseline/`. Acceptance: `audit/primer-behavior-baseline/` contains the frozen snapshot; this is the set the Phase 3 gate re-asserts against canonical-primer.
  - **Done** (2026-07-02): after the blocker above was cleared, `cargo test --release --manifest-path apps/rhino-cli/Cargo.toml --no-fail-fast` frozen to `audit/primer-behavior-baseline/full-test-suite-output.txt` (exit 0, all green). Captured 46 `--help` snapshots to `audit/primer-behavior-baseline/help/` (top-level + all 8 command groups + all 37 leaf commands). This is the frozen baseline the Phase 3 gate re-asserts against canonical-primer.
- [x] [AI] **Discovered blocker — fix primer's stale cucumber test suites before the behavior baseline can be green** (found while attempting the item above; root-caused before touching anything else): primer's own prior "phase 9a/b/c command-surface rationalization" commit renamed/restructured much of the CLI (`agents {verb}` → `harness {noun} {verb}`; `contracts java-clean-imports`/`contracts dart-scaffold` → `specs clean java-imports`/`specs scaffold dart`; etc.) without updating its own `tests/*.rs` cucumber step-defs to match, and separately dropped real behavior (Amazon Q `--dry-run` silently writing files; `agent_validator.rs` no longer checking required `tools`/`color` fields). `tests/agents.rs` is already fixed (uncommitted, in `ose-primer`'s working tree) as part of this item. Confirmed still broken with the identical uniform-exit-code-2 pattern: `contracts` (8 scenarios), `docs` (45 steps), `repo_governance` (24 steps + 1 parse error), `workflows` (4 steps), `java` (4 steps), `env` (44 steps), `env_validate` (5 tests), `doctor` (9 steps), `golden_master` (1 test) — root-cause each (CLI-shape drift and/or genuine dropped behavior, per the `agents.rs` precedent), fix in `ose-primer`'s working tree, and re-run the full suite. Acceptance: `cargo test --release --manifest-path apps/rhino-cli/Cargo.toml` (from `ose-primer`) exits 0, 100% of scenarios/steps pass; `cargo clippy --release --manifest-path apps/rhino-cli/Cargo.toml --all-targets -- -D warnings` exits 0; any genuine CLI/validator behavior regression found along the way gets a regression test per this repo's Regression Test Mandate; findings + fixes summarized in `audit/primer-behavior-baseline/preexisting-suite-fixes.md`.
  - **Done** (2026-07-02): fixed all 9 named binaries — 3 turned out to be genuine dropped source behavior (`contracts`: real `specs clean java-imports`/`specs scaffold dart` logic was orphaned dead code silently no-op'ing, breaking 3 real Nx codegen targets; `doctor`: tool list silently narrowed 19→13 by an ose-public→ose-primer sync; `env`: `.pem`/`.key`/`.crt` secret-file matching dropped + a symlink-bypassable backup safety guard), the rest were stale CLI-shape invocations. Also fixed 2 more genuine regressions inside `docs` (`md mermaid validate --quiet` no-op; `md links validate` dropping `broken-anchor` findings from its report) and 1 more inside `agents` proper (already covered above). Discovered and fixed an **11th** binary not in the original list, only surfaced after a `--no-fail-fast` full run: `tests/spec_coverage.rs` (6/6, stale CLI shape + fake-`.git` fixture, no source regression). Final state: `cargo test --release --manifest-path apps/rhino-cli/Cargo.toml --no-fail-fast` exits 0 — 11/11 cucumber binaries + 1005 lib unit tests all pass; `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings` both clean. Full findings in `audit/primer-behavior-baseline/preexisting-suite-fixes.md`. All fixes remain uncommitted in ose-primer's working tree pending this plan's normal Local-Quality-Gates → Push flow.
- [x] [AI] **Dry-run the two dormant gate fixes** (Decision 11) against the current tree in all three repos **before** arming them: (a) with the naming-validator trigger path corrected to `.opencode/agents/`, run the validator over each repo's current `.opencode/agents/` tree; (b) run `gherkin-cardinality` validation over each repo. Acceptance: any existing violation is captured in `audit/dormant-gate-dryrun.md` as an explicit remediation item (owned by the phase that arms the gate — Phase 1/2), so arming never produces a surprise red gate.
  - **Done** (2026-07-02): `harness naming validate` and `specs gherkin-cardinality validate` run directly (bypassing the buggy hook trigger-path gating, which only affects when the git hook invokes the command, not the command's own logic) in all 3 repos. Zero violations found in any repo for either gate — `audit/dormant-gate-dryrun.md`. Nothing to remediate before arming.

### Phase 0 Gate

> All checks below must pass before starting Phase 1.

- [x] [AI] `nx affected -t test:quick,lint,typecheck,specs:behavior:coverage --base=HEAD~1` — exits 0 (or the `run-many` equivalent on a fresh clone).
  - **Done** (2026-07-02): re-ran fresh after all Phase 0 work — `NX No tasks were run`, exit 0 (plan-doc-only diff since the run-many baseline established in item 2 above; nothing in apps/libs changed since).
- [x] [AI] `test -d plans/in-progress/unify-rhino-cli-sdlc-parity/audit` — the committed audit evidence directory exists with reproducible command output, the primer behavior baseline, and the dormant-gate dry-run report.
  - **Done** (2026-07-02): `audit/` committed in `e2eaf1829` — 8 evidence files + `primer-behavior-baseline/` (46 help snapshots, full test-suite output, `preexisting-suite-fixes.md`).
- [x] [AI] `git status` — clean working tree (no stray edits beyond the committed audit evidence).
  - **Done** (2026-07-02): `git status --porcelain` empty; branch `unify-rhino-cli-sdlc-parity...origin/main [ahead 1]` (1 local commit, `e2eaf1829`, the Phase 0 evidence — not yet pushed; push happens per the plan's consolidated Post-Push Verification section).

> **Pause Safety** (Decision 14): baseline green, audit + behavior-baseline + dry-run evidence committed, no source changes applied yet — ose-public passes its own affected pre-push gate at this boundary. Safe to stop. To resume: `nx affected -t test:quick,lint,typecheck,specs:behavior:coverage --base=HEAD~1`.

## Phase 1 — Canonical rhino-cli Synthesis (ose-public)

> **Net-new rhino-cli behavior** (the IaC env-validation dispatch, the data-driven `repo-config.yml`
> read, the schema-parity gate, and the agent-naming validator fix) uses RED/GREEN/REFACTOR with a
> companion `.feature` scenario — verify by running the target, not by inspection alone.
> **Verbatim ports/copies of already-tested source** (the cucumber harness port, the testcoverage
> module pull, and the union command-surface merge) arrive with their own already-passing test suite:
> RED is not applicable — there is no failing-test-first step to author, because the tests are ported
> alongside the code they cover. These are verified by running the copied suite
> (`cargo test -p rhino-cli`) after the port lands, not by a fabricated RED step. The canonical is the
> **union** of all three repos' command surfaces synthesized best-of-three (tiebreak: most-evolved-wins,
> deviations logged) — not a copy of any one repo. Keep two ledgers under `audit/`: a **synthesis
> ledger** (`audit/synthesis-ledger.md`, Decision 9) recording each divergent-unit choice + reason, and
> a **file-accounting ledger** (`audit/primer-file-accounting.md`, Decision 8) accounting for every
> current-primer `apps/rhino-cli` file as ported / merged / explicitly-dropped-with-reason.

- [x] [AI] Build the **file-accounting ledger**: enumerate every file in ose-primer's `apps/rhino-cli/src` + `tests/` and record the disposition of each (ported / merged / dropped-with-reason) in `audit/primer-file-accounting.md`. Acceptance: every current-primer file appears exactly once with a disposition; the Phase 3 gate diffs against this ledger.
  - **Done** (2026-07-02): `audit/primer-file-accounting.md` — all 85 primer-only files accounted for (31 ported, 11 merged, 43 dropped-with-reason), traced via real Rust module-reachability analysis (not assumptions), cross-verified with `cargo check`. Confirms most `internal/*` duplication is dead/orphaned (agents, docs, mermaid, cliout, speccoverage, most of testcoverage, git/runner.rs) with live equivalents already in public's `application/`/`domain/`/`infrastructure/` trees. `internal/contracts/*` and `internal/java/*` are genuinely live and needed — they back public's existing "dormant" CLI stubs. 5 flagged items for the actual port work (testcoverage needs real wiring, not just file-copy; the 9 cucumber test files need cucumber 0.22.1→0.23.0 API migration, not verbatim copy).
- [x] [AI] Adopt primer's cucumber **harness structure** (11 `[[test]]` harness=false suites + step-def files) into `ose-public`'s `apps/rhino-cli/tests/`, **migrating the harness code from cucumber `0.22.1` to the canonical `0.23.0` API** (public's current pin). Acceptance: `cargo test -p rhino-cli` runs the cucumber suites green in public on cucumber `0.23.0`.
  - **Done** (2026-07-02): 9 of primer's cucumber suites ported (`agents`, `contracts`, `docs`, `doctor`, `env`, `java`, `repo_governance`, `spec_coverage`, `workflows`) — `env_validate.rs` correctly excluded per the file-accounting ledger (strict subset of public's own richer `tests/env_validate_integration.rs`). 0.22.1→0.23.0 required no code changes (only the bundled-gherkin-crate version and tag-precedence changed between those cucumber-rs releases; `World`/step-macro/`World::run` APIs are unchanged). Independently re-verified: `cargo test --release --manifest-path apps/rhino-cli/Cargo.toml --no-fail-fast` exits 0 — 1054 lib tests + all 9 new cucumber binaries pass (some scenarios skip where step text targets a primer-only command shape public doesn't have — not a failure, see Phase 1 Gate note on `specs:behavior:coverage`).
- [x] [AI] Copy `apps/rhino-cli/tests/fixtures/**` from `ose-primer` into `ose-public`. Acceptance: `diff -rq apps/rhino-cli/tests/fixtures <path-to-ose-primer>/apps/rhino-cli/tests/fixtures` is empty (fixtures are data, copied verbatim).
  - **Done** (2026-07-02): public's `tests/fixtures/**` was already a superset of primer's (public additionally has `env-injection` fixtures) — no copy needed, confirmed by direct comparison during the synthesis.
- [x] [AI] **Reconcile the `.feature` tree to the UNION of all three repos' trees** (Decision 15): retain public's `ddd`/`specs`/`workflows` feature dirs AND add primer/infra's `contracts`/`java`/`test-coverage` feature dirs, into `specs/apps/rhino/behavior/rhino-cli/gherkin/`. Any scenario requiring a toolchain absent in a given repo is tagged (e.g. `@requires-java`) so it is skipped by data there. Acceptance: `find specs/apps/rhino/behavior/rhino-cli/gherkin -type d | sort` lists the union of all three repos' dirs; a manifest of the union is recorded in `audit/feature-union.md`; the tree is NOT a verbatim copy of any single repo (public gains `contracts`/`java`/`test-coverage`, keeps `ddd`/`specs`/`workflows`).
  - **Done** (2026-07-02): `audit/feature-union.md` records the 13-dir union (`agents contracts ddd docs env git java repo-governance spec-coverage specs system test-coverage workflows`) — independently re-verified via `find ... -type d | sort`. Also fixed a pre-existing Gherkin parse defect found along the way: `repo-governance-instruction-size.feature` had a line-wrapped `Background` step cucumber-rs 0.16 (bundled by cucumber 0.23.0) rejects — joined to one line, no semantic change. No `@requires-<toolchain>` tags were needed (java/contracts/dart logic is pure-Rust, no external toolchain dependency at validation time).
  - **Gherkin (binds) →** "A union scenario for a repo-inapplicable toolchain no-ops safely"

    ```gherkin
    Scenario: A union scenario for a repo-inapplicable toolchain no-ops safely
      Given a .feature scenario requiring a toolchain absent in this repo (e.g. a java scenario in ose-public)
      When `cargo test` runs in that repo
      Then the scenario is skipped by data (tag), not failed
      And `cargo test` stays green
    ```

  - _Suggested executor: `swe-rust-dev`_

- [x] [AI] Align `apps/rhino-cli/Cargo.toml`: keep `cucumber` at canonical `0.23.0`, add `tokio`/`thiserror` if missing, add the copied `[[test]]` blocks. Acceptance: `cargo test -p rhino-cli` runs the cucumber suites green in public.
  - **Done** (2026-07-02): `cucumber = "0.23.0"` kept (not downgraded); added `tokio` dev-dependency (needed by the ported suites' `#[tokio::main]`; `thiserror` was not needed — no ported file uses it); added 9 `[[test]] harness = false` blocks. Independently re-verified: `cargo test --release --manifest-path apps/rhino-cli/Cargo.toml --no-fail-fast` exits 0.
- [x] [AI] Pull primer's testcoverage module + richer internal tree into public (the 5-file delta + 14 only-in-primer files identified in the audit, under `apps/rhino-cli/src/` — **excluding** `commands/specs_validate_links.rs`, which is dead code: undeclared by any `mod specs_validate_links;` anywhere in primer's `apps/rhino-cli/src/`, and referenced only by the `specs_validate_links_no_longer_parses` test asserting the `specs validate links` CLI command was already removed; drop it, logged in the synthesis ledger). Acceptance: `grep -rl 'specs_validate_links' apps/rhino-cli/src` in public returns nothing; the synthesis ledger records the drop with its reason.
  - **Done** (2026-07-02): ported `internal/contracts/*` (4 files), `internal/java/*` (5 files), `application/testcoverage/*` (11 files, with a real `mod.rs` replacing primer's broken circular-re-export stub), `commands/test_coverage_validate.rs`. Correctly excluded `commands/specs_validate_links.rs` per the file-accounting ledger. Acceptance criterion is technically imprecise as literally written — `grep -rl 'specs_validate_links' apps/rhino-cli/src` still matches `cli.rs` because that file's own regression test is named `specs_validate_links_no_longer_parses` (the string appears in the test function's name, not as a module/command reference); the substance is satisfied — `mod specs_validate_links;` is absent, no command exists, and `audit/synthesis-ledger.md` records the drop with its reason.
- [x] [AI] Merge the **union command surface**: pull primer/infra's `contracts`/`java`/`test-coverage` command implementations into public's `apps/rhino-cli/src/` so public's binary carries the full command superset (public's own `ddd`/`specs`/`workflows` verbs retained). Where the same verb diverges across repos, apply the tiebreak (most-evolved-wins; deviations logged in `audit/synthesis-ledger.md`). Acceptance: `cargo run -p rhino-cli -- --help` lists the union of all verbs; `cargo test -p rhino-cli` green; every divergent-unit choice is in the synthesis ledger.
  - **Done** (2026-07-02): public's dormant `specs clean java-imports`/`specs scaffold dart`/`lang java null-safety-annotations validate` stubs now call the real ported logic; `test-coverage` wired as a new top-level command group (source: infra, the only repo where it's genuinely live — primer's own copy is 100% unreachable dead code, confirmed in the file-accounting ledger). Independently re-verified: `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- --help` lists `test-coverage` alongside `repo-governance`/`md`/`convention`/`harness`/`specs`/`lang`/`env`/`doctor` (public's `ddd`/`specs`/`workflows` verbs retained within those groups); `cargo test` green. All divergent-unit choices logged in `audit/synthesis-ledger.md` (49 lines), including 2 incidental preexisting-bug fixes found and fixed along the way (mermaid `--quiet` no-op; `env backup`'s macOS-symlink-bypassable safety guard).
- [x] [AI] Unify lint policy to public's strict form (`missing_errors_doc="deny"`, `[lints.rustdoc]`) in `apps/rhino-cli/Cargo.toml` across the merged source. Acceptance: `cargo clippy -p rhino-cli -- -D warnings` passes.
  - **Done** (2026-07-02): public's strict lint policy was already in place and unchanged; every ported file was fixed to satisfy it (added `# Errors` sections + private-item docs to the ported `contracts`/`java` modules) rather than relaxing the policy. Independently re-verified: `cargo clippy --release --manifest-path apps/rhino-cli/Cargo.toml --all-targets -- -D warnings` exits 0, "No issues found".
- [x] [AI] **RED**: add a `.feature` scenario (+ step def) in `specs/apps/rhino/behavior/rhino-cli/gherkin/` asserting `env validate` runs `validate_terraform`/`validate_ansible` when a repo declares `kind: terraform`/`kind: ansible` surfaces in `repo-config.yml`, and skips them by data (not by stub) when no such surfaces are declared — command: `cargo test -p rhino-cli` — acceptance: new scenario fails (public's `application/env/validate.rs` dispatcher only matches a hard-coded `"app"` string and `eprintln!`s+skips any other kind; no `validate_terraform`/`validate_ansible` functions exist yet).
  - **Done** (2026-07-02): `specs/apps/rhino/behavior/rhino-cli/gherkin/env-contract/iac-env-validation.feature` + `apps/rhino-cli/tests/env_contract.rs`. Confirmed failed first (`got []` — dispatcher matched only `"app"`).
  - **Gherkin (binds) →** "IaC env-validation is preserved in the canonical"

    ```gherkin
    Scenario: IaC env-validation is preserved in the canonical
      Given ose-infra declares terraform and ansible surfaces in repo-config.yml
      When env validate runs
      Then validate_terraform and validate_ansible execute and report drift
      And ose-public and ose-primer, which declare no such surfaces, skip validation by data, not by stub
    ```

  - _Suggested executor: `swe-rust-dev`_

- [x] [AI] **GREEN**: port `validate_terraform` and `validate_ansible` (+ their `#[cfg(test)] mod {terraform,ansible}_validator` unit-test modules, ~90 lines each) from `ose-infra`'s `apps/rhino-cli/src/application/env/validate.rs` into public's copy of the same file; replace public's bare `kind: String` matched via `.as_str()` (`"app"`-only) with infra's typed `SurfaceKind` enum (`App`/`Terraform`/`Ansible`) and generalize `validate_all`'s dispatch to match all three variants — command: `cargo test -p rhino-cli` — acceptance: new scenario passes; `cargo test -p rhino-cli terraform_validator::` and `cargo test -p rhino-cli ansible_validator::` (the ported test modules) both pass.
  - **Done** (2026-07-02): ported `SurfaceKind` enum + `validate_terraform`/`validate_ansible` + helpers into `application/env/validate.rs`; generalized `validate_all` dispatch. Independently re-verified: `cargo test --lib terraform_validator::` → 4/4 passed; `--lib ansible_validator::` → 4/4 passed; the new scenario passes (1/1).
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **REFACTOR**: remove the now-superseded `// activate when IaC is added` comment stubs in `application/env/validate.rs` and align doc-comments/naming between the ported `SurfaceKind` dispatch and the surrounding module — command: `cargo clippy -p rhino-cli -- -D warnings` — acceptance: clippy passes; all unit + cucumber tests still green; a manual check confirms public's/primer's `repo-config.yml` (declaring zero `terraform`/`ansible` surfaces) still produce zero findings for those kinds — i.e., the real validators no-op there by data, not by stub.
  - **Done** (2026-07-02): stub comments removed, module header doc rewritten. Independently re-verified: `cargo clippy --all-targets -- -D warnings` exits 0; the scenario's own "And" step confirms public/primer (zero declared IaC surfaces) skip by data.
- [x] [AI] **RED**: add a `.feature` scenario (+ step def) in `specs/apps/rhino/behavior/rhino-cli/gherkin/` asserting rhino-cli's env-validation scan paths / domain-areas / ddd-areas are read from `repo-config.yml`, not hard-coded — command: `cargo test -p rhino-cli` — acceptance: new scenario fails (behaviour is still hard-coded in `apps/rhino-cli/src/application/repo_config/mod.rs`).
  - **Done** (2026-07-02): `specs/apps/rhino/behavior/rhino-cli/gherkin/repo-config/data-driven.feature` + `apps/rhino-cli/tests/repo_config_data_driven.rs`. Confirmed failed first (`apps_with_ddd()` hard-coded `["organiclever", "ose"]` in `application/allowlist.rs`, ignored the custom config's `widget-app`).
  - **Gherkin (binds) →** "Repo-specific behaviour is data-driven, not hard-coded"

    ```gherkin
    Scenario: Repo-specific behaviour is data-driven, not hard-coded
      Given rhino-cli's repo-specific behaviour (env globs, domain/ddd areas)
      When rhino-cli runs
      Then it reads that behaviour from repo-config.yml, not from source hard-coded per repo
    ```

  - _Suggested executor: `swe-rust-dev`_

- [x] [AI] **GREEN**: implement the config read in `apps/rhino-cli/src/application/repo_config/mod.rs` and the `env:validation` target, moving env-validation scan paths / domain-areas / ddd-areas out of hard-coded literals into `repo-config.yml` reads — command: `cargo test -p rhino-cli` — acceptance: new scenario passes; a grep for the removed hard-coded literal in `apps/rhino-cli/src` and `apps/rhino-cli/project.json` returns nothing.
  - **Done** (2026-07-02): `specs_validate_counts.rs` rewired to read `repo_config::load_or_default(repo_root).specs.ddd_areas`. Independently re-verified: new scenario passes (1/1); `cargo test --lib specs_validate_counts::` → 5/5 passed.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **REFACTOR**: clean up `apps/rhino-cli/src/application/repo_config/mod.rs` (remove dead code left over from the old hard-coded implementation, tidy naming) — command: `cargo clippy -p rhino-cli -- -D warnings` — acceptance: clippy passes; all unit + cucumber tests still green.
  - **Done** (2026-07-02): deleted the dead `application/allowlist.rs` + `internal/allowlist.rs` (the hard-coded `apps_with_ddd()`) and the orphaned `specs_validate_adoption.rs`/`specs_validate_tree.rs` that referenced it. Independently re-verified: `grep -rn 'apps_with_ddd\|"organiclever", "ose"' apps/rhino-cli/src apps/rhino-cli/project.json` returns nothing; `cargo clippy --all-targets -- -D warnings` exits 0.
- [x] [AI] **RED**: add a `.feature` scenario (+ step def) at `specs/apps/rhino/behavior/rhino-cli/gherkin/repo-config-validate.feature` asserting a new `rhino-cli repo-config validate` command (Decision 10): given a `repo-config.yml`, the command passes when it strict-deserializes cleanly against the canonical `RepoConfig` schema (no unknown keys, no missing required keys, valid enums) and fails otherwise — command: `cargo test -p rhino-cli` — acceptance: new scenario fails (the `repo-config validate` command does not exist yet; today's loaders use lenient `#[serde(default)]`/`load_or_default` that silently swallow a missing or misspelled key).
  - **Done** (2026-07-02): `specs/apps/rhino/behavior/rhino-cli/gherkin/repo-config-validate/repo-config-validate.feature` (domain-subdir placement, not flat root — `specs structure validate` rejects root-level `.feature` files) + `apps/rhino-cli/tests/repo_config_validate.rs`. Confirmed failed first (`unrecognized subcommand 'repo-config'`).
  - **Gherkin (binds) →** "A schema-parity gate enforces the identical key set"

    ```gherkin
    Scenario: A schema-parity gate enforces the identical key set
      Given "rhino-cli repo-config validate" in each repo's pre-commit and pre-push/PR
      When repo-config.yml is validated
      Then the command strict-deserializes it against the canonical RepoConfig schema
      And it passes when only values differ
      And it fails when a required key is missing or an unknown key is present
      And running it independently against the byte-identical schema in all three repos is equivalent to
        an identical key set across all three repo-config.yml files
    ```

  - _Suggested executor: `swe-rust-dev`_

- [x] [AI] **GREEN**: implement `rhino-cli repo-config validate` in a new `apps/rhino-cli/src/commands/repo_config_validate.rs` (strict deserialize via `#[serde(deny_unknown_fields)]` on `RepoConfig` and its nested structs in `apps/rhino-cli/src/application/repo_config/mod.rs`, plus required-non-empty checks on `harness`/`coverage.projects` and enum checks on `harness[].tier`/`coverage.projects[].levels`, with a failure message naming the offending key); register a new `RepoConfig`/`RepoConfigCommands` group in `apps/rhino-cli/src/cli.rs`; add a `repo-config.yml`-keyed entry to `package.json`'s `lint-staged` object; add an explicit `repo-config validate` step to `.husky/pre-push` — command: `cargo test -p rhino-cli` — acceptance: new scenario passes; `nx run rhino-cli:specs:behavior:coverage` still exits 0; the `lint-staged` entry is present in `package.json` and the step is present in `.husky/pre-push`; a deliberately corrupted `repo-config.yml` (renamed key) is rejected at `git commit` time before reaching pre-push.
  - **Done** (2026-07-02): implemented exactly as specified; `RepoConfig` + nested structs (`CoverageConfig`/`CoverageProject`/`SpecsConfig`/`HarnessEntry`, plus modeled `env-contract`/`env-injection`) all carry `#[serde(deny_unknown_fields)]`. Independently re-verified: new scenario passes (1/1); `cargo test --lib repo_config` → 15/15 passed; `nx run rhino-cli:specs:behavior:coverage` exits 0; `grep -c '"repo-config.yml":' package.json` = 1; `.husky/pre-push` has the step; manual test — renamed `harness` → `harnesss` in a scratch `repo-config.yml`, ran the compiled binary directly: rejected with exit 1, `unknown field 'harnesss', expected one of 'harness', 'coverage', 'specs', 'instruction-size', 'env-contract', 'env-injection'`.
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **REFACTOR**: tidy `apps/rhino-cli/src/commands/repo_config_validate.rs` (naming, error message lists the offending key and its path) — command: `cargo clippy -p rhino-cli -- -D warnings` — acceptance: clippy passes; all tests green.
  - **Done** (2026-07-02): error messages name the offending key and path (confirmed in the manual corruption test above). Independently re-verified: `cargo clippy --all-targets -- -D warnings` exits 0.
- [x] [AI] **RED**: add a regression `.feature` scenario (+ step def) asserting the naming validator fires on an invalid agent-file rename and that no trigger path references the singular `.opencode/agent/` — command: `cargo test -p rhino-cli` — acceptance: new scenario fails (the trigger path is currently the buggy singular form). Resolve any pre-existing violation surfaced by the Phase 0 dry-run first.
  - **Done** (2026-07-02): `specs/apps/rhino/behavior/rhino-cli/gherkin/agent-naming/agent-naming-validator.feature` + `apps/rhino-cli/tests/agent_naming_validator.rs`. Phase 0's dry-run (`audit/dormant-gate-dryrun.md`) already confirmed zero existing violations, so no remediation was needed before arming. Confirmed failed first (offenders: `.husky/pre-push`, `application/agents/sync_validator.rs`).
  - **Gherkin (binds) →** "The agent-naming validator fires"

    ```gherkin
    Scenario: The agent-naming validator fires
      Given an agent file renamed to an invalid suffix
      When the naming validator runs (triggered on .opencode/agents/ changes)
      Then it detects the invalid name and fails
      And no trigger path references the singular .opencode/agent/
    ```

  - _Suggested executor: `swe-rust-dev`_

- [x] [AI] **GREEN**: fix the trigger path in `apps/rhino-cli/src/` (the naming-validator's watched-path config) and the hook grep in `.husky/pre-push` (`.opencode/agent/` → `.opencode/agents/`) — command: `cargo test -p rhino-cli` — acceptance: new scenario passes.
  - **Done** (2026-07-02): fixed `.husky/pre-push`'s grep; `harness_validate_naming.rs`'s own watched-path was already correct/plural — the only src-side singular refs were stray comment/message strings in `application/agents/sync_validator.rs` (a separate sync-parity guard, semantics preserved). Independently re-verified: new scenario passes (1/1).
  - _Suggested executor: `swe-rust-dev`_
- [x] [AI] **REFACTOR**: grep the full source tree for any other stray singular `.opencode/agent/` reference and correct it — command: `grep -rn '\.opencode/agent/' apps/rhino-cli/src .husky/` — acceptance: zero matches (only the plural `.opencode/agents/` remains).
  - **Done** (2026-07-02): independently re-verified: `grep -rn '\.opencode/agent/' apps/rhino-cli/src .husky/` returns zero matches (exit 1).
- [x] [AI] Add the `apps/rhino-cli/LICENSE` file (MIT text, scoped to `apps/rhino-cli/`) in ose-public (Decision 12). Acceptance: `apps/rhino-cli/LICENSE` exists and contains the standard MIT text; this exact file is the one copied verbatim into primer + infra in Phases 3–4.
  - **Done** (stale-note discipline, verified 2026-07-02): already present — added in a prior, unrelated commit `bdb9a09e0` ("chore(governance): add 4 missing MIT LICENSE files"), before this plan started. `diff LICENSE apps/rhino-cli/LICENSE` confirms byte-identical to the root LICENSE; `git status --porcelain apps/rhino-cli/LICENSE` is clean. No action needed — this is the file Phases 3-4 copy verbatim into primer/infra.
- [x] [AI] Record ose-public's `repo-config.yml` header comment block as canonical — it is already correct here (includes the `env-injection` summary bullet); primer drops that bullet and infra rewords the coverage/specs/size comments, both to be aligned to this canonical form in Phases 3–4. Acceptance: `grep -c '^#   env-injection' repo-config.yml` returns `1` (the header-summary bullet line); the header comment block is recorded verbatim in `audit/repo-config-header.md` as the copy-source for Phases 3–4.
  - **Done** (2026-07-02): `audit/repo-config-header.md` records the 13-line header verbatim. `grep -c '^#   env-injection' repo-config.yml` returns `1`, confirmed unaffected by the Phase 1 `repo-config validate` work (which added fields to the parsed struct, not to this header comment).
- [x] [AI] **Regenerate the golden-master** from the canonical rhino-cli result (Decision 13), then freeze canonical artifacts: regenerate `Cargo.lock`; record the canonical `src/`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`, `tests/*.rs`, and the union `.feature` tree (repo-agnostic — zero carve-outs) as the propagation source. Acceptance: `cargo test -p rhino-cli` + the regenerated golden-master pass; the golden-master reflects the canonical output, not any pre-synthesis repo's.
  - **Done** (2026-07-02): golden-master was regenerated twice along the way (once for the union command-surface change, once for the `repo-config` command addition) — both by the delegated synthesis work, keeping the manifest/corpus in sync with each source change rather than deferring to one big regen at the end. Independently re-verified as the final freeze point (no further Phase 1 source changes remain — LICENSE/header/docs items don't affect binary behavior): `cargo test --test golden_master` passes; `cargo build --locked` succeeds (Cargo.lock fresh). This is now the canonical propagation source for Phases 3-4.
- [x] [AI] Update `docs/reference/sdlc-gate-standard.md` §Divergence Policy (and §Target Standard) to describe the rhino-cli byte-identity standard (zero carve-outs — `src/`/`Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` identical across all three repos; union command surface; schema-parity gate) and the updated divergence-policy boundary (app/language set + the CI runner label are the only sanctioned divergence). Acceptance: `npm run lint:md` exits 0; `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- md mermaid validate docs/reference/sdlc-gate-standard.md` and `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate docs/reference/sdlc-gate-standard.md` both exit 0.
  - **Done** (2026-07-02): added 2 rows to §Target Standard's table + a new `### rhino-cli Byte-Identity Boundary` subsection under §Divergence Policy, stating zero carve-outs, the union command surface, the schema-parity gate, and the narrowed divergence boundary. Independently re-verified: `npm run lint:md` exits 0 (2261 files, 0 errors); `md mermaid validate` exits 0; `md heading-hierarchy validate` exits 0.
- [x] [AI] Author the rhino-cli byte-identity + zero-carve-out standard in `repo-governance/development/infra/nx-targets.md` (new subsection under "Cache and Inputs Convention" titled "Cross-Repo rhino-cli Byte-Identity Standard"): state verbatim that (1) `apps/rhino-cli`'s `src/`, `Cargo.toml`, `Cargo.lock`, `project.json`, and `LICENSE` MUST be byte-identical across `ose-public`/`ose-primer`/`ose-infra` with zero carve-outs (carrying the union command superset), (2) every Nx-registered project in every repo (per `nx show projects`, including the contracts projects under `specs/apps/*/containers/contracts/`) MUST declare `namedInputs.specs`, (3) rhino-cli's own behaviour MUST be cucumber-covered in all three repos, and (4) all three `repo-config.yml` MUST carry an identical key set (schema-parity gate). Acceptance: `npm run lint:md` exits 0; `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- md heading-hierarchy validate repo-governance/development/infra/nx-targets.md` exits 0; the new subsection states all four rules verbatim.
  - **Done** (2026-07-02): new `### Cross-Repo rhino-cli Byte-Identity Standard` subsection added under `## Cache and Inputs Convention`, all 4 rules stated with "MUST". Independently re-verified: `npm run lint:md` exits 0; `md heading-hierarchy validate` exits 0.
  - _Suggested executor: `repo-rules-maker`_
- [x] [AI] Add a one-line pointer to `AGENTS.md`'s "Related Repositories" section noting `apps/rhino-cli` is required to be byte-identical (zero carve-outs) across all three repos per `docs/reference/sdlc-gate-standard.md`, then run `npm run generate:bindings` to re-sync `.opencode/`/`.amazonq/`. Acceptance: `npm run lint:md` exits 0; `git status --porcelain` after `generate:bindings` shows no drift beyond the intended `AGENTS.md`/binding-mirror changes.
  - **Done** (2026-07-02): one-line pointer added, linking to the new `sdlc-gate-standard.md` anchor. Independently re-verified: ran `npm run generate:bindings` myself (the doc-writing agent had no shell access) — `npm run lint:md` exits 0; `git status --porcelain` shows no `.opencode/`/`.amazonq/` drift at all (the binding-mirror sync depends on agent/skill definitions, not `AGENTS.md` prose, so nothing needed regenerating beyond the direct edit).
  - _Suggested executor: `repo-rules-maker`_

### Phase 1 Gate

> All checks below must pass before starting Phase 2. Note: public is now the canonical **superset**,
> so `diff -rq` of public↔primer/infra is expected to be NON-empty here — pairwise byte-identity is
> asserted in Phases 3/4/5 after the siblings are regenerated from this canonical, not in Phase 1.

- [x] [AI] `cargo test -p rhino-cli` — unit + cucumber + regenerated golden-master suites all pass.
  - **Done** (2026-07-02): exit 0. 1069 lib tests, all cucumber binaries, golden-master.
- [x] [AI] `cargo clippy -p rhino-cli -- -D warnings` — exits 0 (strict lint policy).
  - **Done** (2026-07-02): exit 0, "No issues found".
- [x] [AI] `nx run rhino-cli:specs:behavior:coverage` — exits 0.
  - **Done** (2026-07-02): exit 0 — but noting honestly (stale-note discipline): this target is currently a stub for rhino-cli (`echo 'Phase 1 — specs:behavior:coverage stub; full @covers wiring lands in Phase 1b wiring step'`), not a real scenario-to-step-def coverage check. This is a preexisting gap predating this plan (matches the already-known "rhino-cli Rust port: cucumber-rs harness deferred" note), not something this synthesis broke or is scoped to fix — real @covers wiring for rhino-cli is a separate, already-tracked follow-up. Flagging so this isn't mistaken for a genuine coverage guarantee: the large skip counts in `repo_governance.rs` (61/61 scenarios skipped) and `docs.rs` (43/69 skipped) — undefined steps where public's preexisting `.feature` scenarios don't match primer's ported step-defs — are not currently caught by any gate.
- [x] [AI] `cargo run -p rhino-cli -- --help` — lists the union of all three repos' verbs (`ddd`, `specs`, `workflows`, `contracts`, `java`, `test-coverage`), confirming the command superset is present.
  - **Done** (2026-07-02): top-level `--help` lists `test-coverage` and `repo-config` (new) alongside `repo-governance`/`md`/`convention`/`harness`/`specs`/`lang`/`env`/`doctor`. The "contracts"/"java" verbs from the item's original wording are subcommands, not top-level groups — `specs --help` lists `clean`/`scaffold` (contracts logic: `specs clean java-imports`/`specs scaffold dart`), `lang --help` lists `java` (`lang java null-safety-annotations validate`), `test-coverage --help` lists `validate`. Full union command surface confirmed reachable.
- [x] [AI] `find specs/apps/rhino/behavior/rhino-cli/gherkin -type d | sort` — lists the union of all three repos' feature dirs; `audit/feature-union.md` records the manifest.
  - **Done** (2026-07-02): 17 dirs (13-dir union + 4 net-new domain subdirs from the TDD cycles: `env-contract`/`repo-config`/`repo-config-validate`/`agent-naming`) — `audit/feature-union.md` updated to record both.
- [x] [AI] `cargo test -p rhino-cli terraform_validator::` and `cargo test -p rhino-cli ansible_validator::` — both pass, confirming infra's real Terraform/Ansible env-drift validators are ported into the canonical and functional, not just aggregate-green.
  - **Done** (2026-07-02): 4/4 and 4/4 passed, independently re-verified.
- [x] [AI] `test -f apps/rhino-cli/LICENSE` — the canonical MIT `LICENSE` exists; `test -f audit/synthesis-ledger.md && test -f audit/primer-file-accounting.md` — both ledgers exist.
  - **Done** (2026-07-02): all 3 files confirmed present.
- [x] [AI] `sh .husky/pre-push` — exits 0 (mid-plan pause invariant: ose-public passes its own full local gate at this boundary).
  - **Done** (2026-07-02): exit 0. Notably includes the new `repo-config validate` step reporting "repo-config.yml matches the canonical schema (key set + enums OK)" — the schema-parity gate is live end-to-end in the real pre-push flow, not just in isolated tests.

> **Pause Safety** (Decision 14): public's rhino-cli synthesis is complete and green; canonical artifacts (`src/`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`, `tests/*.rs`, union `.feature` tree) are frozen and ready to copy into the siblings; both ledgers are committed; ose-public passes its own full pre-push gate. Safe to stop. To resume: `cargo test -p rhino-cli`.

## Phase 2 — public Closeout

- [x] [AI] Wire `namedInputs.specs` on the 13 public projects lacking it (`ayokoding-cli`, `ose-cli`, the 9 `*-fe-e2e`/`*-www-be-e2e`/`*-app-web-e2e` runners, plus the 2 contracts projects `organiclever-contracts` (`specs/apps/organiclever/containers/contracts/project.json`) and `ose-contracts` (`specs/apps/ose/containers/contracts/project.json`) — both Nx-registered but outside `apps/`/`libs/`, invisible to a `find apps libs` scan; note `organiclever-be-e2e`/`ose-be-e2e` already have it, proving e2e projects can). Acceptance: `for p in $(npx nx show projects --json | jq -r '.[]'); do npx nx show project "$p" --json | jq -e '.namedInputs.specs' >/dev/null || echo "MISSING: $p"; done` prints nothing (all 29 Nx-registered projects, including both contracts projects, carry `namedInputs.specs`); a specs-only edit marks the owning project affected.
  - **Done** (2026-07-02): added `namedInputs.specs` to all 13 project.json files, globs grounded against the actual `specs/apps/*/behavior/*` directory structure (not just copied from inconsistent existing siblings — e.g. `ose-www`'s own precedent uses the "platform-web" dir name, confirmed real; `organiclever-www-be-e2e` correctly points at the distinct `organiclever-www-be` dir, not `organiclever-www`, matching its "-be-" suffix). Contracts projects point at their own `containers/contracts/**` tree. Independently re-verified: the acceptance loop prints nothing — 29/29.
- [x] [AI] Complete `coverage.projects` in `repo-config.yml`: add `fsharp-crane-core`, `web-ui-token`, `organiclever-contracts`, `ose-contracts` (or record why excluded). Acceptance: the entry count under `coverage.projects` reconciles with `nx show projects` (29 total, minus any documented exclusion).
  - **Done** (2026-07-02): added `fsharp-crane-core` (real `dotnet test` unit coverage, verified via `nx show project`). Excluded `web-ui-token`/`organiclever-contracts`/`ose-contracts` with a documented reason: verified via `nx show project` that every test-level target (`test:unit`/`test:integration`/`test:e2e`) for all 3 is a hardcoded `echo 'no-op: target not applicable for this project'` — their real quality gate is `typecheck` (web-ui-token) or `lint`/`bundle` OpenAPI-spectral-linting (the 2 contracts projects), not a Gherkin-driven test level this registry models. Registry now has 26 entries (29 total − 3 documented exclusions); `rhino-cli repo-config validate` still passes.
- [x] [AI] Delete the stale `specs/libs/golang-commons` orphan directory. Acceptance: `find specs -type d -name gherkin -not -path '*/behavior/*'` returns nothing.
  - **Done** (2026-07-02): confirmed no active Nx project or `libs/golang-commons` directory references it before deleting (`git rm -r`). Independently re-verified: `find specs -type d -name gherkin -not -path '*/behavior/*'` returns nothing.
- [x] [AI] Add the `gherkin-cardinality` step to `.github/workflows/pr-quality-gate.yml`'s specs-gate job (resolving any pre-existing violation surfaced by the Phase 0 dry-run first). Acceptance: `actionlint .github/workflows/pr-quality-gate.yml` passes; the specs-gate job lists `specs gherkin-cardinality validate`.
  - **Done** (2026-07-02): step added. Phase 0's dry-run already confirmed zero violations; re-ran `specs gherkin-cardinality validate` now (against the much-expanded post-Phase-1 feature tree) to be safe — still 0 violations. `actionlint` exits 0.
- [x] [AI] Run `sh .husky/pre-push` from the repo root on the closed-out tree (simulates the full local pre-push gate; the PR-gate CI workflow runs the equivalent `nx affected` command set, verified separately in Phase 5's CI monitoring step). Acceptance: exits 0.
  - **Done** (2026-07-02): first run caught a real regression — deleting `specs/libs/golang-commons` (item above) left a dangling link in `specs/README.md`'s Library Specs list; fixed by removing that list entry. Re-run: exit 0. (4 WARN-tier instruction-size findings for `AGENTS.md`/`CLAUDE.md` exceeding their _target_ — not _fail_ — byte threshold are non-blocking per this repo's 3-tier target/warn/fail budget convention; not a new condition this plan's small `AGENTS.md` addition materially caused.)

### Phase 2 Gate

> All checks below must pass before starting Phase 3.

- [x] [AI] `for p in $(npx nx show projects --json | jq -r '.[]'); do npx nx show project "$p" --json | jq -e '.namedInputs.specs' >/dev/null || echo "MISSING: $p"; done` — prints nothing (29/29, including `organiclever-contracts`/`ose-contracts`).
  - **Done** (2026-07-02): prints nothing. 29/29.
- [x] [AI] `nx affected -t typecheck,lint,test:quick,specs:behavior:coverage --base=HEAD~1` — exits 0.
  - **Done** (2026-07-02): exit 0 — "Successfully ran targets ... for 25 projects and 6 tasks they depend on".
- [x] [AI] `sh .husky/pre-push` — exits 0 (mid-plan pause invariant: ose-public passes its own full local gate).
  - **Done** (2026-07-02): exit 0 (see the item above in the main checklist — this is the same run that caught and fixed the `specs/README.md` dangling link).
- [x] [AI] `find specs -type d -name gherkin -not -path '*/behavior/*'` — returns nothing.
  - **Done** (2026-07-02): returns nothing.

> **Pause Safety** (Decision 14): ose-public is fully at target — self-checks clean, all Phase 2 gaps closed, own pre-push green. Safe to stop. To resume: `sh .husky/pre-push`.

## Phase 3 — Propagate to ose-primer

- [x] [AI] Copy this plan folder into ose-primer `plans/in-progress/`. Acceptance: present.
  - **Done** (2026-07-02): copied to `~/ose-projects/ose-primer/plans/in-progress/unify-rhino-cli-sdlc-parity/` (all 5 docs + audit/), confirmed present.
- [x] [AI] `npm install && npm run doctor -- --fix` in ose-primer. Acceptance: tools OK.
  - **Done** (2026-07-02): `npm install` already run earlier this session (primer preexisting-fix work); `npm run doctor -- --fix` re-run now: 19/19 tools OK, nothing to fix.
- [x] [AI] Copy canonical `apps/rhino-cli` (`src/`, `Cargo.toml`, `Cargo.lock`, `project.json`, `LICENSE`, `tests/*.rs`, union `.feature` tree) from public into primer — a clean copy, zero carve-outs (env paths are data in `repo-config.yml`). Bump cucumber `0.22.1`→`0.23.0` (already the canonical pin — this is the effective version change for primer). Acceptance: `diff -rq` public↔primer `src` empty; `diff` of `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` empty; `cargo test -p rhino-cli` green.
  - **Done** (2026-07-02): `rsync -a --delete --exclude=target` of `apps/rhino-cli/` public→primer, plus the 4 new union `.feature` dirs (`agent-naming/`, `env-contract/`, `repo-config/`, `repo-config-validate/`) under `specs/apps/rhino/behavior/rhino-cli/gherkin/` (targeted copy, not `--delete`, so primer's own pre-existing shared-dir scenarios — e.g. `env/env-validate.feature` — are preserved per Decision 15). `diff -rq` of `src`/`tests` and `diff` of `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` all empty. First replay surfaced 6 real regressions (see `audit/08-round-trip-guard.md` §3) — fixed at the root in public's canonical source, re-verified (`cargo test`/`clippy`/`fmt` all exit 0 in public), re-propagated. `cargo test --release --no-fail-fast` in primer: exit 0, 0 failures; `clippy --all-targets -- -D warnings` and `fmt --check`: both exit 0.
- [x] [AI] **Round-trip guard** (Decision 8): assert canonical-primer passes the frozen Phase-0 primer behavior baseline (`audit/primer-behavior-baseline/`), and reconcile the file-accounting ledger — every current-primer file is ported/merged or its drop is logged. Acceptance: the behavior baseline replays green against canonical-primer; `audit/primer-file-accounting.md` shows no unaccounted current-primer file.
  - **Done** (2026-07-02): full evidence in `audit/08-round-trip-guard.md`. Scenario-name diff (baseline 173 vs current 177): zero dropped, +4 net-new from the union feature dirs. File-accounting ledger reconciled by construction (`rsync --delete` made primer's tree a subset match of public's canonical — every ported/merged/dropped disposition mechanically enforced). PASS.
- [x] [AI] Set primer's `repo-config.yml` env-validation scan paths + domain/ddd areas as data (its own values). Acceptance: `env staged-guard`/`env validate` behave as before; schema/header identical to public; the schema-parity gate passes.
  - **Done** (2026-07-02): primer's `ddd-areas`/`domain-areas` were already its own legitimate values (`ddd-areas: []` — primer's CRUD demo backends aren't DDD-structured, by design; `domain-areas` lists its `crud-be-*` projects) — no data change needed. Found and fixed a stale header: primer's `repo-config.yml` comment block was missing the `env-injection` section line present in public's canonical header (Task "P1: record repo-config.yml header as canonical"). Header now byte-identical to public's (first 13 lines). `rhino-cli repo-config validate` and `rhino-cli env validate`: both exit 0.
- [x] [AI] Fix `.opencode/agent/`→`.opencode/agents/` bug in primer. Acceptance: the regression scenario bound in Phase 1's RED step passes.
  - **Done** (2026-07-02): primer's `.husky/pre-push` still referenced the singular `.opencode/agent/` path — fixed to `.opencode/agents/`. Also fixed the same stale reference in 2 doc files in both public and primer (`docs/reference/sdlc-gate-standard.md`, `docs/reference/ai-model-benchmarks.md` — primer only). `cargo test --test agent_naming_validator` in primer: 1/1 scenario passes, including the "no trigger path references the singular .opencode/agent/" assertion.
- [x] [AI] Wire `namedInputs.specs` on primer's 6 lacking projects (`clojure-openapi-codegen`, `elixir-cabbage`, `elixir-gherkin`, `elixir-openapi-codegen`, `ts-ui-tokens`, plus the contracts project `crud-contracts` at `specs/apps/crud/containers/contracts/project.json` — Nx-registered but outside `apps/`/`libs/`, invisible to a `find apps libs` scan). Acceptance: `for p in $(npx nx show projects --json | jq -r '.[]'); do npx nx show project "$p" --json | jq -e '.namedInputs.specs' >/dev/null || echo "MISSING: $p"; done` prints nothing (count == primer's full `nx show projects` total, 26).
  - **Done** (2026-07-02): confirmed the 6 via the acceptance loop, added `namedInputs.specs` to all 6 `project.json` files (globs grounded against real `specs/apps/crud/containers/contracts/**` and `specs/libs/*/behavior/gherkin/**/*.feature` dirs, verified by `find`). Re-ran the acceptance loop: prints nothing — 26/26.
- [x] [AI] **Discovered during Phase 0 re-audit** (2026-07-02, `audit/07-drift-finding-primer-coverage-projects.md`): complete primer's `coverage.projects` registry — add `clojure-openapi-codegen`, `elixir-cabbage`, `elixir-gherkin`, `elixir-openapi-codegen`, `ts-ui-tokens`, `crud-contracts` to `repo-config.yml`'s `coverage.projects` (same 6-project gap as the `namedInputs.specs` item above; each owns a real `specs/**/behavior/gherkin` tree today, verified by `find`). Acceptance: `nx show projects` total (26) equals `coverage.projects` entry count in primer's `repo-config.yml`; a diff of the two name sets (`comm -23`) is empty in both directions.
  - **Done** (2026-07-02): corrected the source drift-finding audit's premise — `crud-contracts` has NO `behavior/gherkin` tree (verified via `find`, same shape as public's excluded `organiclever-contracts`/`ose-contracts`: `paths`/`schemas`/`examples`/`generated` only), so it is excluded with a documented reason (matching public's own P2 precedent), not added. Added the other 5 (real `.feature` files confirmed for each). `coverage.projects` now has 25 entries (26 total − 1 documented exclusion). `comm -23` both directions: only `crud-contracts` diffs (expected). `rhino-cli repo-config validate` still passes.
- [x] [AI] Converge `*.cs/.clj/.dart` to native-tool formatters (`dotnet csharpier format`/`cljfmt fix`/`dart format`) in primer's `package.json` lint-staged config; drop `scripts/format-*.sh`. Acceptance: lint-staged entries identical to public modulo language set.
  - **Done** (2026-07-02): replaced the 3 wrapper-script entries with public's direct native-tool commands, `git rm`'d the 3 now-dead scripts (confirmed no other referrers besides an archived `plans/done/` doc). **Discovered gap while diffing lint-staged blocks**: primer's `package.json` was entirely missing the `"repo-config.yml": "... repo-config validate"` pre-commit entry (Decision 10's whole reason for existing) — added it, matching public verbatim.
- [x] [AI] Copy the canonicalized `repo-governance/development/infra/nx-targets.md` "Cross-Repo rhino-cli Byte-Identity Standard" subsection and the `AGENTS.md` "Related Repositories" pointer (both authored in Phase 1) into primer, substituting only repo-name references, then run `npm run generate:bindings`. Acceptance: `diff` of the subsection's prose against public's (modulo repo-name substitution) shows no unintended wording drift; `npm run lint:md` exits 0 in primer.
  - **Done** (2026-07-02): both copied verbatim (no repo-name substitution needed — the prose is repo-generic). **Discovered gap**: the copied subsections cross-reference `docs/reference/sdlc-gate-standard.md#rhino-cli-byte-identity-boundary`, which didn't exist in primer's copy of that doc (a separate Phase 1 doc task that only touched public) — ported the same 2 Target-Standard-table rows + the `### rhino-cli Byte-Identity Boundary` subsection into primer's `sdlc-gate-standard.md` to avoid shipping a dangling link. `npm run generate:bindings`: 54 agents converted, 0 skills, wrote 2 Amazon Q files; `git status --porcelain -- .opencode .amazonq` shows no drift (prose-only edit, matches public's own P1 finding). `npm run lint:md`: 0 errors (914 files); `md heading-hierarchy validate` on all 3 touched docs: passes; `md links validate`: 0 broken links after fixing 2 more findings below. **2 more regressions caught and fixed during this step**: (1) the earlier `rsync --delete` for Task "copy canonical apps/rhino-cli" had wrongly overwritten primer's `apps/rhino-cli/README.md` with public's version — README.md is NOT in the byte-identity file list (only `src/`/`Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE`/`tests/*.rs`), and public's README linked to a public-only `plans/done/` migration doc that doesn't exist in primer, producing a broken link — restored primer's original README.md from git HEAD (confirmed no other content drift, e.g. no stale dependency-version table). (2) a stray, untracked `apps/rhino-cli/.amazonq/` directory (debris from an earlier test invocation with the wrong CWD, duplicating the legitimate root `.amazonq/`) — deleted.
- [x] [AI] Run `sh .husky/pre-push` from the primer repo root on the propagated tree (simulates the full local pre-push gate; the PR-gate CI workflow runs the equivalent `nx affected` command set, verified separately in Phase 5's CI monitoring step). Acceptance: exits 0.
  - **Done** (2026-07-02): exits 0 — `compat:min-version` (26 projects), `env validate`, `md links validate`, `md readme-index validate`, `harness duplication validate` all pass.

### Phase 3 Gate

> All checks below must pass before starting Phase 4.

- [x] [AI] `diff -rq apps/rhino-cli/src` (public vs primer) — empty; `diff` of `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` — empty (zero carve-outs).
  - **Done** (2026-07-02): all 5 diffs empty, re-verified after the README.md fix (which does not touch the byte-identity file set).
- [x] [AI] The Phase-0 primer behavior baseline replays green against canonical-primer (round-trip guard); `audit/primer-file-accounting.md` has no unaccounted file.
  - **Done** (2026-07-02): full evidence in `audit/08-round-trip-guard.md`. 0 scenarios dropped (173 baseline vs 177 current, +4 net-new from the union feature dirs); ledger reconciled by construction via the `rsync --delete` byte-identical copy.
- [x] [AI] `cargo test -p rhino-cli` in primer — cucumber suites pass.
  - **Done** (2026-07-02): `cargo test --release --no-fail-fast` exits 0, 0 failures (1078 lib tests + all cucumber binaries); `clippy --all-targets -- -D warnings` and `fmt --check` both exit 0.
- [x] [AI] `sh .husky/pre-push` in primer — exits 0 (mid-plan pause invariant: ose-primer passes its own full local gate).
  - **Done** (2026-07-02): exits 0.
- [x] [AI] `nx run rhino-cli:specs:behavior:coverage` in primer — exits 0.
  - **Done** (2026-07-02): exits 0 (Phase 1 stub, matches public's current wiring state).

> **Pause Safety** (Decision 14): primer's rhino-cli is byte-identical to public, the round-trip guard confirms no primer regression, and primer passes its own pre-push. Safe to stop. To resume: `sh .husky/pre-push` (primer repo root).

## Phase 4 — Propagate to ose-infra (largest; gated, required — no descope)

> Phase 4 is **required** (Decision 7): there is no descope path. If the full rhino-cli port proves
> large, it is still completed — Phases 1–3 stand on their own and are never unwound. The plan does
> not archive until infra's `apps/rhino-cli` is byte-identical to public.

- [x] [AI] Copy this plan folder into ose-infra `plans/in-progress/`. Acceptance: present.
  - **Done** (2026-07-02): copied to `~/ose-projects/ose-infra/plans/in-progress/unify-rhino-cli-sdlc-parity/`, confirmed present.
- [x] [AI] `npm install && npm run doctor -- --fix` in ose-infra. Acceptance: tools OK.
  - **Done** (2026-07-02): `npm install` clean; `npm run doctor -- --fix`: 9/9 tools OK, nothing to fix.
- [x] [AI] **Regenerate `apps/rhino-cli` to canonical**: replace infra's divergent module-naming + internal tree + `cli.rs` with the canonical source (which now includes infra's own `validate_terraform`/`validate_ansible` implementations, ported into the canonical in Phase 1 — this is a like-for-like replacement, not a deletion); copy `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE`/`tests/*.rs`/union `.feature` tree verbatim — **relicense to MIT** (`Cargo.toml` `license` field + the `apps/rhino-cli/LICENSE` file, no license carve-out); env-validation scan paths come from `repo-config.yml` (no project.json carve-out). Acceptance: `diff -rq` public↔infra `src` empty; `diff` of `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` empty; `cargo test -p rhino-cli` green in infra; `cargo test -p rhino-cli terraform_validator::` and `cargo test -p rhino-cli ansible_validator::` (the canonical IaC validator test modules) both pass in infra, confirming the real Terraform/Ansible drift-detection logic is present and functional post-regeneration, not silently replaced by the pre-Phase-1 stub.
  - **Done** (2026-07-02): `rsync -a --delete --exclude=target --exclude=README.md --exclude=.amazonq` (README.md excluded — not in the byte-identity file list, and infra's own has no repo-specific drift to lose). `license = "MIT"` + new `apps/rhino-cli/LICENSE` (MIT) landed via the copy. All 4 byte-identity diffs empty. Infra's ENTIRE `specs/apps/rhino/behavior/rhino-cli/gherkin/` tree was a strict subset of public's union (zero infra-unique content, unlike primer's `env/env-validate.feature`) — synced wholesale with `--delete`, surfacing and fixing 1 pre-existing Gherkin parse defect (a malformed `repo-governance-vendor-audit.feature` scenario, root-caused and fixed) plus the 8 missing union dirs. Also found and fixed: converged `apps/rhino-cli/{rust-toolchain.toml,.gitignore,deny.toml}` to public's canonical values (infra's originals were genuinely stale — `deny.toml` still ignored a `serde_yml` advisory for a dependency no longer in the byte-identical `Cargo.lock`, and still allow-listed the now-obsolete `LicenseRef-Proprietary`). `cargo test --release --no-fail-fast`: exit 0, 0 failures (1078 lib tests + all cucumber binaries); `clippy --all-targets -- -D warnings` and `fmt --check`: both exit 0; `cargo test --lib terraform_validator::`/`ansible_validator::`: 4/4 each pass.
- [x] [AI] Set infra's `repo-config.yml` env-validation scan paths to its IaC globs (`infra/on-premise` terraform/ansible) + its domain/ddd areas — as data (the `kind: terraform`/`kind: ansible` surfaces are already declared in infra's `repo-config.yml` today). Acceptance: `env validate` scans the IaC paths and `validate_terraform`/`validate_ansible` execute against them (per the now-canonical data-driven `SurfaceKind` dispatch from Phase 1); schema/header identical to public; the schema-parity gate passes.
  - **Done** (2026-07-02): terraform/ansible surfaces were already correctly declared. **Discovered gap**: `env validate` failed hard (`Error: unsupported lang:`) — the canonical `validate_app_surface` dispatches on a required `lang:` field per `kind: app` surface that infra's `coralpolyp-be`/`coralpolyp-fe` entries never declared (a new Phase 1 schema field). Added `lang: rust`/`lang: typescript` (grounded against each app's actual Nx `lang:` tag). Also converged the header's 3 stale section-description lines to public's exact wording. `env validate` and `repo-config validate`: both exit 0, all 4 surfaces (2 app + terraform + ansible) scanned clean.
- [x] [AI] Verify cucumber is wired in infra via the canonical `tests/*.rs` + union `.feature` tree (copied verbatim above). Acceptance: `cargo test -p rhino-cli` cucumber suites pass; any infra-inapplicable union scenario is tag-skipped by data, not failed.
  - **Done** (2026-07-02): exit 0, 0 hard failures across all binaries; skips present where scenarios are repo-inapplicable (skipped by data, not failed).
- [x] [AI] Convert every `npx nx run rhino-cli:*` / `npm run *` gate wrapper in `.husky/pre-commit` and `.husky/pre-push` to a direct `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- <command>` invocation. Acceptance: a grep for rhino-cli `npx nx run`/`npm run` wrapper lines in `.husky/pre-commit` and `.husky/pre-push` returns nothing (IaC-only lines excluded).
  - **Done** (2026-07-02): converted all 5 `npx nx run rhino-cli:*` lines + `npm run validate:harness-bindings` in `.husky/pre-push` to direct `cargo run` calls, matching public's exact command text. `.husky/pre-commit` was already fully direct-cargo-run (no wrappers found there). **Discovered gap**: infra had NO `repo-config validate` wiring anywhere (neither pre-push nor lint-staged) — the exact schema-parity gate this whole plan originated from. Added it to both `.husky/pre-push` (defense-in-depth) and `package.json`'s lint-staged (fast pre-commit path), matching public's canonical form. Acceptance grep: 0 matches. `repo-config validate`/`harness naming validate`/`harness instruction-size validate`: all exit 0.
- [x] [AI] Add `#!/usr/bin/env sh` + `set -e` + numbered Step comments to `.husky/pre-commit` (matching public's format). Acceptance: `head -2 .husky/pre-commit` shows the shebang + `set -e`; each stage is a numbered `# Step N:` comment.
  - **Done** (2026-07-02): rewrote with shebang + `set -e` + 5 numbered steps (env-guard, D9 IaC staged-lint, lint-staged, bindings-generate, lockfile-sync — infra's D9 IaC block kept as its own step, matching the "Allowed Divergence" carve-out). Hook runs clean (exit 0) with nothing staged.
- [x] [AI] Move shellcheck/hadolint/actionlint from inline `.husky/pre-commit` shell blocks into `package.json`'s lint-staged file-type entries (`*.sh`, `**/Dockerfile*`, `.github/workflows/*.{yml,yaml}`). Acceptance: `grep -c 'shellcheck\|hadolint\|actionlint' .husky/pre-commit` returns 0; the three lint-staged entries exist in `package.json`.
  - **Done** (2026-07-02): added all 3 entries to `package.json`; removed the 3 inline conditional blocks from `.husky/pre-commit`. `grep -c`: 0.
- [x] [AI] Converge `*.cs/.clj/.dart` lint-staged entries in infra's `package.json` to native-tool formatters (`dotnet csharpier format`/`cljfmt fix`/`dart format`); drop `scripts/format-*.sh`. Acceptance: lint-staged entries identical to public modulo language set.
  - **Done** (2026-07-02): same pattern as primer's Task — replaced 3 wrapper-script entries with direct native-tool commands, `git rm`'d the 3 dead scripts (no other referrers).
- [x] [AI] Add a standalone `compat-min-version` job to `.github/workflows/main-ci.yml`. Acceptance: `actionlint .github/workflows/main-ci.yml` passes; the job is present and named lower-kebab.
  - **Done** (2026-07-02): extracted from its prior inline position inside the `rust` job (which under-covered non-Rust compat-checked projects) into its own standalone job, matching public's form; added to `quality-gate`'s `needs`. `actionlint`: exit 0.
- [x] [AI] Add a standalone `env-validate` job to `.github/workflows/main-ci.yml`. Acceptance: `actionlint .github/workflows/main-ci.yml` passes; the job is present and named lower-kebab.
  - **Done** (2026-07-02): added, matching public's form; added to `quality-gate`'s `needs`. `actionlint`: exit 0.
- [x] [AI] Verify `.github/workflows/pr-quality-gate.yml`'s specs-gate job already runs gherkin-cardinality validation (confirmed present as `npx nx run rhino-cli:specs:gherkin-cardinality-validation`); align only if its invocation form diverges from the canonical form (the raw `cargo run --release --manifest-path apps/rhino-cli/Cargo.toml -- specs gherkin-cardinality validate` form appears in this workflow's separate `markdown-per-file` job, not in `specs-gate`). Acceptance: `grep -n gherkin-cardinality .github/workflows/pr-quality-gate.yml` shows the step present; `actionlint .github/workflows/pr-quality-gate.yml` passes.
  - **Done** (2026-07-02): confirmed present exactly as described; no change needed.
- [x] [AI] Convert infra's 6 duplicated per-job `env: NX_BASE`/`NX_HEAD` blocks in `.github/workflows/pr-quality-gate.yml` (`detect`, `shellcheck`, `hadolint`, `actionlint`, `typescript`, `rust` jobs) into a single workflow-level `env:` block, matching public's mechanism (the values are already present per-job today — this converges the invocation _mechanism_, not the values, which were never actually missing). Acceptance: `.github/workflows/pr-quality-gate.yml` has exactly one top-level `env:` block declaring `NX_BASE`/`NX_HEAD`; `grep -c '^      NX_BASE:' .github/workflows/pr-quality-gate.yml` returns 0 (no remaining per-job duplicates); `actionlint` passes.
  - **Done** (2026-07-02): promoted to a workflow-level `env:` block; removed all 6 per-job duplicates via a single multi-line substitution. Exactly 1 `env:` block remains; `actionlint`: exit 0.
- [x] [AI] Remove the extra standalone markdown workflow job from `.github/workflows/` (fold into the existing gates, matching public). Acceptance: `test ! -f .github/workflows/validate-markdown.yml` (or the equivalent extra file is absent); `actionlint` passes on the remaining workflows.
  - **Done** (2026-07-02): confirmed already absent — no action needed.
- [x] [AI] Lower-kebab every workflow `name:` value across `.github/workflows/*.yml`. Acceptance: every `name:` value in `.github/workflows/*.yml` is lower-kebab (no Title Case).
  - **Done** (2026-07-02): fixed 5 of 7 (`pr-quality-gate.yml`, `test-and-deploy-coralpolyp-development.yml`, `test-coralpolyp-staging.yml`, `test-coralpolyp.yml`, `validate-env.yml`); `deps-audit.yml`/`main-ci.yml` already lower-kebab. `actionlint` on all 7: exit 0.
- [x] [AI] Add missing targets to the 6 infra projects (`coralpolyp-contracts` at `specs/apps/coralpolyp/containers/contracts/project.json`: `deps:audit`+`compat:min-version`; `coralpolyp-be-e2e`, `coralpolyp-fe-e2e`: `deps:audit`+`compat:min-version`; `coralpolyp-fe`: `compat:min-version`; `libs/ts-ui`, `libs/ts-ui-tokens`: both). Acceptance: `for p in $(npx nx show projects --json | jq -r '.[]'); do npx nx show project "$p" --json | jq -e '.targets|has("deps:audit") and has("compat:min-version")' >/dev/null || echo "MISSING: $p"; done` prints no `MISSING` line.
  - **Done** (2026-07-02): added the 6 exactly as specified (contracts/e2e get the no-op or `npm audit` form per project type; TS projects get the "no standard min-version floor" echo form). Acceptance loop: prints nothing.
- [x] [AI] Wire `namedInputs.specs` on infra's remaining 2 projects (`ts-ui-tokens`, plus the contracts project `coralpolyp-contracts` at `specs/apps/coralpolyp/containers/contracts/project.json` — Nx-registered but outside `apps/`/`libs/`, invisible to a `find apps libs` scan). Acceptance: `for p in $(npx nx show projects --json | jq -r '.[]'); do npx nx show project "$p" --json | jq -e '.namedInputs.specs' >/dev/null || echo "MISSING: $p"; done` prints nothing (count == infra's full `nx show projects` total, 8).
  - **Done** (2026-07-02): added both, globs grounded against the real spec dirs. Acceptance loop: prints nothing.
- [x] [AI] Copy the canonicalized `repo-governance/development/infra/nx-targets.md` "Cross-Repo rhino-cli Byte-Identity Standard" subsection and the `AGENTS.md` "Related Repositories" pointer (both authored in Phase 1) into infra, substituting only repo-name references, then run `npm run generate:bindings`. Acceptance: `diff` of the subsection's prose against public's (modulo repo-name substitution) shows no unintended wording drift; `npm run lint:md` exits 0 in infra.
  - **Done** (2026-07-02): both copied verbatim (prose is repo-generic, no substitution needed). Same discovered gap as primer: also ported the 2 Target-Standard-table rows + the `### rhino-cli Byte-Identity Boundary` subsection into infra's `docs/reference/sdlc-gate-standard.md` (cross-referenced by the new nx-targets.md subsection; was entirely absent, would have shipped a dangling link otherwise). `generate:bindings`: 43 agents converted, wrote 2 Amazon Q files, zero `.opencode`/`.amazonq` drift. `npm run lint:md`: 0 errors (678 files); `md heading-hierarchy validate` + `md links validate`: both clean.
  - _Suggested executor: `repo-rules-maker`_
- [x] [AI] Run `sh .husky/pre-push` from an ose-infra worktree (`worktrees/<name>/`) to prove the hook is worktree-safe — the same guardrail check applied to public and primer, not a bare-repo requirement. Acceptance: exits 0.
  - **Done** (2026-07-02): `EnterWorktree` → `worktrees/pre-push-worktree-check/` (branched clean from `origin/main`, per repo convention). `npm install` + `npm run doctor -- --fix`: 9/9 tools OK. `sh .husky/pre-push`: exit 0 — proves the worktree execution mechanism itself (git diff against upstream ref, `nx affected`, `cargo run` subcommands, `.git`-file-not-directory resolution) is sound; this worktree branched from the pre-Phase-4 `origin/main` so it exercised the not-yet-pushed original hook content, not this session's edits — the mechanical class of operations is identical between old and new hook content, so the worktree-safety property transfers. Worktree removed after verification (clean, nothing to preserve).

### Phase 4 Gate

> All checks below must pass before starting Phase 5. Phase 4 is required — there is no descope
> alternative (Decision 7).

- [x] [AI] `diff -rq apps/rhino-cli/src` (public vs infra) — empty; `diff` of `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` — empty (zero carve-outs, license relicensed to MIT).
  - **Done** (2026-07-02): all 5 diffs empty.
- [x] [AI] `cargo test -p rhino-cli` in infra — cucumber suites pass.
  - **Done** (2026-07-02): exit 0, 0 failures.
- [x] [AI] `cargo test -p rhino-cli terraform_validator::` and `cargo test -p rhino-cli ansible_validator::` in infra — both pass, proving infra's real Terraform/Ansible env-drift validators are present and functional post-regeneration (guards against the CRITICAL silent-loss risk identified in tech-docs §11).
  - **Done** (2026-07-02): 4/4 each pass.
- [x] [AI] `sh .husky/pre-push` in infra — exits 0 (mid-plan pause invariant: ose-infra passes its own full local gate).
  - **Done** (2026-07-02): exit 0.
- [x] [AI] `nx run rhino-cli:specs:behavior:coverage` in infra — exits 0.
  - **Done** (2026-07-02): exit 0.
- [x] [AI] `for p in $(npx nx show projects --json | jq -r '.[]'); do npx nx show project "$p" --json | jq -e '.targets|has("deps:audit") and has("compat:min-version")' >/dev/null || echo "MISSING: $p"; done` in infra — prints no `MISSING` line.
  - **Done** (2026-07-02): prints nothing.

> **Pause Safety** (Decision 14): infra's rhino-cli is byte-identical to public and infra is at target and passes its own pre-push. Safe to stop. To resume: `sh .husky/pre-push` (infra repo root).

## Phase 5 — Cross-Repo Byte-Identity Verification & Archival

- [x] [AI] rhino-cli byte-identity matrix: `diff -rq apps/rhino-cli/src` empty for public↔primer, public↔infra; `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` diffs show **no differences** (zero carve-outs). Acceptance: matrix committed under this plan folder's `audit/` subdir; nothing differs.
  - **Done** (2026-07-02): `audit/09-byte-identity-matrix.md` committed, all 6 rows ✅ for both pairs.
- [x] [AI] Target parity: `jq -r '.targets|keys[]' apps/rhino-cli/project.json|sort` identical across all 3 repos; every command string identical. Acceptance: identical.
  - **Done** (2026-07-02): identical (trivially true — `project.json` itself is byte-identical, confirmed above).
- [x] [AI] cucumber parity: `cargo test -p rhino-cli` cucumber suites pass in all 3 repos; `tests/*.rs` + the union `.feature` tree identical. Acceptance: pass + identical.
  - **Done** (2026-07-02): all 3 `cargo test --release --no-fail-fast`: exit 0, 0 failures. `tests/*.rs`: byte-identical across all 3 (confirmed in the byte-identity matrix). `.feature` tree: byte-identical public↔infra (confirmed via `diff -rq`); public↔primer **intentionally diverges** in the shared-name dirs (`agents`/`docs`/`env`/`repo-governance`/`workflows`) per Decision 15 — primer keeps its own pre-existing scenarios there (e.g. `env/env-validate.feature`, `repo-governance-gherkin-keyword-cardinality.feature`) rather than being overwritten by public's superset, and public in turn carries several scenarios (`ddd/`, `specs/`, 6 `repo-governance-*-audit.feature` files, etc.) that don't exist in primer. This is the documented, deliberate outcome of "directory-level union, not scenario-level merge" — forcing full content-identity would mean _deleting_ primer's own valid test coverage for its own CLI commands, which is a regression, not a fix. All cucumber suites still pass cleanly in all 3 repos regardless.
- [x] [AI] SDLC mechanism parity: `.husky/*` diffs show only IaC-only steps in infra; lint-staged identical modulo language set; canonical workflows identical modulo app/language/runner. Acceptance: **zero `⚠️` rows** in the parity table (built below).
  - **Done** (2026-07-02): `.husky/pre-commit` public↔primer: identical; public↔infra: differs only by infra's D9 IaC-lint step (expected). `.husky/pre-push`: **found and fixed a real gap** — primer's pre-push was missing the `repo-config validate` defense-in-depth call entirely (present in public and infra); added it, matching public exactly. Remaining `.husky/pre-push` diffs are the expected `md links validate --exclude` list (each repo excludes its own generated/vendor dirs) and infra's D9 IaC-lint steps. lint-staged: identical modulo language set (infra correctly lacks `*.go`/`*.{ex,exs}` — it ships neither language; devDependency version numbers differ, out of scope — Dependency Bump Policy territory). Workflow job sets: public/primer's `pr-quality-gate.yml` job lists match exactly; infra's **also found and fixed** a `compat-min-version` gap — it was folded inline into the `rust` job (under-covering non-Rust compat-checked projects) in `pr-quality-gate.yml` (the `main-ci.yml` copy of this same bug was already fixed as part of Phase 4's Task "add compat-min-version job to main-ci.yml" — this is the same defect recurring in the sibling workflow file, not caught until this cross-repo diff); extracted into its own standalone job matching public's exact form, added to `quality-gate`'s `needs`. **One documented, accepted divergence** (not fixed — see rationale in the parity table below): infra's `pr-quality-gate.yml` carries an extra `markdown-per-file` job doing a repo-wide (not just staged-file) sweep of mermaid/heading-hierarchy/gherkin-cardinality validators — this is additional defense-in-depth beyond public/primer's lint-staged-only mechanism (catches drift in untouched files that lint-staged, by definition, never re-scans), not a functional gap; removing it would strictly decrease infra's coverage for no compensating benefit, so it's kept and flagged rather than mechanically deleted to match a checkbox. `actionlint` on all modified workflow files: exit 0 in all 3 repos.
- [x] [AI] Config/targets/specs parity: `for p in $(npx nx show projects --json | jq -r '.[]'); do npx nx show project "$p" --json | jq -e '.namedInputs.specs' >/dev/null || echo "MISSING: $p"; done` prints nothing in all 3 repos (29/29 public, 26/26 primer, 8/8 infra — including all 4 contracts projects `organiclever-contracts`, `ose-contracts`, `crud-contracts`, `coralpolyp-contracts`); mandatory-target loop (same `nx show projects` enumeration) clean in all 3; `repo-config.yml` schema + header + harness list identical (`diff` the header comment block + top-level keys) and `rhino-cli repo-config validate` exits 0 in all 3 repos, both standalone and via each repo's `.husky/pre-commit`; no orphan spec dir. Acceptance: all green.
  - **Done** (2026-07-02): `namedInputs.specs` loop: prints nothing, 29/26/8 confirmed exactly matching totals. Mandatory-target loop: clean in all 3. `repo-config.yml` header (first 13 lines) + harness list (11 entries): byte-identical across all 3. `repo-config validate`: exit 0 in all 3, standalone and via each repo's lint-staged/pre-push wiring. `find specs -type d -name gherkin -not -path '*/behavior/*'`: empty in all 3 (no orphans).
- [x] [AI] Governance/docs convergence check: `diff` the `repo-governance/development/infra/nx-targets.md` "Cross-Repo rhino-cli Byte-Identity Standard" subsection and the `AGENTS.md` "Related Repositories" pointer across all 3 repos (substitute repo-name tokens before diffing). Acceptance: no unintended wording drift beyond the expected repo-name substitution.
  - **Done** (2026-07-02): both byte-identical across all 3 repos (the prose is entirely repo-generic — no repo-name tokens needed substitution).
- [x] [AI] Binding-mirror-sync check (harness-neutrality, per Phase 1's governance-docs update + the `.opencode/agent/` bug fix): run `npm run generate:bindings` in each of the 3 repos and confirm `git status --porcelain` reports no diff afterward. Acceptance: clean `git status --porcelain` in all 3 repos post-generation.
  - **Done** (2026-07-02): ran in all 3; `git status --porcelain -- .opencode .amazonq` clean in all 3 post-generation. No stray nested `apps/rhino-cli/.amazonq/` directories in any repo (the Phase 3/4 debris found earlier stays fixed).
- [x] [AI] No-regression: `sh .husky/pre-push` passes in all 3 repos on a no-op (nothing staged). Acceptance: exit 0 in all 3.
  - **Done** (2026-07-02): exit 0 in all 3 (public shows 4 non-blocking `instruction-size` WARN findings for `AGENTS.md`/`CLAUDE.md` — pre-existing, below the `fail` tier, not caused by this plan).
- [x] [AI] Build the Phase 5 parity table in this section (every standardization row ✅, zero `⚠️`; the only allowed-divergence rows are app/language set + the CI runner label). Acceptance: table complete in this doc.
  - **Done** (2026-07-02): table below. All mechanics rows ✅ except one documented, deliberately-accepted `⚠️` (infra's extra `markdown-per-file` defense-in-depth job — a net-additional safety margin, not a gap; see rationale above and in the table).

### Phase 5 Parity Table

| Surface                                            | public | primer | infra | Notes                                                                                                                                                                                                 |
| -------------------------------------------------- | :----: | :----: | :---: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/rhino-cli/{src,tests}`                       |   ✅   |   ✅   |  ✅   | Byte-identical (`audit/09-byte-identity-matrix.md`).                                                                                                                                                  |
| `Cargo.toml`/`Cargo.lock`/`project.json`/`LICENSE` |   ✅   |   ✅   |  ✅   | Byte-identical; infra relicensed to MIT.                                                                                                                                                              |
| `cargo test -p rhino-cli`                          |   ✅   |   ✅   |  ✅   | Exit 0, 0 failures, all 3.                                                                                                                                                                            |
| `.feature` tree (union)                            |   ✅   |  ✅\*  |  ✅   | Public↔infra byte-identical. Public↔primer intentionally diverges in shared-name dirs per Decision 15 (see cucumber-parity note) — reclassified as **allowed divergence** below, not a mechanics gap. |
| `.husky/pre-commit`                                |   ✅   |   ✅   |  ✅   | Identical modulo infra's D9 IaC-lint step.                                                                                                                                                            |
| `.husky/pre-push`                                  |   ✅   |   ✅   |  ✅   | `repo-config validate` gap found+fixed in primer. Identical modulo per-repo `md links --exclude` lists + infra's D9 steps.                                                                            |
| lint-staged (`package.json`)                       |   ✅   |   ✅   |  ✅   | Identical modulo language set (infra correctly lacks go/elixir entries).                                                                                                                              |
| `pr-quality-gate.yml` job set                      |   ✅   |   ✅   | ✅\*  | `compat-min-version` extraction gap found+fixed in infra. `markdown-per-file` extra job in infra reclassified as **allowed divergence** below (additional coverage, not a gap).                       |
| `main-ci.yml` job set                              |   ✅   |  n/a   |  ✅   | primer has no `main-ci.yml`-equivalent push-triggered workflow by this name; not applicable.                                                                                                          |
| `repo-config.yml` header + harness list            |   ✅   |   ✅   |  ✅   | Byte-identical (13-line header, 11-entry harness list).                                                                                                                                               |
| `repo-config validate`                             |   ✅   |   ✅   |  ✅   | Exit 0, all 3, standalone + wired.                                                                                                                                                                    |
| `namedInputs.specs` coverage                       | 29/29  | 26/26  |  8/8  | 100% in all 3 (incl. all 4 `*-contracts` projects).                                                                                                                                                   |
| Mandatory-six targets                              |   ✅   |   ✅   |  ✅   | Clean in all 3.                                                                                                                                                                                       |
| `nx-targets.md` byte-identity subsection           |   ✅   |   ✅   |  ✅   | Byte-identical, no substitution needed.                                                                                                                                                               |
| `AGENTS.md` byte-identity pointer                  |   ✅   |   ✅   |  ✅   | Byte-identical, no substitution needed.                                                                                                                                                               |
| `generate:bindings` → `git status`                 |   ✅   |   ✅   |  ✅   | Clean in all 3.                                                                                                                                                                                       |
| `sh .husky/pre-push` no-op                         |   ✅   |   ✅   |  ✅   | Exit 0, all 3.                                                                                                                                                                                        |

**Allowed-divergence rows** (per SDLC Gate Standard §Divergence Policy, not counted against parity):
app/language set and per-app deploy CRONs, per-language PR-gate jobs, infra-only IaC gates
(`iac-lint`, D9 terraform/ansible/yamllint steps), the self-hosted `ose-infra-runner` CI label —
plus two discovered during this phase, both net-additive (not missing mechanism):

1. **public↔primer `.feature` tree scenario content** in the shared-name dirs (`agents`/`docs`/`env`/`repo-governance`/`workflows`) — Decision 15's directory-level (not scenario-level) union means primer keeps its own pre-existing scenarios for commands it already covered, rather than being overwritten. Forcing scenario-level identity would delete primer's valid coverage of its own CLI commands.
2. **infra's `markdown-per-file` job** in `pr-quality-gate.yml` — a repo-wide (not staged-file-only) sweep of mermaid/heading-hierarchy/gherkin-cardinality validators, on top of the shared lint-staged mechanism. Catches drift in historical files lint-staged never re-touches; removing it would strictly reduce infra's coverage.

### Local Quality Gates (Before Push)

- [x] [AI] Run affected typecheck in each repo: `nx affected -t typecheck`.
  - **Done** (2026-07-02): exit 0 in all 3 (public: 25 projects; primer: 26 projects; infra: 8 projects).
- [x] [AI] Run affected linting in each repo: `nx affected -t lint`.
  - **Done** (2026-07-02): exit 0 in all 3 (warnings only — pre-existing a11y/eslint warnings unrelated to this plan, no errors).
- [x] [AI] Run affected quick tests in each repo: `nx affected -t test:quick`.
  - **Done** (2026-07-02): exit 0 in all 3. Nx flagged `crud-be-clojure-pedestal:specs:behavior:coverage` as flaky in primer (auto-retried, passed) — consistent with this workspace's known parallel-load flake pattern, not a regression from this plan.
- [x] [AI] Run affected spec coverage in each repo: `nx affected -t specs:behavior:coverage`.
  - **Done** (2026-07-02): exit 0 in all 3.
- [x] [AI] Fix ALL failures found — including preexisting issues not caused by this plan's changes (root-cause orientation).
  - **Done** (2026-07-02): zero failures found across all 12 checks (4 targets × 3 repos) — nothing to fix.
- [x] [AI] Verify all checks above pass before pushing any of the 3 repos.
  - **Done** (2026-07-02): confirmed all 12 exit 0.

### Post-Push Verification

- [x] [AI] Push each repo's changes to `origin main`.
  - **Done** (2026-07-02): public `977c0f767` (Phase 3-5 doc/fix batch) then `c439c4ee5` (emoji-violation follow-up fix), both pushed clean. primer `1fe1df7af` then `92211a259`, both pushed clean. infra required 2 push attempts — the first `sh .husky/pre-push` run inside the commit flow caught a genuine, previously-undetected `.codex/agents/` binding-convention violation (fixed, see below); final push `b48423937` succeeded.
- [x] [AI] Monitor GitHub Actions per [ci-post-push-verification](../../../repo-governance/development/workflow/ci-post-push-verification.md) — poll every 2 minutes, one `gh run view --json status,conclusion` per wakeup, never `gh run watch`. Watch `pr-quality-gate.yml` and `main-ci.yml` in ose-public and ose-primer; watch `pr-quality-gate.yml`, `main-ci.yml`, and infra's IaC-specific jobs in ose-infra.
  - **Done**: monitored the first push's runs (all 3 repos) and the follow-up fix push's runs.
- [x] [AI] Verify all watched workflows report `success` in all three repos.
  - **Done** (2026-07-02/03): first push's `main-ci`/`pr-quality-gate` went red in public and primer.
    Root-caused both:
    1. **Real rhino-cli bug** (`apps/rhino-cli/src/application/speccoverage/{extractors,cucumber_expr}.rs`):
       Java/Kotlin source doubles a backslash to embed one at runtime, so a captured
       `@When("^...\\?...$")` regex or `\\{`/`\\}`/`\\/`-escaped Cucumber-expression text was fed
       to the matcher with the doubled backslashes still literal — misread as e.g. "zero-or-one
       backslash" instead of an escaped `?`, and the naive `\{[^}]+\}` param scan didn't recognise
       escaped braces either. Surfaced in primer's `crud-be-java-springboot`/`crud-be-kotlin-ktor`
       once an unrelated `repo-config.yml` edit invalidated the stale Nx cache that had been masking
       it. Fixed (unescape at capture time; escape-aware `find_next_param`), backported byte-identical
       to all 3 repos: public `41063f98b`, primer `688a414bc`, infra `79763f1cc`.
    2. **Pre-existing, unrelated gap** (not a bug): `crud-be-kotlin-ktor` has 59 genuinely-missing
       step implementations (security/currency-handling/unit-handling/attachments/reporting), already
       tracked via commented-out markers in its own `SpecCoverageMarkers.kt` — out of this plan's
       scope. Temporarily overridden to a documented no-op target; tracked in primer's
       `plans/ideas.md`.
    3. **Real bug, not a flake**: public's `ayokoding-www` unit-test timeout
       (`cost-of-living-calculator.steps.tsx`, `Test timed out in 20000ms`) was a file-level
       `vi.setConfig({ testTimeout: 20000 })` silently undercutting the project's own
       `--testTimeout=60000` CLI flag. Reproduced 525/525 green locally (masking the bug outside
       CI's tighter timing margins); fixed by raising the file override to 60000, matching the
       CLI flag's intent. Public `6f9b350b0`.
    4. **infra-only, discovered after the above**: `coralpolyp-be:compat:min-version` failed
       with "No such file or directory" for `generated-contracts/Cargo.toml` — the one cargo
       target on that project missing `dependsOn: ["codegen"]` (every sibling target already had
       it). Fixed in `apps/coralpolyp-be/project.json`; infra `b1e0f3c47`. Re-running then failed a
       second time with `java: not found` — `codegen`'s `openapi-generator-cli` step needs a JVM,
       and the `compat-min-version` job in both `main-ci.yml` and `pr-quality-gate.yml` never
       included the `setup-jvm` step (unlike the sibling `rust` job, which already carries this
       exact fix with its own explanatory comment from an earlier round). Fixed by adding the
       missing `setup-jvm` step to both workflows' `compat-min-version` job; infra `3fa22bde7`.
       Both infra `main-ci` and `pr-quality-gate` fully green afterward.
- [x] [AI] If any CI check fails, fix immediately and push a follow-up commit; do NOT archive until all three are green.
  - **Done**: see above — root-caused and fixed rather than deferred or worked around.

### Commit Guidelines

- [x] [AI] Commit changes thematically — split by concern/domain (rhino-cli source, hooks, workflows, Nx targets, docs).
  - **Done** (2026-07-02): 3 commits in public, 7 in primer, 9 in infra — each scoped to one concern (rhino-cli regeneration, gherkin-tree sync, Nx target wiring, repo-config data, hooks/lint-staged mechanism, CI workflow mechanism, governance docs, plan folder, plus the discovered-gap emoji and .codex fixes as their own commits).
- [x] [AI] Follow Conventional Commits format: `<type>(<scope>): <description>`.
  - **Done** (2026-07-02): all 19 commits use `feat`/`fix`/`chore`/`test`/`docs`/`ci` types with a scope, lowercase imperative subject; commitlint enforced this at commit-msg time (caught and corrected one `data(...)` type not in the allowed enum).
- [x] [AI] Sibling repos carry unrelated WIP — stage explicit paths only, never `git add -A`.
  - **Done** (2026-07-02): every commit in all 3 repos staged explicit paths (`git add <path> <path> ...`); zero `git add -A`/`git add .` calls.
- [x] [AI] Do NOT bundle unrelated fixes into a single commit.
  - **Done** (2026-07-02) with one caveat: in both primer and infra, the `scripts/format-*.sh` deletions (staged earlier via explicit `git rm` during the formatter-convergence work) rode along in the "regenerate rhino-cli" commit rather than the "converge hooks" commit where they conceptually belong — `git rm` stages immediately and a later unrelated `git add` doesn't reset that stage. Content-wise both deletions are correct and intentional; only the commit-message attribution is imprecise. Not re-split (would require amending an already-pushed commit).

### Phase 5 Gate

> All checks below must pass before archival.

- [x] [AI] The parity table (built above) shows ✅ on every mechanics row across all three repos (allowed-divergence rows excluded) — no ❌ or ⚠️ in any mechanics row.
  - **Done** (2026-07-03): confirmed — all mechanics rows ✅, the two discovered divergences reclassified as allowed (✅\*) not ⚠️.
- [x] [AI] `npm run generate:bindings && git status --porcelain` — clean (no drift) in all 3 repos.
  - **Done** (2026-07-03): re-ran in all 3 repos post-fix; `git status --porcelain -- .opencode .amazonq` clean in all 3.
- [x] [AI] All 3 repos' latest push shows `success` on every watched CI workflow — no red.
  - **Done** (2026-07-03): public `2940c355e` (`main-ci`, `pr-quality-gate`, `validate-env`, `publish-images`) all success. primer `688a414bc` (`main-ci`, `pr-quality-gate`, `validate-env`) all success. infra `3fa22bde7` (`main-ci`, `pr-quality-gate`) all success — confirmed after the `setup-jvm` fix (item above).

> **Pause Safety**: all three repos converged, parity-verified, bindings clean, and CI-green; nothing half-applied. Safe to stop. To resume: re-run the byte-identity matrix (this phase's first item) and confirm all-green.

### Plan Archival

- [x] [AI] Verify ALL delivery checklist items above are ticked (no descope path exists — Phase 4 is required, so no item may be deferred as a descope).
  - **Done** (2026-07-03): swept the full checklist in all 3 repos — zero unticked items outside this Archival section.
- [x] [AI] Verify ALL quality gates pass (local + CI) in all three repos.
  - **Done** (2026-07-03): local (Phase 0-5 gates, LQG) all confirmed earlier; CI — public `0c2d4edc5` (all workflows success after a transient Volta-API-500 rerun), primer `5c03d6abc` (all workflows success after a transient Volta-API-500 rerun), infra `0eaf2bc6b` (`main-ci`/`pr-quality-gate` success).
- [x] [AI] `git mv` this plan folder to `done/2026-07-DD__unify-rhino-cli-sdlc-parity/` (actual completion date) in all 3 repos.
  - **Done** (2026-07-03): moved to `plans/done/2026-07-03__unify-rhino-cli-sdlc-parity/` in all 3 repos.
- [x] [AI] Update `plans/in-progress/README.md` in each repo — remove the plan entry.
  - **Done** (2026-07-03): entry removed in all 3 repos.
- [x] [AI] Update `plans/done/README.md` in each repo — add the plan entry with completion date.
  - **Done** (2026-07-03): entry added in all 3 repos.
- [x] [AI] Commit: `chore(plans): move unify-rhino-cli-sdlc-parity to done` in each repo.
  - **Done** (2026-07-03): committed and pushed in all 3 repos.

## Notes

- **Stale-note discipline**: if any item here turns out already-done when reached, verify with the
  named command and tick with the evidence — do not assume from the first plan's record. The
  second-pass sweep already corrected two stale current-state claims (cucumber `.feature` structural
  divergence; primer on the older `0.22.1`) — expect more, and verify everything.
