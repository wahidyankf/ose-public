<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry or record the explicit none escape before archival. -->

# Learnings: docker-to-podman

## 2026-10-28 — Short image names cannot resolve under rootless Podman on a fresh host

- **Observation:** a Compose file pulled `nats:latest`. On a fresh host, rootless Podman has no
  unqualified-search registries and failed with "short-name did not resolve". The `node` and
  `postgres` images only worked because copies were already cached locally.
- **Response and proof:** every image reference in a supported Compose file or Dockerfile now names
  its registry. Fixed in commit `88a20850c`. The regression validator is
  `scripts/container-image-qualified.test.mjs`.
- **Disposition:** reported without plan authorization. `docker-conventions.md` (Podman Runtime and
  CI Boundaries) has no registry-name rule. The Dockerfile `FROM` row of `pinning-policy-hard-rule.md` now
  shows the qualified form in both its required and its anti-example text (a mechanical alignment in this
  branch; its point stays tag pinning). Proposed home: `repo-governance/development/infra/ci-conventions/docker-conventions.md`.
  Proposed wording: "Name the registry in every image reference, for example `docker.io/library/nats:<tag>`,
  because rootless Podman on a fresh host cannot resolve short names." Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-28 — An inventory built by search missed an executed `docker` call

- **Observation:** the migration inventory came from searching workflows and scripts. It missed an
  executed `docker` binary call in the TypeScript E2E step helpers (`backend-process.ts`,
  `resetDatabaseToPending`). Only running the stack found it.
- **Response and proof:** the call now runs through Podman. The regression validator is
  `scripts/no-docker-binary-calls.test.mjs`, added in commit `88a20850c`. It does not catch a binary
  held in a variable. Lesson: an inventory made by search is not proof; run the target.
- **Disposition:** discarded (re-triaged 2026-10-29: no edit landed, because the guidance below already states it). The principle already lives in
  `repo-governance/development/quality/plan-anti-hallucination/anti-pattern-catalog-ap-12-through-ap-14.md`
  (heading "AP-12: Asserting completeness from a text search") and in
  `repo-governance/development/quality/plan-anti-hallucination/absence-and-completeness-claims-completeness-claim-requires-a-diff.md`.
  This entry only points there. No new rule.

## 2026-10-28 — course-metadata unit failure appeared once and cause is open

- **Observation:** the course-metadata unit check failed once in two ayokoding-www targets during a
  long matrix run (just-enough-csharp `estimatedHours` stored 3, expected 5). It passed on rerun with
  no change.
- **Cause is open:** it is not confirmed. The leading hypothesis is a stray untracked or ignored file
  in the content tree, because the check derives the expected hours from the files it reads. No
  evidence yet supports or rules out that hypothesis.
- **Disposition:** reported without plan authorization. The flaky-test rule
  (`repo-governance/development/workflow/test-driven-development/flaky-tests-are-defects.md`) requires a
  root-cause fix, so this needs an owner and not a discard. Proposed owner: the ayokoding-www
  content-test maintainers. Proposed first step: reproduce with an extra file in the course folder
  and compare the file list the check reads. Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-28 — HIPPO deferred two heavy targets that overlapped in one worktree

- **Observation:** two heavy targets started together in one worktree. HIPPO deferred one with exit 124. Rerunning them one at a time passed.
- **Response and proof:** run the targets one at a time, or let HIPPO admit them in turn. No change
  to admission, tiers or limits.
- **Disposition:** discarded (re-triaged 2026-10-29: no edit landed, because the guidance below already states it). `repo-governance/development/practice/resource-aware-development/recovery-and-safe-retry.md`
  (first bullet, exit 124 and `hippo.limit.capacity-deferred`) and
  `repo-governance/development/practice/resource-aware-development/guarded-admission-and-parallelism.md`
  ("pressure may defer a request even when its vector fits") already state this. This entry only
  points there.

## 2026-10-28 — Log endpoints of a finished hosted job can answer not-found for a while

- **Observation:** the log endpoints for a finished GitHub-hosted job returned not-found for some
  time after the job ended.
- **Response and proof:** wait and retry the read. The status and conclusion of the run were
  available the whole time.
- **Disposition:** discarded. This is transient hosted-service behavior with no repository action,
  and the existing polling rules already read status and conclusion only.

## 2026-10-28 — Baseline failure: ferret-cli integration hook registration tests

- **Observation:** `ferret-cli:test:integration` has 6 failing `hook_registrations` tests on the
  scheduled `non-product-full-quality` runs of `main` (runs 40643742153 and 40560502045, and
  earlier). This is unrelated to the Podman migration. The test name could not be found by text
  search in this checkout, so the owner should confirm it.
- **Response and proof:** none in this plan. The migration branch has no change under the ferret apps.
- **Disposition:** reported without plan authorization. Owner: ferret-cli maintainers. Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-28 — Privilege boundaries can change temporary-directory selection

- **Observation:** a continuation stopped before its target payload because `sudo` removed the
  invocation's `TMPDIR`, leaving the default temporary root. That stop did not run the target.
- **Response and proof:** a diagnostic established the environment boundary, and an explicit
  post-`sudo` environment guard passed. The later original target and its cleanup passed without
  changing the earlier stop's outcome. See [P0 readiness](./evidence/P0/readiness.md).
- **Disposition:** discarded. The cause was one host's `sudo` environment policy, and the later run passed with an explicit environment guard. It is too machine-local for a repository rule.

## 2026-10-28 — Idle capacity and build concurrency

- **Observation:** an idle host showed normal pressure before a full build was resource-shed under
  load. Host pressure samples did not identify a per-process peak. The existing caps remained intact.
- **Response and proof:** reduce the build's internal payload concurrency within those caps before
  considering any guard change. The reviewed local override uses the exact app prefix and validates
  only after the hosted-build return. Tests cover default, valid and invalid values; scanner layout
  controls distinguish declared reads from undeclared reads. The scanner does not validate the
  example environment template, so that content received a separate manual check. The one-worker
  full build also stopped for pressure at 2,969 of 3,278 pages; development checks and idle health
  did not prove its success under load. No new fix has been selected while diagnosis continues.
- **Disposition:** discarded. The host pressure samples were local, the build-concurrency override is a reviewed local change with its own tests, and the cause of the pressure stop is still unconfirmed, so there is nothing durable to state yet. The temporary CI recipe is reconciled in the delivery checklist, not here.

- **Later timing decision:** the maintainer authorized test-only CI for four named memory-blocked
  Ayo targets and, after another memory-pressure stop before any case outcome, the full web-UI E2E
  extra, with complete passing proof required before merge. A temporary manual recipe in the
  existing workflow preserves the ordinary CI policy; recorded executed inputs and scenario scope
  must be reconciled to final delivery before retaining a receipt. This does not identify a process
  peak, establish CI capacity, replace native platform capability proof, or create a general rule.

## 2026-10-28 — Fixture initial state, navigation order and date windows

- **Observation:** eager browser navigation in an AI background conflicted with explicit scenario
  page opens and unit renders. In a separate language diagnostic, the step ended before the
  click-triggered reload, consuming most of the following assertion's original timeout. A workout
  seed with a fixed date also fell outside the production query's 30-day window.
- **Response and proof:** make each scenario's initial navigation explicit, arm navigation waits
  before clicks, and use a current timestamp for the workout seed. Red and green fixture tests
  discriminate duplicate navigation and ordering; a real production-query regression and a 45-day
  negative control discriminate the date window. These checks do not establish the separate Ayo
  WebKit error's cause or pass either full browser target. See [P0 readiness](./evidence/P0/readiness.md).
- **Disposition:** discarded. Fixed in the named fixture with red and green fixture tests, a production-query regression test and a 45-day negative control, recorded in `evidence/P0/readiness.md`. The cause of the separate WebKit error is still unknown and is not claimed here.

## 2026-10-27 — A Go temporary directory can be outside the home bind

- **Observation:** a supplemental native Desktop probe using Go's default temporary-directory
  selection created a private mode-0700 directory under the operating system's temporary root,
  separate from the home directory. Its physical path also used macOS's `/private` alias. The
  tested bare keep-id workload reported user, container and output ownership 501:20.
- **Response and proof:** validate the actual temporary path and ownership through the caller's
  execution environment, with exact read/write/cleanup checks. The supplemental probe passed
  rootless temporary-directory bind, read-only denial, representative limits and exact cleanup.
  Its selected-host UID/GID result does not establish a universal bare keep-id mapping rule or the
  production runner's environment. See [Desktop temporary-directory evidence](./evidence/P0/macos-runner-temp.md).
- **Disposition:** discarded. This is one supplemental probe on one Desktop host. The production runner needs its own path proof, so no general rule follows.

## 2026-10-27 — Preserve keyboard access to exposed diagram source

- **Observation:** the Mermaid component exposes overflowing source text while rendering is
  pending or rejected. Native tests found Tab skipped that fallback in both states; after SVG
  success, the source node remains hidden and correctly stays outside sequential focus. The exact
  node from the historical full-run axe failure is unknown, so this regression does not establish
  that failure's cause.
- **Response and proof:** a conditional focus index keeps the exposed source keyboard reachable
  and skips it after successful SVG rendering. All three real-component keyboard tests passed.
  The applicable generic lint rule cannot infer this runtime overflow, so the accepted repair has
  a documented one-line exception under the existing strictness policy. Exact-file lint with
  warnings denied passed; app lint also exited 0 with its old warnings in untouched files. No
  general lint rule or configuration changed. See [Mermaid prerequisite evidence](./evidence/P0/mermaid-prerequisite.md).
- **Disposition:** discarded. Fixed in the component and guarded by the three real-component keyboard tests in `apps/ayokoding-www/tests/unit/features/content/shell/mermaid.test.tsx`. The entry itself rules out a general lint waiver.

## 2026-10-27 — Host profile and pinned consumer compatibility

- **Observation:** an external host-profile rollout added a field while a previously admitted
  test was running. The old pinned consumer rejected subsequent admissions before any payload
  started. That parser rejection does not explain failures inside the already running test.
- **Response and proof:** source and immutable-release review identified the compatible 0.13.0
  pin. After the maintainer granted its specific release-age exception, only `hippo.lock`
  changed. Native embedded identity, current-profile status, consumer contracts and one admitted
  policy smoke passed. Preserve the profile owner's changes and distinguish old versus current
  policy provenance when retaining baseline outcomes. See [HIPPO evidence](./evidence/P0/hippo-prerequisite.md).
- **Disposition:** discarded. The host-profile rollout is machine-local, and the compatible pin change is already recorded in `hippo.lock` and `evidence/P0/hippo-prerequisite.md`.

## 2026-10-26 — Safety-screen temporary-file quota

- **Observation:** a generic safety-gate refusal was caused by `EDQUOT` while staging a tracked
  input on the temporary filesystem, despite apparently sufficient free blocks. Bounded one-file
  staging identified the errno without exposing payloads or copying the whole tree.
- **Response and proof:** an ignored, task-owned `TMPDIR` on the repository filesystem preserved
  scanner behavior and allowed same-filesystem links. The unchanged pre-commit screen then passed
  in session `94831`; promotion PR #745 subsequently passed exact-head CI and merged.
- **Scope:** no scanner rule, tracked configuration, foreign temporary directory, or safety
  requirement changed. Raw diagnostics stay local.
- **Disposition:** discarded. The cause was one host account's temporary-filesystem quota. The task-owned temporary directory is a local workaround that no repository rule prescribes.

## 2026-10-26 — Native tool discovery in noninteractive commands

- **Observation:** doctor reported Fantomas and CSharpier unavailable, although the declared
  versions were already installed and direct executable probes passed. The command environment
  omitted the native tool directory from `PATH`.
- **Response:** use the documented native tool directory in the invocation environment; preserve
  shell profiles, installed versions, and doctor requirements. Dart/Flutter was a separate
  missing prerequisite; the documented checksum-verified pinned SDK installation resolved it.
  The final standalone doctor passed all 24 checks, as recorded in
  [bootstrap evidence](./evidence/P0/bootstrap.md).
- **Disposition:** discarded. The cause was the shell environment of one host, and the doctor check already reports the missing tools. The result is recorded in `evidence/P0/bootstrap.md`.

## 2026-10-26 — Join the existing host admission profile

- **Observation:** an unconfigured consumer requested exclusive coordination while the installed
  host sampler used the existing reservation profile. Admission rejected the payload before it
  started. A later zero-owner status snapshot did not prove the earlier reservation epoch absent.
- **Response and proof:** select the host's already approved profile through `HIPPO_CONFIG` for
  each command. Both installed consumer versions accept that profile; the subsequent baseline
  command passed. No pin, ledger root, admission policy, sampler, or foreign process changed.
  See [baseline admission history](./evidence/P0/baseline-targets.md#hippo-admission-history).
- **Disposition:** discarded. Joining a host's admission profile through `HIPPO_CONFIG` is machine-local setup, not repository policy.

## 2026-10-26 — Scenario fixtures can retain detached DOM

- **Observation:** collection-time `userEvent.setup()` sessions captured by retained Cucumber
  closures kept detached scenario DOM reachable. A correctly admitted single-worker full suite
  still exhausted the unchanged V8 heap in the calculator fixture.
- **Response and proof:** the declared one-file fixture repair creates each session lazily and
  clears it at scenario/example boundaries. It preserves scenario titles, step literals,
  assertions, API call order, coverage floors, and timeouts. Independent review found zero
  issues. Focused 526/526 tests passed; the original full quick then passed 247/247 files and
  4,177/4,177 tests with 99.54% line coverage and exit 0.
- **Disposition:** discarded. Fixed by the one-file fixture repair, and the original full quick target now passes. The entry itself finds no gap that needs a general rule.

## 2026-10-26 — Preserve ownership of live command handles

- **Observation:** a delegated build's command handle could not be polled from the coordinator's
  agent context after the delegate returned. Without a terminal receipt, the earlier invocation
  could not count as a pass.
- **Response and proof:** record that invocation as unverifiable, establish that it has ended,
  then execute one justified fresh run. Keep each owning delegate active through terminal exit
  and retain stdout plus status. The fresh integration run passed 13 files and 192 tests.
- **Later ownership loss:** another verification driver exited 143 and its controller disappeared
  while test descendants remained active without admission ownership. The signal sender is
  unknown; no recorded assertion failure, pressure shedding or OOM explains that event. One
  identity-guarded SIGINT retired only the attributed group, and all 15 recorded process
  identities were subsequently absent. The target's later inner status 1 followed that signal.
  A reviewed host-native user unit now owns the entire serial driver, HIPPO controller and
  payload independently of the submitting client. Native lifecycle controls and the complete
  original Ayo quick, integration and unit targets passed; the remaining verifier continues.
  This proves the corrected execution route, not the earlier signal's cause.
- **Disposition:** discarded (re-triaged 2026-10-29: no edit landed, because the guidance below already states it). `repo-governance/development/practice/trustworthy-measurement/rule-7-prove-the-run-finished.md` (heading "7. A result is complete only when a terminal marker says so", and "One gated command per unit of background work") already states it. The host-native unit that owns the driver is machine-local and is not carried over.

## 2026-10-26 — Include build dependencies in a target's admission

- **Observation:** the backend E2E target depends on the full 3,278-page public-site build.
  Its standard-tier baseline was pressure-shed before any Playwright scenarios began. The
  original child marker was absent because the whole admitted payload was shed, not because
  the test had passed or the process was merely quiet.
- **Response:** correlate execution history with the same approved host profile and exact
  process/time metadata, distinguishing reservation identity from execution-history identity.
  A corrected run uses the heavy envelope already proven for that same build dependency.
  Both inner target output and outer HIPPO status are now captured durably; its result remains
  pending in [baseline evidence](./evidence/P0/baseline-targets.md).
- **Disposition:** discarded (re-triaged 2026-10-29: no edit landed, because the guidance below already states it). `repo-governance/development/practice/resource-aware-development/guarded-admission-and-parallelism.md` states it in the tier list ("`heavy` is a full build") and in the section "The boundary is not paperwork on a command that would have been fine" (a target that transitively starts heavy work).

## 2026-10-26 — Compose status can conceal native teardown errors

- **Observation:** installed podman-compose 1.6.0 returns 0 from `down` while ignoring failed
  native child statuses. The probe had empty final owned inventories but retained explicit
  teardown errors. A narrowly filtered kernel audit confirms AppArmor denied pasta's receipt
  of Podman's SIGTERM; the absent one-shot client messages have a separate provider cause.
- **Response:** preserve actual native error evidence and independently verify exact owned
  resources. Do not treat the provider's successful status as proof that each teardown command
  succeeded. The maintainer later approved the exact host-wide receive-SIGTERM correction;
  independent review, guarded application and the original capability/native cleanup recheck
  passed. See [Ubuntu capability evidence](./evidence/P0/ubuntu-capabilities.md) and
  [the post-correction proof](./evidence/P0/ubuntu-policy-capability-recheck.md).
- **Disposition:** discarded (re-triaged 2026-10-29: no edit landed, because the sentence this cites already existed before this plan). `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md` (heading "Leaked Test Containers") says to remove only listed names and then re-run the listing and expect zero, which is the independent inventory check. The host-wide policy correction is machine-local and is not carried over.

## 2026-10-26 — Consult machine disk-recovery procedures before escalating admission

- **Observation:** a strict installation profile could not admit work below its disk reserve,
  while ordinary status fell back to a smaller profile and reported normal pressure. Initial
  investigation covered the application repository and missed the central machine workflow's
  existing disk-recovery exception for its official cleanup commands.
- **Response and proof:** the maintainer approved one exact generated-output removal. It reclaimed
  9,134,456,832 measured bytes and restored the original strict profile without changing limits.
  The subsequent central-workflow inspection confirmed its survey, measured-row approval,
  preservation, selective-execution and savings contract. Browser dependency installation then
  passed, and all three required native browsers launched and closed successfully.
- **Disposition:** discarded. The recovery procedure belongs to a central machine workflow outside this public repository. The in-repo part is already in `recovery-and-safe-retry.md` (exit 124, `storage-blocked`).

## 2026-10-27 — Repository-local temporary paths can exceed socket limits

- **Observation:** invocation-only repository-local `TMPDIR` corrected a temporary-filesystem
  quota failure, but the next target's tsx prerequisite could not open its Unix socket. The
  captured socket path occupied 130 UTF-8 bytes; the installed Linux limit is 108. No tests ran
  in that failed invocation.
- **Response and proof:** a shorter, real task-owned directory on the same filesystem keeps the
  same socket naming pattern to 100 bytes. Native listen/close probe `82779` passed under
  unchanged admission, with the expected owner, mode 0700 and filesystem device. Only the
  invocation's `TMPDIR` changed. Earlier receipts and temporary directories remain retained;
  the original target's corrected execution is separate pending proof.
- **Disposition:** discarded. It only arises from a host-specific workaround (a task-owned `TMPDIR` under the repository), which no repository rule prescribes.

## 2026-10-27 — BDD callback arity and consumed captures

- **Observation:** the approved adapter upgrade validates callback arity against expanded
  Gherkin captures. Existing callbacks used consumed rest arrays or omitted strings tied to
  fixed Storybook fixtures. Generation failed before runtime assertions could execute.
- **Response and proof:** required typed parameters reconstruct the same ordered consumed
  arrays. Fixed-fixture callbacks now assert the actual captured literals before their unchanged
  bodies. Independent review verifies all prior assertions and every configured affected usage;
  all ten generation/discovery groups pass. This is discovery proof, not browser runtime proof.
  Existing scenarios, fixture rendering, visual baselines, timeouts and coverage floors remain
  unchanged. See [affected target revalidation](./evidence/P0/pin-upgrade-target-results.md).
- **Disposition:** discarded. Fixed in the affected step files, and the pinned adapter now fails generation on a bad arity, so the tool itself is the guard. Evidence: `evidence/P0/bdd-companion-upgrade.md`.

## 2026-10-27 — Provider cleanup selection can exceed exact-name guards

- **Observation:** pinned podman-compose 1.6.0 `down --volumes` selects volumes and networks by
  its project label. Checking only the probe's expected names before invoking it does not
  protect a differently named foreign resource carrying the same project label.
- **Response:** the Mac probe repair replaces that broad teardown with positively owned exact
  native targets and full inventory preservation checks. A discriminating fake reproduces the
  original foreign-volume/network deletion. All 32 native fake cases and limited independent
  recheck passed. The actual Mac probe then passed every workload assertion but detected an
  extra provider-created Pod in its final inventory, so the overall command failed. Separate
  positively attributed no-force removal passed, then invocation-only `--in-pod=false` prevented
  Pod creation in the synthetic probe. Native 33-case checks and limited review passed; the
  corrected full probe exited 0 with exact before/after resource and VM-helper preservation.
  This is separate from the provider's ignored child exit statuses. See [Mac capability
  evidence](./evidence/P0/macos-capabilities.md).
- **Disposition:** routed inline. `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md` (heading "Leaked Test Containers") states "A named volume is never removed by a project label alone", and `docker-conventions.md` bans `-v` on Compose stop commands. The probe repair itself is one-off and tested by the fake cases recorded in `evidence/P0/macos-capabilities.md`.

## 2026-10-28 — A provider's CLI subset can differ from the engine's Compose

- **Observation:** the migrated reusable www workflow looked up a service container with
  `podman compose ps -q <service>`. The pinned `podman-compose` 1.6.0 `ps` accepts only `-q` and a
  format flag, so that form exits 2 and yields an empty id. Docker Compose accepted the service
  name, and the workflow does not run in the PR gate, so every check stayed green.
- **Response and proof:** running the real packet exposed it. A throwaway one-service stack
  confirmed that the Compose labels (`io.podman.compose.project`, `com.docker.compose.service`)
  find exactly the service container and nothing for a wrong name. The plan's packet text, the
  workflow, and a regression test were corrected together.
- **Disposition:** discarded. Fixed with the regression test `scripts/workflow-container-lookup.test.mjs`, which fails on `compose ps -q <service>` in workflows.

## 2026-10-28 — Verbatim command translation is not proof

- **Observation:** a second class of mistakes came from translating a command shape instead of
  running it: the `ps -q` form above, and an AC-01 claim that named a doctor run not yet executed.
- **Response and proof:** every evidence file now states only what was executed, and lists what was
  not (here, the Compose stack health and the full doctor on macOS).
- **Disposition:** reported without plan authorization. `repo-governance/development/quality/evidence-capture/the-rule.md` requires a record of what was observed, but does not say that evidence states only what was executed and lists what was not. Proposed home: that file. Proposed wording: "An evidence file states only what was executed, and lists what was not executed." Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-28 — Local capacity limits are layered and need a diagnosis each

- **Observation:** the same "disk quota exceeded" text came from three different layers: the host
  account's quota on the default temp root, a small tmpfs that a layer outgrew, and the HIPPO disk
  floor, which stopped a full Next.js image build and reported `storage-blocked`. A failed build
  also left Buildah working containers that blocked removing their images.
- **Response and proof:** direct Go and Podman temp to tmpfs for small outputs, never repeat a run
  without changing the cause, and remove only labelled or ID-listed resources. Full monorepo
  image builds need large headroom above the HIPPO floor.
- **Disposition:** discarded (re-triaged 2026-10-29: no edit landed, because the guidance below already states it). `repo-governance/development/practice/resource-aware-development/recovery-and-safe-retry.md` (first bullet, exit 124 and `hippo.limit.storage-blocked`) says to free storage safely before a retry. The sizes in the observation are machine-local and set no policy. Leftover Buildah containers are covered by the "Staging directories" entry below.

## 2026-10-28 — Debug flags can change the host's user-visible behavior

- **Observation:** `podman machine start --log-level=debug` on macOS launches the VM helper through a
  generated script in a new terminal window, which popped up on a machine in use by its owner.
- **Response and proof:** debug mode was not repeated. Its log did show the guest never sent its
  ready notice. The Machine then started only when the owner ran the start in a local terminal.
- **Disposition:** discarded. This was one debug run on one personal host, and the Machine started once its owner ran the start locally.

## 2026-10-28 — Resolver search domains make `nslookup` a poor DNS probe

- **Observation:** `nslookup <name>` inside a container appended the host's search domain and
  reported NXDOMAIN although the container name resolved.
- **Response and proof:** `getent hosts <name>` is the resolver-faithful check and passed on both
  platforms. The search-domain value is private and was left out of the evidence.
- **Disposition:** discarded. Too machine-local: it depends on one host's resolver search domain.

## 2026-10-28 — `localhost` is not the same address in Podman and Docker containers

- **Observation:** health probes written as `http://localhost:<port>` passed under Docker but failed
  under Podman. Podman containers resolve `localhost` to `::1` first, the Next servers listen on
  IPv4 only, and BusyBox `wget` does not fall back. The container stayed `unhealthy` while the same
  route returned `200` from the host.
- **Response and proof:** the six probe sites now use `127.0.0.1`, with a registered regression test.
  A live rerun of the OSE and OrganicLever stacks reported `healthy`.
- **Disposition:** routed inline (2026-10-29, archival change). The six probe sites are fixed and guarded by `scripts/container-healthcheck-loopback.test.mjs`, and the Dockerfile template in `repo-governance/development/infra/ci-conventions/docker-conventions.md` now probes `http://127.0.0.1:3000/health`. The mechanical template correction brings the rule in line with its guard; the `HEALTHCHECK` bullet wording proposal stays with the maintainer. Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-28 — A running stack proves less than its health state

- **Observation:** `podman-compose` 1.6.0 returned `0` from `up --wait` while the container's own
  health state was `unhealthy`, and one Compose probe had named a route the app never had, on
  `main` too. Parse checks, unit tests, and the exit status all passed.
- **Response and proof:** the stack proof now reads the health state with `podman inspect` and
  requests a real route. The probe route is checked by a test against the app's router.
- **Disposition:** reported without plan authorization. No durable text says that `up --wait` exit 0 does not prove health. Proposed home: `repo-governance/development/infra/ci-conventions/docker-conventions.md` (Podman Compose Patterns). Proposed wording: "A zero exit from `podman compose up --wait` does not prove health; read the container health state with `podman inspect` and request a real route." Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-28 — Staging directories from interrupted builds can outgrow the build

- **Observation:** interrupted image builds left a large amount of Buildah staging directories in the
  directory chosen as the build temp root, plus Buildah working containers. Together they took the
  disk to the HIPPO floor, and the next builds were stopped for it.
- **Response and proof:** after the builds stopped, only the task-owned staging directory and the
  ID-listed working containers were removed. The build then had its full headroom.
- **Disposition:** reported without plan authorization. `repo-governance/development/workflow/worktree-and-artifact-cleanup/docker-artifact-cleanup.md` covers leaked containers, not Buildah working containers or build staging directories. Proposed home: that file, section "Leaked Test Containers". Proposed wording: "An interrupted image build can leave Buildah working containers and staging files; remove only the ones this session created, listed by ID." Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — The root `.dockerignore` does not exclude `.next`, so a native build is copied into a repo-root build context

- **Observation:** the AyoKoding image builds with the repository root as its context. The root `.dockerignore` has no
  `.next` entry, and `apps/ayokoding-www/.dockerignore` (which lists `.next/`) is not read for a root context. A tree
  that has built natively therefore copies its build output into the image: about 18 GB of `.next` in the local
  attempt (`evidence/P3/manual/ayokoding-www.md`, "Root cause"). The same copy filled the runner disk in CI run
  40667489060 (`no space left on device` writing under `apps/ayokoding-www/.next/`, `evidence/P2/ci.md`).
- **Response and proof:** no fix was made in this plan. The local rerun removed the native `.next` first (a clean
  context) to isolate the cause. The root `.dockerignore` is unchanged on this branch.
- **Disposition:** reported without plan authorization. This is a code-homed fix: a root-level `.next` exclusion or a
  Dockerfile-named ignore file next to the Dockerfile, with its BDD and gate treatment, dispatched to a `swe-*` agent.
  It existed under Docker too and is independent of the Podman migration. Proposed durable note, home
  `repo-governance/development/infra/ci-conventions/docker-conventions.md`: "A repo-root build context reads only the
  root `.dockerignore`; an app-level ignore file is not applied." Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — Runner disk ran out in run 40667489060, and stack-first ordering fixed the proof job

- **Observation:** in run 40667489060 the temporary proof job ran the Ayo build and integration steps before the image
  build, and the image build then failed with `Free space left: 0 MB`. After the job built the stack first (runs
  40671958744 and 40693498144), `df -h /` showed 81 GB available before the stack build and 51 GB after it.
- **Response and proof:** the temporary proof job was reordered; run 40693498144 concluded `success`
  (`evidence/P2/ci.md`). The job was removed in commit `60a35faf1`.
- **Disposition:** discarded. The ordering existed only in the removed temporary job. The durable cause is the
  build-context entry above, which is reported. The measured headroom stays in `evidence/P2/ci.md`.

## 2026-10-29 — The AyoKoding image build needs more than 54 GB of free local disk

- **Observation:** five local image builds stopped at the HIPPO disk floor (`hippo.limit.storage-blocked`, exit 124),
  starting from 32, 44, 44, 36 and 54 GB free. The last had a clean context: it staged about 26 GB and was shed during
  static-page generation with 4.3 GB free. The image holds about 18 GB of `.next` in the build, about 9 GB of standalone
  output in the runner stage, and the export stages about 16 GB (`evidence/P3/compose-stacks.md`,
  `evidence/P3/manual/ayokoding-www.md`). The same stack built on a 145 GB runner (81 GB free before, 51 GB after).
- **Response and proof:** the local container browser row for Ayo was dispositioned to the CI container proof plus the
  native browser proof (`evidence/P2/local-stacks.md`). Nothing was deleted to make room except what each attempt
  created, removed by exact id.
- **Disposition:** reported without plan authorization. A reader who runs `dev:ayokoding-www` meets this with no
  warning. Proposed home: the AyoKoding stack step of `docs/how-to/setup-development-environment.md`. Proposed wording:
  "The AyoKoding image build needs well over 54 GB of free disk; a smaller disk stops at the HIPPO floor." Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — An unexplained intermittent Firefox `waitForURL` stall in the course-walk helper

- **Observation:** in run 40671958744, row 33 failed one of 1,236 cases: `[firefox] Learning progress accessibility >
Progress screens pass automated accessibility checks` hit the 150 s test timeout in `page.waitForURL` at
  `tests/e2e/steps/support/complete-course.ts:78`. The URL had not changed when the wait began and no navigation fired.
  Local traces of two stalled cases show the click completed, the app's click handler ran (toggle "Completed", link
  "Continue"), the next page's RSC fetches returned 200, and the URL never changed. A local run produced the same
  signature once; 1 of 1, 16 of 16 and 2,678 direct clicks across 8 parallel Firefox contexts produced none.
- **Response and proof:** a readiness guard on the completion toggle was tried and reverted: the toggle was already
  enabled when the click stalled, so the hydration-race hypothesis is refuted. The case passed in run 40693498144 and
  all 15 changed scenarios passed in each browser in the local matrix on `60a35faf1` (`evidence/P2/ci.md`,
  `evidence/P3/target-matrix.md`). The cause is not established; nothing was retried, widened or skipped.
- **Disposition:** reported without plan authorization. The flaky-test rule requires a root-cause fix, so the stall
  needs an owner: the AyoKoding frontend E2E maintainers. No durable-rule home applies until the cause is known.
  Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — A Dockerfile `HEALTHCHECK` is ignored under the OCI image format

- **Observation:** `podman build` warned twice, "HEALTHCHECK is not supported for OCI image format and will be
  ignored" (`evidence/P3/manual/ose-www.md`, observation 1). The `ose-www` and `organiclever-www` containers were
  healthy only because their Compose files define their own healthcheck. A standalone `podman run` of either image has
  no health status. The backend publish workflow builds with `--format docker`; the Compose builds use the default.
- **Response and proof:** none in code. Both stacks reported `healthy` through the Compose healthcheck.
- **Disposition:** reported without plan authorization. The decision is whether to keep the image-level healthcheck and
  build the public-site images in the docker format, or drop it, before any such image is published. Proposed home:
  the `HEALTHCHECK` bullet of `repo-governance/development/infra/ci-conventions/docker-conventions.md`. Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — Backend `down` leaves an anonymous Postgres volume per run

- **Observation:** neither backend E2E Compose file mounts a named volume, and the `postgres:17-alpine` image declares a
  data `VOLUME`. Each `up` creates an anonymous volume that `down` without `-v` keeps: one per backend E2E script run
  and one per manual stack. The host already held eight older anonymous volumes of undetermined origin
  (`evidence/P3/manual/backends.md`, observation 1).
- **Response and proof:** the four volumes this phase created were removed by exact id after an ownership check. No
  prune ran. The behaviour is not caused by the migration; it is a Docker-era behaviour that Podman reproduces.
- **Disposition:** reported without plan authorization. This is a code-homed fix: a named or `tmpfs` Postgres data
  mount in the two `docker-compose.e2e.yml` files, or a script step that removes its own project's volumes. The cleanup
  wording for owned anonymous volumes already lives in `docker-artifact-cleanup.md`. Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — The UI triad found pre-existing defects outside the two judged changes

- **Observation:** the exploratory, usability and design passes on `apps/ayokoding-www` recorded 50 findings. Most are
  on components unchanged from `main` (dark-theme diagram contrast, the language switch, Indonesian routes, clipped
  diagram labels). The quality gate cycle 1 verdict is an advisory FAIL on one open blocking row (UWQ-001).
- **Response and proof:** one row inside the changed surface (DWT-006) was repaired and re-checked. EWT-002 was
  accepted as the cost of the sidebar layout. Nothing else was fixed in this plan. The list is in
  `evidence/P3/scope-dispositions.md`.
- **Disposition:** reported without plan authorization, to the maintainer, with no owner assigned. The plan is not the
  place for new backlog work. A fix owner or an explicit deferral for the blocking rows was needed before archival.
  Maintainer decision, 2026-10-29: asked directly whether to fix or defer, the maintainer chose "Tunda semua, lapor"
  (defer all, report) for the blocking rows and "Tunda, lapor" for EWT-003. The deferral is explicit and user-given,
  not self-deferred. Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — A second pre-existing ferret-cli failure hid behind the first

- **Observation:** the `e2e` job of `non-product-full-quality.yml` needs the `integration` job, which fails on the
  `ferret-cli` hook-registration baseline, so the `e2e` job never runs on `main`. With that gate removed on a throwaway
  branch (run 40778630932), `ferret-cli-e2e:test:e2e` also failed: three interpreter-guard scenarios in
  `test_interpreter_guard_steps.py`.
- **Response and proof:** none in this plan; the project is outside the migration. `ayokoding-cli` E2E passed in the same
  run.
- **Disposition:** reported without plan authorization, to the ferret-cli maintainers. Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — The legacy `ose-app` and `organiclever-app` stag workflows fail on every scheduled run

- **Observation:** `ose-app-test-local-deploy-stag` and `organiclever-app-test-local-deploy-stag` failed on every
  recorded scheduled run from 2026-10-26 (before this migration) through 2026-10-28, including on the merged head. The
  latest `ose-app` run fails in `ose-be:test:integration` on a missing generated F# contract file before any container
  starts.
- **Response and proof:** none. The plan treats these scaffolds as unsupported and syntax-checks them only.
- **Disposition:** reported without plan authorization, with the maintainer as owner. Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — The PR gate skips every container job for an action-only change

- **Observation:** PR #755 changed only `.github/actions/setup-podman/action.yml`, a test and a README. The PR gate's
  container jobs (for example "AyoKoding examples check") were skipped by their path filters, so the gate never ran the
  changed action on a runner.
- **Response and proof:** the step was proven on a throwaway branch (run 40783837245) before the merge.
- **Disposition:** reported without plan authorization. This is a code-homed fix: path filters that include
  `.github/actions/setup-podman/**`. Handoff: [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — `test:validators` is run by no declared gate

- **Observation:** the 198-test suite behind `npm run test:validators`, including the no-Docker-binary-call and
  image-qualified validators, is referenced only by `package.json`. A regression in those validators would not fail a
  pull request.
- **Response and proof:** the suite passes locally on the final tree. The gap is also recorded in
  `evidence/P4/rule-manifest.md`.
- **Disposition:** reported without plan authorization. Asked directly on 2026-10-29 whether to wire it into a gate or
  defer, the maintainer chose to defer and report. Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).

## 2026-10-29 — An emulated cold Podman store failed for reasons of the emulation

- **Observation:** a rehearsal on a developer host that emulated a cold image store failed the Postgres service
  scenario twice, but a manual start of the same container failed in the emulated store's own rootless networking.
- **Response and proof:** on a real fresh GitHub runner the same scenario passed in the full real-engine suite (run
  40778630932, `evidence/P2/ci.md`).
- **Disposition:** discarded. The cause was the emulation, and the real cold-runner result settles the question.

## 2026-10-29 — The HIPPO consumer smoke is outside the PR gate and caught a regression days later

- **Observation:** `HIPPO Consumer Smoke` (`.github/scripts/test-hippo-consumer.sh`) requires five dev and reset scripts in
  `package.json` to start with `./hippo run `. PR #749 put an `export ... && scripts/container-runtime-check --compose &&`
  prefix in front of them, so the smoke has failed on `main` since the merge (scheduled run 40777857700, dispatch run
  40803547159 on `b5a4a4f7d`). The PR quality gate does not run this check, and no local gate of this plan did either.
- **Response and proof:** the scripts were restructured in the closeout pull request so each starts with `./hippo run` and
  a wrapper does the environment and preflight inside the supervised command, without changing the guard. The smoke run
  that proves it is recorded in `evidence/P4/archival-record.md`, section 9.
- **Disposition:** reported without plan authorization. The code-homed gap is that a change to `package.json` scripts or to
  `scripts/` is not covered by any pull-request check of the HIPPO consumer contract. Handoff:
  [P5 knowledge capture](./evidence/P5/knowledge-capture.md).
