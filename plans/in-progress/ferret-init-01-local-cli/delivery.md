# Delivery — FERRET Init 01 Standalone Local CLI

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.
>
> **Legend:** `[AI]` executes repository work. `[HUMAN]` is reserved for unavoidable privileged or
> out-of-band work. Every command record contains the literal command, exit, relevant test IDs, 40-character
> HEAD, and UTC timestamp. Never save raw vendor payloads, secrets, telemetry, or absolute host paths.
>
> **Progress lives here, not in `local-tmp/`.** The checkboxes in this file are the single record of what is
> done; an executor ticks them as it goes and never keeps a parallel progress journal, status file, or summary
> elsewhere. `local-tmp/` holds only regenerable working material — raw command output, scratch scripts,
> fixtures, downloaded artefacts, and the run manifests named below — and any file there may be deleted at any
> time without losing progress. Durable evidence belongs under this plan's `evidence/phase-<n>/`, except where
> a phase runs after the plan folder is archived and this file says otherwise.

## Lifecycle, Worktree, and Delivery Mode

This plan already lives at `plans/in-progress/ferret-init-01-local-cli/`; the move from `plans/backlog/` and
both index updates landed with the authoring PR, so execution starts at Phase 0 and performs no lifecycle move.
Authoring happened in `worktrees/ferret-start/`, which is an authoring worktree only: the Authoring-Worktree
Exception permits plan authoring there and forbids implementation. Execution therefore begins by creating its
own worktree below.

From the primary repository root, create the one execution worktree through the required harness route:

```bash
claude --worktree ferret-init-01-local-cli
```

The path is `worktrees/ferret-init-01-local-cli/`. If creation fails, run `rtk git worktree prune` once,
inspect `rtk git worktree list --porcelain` plus matching branches, and reuse the one valid route or stop. Never
force-delete an unknown worktree or create a second plan worktree.

Delivery mode is `worktree-to-pr`: one implementation PR targets `main`. The same PR carries application,
specification, harness, rule/enforcement, generated binding, documentation, evidence, and archive changes. No
separate rules PR exists. The plan never invokes `rules-quality-gate`; a broad semantic PR review is not
authorized. `[AI]` may merge only after the exact current head/base passes the Quality gate, one authenticated
current-head `pr-leak-review`, and every applicable finite gate.

### Delivery Boundaries

| Delivery unit                 | Change-producing phases | Boundary                                                                           | One branch/PR                                                                             | Integration and archival gates                                                                                                                                 |
| ----------------------------- | ----------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DU-01 — standalone FERRET CLI | 1, 2, 3, 4, 5, 6        | End of Phase 6, after the done-plan move is committed on the implementation branch | `ferret-init-01-local-cli` → one PR to `main`; rules-propagation Step 9 uses this same PR | Phase 6 archive/plan/link/diff gates; Phase 7 exact-head local pre-push, `pr-quality-gate.yml`, current-head leak review, and rules manifest terminal `landed` |

Phase 0 changes no product/rule/spec surface. Phase 7 changes none: any repair returns to its owning Phase 1–6
packet and re-crosses the Phase 6 boundary with a new head. Phase 8 is post-merge verification/cleanup only.

## Evidence and Failure Routing

Evidence lives under `plans/in-progress/ferret-init-01-local-cli/evidence/phase-<n>/` until archival. A failed
command returns to the checkbox naming the responsible file/symbol; after repair, rerun that focused command and
the entire phase gate. No retry, sleep, skip, quarantine, loosened assertion, fake target, or success sentinel is
allowed.

## Phase 0 — Environment and Current-Evidence Baseline

**Input:** promoted plan, primary repository checkout, and current `origin/main`.

**Outcome:** exactly one execution worktree, converged toolchain, current harness evidence, exact file ledger,
and green pre-change baseline.

**Proof:** `evidence/phase-0/{route,dependencies,versions,harness-probe,ci-route,file-ledger,gate}.txt`.

**Canonical ACs:** prerequisite for AC-CLI-01..12; no product scenario is implemented here.

- [ ] [AI] From the primary checkout run `claude --worktree ferret-init-01-local-cli`; in the resulting worktree
      run `rtk git rev-parse --show-toplevel`, `rtk git branch --show-current`,
      `rtk git rev-parse HEAD`, `rtk git rev-parse origin/main`, and
      `rtk git worktree list --porcelain`. Expect the declared path, one plan worktree, clean unexplained state,
      and current base. Save `route.txt`; mismatch stops before dependency work.
- [ ] [AI] Run dependency convergence exactly:

```bash
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply
rtk npm run doctor
```

Expect zero exits and no unexplained lockfile/config diff. Save `dependencies.txt`; resolve failures at root
cause. Future `ferret-cli:install` targets are not called in this baseline.

- [ ] [AI] Run `rtk node --version`, `rtk npm --version`, `rtk python3 --version`, `rtk uv --version`, and
      `rtk sqlite3 --version`; record Nx/Ruff/Pyright/pytest/pytest-bdd/coverage versions from the resolved locks.
      Expect Python 3.14 compatibility or stop/amend. Save `versions.txt`.
- [ ] [AI] Run
      `rtk rg -n "hook|plugin|skill|session|subagent|tool" .claude/settings.json .codex/hooks.json .opencode repo-config.yml docs/reference/platform-bindings.md`.
      Compare the result with current official Claude Code, Codex, and OpenCode lifecycle documentation and
      record URLs, accessed date, installed versions, event names, payload bounds, async/terminal semantics, and
      trust behaviour in `harness-probe.txt`. Codex skill remains `unknown`; OpenCode session-end/parent-child
      remains probe-gated. A contradictory official surface stops for plan amendment.
- [ ] [AI] Run
      `rtk rg --files apps specs .claude .agents .codex .opencode .github repo-governance scripts docs | rtk rg "(ferret|cli-e2e|behaviour-coverage|platform-bindings|harness-compatibility|pr-quality-gate|non-product-full-quality|setup-python)"`.
      Resolve the File-Impact Analysis to exact paths and label canonical/generated/hand-authored ownership in
      `file-ledger.txt`; also write those exact repository-relative paths one per line to
      `file-ledger.pathspec`. Unexpected overlap stops for ownership reconciliation.
- [ ] [AI] Prove the CI route before implementation. Run
      `rtk rg -n "schedule:|workflow_dispatch:|concurrency:|integration:|actions/checkout@v6|actions/setup-node" .github/workflows/non-product-full-quality.yml .github/actions`.
      Record how `.github/workflows/pr-quality-gate.yml` will gain fail-closed `has-python` detection plus a
      merge-blocking `python` job, and how the existing scheduled/dispatch workflow's `unit-and-static`,
      `integration`, and `e2e` jobs will add Python setup and the applicable FERRET projects, plus new
      `.github/actions/setup-python/action.yml` and its `.github/actions/README.md` catalog entry. The composite
      action must use setup-python v6 exact 3.14.7 and setup-uv commit
      `bec219d24cd3e171d82865faccec33120bb574f4` (`v10.1.0`) with uv 0.12.16 and the official Linux checksum
      recorded in tech-doc 003. No FERRET-specific job is added; macOS and Linux are the only targets. Save
      `ci-route.txt`; stop and amend if repository permissions cannot edit or manually dispatch this workflow.
- [ ] [AI] Reproduce the pins from official GitHub data before accepting the route:

```bash
rtk gh api repos/astral-sh/setup-uv/git/ref/tags/v10.1.0 --jq '.object.type + " " + .object.sha'
rtk curl -fsSL https://github.com/astral-sh/uv/releases/download/0.12.16/uv-x86_64-unknown-linux-gnu.tar.gz.sha256
```

Require respectively `commit bec219d24cd3e171d82865faccec33120bb574f4` and the Linux checksum
`8e5c6e5523dffc2dcf615bd995554c84c9feb4e577808a3fb8698a639d3f8d9c`; save URLs, accessed date, and full
outputs in `ci-route.txt`. Any drift stops for plan amendment rather than silently updating a pin.

### Phase 0 Gate

All checks must pass before starting Phase 1.

- [ ] [AI] Run
      `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`.
      Expect exit 0; save `gate.txt`. Any failure is preexisting/baseline work and blocks FERRET edits.
- [ ] [AI] Run `rtk git diff --check`. Expect exit 0 and no output; append to `gate.txt`.

> **Pause Safety:** no FERRET product/spec/rule file has changed. Resume with
> `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`.

## Phase 1 — Rules Propagation Steps 0–8

**Input:** Phase 0 ledger and the locked Python/E2E/harness obligations in this plan.

**Outcome:** admission, placement, enforcement, mirrors, and verification are complete before any FERRET project
target depends on them. Rules-propagation Step 9 remains delivery-pending until the same implementation PR is
exact-head green in Phase 7; no terminal `landed` claim occurs here.

**Proof:** `evidence/phase-1/step-{0..8}.txt` and
`local-tmp/rules-propagation/rules-propagation__<run-id>__manifest.md` with delivery state `pending-same-pr`.

**Canonical ACs:** governance prerequisite for every AC; especially AC-CLI-04, AC-CLI-06, and AC-CLI-12.

- [ ] [AI] **Step 0 — Intake:** invoke `repo-governance/workflows/rules/rules-propagation.md` with
      `isolation=current`, `dry-run=false`, `max-concurrency=3`, and normalized rule:
      “Python CLI owners and dedicated Python CLI E2E projects use real mandatory Nx targets, pytest-bdd static
      mapping, owner Unit runtime coverage ≥99%, explicit tags, and raw-forwarded fail-open harness capture whose
      canonical skill source generates only catalog-declared mirrors.” Record the exact input and falsifiable
      pass/violation clauses in `step-0.txt`.
      Record the workflow-generated manifest's literal run ID/path; every later `<run-id>` token in this phase
      is replaced with that recorded value before its command runs.
- [ ] [AI] **Step 1 — Tree:** run `rtk git rev-parse --show-toplevel`, `rtk git status --short`, and
      `rtk git worktree list --porcelain`. Expect the Phase 0 execution worktree and no nested rules worktree/PR.
      Record the portable-rule parity identity before mutation: sibling repository `ose-private`, objective slug
      `ferret-python-harness-governance`, shared future worktree basename
      `ferret-python-harness-governance`, and corresponding short-lived sibling branch
      `ferret-python-harness-governance`. Save `step-1.txt`; unexpected dirt/route stops.
- [ ] [AI] **Step 2 — Classify:** run
      `rtk rg -n "cli-e2e|pytest-bdd|test:coverage|harness-compatibility|generated.*skills|project tags" repo-governance .claude .agents repo-config.yml scripts apps/rhino-cli`.
      Map each obligation to principle/convention/development/workflow/application enforcement in `step-2.txt`.
- [ ] [AI] **Step 3 — Conflict scan:** compare the exact hits with `AGENTS.md`, `CLAUDE.md`,
      `repo-governance/development/infra/nx-targets/`, and `docs/reference/platform-bindings.md`. Record every
      duplicate/conflict/supersession in `step-3.txt`; a higher-layer conflict halts the workflow.
- [ ] [AI] **Steps 4–5 — Placement/admission:** route only to
      `repo-governance/development/infra/nx-targets/mandatory-targets-cli-e2e.md`,
      `repo-governance/development/infra/nx-targets/mandatory-targets-behaviour-coverage.md`,
      `repo-governance/development/infra/nx-targets/tag-convention-current-tags-and-examples.md`,
      `repo-governance/workflows/infra/development-environment-setup/phase-6-python-ecosystem.md`,
      `.claude/skills/harness-compatibility-protocol/SKILL.md`, `repo-config.yml`,
      `docs/reference/platform-bindings.md`, `scripts/behaviour-coverage.mjs`, and
      `scripts/behaviour-coverage.test.mjs`. Run
      `rtk ./rhino harness instruction-size validate` before and after placement.
      Expect zero without raising budgets; save `step-4-5.txt`. Eviction follows the canonical workflow or stops.
- [ ] [AI] **Step 6 RED:** add failing positive/negative fixtures to `scripts/behaviour-coverage.test.mjs` for
      Python dedicated-E2E targets and pytest-bdd mappings; run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- node --test scripts/behaviour-coverage.test.mjs`.
      Expect nonzero naming only unsupported target/mapping behaviour; save `step-6-red.txt`.
- [ ] [AI] **Step 6 GREEN:** update `scripts/behaviour-coverage.mjs` bounded symbols
      `validateProjectTargetContract` and `extractBindings`, the four exact governance/setup paths from Steps
      4–5, `.claude/skills/harness-compatibility-protocol/SKILL.md`,
      `docs/reference/platform-bindings.md`, and `repo-config.yml`. Rerun the RED Node command; expect exit 0 with both new
      positive/negative fixtures passing. Save `step-6-green.txt`.
- [ ] [AI] **Step 6 REFACTOR:** remove duplicated target/binding classification without widening accepted
      projects. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- node --test scripts/behaviour-coverage.test.mjs`
      and
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- ./rhino gate run --surface pre-push`.
      Expect both zero; save `step-6-refactor.txt`.
- [ ] [AI] **Step 7 — Enforcement:** for every manifest rule record one automated command, an already-mandatory
      named human surface, or an intentional unenforced rationale. Run
      `rtk rg -n "unenforced|enforcement|supersed" local-tmp/rules-propagation/rules-propagation__<run-id>__manifest.md`.
      Expect every rule row dispositioned; save `step-7.txt`.
- [ ] [AI] **Step 8 — Bindings/verification:** run:

```bash
rtk npm run generate:bindings
rtk ./rhino harness adapters validate
rtk ./rhino harness adapters validate
rtk ./rhino harness adapters validate
rtk ./rhino harness adapters validate
rtk npm run lint:md
rtk npm run format:md:check
```

Expect zero and only `.agents/skills/harness-compatibility-protocol/**` generated from the canonical skill;
`.opencode/plugins/ferret.ts` remains hand-authored product code and no `.opencode/skills`/agents change exists.
Save `step-8.txt`. Record—not execute—the `ose-private` propagation obligation with objective/worktree/branch
identity `ferret-python-harness-governance`; this delivery creates or mutates no sibling worktree, branch, or
file. An individual rule may record `sibling-obligation: none` only with evidence that it is public-tree-specific.

### Phase 1 Gate

All checks must pass before starting Phase 2.

- [ ] [AI] Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- node --test scripts/behaviour-coverage.test.mjs`.
      Expect exit 0; save `gate.txt`.
- [ ] [AI] Run `rtk ./rhino harness adapters validate`. Expect exit 0 and no drift;
      append to `gate.txt`.
- [ ] [AI] Replace `<resolved-run-id>` with the Step 0 value and run
      `rtk rg -n "^step-[0-8]: complete$|^step-9: pending-same-pr$|^open-enforcement-rows: 0$" local-tmp/rules-propagation/rules-propagation__<resolved-run-id>__manifest.md`.
      Expect exactly eleven matches: Steps 0–8, Step 9, and the zero-open-row record. Then run
      `rtk rg -n "^final-status: (landed|halted)$|^pr-url:" local-tmp/rules-propagation/rules-propagation__<resolved-run-id>__manifest.md`;
      expect exit 1 and no output. Save both commands, exits, and output in `gate.txt`; any mismatch returns to
      the owning Step 0–8 action.

> **Pause Safety:** rules/enforcement are coherent but delivery is intentionally pending on DU-01. Resume with
> `rtk ./rhino harness adapters validate`.

## Phase 2 — Green Projects, Specifications, and Mandatory Targets

**Input:** Phase 1 enforcement support and the fixed app/spec topology.

**Outcome:** two valid Python projects, owner/spec architecture, locked dependencies, and every real mandatory
target green. No lifecycle binding is registered and no unbound Gherkin scenario exists.

**Proof:** `evidence/phase-2/{projects,targets,spec-architecture}.txt` and
`evidence/phase-2/gate-{owner,e2e,install}.txt`.

**Canonical ACs:** structural prerequisite for AC-CLI-01..12.

### Mandatory target contract

| Project          | Target                                                                       | Real behaviour                                                                            |
| ---------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ferret-cli`     | `install`                                                                    | dependency synchronization only: `uv sync --locked`; invoked through transactional HIPPO  |
| `ferret-cli`     | `build` / `run`                                                              | reproducible `dist/ferret.pyz`; execute that built artifact                               |
| `ferret-cli`     | `lint` / `typecheck`                                                         | Ruff check+format-check; strict Pyright over source and tests                             |
| `ferret-cli`     | `test:unit`                                                                  | pytest Unit suite with `--cov=ferret --cov-report=term-missing --cov-fail-under=99`       |
| `ferret-cli`     | `test:integration`                                                           | real filesystem/SQLite/process-boundary pytest suite                                      |
| `ferret-cli`     | `test:coverage:unit`, `test:coverage:integration`, `test:coverage:behaviour` | static Gherkin-to-layer mapping only; never runtime line coverage                         |
| `ferret-cli`     | `test:coverage`                                                              | aggregate only the applicable static `test:coverage:*` validators                         |
| `ferret-cli`     | `test:quick`                                                                 | aggregate `lint`, `typecheck`, runtime `test:unit`, and static validators; no Integration |
| `ferret-cli-e2e` | `install`                                                                    | dependency synchronization only: `uv sync --locked`                                       |
| `ferret-cli-e2e` | `lint` / `typecheck`                                                         | Ruff check+format-check; strict Pyright over E2E source/tests                             |
| `ferret-cli-e2e` | `test:e2e`                                                                   | subprocess tests against the built zipapp; no Unit/Integration aliases                    |
| `ferret-cli-e2e` | `test:coverage:e2e`, `test:coverage:behaviour`                               | static owner-scenario E2E/binding mapping                                                 |
| `ferret-cli-e2e` | `test:coverage`                                                              | aggregate only the applicable static `test:coverage:*` validators                         |
| `ferret-cli-e2e` | `test:quick`                                                                 | aggregate `lint`, `typecheck`, and static validators; no runtime E2E                      |

- [ ] [AI] Create exact project files under `apps/ferret-cli/` and `apps/ferret-cli-e2e/`: README, LICENSE,
      `project.json`, `.python-version`, `pyproject.toml`, locked dependencies, package/test roots, and zipapp
      build entry. Configure Python `>=3.14,<3.15`, strict Pyright, Ruff, pytest, pytest-bdd, coverage.py, and no
      runtime dependency. Run
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:install`
      and
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:install`.
      Expect both exits zero and locked `uv sync` with no unexplained lockfile diff; save `projects.txt`.
- [ ] [AI] Implement exactly the target matrix above in both `project.json` files. Add real target-contract
      tests in `scripts/behaviour-coverage.test.mjs`; run:

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- node --test scripts/behaviour-coverage.test.mjs
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:lint
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:typecheck
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:lint
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:typecheck
```

Expect five zero exits and no missing/skipped/fake target; save complete output in `targets.txt`.

- [ ] [AI] Create `specs/apps/ferret/{README.md,overview.md}` and
      `specs/apps/ferret/cli/{README.md,architecture.md}` with logical owner, privacy boundary, C4 navigation,
      and the exact six future feature paths. Do not add feature scenarios until their Phase 3/4 RED packet.
      Run `rtk npm exec nx -- run-many -t test:coverage:behaviour --projects=<affected-projects>`; expect zero and save
      `spec-architecture.txt`.
- [ ] [AI] Add a real package/build smoke proving the help and version surface from the built artifact: assert
      `ferret --help` exits 0 writing to stdout with stderr empty, `ferret version`, `ferret --version`, and
      `ferret -V` print the same single `ferret <version>` line, bare `ferret` exits 2 writing usage to stderr with
      stdout empty, `ferret help` exits 2 as `invalid_arguments`, `--json` and `--output json` produce
      byte-identical output, and every command listed in root help resolves under `<command> --help`. Do
      not add placeholder, skipped, xfail, echo, or success-sentinel tests. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:build`,
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:run -- --help`,
      and the two literal Phase 2 quick commands below. Expect zero and save `projects.txt`.

### Phase 2 Gate

All checks must pass before starting Phase 3.

- [ ] [AI] Run both dependency targets under one transactional boundary:
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run-many -t install --projects=ferret-cli,ferret-cli-e2e`.
      Expect exit 0; save `gate-install.txt`.
- [ ] [AI] Run `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:quick`.
      Expect exit 0 and Unit runtime line coverage ≥99%; save `gate-owner.txt`.
- [ ] [AI] Run `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:quick`.
      Expect exit 0; save `gate-e2e.txt`.

> **Pause Safety:** both projects and owner/spec architecture are green; no harness registration exists. Resume
> with `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:quick`.

## Phase 3 — Local CLI Scenario Packets

**Input:** green projects and the frozen CLI/data/schema contracts.

**Outcome:** standalone init, canonical capture, privacy, concurrency, snapshots, queries, analytics, retention,
storage, no-backend behaviour, and per-user install/uninstall are complete; adapters are not registered yet.

**Proof:** `evidence/phase-3/ac-cli-<nn>-{red,green,refactor}.txt`, `evidence/phase-3/storage.json`, and
`evidence/phase-3/gate-{owner,e2e,storage}.txt`.

**Canonical ACs:** AC-CLI-01..03, AC-CLI-05..12. AC-CLI-04 completes in Phase 4.

For each packet, add its exact durable scenario to the feature path, then its pytest-bdd binding. RED must fail
only for the named missing symbol/behaviour. GREEN reruns RED plus the named boundary test. REFACTOR runs
`ferret-cli:test:quick`. Unexpected RED, failed GREEN, or failed refactor returns to that packet.

### Phase 3 command packets

These named packets are literal and reusable in Phases 3–5. `OWNER-QUICK` expects exit 0 and Unit runtime
coverage ≥99%; `E2E-QUICK` expects exit 0. A focused RED initially expects only its named missing behaviour; the
same command must exit 0 after GREEN. Save output to the evidence filename named by the invoking checkbox.

| Packet               | Literal command                                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OWNER-QUICK`        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:quick`                                                                                                                                                                              |
| `E2E-QUICK`          | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:quick`                                                                                                                                                                          |
| `C01-UNIT`           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_initialization.py tests/unit/steps/test_initialization_and_concurrency_steps.py'`                                                                      |
| `C01-INTEGRATION`    | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_initialization.py'`                                                                                                                      |
| `C02-03-UNIT`        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_event_contract.py tests/unit/test_privacy.py tests/unit/steps/test_metadata_envelope_steps.py'`                                                        |
| `C02-03-INTEGRATION` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_sqlite_repository.py tests/integration/test_privacy.py'`                                                                                 |
| `C05-INTEGRATION`    | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_sqlite_repository.py'`                                                                                                                   |
| `C06-UNIT`           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_capabilities.py tests/unit/steps/test_fail_open_capabilities_and_platforms_steps.py'`                                                                  |
| `C06-INTEGRATION`    | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_capability_repository.py'`                                                                                                               |
| `C07-08-UNIT`        | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_cli_contract.py tests/unit/test_analytics.py tests/unit/steps/test_local_query_and_export_steps.py tests/unit/steps/test_usage_and_outcomes_steps.py'` |
| `C07-08-INTEGRATION` | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_queries.py tests/integration/test_analytics.py'`                                                                                         |
| `C07-E2E`            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_query_export.py'`                                                                                                                                        |
| `C09-INTEGRATION`    | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_retention.py'`                                                                                                                           |
| `C09-UNIT`           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/steps/test_retention_and_space_steps.py'`                                                                                                                   |
| `C10-UNIT`           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_status.py tests/unit/steps/test_retention_and_space_steps.py'`                                                                                         |
| `C11-UNIT`           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/steps/test_local_query_and_export_steps.py'`                                                                                                                |
| `C11-E2E`            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_standalone.py'`                                                                                                                                          |
| `C12-UNIT`           | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/steps/test_fail_open_capabilities_and_platforms_steps.py'`                                                                                                  |
| `C12-E2E`            | `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_user_install.py'`                                                                                                                                        |

### AC-CLI-01 — Private initialization

- [ ] [AI] Add “Initialize one private store from multiple repositories” to
      `specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature`, bind it at
      `apps/ferret-cli/tests/unit/steps/test_initialization_and_concurrency_steps.py::test_initialize_one_private_store_from_multiple_repositories`,
      and add `apps/ferret-cli/tests/unit/test_initialization.py::test_private_machine_store` plus
      `apps/ferret-cli/tests/integration/test_initialization.py::test_two_repository_init_converges`. Run
      `C01-UNIT`; expect RED naming only missing `resolve_data_home`/`initialize_store`. Save
      `ac-cli-01-red.txt`.
- [ ] [AI] Implement `apps/ferret-cli/src/ferret/adapters/filesystem.py::resolve_data_home` and
      `apps/ferret-cli/src/ferret/application/initialization.py::initialize_store`, POSIX `0700/0600`,
      symlink and hard-link refusal, and idempotent lock; run `C01-UNIT` and
      `C01-INTEGRATION`. Expect one
      identity/database; save `ac-cli-01-green.txt`.
- [ ] [AI] Run `OWNER-QUICK`; expect zero/≥99%; save `ac-cli-01-refactor.txt`.

### AC-CLI-02/03 — Event/hash and privacy

- [ ] [AI] Add “Capture a valid lifecycle event” and all six “Reject a forbidden capture field” examples to
      `specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature`; bind them at
      `apps/ferret-cli/tests/unit/steps/test_metadata_envelope_steps.py::{test_capture_a_valid_lifecycle_event,test_reject_a_forbidden_capture_field}`;
      add `apps/ferret-cli/tests/unit/test_event_contract.py::test_fixed_event_vector`,
      `apps/ferret-cli/tests/unit/test_privacy.py::test_forbidden_field_matrix`, and
      `apps/ferret-cli/tests/integration/test_privacy.py::test_rejected_payload_writes_no_row`. Run
      `C02-03-UNIT`; expect RED naming only missing event canonicalization/privacy rejection. Save
      `ac-cli-02-03-red.txt`.
- [ ] [AI] Implement `apps/ferret-cli/src/ferret/domain/event.py::{Event,canonical_event_bytes,event_hash}` and
      `apps/ferret-cli/src/ferret/application/privacy.py::{validate_capture,project_hook_payload}` with
      field-level visibility, fixed-order NFC bytes/hash
      `199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c`, already-opaque canonical
      capture, duplicate-key/size/field/content/name validation, and redacted errors. Run
      `C02-03-UNIT` and `C02-03-INTEGRATION`; expect exact round-trip/no raw value. Save
      `ac-cli-02-03-green.txt`.
- [ ] [AI] Run `OWNER-QUICK`; expect zero/≥99%; save `ac-cli-02-03-refactor.txt`.

### AC-CLI-05 — Concurrency

- [ ] [AI] Add “Capture concurrently across repositories” to
      `specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature`, bind it at
      `apps/ferret-cli/tests/unit/steps/test_initialization_and_concurrency_steps.py::test_capture_concurrently_across_repositories`,
      and add `tests/integration/test_sqlite_repository.py::test_three_repository_burst`. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/steps/test_initialization_and_concurrency_steps.py'`;
      expect RED naming missing capture transaction behaviour. Save `ac-cli-05-red.txt`.
- [ ] [AI] Implement `apps/ferret-cli/src/ferret/adapters/sqlite_repository.py::SQLiteEventRepository.capture`
      with WAL/FULL/foreign-keys/250 ms busy timeout, short `BEGIN IMMEDIATE`, idempotency, rollback, and closure.
      Rerun the RED command plus `C05-INTEGRATION`; expect one durable row per successful event and no duplicate/
      partial row. Save `ac-cli-05-green.txt`.
- [ ] [AI] Run `OWNER-QUICK`; expect zero/≥99%; save `ac-cli-05-refactor.txt`.

### AC-CLI-06 — Capability snapshots

- [ ] [AI] Add “Mark an unobservable capability unknown,” two-snapshot same-capability, and duplicate/conflict
      scenarios to
      `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature`; bind them at
      `apps/ferret-cli/tests/unit/steps/test_fail_open_capabilities_and_platforms_steps.py::{test_mark_an_unobservable_capability_unknown,test_round_trip_the_same_capability_through_two_snapshots,test_reject_a_conflicting_capability_snapshot}`;
      add `apps/ferret-cli/tests/unit/test_capabilities.py::test_capability_snapshot_matrix` and
      `apps/ferret-cli/tests/integration/test_capability_repository.py::test_snapshot_idempotency_and_composite_items`.
      Run `C06-UNIT`; expect RED naming only missing immutable snapshot/composite-key/idempotency behaviour. Save
      `ac-cli-06-red.txt`.
- [ ] [AI] Implement `apps/ferret-cli/src/ferret/domain/capability.py::CapabilitySnapshot` and
      `apps/ferret-cli/src/ferret/adapters/sqlite_repository.py::SQLiteCapabilityRepository.store_snapshot`,
      `(snapshot_id,capability_name)` key/cascade, and producer-ID semantics: same ID/hash duplicate, same
      ID/different hash conflict, changed assessment new ID. Run `C06-UNIT` and `C06-INTEGRATION`; expect all
      cases green. Save `ac-cli-06-green.txt`.
- [ ] [AI] Run `OWNER-QUICK`; expect zero/≥99%; save `ac-cli-06-refactor.txt`.

### AC-CLI-07/08 — Query/export/analytics

- [ ] [AI] Add “Filter and export deterministic local events” to
      `specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature` with binding
      `apps/ferret-cli/tests/unit/steps/test_local_query_and_export_steps.py::test_filter_and_export_deterministic_local_events`;
      add “Summarize outcomes with incomplete visibility” to
      `specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature` with binding
      `apps/ferret-cli/tests/unit/steps/test_usage_and_outcomes_steps.py::test_summarize_outcomes_with_incomplete_visibility`.
      Run `C07-08-UNIT`; expect RED naming missing closed filters/cursor/group/output shapes. Save
      `ac-cli-07-08-red.txt`.
- [ ] [AI] Implement exact filters/defaults, canonical cursor bytes/digest, ordering, JSON/text/JSONL/errors,
      in `apps/ferret-cli/src/ferret/application/queries.py::{list_events,export_events}` and grouping/null sort,
      independent visibility, duration statistics, and disclaimers in
      `apps/ferret-cli/src/ferret/application/analytics.py::{summarize_usage,summarize_outcomes}`. Run
      `C07-08-UNIT`, `C07-08-INTEGRATION`, and `C07-E2E`; expect GREEN complete contract. Save
      `ac-cli-07-08-green.txt`.
- [ ] [AI] Run `OWNER-QUICK`; expect zero/≥99%; save `ac-cli-07-08-refactor.txt`.

### AC-CLI-09 — Logical expiry and numeric prune

- [ ] [AI] Add “Hide then prune every expired usage-derived record” to
      `specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature`, bind it at
      `apps/ferret-cli/tests/unit/steps/test_retention_and_space_steps.py::test_hide_then_prune_every_expired_usage_derived_record`,
      and add fixed-clock/locked/watchdog/interrupted-after-partial-commit cases to
      `apps/ferret-cli/tests/integration/test_retention.py`. Run `C09-UNIT` and `C09-INTEGRATION`; expect RED from expired
      pre-prune visibility, missing numeric stop, or missing atomic counter. Save `ac-cli-09-red.txt`.
- [ ] [AI] Implement `expires_at > injected_now` on every reader. Before capture/main work, attempt a separate
      `apps/ferret-cli/src/ferret/application/maintenance.py::prune_due` transaction stopping at 100 rows or 100
      monotonic ms. In `SQLiteTelemetryRepository.prune_batch`, atomically increment `expired_local_total` with
      each commit; lock/timeout/rollback changes neither, partial commits leave marker unchanged, final empty
      transaction advances marker, and capture remains within 1,000 ms. Rerun `C09-INTEGRATION`; interrupt after
      one partial commit, restart, and expect exact once-only count, no loss/double count, and
      `expired_before_ack_total=0`. Save `ac-cli-09-green.txt`.
- [ ] [AI] Run `OWNER-QUICK`; expect zero/≥99%; save `ac-cli-09-refactor.txt`.

### AC-CLI-10 — Storage and maintenance

- [ ] [AI] Add “Measure storage before and after retention” to
      `specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature`, bind it at
      `apps/ferret-cli/tests/unit/steps/test_retention_and_space_steps.py::test_measure_storage_before_and_after_retention`,
      and add `tests/unit/test_status.py::test_physical_space_fields`. Run `C10-UNIT`; expect RED naming missing
      WAL/freelist/high-water measurements. Save `ac-cli-10-red.txt`.
- [ ] [AI] Implement safe checkpoint/reclamation/integrity/status/maintenance and
      `apps/ferret-cli/src/ferret/application/maintenance.py::{measure_storage,reclaim_space}` plus
      `apps/ferret-cli-e2e/src/storage_benchmark.py::main`. Run:

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- python apps/ferret-cli-e2e/src/storage_benchmark.py --events 5000 --seed 20260918 --output plans/in-progress/ferret-init-01-local-cli/evidence/phase-3/storage-5000.json
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- python apps/ferret-cli-e2e/src/storage_benchmark.py --events 20000 --seed 20260918 --output plans/in-progress/ferret-init-01-local-cli/evidence/phase-3/storage-20000.json
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- python apps/ferret-cli-e2e/src/storage_benchmark.py --events 100000 --seed 20260918 --output plans/in-progress/ferret-init-01-local-cli/evidence/phase-3/storage-100000.json
```

Expect three zero exits and labelled schema/index/WAL/prune/compaction bytes; explain measurements outside
0.7–1.5 KiB/event. Rerun `C10-UNIT`; save all four transcripts in `ac-cli-10-green.txt`.

- [ ] [AI] Run `OWNER-QUICK` and
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration --args='tests/integration/test_retention.py::test_failed_compaction_preserves_readable_original'`.
      Expect both zero and byte-identical readable source data after injected compaction failure; save
      `ac-cli-10-refactor.txt`.

### AC-CLI-11 — Standalone commands

- [ ] [AI] Add “Use FERRET without a backend” to
      `specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature`, bind it at
      `apps/ferret-cli/tests/unit/steps/test_local_query_and_export_steps.py::test_use_ferret_without_a_backend`,
      and add `apps/ferret-cli-e2e/tests/test_standalone.py::test_all_commands_with_denied_sockets`. Run
      `C11-UNIT` and `C11-E2E`; expect RED from an incomplete command/output or socket attempt. Save
      `ac-cli-11-red.txt`.
- [ ] [AI] Complete `apps/ferret-cli/src/ferret/cli.py::{build_parser,dispatch}` and command serializers with
      backend `not_available_in_this_version`; rerun `C11-E2E` and expect GREEN with no socket attempt. Save
      `ac-cli-11-green.txt`.
- [ ] [AI] Run `OWNER-QUICK` and `E2E-QUICK`; expect zero; save `ac-cli-11-refactor.txt`.

### AC-CLI-12 — Exact per-user install/uninstall

- [ ] [AI] Add “Remove FERRET without changing harness behaviour” to
      `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature`, bind it at
      `apps/ferret-cli/tests/unit/steps/test_fail_open_capabilities_and_platforms_steps.py::test_remove_ferret_without_changing_harness_behaviour`,
      and add `apps/ferret-cli-e2e/tests/test_user_install.py::test_user_install_update_uninstall`. Run
      `C12-UNIT` and `C12-E2E`; expect RED naming missing manifest/launcher/ownership behaviour. Save
      `ac-cli-12-red.txt`.
- [ ] [AI] Implement `$HOME/.local/share/ferret/<version>/ferret.pyz`, the `$HOME/.local/bin/ferret` symlink,
      the owner-only manifest `$HOME/.local/share/ferret/install.json`, and staged flush with atomic replace and
      manifest last in `apps/ferret-cli/src/ferret/application/install.py::{install_user,uninstall_user}`
      and `adapters/posix_install.py::{stage_install,recover_install}`. Inject crashes (a) before artifact
      replace: old manifest/launcher/artifact remain; (b) after artifact before launcher: old manifest remains and
      recovery removes/ignores unowned staged version; (c) after launcher before manifest: old manifest remains,
      ownership mismatch prevents deletion and recovery restores old launcher or completes new manifest; (d)
      after manifest replace: new manifest/launcher/digest are authoritative. Run `C12-E2E` on macOS and Linux;
      expect exact pre/post-manifest recovery states, bytes, and paths. Save
      `ac-cli-12-green.txt`.
- [ ] [AI] Run `OWNER-QUICK` and `E2E-QUICK`; expect zero; save `ac-cli-12-refactor.txt`.

### Phase 3 Gate

All checks must pass before starting Phase 4.

- [ ] [AI] Run `OWNER-QUICK`; expect zero and Unit runtime coverage ≥99%; save `gate-owner.txt`.
- [ ] [AI] Run `E2E-QUICK`; expect zero for lint, typecheck, and static validators only; save `gate-e2e.txt`.
- [ ] [AI] Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration`
      and
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e`.
      Expect both local-platform runtime suites to exit 0; save
      `gate-runtime.txt`. Neither runtime suite is part of `test:quick` or any `test:coverage*` target.
- [ ] [AI] Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- python apps/ferret-cli-e2e/src/storage_benchmark.py --events 100000 --seed 20260918 --output plans/in-progress/ferret-init-01-local-cli/evidence/phase-3/storage.json`.
      Expect zero and complete labelled measurements; save `gate-storage.txt`.

> **Pause Safety:** standalone CLI behaviour is green and no repository harness calls it. Resume with
> `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:quick`.

## Phase 4 — POSIX Harness Adapters

**Input:** green standalone CLI and Phase 0 verified lifecycle registrations.

**Outcome:** Claude Code, Codex, and OpenCode POSIX adapters pass raw payloads through one Python privacy
boundary and cannot disturb the harness.

**Proof:** `evidence/phase-4/{adapters-red,adapters-green,adapters-refactor,ci-evidence-refactor,smoke}.txt`
and `evidence/phase-4/gate-{adapters,projects,bindings,ci}.txt`.

**Canonical ACs:** AC-CLI-04, AC-CLI-06, and AC-CLI-12; supplements AC-CLI-02/03 privacy.

- [ ] [AI] **RED:** add “Keep a harness fail-open after a local failure” to
      `specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature`, bind it at
      `apps/ferret-cli/tests/unit/steps/test_fail_open_capabilities_and_platforms_steps.py::test_keep_a_harness_fail_open_after_a_local_failure`,
      and add exact vendor fixtures to `apps/ferret-cli-e2e/tests/test_harness_adapters.py::test_fail_open_matrix`
      for raw forwarding, content
      discard, missing CLI, invalid JSON, lock, disk error, 900 ms TERM, 1,000 ms KILL, empty streams, zero exit,
      synchronous commit, and prune lock/100 ms budget. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_harness_adapters.py'`;
      expect RED naming missing `application.capture_hook.capture_hook`/adapters only. Save `adapters-red.txt`.
- [ ] [AI] **GREEN shell/config:** implement
      `apps/ferret-cli/src/ferret/application/capture_hook.py::capture_hook` and
      `.claude/hooks/ferret-capture.sh`; register only verified static
      args in `.claude/settings.json` and `.codex/hooks.json`. The wrapper forwards stdin byte-for-byte to Python,
      suppresses streams/reaps, and never parses/maps/hashes. Rerun Claude/Codex fixture rows; expect zero. Save
      the same adapter E2E command; expect zero for Claude/Codex rows. Save partial `adapters-green.txt`; failure
      routes to wrapper/config.
- [ ] [AI] **GREEN OpenCode:** implement `.opencode/plugins/ferret.ts` as bounded raw JSON forwarding to the same
      Python command, with equivalent child deadline; it never canonicalizes or opens SQLite. Keep session-end/
      parent-child probe-gated and Codex skill unknown. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/steps/test_fail_open_capabilities_and_platforms_steps.py'`
      plus the same adapter E2E command; expect GREEN for all rows. Append `adapters-green.txt`.
- [ ] [AI] **REFACTOR:** run the same adapter E2E command plus the literal owner/E2E quick commands from Phase 3;
      measure normal/busy/missing/invalid/timeout p50/p95/max, expecting normal p95 ≤150 ms and hard max ≤1,000
      ms. Save `adapters-refactor.txt`.
- [ ] [AI] Run synthetic smoke with installed commands recorded by Phase 0:
      `claude -p "Read README.md and return one word"`,
      `codex exec "Read README.md and return one word"`, and
      `opencode run "Read README.md and return one word"` where available. Expect unchanged harness output,
      metadata-only rows, and explicit `unverified` rather than pass when unavailable. Save `smoke.txt`.
- [ ] [AI] **GREEN CI evidence:** add `.github/actions/setup-python/action.yml` plus its `.github/actions/README.md`
      catalog entry, then edit `.github/workflows/pr-quality-gate.yml` and
      `.github/workflows/non-product-full-quality.yml`. In the PR workflow, expose `has-python`, initialize it
      to false, set it true for affected `lang:python` projects, and set it true in detection's fail-closed
      fallback. Add a `python` job to `quality-gate.needs`; it checks out with full history, runs existing Node
      setup plus the new Python setup, then runs
      `npx nx affected -t typecheck lint test:quick --exclude='tag:lang:ts,tag:lang:fsharp,tag:lang:csharp,tag:lang:rust,tag:lang:dart,tag:lang:java,tag:lang:go' --parallel=1`.
      In the full-quality workflow, preserve its schedule and concurrency, add required string input
      `evidence_nonce` to `workflow_dispatch`, and set
      `run-name: non-product-full-quality-${{ inputs.evidence_nonce || 'scheduled' }}`. Add Python setup and
      `ferret-cli,ferret-cli-e2e` to `unit-and-static`, Python setup and `ferret-cli` to `integration`, and Python
      setup plus `ferret-cli-e2e` to `e2e`, preserving quick → Integration → E2E ordering. The composite action
      uses one setup-uv step with literal `version: 0.12.16` and
      `checksum: 8e5c6e5523dffc2dcf615bd995554c84c9feb4e577808a3fb8698a639d3f8d9c`, plus setup-uv's literal
      `enable-cache: true`, `restore-cache: true`, `save-cache: ${{ github.ref == 'refs/heads/main' }}`, the
      FERRET `uv.lock` `cache-dependency-glob`, and `cache-suffix: ${{ runner.os }}`. No FERRET-specific job and
      no artifact upload are added, so the plan carries no evidence sanitizer and no Actions storage budget.
      Save the workflow diff in `smoke.txt`.

- [ ] [AI] **REFACTOR CI evidence:** run `OWNER-QUICK`,
      `E2E-QUICK`, and the Phase 4 local workflow/composite validation commands; require zero throughout. Save
      `ci-evidence-refactor.txt`; any failure returns to this GREEN packet.

### Phase 4 Gate

All checks must pass before starting Phase 5.

- [ ] [AI] Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_harness_adapters.py'`.
      Expect zero, empty streams, fail-open exit, numeric watchdog/prune bounds, and synchronous terminal commit;
      save `gate-adapters.txt`.
- [ ] [AI] Run `OWNER-QUICK` and `E2E-QUICK`. Expect zero; save `gate-projects.txt`.
- [ ] [AI] Run `rtk ./rhino harness adapters validate`. Expect zero and no generated
      drift; save `gate-bindings.txt`.
- [ ] [AI] Run this exact local syntax/retention packet and inspect the local composite plus both workflows:

```bash
rtk actionlint .github/workflows/pr-quality-gate.yml .github/workflows/non-product-full-quality.yml
rtk scripts/verify-artifact-retention.sh .github/workflows/pr-quality-gate.yml .github/workflows/non-product-full-quality.yml
```

Then run
`rtk rg -n "has-python|lang:python|ferret-cli|ferret-cli-e2e|setup-python" .github/workflows/pr-quality-gate.yml .github/workflows/non-product-full-quality.yml .github/actions/setup-python/action.yml`.
Expect exit 0 from both commands above, fail-closed Python PR admission, the FERRET projects present in the
scheduled quick, Integration, and E2E lists, and the composite action resolved; save `gate-ci.txt`. A missing or
unavailable route blocks Phase 5.

> **Pause Safety:** supported POSIX capture is complete and harmless when FERRET is absent. Resume with
> `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e --args='tests/test_harness_adapters.py'`.

## Phase 5 — Full Verification and Documentation

**Input:** complete CLI, adapters, specs, enforcement, and generated bindings.

**Outcome:** automatic/manual/platform/storage proof covers every command, AC, privacy boundary, and estimate;
documentation matches measured behaviour.

**Proof:** `evidence/phase-5/{automatic-docs,automatic-governance,manual-capture,manual-query,manual-install,
retention,retention-fixture-red,retention-fixture-green,retention-fixture-refactor,ci,storage,trace,gate}.txt`
plus `evidence/phase-5/{manual-summaries,retention}.sha256`.

**Canonical ACs:** AC-CLI-01..12 and all CLI-contract scenarios.

- [ ] [AI] Run `OWNER-QUICK` and `E2E-QUICK`; expect zero. Then run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:integration`
      and
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli-e2e:test:e2e`.
      Expect both separately invoked runtime suites to exit 0. Save all four command transcripts in
      `automatic-projects.txt`; failure returns to the owning Phase 3/4 packet.
- [ ] [AI] Run `rtk npm exec nx -- run-many -t test:coverage:behaviour --projects=<affected-projects>`, then harness `bindings`, `ownership`,
      and `catalog` validators as literal Phase 1 commands. Expect zero; save `automatic-governance.txt`.
- [ ] [AI] Run `rtk npm run lint:md`, `rtk npm run format:md:check`,
      `rtk ./rhino md links validate plans/in-progress/ferret-init-01-local-cli`, and
      `rtk git diff --check`. Expect zero; save `automatic-docs.txt`.
- [ ] [AI] **RED manual evidence:** add
      `apps/ferret-cli/tests/unit/test_manual_evidence.py::{test_isolates_all_user_roots,test_capture_exit_contract,test_query_exit_contract,test_install_ownership_contract,test_summary_contains_only_relative_hashes_and_exits,test_refuses_unowned_existing_root}`.
      Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_manual_evidence.py'`;
      require assertion failure naming missing `manual_evidence`, not import/environment failure. Save
      `manual-evidence-red.txt`.
- [ ] [AI] **GREEN manual evidence:** implement `apps/ferret-cli/tests/support/manual_evidence.py::main`. Its closed
      `capture`, `query`, and `install` cases create an owned run marker under the required repository-relative
      `local-tmp/ferret-plan01/<run-id>/`, set `HOME`, `XDG_DATA_HOME`, and `FERRET_DATA_HOME`
      beneath that root for every child, and refuse any pre-existing root
      without the same run marker. Raw stdout/stderr/JSON/database/install paths stay only in `local-tmp`; the
      requested tracked summary contains only case/command labels, numeric exits, byte counts, relative
      filenames, SHA-256 values, and assertions—never raw payload/output, environment values, usernames, or
      absolute paths. Each case initializes its own environment and verifies its prerequisite database state;
      it never depends on caller shell variables. Rerun the focused test and require zero. Save
      `manual-evidence-green.txt`.
- [ ] [AI] **REFACTOR/manual run:** run the complete isolated matrix from one self-contained shell:

```bash
FERRET_RUN_ID="<resolved-phase-0-run-id>"
FERRET_RAW_ROOT="local-tmp/ferret-plan01/${FERRET_RUN_ID}"
FERRET_SAFE_ROOT="plans/in-progress/ferret-init-01-local-cli/evidence/phase-5"
FERRET_BIN="apps/ferret-cli/dist/ferret.pyz"
mkdir -p "$FERRET_SAFE_ROOT"
rtk python apps/ferret-cli/tests/support/manual_evidence.py capture --run-id "$FERRET_RUN_ID" --raw-root "$FERRET_RAW_ROOT" --bin "$FERRET_BIN" --summary "$FERRET_SAFE_ROOT/manual-capture.txt"
rtk python apps/ferret-cli/tests/support/manual_evidence.py query --run-id "$FERRET_RUN_ID" --raw-root "$FERRET_RAW_ROOT" --bin "$FERRET_BIN" --summary "$FERRET_SAFE_ROOT/manual-query.txt"
rtk python apps/ferret-cli/tests/support/manual_evidence.py install --run-id "$FERRET_RUN_ID" --raw-root "$FERRET_RAW_ROOT" --bin "$FERRET_BIN" --summary "$FERRET_SAFE_ROOT/manual-install.txt"
rtk rg -n '^(case|command|exit|bytes|sha256|assertion)=' "$FERRET_SAFE_ROOT"/manual-{capture,query,install}.txt
rtk sha256sum "$FERRET_SAFE_ROOT"/manual-{capture,query,install}.txt >"$FERRET_SAFE_ROOT/manual-summaries.sha256"
if rtk rg -n '(/Users/|/home/|[A-Za-z]:\\Users\\|raw_payload|FERRET_[A-Z_]+=)' "$FERRET_SAFE_ROOT"/manual-{capture,query,install}.txt; then exit 1; fi
```

Replace `<resolved-phase-0-run-id>` with the Phase 0 literal. Require capture exits `0,0,0,2,0,0`; query exits
zero except invalid cursor `2`; install exits five zeros with `installed`, `already_installed`, kept, and purged
states. Require contract shapes/digests/sorts/disclaimers from tech-doc 005, zero hook bytes, empty success
stderr, safe error stderr, and no unowned deletion. Run `C12-E2E` and the focused manual helper test again;
failure returns to AC-CLI-01..04/07..12. Only the four sanitized summary/hash files are staged; raw evidence
remains ignored and is removed with the execution worktree.

- [ ] [AI] **RED retention fixture:** add
      `apps/ferret-cli/tests/unit/test_manual_retention_fixture.py::{test_seed_relative_boundary,test_lock_handshake_timeout,test_run_matrix_sanitizes_summary,test_run_matrix_rejects_unowned_root}`
      and run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:test:unit --args='tests/unit/test_manual_retention_fixture.py'`.
      Require assertion failure naming missing `manual_retention_fixture`, not an import/environment failure;
      save `retention-fixture-red.txt`.
- [ ] [AI] **GREEN retention fixture:** add the non-production helper
      `apps/ferret-cli/tests/support/manual_retention_fixture.py::{seed_relative,hold_lock,await_ready,inspect,run_matrix}`. It
      writes directly only to the isolated fixture database, accepts `--reference-now`, creates exact relative
      timestamps, signals lock acquisition through `--ready-file`, exits on `--release-file`, and never changes
      production clock/configuration. `run_matrix` owns the same local-tmp marker/root rules as
      `manual_evidence.py`, keeps every raw file in that root, hard-stops its child/lock handshake at 10 seconds,
      and writes only relative hashes/exits/assertions to the tracked summary. Rerun the focused test and require
      zero; save `retention-fixture-green.txt`.
- [ ] [AI] **REFACTOR/retention run:** run this self-contained command:

```bash
FERRET_RUN_ID="<resolved-phase-0-run-id>"
FERRET_RAW_ROOT="local-tmp/ferret-plan01/${FERRET_RUN_ID}"
FERRET_SAFE_ROOT="plans/in-progress/ferret-init-01-local-cli/evidence/phase-5"
FERRET_BIN="apps/ferret-cli/dist/ferret.pyz"
FERRET_REFERENCE_NOW="$(rtk date -u +%Y-%m-%dT%H:%M:%S.000Z)"
rtk python apps/ferret-cli/tests/support/manual_retention_fixture.py run-matrix --run-id "$FERRET_RUN_ID" --raw-root "$FERRET_RAW_ROOT" --bin "$FERRET_BIN" --reference-now "$FERRET_REFERENCE_NOW" --expired-events 101 --expired-snapshots 1 --retained-events 1 --summary "$FERRET_SAFE_ROOT/retention.txt"
rtk rg -n '^(case|command|exit|bytes|sha256|assertion)=' "$FERRET_SAFE_ROOT/retention.txt"
rtk sha256sum "$FERRET_SAFE_ROOT/retention.txt" >"$FERRET_SAFE_ROOT/retention.sha256"
if rtk rg -n '(/Users/|/home/|[A-Za-z]:\\Users\\|raw_payload|FERRET_[A-Z_]+=)' "$FERRET_SAFE_ROOT/retention.txt"; then exit 1; fi
```

Replace the run ID and expect zero: reads expose no expired row, the locked attempt advances neither rows,
counter, nor marker, the first unlocked operation commits at most 100 expired Event/snapshot deletions, the
final maintenance removes the remainder exactly once, the retained row survives, `expiredLocalTotal=102`,
and `expiredBeforeAckTotal=0`. Run `C09-INTEGRATION` plus the focused helper test; only sanitized
`retention.{txt,sha256}` are staged. Any wait beyond the helper's 10-second self-timeout is a defect, not a
reason to widen/retry. Save `retention-fixture-refactor.txt`.

- [ ] [AI] Inspect `.github/workflows/pr-quality-gate.yml`, `.github/workflows/non-product-full-quality.yml`,
      and `.github/actions/setup-python/action.yml`. Run
      `rtk rg -n "has-python|lang:python|python:|ferret-cli|ferret-cli-e2e" .github/workflows/pr-quality-gate.yml .github/workflows/non-product-full-quality.yml .github/actions/setup-python`
      plus the Phase 4 `actionlint` and retention commands. Expect fail-closed Python PR admission and the
      FERRET projects present in the scheduled quick, Integration, and E2E lists. Save `ci.txt`.
- [ ] [AI] Rerun the 100,000-event benchmark from a clean store; reconcile SQLite/index/WAL/freelist/high-water
      measurements and 5k/20k/100k projections with the BRD envelope. Save `storage.txt`; unexplained deviation
      blocks delivery. Use the exact Phase 3 storage-benchmark command and save `storage.txt`.
- [ ] [AI] Build `trace.txt` mapping every AC/title to exact Unit/Integration/E2E/manual evidence and every
      non-goal to an absence check. Record UI/browser/design/usability and HTTP/API exploratory testing as not
      applicable; a new route/API stops for plan amendment. Run
      `rtk rg -n "missing|assumed|skipped|unverified" plans/in-progress/ferret-init-01-local-cli/evidence/phase-5/trace.txt`;
      expect no unexplained match.

### Phase 5 Gate

All checks must pass before starting Phase 6.

- [ ] [AI] Run
      `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- ./rhino gate run --surface=pre-push`.
      Expect exit 0; save `gate.txt`.
- [ ] [AI] Run
      `rtk rg -c "^AC-CLI-(0[1-9]|1[0-2])\\b" plans/in-progress/ferret-init-01-local-cli/evidence/phase-5/trace.txt`;
      expect output `12`. Then run
      `rtk rg -n "missing|assumed|skipped|unverified" plans/in-progress/ferret-init-01-local-cli/evidence/phase-5/trace.txt`;
      expect exit 1 and no output. Append both transcripts to `gate.txt`; a count mismatch or match reopens the
      owning AC packet.

> **Pause Safety:** DU-01 behaviour and documentation are complete with reproducible evidence. Resume with
> `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- ./rhino gate run --surface=pre-push`.

## Phase 6 — Knowledge, Preliminary Audit, and Archive Boundary

**Input:** complete Phase 5 evidence and existing top-level `learnings.md`.

**Outcome:** knowledge is dispositioned, preliminary completeness passes, the plan moves to done, and the single
DU-01 change set is ready for authorized commit/PR creation.

**Proof:** tracked `evidence/phase-6/{learnings,preliminary-audit}.txt` plus the immutable candidate/checker rows,
archive transcript, archive SHA/parent, and gate transcripts in external
`local-tmp/plan-execution/ferret-init-01-candidate.txt`, and the archived plan path.

**Canonical ACs:** AC-CLI-01..12 final preliminary trace.

- [ ] [AI] Run `rtk git ls-files --error-unmatch plans/in-progress/ferret-init-01-local-cli/learnings.md`;
      expect the existing top-level file. Inspect every row and record
      sensitivity/relevance/destination/authority checks and exactly one status: `promoted`, `linked`,
      `retained-plan-specific`, `reported-without-plan-authorization`, or `reviewed-none`. After an authorized
      docs/plan promotion run
      `rtk npm run lint:md`,
      `rtk ./rhino md links validate <exact-promoted-destination>`, and
      `rtk git diff --check`; after a rule promotion rerun the exact Phase 1 Step 8 commands and manifest gate;
      after a code/test promotion run
      `rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- affected -t build,typecheck,lint,test:quick --base=origin/main --head=HEAD`.
      Expect every applicable destination command exit 0 and record the resolved command/path in
      `learnings.txt`; a placeholder, open row, or missing authority blocks archive.
- [ ] [AI] Create `evidence/preliminary-delivery-audit.md` tracing ACs, contract/hash/snapshots, counters,
      numeric prune, install manifest, rules Steps 0–8, storage, rollback, automatic/manual proof, and file ledger.
      Run `rtk rg -n "FAIL|OPEN|MISSING|ASSUMED" evidence/preliminary-delivery-audit.md`; expect no blocking row.
      Save `preliminary-audit.txt`; reopen the earliest owning phase otherwise.
- [ ] [AI] Reconcile `evidence/phase-0/file-ledger.pathspec` against `rtk git status --short`, rejecting unrelated
      paths. Before archival and after explicit commit authorization, stage the ledger's exact implementation,
      spec, rule, generated, sanitized evidence, and still-in-progress plan paths; exclude every
      `plans/done/`/index move. Run:

```bash
FERRET_LEDGER="plans/in-progress/ferret-init-01-local-cli/evidence/phase-0/file-ledger.pathspec"
rtk git add --pathspec-from-file="$FERRET_LEDGER"
rtk git diff --cached --name-status
rtk git diff --cached --check
rtk git commit -m "feat(ferret): add standalone local cli"
rtk git status --short
rtk git rev-parse HEAD
```

Expect the staged inventory to equal the pre-archive ledger, diff-check zero, a 40-character HEAD, and clean
status. Never stage by directory or `-A`; never push or create a separate rules PR.

- [ ] [AI] With the completed implementation committed but the plan still under `plans/in-progress/`, set
      `FERRET_CANDIDATE_SHA="$(rtk git rev-parse HEAD)"` and
      `FERRET_CANDIDATE_TREE="$(rtk git rev-parse 'HEAD^{tree}')"`; write exact
      `candidate-sha=<FERRET_CANDIDATE_SHA>` and `candidate-tree=<FERRET_CANDIDATE_TREE>` rows to
      `local-tmp/plan-execution/ferret-init-01-candidate.txt`. Make one independent `plan-execution-checker`
      Agent call with this exact prompt (a checker call, not recursive plan-execution):

```text
Validate completed implementation for plan-path=plans/in-progress/ferret-init-01-local-cli/ at candidate-ref=<FERRET_CANDIDATE_SHA> and candidate-tree=<FERRET_CANDIDATE_TREE>.
Check every BRD outcome, PRD AC-CLI-01..12, delivery checkbox/evidence path, File-Impact path, CI route, rules manifest, privacy/hash/retention contract, and automatic/manual gate.
Write the normal report under local-tmp/plan-execution/. Return Status Complete and Total Findings 0 only when no required proof is missing.
```

Replace all placeholders with literals before the call. Resolve the report and run
`rtk rg -n "^\*\*Status\*\*: Complete$|^\*\*Total Findings\*\*: 0$" local-tmp/plan-execution/<resolved-checker-report>.md`;
expect exactly two matches. Then require `git rev-parse HEAD` and `git rev-parse 'HEAD^{tree}'` still equal the
recorded values and `git status --short` is empty. Record report path/hash/prompt/dispositions only in the
external candidate file. Any finding or identity drift returns to its earliest owner, creates a new authorized
commit, and requires a fresh checker call.

- [ ] [AI] Only after that immutable candidate receives `Status: Complete` and `Total Findings: 0`, resolve and
      materialize every inbound owner before moving anything:

```bash
FERRET_CANDIDATE_RECORD="local-tmp/plan-execution/ferret-init-01-candidate.txt"
FERRET_BACKLINKS="local-tmp/plan-execution/ferret-init-01-archive-backlinks.txt"
FERRET_NON_LINK_MENTIONS="local-tmp/plan-execution/ferret-init-01-non-link-mentions.txt"
FERRET_ACTIVATION_OWNER="plans/backlog/ferret-init-02-local-backend/README.md"
FERRET_ARCHIVE_SCOPE_PATHS="local-tmp/plan-execution/ferret-init-01-archive-scope.paths"
FERRET_ARCHIVE_SCOPE_PATHSPEC="local-tmp/plan-execution/ferret-init-01-archive-scope.pathspec.nul"
FERRET_ARCHIVE_STAGE_PATHS="local-tmp/plan-execution/ferret-init-01-archive-stage.paths"
FERRET_ARCHIVE_STAGE_PATHSPEC="local-tmp/plan-execution/ferret-init-01-archive-stage.pathspec.nul"
rtk git grep -l -E '\[[^]]+\]\([^)]*ferret-init-01-local-cli[^)]*\)' -- 'plans/**/*.md' | rtk rg -v '^plans/in-progress/ferret-init-01-local-cli/' | rtk sort -u >"$FERRET_BACKLINKS"
rtk git grep -l -F 'ferret-init-01-local-cli' -- 'plans/**/*.md' | rtk rg -v '^plans/in-progress/ferret-init-01-local-cli/' | rtk sort -u >"$FERRET_NON_LINK_MENTIONS"
rtk rg -n '^- Prerequisite plan identifier: `ferret-init-01-local-cli`\.' "$FERRET_ACTIVATION_OWNER"
```

Require the stable Plan 02 prerequisite marker exactly once, inspect every actual link owner, and record both
inventory hashes externally. Classify the broader non-link-mention inventory separately: the explicit Plan 02
activation owner becomes a dated done-plan link at archive, while branch, worktree, command, and evidence
literals—including Plan 02 delivery literals—remain unchanged and outside the archive pathspec. An unclassified
actual link or mention blocks archival. Then resolve and archive:

```bash
FERRET_COMPLETION_DATE="$(rtk date +%F)"
FERRET_DONE_PLAN="plans/done/${FERRET_COMPLETION_DATE}__ferret-init-01-local-cli"
rtk git mv plans/in-progress/ferret-init-01-local-cli "$FERRET_DONE_PLAN"
rtk rg -n "ferret-init-01-local-cli" plans
```

Update only `plans/in-progress/README.md`, `plans/done/README.md`, every inspected file in `$FERRET_BACKLINKS`,
and `$FERRET_ACTIVATION_OWNER`: actual links point to the dated done path and the Plan 02 marker becomes its
first dated done-plan link. Materialize separate exact delta-scope and post-move staging pathspecs:

```bash
rtk awk -v old='plans/in-progress/ferret-init-01-local-cli' -v new="$FERRET_DONE_PLAN" -v activation="$FERRET_ACTIVATION_OWNER" 'BEGIN { print old; print new; print "plans/in-progress/README.md"; print "plans/done/README.md"; print activation } { print }' "$FERRET_BACKLINKS" | rtk sort -u >"$FERRET_ARCHIVE_SCOPE_PATHS"
rtk awk -v new="$FERRET_DONE_PLAN" -v activation="$FERRET_ACTIVATION_OWNER" 'BEGIN { print new; print "plans/in-progress/README.md"; print "plans/done/README.md"; print activation } { print }' "$FERRET_BACKLINKS" | rtk sort -u >"$FERRET_ARCHIVE_STAGE_PATHS"
rtk awk '{ printf "%s%c", $0, 0 }' "$FERRET_ARCHIVE_SCOPE_PATHS" >"$FERRET_ARCHIVE_SCOPE_PATHSPEC"
rtk awk '{ printf "%s%c", $0, 0 }' "$FERRET_ARCHIVE_STAGE_PATHS" >"$FERRET_ARCHIVE_STAGE_PATHSPEC"
rtk awk -v old='plans/in-progress/ferret-init-01-local-cli' -v new="$FERRET_DONE_PLAN" -v activation="$FERRET_ACTIVATION_OWNER" '
  $0 == old { old_count++ }
  $0 == new { new_count++ }
  $0 == "plans/in-progress/README.md" { in_progress_index_count++ }
  $0 == "plans/done/README.md" { done_index_count++ }
  $0 == activation { activation_count++ }
  END { exit !(old_count == 1 && new_count == 1 && in_progress_index_count == 1 && done_index_count == 1 && activation_count == 1) }
' "$FERRET_ARCHIVE_SCOPE_PATHS"
rtk awk -v old='plans/in-progress/ferret-init-01-local-cli' -v new="$FERRET_DONE_PLAN" -v activation="$FERRET_ACTIVATION_OWNER" '
  $0 == old { old_count++ }
  $0 == new { new_count++ }
  $0 == "plans/in-progress/README.md" { in_progress_index_count++ }
  $0 == "plans/done/README.md" { done_index_count++ }
  $0 == activation { activation_count++ }
  END { exit !(old_count == 0 && new_count == 1 && in_progress_index_count == 1 && done_index_count == 1 && activation_count == 1) }
' "$FERRET_ARCHIVE_STAGE_PATHS"
rtk git cat-file -e "$FERRET_CANDIDATE_SHA:plans/in-progress/ferret-init-01-local-cli/delivery.md"
rtk git ls-files -- plans/in-progress/ferret-init-01-local-cli >"$FERRET_CANDIDATE_RECORD.old-index-paths"
rtk bash -c 'test ! -s "$1"' _ "$FERRET_CANDIDATE_RECORD.old-index-paths"
rtk xargs -0 -n 1 rtk git ls-files --error-unmatch -- <"$FERRET_ARCHIVE_STAGE_PATHSPEC"
rtk shasum -a 256 "$FERRET_ARCHIVE_SCOPE_PATHS" "$FERRET_ARCHIVE_SCOPE_PATHSPEC" "$FERRET_ARCHIVE_STAGE_PATHS" "$FERRET_ARCHIVE_STAGE_PATHSPEC"
```

Require the scope's five mandatory rows exactly once, the stage inventory's four post-move rows exactly once and
no old-directory row, every additional row to equal an inspected actual-link owner, the old delivery to exist in
the candidate tree but produce no current-index output, every stage row to resolve after `git mv`, and all four
hashes to be recorded externally. Reject duplicate, blank, missing, untracked, newly discovered, or other
non-link-only owners.
Expect no active-plan entry/path and exactly one dated done-plan entry/path. Save every post-checker archive
command, output, and hash only in the external candidate record; never alter tracked evidence after the
candidate checker.

- [ ] [AI] With the same `FERRET_DONE_PLAN`, run:

```bash
rtk ./rhino plan validate
rtk ./rhino md links validate plans
rtk ./rhino md mermaid validate "$FERRET_DONE_PLAN"
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npx markdownlint-cli2 "${FERRET_DONE_PLAN}/**/*.md"
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npx prettier --check "${FERRET_DONE_PLAN}/**/*.md"
rtk git diff --check
```

Expect six zero exits, every discovered backlink resolved, and no diff-check output; save commands/exits in the
external candidate record because the pre-archive tracked evidence is already immutable.

- [ ] [AI] Stage and commit only the lifecycle move/index delta:

```bash
rtk git add --pathspec-from-file="$FERRET_ARCHIVE_STAGE_PATHSPEC" --pathspec-file-nul
rtk git diff --name-status "$FERRET_CANDIDATE_SHA" | rtk sort >"$FERRET_CANDIDATE_RECORD.full-delta"
rtk xargs -0 rtk git diff --name-status "$FERRET_CANDIDATE_SHA" -- <"$FERRET_ARCHIVE_SCOPE_PATHSPEC" | rtk sort >"$FERRET_CANDIDATE_RECORD.scoped-delta"
rtk diff -u "$FERRET_CANDIDATE_RECORD.full-delta" "$FERRET_CANDIDATE_RECORD.scoped-delta"
rtk git diff --cached --name-status | rtk sort >"$FERRET_CANDIDATE_RECORD.cached-delta"
rtk diff -u "$FERRET_CANDIDATE_RECORD.full-delta" "$FERRET_CANDIDATE_RECORD.cached-delta"
rtk git diff --cached --check
rtk git commit -m "docs(plan): archive ferret local cli delivery"
rtk git status --short
FERRET_ARCHIVE_SHA="$(rtk git rev-parse HEAD)"
test "$(rtk git rev-parse 'HEAD^')" = "$FERRET_CANDIDATE_SHA"
```

Require both inventory comparisons and diff-check to exit zero, proving the full candidate/archive delta equals
the exact old-plus-new scope while the post-move staging pathspec names only current index paths. Require only
the plan rename, both indexes, and discovered backlink/activation rewrites; clean status; and a new archive
commit whose sole parent is the checked candidate. Append exact `archive-sha=<FERRET_ARCHIVE_SHA>`, verified
parent, both pathspec hashes, and inventory hashes to the external candidate record.
Any substantive product/spec/rule/evidence change after the checker invalidates its verdict, returns the plan to
`plans/in-progress/`, and requires a new implementation commit/checker pass before another archive attempt.

### Phase 6 Gate

All checks must pass before starting Phase 7.

- [ ] [AI] Run `rtk ./rhino plan validate`. Expect exit 0; append the transcript only
      to the external candidate record.
- [ ] [AI] Run `rtk git diff --check` and `rtk git status --short`. Expect no uncommitted DU-01 change after
      authorized commit and no unrelated file; append the transcript only to the external candidate record.
- [ ] [AI] Replace `<resolved-run-id>` with the Phase 1 value and run
      `rtk rg -n "^step-9: pending-same-pr$" local-tmp/rules-propagation/rules-propagation__<resolved-run-id>__manifest.md`;
      expect exactly one match. Then run
      `rtk rg -n "^final-status: landed$|^pr-url:" local-tmp/rules-propagation/rules-propagation__<resolved-run-id>__manifest.md`;
      expect exit 1 and no output. Append both transcripts only to the external candidate record; any match
      blocks push/PR work and returns to the Phase 1 manifest action. No Phase 6 gate writes a tracked file.

> **Pause Safety:** DU-01's last change-producing boundary is committed locally with archived plan, not yet
> necessarily pushed. Resume with `rtk ./rhino plan validate`.

## Phase 7 — One Exact-Head PR and Rules Step 9

**Input:** immutable Phase 6 DU-01 head and explicit push authority.

**Outcome:** the one implementation PR is exact-head green, rules-propagation Step 9 records terminal `landed`
for that same PR, and `[AI]` completes and verifies the mandatory squash merge.

**Proof:** external
`local-tmp/plan-execution/ferret-init-01-<resolved-run-id>/phase-7/{local,pr,checks,rules-step-9,merge,gate}.txt`
plus PR URL/head/base/check IDs. Phase 7 never writes under the committed done plan.

**Canonical ACs:** AC-CLI-01..12 exact-head delivery proof.

- [ ] [AI] Run this exact local-head packet:

```bash
FERRET_PHASE7_EVIDENCE="local-tmp/plan-execution/ferret-init-01-<resolved-run-id>/phase-7"
FERRET_LOCAL_EVIDENCE="$FERRET_PHASE7_EVIDENCE/local.txt"
mkdir -p "$FERRET_PHASE7_EVIDENCE"
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- ./rhino gate run --surface=pre-push
rtk git fetch origin main
rtk git diff --stat origin/main...HEAD
rtk git diff --name-status origin/main...HEAD
rtk git diff --no-ext-diff --unified=80 origin/main...HEAD
rtk git diff --check origin/main...HEAD
rtk git status --short
rtk git rev-parse HEAD
```

Capture every command/exit at `FERRET_LOCAL_EVIDENCE`. Expect gate/diff-check zero, clean status, one
40-character HEAD, no backend/cloud/frontend/content capture, and generated provenance only at declared
mirrors. Any repair returns to its Phase 1–6 owner and repeats the Phase 6 boundary.

- [ ] [AI] After explicit push/PR authority, run:

```bash
FERRET_BRANCH="ferret-init-01-local-cli"
FERRET_PHASE7_EVIDENCE="local-tmp/plan-execution/ferret-init-01-<resolved-run-id>/phase-7"
FERRET_PR_TITLE="feat(ferret): add standalone local cli"
FERRET_PR_BODY="Deliver FERRET Plan 01: standalone local Python CLI, SQLite retention, POSIX fail-open adapters, Gherkin, and governance. New-code cost: local storage and harness integration. Benefit: durable privacy-bounded usage evidence."
rtk git branch --show-current
rtk git push -u origin "$FERRET_BRANCH"
rtk gh pr list --state open --base main --head "$FERRET_BRANCH" --json number,url,headRefOid,baseRefOid,isDraft
if rtk gh pr view "$FERRET_BRANCH" --json number >/dev/null 2>&1; then
  rtk gh pr edit "$FERRET_BRANCH" --base main --title "$FERRET_PR_TITLE" --body "$FERRET_PR_BODY"
else
  rtk gh pr create --base main --head "$FERRET_BRANCH" --title "$FERRET_PR_TITLE" --body "$FERRET_PR_BODY" --draft
fi
rtk gh pr view "$FERRET_BRANCH" --json url,headRefName,headRefOid,baseRefName,baseRefOid,state,isDraft
```

Expect current branch `ferret-init-01-local-cli`, one pushed branch, exactly one draft PR targeting `main`,
and its `headRefOid` equal local HEAD. Save exact output and 40-character head/base in
`$FERRET_PHASE7_EVIDENCE/pr.txt`; a second PR,
wrong base, or mismatched head blocks.

- [ ] [AI] Poll CI every two minutes without `gh run watch`. Run `rtk gh pr checks --required`; require
      exact-head/base `pr-quality-gate.yml`, applicable finite CLI/spec/rule/binding gates, and one authenticated
      clean current-head `pr-leak-review`. For the leak proof, call the `pr-review-security-maker` Agent in
      leak-only mode with exact PR URL/head/base and prompt “Inspect only sensitive values, protected environment
      properties, machine paths, raw telemetry, SQLite artifacts, and secrets; report current-head PASS or exact
      findings.” Require its final result to be `pass`, all three typed finding counts to be zero, and its posted
      GitHub review to contain the canonical `ose-pr-leak-review:v1` evidence object. Record the server-assigned
      numeric `review-id`, `review-author`, `reviewed-head`, `base-ref`, `base-sha`, `final-status`, and typed counts
      in `$FERRET_PHASE7_EVIDENCE/leak-review-output.json`; record other check IDs/conclusions in
      `$FERRET_PHASE7_EVIDENCE/checks.txt`. A missing/ambiguous review ID, nonzero count, fix, or stale head/base
      restarts Phase 7.
- [ ] [AI] Only after those checks are green, complete rules-propagation Step 9 against this same PR, record PR
      URL/head/base and the recorded `ose-private` obligation (`ferret-python-harness-governance` objective,
      worktree basename, and branch; not executed), and set manifest terminal `final-status: landed`. Run
      `rtk rg -n "final-status: landed|pr-url:|head-sha:" local-tmp/rules-propagation/rules-propagation__<resolved-run-id>__manifest.md`.
      Replace the resolved-run-id with the Phase 1 literal and compare the printed URL/SHA byte-for-byte with
      `$FERRET_PHASE7_EVIDENCE/pr.txt`; expect all three exact values and no second PR. Save
      `$FERRET_PHASE7_EVIDENCE/rules-step-9.txt`.
- [ ] [AI] After all exact-head gates and Step 9 are green, run:

```bash
FERRET_PHASE7_EVIDENCE="local-tmp/plan-execution/ferret-init-01-<resolved-run-id>/phase-7"
FERRET_DONE_PLAN="plans/done/<resolved-date>__ferret-init-01-local-cli"
FERRET_REVIEWED_HEAD="$(rtk gh pr view "$FERRET_BRANCH" --json headRefOid --jq '.headRefOid')"
rtk gh pr ready "$FERRET_BRANCH"
FERRET_PR_NUMBER="$(rtk gh pr view "$FERRET_BRANCH" --json number --jq '.number')"
FERRET_OWNER="$(rtk gh repo view --json owner --jq '.owner.login')"
FERRET_REPO="$(rtk gh repo view --json name --jq '.name')"
FERRET_EXPECTED_REVIEW_AUTHOR="$(rtk gh api user --jq '.login')"
rtk git fetch origin main
rtk gh pr view "$FERRET_BRANCH" --json number,state,isDraft,headRefOid,baseRefOid,mergeStateStatus >"$FERRET_PHASE7_EVIDENCE/pre-merge-pr.json"
FERRET_BASE_SHA="$(rtk jq -er '.baseRefOid' "$FERRET_PHASE7_EVIDENCE/pre-merge-pr.json")"
test "$(rtk jq -r '.state' "$FERRET_PHASE7_EVIDENCE/pre-merge-pr.json")" = OPEN
test "$(rtk jq -r '.isDraft' "$FERRET_PHASE7_EVIDENCE/pre-merge-pr.json")" = false
test "$(rtk jq -r '.headRefOid' "$FERRET_PHASE7_EVIDENCE/pre-merge-pr.json")" = "$FERRET_REVIEWED_HEAD"
test "$FERRET_BASE_SHA" = "$(rtk git rev-parse origin/main)"
test "$(rtk jq -r '.mergeStateStatus' "$FERRET_PHASE7_EVIDENCE/pre-merge-pr.json")" = CLEAN
rtk gh pr checks "$FERRET_BRANCH" --required --json name,state,bucket,workflow >"$FERRET_PHASE7_EVIDENCE/pre-merge-checks.json"
rtk jq -e 'length > 0 and all(.[]; .bucket == "pass")' "$FERRET_PHASE7_EVIDENCE/pre-merge-checks.json"
FERRET_LEAK_REVIEW_ID="$(rtk jq -er '."review-id" | select(type == "number" and . > 0)' "$FERRET_PHASE7_EVIDENCE/leak-review-output.json")"
rtk jq -e --arg head "$FERRET_REVIEWED_HEAD" --arg base "$FERRET_BASE_SHA" --arg author "$FERRET_EXPECTED_REVIEW_AUTHOR" '
  ."final-status" == "pass" and ."reviewed-head" == $head and ."base-ref" == "main" and
  ."base-sha" == $base and ."review-author" == $author and
  ."finding-counts" == {
    "secret_or_private_value": 0,
    "protected_environment_property": 0,
    "machine_specific_absolute_path": 0
  }
' "$FERRET_PHASE7_EVIDENCE/leak-review-output.json"
rtk gh api "repos/$FERRET_OWNER/$FERRET_REPO/pulls/$FERRET_PR_NUMBER/reviews/$FERRET_LEAK_REVIEW_ID" >"$FERRET_PHASE7_EVIDENCE/typed-leak-review.json"
rtk jq -e --arg repository "$FERRET_OWNER/$FERRET_REPO" --argjson pull_request "$FERRET_PR_NUMBER" --arg base_ref main --arg base_sha "$FERRET_BASE_SHA" --arg head_sha "$FERRET_REVIEWED_HEAD" --arg author "$FERRET_EXPECTED_REVIEW_AUTHOR" --argjson review_id "$FERRET_LEAK_REVIEW_ID" '
  . as $review |
  ($review.body | capture("<!-- ose-pr-leak-review:v1\\s*(?<json>\\{.*\\})\\s*-->"; "s").json | fromjson) as $evidence |
  $review.id == $review_id and $review.user.login == $author and $review.state == "COMMENTED" and
  $review.commit_id == $head_sha and
  $review.pull_request_url == ("https://api.github.com/repos/" + $repository + "/pulls/" + ($pull_request | tostring)) and
  $evidence.repository == $repository and $evidence.pull_request == $pull_request and
  $evidence.base_ref == $base_ref and $evidence.base_sha == $base_sha and
  $evidence.head_sha == $head_sha and $evidence.result == "pass" and
  $evidence.counts == {
    "secret_or_private_value": 0,
    "protected_environment_property": 0,
    "machine_specific_absolute_path": 0
  }
' "$FERRET_PHASE7_EVIDENCE/typed-leak-review.json"
rtk gh api graphql -F owner="$FERRET_OWNER" -F name="$FERRET_REPO" -F number="$FERRET_PR_NUMBER" -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved} pageInfo{hasNextPage}}}}}' >"$FERRET_PHASE7_EVIDENCE/review-threads.json"
rtk jq -e '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage == false and ([.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)] | length == 0)' "$FERRET_PHASE7_EVIDENCE/review-threads.json"
printf '%s\n' 'surface-gate=not-applicable:no-browser-ui-or-http-api; CLI-process and POSIX-adapter gates passed' >"$FERRET_PHASE7_EVIDENCE/surface-gate.txt"
test "$(rtk git rev-parse HEAD)" = "$FERRET_REVIEWED_HEAD"
test -z "$(rtk git status --short)"
rtk gh pr merge "$FERRET_BRANCH" --squash
rtk gh pr view "$FERRET_BRANCH" --json state,mergedAt,mergeCommit,headRefOid,baseRefOid
FERRET_MERGE_SHA="$(rtk gh pr view "$FERRET_BRANCH" --json mergeCommit --jq '.mergeCommit.oid')"
rtk git fetch origin main
test "$(rtk gh pr view "$FERRET_BRANCH" --json headRefOid --jq '.headRefOid')" = "$FERRET_REVIEWED_HEAD"
rtk git merge-base --is-ancestor "$FERRET_MERGE_SHA" origin/main
rtk git cat-file -e "origin/main:${FERRET_DONE_PLAN}/delivery.md"
```

Expect merged PR, unchanged reviewed `headRefOid`, nonempty squash `mergeCommit.oid`, merge-commit ancestry,
and archived plan on `origin/main`. The packet re-proves the five hardened preconditions after readiness:
current head/base with no conflict, every required exact-head check, exactly one authenticated current-head leak
review, zero unresolved conversations with pagination exhausted, and the explicit no-browser/no-HTTP surface
exemption backed by applicable CLI/adapter gates. Never test squash-removed reviewed-head ancestry. Save
`FERRET_MERGE_SHA` and transcripts in `$FERRET_PHASE7_EVIDENCE/merge.txt`; Phase 8 is mandatory.

### Phase 7 Gate

All checks must pass after the mandatory merge and before mandatory Phase 8.

- [ ] [AI] Run `rtk gh pr checks --required`. Expect every required check green for the recorded head/base; save
      `$FERRET_PHASE7_EVIDENCE/gate.txt`.
- [ ] [AI] Run `rtk gh pr view "$FERRET_BRANCH" --json state,mergedAt,mergeCommit,headRefOid`; expect the PR
      merged for the reviewed head. Run
      `rtk git merge-base --is-ancestor "$FERRET_MERGE_SHA" origin/main`; expect zero. Append to
      `$FERRET_PHASE7_EVIDENCE/gate.txt`.
- [ ] [AI] Replace `<resolved-run-id>` with the Phase 1 value and run
      `rtk rg -n "^final-status: landed$|^pr-url:|^head-sha:" local-tmp/rules-propagation/rules-propagation__<resolved-run-id>__manifest.md`.
      Expect exactly one status, one URL, and one SHA row. Run
      `FERRET_DONE_PLAN="plans/done/<resolved-date>__ferret-init-01-local-cli"` and
      `rtk diff --unified=0 <(rtk rg "^(pr-url|head-sha):" "$FERRET_PHASE7_EVIDENCE/pr.txt") <(rtk rg "^(pr-url|head-sha):" local-tmp/rules-propagation/rules-propagation__<resolved-run-id>__manifest.md)`;
      expect exit 0 and no output. Append both transcripts to `$FERRET_PHASE7_EVIDENCE/gate.txt`; any mismatch or duplicate row blocks
      readiness and returns to the Step 9 action.
- [ ] [AI] Resolve `candidate-sha` and `archive-sha` from
      `local-tmp/plan-execution/ferret-init-01-candidate.txt` and resolve the recorded scope/stage pathspecs under
      `local-tmp/plan-execution/`. Run `rtk git status --short`,
      `rtk git rev-parse HEAD`, and `rtk git rev-parse 'HEAD^'`; require empty status, HEAD equal both
      `archive-sha` and `FERRET_REVIEWED_HEAD`, and its sole parent equal `candidate-sha`. Re-run the full and
      scope-pathspec sorted inventories, require the same zero diff and both stored pathspec hashes as Phase 6,
      and require only the audited plan rename/index/backlink/activation delta.
      Any other tracked write—including changed plan content under `plans/done/`—invalidates the checker,
      commit, push, CI, leak review, and Phase 7.

> **Pause Safety:** the exact reviewed PR head and its squash merge commit are recorded and verified. Resume with
> `rtk git merge-base --is-ancestor "$FERRET_MERGE_SHA" origin/main`.

## Phase 8 — Terminal Execution Audit and Post-Merge Cleanup

**Input:** the verified Phase 7 squash merge commit, unchanged reviewed PR head, and zero-finding Phase 6 checker
report.

**Outcome:** the calling plan-execution workflow's Step 11 terminal completeness audit reports `pass`, merge-
commit containment remains on `origin/main`, and only then are worktree/branches cleaned.

**Proof:** exact `local-tmp/plan-execution/plan-execution__<resolved-run-id>__validation.md`, merge ancestry,
branch classification, and cleanup transcript in the external execution record.

**Canonical ACs:** terminal end-to-end proof for AC-CLI-01..12.

- [ ] [AI] Run `rtk git fetch origin main`,
      `rtk git merge-base --is-ancestor "$FERRET_MERGE_SHA" origin/main`, and
      `rtk git cat-file -e "origin/main:${FERRET_DONE_PLAN}/delivery.md"`. Expect three zero exits. Never test
      reviewed-head ancestry after a squash merge. Save merge/plan containment in the Step 11 evidence.
- [ ] [AI] Continue the already-calling top-level plan-execution workflow at Step 11 with this exact controlled
      input; do not recursively invoke `repo-governance/workflows/plan/plan-execution.md`:

```text
Run Step 11 terminal completeness audit for plan-path=<resolved FERRET_DONE_PLAN>, delivered-ref=<FERRET_MERGE_SHA>, reviewed-pr-head=<FERRET_REVIEWED_HEAD>, max-iterations=10, max-concurrency=3.
Use the Phase 6 independent plan-execution-checker report only if its candidate-ref equals FERRET_REVIEWED_HEAD and no post-checker product/spec/rule change occurred; otherwise make a fresh plan-execution-checker Agent call against FERRET_MERGE_SHA.
Require checker Status Complete and Total Findings 0, verify mergeCommit.oid containment and done-plan presence, then write the calling workflow report local-tmp/plan-execution/plan-execution__<resolved-run-id>__validation.md with final-status: pass. Do not clean up on partial/fail.
```

Resolve the checker/workflow report paths and run
`rtk rg -n "^\*\*Status\*\*: Complete$|^\*\*Total Findings\*\*: 0$" local-tmp/plan-execution/<resolved-checker-report>.md`
and
`rtk rg -n "^final-status: pass$" local-tmp/plan-execution/plan-execution__<resolved-run-id>__validation.md`.
Expect two checker matches and one workflow match. Any finding/other status reopens its earliest owner and
forbids cleanup.

- [ ] [AI] From a new shell, execute `repo-governance/workflows/dev-artifact-clean-up.md` with the exact packet
      below. It is the same-document implementation of that mandatory terminal node, not a replacement for its
      rules:

```bash
set -euo pipefail
FERRET_PRIMARY="$(rtk git worktree list --porcelain | rtk awk '/^worktree /{print substr($0,10); exit}')"
FERRET_WORKTREE="$FERRET_PRIMARY/worktrees/ferret-init-01-local-cli"
FERRET_BRANCH="ferret-init-01-local-cli"
FERRET_PR_NUMBER="$(rtk gh pr view "$FERRET_BRANCH" --json number --jq '.number')"
FERRET_REVIEWED_HEAD="$(rtk gh pr view "$FERRET_BRANCH" --json headRefOid --jq '.headRefOid')"
FERRET_MERGE_SHA="$(rtk gh pr view "$FERRET_BRANCH" --json mergeCommit --jq '.mergeCommit.oid')"
FERRET_OWNER="$(rtk gh repo view --json owner --jq '.owner.login')"
FERRET_REPO="$(rtk gh repo view --json name --jq '.name')"
FERRET_MERGED_AT="$(rtk gh pr view "$FERRET_BRANCH" --json mergedAt --jq '.mergedAt')"
FERRET_CLEANUP_EVIDENCE="$FERRET_PRIMARY/local-tmp/plan-execution/ferret-init-01-<resolved-run-id>/cleanup"
mkdir -p "$FERRET_CLEANUP_EVIDENCE"
cd "$FERRET_PRIMARY"
test "$(pwd -P)" = "$FERRET_PRIMARY"
test "$(rtk git branch --show-current)" = main
test -z "$(rtk git status --short)"
test -z "$(rtk git -C "$FERRET_WORKTREE" status --short)"
test "$(rtk git -C "$FERRET_WORKTREE" rev-parse HEAD)" = "$FERRET_REVIEWED_HEAD"
rtk git worktree list --porcelain >"$FERRET_CLEANUP_EVIDENCE/worktrees-before.txt"
rtk git -C "$FERRET_WORKTREE" clean -ndX >"$FERRET_CLEANUP_EVIDENCE/ignored-build-artifacts.txt"
rtk docker compose ls --format json >"$FERRET_CLEANUP_EVIDENCE/compose-before.json"
rtk docker ps --format '{{json .}}' >"$FERRET_CLEANUP_EVIDENCE/containers-before.jsonl"
rtk git fetch origin main
rtk git merge-base --is-ancestor "$FERRET_MERGE_SHA" origin/main
FERRET_LOCAL_TIP="$(rtk git rev-parse "$FERRET_BRANCH")"
test "$FERRET_LOCAL_TIP" = "$FERRET_REVIEWED_HEAD"
FERRET_REMOTE_TIP="$(rtk git ls-remote --heads origin "refs/heads/$FERRET_BRANCH" | rtk awk '{print $1}')"
```

The ignored-artifact inventory is evidence, not permission to delete paths independently: app `.venv`, `dist`,
coverage, pytest, and manual local-tmp outputs are contained by the positively owned worktree and disappear with
its non-force removal. Shared uv/npm/Nx caches remain. Plan 01 starts no Docker stack; if the Docker inventory
shows a possible FERRET resource, stop because no positive session ownership exists.

- [ ] [AI] Continue with exactly one branch route:

```bash
if test -n "$FERRET_REMOTE_TIP"; then
  test "$FERRET_REMOTE_TIP" = "$FERRET_REVIEWED_HEAD"
  rtk git fetch origin "refs/heads/$FERRET_BRANCH:refs/remotes/origin/$FERRET_BRANCH"
  test "$(rtk git rev-parse "refs/remotes/origin/$FERRET_BRANCH")" = "$FERRET_REVIEWED_HEAD"
  rtk git branch --set-upstream-to="origin/$FERRET_BRANCH" "$FERRET_BRANCH"
  rtk git worktree remove "$FERRET_WORKTREE"
  rtk git branch -d "$FERRET_BRANCH"
  test "$(rtk git ls-remote --heads origin "refs/heads/$FERRET_BRANCH" | rtk awk '{print $1}')" = "$FERRET_REVIEWED_HEAD"
  rtk git push origin --delete "$FERRET_BRANCH"
else
  test "$(rtk gh api "repos/$FERRET_OWNER/$FERRET_REPO" --jq '.delete_branch_on_merge')" = true
  rtk gh api graphql -F owner="$FERRET_OWNER" -F name="$FERRET_REPO" -F number="$FERRET_PR_NUMBER" -f query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){timelineItems(first:100,itemTypes:[HEAD_REF_DELETED_EVENT]){nodes{... on HeadRefDeletedEvent{createdAt}} pageInfo{hasNextPage}}}}}' >"$FERRET_CLEANUP_EVIDENCE/head-ref-deleted.json"
  rtk jq -e --arg merged "$FERRET_MERGED_AT" '.data.repository.pullRequest.timelineItems.pageInfo.hasNextPage == false and any(.data.repository.pullRequest.timelineItems.nodes[]; .createdAt >= $merged)' "$FERRET_CLEANUP_EVIDENCE/head-ref-deleted.json"
  rtk git merge-base --is-ancestor "$FERRET_MERGE_SHA" origin/main
  test "$(rtk git rev-parse "$FERRET_BRANCH")" = "$FERRET_REVIEWED_HEAD"
  rtk git worktree remove "$FERRET_WORKTREE"
  if ! rtk git branch -d "$FERRET_BRANCH"; then
    rtk git branch -D "$FERRET_BRANCH"
  fi
fi
```

A live-ref tip mismatch retains everything and escalates. The absent-ref route reaches `branch -D` only after
all four canonical proofs: local tip, merge containment, enabled auto-delete, and the exact post-merge deletion
event. Worktree removal is never forced.

- [ ] [AI] Finish reconciliation from the still-valid primary checkout:

```bash
rtk git worktree prune
FERRET_OLD_MAIN="$(rtk git rev-parse HEAD)"
rtk git fetch origin main
rtk git diff --stat "$FERRET_OLD_MAIN..origin/main"
rtk git diff --name-status "$FERRET_OLD_MAIN..origin/main"
rtk git diff --no-ext-diff --unified=80 "$FERRET_OLD_MAIN..origin/main"
rtk git merge --ff-only origin/main
test "$(rtk git rev-list --left-right --count HEAD...origin/main)" = "0 0"
test -z "$(rtk git status --short)"
test -z "$(rtk git worktree list --porcelain | rtk rg 'worktrees/ferret-init-01-local-cli' || true)"
set +e
rtk git show-ref --verify "refs/heads/$FERRET_BRANCH"
FERRET_LOCAL_STATUS=$?
rtk git ls-remote --exit-code --heads origin "refs/heads/$FERRET_BRANCH"
FERRET_REMOTE_STATUS=$?
set -e
test "$FERRET_LOCAL_STATUS" -eq 1
test "$FERRET_REMOTE_STATUS" -eq 2
```

Require all commands and the final Phase 8 gate to pass. An unexpected path, dirty checkout, missing deletion
event, pagination remainder, tip mismatch, live Docker resource, or divergence retains evidence and blocks
completion.

### Phase 8 Gate

All checks must pass before declaring terminal completion.

- [ ] [AI] Rerun the exact resolved
      `rtk rg -n "^final-status: pass$" local-tmp/plan-execution/plan-execution__<resolved-run-id>__validation.md`;
      expect exactly one match.
- [ ] [AI] Run `rtk git merge-base --is-ancestor "$FERRET_MERGE_SHA" origin/main` and
      `rtk git cat-file -e "origin/main:${FERRET_DONE_PLAN}/delivery.md"`; expect both zero.
- [ ] [AI] Run `rtk git worktree list --porcelain`,
      `rtk git show-ref --verify "refs/heads/$FERRET_BRANCH"`, and
      `rtk git ls-remote --exit-code --heads origin "refs/heads/$FERRET_BRANCH"`. Expect the FERRET worktree
      absent, local branch command exit 1, remote command exit 2, and no unexplained retained branch. Publish
      containment/cleanup proof and unblock Plan 02 only now.

> **Pause Safety:** delivery, terminal audit, archive, and cleanup are complete. Re-verify with the exact
> resolved `rtk rg -n "final-status: pass" <resolved-plan-execution-report>` command.
