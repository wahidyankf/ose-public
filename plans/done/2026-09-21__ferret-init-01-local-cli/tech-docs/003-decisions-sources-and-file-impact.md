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

- Need: workspace roots and harness session identifiers are low-entropy, enumerable inputs, so an unkeyed digest
  of them is reversible by guessing candidates and comparing; derivation must therefore be keyed, and a copied
  or exported database must reveal neither the raw values nor the key.
- Alternative 1: key in SQLite. It simplifies backup but defeats database-copy separation. Alternative 2: OS
  keychain. It improves hardware-backed storage on some hosts but breaks standard-library-only portability and
  headless reproducibility. Alternative 3: unkeyed SHA-256 over the raw value. It needs no key file at all but
  leaves a dictionary attack over common home-directory and repository paths, so the stored identifier would be
  effectively the path it replaces.
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

### D12 — macOS and Linux only

**Selected [User decision]:** macOS and Linux are the only supported platforms, and WSL is treated as Linux.
Both receive the full surface: CLI, storage, queries, analytics, retention, lifecycle adapters, install, and
E2E. No other platform is claimed, tested, or shipped.

- Need: the team can only honestly test on hardware it owns. A platform that cannot be exercised locally either
  ships unproven or forces a hosted CI runner to stand in for a developer machine it does not resemble.
- Alternative 1: ship a portable CLI on Windows with no lifecycle adapters, proven by a hosted `windows-2025`
  job. It widens reach, but it buys a partial product with a permanent `unsupported_platform` reporting path, a
  second permission model (protected DACLs, reparse points, registry `PATH`), a second launcher, a second
  install and uninstall contract, a CI job with its own pinned toolchain and checksums, and an evidence
  sanitizer for host usernames — all to serve a configuration nobody on the team runs.
- Alternative 2: claim Windows parity through an untested launcher. It creates a false safety guarantee.
- Prior art: this repository's own pinned consumers already scope themselves the same way. `hippo.lock` and
  `rhino.lock` publish checksums for exactly `darwin-amd64`, `darwin-arm64`, `linux-amd64`, and `linux-arm64`,
  and their POSIX `sh` shims resolve platforms by `uname`. Neither ships a Windows artifact.
- Consequence/revisit: FERRET reports no unsupported-platform state because no unsupported platform is
  enumerated, which removes a whole status surface, a Gherkin scenario, a CI job, and a sanitizer from the plan.
  A Windows user runs FERRET under WSL like any other Linux user. Revisit only when the team runs the platform
  day to day and a repository CI runner can prove equivalent fail-open, no-output, deadline, and privacy
  behaviour — not merely that the CLI starts.

### D13 — Repository-scoped harness registration

**Selected [Judgment call]:** every lifecycle registration lives in the repository tree; Plan 01 writes nothing to a
per-user harness configuration. The data home stays machine-global per D2.

- Need: a registration must be visible in a diff, provable by this repository's gates, and removable by the documented
  rollback route, while one machine still keeps one coherent evidence store.
- Alternative 1: register in per-user harness configuration (`~/.claude/settings.json` and vendor equivalents). One
  wiring would cover every repository, but it fires in repositories this plan has no authority over, has no PR or CI
  route, cannot be reverted by the rollback below, and converts a vendor schema change into silent data loss instead
  of a failing gate.
- Alternative 2: per-user registration filtered by a repository allowlist in the data home. It keeps opt-in explicit
  with a single wiring, but adds configuration precedence, allowlist drift against moved or renamed checkouts, and an
  untested resolution surface before the event contract is stable.
- Prior art: `docs/reference/platform-bindings.md` already treats harness registration as hand-authored in-tree
  configuration under repository ownership rather than machine state.
- Consequence/revisit: capture coverage is opt-in per repository, so a machine's store reflects only wired
  repositories and never the machine's full harness usage. That boundary is a visibility gap, not zero usage, and
  `status` reports it under the D8 capability snapshot rather than synthesizing absent rows. Plan 01 delivers bindings
  for this repository only; another repository needs its own four binding surfaces plus the same per-user installed
  artifact. Revisit when the event contract is stable and a tested route exists for per-user registration; Alternative
  2 is the successor shape, and unconditional per-user registration is not.

**[Repo-grounded]** `repo-config.yml` declares harness ownership, parity, and generated-binding inventory;
`.claude/settings.json` and `.codex/hooks.json` are existing hand-authored in-tree registration sources. The Rollback
and Removal section below requires reverting hook and plugin registrations before application files, which presumes
those registrations are version-controlled.

### D14 — One inspectable data home at `~/.ferret`

**Selected [User decision]:** one data home at `$HOME/.ferret` on every supported platform holds `config.json`,
`identity.json`, `identity.key`, `ferret.sqlite3`, and `ferret.lock`. Plan 01 creates nothing under
`$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, or `~/Library/Application Support`.

- Need: `init` must create configuration, identity, key, and schema under one permission boundary inside one
  exclusive transaction; an explicit purge must remove exactly one directory; and a developer must be able to
  open the store by hand without first running `status` to find it.
- Alternative 1: XDG and platform-native locations — `${XDG_STATE_HOME:-~/.local/state}/ferret` on Linux and
  `~/Library/Application Support/Ferret` on macOS. It is what the conventions prescribe, but it yields two
  literal paths for two supported platforms, so every document, fixture, diagnostic, and error message carries a
  platform branch. The macOS path also contains a space and sits five levels deep, which makes the routine act
  of inspecting a telemetry store needlessly awkward. FERRET is a developer's own instrument on a developer's
  own machine; that inspection cost is paid daily while the tidiness benefit is abstract.
- Alternative 2: split user-editable configuration into `$XDG_CONFIG_HOME/ferret/`. Plan 01's `config.json` is
  generated by `init` and carries no user-authored value, so the split would place derived state in the
  directory reserved for user configuration. It also adds a second owner, mode, and symlink validation path, a
  second `unsafe_storage` route, separates configuration from the `ferret.lock` that serialises initialisation,
  and leaves an orphan directory after purge.
- Alternative 3: store configuration inside SQLite. It removes one file but couples reconfiguration to schema
  migration and weakens the database-copy separation D9 establishes for the adjacent key.
- Prior art: the XDG Base Directory Specification exists to stop `$HOME` becoming a junk drawer, and this
  decision knowingly spends one dotted directory against that intent to buy a single cross-platform path. The
  trade is bounded because D12 supports only macOS and Linux, so `~/.ferret` resolves identically on both, and
  because `FERRET_DATA_HOME` remains the one supported relocation for anyone who wants the XDG layout.
- Consequence/revisit: this changes the location, not the structure — there is still exactly one directory, one
  `0700` boundary, one atomic `init`, and one purge target. `status` still prints the resolved data home,
  because `FERRET_DATA_HOME` can move it. Co-locating `identity.key` with `ferret.sqlite3` makes the
  directory the correct backup unit: D9 states that a database-only restore cannot derive identifiers
  compatible with the old installation, so a restorable backup must carry the key, and copying `~/.ferret`
  whole is now exactly that operation. The corollary is that such a backup is as sensitive as the key it
  contains and must stay on trusted storage — never a dotfiles repository, a shared drive, or anything that
  globs `~/.*` into somewhere public. Moving data for analysis or sharing uses `events export`, which emits
  pseudonymised rows and never the key; the two operations are not interchangeable and the documentation states
  which is which. The install artefact deliberately stays outside this directory at
  `$HOME/.local/share/ferret/`, because `self uninstall` removes the artefact while keeping data, and that split
  would be lost if both lived here. Plan 02's `backend-api.token` joins this directory. Two triggers reopen
  this decision. A supported platform whose conventions make one literal path untenable reopens the location.
  Plan 02's `ferret backend configure --url` introduces the first user-authored field and reopens Alternative
  2's configuration split; that plan's D10 answers the trigger and records why it defers, and its successor
  shape keeps `identity.key` and `backend-api.token` here regardless of where configuration lands.

### D15 — Open bounded harness vocabulary

**Selected [User decision]:** `harness` is a bounded lowercase slug, not a closed enum. Vocabularies FERRET owns
— `eventType`, `outcome`, the three visibility fields, and `schemaVersion` — stay closed.

- Need: supporting a further coding-agent harness must not require an event-schema version, a SQLite migration,
  an OpenAPI enum change, and a backend that rejects events it is otherwise able to store.
- Alternative 1: keep the closed enum and raise the schema version per harness. Validation stays exhaustive, but
  every vendor addition becomes a breaking contract change across the CLI, the database, and Plan 02's REST
  surface, and an older backend rejects a newer CLI's events outright.
- Alternative 2: unbounded free text. It removes all friction but admits unnormalized spellings such as
  `Claude Code`, `claude-code`, and `claude_code` that silently fragment every grouped report, and widens what
  may enter an indexed column.
- Prior art: this plan already models vendor- and user-owned values — `agentName`, `skillName`, `toolName`, and
  `harnessVersion` — as bounded normalized text rather than enums. `harness` was the only third-party-owned
  value modelled as a closed set.
- Consequence/revisit: validation can no longer reject an unrecognized harness, so `status` enumerates the
  documented harness registry instead of deriving support from the schema, and an unknown `--harness` filter
  returns an empty result rather than a usage error. The value arrives as the static registration argument in a
  binding file and is never read from a harness payload, so the open vocabulary does not widen the payload
  surface. Plan 02 must render `harness` in `openapi.yaml` as a patterned string; an `enum` there would reinstate
  the closed set at the API boundary and cancel this decision. Revisit only if slug drift is observed in practice
  and a normalization table proves necessary.

**[Repo-grounded]** `tech-docs/002-sqlite-schema-privacy-and-retention.md` already constrains `agent_name`,
`skill_name`, and `tool_name` as bounded normalized text with an explicit character allowlist, and
`tech-docs/005-cli-and-shared-data-contract.md` takes `--harness` as a registration argument supplied by the
hand-authored binding files D13 keeps in the repository tree.

### D16 — Tagged release now, shim consumption later

**Selected [User decision]:** FERRET adopts the HIPPO and Rhino release shape — an annotated git tag, a GitHub
release, and a published `checksums.txt` — using the monorepo-qualified tag `ferret-cli/vX.Y.Z`. It does not
adopt their consumer shape (a committed shim plus a `*.lock` pin) in Plan 01.

- Need: the artifact `self install` places must be identifiable and verifiable after the fact, and the scheme
  must not have to change once a second repository consumes FERRET.
- Alternative 1: adopt the shim and lock file now, matching `./hippo` and `./rhino` exactly. It is the eventual
  destination, but HIPPO and Rhino are products in independent repositories consumed from outside, while Plan 01
  builds FERRET in-tree and installs it through `self install`. With no external consumer yet, a shim and a lock
  file add a resolution layer, a cache, and a verification path that nothing exercises.
- Alternative 2: ship untagged builds from `main`. It removes ceremony but leaves no identity to pin later and
  no digest to compare an installed artifact against.
- Prior art: `hippo.lock` pins `version=v0.7.2` with a commit and per-platform SHA-256 values; `rhino.lock` pins
  `version=v0.4.0` the same way. Release `v0.7.2` publishes `checksums.txt` beside
  `hippo_v0.7.2_{darwin,linux}_{amd64,arm64}.tar.gz`, and both consumers are POSIX `sh` shims that resolve the
  platform by `uname`. Neither publishes a Windows artifact, which is the same boundary D12 sets.
- Consequence/revisit: two deliberate divergences follow from the artifact being a Python zipapp rather than a
  compiled binary.
  - **One artifact, not four.** `ferret-cli_vX.Y.Z.pyz` is platform-independent, so the release carries a single
    digest where HIPPO carries four. A future lock file has one checksum line, not a platform matrix.
  - **A host runtime dependency HIPPO and Rhino do not have.** Their binaries are self-contained; the zipapp
    needs Python 3.14 on the host. A missing or wrong interpreter makes every adapter fail open, which loses
    telemetry silently — precisely the failure this product exists to make visible. D1 keeps the zipapp, so
    `status` closes the gap instead: it reports `runtime.interpreterPath`, `runtime.interpreterVersion`, and
    `runtime.interpreterState` of `supported`, `unsupported_version`, or `unresolved`. A runtime gap is a
    reported state, never an empty result.

  Revisit the consumer shape when a second repository needs FERRET, which D13 makes a question of when rather
  than whether. At that point the successor is exactly the HIPPO shape: a committed POSIX `sh` shim, a
  `ferret.lock` carrying `version`, `commit`, and the single artifact digest, and `uname`-based resolution that
  covers only the platforms D12 supports.

**[Repo-grounded]** `hippo.lock`, `rhino.lock`, and the `./hippo` consumer in this repository establish the tag,
checksum, cache, and `uname` resolution pattern this decision adopts and defers.

**Execution status (A65, 2026-09-22).** D16 was decided and never wired into the delivery checklist. A
repository-wide search for `D16` across this plan returned exactly one hit — the heading above. No checkbox,
acceptance criterion, file-impact row, or evidence file referenced it, so no gate could catch its absence, and
the Phase 6 preliminary audit and the Phase 8 terminal audit both missed it because both audit the checklist
and the acceptance criteria. At the terminal close the repository held one tag, `parked/churn-2026-07-19`, no
GitHub release at all, and no release workflow.

The release **capability** is delivered by the terminal closure delivery, and the first tagged release
follows its merge: `.github/workflows/ferret-cli-release.yml` builds the zipapp for a `ferret-cli/vX.Y.Z`
tag, asserts the tag object is annotated, proves the build reproduces byte for byte, checks the tag against
the declared version and the artifact's own `version` output, and publishes one `ferret-cli_vX.Y.Z.pyz`
with `checksums.txt`. None of D16's three artifacts exists while that file is being merged, because a tag
cannot trigger a workflow that is not yet on `main`; the terminal audit scored the earlier wording, which
said the release half was executed, as an overstatement, and A71 carries the correction.
`apps/ferret-cli/tests/unit/test_release_contract.py` binds the tag round trip as a property rather than a
literal, per L30. The verb that names the workflow is propagated as
a rule in the same delivery.

The consumer half stands as written: no `./ferret` shim and no `ferret.lock` exist, and neither is due until a
second repository consumes FERRET. That deferral was correct; only the release half was overdue.

### D17 — Rhino-aligned interaction surface, independent command structure

**Selected [User decision]:** FERRET matches Rhino wherever a person's habit crosses tools — help, version,
output selection, and response envelope — and diverges wherever the domains genuinely differ.

- Need: a developer who uses `rhino` and `ferret` in the same repository should not have to remember which one
  takes `--output json` and which one hides version behind a subcommand.
- Aligned: `-h` / `--help` on root and every subcommand with no `help` subcommand; `ferret version` as a
  subcommand; `--output <text|json>` with `--json` as its shorthand; a response envelope carrying
  `schemaVersion`, `command`, and `exitCode` in that order, including on success; bare invocation writing usage
  to stderr and exiting 2.
- Deliberately not aligned: **command structure**, because Rhino spans 27 commands across `governance`, `md`,
  `env`, `toolchain`, and `convention` and needs the depth, while FERRET has eleven in one domain — `ferret
storage events list` would add a word without adding clarity. **Exit-code semantics**, because Rhino's `1`
  means a policy violation and FERRET enforces no policy; FERRET keeps `0`/`2`/`3`/`4` for success, caller
  error, environment error, and integrity failure. **Error prefix**, because `FERRET error [<code>]: <message>`
  carries a closed machine-triageable code that `rhino: <message>` does not.
- One superset: Rhino rejects `--version`. FERRET accepts `ferret version`, `--version`, and `-V`, all printing
  the same line, because refusing the most frequently typed form buys nothing. Rhino gaining `--version` would
  close the gap from the other side and belongs upstream, not here.
- Consequence/revisit: two `schemaVersion` fields now differ deliberately and must not be conflated. The
  **command-response** envelope uses integer `1`, matching Rhino. The **Event and capability-snapshot**
  envelopes keep the string `"1.0"`, because `schemaVersion` is the first field of the canonical hash input and
  the fixed vector `199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c` depends on it; changing it
  would break Plan 02's cross-language digest agreement for no user-visible gain. `config.json`, `identity.json`,
  and the install manifest are stored file formats rather than command output and also keep `"1.0"`. Revisit
  only if Rhino changes its own interaction surface.

**[Repo-grounded]** Probed against the pinned `./rhino` consumer at `v0.4.0`: `rhino version` prints `v0.4.0`,
`rhino --version` and `rhino help` are rejected, bare `rhino` exits 2 with `rhino: no command given; try
`rhino --help``on stderr and empty stdout,`--json`is documented as shorthand for`--output json`, and
`rhino repo-config validate --output json`returns`{"schemaVersion":1,"command":"repo-config","exitCode":0,...}`.

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
  `8e5c6e5523dffc2dcf615bd995554c84c9feb4e577808a3fb8698a639d3f8d9c`.
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
│   │   └── setup-python/action.yml [N] — composite exact Python/uv setup for macOS and Linux CI
│   └── workflows/
│       ├── README.md [E] — workflow-family map row for tagged releases
│       ├── ferret-cli-release.yml [N] — tag-triggered build, reproducibility proof, and release publish
│       ├── non-product-full-quality.yml [E] — scheduled macOS and Linux coverage
│       └── pr-quality-gate.yml [E] — fail-closed Python detection and merge-blocking Python quick job
├── docs/reference/platform-bindings.md [E] — catalog and trust/capability notes
├── repo-governance/development/infra/github-actions-workflow-naming/
│   ├── filename-grammar-and-vocabulary.md [E] — the `release` verb and its enforcement disposition
│   └── target-file-set.md [E] — the new workflow filename and its disposition
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
├── package.json [E] — the workspace's Python convenience scripts for the new projects
├── apps/README.md [E] — annotated index row for each new application
├── specs/README.md [E] — annotated index row for the new product corpus
├── specs/apps/README.md [E] — annotated index row for the new application corpus
├── docs/reference/monorepo-structure.md [E] — the new applications in the structure reference
└── plans/
    ├── backlog/ferret-init-02-local-backend/README.md [E] — stable prerequisite marker becomes dated done link
    ├── in-progress/ferret-init-01-local-cli/** [E→D] — execution evidence then lifecycle move
    ├── done/<completion-date>__ferret-init-01-local-cli/** [N] — archived plan and evidence
    ├── in-progress/README.md [E] — active-plan index during execution
    └── done/README.md [E] — completion index at archival
```

The four rows under `.github/workflows/` and
`repo-governance/development/infra/github-actions-workflow-naming/` were added by the terminal closure
delivery rather than before execution, because decision D16 was never scheduled and its files therefore
had no place in the pre-execution set. The terminal audit scored the omission and A65's failure to repair
it; A70 carries the repair. Stating when a row arrived is the point — a declared set that silently grows
to match whatever was delivered proves nothing.

The five rows above `plans/` — `package.json`, the three README indexes, and the structure reference — were
declared after execution rather than before it, and amendment A45 records that. They are here so the declared set and
the delivered set agree: each is forced by a repository gate the moment the new project and spec trees exist, which is
why execution found them rather than analysis.

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
