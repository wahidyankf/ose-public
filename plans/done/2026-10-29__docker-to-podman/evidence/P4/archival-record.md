# docker-to-podman archival record

Recorded on 2026-10-29, on branch `docker-to-podman-archive` (from `origin/main` at `4cfaf9533`). The pre-archival audit
by `plan-execution-checker` returned BLOCK with sixteen findings. This file records the facts that closed them. It
does not change any earlier evidence.

## 1. Maintainer decisions (2026-10-29)

Each decision was given directly by the maintainer, in answer to a question asked in this session. None is a
self-deferral by the executing agent.

| Question                                                                                  | Maintainer answer                                                           | Effect                                                                                |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Archive the plan now, accepting the named gaps                                            | "gas arsip" (go archive)                                                    | Archive with the gaps in section 2 accepted                                           |
| Fix or defer the blocking UI findings (UWQ-001, DWT-001, UWT-014, DWT-002, HIGH UWT rows) | "Tunda semua, lapor"                                                        | Deferred and reported; no fix owner in this plan                                      |
| Fix or defer EWT-003                                                                      | "Tunda, lapor"                                                              | Deferred and reported                                                                 |
| Wire `npm run test:validators` into a gate                                                | "Tunda, lapor"                                                              | Deferred and reported (knowledge-capture item 17)                                     |
| Earlier grill (browser count, holding the merge, report-only items)                       | "Tetap 3 browser"; "Tetap tahan"; "Laporan saja"; "Catat saja, bukan scope" | Recorded in `evidence/P2/ci.md` and `evidence/P3/target-matrix.md` where each applies |

## 2. Gaps accepted by the maintainer at archival

| Gap                                                                                 | Why it stays open                                                                          | Where the fact lives                                                   |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| macOS Compose stack health and prerender copy (AC-03), and a passing macOS `doctor` | The macOS host is not available for a rerun on the final head. Its container tools pass.   | `evidence/P3/macos-platform.md`, `evidence/P3/ac-trace.md`             |
| Local Ayokoding Compose stack and local container browser proof (en, id)            | Five local builds stopped at the disk floor. CI run 40693498144 proves the container.      | `evidence/P3/manual/ayokoding-www.md`, `evidence/P2/local-stacks.md`   |
| Blocking UI findings and EWT-003                                                    | Defects exist on `main` before this change and sit in components this plan did not change. | `evidence/P3/ui-gates/`, `evidence/P3/scope-dispositions.md` section 5 |
| `test:validators` is in no declared gate                                            | A gate change is separate work.                                                            | `evidence/P5/knowledge-capture.md`, item 17                            |

## 3. Delivery-mode record

The plan declares `worktree-to-pr`, one pull request. Delivery ran as one runtime-switch pull request, then follow-up
pull requests for evidence and for one proven CI hardening step. Every pull request had a green exact-head
`pr-quality-gate.yml` and a pinned-head leak review before its squash merge.

| PR   | Purpose                                                  | Head        | Squash merge on `main` |
| ---- | -------------------------------------------------------- | ----------- | ---------------------- |
| #749 | Runtime switch, rules, docs, CI, plan evidence           | `7660e498f` | `f5f544fe7`            |
| #751 | Post-merge publication proof                             | `9eaab17e7` | `7b2c05c85`            |
| #752 | Last operational Docker wording                          | `cfd544448` | `3b04373fc`            |
| #753 | Registry digests, prod workflow run, residual search     | `b52171af7` | `fd95823ac`            |
| #754 | `ayokoding-cli` e2e job `setup-podman` step and its test | `115267796` | `f03747d98`            |
| #755 | `setup-podman` cgroup, DNS and overlay assertion step    | `a7d2e273b` | `1c07b224f`            |
| #756 | Row 20 and runner capability proof                       | `f8888fafa` | `bfa75077c`            |
| #757 | Cold-runner Postgres service result                      | `910aa526a` | `4cfaf9533`            |

Deviation from "one pull request": the plan's Phase 4 and Phase 5 steps that need a merged tree (publication, terminal
audit, tick of post-merge items) cannot land in the pre-merge PR. The follow-ups carry evidence only, except #755, which
adds a CI step with a contract test and was proven on a runner on a throwaway branch (run 40783837245) because the PR
gate's path filters skipped its container jobs. This archival change is the last pull request of the plan.

## 4. Published-image proof (closes audit finding F1)

Run on 2026-10-29 from the registry, not from a local build. A task-owned `docker` shim first on `PATH` logged calls and
exited 99; `DOCKER_HOST` and `DOCKER_CONTEXT` were unset.

| Image                                | Pulled by digest                                                          | Inspected                                         |
| ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `ghcr.io/wahidyankf/ose-be`          | `sha256:15e530e2611ba262f96498c2b2e764204952676c34756244c3cf5a4ec5e86d28` | digest equal, `amd64`/`linux`, exposes `8302/tcp` |
| `ghcr.io/wahidyankf/organiclever-be` | `sha256:69cd2e031b359d4c16a0f224597e7f387f54b29cc5ce6c5c2d774a0832d0e929` | digest equal, `amd64`/`linux`, exposes `8202/tcp` |

Both images started rootless on a task-owned network with a PostgreSQL 17 and a NATS container. Health:
`GET /api/v1/health` on `ose-be` returned 200 `{"status":"healthy"}`; `GET /health` on `organiclever-be` returned 200
`{"status":"ok"}`. Docker shim calls: 0. Teardown removed exactly the four containers and the one network by name; the
count of other volumes was unchanged by the run.

## 5. Hosted-URL and deployment observation (closes audit finding F8)

The merge to `main` triggered no new deployment of the three public sites by this change. The plan changes the container
runtime of CI and local workflows, not deployed artifacts, and the `ose-www` and `ayokoding-www` prod workflows were not
dispatched because their Deploy job can push a production branch (see `publishing-terminal.md`). The one prod workflow
dispatched, `organiclever-www-test-local-deploy-prod` (run 40775591629), passed on the Podman path, with its Deploy job
skipped by its own condition. No hosted public URL was changed by this plan, so no hosted URL needed a post-change
check beyond the unchanged scheduled runs that follow.

## 6. Delivery branch inventory

| Ref                            | State                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-to-podman-base`        | Delivered: carried PR #749 and the evidence follow-ups. Removed after the archival merge.                                                                                                       |
| `docker-to-podman-archive`     | Delivered: carries this archival pull request. Removed after its merge.                                                                                                                         |
| `docker-to-podman-proof-final` | Unused throwaway proof branch. Already gone locally and on `origin` (checked 2026-10-29).                                                                                                       |
| `worktree/docker-to-podman-v2` | Retained and escalated: provenance unproven (its reflog shows creation on 2026-10-28, inside the execution window, with 0 unique commits); it is not deleted and is reported to the maintainer. |

## 7. Terminal audit registration

The workflow-owned terminal post-delivery audit runs once, on the delivered archival head, after the archival pull
request merges. Its inputs are fixed here.

| Input                      | Value                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Runtime merge              | PR #749, squash `f5f544fe7`, reviewed head `7660e498f`                                                     |
| Evidence and CI follow-ups | PRs #751 to #757 (section 3)                                                                               |
| Archival merge             | Filled in after the archival pull request merges: its reviewed head and squash commit                      |
| AC matrix                  | `evidence/P3/ac-trace.md`                                                                                  |
| CI and manual proof        | `evidence/P2/ci.md`, `evidence/P3/manual/`, `evidence/P4/publishing-terminal.md`                           |
| Backup and rollback        | `evidence/P3/data-rehearsal.md`, `evidence/P3/recovery.md`; two retained disposable volumes await disposal |
| Knowledge capture          | `evidence/P5/knowledge-capture.md` (43 entries, 16 reported)                                               |

The audit result and the archival merge facts go in a final small pull request, not in this one, so the audit observes
the delivered head rather than a prediction of it.

## 8. Paths after the move

The plan moved to `plans/done/2026-10-29__docker-to-podman/` in the archival commit. Literal `plans/in-progress/docker-to-podman/`
paths that remain in the evidence are the paths at execution time: recorded commands, file lists and capture locations. The
four references that point at live plan files (`tech-docs.md`, `prd.md`) were updated to the done path.
