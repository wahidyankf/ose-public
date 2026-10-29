# docker-to-podman delivery readiness

## Frozen revision

Frozen on 2026-10-29. Runtime inputs (everything outside `plans/`) are those of commit `b25004578` on branch
`docker-to-podman-base`: `e88a30b05` plus the workflow and test commit `df84f0efc` plus a merge of `origin/main`
(`de3bfa14d`, a governance-docs change). Commits after `b25004578` add plan evidence only. The pull request is #749.
The change set against `origin/main` is 408 files: 199 added, 208 modified, 1 deleted (the old
`.github/actions/setup-docker-cache/action.yml`, replaced by `setup-podman`).

The Phase 4 gate in `delivery.md` names `evidence/P4/delivery.md` for the post-merge evidence. This file is the
pre-merge readiness record. Post-merge facts go in `evidence/P4/publishing-terminal.md` when that proof exists.

## Touch-ledger reconciliation

| Area                                                                                    | Files | Reconciled against                                            |
| --------------------------------------------------------------------------------------- | ----: | ------------------------------------------------------------- |
| `plans/in-progress/docker-to-podman/` (plan, evidence, captures)                        |   181 | Plan and evidence home                                        |
| `repo-governance/` (development, workflows, principles, conventions)                    |    51 | `evidence/P4/rule-manifest.md`                                |
| `apps/ayokoding-cli` (Go runner, specs, scripts)                                        |    25 | `evidence/P1/`                                                |
| `apps/ayokoding-www*` (Mermaid focus ring, specs, E2E bindings, build-worker env entry) |    32 | `evidence/P3/target-matrix.md`, `evidence/P3/ui-gates/`       |
| `apps/ose-*`, `apps/organiclever-*`, `libs/web-ui`, `infra/dev`                         |   ~50 | `evidence/P2/callers-red.md`, `evidence/P3/compose-stacks.md` |
| `.github/workflows`, `.github/actions`                                                  |    10 | `evidence/P2/ci.md`, `evidence/P2/ci-red.md`                  |
| `docs/`, `.agents/skills`, `specs/`                                                     |   ~35 | `evidence/P4/docs-manifest.md`                                |
| `scripts/`, `package.json`, `repo-config.yml`                                           |    ~8 | `evidence/P2/local-gates.md`                                  |

Checks on the full diff against `origin/main`:

- No path under `apps/ayokoding-www/content/` changed. The content tree hash and both peer worktree status digests match
  the Phase 0 base (`evidence/P3/ac-09.md`).
- No secret, `.env`, `.env.prod` or `.env.stag` file changed. The one `.env*` path in the diff is
  `apps/ayokoding-www/.env.example`, which adds a commented, empty `AYOKODING_WWW_BUILD_WORKERS` entry.
- No hosting, registry or shared-state change. Workflow triggers, permissions, GHCR image names and tags are unchanged
  (`evidence/P2/publishing.md`). Docker data, volumes and other Podman workloads were not pruned or removed.
- The local `.serena/project.yml` modification is outside the change set and is not committed.
- The temporary proof overlay exists only on the throwaway branch `docker-to-podman-proof-final`. It is not in this
  change set.

## Final-head gates (local, 2026-10-29)

All ran under HIPPO admission on the merged tree (`b25004578`). All exited 0.

| Gate                                                                                              | Result                                                               |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run test:validators`                                                                         | exit 0, 198 of 198                                                   |
| `npm run doctor`                                                                                  | exit 0, 25 declared toolchains, no findings                          |
| `./rhino harness adapters validate`                                                               | exit 0, canonical adapter validation clean                           |
| `./rhino md internal-link validate`                                                               | exit 0, 17,300 links, no findings                                    |
| `./rhino governance word-budget validate`                                                         | exit 0                                                               |
| `git diff --check origin/main...HEAD`                                                             | exit 0                                                               |
| `prettier --check` on every added or modified Markdown, YAML, JSON, `.mjs`, `.ts` and `.tsx` path | exit 0                                                               |
| Full pre-commit gate set on the merge commit                                                      | passed (hadolint, actionlint, Markdown gates, commit-message screen) |
| `scripts/public-safety/check.sh` on each outgoing range                                           | exit 0                                                               |

After #754 and #755 added contract tests, `npm run test:validators` passes 204 of 204 on the merged tree (re-run
2026-10-29 for the archival audit).

## Acceptance criteria to proof

The full trace with counts, run ids and head SHAs is `evidence/P3/ac-trace.md`.

| AC    | Proof                                                                                                          | State                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| AC-01 | Ubuntu doctor exit 0 and 9 of 9 preflight tests; macOS preflight passed                                        | Met on Ubuntu; macOS full `doctor` exits 1 on unrelated toolchains       |
| AC-02 | Rootful and unreachable engines refused before workload creation (real-engine adapter, preflight tests)        | Met                                                                      |
| AC-03 | Provider scenario in the real-engine adapter; Ubuntu stacks healthy with a Docker shim; Ayo stack in CI        | Met on Ubuntu and CI; macOS Compose stacks not run                       |
| AC-04 | Real-engine adapter 70 of 70, exit 0 on `e88a30b05`                                                            | Met                                                                      |
| AC-05 | Native build and run share one store; pull, push and login denied (`P1/runner.md`)                             | Met                                                                      |
| AC-06 | Exit codes 124, 125, 126, 127, 130 distinguished (adapter and integration)                                     | Met, with the declared e2e exemptions for 124 and 126                    |
| AC-07 | Both images built, inspected and started; auth with a fake registry; tags and triggers compared; PR gate green | Pre-merge part met. Publication is post-merge and pending by plan        |
| AC-08 | Disposable PostgreSQL rehearsal `3:60`, `3:60`, `4:100`, `3:60`, two runs                                      | Met                                                                      |
| AC-09 | Content hash and peer digests identical to the Phase 0 base                                                    | Met (peer digests at `24a4c54d4`; content diff rechecked at `e88a30b05`) |
| AC-10 | Plan-order graph acyclic, Phoenix depends on this plan                                                         | Met                                                                      |

## CI receipts

- PR quality gate on `e88a30b05`: every job passed except the skipped Flutter job (run 40752161257).
- Test-only proof, run 40758214180 on the overlay head `42fad78f0` (same runtime inputs as the PR head): row 26
  37 passed; row 33 1,235 passed, 4 skipped, 0 failed with three browsers and zero retries; web-UI extra 148 passed.
  Details in `evidence/P2/ci.md`.
- The PR quality gate on the final PR head is recorded after the push (see `delivery.md`, Post-Push Verification).

## Open items

These do not block the runtime switch. They need a person or a later proof.

1. **macOS.** Compose stack health and prerender copy have no macOS run, and macOS `doctor` exits 1 on `fantomas`,
   `csharpier` and `mix`. The macOS evidence is from 2026-10-28.
2. **Ayo Compose stack locally.** Local builds run out of disk. The CI proof stands in. This needs maintainer
   acceptance. (Row 20 is closed: run 40781987617 passed 13 files and 192 tests on the final inputs. The cgroup, DNS and
   mount checks are closed: they are a `setup-podman` step since #755, proven on a runner in run 40783837245.)
3. **New `setup-podman` line in the `ayokoding-cli` `e2e` job (closed).** The job is skipped on `main` while the
   `ferret-cli` integration baseline fails. Run 40778630932 on a throwaway branch without that gate ran the step on the
   runner (podman-compose 1.6.0 installed and checked) and `ayokoding-cli` E2E passed. The same run showed a second
   pre-existing `ferret-cli` failure (`ferret-cli-e2e`, interpreter-guard scenarios) for the owner.
4. **`ferret-cli:test:integration` baseline failure** (6 `test_hook_registrations` cases) fails on main's scheduled
   runs too. Recorded as out of scope by the maintainer.
5. **Postgres service scenario on a cold store (closed).** An emulated cold store failed it twice, but the emulation
   itself failed in rootless networking. On a real cold GitHub runner the scenario passed as part of the full
   real-engine suite (run 40778630932, `evidence/P2/ci.md`).
6. **Open UI findings** from the UI gates (for example UWQ-001 dark-mode Mermaid contrast, UWT-014 language-switch 404)
   were all present on `main` before this change and are listed in `evidence/P3/ui-gates/` with their dispositions.
7. **Intermittent firefox stall** in the lesson course-walk helper: seen once, not reproduced locally in 2,678
   direct-probe clicks, not seen in the last two CI runs. Cause unproven.
8. **Two retained disposable PostgreSQL volumes** from the data rehearsal await a disposal decision.
9. **Post-merge (closed):** merged as `f5f544fe7` and published (run 40773249804); see
   `evidence/P4/publishing-terminal.md`. The tag digests were checked through the anonymous registry API and both
   images were pulled by digest and started (`evidence/P4/archival-record.md`, section 4). The terminal audit runs on
   the delivered archival head.

10. **Maintainer decisions at archival (2026-10-29):** the plan archives with items 1, 2, 6 and the `test:validators`
    gate gap accepted or deferred by explicit user answer (`evidence/P4/archival-record.md`, sections 1 and 2).
