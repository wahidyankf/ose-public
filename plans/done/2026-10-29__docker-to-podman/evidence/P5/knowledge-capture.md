# Phase 5 knowledge capture

Every entry in [learnings.md](../../learnings.md) now has one terminal state. No entry is untriaged. The seven entries
dated 2026-10-29 were added after the first triage and are triaged below under "Later observations".
Each entry was compared with the existing guidance under `repo-governance/`, `docs/`, `AGENTS.md`
and `.agents/skills/` before its state was chosen. Each `routed inline` target was read first.

Totals: 43 entries. 2 routed inline, 16 reported without plan authorization, 25 discarded. The first 31 entries
kept their original states (7, 7 and 17) until the archival audit of 2026-10-29 found that five of the seven routed
entries needed no edit, because the guidance they cite already existed; those five are now discarded (2 routed, 7
reported, 22 discarded). The same audit moved the Compose-status entry to discarded and routed the `localhost`
template correction that landed in the archival change, so the totals above stand. The seven entries dated 2026-10-29 add 6 reported and 1 discarded, and five entries added
during archival add 4 reported and 1 discarded.

## Terminal states

| Entry                                                         | State     | Destination or reason                                                                                                                              |
| ------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Short image names cannot resolve under rootless Podman        | reported  | Proposed home `docker-conventions.md`; see below                                                                                                   |
| An inventory built by search missed a `docker` call           | discarded | Already covered, no edit needed: `plan-anti-hallucination/anti-pattern-catalog-ap-12-through-ap-14.md`, heading "AP-12"                            |
| course-metadata unit failure, cause open                      | reported  | Needs a root-cause owner; see below                                                                                                                |
| HIPPO deferred two overlapping heavy targets                  | discarded | Already covered, no edit needed: `resource-aware-development/recovery-and-safe-retry.md` (exit 124); `guarded-admission-and-parallelism.md`        |
| Hosted job log endpoints answer not-found for a while         | discarded | Transient hosted-service behavior, no repository action                                                                                            |
| Baseline failure: ferret-cli integration tests                | reported  | Owner is the ferret-cli maintainers; see below                                                                                                     |
| Privilege boundaries can change temporary-directory selection | discarded | One host's `sudo` environment policy                                                                                                               |
| Idle capacity and build concurrency                           | discarded | Local pressure samples; local override already tested; cause still unconfirmed                                                                     |
| Fixture initial state, navigation order, date windows         | discarded | Fixed with fixture tests and a production-query regression test (`evidence/P0/readiness.md`)                                                       |
| A Go temporary directory can be outside the home bind         | discarded | One supplemental probe on one host                                                                                                                 |
| Preserve keyboard access to exposed diagram source            | discarded | Fixed; `apps/ayokoding-www/tests/unit/features/content/shell/mermaid.test.tsx`                                                                     |
| Host profile and pinned consumer compatibility                | discarded | Machine-local rollout; pin change is in `hippo.lock` and `evidence/P0/hippo-prerequisite.md`                                                       |
| Safety-screen temporary-file quota                            | discarded | One host account's quota; local workaround                                                                                                         |
| Native tool discovery in noninteractive commands              | discarded | One host's shell environment; doctor already reports it                                                                                            |
| Join the existing host admission profile                      | discarded | Machine-local setup through `HIPPO_CONFIG`                                                                                                         |
| Scenario fixtures can retain detached DOM                     | discarded | Fixed by the one-file fixture repair; full quick target passes                                                                                     |
| Preserve ownership of live command handles                    | discarded | Already covered, no edit needed: `trustworthy-measurement/rule-7-prove-the-run-finished.md`                                                        |
| Include build dependencies in a target's admission            | discarded | Already covered, no edit needed: `resource-aware-development/guarded-admission-and-parallelism.md` (tier list; "The boundary is not paperwork...") |
| Compose status can conceal native teardown errors             | discarded | Already covered, no edit needed: the cited "re-run the listing and expect zero" sentence existed before this plan                                  |
| Consult machine disk-recovery procedures                      | discarded | Central machine workflow is outside this public repo; in-repo part is in `recovery-and-safe-retry.md`                                              |
| Repository-local temporary paths can exceed socket limits     | discarded | Arises only from a host-specific `TMPDIR` workaround that no rule prescribes                                                                       |
| BDD callback arity and consumed captures                      | discarded | Fixed in step files; the pinned adapter now fails generation on bad arity                                                                          |
| Provider cleanup selection can exceed exact-name guards       | routed    | `docker-artifact-cleanup.md` ("A named volume is never removed by a project label alone")                                                          |
| A provider's CLI subset can differ from the engine's          | discarded | Fixed with regression test `scripts/workflow-container-lookup.test.mjs`                                                                            |
| Verbatim command translation is not proof                     | reported  | Proposed home `evidence-capture/the-rule.md`; see below                                                                                            |
| Local capacity limits are layered                             | discarded | Already covered, no edit needed: `resource-aware-development/recovery-and-safe-retry.md` (exit 124, `storage-blocked`)                             |
| Debug flags can change the host's behavior                    | discarded | One debug run on one personal host                                                                                                                 |
| Resolver search domains make `nslookup` a poor probe          | discarded | Too machine-local                                                                                                                                  |
| `localhost` is not the same address in Podman                 | routed    | Template in `docker-conventions.md` now probes `127.0.0.1` (archival change); the `HEALTHCHECK` bullet wording stays with the maintainer           |
| A running stack proves less than its health state             | reported  | Proposed home `docker-conventions.md`; see below                                                                                                   |
| Staging directories from interrupted builds                   | reported  | Proposed home `docker-artifact-cleanup.md`; see below                                                                                              |

### Later observations (2026-10-29)

| Entry                                                                | State     | Destination or reason                                                                                   |
| -------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| Root `.dockerignore` lacks `.next`; native build copied into context | reported  | Code-homed fix plus a note in `docker-conventions.md`; see item 8                                       |
| Runner disk exhaustion in run 40667489060, stack-first ordering      | discarded | The ordering lived only in the temporary proof job, removed in `60a35faf1`; the durable cause is item 8 |
| Ayo image build needs more than 54 GB of free local disk             | reported  | Proposed home `docs/how-to/setup-development-environment.md`; see item 9                                |
| Unexplained intermittent Firefox `waitForURL` stall                  | reported  | Needs a root-cause owner (flaky-test rule); see item 10                                                 |
| Dockerfile `HEALTHCHECK` ignored under the OCI image format          | reported  | Plan-owner decision, then `docker-conventions.md`; see item 11                                          |
| Backend `down` leaves an anonymous Postgres volume per run           | reported  | Code-homed fix in the two E2E Compose files or scripts; see item 12                                     |
| UI triad found pre-existing defects outside the two judged changes   | reported  | Maintainer decision on owners or deferral; list in `evidence/P3/scope-dispositions.md`; see item 13     |

### Observations added during archival (2026-10-29)

| Entry                                                                 | State     | Destination or reason                                  |
| --------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| A second pre-existing ferret-cli failure hid behind the first         | reported  | ferret-cli maintainers; see item 14                    |
| Legacy `ose-app` and `organiclever-app` stag workflows fail every run | reported  | Maintainer; see item 15                                |
| The PR gate skips every container job for an action-only change       | reported  | Code-homed path-filter fix; see item 16                |
| `test:validators` is run by no declared gate                          | reported  | Maintainer deferred on 2026-10-29; see item 17         |
| An emulated cold Podman store failed for reasons of the emulation     | discarded | Real cold runner passed the scenario (run 40778630932) |

Paths in the table are shortened. The full paths are in each entry's disposition in `learnings.md`.
The directories are `repo-governance/development/quality/`, `repo-governance/development/practice/`,
`repo-governance/development/workflow/` and `repo-governance/development/infra/ci-conventions/`.

## Reported to the maintainer

These are real gaps in durable guidance. Each needs a rule or doc change. The maintainer decides, and
the change goes through rules-propagation. Items 1 and 2 record the one mechanical edit each that did land; nothing
else below was edited in this plan.

1. **Registry-qualified image names.** Home: `repo-governance/development/infra/ci-conventions/docker-conventions.md`,
   section "Podman Runtime and CI Boundaries". Wording: "Name the registry in every image reference,
   for example `docker.io/library/nats:<tag>`, because rootless Podman on a fresh host cannot resolve
   short names." Note: the Dockerfile `FROM` row of
   `repo-governance/development/workflow/dependency-bump-policy/pinning-policy-hard-rule.md` used the
   short `node:` form. This plan aligned its example text with the qualified form (a mechanical edit;
   its point is still tag pinning). Guard in place: `scripts/container-image-qualified.test.mjs`.
2. **`localhost` in the Dockerfile template (template landed inline, 2026-10-29).** Home: the template and the `HEALTHCHECK` bullet in
   `docker-conventions.md`. Wording: "Probe `http://127.0.0.1:<port>`, not `localhost`; Podman
   resolves `localhost` to `::1` first and BusyBox `wget` does not fall back." Guard in place:
   `scripts/container-healthcheck-loopback.test.mjs`.
3. **Stack health proof.** Home: `docker-conventions.md`, section "Podman Compose Patterns". Wording: "A
   zero exit from `podman compose up --wait` does not prove health; read the container health state
   with `podman inspect` and request a real route."
4. **Buildah leftovers after an interrupted build.** Home:
   `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md`,
   section "Leaked Test Containers". Wording: "An interrupted image build can leave Buildah working
   containers and staging files; remove only the ones this session created, listed by ID."
5. **Evidence states only what was executed.** Home:
   `repo-governance/development/quality/evidence-capture/the-rule.md`. Wording: "An evidence file
   states only what was executed, and lists what was not executed."
6. **course-metadata unit failure (cause open).** The cause is not confirmed. One failure appeared
   in two ayokoding-www targets in a long matrix run (just-enough-csharp `estimatedHours` stored 3,
   expected 5) and passed on rerun with no change. The leading hypothesis is a stray untracked or
   ignored file in the content tree, since the check derives the expected hours from the files it
   reads. This is unproven. The flaky-test rule requires a root-cause fix, so it needs an owner:
   the ayokoding-www content-test maintainers. Suggested first step: reproduce with an extra file in
   the course folder and compare the file list the check reads.
7. **ferret-cli baseline failure.** `ferret-cli:test:integration` has 6 failing `hook_registrations`
   tests on the scheduled `non-product-full-quality` runs of `main` (runs 40643742153 and
   40560502045, and earlier). It is unrelated to this migration: the branch has no change under the
   ferret apps. Owner: ferret-cli maintainers. The test name was not found by text search in this
   checkout, so the owner should confirm it.

8. **Build context copies native `.next` output (and the CI disk exhaustion it caused).** The root `.dockerignore`
   has no `.next` entry, and `apps/ayokoding-www/.dockerignore` is not read for a repo-root context, so a tree that has
   built natively copies about 18 GB of build output into the Ayo image. The same copy filled the runner disk in run 40667489060. Evidence: `evidence/P3/manual/ayokoding-www.md` ("Root cause"), `evidence/P2/ci.md`. The root
   `.dockerignore` is unchanged on this branch. Fix: a `swe-*` agent adds a root-level `.next` exclusion or a
   Dockerfile-named ignore file, with BDD and gate treatment. Durable note, home `docker-conventions.md`: "A repo-root
   build context reads only the root `.dockerignore`; an app-level ignore file is not applied." Independent of Podman.
9. **Local Ayo image build capacity.** Five local builds stopped at the HIPPO disk floor from 32 to 54 GB free. Home:
   the AyoKoding stack step of `docs/how-to/setup-development-environment.md`. Wording: "The AyoKoding image build
   needs well over 54 GB of free disk; a smaller disk stops at the HIPPO floor." Facts: `evidence/P3/compose-stacks.md`,
   `evidence/P3/manual/ayokoding-www.md`.
10. **Intermittent Firefox `waitForURL` stall in the course-walk helper (cause open).** One of 1,236 cases in run
    40671958744 timed out at `complete-course.ts:78`. Traces show the click and handler ran and the URL never changed.
    The hydration-race hypothesis is refuted: the toggle was already enabled. The case passed in run 40693498144 and
    in the local 45 of 45 browser matrix on `60a35faf1`, so the cause is unproven. The flaky-test rule requires a
    root-cause fix. Owner: the AyoKoding frontend E2E maintainers. Facts: `evidence/P2/ci.md`, "Row 33 failure
    investigation".
11. **Dockerfile `HEALTHCHECK` is ignored in the OCI image format.** `ose-www` and `organiclever-www` were healthy only
    through their Compose healthchecks. Decision for the plan owner before any such image is published: keep the
    image-level healthcheck and build in the docker format, or drop it. Home after the decision: the `HEALTHCHECK`
    bullet of `docker-conventions.md`. Facts: `evidence/P3/manual/ose-www.md`, observation 1.
12. **Anonymous Postgres volumes after backend `down`.** One per script run and one per manual stack, kept by `down`
    without `-v`. Fix: a named or `tmpfs` data mount in `apps/ose-be/docker-compose.e2e.yml` and
    `apps/organiclever-be/docker-compose.e2e.yml`, or a script step that removes its own project's volumes. Facts:
    `evidence/P3/manual/backends.md`, observation 1.
13. **Pre-existing UI defects from the exploratory, usability and design passes.** One open blocking row (UWQ-001,
    HIGH, same defect as DWT-001), a CRITICAL (UWT-014, language switch) and several HIGH rows, on components unchanged
    from `main`. No owner is assigned. On 2026-10-29 the maintainer deferred all blocking rows and EWT-003 when asked
    directly ("Tunda semua, lapor"; "Tunda, lapor"). Facts and the full list: `evidence/P3/scope-dispositions.md`.
14. **`ferret-cli-e2e` interpreter-guard failures.** Three scenarios in `test_interpreter_guard_steps.py` fail once the
    `e2e` job runs without its `integration` gate (run 40778630932). Owner: the ferret-cli maintainers. Facts:
    `evidence/P2/ci.md`.
15. **Legacy stag workflows fail on every scheduled run.** `ose-app-test-local-deploy-stag` and
    `organiclever-app-test-local-deploy-stag` have failed since before this migration. The plan syntax-checks these
    unsupported scaffolds only. Owner: the maintainer.
16. **Action-only changes skip the container gate.** Add `.github/actions/setup-podman/**` to the path filters of the
    container jobs so a change to the action runs on a runner before merge. Code-homed fix.
17. **`test:validators` is in no declared gate.** Wire the suite, or its two registry validators, into the PR gate or a
    hook. The maintainer deferred this on 2026-10-29 when asked directly.

## Verification limits

- The run IDs and the failing test count for item 7 come from the CI runs the maintainer named.
  They were not re-fetched here.
- No test, build or container command was run for this capture. Test names were checked to exist
  by file name only.
- Entry subjects for the P0 fixture and BDD arity fixes rest on the P0 evidence files, not on a
  fresh run.
- The seven 2026-10-29 entries rest on the cited evidence files only. No command was run for them, and the CI run
  facts were not re-fetched.
- Triage is complete for the observations that exist now. The green pre-archival PR head and its CI may add
  observations. The archival audit of 2026-10-29 added the entries marked above, and Phase 5 closes with them.

## Closing

No new durable rule was created in this plan. Two mechanical corrections landed inline (the registry-qualified example
in `pinning-policy-hard-rule.md` and the `127.0.0.1` probe in the Dockerfile template). Other rule changes go through
rules-propagation after the maintainer decides on the reported items above.
