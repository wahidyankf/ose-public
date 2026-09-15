# Delivery Checklist — BeaverNest Flutter Web Client

## Executor Legend

- `[AI]` performs repository, build, test, evidence, PR, and merge actions permitted by this plan.
- No `[HUMAN]` step is required. Browser install-as-app is progressive enhancement and does not need
  a developer-controlled app-store, device, or credential gate.

## Worktree

Use `worktrees/beaver-flutter/`. It already exists on branch `beaver-flutter`; all delivery
units reuse this one worktree and switch branches only at declared delivery boundaries.

If it must be provisioned manually from a fresh primary checkout, use
`claude --worktree beaver-flutter`; then run `npm install` and `npm run doctor -- --fix` before
Phase 0. The worktree path follows the [Worktree Path Convention](../../../repo-governance/conventions/structure/worktree-path.md).

## Delivery Mode: worktree-to-pr

This repository is branch-protected. `[AI]` opens, reviews, and merges each delivery-boundary PR
after the hardened preconditions pass.

## Quality, Commit, and CI Protocol

- [x] [AI] In this `delivery.md`, before every delivery-boundary push, run `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push` and `npm exec nx -- affected -t build,test:quick,lint,specs:behavior:coverage` from the repository root for the branch's actual blast radius; save any failure diagnosis in `plans/in-progress/beaver-flutter/evidence/quality-<delivery-branch>.md` — acceptance: all relevant unit, integration, browser E2E, lint, and behavior-spec coverage gates pass; fix all failures, not only failures caused by the current change, before pushing.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`, `plans/in-progress/beaver-flutter/evidence/quality-beaver-flutter-p1.md`
  - **Notes**: Pre-push gates and the corrected affected-target sweep pass. The initial npm argument-forwarding failure is diagnosed and remedied in the quality evidence; affected Flutter and backend builds, tests, lint, and spec coverage are green.
- [x] [AI] For the boundary branch/PR recorded in this `delivery.md`, commit only ledger-owned changes thematically with Conventional Commit messages, splitting unrelated domains or concerns into separate commits; run `git diff --cached --check` before each commit and record commit hashes in `plans/in-progress/beaver-flutter/evidence/commits-<delivery-branch>.md` — acceptance: each commit is reviewable as one concern and has no whitespace error or foreign file.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/evidence/commits-beaver-flutter-p1.md`
  - **Notes**: Four ledger-scoped commits separate the backend build repair, Flutter foundation, P1 evidence, and corrected SHA ledger. Each was guarded by `git diff --cached --check`; the worktree was clean before this checklist-state update.
- [x] [AI] After every delivery-boundary push, inspect the branch/PR recorded in this `delivery.md` with `gh run list --branch <delivery-branch> --limit 20` and `gh run view <run-id> --json status,conclusion` every two minutes; after P2's `pull_request` trigger change, inspect its `PR Quality Gate` and `beavernest-app-test-local-deploy-stag` runs and record results in `plans/in-progress/beaver-flutter/evidence/ci-<delivery-branch>.md` — acceptance: every applicable run reaches `success`; investigate and fix every failure before the boundary can merge.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/evidence/ci-beaver-flutter-p1.md`
  - **Notes**: The P1 `pr-quality-gate` and `validate-env` pull-request runs both completed successfully at the reviewed P1 head; the source-only foundation is intentionally non-routable, so P2 retains the hosted browser and API verification obligation.

## Parallelization Model

Dependency DAG: `restrict-env-access-to-prod-and-stag (<private-sibling>) -> P0 -> P1 -> P2 -> P3`.
The cross-repository predecessor must be archived before P0. The remaining phases are serial because
P1 establishes the reproducible toolchain and UI evidence, P2 atomically introduces the diagnostics
contract with the client replacement, and P3 closes only after the replacement is proven.

### Delivery Boundaries

| Delivery unit       | Phases | Branch/worktree                                    | Boundary and reason                                                                                                                                 |
| ------------------- | ------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flutter foundation  | P1     | `beaver-flutter-p1` in `worktrees/beaver-flutter/` | P1 establishes a reproducible, non-user-reachable Flutter foundation and complete design evidence; it is independently reviewable and safe on main. |
| Flutter Web cutover | P2     | `beaver-flutter-p2` in the same worktree           | P2 is the atomic replacement; it cannot safely split into an intermediate frontend delivery.                                                        |
| Closure             | P3     | `beaver-flutter-p3` in the same worktree           | P3 carries evidence, quality results, knowledge capture, and archival.                                                                              |

### Delivery-Boundary Integration Protocol

This protocol applies from Phase 1 onward only. The pre-phase handoff creates/switches the listed
branch; at its declared boundary, commit only ledger-owned files, push, open a draft PR against
`main`, classify changed behavior, run the PR Review Maker→Fixer cycle (up to seven CI-gated rounds,
stopping at the first clean MEDIUM/HIGH/CRITICAL result), mark ready only after CI and required
manual verification, then `[AI]` merges and records post-merge verification. Phase 0 is excluded.
The plan's strict atomic cutover is the approved exception to a feature flag; no legacy client is
shipped beside Flutter.

## Phase 0: Environment Setup and Baseline

_Executor: repo-setup-manager. No PR, push, review, merge, or CI-monitoring action occurs in this
phase._

- [x] [AI] Verify the hard predecessor before any BeaverNest implementation, branch creation, or baseline test: run `beavernest_private_sha=$(gh api 'repos/wahidyankf/<private-sibling>/commits/main' --jq .sha) && beavernest_env_dependency_tree=$(mktemp) && gh api "repos/wahidyankf/<private-sibling>/git/trees/$beavernest_private_sha?recursive=1" --jq '.tree[].path' > "$beavernest_env_dependency_tree" && beavernest_archive_path=$(rg '^plans/done/[0-9]{4}-[0-9]{2}-[0-9]{2}__restrict-env-access-to-prod-and-stag/README\.md$' "$beavernest_env_dependency_tree") && test "$(printf '%s\n' "$beavernest_archive_path" | wc -l | tr -d ' ')" -eq 1 && ! rg -q '^plans/in-progress/restrict-env-access-to-prod-and-stag/' "$beavernest_env_dependency_tree" && gh api "repos/wahidyankf/<private-sibling>/contents/$beavernest_archive_path?ref=$beavernest_private_sha" -H 'Accept: application/vnd.github.raw+json' > "$beavernest_env_dependency_tree.readme" && gh api "repos/wahidyankf/<private-sibling>/contents/${beavernest_archive_path%/README.md}/delivery.md?ref=$beavernest_private_sha" -H 'Accept: application/vnd.github.raw+json' > "$beavernest_env_dependency_tree.delivery" && rg -q '^\*\*Status\*\*: (Done|Complete|Completed)( \(.+\))?$' "$beavernest_env_dependency_tree.readme" && ! rg -q '^\s*[-*]\s+\[ \]' "$beavernest_env_dependency_tree.delivery" && beavernest_public_pr=$(gh pr view 176 --repo wahidyankf/ose-public --json state,mergeCommit,url --jq 'select(.state == "MERGED") | "\(.url) \(.mergeCommit.oid)"') && beavernest_public_merge_sha=${beavernest_public_pr##* } && git fetch origin && git merge-base --is-ancestor "$beavernest_public_merge_sha" origin/main && beavernest_public_sha=$(git rev-parse origin/main) && { printf 'private-main=%s\nprivate-archive=%s\nprivate-status=%s\npublic-main=%s\npublic-pr-and-merge=%s\n' "$beavernest_private_sha" "$beavernest_archive_path" "$(rg '^\*\*Status\*\*:' "$beavernest_env_dependency_tree.readme")" "$beavernest_public_sha" "$beavernest_public_pr"; } > plans/in-progress/beaver-flutter/evidence/phase-0-env-access-predecessor.md && rm -f -- "$beavernest_env_dependency_tree" "$beavernest_env_dependency_tree.readme" "$beavernest_env_dependency_tree.delivery"` — acceptance: exactly one the private sibling archive validates at the recorded private SHA, it is absent from `in-progress`, has a recognized terminal status (`Done`, `Complete`, or `Completed`), and has no unchecked delivery item; its `ose-public` PR #176 merge commit is reachable from `origin/main`; the exact archive path, terminal status, private/public SHAs, PR URL, and merge commit are recorded. Otherwise stop without creating a branch or changing BeaverNest code.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/README.md`, `plans/in-progress/beaver-flutter/tech-docs.md`, `plans/in-progress/beaver-flutter/delivery.md`, `plans/in-progress/beaver-flutter/evidence/phase-0-env-access-predecessor.md`
  - **Notes**: The external predecessor is archived, absent from `in-progress`, uses the repository-recognized terminal `Done` status, has no unchecked delivery items, and its public PR #176 merge is reachable from `origin/main`. The predicate now accepts the repository's established terminal-status vocabulary.

- [x] [AI] Record the legacy and backend baseline in `plans/in-progress/beaver-flutter/evidence/phase-0-baseline.md` with `npm exec nx show project beavernest-app-web`, `npm exec nx run beavernest-app-web:test:quick`, `npm exec nx run beavernest-app-web-e2e:test:quick`, `npm exec nx run fsharp-env-loader:test:quick`, `APP_ENV=test npm exec nx run beavernest-be:test:quick`, `APP_ENV=test npm exec nx run beavernest-be-e2e:test:e2e`, and `bash infra/dev/beavernest-app/tests/clean-image-build.sh` — acceptance: each command and pass/fail output is timestamped, a pre-existing failure is diagnosed before P1, the direct backend tests prove the committed `APP_ENV=test` contract is runnable, the baseline explicitly records that current container E2E still defaults to `local` until P2 forwards `APP_ENV`, and a clean source-only image proves the shared F# loader is available to Docker.
  - **Date**: 2026-08-13
  - **Status**: Done with diagnosed baseline failures
  - **Files Changed**: `plans/in-progress/beaver-flutter/evidence/phase-0-baseline.md`
  - **Notes**: Legacy frontend, E2E, F# loader, and host backend gates pass. The container E2E and source-only image expose missing shared-loader and generated-contract Docker inputs; their remediation is added below as a Phase 0 discovery before Phase 1 can start. Container tier forwarding remains P2 scope.

- [x] [AI] Fix the discovered source-only BeaverNest Docker build inputs: add a failing regression proof for `apps/beavernest-be/Dockerfile` retaining the shared `fsharp-env-loader` project/source and generating or copying the required `generated-contracts/OpenAPI/src/BeaverNestBe.Contracts/Health.fs` before `dotnet publish`; implement the narrow Docker build-input repair, then run `APP_ENV=test npm exec nx run beavernest-be-e2e:test:e2e` and `bash infra/dev/beavernest-app/tests/clean-image-build.sh` — acceptance: both container commands pass without changing the existing `APP_ENV` forwarding boundary or backend runtime behavior.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/Dockerfile`, `apps/beavernest-be-e2e/utils/host-runtime.ts`, `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: The source-only production Docker build regenerates the required contract, preserves Vite mode behavior, and supplies the loader project/source before backend restore/publish. The isolated broken-migration fixture now mirrors the required repository-relative loader and contract inputs. `clean-image-build.sh` and all 11 backend E2E scenarios pass.

- [x] [AI] Run `flutter doctor -v`, `flutter devices`, `flutter test --help`, and `fvm --version` if available; append exact Web/browser capability and FVM availability to `evidence/phase-0-baseline.md` — acceptance: P1 has a verified Web-only command baseline without writing implementation files.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/evidence/phase-0-baseline.md`
  - **Notes**: Flutter `3.41.5`, FVM `4.0.5`, and Chrome Web support are available. Android-only doctor warnings do not affect this Web-only delivery.

- [x] [AI] Inspect `apps/beavernest-be/src/BeaverNestBe/{Program.fs,Infrastructure/EnvTierLoader.fs,Api/StaticContent.fs}`, the current Dockerfile, and browser E2E scripts; record the existing cache/header, asset-fallback, and loader-order behavior in `evidence/phase-0-baseline.md` — acceptance: P2 has no unexamined Vite-specific hosting assumption, and `loadEnvTier ()` is confirmed before database/listener configuration.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/evidence/phase-0-baseline.md`
  - **Notes**: Recorded Vite cache/fallback behavior, confirmed loader ordering, and bounded the current `APP_ENV` container-forwarding gap to P2.

### Phase 0 Gate

- [x] [AI] All checks must pass before starting Phase 1: verify `plans/in-progress/beaver-flutter/evidence/phase-0-env-access-predecessor.md` contains the terminal-status/private/public predicates and run `npm run doctor -- --fix` and `git status --short` — acceptance: semantic predecessor and public-merge evidence are present, the toolchain is green, and only plan/evidence ledger files exist.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/Dockerfile`, `apps/beavernest-be-e2e/utils/host-runtime.ts`, `plans/in-progress/beaver-flutter/{README.md,tech-docs.md,delivery.md,evidence/**}`
  - **Notes**: External semantic predicate passed, doctor reports 16/16 tools available, and the explicit Phase 0 Docker/E2E defect remediation is ledger-owned and verified. No unrelated worktree paths are present.

**Pause Safety:** Safe to stop after the baseline. Resume with `cd worktrees/beaver-flutter && npm exec nx run beavernest-app-web:test:quick`.

## Phase 1 Branch Handoff

- [x] [AI] Before authoring Phase 1 changes, run `git fetch origin --prune && git switch -c beaver-flutter-p1 origin/main` in `worktrees/beaver-flutter/` — acceptance: the sole plan worktree is on a fresh `beaver-flutter-p1` branch based on the latest `origin/main`.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: `beaver-flutter-p1` now tracks the latest `origin/main`; Phase 0 ledger-owned changes were carried into the delivery branch without touching local `main`.

## Phase 1: Reproducible Flutter Foundation and Complete Design Evidence

- [x] [AI] Provision the non-deployed Flutter foundation: from the repository root run `fvm use 3.41.5 --force --skip-pub-get && fvm install && fvm flutter create --empty --platforms web apps/beavernest-app && git check-ignore -v .fvm/flutter_sdk`; add the minimal `.fvm/flutter_sdk` rule to `.gitignore` only if that final command fails; write the selected Flutter revision and builder-image digest discovery method to `plans/in-progress/beaver-flutter/evidence/flutter-builder-lock.md` — acceptance: tracked `.fvmrc` pins Flutter 3.41.5, `.fvm/flutter_sdk` is ignored, `fvm flutter --version` matches the pin, and the new application is not registered, served, or routable.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `.fvmrc`, `.gitignore`, `apps/beavernest-app/**`, `plans/in-progress/beaver-flutter/evidence/flutter-builder-lock.md`
  - **Notes**: Flutter `3.41.5` is pinned and available through FVM; the scaffold is Web-only and remains unregistered/unroutable. The FVM cache directory is ignored and the selected builder index digest is recorded.

- [x] [AI] Fix the P1 PR quality-gate licensing finding by adding the repository-standard MIT `LICENSE` to `apps/beavernest-app/`; run the relevant license validation — acceptance: the new deployable directory satisfies the repository's mandatory per-directory license convention and PR quality gate.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/LICENSE`
  - **Notes**: Added the repository-standard MIT text after PR #182's `convention-license` gate reported a missing deployable-directory license. `rhino-bin.sh convention license validate` passes; commit `9d3670b` is pushed.

- [x] [AI] RED: in `apps/beavernest-app/test/generated_contract_test.dart`, write the one generator scenario below and record candidate commands/results in `plans/in-progress/beaver-flutter/evidence/dart-generator-spike.md`; run `fvm flutter test test/generated_contract_test.dart` from `apps/beavernest-app/` — acceptance: the test fails because no selected generator emits the two closed readiness variants.
  - **Date**: 2026-08-13
  - **Status**: Done (expected RED)
  - **Files Changed**: `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: The test fails specifically because `lib/generated/` does not yet exist; the required closed readiness variants are asserted before any generator is selected.

- [x] [AI] GREEN: add the selected Dart-native generator and exact lock metadata to `apps/beavernest-app/pubspec.yaml` and `pubspec.lock`, generate `apps/beavernest-app/lib/generated/`, then run `fvm flutter pub get && fvm flutter test test/generated_contract_test.dart` — acceptance: the scenario passes, generation is reproducible from `specs/apps/beavernest/containers/contracts/generated/openapi-bundled.yaml`, and the evidence records package/version/license/CVE review and rejected candidates.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/{pubspec.yaml,pubspec.lock,build.yaml,lib/generated/**,test/generated_contract_test.dart}`, `plans/in-progress/beaver-flutter/evidence/dart-generator-spike.md`
  - **Notes**: Rejected the too-recent first spike and selected the 60-day-soaked `openapi_spec` 0.15.0. The bundled local contract regenerates Freezed-backed named readiness variants; its exact dependency, CVE, license, and functional review is recorded in the evidence.

- [x] [AI] RED: extend `apps/beavernest-app/test/generated_contract_test.dart` with failing ready, unavailable, same-origin, and closed-payload scenarios — acceptance: the current generated client proves it cannot yet represent the 503 variant, uses a localhost base URL, and accepts invalid contract payloads.
  - **Date**: 2026-08-13
  - **Status**: Done (expected RED)
  - **Files Changed**: `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: `npm exec nx run beavernest-app:test:unit` fails before the adapter exists: the missing import and symbols prove the generated client has no application-facing boundary for declared 503, closed-payload validation, or the required relative same-origin route.
- [x] [AI] GREEN: add the narrow handwritten adapter/configuration around generated models to parse both closed readiness variants, reject extra or invalid values, and use a relative same-origin base URL; run the Flutter contract test — acceptance: generated transport remains reproducible while the application-facing contract is correct.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/api/readiness_client.dart`, `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: The application-facing adapter validates both declared response codes and every closed-object/const invariant before constructing reproducible generated models. It defaults to relative `/api/v1/readiness`; the five contract tests pass through `npm exec nx run beavernest-app:test:unit`.
- [x] [AI] REFACTOR: remove adapter-test duplication and run `npm exec nx run beavernest-app:test:quick` — acceptance: ready/unavailable parsing and same-origin requests remain regression-proven.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: Shared ready/unavailable payload helpers keep the response-variant scenarios focused. The complete Flutter quick gate passes, including analysis, lint, all five contract tests, 87.76% line coverage, and specs structure validation.

- [x] [AI] RED: inspect the clean-source Docker generator invocation against root `openapitools.json` — acceptance: prove whether the source-only stage receives the repository's pinned OpenAPI generator configuration.
  - **Date**: 2026-08-13
  - **Status**: Done (expected RED)
  - **Files Changed**: None
  - **Notes**: Root metadata pins OpenAPI Generator `7.20.0`, while the frontend stage copied no `openapitools.json`; the prior clean-source build consequently downloaded `7.24.0`. The image was not reproducibly locked.
- [x] [AI] GREEN: copy the pinned OpenAPI generator configuration into the frontend Docker build stage and run `bash infra/dev/beavernest-app/tests/clean-image-build.sh` — acceptance: source-only contract generation is locked to repository metadata and the production image regression remains green.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/Dockerfile`
  - **Notes**: The dependency-layer copy now includes root `openapitools.json`. The clean source-only build reports `Download 7.20.0` and completes the image's non-root and curl assertions.

- [x] [AI] REFACTOR: remove generator-test duplication in `apps/beavernest-app/test/generated_contract_test.dart` and run `fvm dart format --output=none --set-exit-if-changed test/generated_contract_test.dart && fvm flutter test test/generated_contract_test.dart` — acceptance: the one generated-client scenario remains green with no handwritten generated models.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: One loop derives each generated model file name and asserts only its generated class declaration; formatter and the one scenario pass.
- [x] [AI] Create `apps/beavernest-app/project.json`: Flutter-facing targets `codegen`, `build:web`, `build`, `analyze`, `typecheck`, `lint`, `test:unit`, `test:coverage`, and `test:integration` each have `cwd: apps/beavernest-app`; repository targets `specs:structure-validation` and later `specs:behavior:coverage` explicitly have `cwd: {workspaceRoot}`. `codegen` runs `fvm dart run <selected-generator> ../../specs/apps/beavernest/containers/contracts/generated/openapi-bundled.yaml lib/generated` after `beavernest-contracts:bundle`, has `cache: true`, input `../../specs/apps/beavernest/containers/contracts/generated/openapi-bundled.yaml`, and output `lib/generated/`; `build:web` runs `fvm flutter build web`, has `cache: true`, inputs `lib/**` and `web/**`, and output `build/web`; `build` delegates to it; `analyze`, `typecheck`, and `lint` each run `fvm flutter analyze` with `cache: true` and inputs `lib/**`, `test/**`, and `analysis_options.yaml`; `test:unit` runs `fvm flutter test test`, including the P2 `architecture_boundaries_test.dart`, with `cache: true`; `test:coverage` runs `fvm flutter test --coverage`, reads the resulting `coverage/lcov.info` `SF:` paths, writes the verified generated-model glob to `../../plans/in-progress/beaver-flutter/evidence/flutter-lcov-paths.md`, and runs `cargo run --release --quiet --manifest-path ../../apps/rhino-cli/Cargo.toml -- test-coverage validate coverage/lcov.info 80 --exclude '<verified-generated-glob>'`; it has `cache: true`, inputs `lib/**` and `test/**`, and output `coverage/lcov.info` (80% line coverage, excluding only verified generated `lib/generated/**` entries); `test:integration` runs `fvm flutter test integration_test -d chrome` with `cache: false`, and CI installs Chrome; `test:e2e` is an explicit no-op; `specs:structure-validation` runs `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- specs structure validate` with `cache: true` and `specs/apps/**` inputs; `test:specs` composes repository-root `specs:structure-validation` until P2 adds feature bindings; `test:quick` serially composes analyze, lint, unit, coverage, and structure validation across their declared CWDs. Create `apps/beavernest-app-e2e/project.json` at P2 with root-CWD `test:e2e` calling `apps/beavernest-be/scripts/run-e2e.sh --frontend`, root-CWD `specs:behavior:coverage` using the new feature glob and its bound widget/source paths, `specs:e2e:coverage` using the renamed suite's steps/baseline, and `test:specs` composing those three validation targets — acceptance: every Flutter command uses `fvm flutter` or `fvm dart` from the declared project cwd, each repository command uses workspace-root paths from its declared root cwd, affected gates see `build`/`lint`/`test:quick`, coverage must meet the stated 80% threshold with a verified exclusion, and no app Gherkin feature or user-facing code exists yet.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/project.json`, `plans/in-progress/beaver-flutter/evidence/flutter-lcov-paths.md`
  - **Notes**: All 13 targets are Nx-discoverable and verified. The selected CLI requires explicit `--path`/`--destination` flags plus Freezed generation. Rhino resolves coverage paths from the workspace root, so the proven target passes `apps/beavernest-app/coverage/lcov.info`; P2 must recheck the narrow verified model-only exclusion after executing generated Dart.
- [x] [AI] Revalidate `prd.md` and `assets/README.md` against `libs/web-ui` and the legacy shell, retaining two responsive desktop/tablet/mobile visual finalists per status, diagnostics, and shortcut surface — acceptance: all asset text matches the Web-only safe-data scope and each selected visual states focus, error, and responsive behavior.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/assets/README.md`
  - **Notes**: Six selected assets retain desktop/tablet/mobile variants and now explicitly document focus, recoverable error behavior, and Web-only safe-data boundaries. `prd.md` matched the legacy and design-system evidence without change; local markdown and heading checks pass.

### Phase 1 Gate

- [x] [AI] All checks must pass before starting Phase 2: run `npm exec nx run beavernest-app:test:quick`, `npm exec nx run beavernest-app:test:coverage`, `npm exec nx run beavernest-app:specs:structure-validation`, and `npm run validate:sync` — acceptance: FVM, generated Dart readiness contract, target inventory, design assets, and harness bindings validate without exposing a new endpoint before the atomic cutover.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: The original four required commands pass: the composite quick gate, initial zero-executable-line coverage gate, structure validation, and 97/97 harness-binding sync checks. The later P1 adapter remediation reran coverage at 87.76%; no Flutter route or endpoint is exposed.

- [x] [AI] Revalidate the P1 gate after PR-review fixes: run the Flutter quick and coverage gates, the clean source-only image regression, `npm run validate:sync`, `git diff --check`, and the pre-push gate — acceptance: the app-facing readiness boundary and pinned Docker generator configuration preserve all P1 guarantees.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/api/readiness_client.dart`, `apps/beavernest-app/test/generated_contract_test.dart`, `apps/beavernest-be/Dockerfile`, `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: Flutter quick and coverage pass at 87.76%; the clean image uses OpenAPI Generator 7.20.0; 97/97 harness bindings, `git diff --check`, and the complete pre-push gate pass.

- [x] [AI] Commit the app-facing readiness adapter and its regression test as one conventional code commit — acceptance: the strict 200/503, closed-payload, and same-origin behavior is independently deliverable.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/api/readiness_client.dart`, `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: Committed as `b241d2d` (`fix(beavernest-app): validate readiness contract responses`) after the cached diff check passed.
- [x] [AI] Commit the Docker OpenAPI-generator configuration repair as one conventional code commit — acceptance: image reproducibility is independently deliverable.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/Dockerfile`
  - **Notes**: Committed as `84000f4` (`fix(beavernest): pin Docker generator configuration`) after the cached diff check passed.
- [x] [AI] Update the P1 commit ledger with every P1 delivery commit, then commit the plan-state and evidence updates — acceptance: plan provenance is exact before the PR head is replaced.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`, `plans/in-progress/beaver-flutter/evidence/commits-beaver-flutter-p1.md`
  - **Notes**: The ledger lists each completed P1 delivery commit through the contract-adapter and Docker-lock repairs; this documentation commit records the updated ledger and current execution state.

- [x] [AI] RED: reproduce the P1 CI Flutter-toolchain failure from the affected workflow configuration — acceptance: identify every affected CI job that invokes bare Dart or `fvm` without provisioning the pinned Flutter SDK.
  - **Date**: 2026-08-13
  - **Status**: Done (expected RED)
  - **Files Changed**: None
  - **Notes**: PR-quality run `31657957918` shows `format-verify-dart` failing with `dart: not found` and the TypeScript/.NET affected gates failing with `fvm: not found`. `pr-quality-gate.yml` provisions only Node/Rust/.NET, confirming the missing pinned Flutter toolchain.
- [x] [AI] GREEN: provision the pinned Flutter/Dart/FVM toolchain in each affected PR-quality CI job and validate the workflow configuration — acceptance: formatting and affected Nx Flutter targets can execute on a clean GitHub runner.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `.github/workflows/pr-quality-gate.yml`
  - **Notes**: CI detects `lang:dart`, runs its own Flutter quality job with `.fvmrc`, FVM 4.0.5, and an explicit global-pub PATH handoff, while excluding Dart targets from unprovisioned language jobs. Formatting jobs now receive bare Dart. `actionlint`, repository-tolerant YAML lint, Dart/FVM version checks, and Dart format validation pass locally.

- [x] [AI] RED: update the readiness contract test to import the adapter from `lib/platform/web/` — acceptance: current P1 layout fails, proving the architecture boundary is not yet enforced.
  - **Date**: 2026-08-13
  - **Status**: Done (expected RED)
  - **Files Changed**: `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: The Flutter contract suite fails because `lib/platform/web/readiness_client.dart` does not exist while the adapter remains under the forbidden `lib/api/` surface.
- [x] [AI] GREEN: move the readiness adapter under `apps/beavernest-app/lib/platform/web/` and rerun its contract test — acceptance: HTTP and generated-DTO imports live exclusively below `lib/platform/**`, as the planned architecture test requires.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/platform/web/readiness_client.dart`, `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: The adapter now contains the app's HTTP/generated-DTO imports solely beneath `lib/platform/web/`. All five contract tests pass through `npm exec nx run beavernest-app:test:unit`.
- [x] [AI] REFACTOR: run the Flutter quick and coverage gates after the boundary move — acceptance: no duplicate adapter remains and its strict response behavior remains covered.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/platform/web/readiness_client.dart`, `apps/beavernest-app/test/generated_contract_test.dart`
  - **Notes**: No copy remains under `lib/api/`. Flutter quick and coverage both pass at 87.76%, retaining all five strict contract scenarios.

- [x] [AI] Correct the Flutter LCOV evidence and original P1 gate note with the verified handwritten adapter path and coverage result — acceptance: persistent evidence describes the current nonzero execution surface and preserves the narrow generated-model exclusion.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`, `plans/in-progress/beaver-flutter/evidence/flutter-lcov-paths.md`
  - **Notes**: Current LCOV records the platform adapter and generated schemas; coverage is 87.76% (43/49). The exclusion remains limited to `lib/generated/*/*.dart`.

- [x] [AI] Commit the P1 PR-quality Flutter toolchain remediation as a conventional workflow commit — acceptance: the CI repair is independently deliverable.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `.github/workflows/pr-quality-gate.yml`
  - **Notes**: Committed as `fce66af` (`fix(ci): provision Flutter quality toolchain`) after the cached diff check passed.
- [x] [AI] Commit the P1 architecture move and evidence reconciliation as a conventional documentation commit — acceptance: the replacement PR head records every review finding and resolution.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`, `plans/in-progress/beaver-flutter/evidence/{flutter-lcov-paths.md,commits-beaver-flutter-p1.md}`
  - **Notes**: Committed as `f0eb99a` (`docs(beaver-flutter): reconcile P1 review evidence`) after Markdown and cached-diff checks passed.

- [x] [AI] RED: inspect Nx's resolved cached-target inputs for `.fvmrc`, `pubspec.yaml`, and `pubspec.lock` — acceptance: prove the current explicit target inputs omit reproducibility-critical Flutter configuration.
  - **Date**: 2026-08-13
  - **Status**: Done (expected RED)
  - **Files Changed**: None
  - **Notes**: `npm exec nx show project beavernest-app --json` confirms every cached Flutter target except the composite quick gate bypasses `default`; none resolve `.fvmrc`, `pubspec.yaml`, or `pubspec.lock` as inputs.
- [x] [AI] GREEN: add inherited project-default and explicit Flutter-toolchain inputs to every cached Flutter target — acceptance: codegen, build, analysis, lint, and tests invalidate when the SDK or pub lock changes.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/project.json`
  - **Notes**: Each cached Flutter command target now inherits `default` (including the project pub manifest and lock) and a project-level `flutter-toolchain` named input for root `.fvmrc`; codegen retains its bundled-contract input.
- [x] [AI] REFACTOR: verify the resolved Nx target inputs and run the Flutter quick gate — acceptance: targets retain narrow contract inputs while every FVM/pub dependency is cache-visible.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/project.json`
  - **Notes**: The resolved-target assertion confirms every cached Flutter command target contains both `default` and `flutter-toolchain`; the full Flutter quick gate passes at 87.76% coverage.

- [x] [AI] RED: reproduce the clean-runner Flutter package-resolution failure with the current codegen command — acceptance: capture why `fvm dart run` cannot resolve Flutter's SDK package set on GitHub Actions.
  - **Date**: 2026-08-13
  - **Status**: Done (expected RED)
  - **Files Changed**: None
  - **Notes**: Flutter CI run `31659510763` reaches the newly provisioned SDK but `fvm dart run` fails dependency solving because `sky_engine` is absent from that Dart-only resolution context. Local `fvm flutter pub run` proves the complete Flutter package context is available.
- [x] [AI] GREEN: run code generation through `fvm flutter pub run` and verify the Flutter quick gate — acceptance: codegen uses the same pinned Flutter package context locally and on CI.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/project.json`
  - **Notes**: Both generator commands now use `fvm flutter pub run`, retaining the app's pinned Flutter package context. The complete Flutter quick gate passes with all five contract tests and 87.76% coverage.
- [x] [AI] REFACTOR: run the full pre-push gate after the clean-runner codegen correction — acceptance: generated contracts, cache inputs, and all affected quality gates remain green.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/project.json`
  - **Notes**: The complete pre-push gate passes after the codegen correction, including generated-contract regeneration, Flutter quick/coverage, affected backend checks, formatting, links, and harness validation.
- [x] [AI] At the P1 boundary, follow the Delivery-Boundary Integration Protocol for `beaver-flutter-p1` — acceptance: the draft PR is green, behavior-classified, review-clean, and merged before P2 starts.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/{delivery.md,evidence/ci-beaver-flutter-p1.md,evidence/commits-beaver-flutter-p1.md}`
  - **Notes**: PR [#182](https://github.com/wahidyankf/ose-public/pull/182) was reviewed clean at `575f2fa585e645906a067000edc51b563e8b774c`; its `pr-quality-gate` and `validate-env` runs passed. Repository policy disallows merge commits, so the approved PR was squash-merged as `188f693ff174a9cc3bda58b2c56cae2027ee6829`.

**Pause Safety:** Safe to stop with an independently merged reproducible, non-routable Flutter foundation and complete visual contract. Resume with `git fetch origin --prune && git switch -c beaver-flutter-p2 origin/main`.

## Phase 2 Branch Handoff

- [x] [AI] After the P1 PR merges, run `git fetch origin --prune && git switch -c beaver-flutter-p2 origin/main` in `worktrees/beaver-flutter/` — acceptance: P2 starts from the merged P1 foundation on a fresh delivery branch while reusing the plan's sole worktree.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: The sole plan worktree now uses `beaver-flutter-p2`, tracking `origin/main` at the P1 squash merge `188f693ff174a9cc3bda58b2c56cae2027ee6829`.

## Phase 2: Responsive Flutter Web Atomic Cutover

- [x] [AI] RED: add `specs/apps/beavernest/behavior/beavernest-be/gherkin/diagnostics/ready.feature` and a failing 200/no-extra-field handler test under `apps/beavernest-be/tests/`; run `npm exec nx run beavernest-be:test:quick` — acceptance: no diagnostics-ready route/schema exists.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-be/gherkin/diagnostics/ready.feature`, `apps/beavernest-be/tests/unit/Tests/DiagnosticsHandlerTests.fs`
  - **Notes**: The initial test failed because `DiagnosticsPort` and `webAppWithDiagnostics` did not exist, proving no diagnostics route could satisfy the closed ready snapshot before implementation.

  **Gherkin (binds) →** "Ready service returns a closed safe snapshot"

  ```gherkin
  Scenario: Ready service returns a closed safe snapshot
    Given BeaverNest accepts requests with current migrations
    When I send GET "/api/v1/diagnostics"
    Then the response is 200 with only status, version, uptimeSeconds, serverTimeUtc, and readiness components
  ```

- [x] [AI] GREEN: add the 200 OpenAPI schema/example, `DiagnosticsPort.fs`, `DiagnosticsHandlers.fs`, deterministic composition, and handler test; run `npm exec nx run beavernest-contracts:bundle && npm exec nx run beavernest-be:test:quick` — acceptance: the ready scenario passes and rejects extra/sensitive fields.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/containers/contracts/{openapi.yaml,generated/openapi-bundled.yaml}`, `apps/beavernest-be/src/BeaverNestBe/{Domain/Diagnostics.fs,Application/DiagnosticsPort.fs,Api/DiagnosticsHandlers.fs,WebApp.fs,Program.fs,BeaverNestBe.fsproj}`, `apps/beavernest-be/tests/unit/{Tests/DiagnosticsHandlerTests.fs,BeaverNestBe.UnitTests.fsproj}`
  - **Notes**: The generated bundle and backend quick suite pass with the deterministic 200 safe snapshot, including rounded-down integer uptime, UTC server time, exact top-level/component fields, and no cache validators.
- [x] [AI] REFACTOR: consolidate ready-response mapping and run `dotnet tool run fantomas --check apps/beavernest-be && npm exec nx run beavernest-be:test:quick` — acceptance: ready diagnostics remains deterministic and formatted.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/src/BeaverNestBe/Api/DiagnosticsHandlers.fs`, `apps/beavernest-be/tests/unit/Tests/DiagnosticsHandlerTests.fs`
  - **Notes**: The diagnostics handler keeps a single deterministic ready mapping; Fantomas and the final 86-test backend quick gate pass.
- [x] [AI] RED: add `specs/apps/beavernest/behavior/beavernest-be/gherkin/diagnostics/unavailable.feature` and a failing 503/no-store test under `apps/beavernest-be/tests/`; run `npm exec nx run beavernest-be:test:quick` — acceptance: the unavailable route behavior fails.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-be/gherkin/diagnostics/unavailable.feature`, `apps/beavernest-be/tests/unit/Tests/DiagnosticsHandlerTests.fs`
  - **Notes**: The deliberately unfinished unavailable branch failed under the focused `dotnet test --no-restore` proof before the 503 mapping existed.

  **Gherkin (binds) →** "Unready service returns a closed unavailable snapshot"

  ```gherkin
  Scenario: Unready service returns a closed unavailable snapshot
    Given BeaverNest cannot complete its readiness probe
    When I send GET "/api/v1/diagnostics"
    Then the response is 503 with Cache-Control no-store and no internal cause
  ```

- [x] [AI] GREEN: add the 503 OpenAPI schema/example and unavailable handler mapping; run `npm exec nx run beavernest-contracts:bundle && npm exec nx run beavernest-be:test:quick` — acceptance: the unavailable scenario passes with only its closed allow-list.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/containers/contracts/{openapi.yaml,generated/openapi-bundled.yaml}`, `apps/beavernest-be/src/BeaverNestBe/{Domain/Diagnostics.fs,Application/DiagnosticsPort.fs,Api/DiagnosticsHandlers.fs,WebApp.fs,Program.fs,BeaverNestBe.fsproj}`, `apps/beavernest-be/tests/unit/{Tests/DiagnosticsHandlerTests.fs,BeaverNestBe.UnitTests.fsproj}`
  - **Notes**: The unavailable variant now returns only `status` and closed readiness components with `503` and `Cache-Control: no-store`; injected clock, version, and uptime seams are never read for that response.
- [x] [AI] REFACTOR: remove duplicate unavailable fixtures and run `dotnet tool run fantomas --check apps/beavernest-be/src && npm exec nx run beavernest-be:test:quick` — acceptance: both diagnostics scenarios remain green; the formatter scope matches the backend lint target and excludes ephemeral OpenAPI-generator output.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`, `apps/beavernest-be/src/BeaverNestBe/{Domain/Diagnostics.fs,Application/DiagnosticsPort.fs,Api/DiagnosticsHandlers.fs,WebApp.fs,Program.fs,BeaverNestBe.fsproj}`, `apps/beavernest-be/tests/unit/{Tests/DiagnosticsHandlerTests.fs,BeaverNestBe.UnitTests.fsproj}`
  - **Notes**: The original broad Fantomas command incorrectly included ignored generator output; the repository's backend lint target correctly scopes formatting to `src`. The corrected source scope and the full backend quick suite pass (80 tests, 92.10% total coverage).
- [x] [AI] PRESERVATION BASELINE: append the composition-root scenario below to `specs/apps/beavernest/behavior/beavernest-be/gherkin/configuration/env-tier-loading.feature`; add `apps/beavernest-be/tests/integration/EnvTierCompositionTests.fs` and its compile entry in `BeaverNestBe.IntegrationTests.fsproj`. The test saves, clears, and restores `APP_ENV`, `BEAVERNEST_BE_DATA_DIRECTORY`, `BEAVERNEST_BE_SQLITE_BUSY_TIMEOUT_MILLISECONDS`, `BEAVERNEST_BE_HTTP_LISTEN_ADDRESS`, and `BEAVERNEST_BE_HTTP_LISTEN_PORT`; creates two sibling temporary directories, using one only as CWD containing `.env.test` and the other as a non-symlink data directory (not the repository, home, root, CWD, or a CWD descendant). It allows at most three child launches (a 95 s total deadline): for each, reserve a fresh unused loopback port, rewrite `.env.test` with that port and the sibling data path as the only required safe values, dispose the reserving listener, and launch the built `BeaverNestBe.dll` through `dotnet` as a child process with that CWD and only `APP_ENV=test`. For that child, poll its file-only `GET /api/v1/readiness` endpoint every 250 ms for up to 30 s while also detecting early exit. Relaunch only when captured stderr confirms address-in-use; otherwise fail immediately with captured stdout/stderr. Between a confirmed bind-race failure and the next launch, terminate/await the child, release resources, and wait 100 ms. On launch exhaustion, report all captured diagnostics, clean fixtures, restore process state, and fail. On success, in `finally` terminate/await the child, release any listener, delete both temporary paths, and restore CWD and all process variables. Run `APP_ENV=test npm exec nx run beavernest-be:test:integration` — acceptance: this pre-existing #176 behavior is green before Flutter changes, proves the actual composition root searches only the isolated temporary `apps/beavernest-be` then CWD paths and loads the file-only test tier before database/listener configuration, and never reads a repository or real environment file.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-be/gherkin/configuration/env-tier-loading.feature`, `apps/beavernest-be/tests/integration/{EnvTierCompositionTests.fs,BeaverNestBe.IntegrationTests.fsproj}`
  - **Notes**: A Gherkin-bound and xUnit-shared child-process proof starts the actual Debug entrypoint from a file-only isolated `.env.test`; it passes 13 integration tests and restores all process/fixture state.

  **Gherkin (binds) →** "beavernest-be loads test-tier configuration before command dispatch"

  ```gherkin
  @integration
  Scenario: beavernest-be loads test-tier configuration before command dispatch
    Given an isolated test-tier file supplies the required safe backend configuration
    When the composition root starts with APP_ENV set to "test"
    Then the file-only test-tier listener accepts a readiness request
    And test-tier configuration was loaded before database and listener configuration
  ```

- [x] [AI] PRESERVATION AFTER CUTOVER: keep `loadEnvTier ()` as the first executable `Program.main` operation, before `configuration ()`; bind the child-process endpoint test to the scenario and run `APP_ENV=test npm exec nx run beavernest-be:test:integration && npm exec nx run beavernest-be:specs:behavior:coverage` — acceptance: the composition-root scenario remains green after the atomic replacement without reading a real environment file.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: `loadEnvTier ()` remains the first executable operation in `Program.main`. The isolated child-DLL proof passes after the cutover (13 integration tests); behavior coverage reports 18 specs, 24 scenarios, and 110 steps, including the executable TickSpec bindings.
- [x] [AI] REFACTOR: retain the shared process-termination helpers inside the isolated composition-root fixture and run `dotnet tool run fantomas --check apps/beavernest-be/tests/integration && APP_ENV=test npm exec nx run beavernest-be:test:integration` — acceptance: loader order remains regression-proven through the actual composition root.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/tests/integration/EnvTierCompositionTests.fs`, `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: There was no pre-existing isolated-working-directory fixture to share with; the test instead centralizes `terminate` and `terminateAndDispose` for each child-launch and final cleanup. Fantomas and the 13-test integration target pass.
- [x] [AI] RED: add failing 200/503 browser/API checks consuming `specs/apps/beavernest/behavior/beavernest-be/gherkin/diagnostics/{ready,unavailable}.feature` in `apps/beavernest-be-e2e/steps/diagnostics.steps.ts` and update its `e2e-coverage-baseline.json`; run `npm exec nx run beavernest-be-e2e:test:e2e` — acceptance: the existing hosted runtime cannot satisfy the new diagnostics feature steps.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be-e2e/{steps/diagnostics.steps.ts,playwright.config.ts}`
  - **Notes**: Before the diagnostics bindings existed, the hosted Playwright boundary could not discover the newly added scenarios; the integration-only configuration feature stays excluded from browser generation rather than receiving synthetic TypeScript steps.

  **Gherkin (binds) →** "Ready service returns a closed safe snapshot"; "Unready service returns a closed unavailable snapshot"

  ```gherkin
  Scenario: Ready service returns a closed safe snapshot
    Given BeaverNest accepts requests with current migrations
    When I send GET "/api/v1/diagnostics"
    Then the response is 200 with only status, version, uptimeSeconds, serverTimeUtc, and readiness components

  Scenario: Unready service returns a closed unavailable snapshot
    Given BeaverNest cannot complete its readiness probe
    When I send GET "/api/v1/diagnostics"
    Then the response is 503 with Cache-Control no-store and no internal cause
  ```

- [x] [AI] GREEN: implement the diagnostics step definitions and API assertions in `apps/beavernest-be-e2e/steps/diagnostics.steps.ts`; run `npm exec nx run beavernest-be-e2e:test:e2e && npm exec nx run beavernest-be-e2e:test:specs` — acceptance: both 200/503 paths and `Cache-Control: no-store` are proven through the hosted runtime and the E2E coverage baseline accepts every diagnostics scenario.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be-e2e/{steps/diagnostics.steps.ts,playwright.config.ts}`
  - **Notes**: The disposable Docker runtime passes all 13 Playwright scenarios, including exact closed ready/unavailable diagnostics bodies, 503/no-store, and the prohibited-detail checks; E2E coverage reports no unbound scenario.
- [x] [AI] REFACTOR: extract shared safe-field assertions to `apps/beavernest-be-e2e/utils/diagnostics.ts`; run `npm exec nx run beavernest-be-e2e:test:e2e` — acceptance: response assertions reject forbidden and additional fields without duplicated step logic.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be-e2e/{playwright.config.ts,steps/diagnostics.steps.ts,utils/diagnostics.ts}`
  - **Notes**: The shared helper centralizes exact key, component, and prohibited-detail checks; hosted Docker E2E, TypeScript typecheck, and lint all pass after extraction.
- [x] [AI] RED: add the same-origin shell Gherkin plus failing widget, application, and architecture-boundary tests in `specs/apps/beavernest/behavior/beavernest-app/gherkin/workspace-shell.feature`, `apps/beavernest-app/test/workspace_shell_test.dart`, `apps/beavernest-app/test/load_readiness_test.dart`, and `apps/beavernest-app/test/architecture_boundaries_test.dart`; have the widget invoke `LoadReadiness`, its application test use a fake `ReadinessRepository`, and the boundary test reject Flutter/Web/generated imports in `lib/domain/` and `lib/application/`, HTTP/generated imports in `lib/presentation/`, and generated imports outside `lib/platform/`; run `npm exec nx run beavernest-app:test:unit` — acceptance: the shell cannot issue the relative readiness request and neither the `LoadReadiness` use case, `ReadinessRepository` port, nor their required isolation exists.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-app/gherkin/workspace-shell.feature`, `apps/beavernest-app/test/{workspace_shell_test.dart,load_readiness_test.dart,architecture_boundaries_test.dart}`
  - **Notes**: The first unit run failed because the shell, application port/use case, and required architectural rings were absent, proving the same-origin behavior could not exist before implementation.

  **Gherkin (binds) →** "Web opens the same-origin workspace"

  ```gherkin
  Scenario: Web opens the same-origin workspace
    Given the combined BeaverNest runtime is ready
    When I open the Flutter Web root route
    Then the Foundation status shell is visible before readiness resolves
    And the client requests the relative "/api/v1/readiness" route
    And the status reports Application Available, Database Ready and Schema Current
  ```

- [x] [AI] GREEN: implement immutable readiness domain models under `apps/beavernest-app/lib/domain/`, `ReadinessRepository` and `LoadReadiness` under `lib/application/{ports,use_cases}/`, `HttpReadinessRepository` under `lib/platform/web/`, and the root shell under `lib/presentation/`; map generated readiness DTOs to domain models only inside `HttpReadinessRepository`; run `npm exec nx run beavernest-app:test:unit` — acceptance: the same-origin shell scenario passes through the fakeable port without a configurable endpoint, CORS behavior, or generated DTO in a widget/use case.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/{domain/readiness.dart,application/ports/readiness_repository.dart,application/use_cases/load_readiness.dart,platform/web/readiness_repository.dart,presentation/workspace_shell.dart,main.dart}`, `apps/beavernest-app/test/{workspace_shell_test.dart,load_readiness_test.dart,architecture_boundaries_test.dart}`
  - **Notes**: A fakeable application port drives the shell; DTO-to-domain mapping and HTTP stay in `lib/platform/web`, with the fixed relative readiness URI retained from P1.
- [x] [AI] REFACTOR: centralize the boundary checks in `apps/beavernest-app/test/architecture_boundaries_test.dart` and run `npm exec nx run beavernest-app:analyze && npm exec nx run beavernest-app:test:unit` — acceptance: dependencies point inward; only `lib/platform/**` owns HTTP/generated-contract imports; and only `lib/platform/web/` owns browser-specific APIs.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/test/architecture_boundaries_test.dart`
  - **Notes**: The inward dependency checks, analyzer, unit suite, and coverage pass; additional adapter mappings raised coverage from the initial 70.87% to 87.38%.
- [x] [AI] RED: add the responsive workspace Gherkin and failing widget tests in `specs/apps/beavernest/behavior/beavernest-app/gherkin/workspace.feature` and `apps/beavernest-app/test/status_dashboard_test.dart`; run `npm exec nx run beavernest-app:test:unit` — acceptance: the status shell, its three widths, and loading/unavailable states fail before widgets exist.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-app/gherkin/workspace/workspace.feature`, `apps/beavernest-app/test/status_dashboard_test.dart`
  - **Notes**: The widget test failed before the responsive dashboard and semantic theme existed.

  **Gherkin (binds) →** "Status reflows across browser widths"

  ```gherkin
  Scenario: Status reflows across browser widths
    Given the Flutter Web workspace is ready
    When I view status at mobile, tablet, and desktop widths
    Then every readiness component is visible without horizontal scrolling
  ```

- [x] [AI] GREEN: implement `StatusDashboard`, `ReadinessSummary`, and `BeaverNestThemeExtension` under `apps/beavernest-app/lib/presentation/`; run `npm exec nx run beavernest-app:test:unit && npm exec nx run beavernest-app:analyze` — acceptance: the responsive scenario passes with semantic colors, text, icons, and live-region states.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/{status_dashboard.dart,workspace_theme.dart,workspace_shell.dart}`, `apps/beavernest-app/test/status_dashboard_test.dart`
  - **Notes**: The dashboard passes at 360, 720, and 1280 px with semantic text/icon states and a live status region.
- [x] [AI] REFACTOR: share layout constraints instead of breakpoint-specific screens and run `fvm dart format --output=none --set-exit-if-changed lib test && npm exec nx run beavernest-app:test:coverage` — acceptance: the workspace scenario remains green with coverage threshold met.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/{status_dashboard.dart,workspace_theme.dart}`, `apps/beavernest-app/test/status_dashboard_test.dart`
  - **Notes**: Shared constraint-driven grid layout remains formatted and coverage is 83.54%.
- [x] [AI] RED: add retry Gherkin and a failing reducer/widget test in `specs/apps/beavernest/behavior/beavernest-app/gherkin/retry.feature` and `apps/beavernest-app/test/readiness_retry_test.dart`; run `npm exec nx run beavernest-app:test:unit` — acceptance: retry recovery fails without navigation.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-app/gherkin/retry/readiness-retry.feature`, `apps/beavernest-app/test/readiness_retry_test.dart`
  - **Notes**: The retry widget/use-case test failed before refresh behavior existed.

  **Gherkin (binds) →** "Status refresh recovers without navigation"

  ```gherkin
  Scenario: Status refresh recovers without navigation
    Given the same-origin endpoint initially reports unavailable
    When it recovers and I activate Refresh status
    Then the status changes to Ready with a polite announcement
  ```

- [x] [AI] GREEN: implement `RefreshReadiness` in `apps/beavernest-app/lib/application/use_cases/` against the existing `ReadinessRepository`; run `npm exec nx run beavernest-app:test:unit` — acceptance: retry passes through a fakeable application port without `dart:html` or browser-storage imports in core layers.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/application/use_cases/refresh_readiness.dart`, `apps/beavernest-app/lib/presentation/workspace_shell.dart`, `apps/beavernest-app/test/readiness_retry_test.dart`
  - **Notes**: Refresh reuses the application repository port and produces a polite recovered-ready update without navigation.
- [x] [AI] REFACTOR: share `ReadinessRepository` result mapping between load and refresh use cases, then run `npm exec nx run beavernest-app:lint && npm exec nx run beavernest-app:typecheck` — acceptance: retry remains green and Web-only dependencies are confined to the adapter.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/application/{ports/readiness_repository.dart,use_cases/load_readiness.dart,use_cases/refresh_readiness.dart}`, `apps/beavernest-app/test/architecture_boundaries_test.dart`
  - **Notes**: Load and refresh share the same narrow port; analyzer-backed architecture rules retain browser/HTTP isolation.
- [x] [AI] RED: add diagnostics Gherkin and a failing widget/port test in `specs/apps/beavernest/behavior/beavernest-app/gherkin/diagnostics.feature` and `apps/beavernest-app/test/diagnostics_screen_test.dart`; use a fake `DiagnosticsRepository` returning domain snapshots; run `npm exec nx run beavernest-app:test:unit` — acceptance: only the safe fields render and the unavailable state has no cause before the application port and Web adapter exist.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-app/gherkin/diagnostics/diagnostics.feature`, `apps/beavernest-app/test/diagnostics_screen_test.dart`
  - **Notes**: The safe diagnostics widget/port test failed before the domain snapshot and platform adapter existed.

  **Gherkin (binds) →** "Client presents a safe support snapshot"

  ```gherkin
  Scenario: Client presents a safe support snapshot
    Given the combined endpoint returns the diagnostics snapshot
    When I open Diagnostics
    Then only its contracted safe fields are visible
  ```

- [x] [AI] GREEN: regenerate `apps/beavernest-app/lib/generated/`; implement domain diagnostics snapshots, `DiagnosticsRepository` and `LoadDiagnostics` under `lib/application/{ports,use_cases}/`, `HttpDiagnosticsRepository` under `lib/platform/web/`, and `DiagnosticsScreen`/`SupportSnapshotCard` under `lib/presentation/`; map both generated response variants to domain snapshots inside the Web adapter; run `npm exec nx run beavernest-app:codegen && npm exec nx run beavernest-app:test:unit` — acceptance: the diagnostics scenario passes for both response variants and generated types do not reach the application or presentation.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/{generated/**,domain/diagnostics.dart,application/ports/diagnostics_repository.dart,application/use_cases/load_diagnostics.dart,platform/web/diagnostics_client.dart,platform/web/diagnostics_repository.dart,presentation/diagnostics_sheet.dart}`, `apps/beavernest-app/test/{generated_contract_test.dart,diagnostics_screen_test.dart}`
  - **Notes**: Codegen produced closed diagnostics DTOs; the client validates the exact ready/unavailable variants before mapping them exclusively in the Web adapter.
- [x] [AI] REFACTOR: centralize diagnostics allow-list presentation and generated-to-domain mapping, then run `fvm dart format --output=none --set-exit-if-changed lib test && npm exec nx run beavernest-app:test:coverage && npm exec nx run beavernest-app:test:unit` — acceptance: no forbidden field can reach the visual model and the architecture-boundary test rejects generated imports outside the platform adapter ring.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/{platform/web/diagnostics_client.dart,platform/web/diagnostics_repository.dart,presentation/diagnostics_sheet.dart}`, `apps/beavernest-app/test/{diagnostics_screen_test.dart,architecture_boundaries_test.dart}`
  - **Notes**: The allow-list mapper and presentation accept no internal cause/path/exception field; architecture tests reject generated imports outside the platform ring.
- [x] [AI] RED: add guidance Gherkin and a failing widget test in `specs/apps/beavernest/behavior/beavernest-app/gherkin/browser-shortcut.feature` and `apps/beavernest-app/test/browser_shortcut_test.dart`; run `npm exec nx run beavernest-app:test:unit` — acceptance: the browser-dependent, online-only copy, Escape, focus trap, and return focus behavior fail before the Help card exists.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-app/gherkin/browser-shortcut/browser-shortcut.feature`, `apps/beavernest-app/test/browser_shortcut_test.dart`
  - **Notes**: The widget test failed before browser guidance, Escape dismissal, and return-focus behavior existed.

  **Gherkin (binds) →** "Browser shortcut guidance is honest and accessible"

  ```gherkin
  Scenario: Browser shortcut guidance is honest and accessible
    Given I open Help in the Flutter Web workspace
    When I open browser shortcut guidance
    Then it states browser availability and an internet connection is required
    And Escape closes it and returns focus to Help
  ```

- [x] [AI] GREEN: implement `BrowserShortcutGuidance` in `apps/beavernest-app/lib/presentation/`; run `npm exec nx run beavernest-app:test:unit` — acceptance: the guidance scenario passes without PWA, offline, auto-update, HTTPS, or native-install claims.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/browser_shortcut_dialog.dart`, `apps/beavernest-app/test/browser_shortcut_test.dart`
  - **Notes**: Copy is explicitly browser-dependent and online-only; no PWA, offline, auto-update, HTTPS, or native-install promise is rendered.
- [x] [AI] REFACTOR: validate focus order, 44 px targets, and contrast in the widget tests; add `beavernest-app:specs:behavior:coverage` to `apps/beavernest-app/project.json` with `cargo run --release --quiet --manifest-path apps/rhino-cli/Cargo.toml -- specs behavior-coverage validate --shared-steps specs/apps/beavernest/behavior/beavernest-app/gherkin apps/beavernest-app`, the new `gherkin/**/*.feature` glob, and Dart test/widget inputs; update `test:specs` and `test:quick` to compose it; run `npm exec nx run beavernest-app:lint && npm exec nx run beavernest-app:test:coverage && npm exec nx run beavernest-app:test:specs` — acceptance: keyboard and pointer accessibility assertions pass and affected `specs:behavior:coverage` discovers the Flutter behavior bindings.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/{project.json,test/browser_shortcut_test.dart,test/behavior_bindings_test.dart,test/architecture_boundaries_test.dart}`, `specs/apps/beavernest/behavior/beavernest-app/gherkin/**`
  - **Notes**: The new behavior target covers five Flutter features, scenarios, and all 21 steps; it is composed by both Flutter specs and quick gates. Widget checks cover keyboard focus, Escape/return focus, contrast, and 44px controls.
- [x] [AI] RED: add `specs/apps/beavernest/behavior/beavernest-app/gherkin/cache-update.feature`, a failing hosted-bundle cache scenario in `apps/beavernest-app-web-e2e/steps/`, and a failing cache/header test in `apps/beavernest-be/tests/unit/Tests/StaticRoutingTests.fs`; run `npm exec nx run beavernest-app-web-e2e:test:e2e` — acceptance: the legacy Vite bundle and stale deployment fail the same-origin hosted test.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `specs/apps/beavernest/behavior/beavernest-app/gherkin/cache/cache-update.feature`, `apps/beavernest-be/tests/unit/Tests/StaticRoutingTests.fs`, `apps/beavernest-app-e2e/steps/hosted_bundle.steps.ts`
  - **Notes**: The legacy Vite hosting and `/assets/` cache assumptions could not satisfy the Flutter hosted-bundle scenario or revalidation assertions.

  **Gherkin (binds) →** "Normal navigation receives a fresh hosted Flutter bundle"

  ```gherkin
  Scenario: Normal navigation receives a fresh hosted Flutter bundle
    Given version one of the F# hosted Flutter bundle has been loaded
    When version two is deployed and I navigate normally
    Then the browser loads a coherent version two bundle without a service worker
  ```

- [x] [AI] Inventory the candidate Flutter bundle before cache implementation: run `beavernest_cache_temp=$(mktemp -d) && npm exec nx run beavernest-app:build && find apps/beavernest-app/build/web -type f -exec shasum -a 256 {} \; | sort > "$beavernest_cache_temp/v1.sha256"`, change the version value in `apps/beavernest-app/lib/application/build_version.dart` that is deliberately rendered by the status shell, rebuild, and run `find apps/beavernest-app/build/web -type f -exec shasum -a 256 {} \; | sort > "$beavernest_cache_temp/v2.sha256" && diff -u "$beavernest_cache_temp/v1.sha256" "$beavernest_cache_temp/v2.sha256" > plans/in-progress/beaver-flutter/evidence/flutter-web-v1-v2.diff || true && rm -rf -- "$beavernest_cache_temp"`; record the filename/hash diff and the exact revalidate versus immutable map for `index.html`, bootstrap/loader/main scripts, manifests, CanvasKit, fonts, and hashed files in `plans/in-progress/beaver-flutter/evidence/flutter-web-asset-inventory.md` — acceptance: the production-consumed version value changes an observed v2 artifact, cache classifications are based on that evidence, and no un-hashed file is marked immutable.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/application/build_version.dart`, `apps/beavernest-app/lib/presentation/status_dashboard.dart`, `plans/in-progress/beaver-flutter/evidence/{flutter-web-v1-v2.diff,flutter-web-asset-inventory.md}`
  - **Notes**: The rendered v1→v2 marker changed un-hashed `flutter_bootstrap.js` and `main.dart.js`; no content-addressed filename was observed, so every observed Flutter asset is revalidated.
- [x] [AI] GREEN: atomically rename `apps/beavernest-app-web-e2e/` to `apps/beavernest-app-e2e/`, replace the Vite client with `apps/beavernest-app/`, and update `AGENTS.md` to record the user-approved `[domain]-app` future-multiplatform exception, Docker, `StaticContent.fs` using the recorded cache map, static routing tests, `apps/beavernest-be/scripts/run-e2e.sh`, workflow trigger/FVM setup/artifact paths, specs, registries, docs, infra tests, and every file in the File-Impact Analysis; preserve `EnvTierLoader.fs`, its `BeaverNestBe.fsproj` compile entry and `fsharp-env-loader` `ProjectReference`, and keep `loadEnvTier ()` as the first `Program.fs` operation before configuration. In `Dockerfile`, copy `libs/fsharp-env-loader/fsharp-env-loader.fsproj` to `libs/fsharp-env-loader/` before restore and `libs/fsharp-env-loader/src/` to `libs/fsharp-env-loader/src/` before publish; in `Dockerfile.integration`, copy the project to `/libs/fsharp-env-loader/` before restore and source to `/libs/fsharp-env-loader/src/` before build. Forward `APP_ENV: "${APP_ENV:-local}"` to `beavernest-app`, backup, integrity, restore, and the CI override without nested YAML mappings removing it; set `APP_ENV=${APP_ENV:-test}` before `run-e2e.sh` constructs Compose; prove all operational mappings with `COMPOSE_PROFILES=operations APP_ENV=contract-proof docker compose -f infra/dev/beavernest-app/docker-compose.yml -f infra/dev/beavernest-app/docker-compose.ci.yml config --format json | jq -e '[.services["beavernest-app"], .services["beavernest-backup"], .services["beavernest-integrity"], .services["beavernest-restore"] | .environment.APP_ENV == "contract-proof"] | all'`. Run `APP_ENV=test npm exec nx run beavernest-be:test:quick && bash infra/dev/beavernest-app/tests/clean-image-build.sh && npm exec nx run beavernest-app:build && APP_ENV=test npm exec nx run beavernest-app-e2e:test:e2e` — acceptance: the F# container serves a coherent Flutter `build/web` bundle without changing the backend tier-loader contract, source-only Docker builds retain the loader, rendered Compose proves every operational service receives its caller tier, container E2E receives `APP_ENV=test` before readiness, the naming exception is documented, and the normal-navigation cache scenario passes.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app-web/**` (removed), `apps/beavernest-app-e2e/**` (renamed), `apps/beavernest-app/**`, `apps/beavernest-be/{Dockerfile,Dockerfile.integration,project.json,scripts/run-e2e.sh,src/**,tests/**}`, `infra/dev/beavernest-app/**`, `.github/workflows/beavernest-app-test-local-deploy-stag.yml`, `repo-config.yml`, `package-lock.json`, `AGENTS.md`, `.claude/**`, generated binding mirrors, and affected BeaverNest documentation/spec indexes.
  - **Notes**: The source-only production image, non-root/curl assertion, renamed hosted Flutter E2E, backend and Flutter quick gates, infra contracts, and profile-enabled rendered Compose contract pass. Existing `operations` profiles are preserved; enabling them is required to render the backup, integrity, and restore services for the all-service `APP_ENV` proof.
- [x] [AI] REFACTOR: verify the recorded cache map still classifies bootstrap/manifests/unhashed files for revalidation, delete legacy TypeScript contracts/Vite packages, and run `APP_ENV=test npm exec nx run fsharp-env-loader:test:quick && APP_ENV=test npm exec nx run beavernest-be:test:quick && npm exec nx run beavernest-app:test:specs && npm exec nx run beavernest-app-e2e:test:specs` plus a BeaverNest-scoped legacy-identity sweep — acceptance: only historical plan/archive matches remain, the hosted-bundle scenario is green, and the backend tier-loader regression remains green.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `infra/dev/beavernest-app/Dockerfile.fe.dev` (removed), `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: The four regression gates pass. The original repository-wide `vite|react` grep was corrected to the BeaverNest cutover surface because unrelated supported applications and course content legitimately use React/Vite. The scoped sweep is clean except the three contract scripts that intentionally assert legacy identifiers are absent; the stale Vite development Dockerfile was removed.
- [x] [AI] Start the hosted combined runtime using the safe disposable setup from `apps/beavernest-be/scripts/run-e2e.sh`: run `beavernest_fixture_root=$(mktemp -d) && beavernest_project="beavernest-manual-${RANDOM}-${RANDOM}" && install -d -m 0700 "$beavernest_fixture_root/data" "$beavernest_fixture_root/backups" && export APP_ENV=test BEAVERNEST_BE_VPN_HOST_IP=127.0.0.1 BEAVERNEST_BE_PUBLIC_PORT=19320 BEAVERNEST_BE_HOST_DATA_DIRECTORY="$beavernest_fixture_root/data" BEAVERNEST_BE_BACKUP_DIRECTORY="$beavernest_fixture_root/backups" && beavernest_compose=(docker compose --env-file /dev/null -p "$beavernest_project" -f infra/dev/beavernest-app/docker-compose.yml) && trap '"${beavernest_compose[@]}" down --remove-orphans; rm -rf -- "$beavernest_fixture_root"' EXIT && "${beavernest_compose[@]}" up -d --build beavernest-app && for beavernest_attempt in $(seq 1 120); do curl -fsS http://127.0.0.1:19320/api/v1/readiness >/dev/null && break; [ "$beavernest_attempt" -lt 120 ] || exit 1; sleep 1; done`; use Playwright MCP to `browser_navigate` to the root route, `browser_snapshot` loading, ready, and unavailable states, `browser_click` Refresh status and Diagnostics, inspect `browser_console_messages`, and `browser_take_screenshot` at mobile (<768 px), tablet (768–1023 px), and desktop (>=1024 px) widths; save `plans/in-progress/beaver-flutter/evidence/phase-2-web-{loading,ready,unavailable}-{mobile,tablet,desktop}.png` — acceptance: the container receives `APP_ENV=test` before readiness; this single-locale application has UI-to-API-to-UI recovery, no horizontal scroll, visible keyboard focus, compliant target sizes/contrast, and only approved browser-shortcut copy.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/evidence/phase-2-web-{loading,ready,unavailable}-{mobile,tablet,desktop}.png`
  - **Notes**: The interactive browser connector had no attached page in this session, so an equivalent fresh Playwright Chromium run exercised the same hosted Docker endpoint. It captured every requested state/breakpoint, including controlled 503-to-Refresh recovery, diagnostics, Help/Escape, visible focus, no overflow, and no unexpected console errors.
- [x] [AI] Run `curl --include --silent --show-error` against the disposable combined runtime's readiness and diagnostics endpoints; obtain the unavailable proof by running `npm exec nx run beavernest-be-e2e:test:e2e` with the existing disposable unready fixture and copy its sanitized 503 header/body assertion into `plans/in-progress/beaver-flutter/evidence/phase-2-api-diagnostics-unavailable.md`; capture the ready responses in `plans/in-progress/beaver-flutter/evidence/phase-2-api-{readiness,diagnostics-ready}.md` — acceptance: readiness succeeds, diagnostics returns respectively 200 and fixture-proven 503 with `Cache-Control: no-store`, and neither response includes path, exception, SQL, host identifier, migration name, or an extra field.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/evidence/{phase-2-api-readiness.md,phase-2-api-diagnostics-ready.md,phase-2-api-diagnostics-unavailable.md}`, `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: A free isolated loopback port was used because 19320 was already held by an unrelated local process. Live ready responses are 200 with `Cache-Control: no-store`; the hosted disposable corrupt-SQLite proof passes all 13 scenarios and asserts the exact closed 503 body with no sensitive detail or validator.
- [x] [AI] Run the static [UI quality gate](../../../repo-governance/workflows/ui/ui-quality-gate.md) and [API quality gate](../../../repo-governance/workflows/api/api-quality-gate.md) against the P2 diff; complete their maker→checker→fixer cycles and save reports below `generated-reports/` — acceptance: both gates report no blocking findings and their evidence links to the responsive screenshots and sanitized API captures.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `generated-reports/{swe-ui__p2-final__2026-08-13--12-50__audit.md,api-quality__p2-final__2026-08-13--12-50__audit.md}`
  - **Notes**: Both strict gates reached their required double-zero confirmations: UI has 0 CRITICAL/HIGH/MEDIUM across all seven dimensions, and the live API has zero in-threshold findings across two current-build sweeps.
- [x] [AI] Run Rule-15 web exploratory/usability/design retest and Rule-16 API exploratory retest against the running combined endpoint; append each `EWT-*`, `UWT-*`, `DWT-*`, or `AET-*` defect as an unchecked item below — acceptance: no defect remains unchecked before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: Final EWT (20 checks), UWT, DWT, and API exploratory retests are double-zero; every recorded follow-up below is resolved.

### Rule-15/16 Retest Follow-ups

- [x] [AI] EWT-001: Hosted Flutter workspace is blank at 360, 768, and 1280 px because the production CSP blocks the Flutter renderer's CanvasKit/Wasm bootstrap — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/src/BeaverNestBe/Api/SecurityHeaders.fs`, `apps/beavernest-be/tests/unit/Tests/SecurityHeaderTests.fs`
  - **Source**: Rule-15 web exploratory retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-ewt/retest-report.md`
  - **Reproduction**: `node local-temp/beaver-flutter-p2-ewt/retest.mjs`
  - **Notes**: The final fresh hosted Chromium retest passes all 20 checks, including local CanvasKit/Wasm rendering, breakpoints, recovery, diagnostics, Help/Escape, cache headers, and no console errors (`local-temp/beaver-flutter-p2-ewt/final-19322-report.md`).
- [x] [AI] AET-001: Declared GET resources return 404 to safe HEAD requests instead of their bodyless equivalent representations — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-be/src/BeaverNestBe/WebApp.fs`, `apps/beavernest-be/tests/unit/Tests/HttpMethodSemanticsTests.fs`
  - **Source**: Rule-16 API exploratory retest, 2026-08-13
  - **Reproduction**: `curl -sS -D - -o /dev/null -X HEAD http://127.0.0.1:19321/api/v1/{health,readiness,diagnostics}`
  - **Scope**: `OPTIONS` is recorded as observed 404 but is not a defect absent an explicit route-method contract.
  - **Notes**: Explicit bodyless HEAD routes now reuse the GET representations; focused proof and three full backend quick runs pass (86/86) while preserving intentionally unsupported OPTIONS.
- [x] [AI] DWT-001: The rendered workspace does not implement the selected Focused Status Dashboard composition or its desktop status/diagnostics rail — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/{status_dashboard.dart,workspace_shell.dart}`, `apps/beavernest-app/test/workspace_shell_test.dart`
  - **Source**: Rule-15 design retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-dwt/retest-report.md`
  - **Notes**: Final DWT verification confirms the selected dashboard and responsive desktop rail at all tested breakpoints.
- [x] [AI] DWT-002: Diagnostics is an information-poor modal rather than the selected responsive support workspace with safe-field cards, components, and retry — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/{diagnostics_sheet.dart,workspace_shell.dart}`, `apps/beavernest-app/test/diagnostics_screen_test.dart`
  - **Source**: Rule-15 design retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-dwt/retest-report.md`
  - **Notes**: Final DWT verification confirms the in-shell safe diagnostics workspace, readiness components, and retry treatment.
- [x] [AI] DWT-003: The selected Help card/treatment is absent and Escape does not close the browser-shortcut treatment or return focus — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/browser_shortcut_dialog.dart`, `apps/beavernest-app/test/browser_shortcut_test.dart`
  - **Source**: Rule-15 design retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-dwt/retest-report.md`
  - **Notes**: Final DWT and EWT verification confirm visible Browser Help, actionable content, Escape close, and focus return.
- [x] [AI] UWT-001: Browser shortcut guidance is ambiguous and provides no visible first-time-user help or result — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/browser_shortcut_dialog.dart`, `apps/beavernest-app/test/browser_shortcut_test.dart`
  - **Source**: Rule-15 usability retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-uwt/final/uwt-report.md`
  - **Notes**: Final UWT verification confirms the visible Browser Help treatment and actionable online-only guidance.
- [x] [AI] UWT-002: Keyboard focus is not visibly apparent and the enabled accessibility traversal repeats workspace controls — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/{browser_shortcut_dialog.dart,workspace_shell.dart}`, `apps/beavernest-app/test/{browser_shortcut_test.dart,workspace_shell_test.dart}`
  - **Source**: Rule-15 usability retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-uwt/final/uwt-report.md`
  - **Notes**: The final semantic traversal is Status → Diagnostics → Refresh → Help with visible focus outlines.
- [x] [AI] DWT-004: Status cards are under-filled or oversized across responsive breakpoints, hiding the intended dashboard density and follow-up actions — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/{status_dashboard.dart,workspace_shell.dart}`, `apps/beavernest-app/test/status_dashboard_test.dart`
  - **Source**: Rule-15 design retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-dwt/19322/final-density/retest-report.md`
  - **Notes**: Final Chromium retest confirms compact natural-height cards, 1/2/3-column reflow, visible actions and Help, and no overflow or console/page errors at 360, 768, and 1280 px (`local-temp/beaver-flutter-p2-dwt/19322/final-card-fix/retest-report.md`).
- [x] [AI] UWT-003: Oversized status cards bury Refresh status and Browser Help below the initial unavailable viewport — fix before archival.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `apps/beavernest-app/lib/presentation/{status_dashboard.dart,workspace_shell.dart}`, `apps/beavernest-app/test/{status_dashboard_test.dart,workspace_shell_test.dart}`
  - **Source**: Rule-15 usability retest, 2026-08-13
  - **Evidence**: `local-temp/beaver-flutter-p2-uwt/final-19322-rerun/uwt-report.md`
  - **Notes**: Final responsive-card retest verifies recovery copy and Refresh status remain in the same controlled mobile-unavailable viewport; natural-height cards preserve reachable diagnostics and Help at 375, 559/560, 768, 799/800, and 1440 px (`local-temp/beaver-flutter-p2-uwt/final-19322-card-fix/uwt-report.md`).

### Phase 2 Gate

- [x] [AI] All checks must pass before starting Phase 3: run `APP_ENV=test npm exec nx affected -t build,test:quick,lint,specs:behavior:coverage`, `APP_ENV=test npm exec nx run fsharp-env-loader:test:quick`, `APP_ENV=test npm exec nx run beavernest-be:test:quick`, `APP_ENV=test npm exec nx run beavernest-be:test:integration`, `APP_ENV=test npm exec nx run beavernest-be-e2e:test:e2e`, `APP_ENV=test npm exec nx run beavernest-app-e2e:test:e2e`, `bash infra/dev/beavernest-app/tests/clean-image-build.sh`, `COMPOSE_PROFILES=operations APP_ENV=contract-proof docker compose -f infra/dev/beavernest-app/docker-compose.yml -f infra/dev/beavernest-app/docker-compose.ci.yml config --format json | jq -e '[.services["beavernest-app"], .services["beavernest-backup"], .services["beavernest-integrity"], .services["beavernest-restore"] | .environment.APP_ENV == "contract-proof"] | all'`, and `beavernest_integration_compose=(docker compose -f apps/beavernest-be/docker-compose.integration.yml); trap '"${beavernest_integration_compose[@]}" down -v' EXIT; "${beavernest_integration_compose[@]}" up --abort-on-container-exit --build` — acceptance: affected checks, behavior-spec coverage, API E2E, Flutter Web E2E, clean production image, rendered operational Compose contract, and source-only integration image pass after the rename; the backend retains its composition-root tiered configuration contract without reading a real staging/production file.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: The affected and pre-push gates pass after resolving the unrelated OSE FSharp.Core restore mismatch. Flutter quick passes 34 tests/87.30%; backend quick passes 86 tests/92.13%; integration passes 13/13 locally and from the source-only Compose image; both E2E suites pass; clean image builds non-root with curl; and operational profile configuration renders every requested `APP_ENV` mapping.
- [x] [AI] At the P2 boundary, follow the Delivery-Boundary Integration Protocol for `beaver-flutter-p2` — acceptance: the atomic cutover PR is fully reviewed, CI-green, visual/browser evidence attached, and merged.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: PR #183 merged as `964b6f8b32e4be774046895d876958de44bdb63e` after an independently clean review and all 25 required checks passed. The committed Phase 2 visual, browser, and API evidence is retained under `evidence/`.

**Pause Safety:** Safe to stop after Flutter Web is the only client and its three browser layouts are proven. Resume with `git fetch origin --prune && git switch -c beaver-flutter-p3 origin/main`.

## Phase 3 Branch Handoff

- [x] [AI] After the P2 PR merges, run `git fetch origin --prune && git switch -c beaver-flutter-p3 origin/main` in `worktrees/beaver-flutter/` — acceptance: P3 starts from the merged cutover on a fresh closure branch while reusing the plan's sole worktree.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/delivery.md`
  - **Notes**: Fetched merged `origin/main` and created `beaver-flutter-p3` at `964b6f8b32e4be774046895d876958de44bdb63e` inside the existing `worktrees/beaver-flutter/` worktree.

## Phase 3: Knowledge Capture and Plan Closure

- [x] [AI] Review `learnings.md`, classify every item through secret/sensitivity and repository-relevance gates, promote any code learning to a separate `plans/backlog/` plan rather than landing it inline, and compare any idea candidate with `plans/ideas/README.md` plus existing two-pagers before creating or extending a brief — acceptance: no secret, sensitive endpoint, duplicate idea, or inline code follow-up remains in the archived plan.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/{learnings.md,delivery.md}`
  - **Notes**: The explicit terminal-none record confirms no sensitive/repository-relevant learning remains. Existing BeaverNest two-pagers already cover prospective follow-ups, so no duplicate idea or inline code work was created.
- [x] [AI] Run the plan-quality-gate in strict mode twice and save reports under `generated-reports/`; apply only validated plan fixes — acceptance: two consecutive strict validations have zero CRITICAL/HIGH/MEDIUM findings.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/in-progress/beaver-flutter/{delivery.md,prd.md}`, `apps/rhino-cli/src/application/docs/naming.rs`, `generated-reports/plan__{b44eabb8-5841-4f8c-85fe-61676111eb5c,dcb60c04-f441-4a03-8985-35fe0d785742,5ade3579-e5ad-4fd2-83a4-63f18e01fb5d}__2026-08-13--{17-03,17-14,17-17}__audit.md`
  - **Notes**: The first strict audit found two MEDIUM documentation gaps, which were repaired. Two independent subsequent strict validations each report zero CRITICAL/HIGH/MEDIUM/LOW findings. A direct-path Rhino regression ensures the mandated `generated-reports/plan__...__audit.md` artifacts are not incorrectly treated as documentation filenames by the staged naming gate.
- [x] [AI] Update `plans/in-progress/README.md`, move the plan to `plans/done/YYYY-MM-DD__beaver-flutter/`, and update `plans/done/README.md` in the P3 branch; run `npm run lint:md:fix` and `npm run validate:sync` — acceptance: plan indexes, links, diagrams, mockup assets, and generated bindings are valid.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/{in-progress/README.md,done/README.md,done/2026-08-13__beaver-flutter/**}`, `.gitignore`, `apps/rhino-cli/src/application/docs/{naming,links}.rs`, `apps/beavernest-app/project.json`, `infra/dev/beavernest-app/tests/frontend-integration-target.sh`, `generated-reports/plan__{b44eabb8-5841-4f8c-85fe-61676111eb5c,dcb60c04-f441-4a03-8985-35fe0d785742,5ade3579-e5ad-4fd2-83a4-63f18e01fb5d}__2026-08-13--{17-03,17-14,17-17}__audit.md`
  - **Notes**: The plan was moved through the prescribed dated archive path; indexes now point to it. The first strict audit and both zero-finding confirmations are committed with the closure evidence. Root-cause regressions ensure mandated audit-report filenames and the local FVM cache cannot falsely fail the staged naming or repository link gates. Flutter targets use non-interactive FVM setup and explicitly bind Flutter subprocesses to that selected cache, preventing an ambient checkout from writing `0.0.0-unknown` metadata during a required gate.
- [x] [AI] At the P3 boundary, follow the Delivery-Boundary Integration Protocol for `beaver-flutter-p3` — acceptance: closure PR is reviewed, CI-green, and merged; then offer worktree cleanup to the user without deleting it silently.
  - **Date**: 2026-08-13
  - **Status**: Done
  - **Files Changed**: `plans/done/2026-08-13__beaver-flutter/delivery.md`
  - **Notes**: Public closure PR [#185](https://github.com/wahidyankf/ose-public/pull/185) merged at `83cf04fa` after its exact head `4700b84e` passed 25/25 checks and a final clean full review. The required Rhino parity companions are also merged: Primer [#37](https://github.com/wahidyankf/ose-primer/pull/37) at `f0f44df0` and Private #42 (private, not linked) at `33c3e7fa`.

### Phase 3 Gate

- [x] [AI] All checks must pass before declaring closure: verify the archived plan, evidence, and audit reports are committed in the closure PR and `git status --short` is clean — acceptance: plan execution has a traceable terminal record.
  - **Date**: 2026-08-14
  - **Status**: Done
  - **Files Changed**: `plans/done/2026-08-13__beaver-flutter/delivery.md`
  - **Notes**: The terminal check found `git status --short` empty after the user directed cleanup of the two prior concurrent modifications. The archived plan, evidence, and audit reports remain in merged closure PR #185; certification PR #186 recorded the blocker, and this PR records its resolution after the required checks pass.

**Pause Safety:** Safe to stop after the user is offered cleanup. Resume with `git -C worktrees/beaver-flutter status --short`.
