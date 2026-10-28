# Phase 5 knowledge capture

Every entry in [learnings.md](../../learnings.md) now has one terminal state. No entry is untriaged.
Each entry was compared with the existing guidance under `repo-governance/`, `docs/`, `AGENTS.md`
and `.agents/skills/` before its state was chosen. Each `routed inline` target was read first.

Totals: 31 entries. 7 routed inline, 7 reported without plan authorization, 17 discarded.

## Terminal states

| Entry                                                         | State     | Destination or reason                                                                                             |
| ------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| Short image names cannot resolve under rootless Podman        | reported  | Proposed home `docker-conventions.md`; see below                                                                  |
| An inventory built by search missed a `docker` call           | routed    | `plan-anti-hallucination/anti-pattern-catalog-ap-12-through-ap-14.md`, heading "AP-12"                            |
| course-metadata unit failure, cause open                      | reported  | Needs a root-cause owner; see below                                                                               |
| HIPPO deferred two overlapping heavy targets                  | routed    | `resource-aware-development/recovery-and-safe-retry.md` (exit 124); `guarded-admission-and-parallelism.md`        |
| Hosted job log endpoints answer not-found for a while         | discarded | Transient hosted-service behavior, no repository action                                                           |
| Baseline failure: ferret-cli integration tests                | reported  | Owner is the ferret-cli maintainers; see below                                                                    |
| Privilege boundaries can change temporary-directory selection | discarded | One host's `sudo` environment policy                                                                              |
| Idle capacity and build concurrency                           | discarded | Local pressure samples; local override already tested; cause still unconfirmed                                    |
| Fixture initial state, navigation order, date windows         | discarded | Fixed with fixture tests and a production-query regression test (`evidence/P0/readiness.md`)                      |
| A Go temporary directory can be outside the home bind         | discarded | One supplemental probe on one host                                                                                |
| Preserve keyboard access to exposed diagram source            | discarded | Fixed; `apps/ayokoding-www/tests/unit/features/content/shell/mermaid.test.tsx`                                    |
| Host profile and pinned consumer compatibility                | discarded | Machine-local rollout; pin change is in `hippo.lock` and `evidence/P0/hippo-prerequisite.md`                      |
| Safety-screen temporary-file quota                            | discarded | One host account's quota; local workaround                                                                        |
| Native tool discovery in noninteractive commands              | discarded | One host's shell environment; doctor already reports it                                                           |
| Join the existing host admission profile                      | discarded | Machine-local setup through `HIPPO_CONFIG`                                                                        |
| Scenario fixtures can retain detached DOM                     | discarded | Fixed by the one-file fixture repair; full quick target passes                                                    |
| Preserve ownership of live command handles                    | routed    | `trustworthy-measurement/rule-7-prove-the-run-finished.md`                                                        |
| Include build dependencies in a target's admission            | routed    | `resource-aware-development/guarded-admission-and-parallelism.md` (tier list; "The boundary is not paperwork...") |
| Compose status can conceal native teardown errors             | routed    | `worktree-and-artifact-cleanup/docker-artifact-cleanup.md`, heading "Leaked Test Containers"                      |
| Consult machine disk-recovery procedures                      | discarded | Central machine workflow is outside this public repo; in-repo part is in `recovery-and-safe-retry.md`             |
| Repository-local temporary paths can exceed socket limits     | discarded | Arises only from a host-specific `TMPDIR` workaround that no rule prescribes                                      |
| BDD callback arity and consumed captures                      | discarded | Fixed in step files; the pinned adapter now fails generation on bad arity                                         |
| Provider cleanup selection can exceed exact-name guards       | routed    | `docker-artifact-cleanup.md` ("A named volume is never removed by a project label alone")                         |
| A provider's CLI subset can differ from the engine's          | discarded | Fixed with regression test `scripts/workflow-container-lookup.test.mjs`                                           |
| Verbatim command translation is not proof                     | reported  | Proposed home `evidence-capture/the-rule.md`; see below                                                           |
| Local capacity limits are layered                             | routed    | `resource-aware-development/recovery-and-safe-retry.md` (exit 124, `storage-blocked`)                             |
| Debug flags can change the host's behavior                    | discarded | One debug run on one personal host                                                                                |
| Resolver search domains make `nslookup` a poor probe          | discarded | Too machine-local                                                                                                 |
| `localhost` is not the same address in Podman                 | reported  | Template in `docker-conventions.md` still shows `localhost`; see below                                            |
| A running stack proves less than its health state             | reported  | Proposed home `docker-conventions.md`; see below                                                                  |
| Staging directories from interrupted builds                   | reported  | Proposed home `docker-artifact-cleanup.md`; see below                                                             |

Paths in the table are shortened. The full paths are in each entry's disposition in `learnings.md`.
The directories are `repo-governance/development/quality/`, `repo-governance/development/practice/`,
`repo-governance/development/workflow/` and `repo-governance/development/infra/ci-conventions/`.

## Reported to the maintainer

These are real gaps in durable guidance. Each needs a rule or doc change. The maintainer decides, and
the change goes through rules-propagation. Nothing below was edited in this plan.

1. **Registry-qualified image names.** Home: `repo-governance/development/infra/ci-conventions/docker-conventions.md`,
   section "Podman Runtime and CI Boundaries". Wording: "Name the registry in every image reference,
   for example `docker.io/library/nats:<tag>`, because rootless Podman on a fresh host cannot resolve
   short names." Note: the Dockerfile `FROM` row of
   `repo-governance/development/workflow/dependency-bump-policy/pinning-policy-hard-rule.md` used the
   short `node:` form. This branch aligned its example text with the qualified form (a mechanical edit;
   its point is still tag pinning). Guard in place: `scripts/container-image-qualified.test.mjs`.
2. **`localhost` in the Dockerfile template.** Home: the template and the `HEALTHCHECK` bullet in
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

## Verification limits

- The run IDs and the failing test count for item 7 come from the CI runs the maintainer named.
  They were not re-fetched here.
- No test, build or container command was run for this capture. Test names were checked to exist
  by file name only.
- Entry subjects for the P0 fixture and BDD arity fixes rest on the P0 evidence files, not on a
  fresh run.

## Closing

No durable rule was created in this plan. Rules and conventions change only through rules-propagation
after the maintainer decides on the reported items above, so Knowledge Capture here only classifies.
