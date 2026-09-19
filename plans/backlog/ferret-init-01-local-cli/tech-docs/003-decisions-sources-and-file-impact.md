# Decisions, Sources, and File Impact

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

## Material Decisions

### D1 — Python standard-library-only runtime

**Selected [Judgment call]:** Python `>=3.14,<3.15`, built as a zipapp; runtime dependency list is empty.

- Need: hooks must start predictably across repositories without activating a project environment.
- Alternative 1: distribute a `uv`-managed environment. It simplifies packaging third-party libraries but
  makes every hook depend on an environment installation and resolver state.
- Alternative 2: compile a native binary. It improves deployment ergonomics but adds a cross-platform build
  toolchain before the product contract is stable.
- Consequence: adapters and HTTP added later use `json`, `sqlite3`, and `urllib`; development tools remain
  locked dependencies. Revisit only if a required feature cannot be implemented responsibly in the standard
  library or startup/installation measurements fail.

**[Repo-grounded]** `apps/rhino-cli/project.json`, `apps/crane-cli/project.json`, and
`repo-governance/development/infra/nx-targets/mandatory-targets-cli-e2e.md` establish executable CLI build,
run, dependency-install, and public-process test semantics; Python implementation details are new.

### D2 — One per-user SQLite database

**Selected [Judgment call]:** one OS-user data home shared across repositories.

- Need: usage comparisons need one coherent local timeline and a single retention/sync owner.
- Alternative 1: repository-local databases. They isolate repositories but fragment analysis and duplicate
  maintenance.
- Alternative 2: in-memory or JSON Lines files. They avoid schema management but provide weak concurrency,
  indexing, and atomic retention.
- Consequence: identifiers must be privacy-preserving and concurrent writes bounded. Revisit only if measured
  contention violates the hook deadline after short-transaction tuning.

**[Repo-grounded]** No existing telemetry store/schema was found by targeted search of `apps/`, `libs/`,
`specs/`, and `repo-config.yml`; this plan therefore owns the first store rather than extending one.

### D3 — Fail-open local commit, no network

**Selected [Judgment call]:** adapters call one local capture transaction and always exit zero.

- Need: observational tooling may not become a correctness dependency of an agent harness.
- Alternative 1: direct backend submission. It removes a queue but makes service/network health part of the
  hook path.
- Alternative 2: skip hooks and parse transcripts later. It may capture content unintentionally and loses
  stable lifecycle semantics.
- Consequence: some events can be lost on local persistence failure; status and documentation state that
  limit. Revisit only if a harness supplies a first-class durable telemetry sink with equal privacy controls.

**[Repo-grounded]** `.claude/settings.json`, `.codex/hooks.json`, and `docs/reference/platform-bindings.md`
establish hand-authored hook sources and vendor-specific lifecycle differences.

### D4 — Metadata-only closed event model

**Selected [Judgment call]:** reject unknown fields and all content payloads.

- Need: effectiveness exploration requires counts/outcomes/durations, not conversations or tool data.
- Alternative 1: arbitrary JSON payload. It future-proofs fields but silently permits secrets and unbounded
  schema drift.
- Alternative 2: store full transcripts for later analysis. It increases analytical power at an unacceptable
  privacy/security cost and duplicates harness ownership.
- Consequence: adding a field requires a versioned schema decision and migration. Revisit only through a plan
  that supplies a concrete metric, privacy classification, retention rule, and negative tests.

### D5 — Thirty-day logical retention with opportunity-based reclamation

**Selected [User decision + implementation constraint]:** every usage-derived local record becomes unreadable
at `expires_at <= now`; the next FERRET operation attempts a separate prune transaction that stops at the first
of 100 rows or 100 monotonic milliseconds. No scheduler is added.

- Need: bound disk and privacy exposure on developer machines.
- Alternative 1: retain unsent rows indefinitely. It improves delivery completeness but violates the requested
  local storage boundary during a long outage.
- Alternative 2: size-only retention. It bounds bytes but makes history length unpredictable and hard to
  explain.
- Consequence: an inactive machine can retain physical bytes even though the next read cannot expose them; a
  backend outage longer than 30 days intentionally loses oldest pending events in Plan 02. Revisit only with
  explicit user authorization for a daemon or different local privacy/storage promise.

### D6 — Dedicated Python CLI E2E project

**Selected [User decision]:** `ferret-cli-e2e` owns subprocess proof against the built artifact and consumes the
CLI corpus.

- Need: the user explicitly selected four projects and the public process boundary needs isolated proof.
- Alternative 1: place E2E under the CLI project. This matches some CLI precedents but contradicts the chosen
  app topology.
- Alternative 2: TypeScript/Playwright for CLI E2E. It is established for HTTP/browser E2E but adds Node as a
  test-language boundary with no browser/API benefit.
- Consequence: repository Nx/BDD tooling must learn this legitimate Python dedicated-E2E shape. Revisit only
  if governance later standardizes all CLI E2E inside owners.

### D7 — Ordered compact JSON canonicalization

**Selected [Judgment call]:** validate, NFC-normalize, emit every property in the contract's fixed order, and
SHA-256 the exact compact UTF-8 bytes.

- Need: Python now and a later backend must reproduce byte-identical hashes without floating-point ambiguity.
- Alternative 1: RFC 8785 JSON Canonicalization Scheme. It is portable, but its generalized number and member
  sorting rules add unnecessary surface to this integer-only fixed schema.
- Alternative 2: hash a database tuple. It is simple locally but couples wire idempotency to database types and
  cannot provide a language-neutral fixture.
- Prior art: the repository's RHINO byte-identity invariants favor exact fixtures; external prior art is
  [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) (accessed 2026-09-18).
- Consequence/revisit: any property or byte rule is a wire-breaking schema change. Revisit if Plan 02 cannot
  reproduce the fixed vector or FERRET admits floating-point/map-valued fields.

### D8 — Immutable versioned capability snapshots

**Selected [Judgment call]:** store a snapshot plus composite-keyed items whenever a harness/version assessment
changes; Events reference no mutable capability row.

- Need: analysts must distinguish absent observations from harness limitations as understood at capture time.
- Alternative 1: repeat capabilities on every Event. It preserves history but substantially inflates the
  local budget. Alternative 2: one mutable row per harness. It is compact but rewrites provenance history.
- Prior art: `docs/reference/platform-bindings.md` models vendor capability differences; append-only snapshot
  versioning follows the repository's preference for reconstructable evidence.
- Consequence/revisit: producer-owned `snapshot_id` is the idempotency identity. The same ID and recomputed hash
  is a duplicate; the same ID with a different hash is a conflict; a changed assessment creates a new ID and
  snapshot even when some items are unchanged. No global hash/content uniqueness exists. Revisit if benchmarked
  snapshot overhead exceeds 5% or harnesses expose signed capability manifests.

### D9 — Installation-external HMAC key file

**Selected [Judgment call]:** keep exactly 32 random bytes at
`<FERRET_DATA_HOME>/identity.key`, outside SQLite.

- Need: copied/exported databases must not reveal raw workspace/session values or the derivation key.
- Alternative 1: key in SQLite. It simplifies backup but defeats database-copy separation. Alternative 2: OS
  keychain. It improves hardware-backed storage on some hosts but breaks standard-library-only portability and
  headless reproducibility.
- Prior art: repository secret rules keep secrets outside committed/config data; Python's
  [secrets module](https://docs.python.org/3.14/library/secrets.html) supplies OS randomness.
- Consequence/revisit: database-only restore cannot derive identifiers compatible with the old installation.
  Revisit if a cross-platform standard-library keychain or an explicit encrypted-backup plan is approved.

### D10 — No retention scheduler

**Selected [Judgment call]:** logical predicates enforce expiry on every read; due operations attempt a
separate transaction stopping at 100 rows or 100 monotonic milliseconds, and explicit maintenance can finish it.

- Need: honor 30-day visibility without adding a daemon/service lifecycle.
- Alternative 1: OS scheduled tasks. They reclaim bytes while inactive but multiply installer/platform and
  recovery obligations. Alternative 2: detached background cleanup. It races process exit/reconfiguration and
  cannot prove a committed prune before return.
- Prior art: existing repository CLIs are invoked processes, not daemons; SQLite's
  [incremental vacuum guidance](https://sqlite.org/pragma.html#pragma_incremental_vacuum) informs reclamation.
- Consequence/revisit: inactive installations retain physical bytes. Revisit when measured disk pressure makes
  status/manual cleanup insufficient or a service-owned backend agent is authorized.

### D11 — Synchronous watchdog and commit deadline

**Selected [Judgment call]:** wrappers send TERM at 900 ms, KILL at 1,000 ms, reap the process, suppress both
streams, and return zero; successful capture returns only after commit.

- Need: fail-open must be time-bounded without acknowledging an event that is still uncommitted.
- Alternative 1: fire-and-forget. It minimizes hook latency but loses terminal commit semantics and can orphan
  children. Alternative 2: wait indefinitely. It improves capture probability but can block the harness.
- Prior art: repository CI forbids sleep/retry masking; POSIX process signals and Python `subprocess` provide
  explicit cancellation. Harness-specific asynchronous registration is used only where officially supported.
- Consequence/revisit: timed-out events may be lost and are never retried by hooks. Revisit if measured p95
  cannot stay below 150 ms or a harness offers a durable, bounded telemetry callback.

### D12 — POSIX hooks and portable local CLI

**Selected [User decision]:** macOS/Linux POSIX receive lifecycle adapters/E2E; Windows receives CLI-local
init, capture, query, analytics, retention, private ACL, install, and uninstall proof only. Plan 01 extends the
existing `.github/workflows/non-product-full-quality.yml` with job `ferret-cli-windows` as the executable
GitHub-hosted `windows-2025` proof route.

- Need: Windows harness launch/deadline surfaces are not proven, while the new bounded CI job can prove the
  portable CLI contract without claiming Windows lifecycle-hook support.
- Alternative 1: claim parity through an untested PowerShell wrapper. It creates a false safety guarantee.
  Alternative 2: drop Windows entirely. It needlessly excludes portable SQLite/query and manual capture.
- Prior art: `docs/reference/platform-bindings.md` treats harness capabilities explicitly; Windows protected
  DACLs follow Microsoft's [access-control model](https://learn.microsoft.com/windows/win32/secauthz/access-control).
- Consequence/revisit: Windows status says `unsupported_platform`, never zero usage. The PR workflow gains
  fail-closed Python affected detection and a merge-blocking Python quick job. The existing scheduled/dispatch
  workflow adds FERRET to its POSIX quick/Integration/E2E lists and gains a 30-minute job named
  `FERRET CLI Windows local proof`, after `integration`, using checkout v6 without persisted credentials, the
  existing Node setup, exact Python 3.14.7, pinned setup-uv SHA
  `bec219d24cd3e171d82865faccec33120bb574f4` (`v10.1.0`), uv 0.12.16 checksums
  `8e5c6e5523dffc2dcf615bd995554c84c9feb4e577808a3fb8698a639d3f8d9c` (Linux x86-64 GNU tarball) and
  `f730454bf09019754e5e5abd71a8aa18683cb739cba0d9c720bac2e7c901160f` (Windows x86-64 MSVC zip),
  selected by mutually exclusive `runner.os` steps with literal `version`/`checksum` inputs and fail-closed
  rejection of other operating systems, plus restore-all/save-main-only
  OS-qualified cache policy capped at two 500 MiB entries, direct Nx, and privacy-scanned JUnit/forecast
  evidence uploaded only after the sanitizer succeeds by
  `actions/upload-artifact@v7`. The literal artifact retains seven days, fails on missing files, is capped at
  1 MiB compressed/run, and budgets 21 MiB at two scheduled plus one execution dispatch daily; owner-wide use
  must remain at most 500 MB. HIPPO/RTK are local-compute guards and are deliberately absent; the workflow's
  existing concurrency plus the bounded job are CI admission.
  Revisit hooks only when a stable supported Windows lifecycle surface can prove privacy/no-output/TERM-
  equivalent deadlines.

## Verified External Prior Art

- **[Web-cited]** [Python 3.14.7](https://www.python.org/downloads/release/python-3147/) (accessed 2026-09-18)
  is an official stable 3.14 release dated 2026-08-05; its
  [sqlite3 documentation](https://docs.python.org/3.14/library/sqlite3.html) describes the DB-API interface.
- **[Web-cited]** [SQLite WAL](https://sqlite.org/wal.html) (accessed 2026-09-18) states that all processes must
  use the same host and describes concurrent readers with one writer.
- **[Web-cited]** [SQLite synchronous](https://sqlite.org/pragma.html#pragma_synchronous) (accessed 2026-09-18)
  describes the additional WAL synchronization provided by `FULL`.
- **[Web-cited]** [setup-uv v10.1.0](https://github.com/astral-sh/setup-uv/releases/tag/v10.1.0) and its
  [action definition at the pinned commit](https://github.com/astral-sh/setup-uv/blob/bec219d24cd3e171d82865faccec33120bb574f4/action.yml)
  (accessed 2026-09-18) resolve tag `v10.1.0` to commit
  `bec219d24cd3e171d82865faccec33120bb574f4` and expose literal `version`, `checksum`, `enable-cache`,
  `restore-cache`, `save-cache`, `cache-dependency-glob`, and `cache-suffix` inputs.
- **[Web-cited]** [uv 0.12.16 release assets](https://github.com/astral-sh/uv/releases/tag/0.12.16)
  (accessed 2026-09-18) publish per-asset SHA-256 files. The official Linux x86-64 GNU value is
  `8e5c6e5523dffc2dcf615bd995554c84c9feb4e577808a3fb8698a639d3f8d9c`; the Windows x86-64 MSVC value is
  `f730454bf09019754e5e5abd71a8aa18683cb739cba0d9c720bac2e7c901160f`.
- Harness lifecycle event names and payloads are version-sensitive. Phase 0 must use current official Claude
  Code, Codex, and OpenCode documentation and record exact versions rather than treating this plan as the
  authority.

## Dependencies

- Runtime: Python standard library only.
- Development: `uv`, pytest, pytest-bdd, coverage.py, Pyright, Ruff.
- Repository: Node/Nx for project orchestration and static BDD/rule/binding validators.
- No database server, container, browser, cloud account, or network service.

All resolved package versions and transitive licenses are recorded from `uv.lock`. OSE-authored source and
plan/spec documentation inherit the repository MIT license; third-party packages retain their own licenses.

## File-Impact Analysis

```text
.
├── apps/
│   ├── ferret-cli/ [N] — Python CLI source, tests, migrations, package/build config, README, LICENSE, Nx project
│   └── ferret-cli-e2e/ [N] — Python subprocess E2E adapter, fixtures, README, LICENSE, Nx project
├── specs/apps/ferret/
│   ├── README.md [N] — product navigation
│   ├── overview.md [N] — shared FERRET framing and privacy boundary
│   └── cli/
│       ├── README.md [N] — logical-owner corpus and adapter ownership
│       ├── architecture.md [N] — C4 context, containers, components
│       └── behaviours/**/*.feature [N] — canonical CLI/harness Gherkin corpus
├── .claude/
│   ├── settings.json [E] — verified Claude hook registrations
│   ├── hooks/ferret-capture.sh [N] — canonical fail-open/no-stdout capture wrapper
│   └── skills/harness-compatibility-protocol/** [E] — canonical capability and lifecycle rules
├── .codex/hooks.json [E] — verified Codex hook registrations using the canonical wrapper
├── .opencode/
│   └── plugins/ferret.ts [N] — OpenCode lifecycle capture plugin
├── .agents/skills/harness-compatibility-protocol/** [G] — generated skill binding mirror
├── .github/
│   ├── actions/
│   │   ├── README.md [E] — composite-action catalog entry and inputs
│   │   └── setup-python/action.yml [N] — composite exact Python/uv setup shared by Linux and Windows CI
│   └── workflows/
│       ├── non-product-full-quality.yml [E] — scheduled POSIX coverage and hosted Windows CLI-local proof
│       └── pr-quality-gate.yml [E] — fail-closed Python detection and merge-blocking Python quick job
├── docs/reference/platform-bindings.md [E] — catalog and trust/capability notes
├── repo-governance/development/infra/nx-targets/
│   ├── mandatory-targets-cli-e2e.md [E] — Python dedicated E2E install/test applicability
│   ├── mandatory-targets-behaviour-coverage.md [E] — pytest-bdd static adapter contract
│   └── tag-convention-current-tags-and-examples.md [E] — Python/FERRET project tag examples
├── repo-governance/workflows/infra/development-environment-setup/
│   └── phase-6-python-ecosystem.md [E] — shipped Python projects, uv/Pyright/pytest setup
├── scripts/
│   ├── behaviour-coverage.mjs [E] — Python pytest-bdd/coverage adapter recognition
│   └── behaviour-coverage.test.mjs [E] — positive/negative Python project fixtures
├── repo-config.yml [E] — project tags, ownership, gate/binding inventory
└── plans/
    ├── backlog/ferret-init-02-local-backend/README.md [E] — stable prerequisite marker becomes dated done link
    ├── in-progress/ferret-init-01-local-cli/** [E→D] — execution evidence then lifecycle move
    ├── done/<completion-date>__ferret-init-01-local-cli/** [N] — archived plan and evidence
    ├── in-progress/README.md [E] — active-plan index during execution
    └── done/README.md [E] — completion index at archival
```

### More Detail

The bounded `apps/**` and skill families are resolved to their member files in the Phase 0 ledger before the
first edit. Generated `.agents/skills/**` is never hand-edited; OpenCode consumes canonical `.claude/skills/**`
natively. No `.opencode/skills/**` or `.opencode/agents/**` change belongs to this plan. The hand-authored
`.opencode/plugins/ferret.ts` is product code, not a generated binding. `nx.json` needs no edit because project-local explicit inputs/outputs
cover both projects. Phase 0 verifies drift; contradiction amends the plan rather than selecting new scope.

The plan lifecycle tree shows the folder after backlog promotion. The executor uses the canonical pure move to
`in-progress`, changing only backlog/in-progress indexes. Plan 02 therefore carries a stable, non-link
prerequisite identifier while Plan 01 is movable. At final archival, lifecycle work separately discovers actual
Markdown-link destinations containing `ferret-init-01-local-cli` and broader non-link mentions. It classifies all
results, adds exact actual-link owners plus the explicit Plan 02 activation owner to the archive pathspec, and
replaces that stable marker with the first dated done-plan link. Plan 02 delivery's branch/worktree/command
literals remain unchanged and outside the rewrite pathspec. Discovery may add another link owner but may never
silently omit one. Full-plan link validation and an exact full-delta-versus-pathspec comparison prove that the
archive commit contains every required backlink/activation rewrite and nothing outside that reviewed set.

## Rollback and Removal

Before merge, revert the delivery branch. After merge, revert hook/plugin registrations first so harnesses stop
calling FERRET, then revert application/spec/rule files in one reviewed PR. Never delete the user's data home as
part of source rollback. The user removes it explicitly after export if desired. An incompatible/corrupt database
is copied before recovery; automatic destructive repair is forbidden.
