<!-- Knowledge Capture running log — append entries during execution. -->
<!-- Triage every entry or record the explicit none escape before archival. -->

# Learnings: docker-to-podman

## 2026-10-28 — Privilege boundaries can change temporary-directory selection

- **Observation:** a continuation stopped before its target payload because `sudo` removed the
  invocation's `TMPDIR`, leaving the default temporary root. That stop did not run the target.
- **Response and proof:** a diagnostic established the environment boundary, and an explicit
  post-`sudo` environment guard passed. The later original target and its cleanup passed without
  changing the earlier stop's outcome. See [P0 readiness](./evidence/P0/readiness.md).
- **Disposition:** untriaged. Compare existing environment guidance during Phase 5 before routing
  or discarding the observation; it does not create a new rule.

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
- **Disposition:** untriaged. Compare existing resource, environment and scanner guidance in Phase 5
  before routing or discarding these observations; this entry creates no new governance rule.

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
- **Disposition:** untriaged. Compare existing fixture and test guidance in Phase 5 before routing
  or discarding these observations; they do not create new governance rules.

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
- **Disposition:** untriaged. Compare this observation with existing runner and environment
  guidance during Phase 5; the production runner still needs its own end-to-end path proof.

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
- **Disposition:** untriaged. Compare this evidence with existing accessibility and lint guidance
  in Phase 5 before routing it or discarding it; it supports this component's behavior, not a
  general waiver for focusable noninteractive elements.

## 2026-10-27 — Host profile and pinned consumer compatibility

- **Observation:** an external host-profile rollout added a field while a previously admitted
  test was running. The old pinned consumer rejected subsequent admissions before any payload
  started. That parser rejection does not explain failures inside the already running test.
- **Response and proof:** source and immutable-release review identified the compatible 0.13.0
  pin. After the maintainer granted its specific release-age exception, only `hippo.lock`
  changed. Native embedded identity, current-profile status, consumer contracts and one admitted
  policy smoke passed. Preserve the profile owner's changes and distinguish old versus current
  policy provenance when retaining baseline outcomes. See [HIPPO evidence](./evidence/P0/hippo-prerequisite.md).
- **Disposition:** untriaged. Compare existing consumer/profile rollout guidance during Phase 5;
  this observation does not authorize deleting unknown profile fields or bypassing admission.

## 2026-10-26 — Safety-screen temporary-file quota

- **Observation:** a generic safety-gate refusal was caused by `EDQUOT` while staging a tracked
  input on the temporary filesystem, despite apparently sufficient free blocks. Bounded one-file
  staging identified the errno without exposing payloads or copying the whole tree.
- **Response and proof:** an ignored, task-owned `TMPDIR` on the repository filesystem preserved
  scanner behavior and allowed same-filesystem links. The unchanged pre-commit screen then passed
  in session `94831`; promotion PR #745 subsequently passed exact-head CI and merged.
- **Scope:** no scanner rule, tracked configuration, foreign temporary directory, or safety
  requirement changed. Raw diagnostics stay local.
- **Disposition:** untriaged; Phase 5 will select an existing durable home or discard with reason.

## 2026-10-26 — Native tool discovery in noninteractive commands

- **Observation:** doctor reported Fantomas and CSharpier unavailable, although the declared
  versions were already installed and direct executable probes passed. The command environment
  omitted the native tool directory from `PATH`.
- **Response:** use the documented native tool directory in the invocation environment; preserve
  shell profiles, installed versions, and doctor requirements. Dart/Flutter was a separate
  missing prerequisite; the documented checksum-verified pinned SDK installation resolved it.
  The final standalone doctor passed all 24 checks, as recorded in
  [bootstrap evidence](./evidence/P0/bootstrap.md).
- **Disposition:** untriaged; compare existing setup guidance before deciding whether any durable
  correction is needed during Phase 5.

## 2026-10-26 — Join the existing host admission profile

- **Observation:** an unconfigured consumer requested exclusive coordination while the installed
  host sampler used the existing reservation profile. Admission rejected the payload before it
  started. A later zero-owner status snapshot did not prove the earlier reservation epoch absent.
- **Response and proof:** select the host's already approved profile through `HIPPO_CONFIG` for
  each command. Both installed consumer versions accept that profile; the subsequent baseline
  command passed. No pin, ledger root, admission policy, sampler, or foreign process changed.
  See [baseline admission history](./evidence/P0/baseline-targets.md#hippo-admission-history).
- **Disposition:** untriaged; check existing host-profile guidance before proposing any durable
  documentation correction. Host-specific paths and raw diagnostics remain ignored.

## 2026-10-26 — Scenario fixtures can retain detached DOM

- **Observation:** collection-time `userEvent.setup()` sessions captured by retained Cucumber
  closures kept detached scenario DOM reachable. A correctly admitted single-worker full suite
  still exhausted the unchanged V8 heap in the calculator fixture.
- **Response and proof:** the declared one-file fixture repair creates each session lazily and
  clears it at scenario/example boundaries. It preserves scenario titles, step literals,
  assertions, API call order, coverage floors, and timeouts. Independent review found zero
  issues. Focused 526/526 tests passed; the original full quick then passed 247/247 files and
  4,177/4,177 tests with 99.54% line coverage and exit 0.
- **Disposition:** untriaged. The behavior repair already belongs to the named test fixture;
  Phase 5 must avoid duplicating it as a new general rule without a demonstrated gap.

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
- **Disposition:** untriaged; compare existing continuation and evidence rules before routing
  or discarding this operational observation.

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
- **Disposition:** untriaged; compare existing dependency-aware admission guidance before
  routing any duplicate instruction.

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
- **Disposition:** untriaged. The eventual route and its proof must be settled before selecting
  a durable destination; this observation does not authorize a third-party patch or policy edit.

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
- **Disposition:** untriaged. Compare the existing central machine procedure before creating
  any new rule; do not turn its tool-specific exception into a blanket guard bypass. See
  [the storage recovery evidence](./evidence/P0/disk-recovery.md).

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
- **Disposition:** untriaged. Compare existing environment and temporary-path guidance during
  Phase 5 before adding any durable correction; this does not authorize foreign temp cleanup.

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
- **Disposition:** untriaged. Check existing adapter and test guidance before proposing any
  durable addition; avoid prescribing ignored parameters or disabling arity validation.

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
- **Disposition:** untriaged. Route only an established ownership-check gap during Phase 5;
  this observation does not authorize deleting unknown resources or patching the provider.
