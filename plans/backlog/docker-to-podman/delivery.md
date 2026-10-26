# Delivery: Docker to Podman

**Executor legend:** `[AI]` is executable by the authorized delivery agent; `[HUMAN]` is a named
manual handoff. This plan has no planned human approval gate. A missing machine, credential, or
rootless capability is a blocker to report, not permission to pretend its proof exists.

The current authorization creates this backlog plan and its dependency updates only. It does not
execute the runtime migration. Future execution requires explicit authorization for that work.

plan-quality-gate: PASS (3 cycles, 0 open findings).

## Worktree

Worktree path: `worktrees/docker-to-podman/`.

Provisioning status: **pending**. These plan artifacts are an authorized deliverable in the existing
`worktrees/ose-public-plans-update/` planning worktree, where the user requested that the current
planning changes remain together. No runtime implementation or new worktree is authorized during
plan authoring. Do not invent a provisioned identity or branch inventory.

On execution, the plan-execution Step 0 gate resolves that route from the repository root and
creates or enters the one matching worktree from current `origin/main`. Record its actual initial
branch, creator/session, creation timestamp, and repository-relative path before implementation.
Append every delivery branch before use to the Delivery Branch Inventory. Reuse that one worktree
for all phases; no sibling `*-worktrees` route and no worktree inside another worktree.

The inventory is created only when provisioning has occurred. Each eventual PR entry records its
merged PR and 40-character reviewed head; each branch is classified as delivered, unused, or
retained/escalated before cleanup. Never store machine names or resolved home paths in tracked docs.

See [Worktree setup](../../../repo-governance/development/workflow/worktree-setup.md) and the
[worktree specification](../../../repo-governance/conventions/structure/plans/worktree-specification.md).

## Delivery Mode: worktree-to-pr

`main` is the sole integration target. One coherent runtime-switch PR contains phases 1–5,
archival, and their code, tests, rules, docs, specifications, and generated routes. A separate
promotion-only PR lands before Phase 0. Phase 0 itself opens no PR. Archival lands inside the
runtime-switch PR before its final exact-head/base CI and merge; final delivery proof follows merge.

The minimum shippable seam is the complete operational runtime switch: shared toolchain
requirements, runner defaults, CI consumers, and docs must agree. Do not merge individual phases
or half the container callers. No production-disabled feature flag is needed because no partial
new product behavior lands. The existing main remains usable while this work stays unmerged.

### Commit Guidelines

- Do not stage or commit a change set until its delivery is explicitly authorized by the user.
- Once authorized, use the fewest build-valid, independently reviewable and revertible Conventional
  Commits, keeping required specs, tests, docs, generated mirrors, and rollback with their behavior.
- PR bodies state new-code cost/benefit: the small rootless preflight replaces duplicated shell
  checks; one setup action replaces the Docker setup action. No new runtime-selection framework.
- Fresh-context leak review judges each push and merge head. The exact current head/base must pass
  `.github/workflows/pr-quality-gate.yml`. Broad semantic PR review runs only when requested.
- After any new commit lands, read its full diff and reconcile this plan, touch ledger, active
  decisions, and test evidence before continuing. Never change Git identity.

## Parallelization Model

Use **N=3 workers plus one coordinator**, the repository default. Dispatch code/config changes to
the fitting SWE agents. The rules-fixer owns canonical rule propagation; generated bindings are
produced by Rhino, never handwritten.

```mermaid
flowchart TD
  accTitle: Podman delivery dependency graph
  accDescr: Baseline precedes three disjoint implementation packets, which join at integrated proof, same-unit propagation, delivery, knowledge capture, archival, and cleanup.
  P0["P0: inventory<br/>and baseline"] --> P1A["P1A: preflight<br/>and toolchain"]
  P0 --> P1B["P1B: Go runner"]
  P1A --> P2["P2: Compose<br/>and CI callers"]
  P1B --> P3["P3: integrated proof<br/>and data rehearsal"]
  P2 --> P3
  P3 --> P4["P4: rules and docs<br/>bindings, delivery"]
  P4 --> P5["P5: knowledge<br/>capture"]
  P5 --> Archive["Archival in the<br/>runtime-switch PR"]
  Archive --> Merge["Final CI and merge<br/>terminal audit"]
  Merge --> Clean["Owned artifacts<br/>branch and worktree<br/>cleanup"]
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

P1A and P1B write disjoint paths and may run concurrently. P2 waits for the shared preflight and
runtime contract; its two packets (local stack callers and CI) may run concurrently with distinct
owners. Shared `package.json`, `repo-config.yml`, workflow inputs, action names, catalog tags, and
spec/coverage mappings serialize through their named owner. P3 waits for every implementation
packet. P4 may prepare documentation drafts earlier but cannot complete against a changing design.
All paths land in the same runtime-switch unit.

### Delivery Boundaries

| Unit           | Change-producing phases  | Deployable state                                                                                                                                  |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Promotion      | Before Phase 0 only      | Pure plan move and forced index/status/link updates; no runtime change.                                                                           |
| Runtime switch | Phases 1–5 plus archival | Every operational caller, rule, test, doc, and binding uses the proven Podman contract; knowledge capture and archived plan land in this same PR. |

Phase 0 contributes baseline evidence to the runtime unit but opens no implementation PR. The
post-merge terminal audit produces final-delivery proof; it does not create a speculative follow-up
archival PR. Any bounded knowledge-capture edit is reverified before the same delivery PR merges.

Only `ose-public` is mutated. Static checks are ephemeral/light; normal focused tests are
ephemeral/standard; full E2E and image builds use the measured standard/heavy tier; installation
and shared-output regeneration are transactional/standard; running stacks are service/standard.
Every compute process enters HIPPO on its executing host. Independent checks may overlap only
after complete HIPPO admission; dependency, shared-output, byte-identity, and transactional edges
still serialize. CI uses the same host-boundary rule, not a local wrapper around transport.

Cleanup is the terminal node and depends on every delivery node, including the post-delivery
audit. It invokes [Dev Artifact Clean-Up](../../../repo-governance/workflows/maintenance/dev-artifact-clean-up.md)
and its ownership checks. Neither peer worktree is an owned cleanup target.

## Evidence contract

Use `evidence/P0/` through `evidence/P5/` for sanitized durable summaries with revision, command,
working directory, tool versions, HIPPO admission, exit code, executed test identities/counts, and
attributable logs. Raw logs and backups stay in ignored `local-tmp/plan/docker-to-podman/`.
An absent output, missing host, unrun job, or cache hit is not fresh runtime evidence. Capture RED
and GREEN for behavioral changes; static formatting is not a substitute for executable proof.

Use the commands below at the execution worktree root. When a command is a template, first freeze
its concrete project or fixture selection in the phase evidence and execute that recorded value.
Never run production/shared-system examples or publish an image solely to validate documentation.

## Before Phase 0: Pure Promotion

- [ ] [AI] Classify the promotion state through the repository's promotion-recovery procedure.
      On its own short-lived branch, move `plans/backlog/docker-to-podman/` to
      `plans/in-progress/docker-to-podman/`, and make only the forced status/link/three-index/DAG
      changes. Deliver that promotion-only PR with current-head/base CI and leak review before
      provisioning the execution worktree or starting Phase 0. Rebase shared plan indexes on current
      main before merge; retain proof of the merged promotion and clean up its temporary branch.

## Phase 0: Environment Setup, Inventory, and Baseline

- **Input:** execution authorization, current main, [scope](./README.md#scope-and-boundaries), and
  AC-01 through AC-10.
- **Outcome:** a cleanly attributed baseline and exact operational caller inventory before edits.

- [ ] [AI] Re-read `AGENTS.md`, the repository adapter, this plan, worktree setup, resource rules,
      and active user decisions. Run `rtk git status --short` and `rtk git worktree list --porcelain`;
      reconcile with the touch ledger. If either peer worktree has changed, record new metadata locally
      without changing its files, branches, processes, or pause state. Proof: `evidence/P0/baseline.md`.
- [ ] [AI] Verify the promotion-only PR is already merged and `origin/main` contains the plan only
      at its in-progress path. Complete execution Step 0 for `worktrees/docker-to-podman/`, sync with
      that trunk, and record actual worktree identity and Delivery Branch Inventory. No implementation
      begins while promotion or provisioning remains pending.
- [ ] [AI] Bootstrap dependencies/hooks at that worktree root with
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install`,
      then `rtk npm run doctor`. Only on reported drift, run the documented
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply`
      and doctor again. Record missing provision recipes as blockers, never bypass them.
- [ ] [AI] Freeze the Docker caller inventory using `rtk rg -n -i 'docker|buildx|podman|testcontainers'`
      over `package.json`, `repo-config.yml`, `apps`, `infra`, `.github`, `scripts`, active rules/docs,
      agents, and canonical skills. Exclude content, generated mirrors, caches, and historical trees
      from editing. Expand the [file-impact families](./tech-docs.md#file-impact-analysis) to exact
      paths, classify each retained mention, and record supported versus unsupported stacks in
      `evidence/P0/runtime-inventory.md` before changing any caller.
- [ ] [AI] Record content-tree hashes and peer-worktree revision/dirty-path inventories through
      read-only commands. Keep sensitive/absolute-path output local; publish only repository-relative
      summary and hashes. Include any shared content root already landed by execution time. Proof:
      `evidence/P0/exclusions.md` records AC-09's comparison base.
- [ ] [AI] Inspect current-main versions of plan-10-related build/shard paths against the checkpoint
      intent recorded in the technical design. Record whether the local-image and shard-selection
      repairs have landed. Never cherry-pick or copy peer WIP as a shortcut. Proof: the inventory
      explains how AC-05 will cover the discovered local-store constraint.
- [ ] [AI] Read the bounded `project.json` set and direct workflow callers named in the
      [affected target matrix](./tech-docs.md#affected-project-target-matrix). Run every listed target
      once as an individual command using
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run <project>:<target>`;
      use heavy only when the admitted resource estimate requires it. Run sequentially where targets
      share outputs. Record each fully expanded command, revision, and exit code; record fresh
      executed/passed counts for test targets, scenario/mapping counts for `test:coverage:behaviour`,
      and diagnostics for build/lint/typecheck. Positive tests must execute at least one case; if a
      declared target is compile-only, record its configured reason and the adjacent test target
      that supplies behavior coverage. If a
      directly named workflow caller points to another project or target, add only that proven caller
      to the matrix and explain the discovery. Do not widen the scan beyond these files or infer work
      from naming similarity. Repair baseline failures at root cause.
- [ ] [AI] Inventory readable owned stack metadata: volume IDs, service image versions,
      disposable/durable classification, and current ports. Preserve unrelated workloads. Record a
      service-specific backup/restore packet for every durable service; no production secrets or
      exports enter tracked evidence. Build separate Podman pin rows for each CI `runs-on` label plus
      evaluated runner Ubuntu release/architecture and each supported local Ubuntu release/
      architecture. Different tuple rows may pin different signed-archive versions; record the
      runner image identifier and compare drift only within the same tuple. On macOS record
      `uname -m`, the official 6.1.4 architecture-specific `.pkg` asset URL and published digest,
      byte size, and accepted package-signature result. If official integrity material is absent or
      rejected, stop. Proof: `evidence/P0/install-inventory.md`.
- [ ] [AI] On each recorded Ubuntu tuple, recheck `apt-cache policy podman` and its recorded origin,
      then install that row's exact pin with the HIPPO transactional package command below. Do not
      require CI and local Ubuntu to use the same version; do not accept a candidate/origin change
      within a tuple. Capture `python3 --version`, `pipx --version`, and the approved Python path.
- [ ] [AI] Install Podman Compose and the macOS package in the one copyable HIPPO transactional
      packet below. Set the reviewed package/version/digest inputs and macOS machine-presence value
      from the P0 inventory for the executing platform; on
      Ubuntu, the package version/origin must match that tuple's row; on macOS, the package version
      remains 6.1.4. The pipx environment, resolver inventory, wheel hashes, checksum verification,
      and installer actions stay inside the admitted command. Do not alter `HOME`, disable host
      security controls, change global kernel policy, or use system Python overrides.

  ```bash
  PODMAN_PINNED_VERSION='<tuple package version>' \
  PODMAN_INSTALLER_URL='<verified official 6.1.4 asset URL; macOS only>' \
  PODMAN_INSTALLER_SHA256='<published digest; macOS only>' \
  PODMAN_MACHINE_PRESENT='<true or false from the P0 macOS inventory>' \
  rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- bash -euo pipefail -c '
    case "$(uname -s)" in
      Linux)
        test -n "$PODMAN_PINNED_VERSION"
        sudo apt-get install --yes "podman=$PODMAN_PINNED_VERSION"
        ;;
      Darwin)
        test -n "$PODMAN_INSTALLER_URL"
        test -n "$PODMAN_INSTALLER_SHA256"
        verify_dir="$(mktemp -d "${TMPDIR:-/tmp}/podman-6.1.4.XXXXXX")"
        curl --fail --location --show-error "$PODMAN_INSTALLER_URL" --output "$verify_dir/podman.pkg"
        printf "%s  %s\\n" "$PODMAN_INSTALLER_SHA256" "$verify_dir/podman.pkg" | shasum -a 256 -c -
        pkgutil --check-signature "$verify_dir/podman.pkg"
        spctl --assess --type install --verbose "$verify_dir/podman.pkg"
        sudo installer -pkg "$verify_dir/podman.pkg" -target /
        case "$PODMAN_MACHINE_PRESENT" in
          false) podman machine init --rootful=false ;;
          true) ;;
          *) echo "Machine-presence input must match the P0 inventory" >&2; exit 2 ;;
        esac
        ;;
      *) echo "Unsupported installation host" >&2; exit 2 ;;
    esac
    pipx install --python "$(command -v python3)" podman-compose==1.6.0
    pip_meta_dir="$(mktemp -d "${TMPDIR:-/tmp}/podman-compose-meta.XXXXXX")"
    pipx runpip podman-compose freeze > "$pip_meta_dir/requirements.txt"
    pip_wheel_dir="$(mktemp -d "${TMPDIR:-/tmp}/podman-compose-wheels.XXXXXX")"
    python3 -m pip download --dest "$pip_wheel_dir" --requirement "$pip_meta_dir/requirements.txt"
    if command -v sha256sum >/dev/null 2>&1; then (cd "$pip_wheel_dir" && sha256sum *) > "$pip_meta_dir/wheel-sha256.txt"; else (cd "$pip_wheel_dir" && shasum -a 256 *) > "$pip_meta_dir/wheel-sha256.txt"; fi
    cat "$pip_meta_dir/requirements.txt" "$pip_meta_dir/wheel-sha256.txt"
    podman-compose --version
  '
  ```

- [ ] [AI] On macOS, start the already initialized Machine as a HIPPO service-class operation:
      `rtk ./hippo run --class service --resource-tier standard --disk-path . -- podman machine start`.
      Set `PODMAN_COMPOSE_PROVIDER="$(command -v podman-compose)"` at each later Compose entry point.
      On every supported tuple capture `podman version`, `podman info --format json`, and require
      `podman info --format json | jq -e '.host.security.rootless == true'`; macOS also records
      `podman machine list` and `podman system connection list`. Prove cgroup delegation, DNS, and
      mount ownership before coding. If any rootless capability is unsupported, stop without
      weakening host security or changing kernel policy. These are future execution instructions;
      this plan-fixer run must not run an installer, create/start a machine, or start a container.

### Phase 0 Gate

- [ ] [AI] Confirm every AC maps to an owned implementation/test packet, all baseline failures have
      root-cause dispositions, installation origins/versions are recorded, and no inventory path
      extends the approved scope. Proof: `evidence/P0/readiness.md`; all prerequisite commands exit 0.

> **Pause Safety**: current-main runtime behavior is intact; only attributed setup and inventory
> exist. Re-verify with `rtk git status --short` and the recorded P0 baseline command packet.

## Phase 1: Rootless Preconditions and Example Runner

### AC-01–AC-03 — Shared shell preflight and tool declarations

- **Input:** P0 package/capability matrix and exact shell/npm/CI entry points.
- **Outcome:** one small shell check rejects unreachable/rootful engines and missing providers
  before any workload mutation.
- [ ] [AI] Write Gherkin first using the feature owners and exact scenario titles in the
      [runner behavior specification delta](./tech-docs.md#runner-behavior-specification-delta).
      Add only the named scenarios. Bind Unit to pure decisions and native build/local-image argv,
      Integration to fake executables and call ordering, and E2E to a rootless Podman host and the
      selected provider. Preserve the recorded E2E exemption for a real rootful engine because it
      would mutate shared runtime state; the fake Unit/Integration proof is required.
- [ ] [AI] **RED:** add `scripts/container-runtime-check.test.mjs` (new) using Node's existing test
      runner and fake executables. Cover rootless success, rootful refusal before workload invocation,
      unavailable/missing engine, missing/wrong provider, and explicit provider selection even when
      Docker Compose is installed. Run
      `rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- node --test scripts/container-runtime-check.test.mjs`;
      expect assertion failure for absent preflight behavior, not a syntax/import failure. Save RED.
- [ ] [AI] **GREEN:** implement `scripts/container-runtime-check` (new), add its test to the existing
      `test:validators` script, and replace Docker's tool declaration with Podman/provider checks in
      `repo-config.yml`. Use `swe-developer` for config/code. Repeat the RED command and doctor; expect
      all cases and native tool checks to pass without a Docker requirement. Save GREEN.
- [ ] [AI] **REFACTOR:** keep the preflight limited to reachability/rootless/provider checks and
      existing diagnostic conventions. Run `rtk npm run test:validators`, declared shell lint, and
      the focused cases; expect the same outcomes and no new framework/dependencies. Save proof.
- **Proof:** `evidence/P1/preflight.md`, test identities, fake call log showing no rootful mutation,
  and doctor output on both supported platforms.
- _Suggested executor: `swe-developer`._

### AC-04–AC-06 — Runner default, native builds, isolation, and cleanup

- **Input:** existing Gherkin corpus, container-plan tests, runner fixtures, and P0 capability proof.
- **Outcome:** Podman runs the same fixture contracts without Buildx or a separate builder store.
- [ ] [AI] Write Gherkin first under `specs/apps/ayokoding/cli/behaviours/`: extend the existing
      environment-failure/toolchain scenarios for Podman default, rootful refusal, and same-store
      derived/environment builds. Map every new scenario in the existing coverage configuration and
      Unit/Integration/E2E bindings. Revalidate Docker-specific exemption reasons against Podman; do
      not weaken their assertions or stop any shared engine.
- [ ] [AI] **RED:** extend `internal/domain/containerplan/{build,run,services}_test.go` and the
      existing adapters/CLI tests for default `podman`, native build argv, no BuildKit cache flags,
      keep-id mapping, local-only images, and rootful refusal. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-cli:test:unit`;
      expect assertion failures against Docker-specific behavior. Save `evidence/P1/runner-red.md`.
- [ ] [AI] **GREEN:** update only the inventoried Go planner, runtime adapter, CLI settings readers,
      and their fixture responses. Preserve runtime override, code/status/output contracts, tags,
      platform selection, effective ownership, resource flags, service DNS, and ownership cleanup.
      Remove Buildx-cache settings/readers; do not invent a replacement env var. Rerun the same target
      and existing Integration target; expect all applicable cases to pass with positive counts.
- [ ] [AI] **REFACTOR:** remove now-dead cache/Buildx branches and duplicated runtime defaults while
      retaining the current module boundaries. Run
      `rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-cli:test:quick`
      and `ayokoding-cli:test:coverage:behaviour` through the same boundary. Preserve the 99% floor,
      scenario identities, and applicable coverage layers; record any new scenarios explicitly.
- [ ] [AI] Run real `ayokoding-cli:test:integration` and `ayokoding-cli:test:e2e` under HIPPO using
      rootless Podman. Exercise runner-owned service, lockfile, cancellation, and orphan-cleanup
      fixtures. Verify resource/ownership/network assertions against actual inspect data; prove a
      derived image and environment run without a registry copy. Save AC-04–AC-06 proof.
- **Proof:** `evidence/P1/runner.md` includes failing/passing deltas, exact test counts, tool versions,
  same-store IDs, inspect assertions, and zero remaining positively owned execution resources.
- _Suggested executor: `swe-developer`._

### Phase 1 Gate

- [ ] [AI] Run the new preflight tests, `rtk npm run doctor`, and `ayokoding-cli:test:quick` plus its
      Integration/E2E targets with the P0 commands and tiers. All exit 0; exclude no prior test and
      retain excluded-content hashes. Rootful and unavailable-runtime negative cases fail correctly.

> **Pause Safety**: focused code and tests are coherent in the unmerged delivery worktree; main
> still uses its existing runtime. Re-verify with the Phase 1 quick-gate command above.

## Phase 2: Compose Callers and CI Publication

### AC-03 and AC-07 — Development and container-backed test entry points

- **Input:** P1 shared preflight, exact P0 active-stack and caller inventory.
- **Outcome:** supported entry points start, inspect, copy artifacts, and tear down owned Podman
  resources on the same ports without requiring Docker Compose.
- [ ] [AI] **RED:** add discriminating fake-command regression cases to the preflight test or the
      existing caller's test seam for provider export, preflight-before-start, status preservation,
      and owned teardown on failure/interruption. Validate Compose files with the selected provider;
      capture the current Docker-only invocation or provider-incompatibility failure, not just a
      search assertion. Run the focused Node test command from P1 and save RED.
- [ ] [AI] **GREEN:** migrate `package.json` container entry points and actual backend E2E shell
      callers to the preflight plus explicitly selected `podman compose`. Adapt only reproduced
      Compose incompatibilities and provider labels. Correct Integration comments while leaving
      native Integration tests native. Preserve existing resource/port/env boundaries and unsupported
      scaffold status. Repeat focused cases, Compose config validation, and the concrete backend
      E2E targets captured in P0; save passing proof.
- [ ] [AI] Execute the exact site/backend ownership order in the
      [current stack command packet](./tech-docs.md#current-stack-command-packet): Ayo's prerender
      artifact copy happens before BE E2E and before stopping the owned 3101 Podman stack; stop that
      stack before FE E2E because Playwright owns a fresh native server on 3101. OSE's unqualified
      BE/FE E2E targets remain native fixture-server proof on 3190; do not claim that they hit the
      Podman service on 3100. OrganicLever FE E2E runs while it can reuse the existing Podman server
      on 3200. Run each backend E2E target without pre-starting its dependency Compose stack; the Nx
      target's shell runner owns startup and cleanup. Keep the unsupported legacy app-scaffold
      callers syntax/caller proof only, not supported-stack runtime evidence.
- [ ] [AI] **REFACTOR:** remove duplicate runtime checks and stale Docker operational comments from
      these callers only. Run shell/TypeScript/Compose lint applicable to touched paths and rerun
      their focused cases. No new command wrapper beyond the shared small preflight is introduced.
- **Proof:** `evidence/P2/local-stacks.md`; exact supported stacks, rootless/provider output,
  health checks and ports, and a separate syntax-only disposition for unsupported scaffolds.
- _Suggested executor: `swe-developer`._

### AC-07 — Shared CI setup and existing image publication

- **Input:** P1 runtime contract and P0 package-version/runner inventory.
- **Outcome:** every CI container job uses Podman with the same external image contract.
- **Pre-merge evidence boundary:** prove the two native backend image builds locally with temporary
  tags, inspect/start them using rootless Podman, and exercise the auth command with a fake registry
  CLI that records arguments but receives no credential. Compare repository names, `latest` and
  commit-SHA tag construction, permissions, and existing triggers against the current workflow.
  This proves build/auth/tag construction without publishing and does not satisfy AC-07 publication.
- [ ] [AI] **RED:** extend existing workflow/validator test seams for the new setup action's
      rootless/provider failure behavior and unchanged caller inputs/triggers. Model the old
      Docker-dependent path with fake executables, and assert native build/publish argument behavior
      without touching a registry. Run `rtk npm run test:validators` and the existing actionlint gate;
      retain the behavioral RED output separately from expected syntax validation.
- [ ] [AI] **GREEN:** create `.github/actions/setup-podman/action.yml` (new) with the exact validated
      native provider version and the Ubuntu package pin selected for the executing runner tuple;
      reject any within-tuple OS/architecture/image/origin drift and rootless assertion failure.
      Replace all inventoried setup-action
      callers, change the web workflow's stop input and every caller together, use `podman cp`, and
      remove Buildx env/cache rotation. Replace both image-publication paths with ephemeral-auth
      `podman login --password-stdin`, native build, and push. Keep GHCR names/tags/triggers and
      permissions. Remove the old Docker action only after all callers migrate. Repeat validators.
- [ ] [AI] **REFACTOR:** remove dead setup/cache branches and ensure no job depends on a Docker
      daemon, Buildx action, or Docker login action. Run the existing actionlint, shell, YAML,
      validator, and harness-enforcement checks over these files. Use no new registry-cache service.
- [ ] [AI] Complete the pre-merge evidence boundary above without contacting GHCR. Save local
      build/start/inspect outputs, fake auth-call trace with no token or credential value, and the
      exact existing tag/trigger comparison in `evidence/P2/publishing.md`. Mark publication as
      pending until the existing authorized workflow trigger runs after merge; do not claim AC-07
      complete from local proof or a fake registry call.
- **Proof:** `evidence/P2/ci.md` and `publishing.md`; caller inventory, assertion proof, image-start
  results, credential-handling checks, and preserved trigger/tag/permission comparison.
- _Suggested executor: `swe-developer`._

### Phase 2 Gate

- [ ] [AI] Every active runtime caller in P0 has a migrated owner/path and passing focused proof;
      every retained Docker mention has an allowed classification. Both native image builds and
      supported Compose stacks work. No peer work or lesson hash changed. Run validators plus the
      concrete P0 backend/public-site test commands; all applicable outputs exit 0.

> **Pause Safety**: all operational callers agree in the unmerged worktree; main is unchanged.
> Re-verify with `rtk npm run test:validators` and the recorded P2 stack command packet.

## Phase 3: Integrated Proof and Data Rehearsal

- **Input:** completed P1/P2 and P0 resource/data inventory.
- **Outcome:** complete runtime proof on supported environments, including data recovery, before
  documentation describes the migration as available.

- [ ] [AI] Exercise AC-01–AC-06 on Ubuntu and macOS with Docker unavailable to the tested processes
      without uninstalling Docker or stopping peer workloads. Use a task-owned shim that records and
      fails Docker invocations, put it only on those processes' PATH, and verify the log is empty.
      Record rootless engine JSON, provider/version, cgroup limits, mount UID/GID, internal DNS,
      health checks, prerender copy, failure paths, and owned teardown. Save `evidence/P3/platforms.md`.
- [ ] [AI] Complete AC-07's pre-merge proof only: both backend images build, inspect, and start
      under rootless Podman with temporary local tags; the fake registry CLI proves auth argument
      handling without credentials; existing repositories, `latest`/commit-SHA tags, triggers, and
      permissions match. Record this separately in `evidence/P2/publishing.md`. Do not attempt
      GHCR publication before merge.
- [ ] [AI] Rerun every P0-frozen project/target row with the exact HIPPO command and stack pairing in
      the [project target](./tech-docs.md#affected-project-target-matrix) and
      [stack command](./tech-docs.md#current-stack-command-packet) matrices. Compare fresh
      executed/passed counts and outputs against P0; if a directly named caller/config changed,
      perform only the bounded rediscovery defined there before updating the selection. For runner
      toolchains, select fixtures covering each used recipe, platform, service, and lockfile form;
      reuse unchanged course units read-only where the canonical scheduled/full gate requires them.
      Record exact selections and positive counts. Never regenerate lesson outputs to pass.
- [ ] [AI] Perform AC-08 with seeded disposable PostgreSQL data using the
      [backup/restore/compare/rollback packet](./tech-docs.md#disposable-postgresql-rehearsal-packet)
      and the discovered service-version export/restore packet. Compare table data and an
      application-level read/write before/after in a distinct Podman volume; preserve the source and
      backup. For any real owned durable data migration,
      stop only that owned stack after its rehearsal passes. If another service needs a recipe,
      record/prove its supported export/restore before switching it. Save only sanitized proof.
- [ ] [AI] Manually open each supported public-site container in a real browser and exercise its
      existing home/navigation/search readiness path in every supported locale. Capture screenshots
      and HTTP health responses with `rtk curl`; run one existing read-only backend API request per
      backend and the existing DB/broker E2E wire assertions. Record URLs, responses, locales, and
      serving revision under `evidence/P3/manual/`. This container-health/browser/wire evidence is
      separate from native fixture-server BDD targets, especially OSE's default 3190 tests. Do not
      invent an endpoint: use that app's specs.
- [ ] [AI] Record API/UI-feature scope dispositions: runtime infrastructure only, no changed user
      features/contracts; rule-15 triad and rule-16 API-feature retests are not applicable. If real
      implementation changes a feature, stop to reconcile scope and add the applicable gates before
      continuing. Verify learning-content hashes and peer-worktree non-interference for AC-09.
- [ ] [AI] Rehearse failure recovery on the disposable data stack, then compare the retained source
      against the pre-rehearsal checks. Classify every created resource as removable disposable,
      retained proof, or durable/shared state; run no global prune. Save `evidence/P3/recovery.md`.

### Phase 3 Gate

- [ ] [AI] Before merge, trace AC-01–AC-06 and AC-08–AC-09 to real passing outputs and supported-host
      evidence; verify the data round-trip and rollback rehearsal, empty Docker-call log, unchanged
      content hashes, and no unowned teardown. Also verify AC-07's named pre-merge build/auth/tag
      proof. Missing macOS or other required platform evidence blocks this gate. AC-07's actual
      publication is intentionally pending here and cannot be marked passed: the mandatory existing
      GHCR trigger, tag/digest verification, and rootless inspect/start proof happen only after merge
      in Plan Archival's terminal delivery audit. Re-run the recorded failing boundary after any fix;
      do not retry to obtain a lucky result.

> **Pause Safety**: supported workflows are proven and source data retained. Stop only resources
> this plan started; resume by re-running the concrete P3 capability and smoke packet.

## Phase 4: Rules, Docs, Bindings, and Runtime-Switch Delivery

### Repository-local rules propagation

- **Input:** verified as-built runtime and the full rule-bearing surface from P0.
- **Outcome:** one canonical runtime requirement, all derivatives/enforcement aligned, delivered
  in the same runtime-switch unit. Only `ose-public` participates.

- [ ] [AI] Start `rules-propagation` through `rules-fixer` with three falsifiable statements:
      operational container tasks use rootless Podman; Compose callers explicitly use podman-compose;
      cleanup removes only positively owned disposable artifacts while retaining shared/persistent
      data. Freeze revision, dirty paths, scope, reasons, strength, and P0 inventory in the local
      placement record. Existing self-created-only safety meaning is preserved, not generalized away.
- [ ] [AI] Scan and classify conflicts in `repo-governance/`, root instructions, `repo-config.yml`,
      enforcement scripts/workflows, software-engineering style guides, agents, canonical skills,
      and generated bindings. Resolve Docker-specific lower-level requirements against the approved
      runtime decision; record same-level unresolved conflicts for the owner. Preserve native-first
      tooling and HIPPO scheduling; create no obligation for another repository.
- [ ] [AI] Place the canonical runtime obligation in the existing
      `repo-governance/development/workflow/reproducible-environments/containerization-for-complex-environments.md`.
      Keep build-specific mechanics in the existing Docker-monorepo-builds modules and owned-resource
      mechanics in the existing cleanup modules. Replace duplicate obligations with links; update
      maintenance setup modules and CI conventions at their narrowest applicable homes. If a declared
      word budget would overflow, relocate weaker material in the same change rather than raising it.
- [ ] [AI] Write canonical Markdown repairs through `rules-fixer`; dispatch any changed declarations
      or enforcement code to `swe-developer`. Reconcile `repo-config.yml` Podman/provider declarations,
      shell/runtime preflight consumers, existing hadolint coverage, and any exact operational
      instructions in `agents/` or `.agents/skills/`. Record every superseded Docker requirement and
      its replacement home in `evidence/P4/rule-manifest.md`.
- [ ] [AI] Give each rule one enforcement disposition with discriminating proof: native tool
      existence is covered by doctor (missing/conforming executable); runtime rootless is covered by
      preflight and Go regression cases (rootful/rootless); provider selection is covered by caller
      tests (conflicting provider installed/explicit selection). Existing ownership safeguards retain
      their documented judgement-based disposition where ownership cannot be mechanically settled.
      Link that reason and its cleanup evidence; do not claim a text search proves runtime behavior.
- [ ] [AI] Regenerate all declared harness routes together with
      `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino harness adapters generate`,
      then validate with `rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- ./rhino harness adapters validate`.
      Record every generated path in the touch ledger and land it with its source. Never hand-edit it.
- [ ] [AI] Run deterministic Markdown/frontmatter/headings/internal-link/word-budget and enforcement
      gates declared in `repo-config.yml`, judging exit codes. Run `rules-quality-gate` on this frozen
      change through its documented workflow and resolve its ledger under its bounded convergence
      rule. Record rule homes, enforcement proof, relocations, gate verdict, manifest, and final
      `rules-propagation` status; unresolved required rows block this delivery unit.

### Docs propagation and architecture reconciliation

- [ ] [AI] Run `docs-propagation` on the frozen as-built change. Update only stale operational
      setup, root/project READMEs, CI architecture, active specs, script/action indexes, and canonical
      skill guidance from the P0 inventory. Preserve lessons, generic educational examples, dated
      published records, historical plans, and unsupported-scaffold warnings. Execute every safe
      affected example via its declared entry point; record publishing/shared/secret-bearing commands
      as not-run with reason. Save workflow outputs/status in `evidence/P4/docs-manifest.md`.
- [ ] [AI] Reconcile C4/runtime architecture descriptions in the existing app/CLI spec homes and
      system-architecture docs. The app topology and public APIs do not change; update runtime nodes
      and external-tool labels only where they actually exist. Record no-delta dispositions for
      unchanged HTTP/tRPC/schema contracts and for UI-design work. Confirm the runtime prerequisites
      are reflected in Phoenix's eventual resumption instructions without changing its feature scope.
- [ ] [AI] Recheck AC-10: enumerate every live plan README, read each `Depends-on`, compare exact
      live IDs and edges against `plans/README.md`, and verify acyclicity. Retain Phoenix's Podman
      prerequisite and direct Phoenix dependencies for 06–14; preserve 06→07 and the final join
      from every content plan 06–13 into plan 14. No
      historical completed plan appears as a live graph node. Record `evidence/P4/plan-order.md`.

### Local Quality Gates (Before Push)

> **Important:** Fix ALL failures found during quality gates, including preexisting failures
> encountered in this work, at their root cause. Do not bypass admission, reduce coverage, retry,
> loosen assertions, skip/quarantine tests, or widen timeouts to obtain a pass.

- [ ] [AI] Run `rtk npm run test:validators` and `rtk npm run doctor`; run the frozen affected target
      matrix under HIPPO, including build, typecheck, lint, quick, Integration, E2E, dependency audits,
      and `test:coverage:behaviour` where declared. Use existing guarded root affected aliases only
      when they provide the full required selection. Confirm the terminal outputs exit 0.
- [ ] [AI] Run Markdown lint and Prettier check on the exact changed Markdown/config paths using
      installed local binaries under ephemeral/light admission, plus `rtk git diff --check` and the
      repository's declared cross-language/YAML/workflow gates. Run link and generated-binding gates
      against the final tree. Record positive exit codes and bounded fixes.
- [ ] [AI] Reconcile `git status` with the touch ledger and file-impact inventory. Review the full
      diff, verify learning content/peer work is untouched, and ensure no hosting/secret/shared-state
      change slipped in. Re-run only checks invalidated by a later edit. Freeze the delivery revision
      and the AC-to-proof matrix in `evidence/P4/delivery-readiness.md`.

### Post-Push Verification

- [ ] [AI] Once this implementation change set is authorized for delivery, commit the coherent
      runtime switch, open/update its draft PR to `main`, and obtain fresh-context leak review for
      the exact push head before pushing. Root instructions and hardened push guards remain binding.
- [ ] [AI] Poll CI every two minutes with `gh run list`/`gh run view`; never `gh run watch`. Require
      exact-head/base PR Quality gate and applicable container CI. Investigate failures at root cause,
      preserve logs, repair and push through a fresh-head leak review, and re-run affected proof.
- [ ] [AI] Record the green pre-archival PR head and preliminary publication/hosting proof matrix.
      Do not merge yet: Knowledge Capture and archival must land in this same PR first. Local image
      build/start and auth-command proof must already pass; only trigger-driven publication, hosted
      smoke, merge confirmation, and the terminal audit remain as named final-delivery proof.

### Phase 4 Gate

- [ ] [AI] Required pre-merge local/CI/manual outcomes, rules/docs manifests, generated bindings,
      AC-01–AC-06 and AC-08–AC-10 substantive proof, and AC-07's named pre-merge local
      build/auth/tag proof agree with the current PR head. Platform proof cannot be deferred as
      final delivery. Keep AC-07 publication explicitly pending for Plan Archival's mandatory
      post-merge terminal proof; name that and only other genuine post-merge evidence in
      `evidence/P4/delivery.md`, then proceed to Knowledge Capture and archival-in-PR.

> **Pause Safety**: the complete switch is green in an unmerged PR; main, data, and unrelated
> workloads remain intact. Resume with the recorded current-head CI and platform smoke packet;
> do not automatically resume Phoenix or plan 10.

## Phase 5: Knowledge Capture

- **Input:** execution observations in `learnings.md` and the green pre-archival PR proof.
- **Outcome:** every observation has one explicit terminal disposition.

- [ ] [AI] Apply the durable-learning litmus test, then secret/sensitivity and repo-relevance gates
      to each entry. Sanitize examples or discard entries that cannot retain meaning safely. Private
      infrastructure details never enter this public plan. Record discarded entries with reasons.
- [ ] [AI] Route each surviving non-code learning to its owning durable home and land a bounded
      inline correction with required propagation. For code-homed future work, report with handoff
      evidence unless a separate idea artifact is literally authorized. Do not create/update
      `plans/ideas/` without that authorization and never write new backlog work during Knowledge
      Capture. When idea authorization exists, search for overlap before creating a two-pager.
- [ ] [AI] Record each terminal state in `learnings.md`: routed inline, explicitly authorized idea
      path, reported without plan authorization with handoff evidence, or discarded with reason. If
      none arose, record `No generalizable learnings — <reason>` rather than inventing an insight.

### Phase 5 Gate

- [ ] [AI] Verify no learning remains untriaged and no future code-homed learning landed inline.
      Re-run gates invalidated by any durable-home edits; record `evidence/P5/knowledge-capture.md`.

> **Pause Safety**: each learning has a terminal state. Resume by checking `learnings.md` for open
> entries and the current-head audit matrix before archival.

## Plan Archival

- [ ] [AI] Perform the preliminary end-to-end completeness audit: map scope and every PRD AC to
      delivered artifacts, automated/manual/CI proof, data migration/rollback, rule/docs propagation,
      conditional recovery, and Knowledge Capture. Reopen the earliest affected packet for missing
      substantive proof; only final archival-delivery proof may remain pending.
- [ ] [AI] Verify every substantive checklist item is ticked with evidence, supported locales were
      exercised, all local/CI gates pass, and all applicable exploratory defect findings are fixed.
      If a required defect cannot be fixed, obtain explicit user deferral; do not self-defer it.
- [ ] [AI] Register the workflow-owned terminal post-delivery audit task, including exact final
      reviewed/merge head, AC matrix, CI/manual proof, backup/rollback dispositions, and Knowledge
      Capture. Do not assign terminal pass before that audit observes the delivered archival head.
- [ ] [AI] After pre-archival gates pass, run `rtk date +%F` and resolve `<completion-date>` from
      that output. Move via
      `rtk git mv plans/in-progress/docker-to-podman/ plans/done/<completion-date>__docker-to-podman/`;
      preserve evidence, update in-progress/done indexes and live DAG/dependencies, and correct links.
      Commit `chore(plans): move docker-to-podman to done` on the same runtime-switch PR branch,
      push with a fresh head-specific leak review, and require replacement exact-head/base CI and
      applicable finite surface gates. Archival removes the satisfied live prerequisite from
      Phoenix's declaration while retaining its historical dependency and resumption requirements.
- [ ] [AI] Once the archival commit is present and hardened merge preconditions pass, merge that
      same PR under its declared AI authority. Record reviewed head, merge commit, actual jobs, and
      current-main observation. The Phase 2 evidence contains only pre-merge build/auth/tag
      construction proof; it does not satisfy AC-07's publication scenario. Observe the existing
      authorized GHCR trigger for the merged revision, verify both `latest` and commit-SHA tags in
      their unchanged repositories, and inspect/start the published images with rootless Podman.
      Record exact workflow run, source revision, tag-to-digest results, and smoke outcomes in
      `evidence/P4/publishing-terminal.md`. This post-merge evidence is mandatory before AC-07 or
      terminal delivery can be marked passed. If no existing trigger publishes, obtain separate
      authority for the existing publication path or leave terminal delivery incomplete. Never
      push a speculative image solely to validate a document.
- [ ] [AI] Verify existing hosted public URLs after any already-existing deployment triggered by
      this delivery, without changing hosting/deployment configuration. Record HTTP responses and
      serving revision where exposed; a deployment that did not run is recorded as not-run. Run
      the registered terminal audit against the delivered head, including final publication proof.
      Record pass only when artifacts, behavior, proof, and final-delivery evidence agree. A failure
      reopens execution; do not conceal it with a post-merge checkbox edit.
- [ ] [AI] Classify every Delivery Branch Inventory entry as delivered, unused, or retained/escalated,
      naming evidence and owner for retained entries. Run the
      [mandatory pre-removal checks](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/mandatory-pre-removal-checks.md)
      and [Dev Artifact Clean-Up](../../../repo-governance/workflows/maintenance/dev-artifact-clean-up.md)
      for only this plan's resources; preserve data, base images, backups, and peer worktrees.
- [ ] [AI] Remove the now-unused execution worktree non-force from the repository root with
      `rtk git worktree remove worktrees/docker-to-podman`. Complete every created branch's proof-gated
      [branch cleanup](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md),
      then `rtk git worktree prune`. Never delete an ambiguous, retained, or unrecorded branch.
- [ ] [AI] Report delivery, terminal audit, retained backup/resource ownership, and satisfied Podman
      prerequisite to the maintainer. Phoenix and plan 10 remain stopped until their authorized
      executors reconcile current main, checkpoints, runtime setup, and remaining gates.
