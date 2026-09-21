# CLI and Shared Data Contract

## Scope and Compatibility

This document freezes the Plan 01 CLI, local analytics, and shared telemetry contract. Plan 02 must round-trip
these records without dropping or reinterpreting a field. Every JSON object rejects unknown members. Every
success example below is the complete shape; arrays may be empty and nullable values remain present.

All timestamps are UTC RFC 3339 strings with exactly three fractional digits and `Z`. All JSON commands write
one compact UTF-8 JSON object plus LF to stdout and nothing to stderr on success. Human mode writes stable
column headings and values for people, but scripts must use `--json`. JSON failures write one compact object
plus LF to stderr and nothing to stdout. JSON Lines export is the one exception: it writes zero or more compact
Event objects to stdout, each followed by LF.

## POSIX and Pipeline Behaviour

`ferret` is an ordinary POSIX filter and composes with other tools without special cases.

**Supported platforms.** macOS and Linux only. WSL is a Linux environment and needs no separate treatment. No
other platform is claimed, tested, or shipped; see D12.

**Streams.** stdout carries data, stderr carries diagnostics, and the two never mix. A command that succeeds
writes nothing to stderr; a command that fails writes nothing to stdout. Human-mode empty results print
`No rows.` to stderr so a piped stdout stays byte-empty, matching `events export`, whose empty result is zero
bytes.

**Broken pipes.** Every command restores the default `SIGPIPE` disposition before writing. `ferret events export
--format jsonl | head -5` therefore terminates the way any POSIX filter does: silently, at the write that fails,
with no traceback, no partial JSON object, and no `BrokenPipeError` on stderr. A broken pipe never leaves a
write transaction open.

**Streaming.** `events export` writes each Event object as it is read, flushing per line, and holds no unbounded
buffer. A consumer sees the first record before the last is queried, and peak memory does not grow with result
size. `events list` is paginated and bounded by construction.

**No terminal dependence.** Output bytes are identical whether or not stdout is a terminal. No command emits
ANSI escapes, colour, spinners, progress, or width-dependent padding, and none inspects `isatty`. Human tables
are tab-separated so `cut`, `awk`, and `column` work unchanged.

**Locale and encoding.** Output is UTF-8 and locale-independent. `LC_ALL`, `LANG`, and `TZ` never change bytes,
ordering, number formatting, or timestamps; all times are UTC RFC 3339.

**stdin.** `capture` and `capture-hook` read one object from stdin until EOF and work identically from a pipe, a
heredoc, a here-string, or a file redirect. Neither requires a terminal, and neither prompts.

**Non-interactive by default.** No command prompts unless it is destructive, and the one destructive route has
an explicit non-interactive path: `self uninstall --purge-data --yes`. Without `--yes` it fails with
`confirmation_required` rather than blocking a pipeline on a read from stdin.

**Argument conventions.** `--` terminates option parsing so a value beginning with `-` can be passed. Unknown
options fail with `invalid_arguments` and exit 2 rather than being ignored. Requested help and version go to
stdout with exit 0; a usage mistake goes to stderr with exit 2.

**Signals.** `SIGINT` and `SIGTERM` during a write roll the transaction back and leave no partial row. The
process then dies from the signal rather than converting it into an exit code of its own.

**Exit status.** `0` success, `2` caller error, `3` environment or storage error, `4` integrity failure, as the
closed failure contract below fixes. An empty result set is success, not an error.

## Closed Command Grammar

```text
ferret [-h | --help] [-V | --version]
ferret version
ferret init [--json]
ferret capture [--json]
ferret capture-hook --harness <harness-slug> --event <registered-event>
ferret status [--json]
ferret events list [filters] [--limit 1..200] [--cursor <opaque>] [--json]
ferret events export [filters] --format jsonl
ferret usage [filters] --group-by <dimension>[,<dimension>...] [--json]
ferret outcomes [filters] --group-by <dimension>[,<dimension>...] [--json]
ferret maintenance [--if-due] [--json]
ferret self install --target user [--json]
ferret self uninstall [--purge-data] [--yes] [--json]
```

Every command additionally accepts `-h` / `--help`; see [Help and Version](#help-and-version).

Machine output is selected by `--output <text|json>`, defaulting to `text`. `--json` is exactly a shorthand for
`--output json`, so the two are interchangeable everywhere `[--json]` appears above. Commands with no machine
form — `capture-hook`, which is silent, and `events export`, whose stdout is already the data stream — reject
both. This mirrors Rhino so one habit carries across the repository's tools; see D17.

Shared filters are `--from` inclusive, `--to` exclusive, `--all-time`, `--harness`, `--workspace`,
`--event-type`, `--agent`, `--skill`, `--tool`, and `--outcome`. Each scalar filter occurs at most once.
`--all-time` is mutually exclusive with `--from` and `--to`. Default time is the seven days ending at injected
current UTC time. `--from <timestamp>` without `--to` ends at injected now; `--to <timestamp>` without `--from`
starts seven days earlier. Bounds must satisfy `from < to`. All reads add `expires_at > injected_now`, including
`--all-time`; expired telemetry is never returned.

`events list` defaults to 100 and caps at 200. `usage` accepts one to three unique dimensions from the closed
set `harness,event_type,agent,skill,tool,subject_visibility`. `outcomes` accepts one to three unique dimensions
from `harness,event_type,agent,skill,tool,outcome,outcome_visibility`. Group order is caller order; rows sort by
the corresponding dimension values with null after strings. Counts never substitute zero for unknown data.
The `capture-hook --event` value uses the closed Event `eventType` set below; unsupported vendor events are not
registered and a direct unsupported value is silently discarded by the fail-open command.

## Help and Version

`-h` / `--help` is the canonical form and is accepted on the root command and on every subcommand. There is no
`help` subcommand: `ferret help` is `invalid_arguments`, exactly as `rhino help` is. Version is the mirror
image — `ferret version` is a subcommand, matching `rhino version`, and `--version` / `-V` are accepted as well
because rejecting the most frequently typed form buys nothing. All three print the same line.

Requested help is a successful result: it is written to **stdout** and exits **0**, so `ferret --help | less`
works. A usage mistake is a failure: argparse's message goes to **stderr** and exits **2** as
`invalid_arguments`. Bare `ferret` with no command writes the short usage to stderr and exits 2, because doing
nothing is not a success. Help and version output is human text only and has no `--json` form.

`ferret version`, `ferret --version`, and `ferret -V` all write exactly one line and exit 0:

```text
ferret 0.1.0
```

The interpreter behind that version is reported by `status`, not here, because `--version` must stay one line.

Root help is exactly:

```text
usage: ferret <command> [options]

Local-first telemetry for coding-agent harnesses. Metadata only: never prompts,
responses, tool arguments, transcripts, or environment values.

commands:
  init                create the private data home, identity, and schema
  capture             store one canonical event read from stdin
  capture-hook        map one raw harness payload; always fails open
  status              report paths, runtime, storage, health, and adapters
  events list         list retained events, newest first
  events export       write retained events to stdout as JSON Lines
  usage               count observed activity by dimension
  outcomes            summarise operational outcomes by dimension
  maintenance         apply retention, checkpoint, and measure space
  self install        install the artifact for the current user
  self uninstall      remove the artifact; data is kept unless purged

  version             print the version and exit

options:
  -h, --help          show this help and exit
  -V, --version       show the version and exit
  --output <text|json>
                      render the result as text or JSON; defaults to text
  --json              shorthand for --output json

Telemetry older than 30 days is never returned. Scripts should use --json.
Run 'ferret <command> --help' for a command's options.
```

Every subcommand follows the same shape. `ferret events export --help` is exactly:

```text
usage: ferret events export [filters] --format jsonl

Write retained events to stdout as JSON Lines, oldest first by (occurredAt,
eventId). An empty result is zero bytes.

options:
  -h, --help           show this help and exit
  --format jsonl       output format; jsonl is the only accepted value
                       (--output and --json are rejected; stdout is the data)
  --from <timestamp>   inclusive RFC 3339 UTC lower bound
  --to <timestamp>     exclusive RFC 3339 UTC upper bound
  --all-time           ignore the default seven-day window
  --harness <slug>     filter by harness
  --workspace <id>     filter by opaque workspace ID
  --event-type <type>  filter by event type
  --agent <name>       filter by agent name
  --skill <name>       filter by skill name
  --tool <name>        filter by tool name
  --outcome <outcome>  filter by outcome
```

Help text is a tested surface, not incidental output: the built-artifact smoke check asserts that
`ferret --help` exits 0 on stdout, that `ferret help` exits 2 as `invalid_arguments`, that `ferret` alone exits
2 on stderr, that `ferret version`, `--version`, and `-V` print the same single line, and that every command in
the root listing resolves.

## Canonical Event Object

Every property is present. The property order is normative.

```json
{
  "schemaVersion": "1.0",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "eventHash": "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c",
  "occurredAt": "2026-09-18T08:15:30.123Z",
  "capturedAt": "2026-09-18T08:15:30.130Z",
  "harness": "claude_code",
  "harnessVersion": "1.0.123",
  "installationId": "00000000-0000-4000-8000-000000000002",
  "workspaceId": "ws_327b250d010590da40f0f76d18da910a",
  "sessionId": "ss_d0de260ca18a8379984031556b2d43ac",
  "parentSessionId": null,
  "eventType": "tool.completed",
  "agentName": null,
  "skillName": null,
  "toolName": "Read",
  "outcome": "success",
  "durationMs": 27,
  "subjectVisibility": "observed",
  "outcomeVisibility": "observed",
  "durationVisibility": "observed"
}
```

`harness` is an open bounded vocabulary: any value matching `^[a-z][a-z0-9_]{0,31}$`. Plan 01 registers
`claude_code`, `codex`, and `opencode`; a further harness is added by registering a new slug and its adapter,
without an event-schema version change. The value is supplied by the static registration argument in a binding
file and is never read from a harness payload.

Closed values are:

- `eventType`: `session.started`, `session.ended`, `agent.started`, `agent.ended`, `skill.invoked`,
  `tool.started`, `tool.completed`, `tool.failed`.
- `outcome`: `success`, `failure`, `cancelled`, `unknown`, `not_applicable`.
- each visibility: `observed`, `derived`, `unknown`, `not_applicable`.

### Event and provenance invariants

| Event type        | Subject fields                   | Outcome                               | Duration              |
| ----------------- | -------------------------------- | ------------------------------------- | --------------------- |
| `session.started` | all null; subject not applicable | `not_applicable`; not applicable      | null; not applicable  |
| `session.ended`   | all null; subject not applicable | terminal/unknown; observed or unknown | nullable non-negative |
| `agent.started`   | only `agentName` may be non-null | `not_applicable`; not applicable      | null; not applicable  |
| `agent.ended`     | only `agentName` may be non-null | terminal/unknown                      | nullable non-negative |
| `skill.invoked`   | only `skillName` may be non-null | `not_applicable`; not applicable      | null; not applicable  |
| `tool.started`    | only `toolName` may be non-null  | `not_applicable`; not applicable      | null; not applicable  |
| `tool.completed`  | only `toolName` may be non-null  | `success`                             | nullable non-negative |
| `tool.failed`     | only `toolName` may be non-null  | `failure`                             | nullable non-negative |

For an applicable subject, `observed` or `derived` requires exactly one non-null subject name; `unknown`
requires all subject names null. `not_applicable` requires all names null. For an applicable outcome,
`unknown` requires `outcome=unknown`; `observed` or `derived` requires a terminal outcome. For applicable
duration, `observed` or `derived` requires a non-negative integer; `unknown` requires null. `not_applicable`
requires null. `parentSessionId` is populated only from a verified harness relationship. `occurredAt` may
precede `capturedAt` but may not be over 24 hours in the future.

## Deterministic Canonicalization and Hash

1. Validate the closed schema and invariants. Normalize accepted strings to Unicode NFC.
2. Exclude `eventHash` and order properties exactly as:
   `schemaVersion,eventId,occurredAt,capturedAt,harness,harnessVersion,installationId,workspaceId,sessionId,`
   `parentSessionId,eventType,agentName,skillName,toolName,outcome,durationMs,subjectVisibility,`
   `outcomeVisibility,durationVisibility`.
3. Serialize compact UTF-8 without BOM or whitespace. Emit JSON `null`, base-10 integers without leading
   plus/zeros, and no floating-point values. Escape quotation mark, reverse solidus, and U+0000–U+001F only;
   use JSON short escapes where defined and lowercase four-hex-digit `\u00xx` otherwise. Emit other NFC
   Unicode scalars directly.
4. SHA-256 those bytes and encode as 64 lowercase hexadecimal characters.
5. Every receiver recomputes before constant-time comparison and before idempotency lookup.

The fixed vector is the Event above without `eventHash`, serialized on one line in normative order:

```json
{
  "schemaVersion": "1.0",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-09-18T08:15:30.123Z",
  "capturedAt": "2026-09-18T08:15:30.130Z",
  "harness": "claude_code",
  "harnessVersion": "1.0.123",
  "installationId": "00000000-0000-4000-8000-000000000002",
  "workspaceId": "ws_327b250d010590da40f0f76d18da910a",
  "sessionId": "ss_d0de260ca18a8379984031556b2d43ac",
  "parentSessionId": null,
  "eventType": "tool.completed",
  "agentName": null,
  "skillName": null,
  "toolName": "Read",
  "outcome": "success",
  "durationMs": 27,
  "subjectVisibility": "observed",
  "outcomeVisibility": "observed",
  "durationVisibility": "observed"
}
```

Expected SHA-256:

```text
199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c
```

Python fixtures prove these exact bytes/digest plus NFC, escaping, null, integer, order, altered-field, and
formatting vectors. Plan 02 reuses the bytes verbatim for its server and cross-language fixtures.

## Versioned Capability Snapshot

An adapter produces a new immutable snapshot when its installed harness/version assessment changes. The item
identity is the composite `(snapshotId,name)`; the same capability name may occur in many snapshots, once per
snapshot.

```json
{
  "schemaVersion": "1.0",
  "snapshotId": "00000000-0000-4000-8000-000000000004",
  "snapshotHash": "6d3ccc88afa715385e7b04aa0056e1455ae679906354d18bc5d0113c474a6590",
  "capturedAt": "2026-09-18T08:00:00.000Z",
  "harness": "codex",
  "harnessVersion": "1.2.3",
  "installationId": "00000000-0000-4000-8000-000000000002",
  "capabilities": [
    { "name": "session_lifecycle", "state": "observed", "source": "official_hook" },
    { "name": "skill_invocation", "state": "unknown", "source": "unavailable" }
  ]
}
```

Capabilities sort uniquely by `name`. Names are `session_lifecycle`, `agent_lifecycle`, `tool_lifecycle`,
`skill_invocation`, `outcome`, and `duration`. State is `observed`, `derived`, or `unknown`; source is
`official_hook`, `official_plugin`, or `unavailable`. Hashing uses the Event algorithm. Top-level order excluding
`snapshotHash` is `schemaVersion,snapshotId,capturedAt,harness,harnessVersion,installationId,capabilities`;
item order is `name,state,source`. The complete example without `snapshotHash`, compacted, hashes to the shown
digest. Plan 02 transports snapshots through the same REST batch/application port as Events.
Producer-owned `snapshotId` is the only snapshot idempotency identity: same ID and recomputed hash is a
duplicate, same ID with a different recomputed hash is an idempotency conflict, and a changed assessment creates
a new ID/snapshot. `snapshotHash` is not globally unique and does not deduplicate equal capability content.

## One Privacy Boundary for Capture

Every harness adapter passes the bounded vendor payload byte-for-byte on stdin to
`ferret capture-hook --harness <id> --event <registered-event>`. POSIX wrappers are intentionally dumb; the
OpenCode TypeScript plugin does not allowlist, pseudonymize, canonicalize, hash, or open SQLite. Only the Python
`capture-hook` command parses one JSON object, rejects duplicate keys/content-bearing or oversized input,
allowlists fields, maps lifecycle meaning, and derives opaque HMAC IDs. Raw bytes remain in memory only and are
discarded before SQLite opens. Unsupported or ambiguous input creates no Event.

`ferret capture` is a manual/test import. It reads one already-canonical Event, maximum 16,384 bytes. It
validates existing opaque IDs and recomputes the hash; it never derives or re-pseudonymizes identifiers.

The wrapper starts Python synchronously, closes stdin, sends TERM at 900 ms, sends KILL at 1,000 ms if still
alive, reaps the process/watchdog, suppresses both streams, and exits zero for every result. Successful
`capture-hook` returns only after its SQLite transaction commits; failure, timeout, or cancellation commits
nothing.

## Configuration, Identity, Privacy, and Installation

The data home is `$HOME/.ferret` on macOS and Linux alike; WSL resolves as Linux. One literal path on every
supported platform keeps documentation, fixtures, and diagnostics free of a platform branch, and keeps the
store somewhere a developer can open with `sqlite3 ~/.ferret/ferret.sqlite3` without consulting `status`. A
`FERRET_DATA_HOME` override must be absolute, local, non-symlinked, non-network, and owned by the current user;
it is the single supported way to relocate the store.

```text
<FERRET_DATA_HOME>/
├── config.json
├── identity.json
├── identity.key
├── ferret.sqlite3
└── ferret.lock
```

The directory is created `0700` and files `0600` with symlink-safe exclusive creation. An existing object with
an unsafe owner, mode, symlink, or hard link fails with `unsafe_storage`. FERRET never weakens permissions
automatically.

`config.json` is exactly:

```json
{ "schemaVersion": "1.0", "retentionDays": 30, "maintenanceIntervalSeconds": 3600 }
```

`identity.json` contains only `schemaVersion`, `installationId`, and `createdAt`. `identity.key` is exactly 32
random bytes, never exported or stored in SQLite. A database-only backup preserves existing opaque IDs but a
restored installation without the original key cannot derive compatible new IDs.

The user install contract is:

The artifact is `$HOME/.local/share/ferret/<version>/ferret.pyz`, the launcher is a `$HOME/.local/bin/ferret`
symlink, and the manifest is `$HOME/.local/share/ferret/install.json`. Installation never edits a shell startup
file and never alters `PATH`; it reports `pathAction=add_home_local_bin` when `$HOME/.local/bin` is absent from
`PATH` so the user can add it themselves. Every installed object is created `0700`/`0600` and owned by the
current user. The manifest is strict JSON with no unknown members and this normative property order:

```json
{
  "schemaVersion": "1.0",
  "version": "0.1.0",
  "artifactPath": "/example-user-home/.local/share/ferret/0.1.0/ferret.pyz",
  "artifactSha256": "5af9c9b721982f278c9c61c8f402055711b17621f63b25f671bda1eff9db0eb3",
  "launcherPath": "/example-user-home/.local/bin/ferret",
  "installedAt": "2026-09-18T08:00:00.000Z"
}
```

Installation stages the version artifact, launcher, and manifest beside their final paths, applies/verifies
their modes and artifact digest, flushes file contents, then atomically replaces artifact, launcher, and finally
manifest. The manifest is the ownership commit point. A non-FERRET collision returns `install_collision`.
Uninstall reads the manifest, validates its closed schema and mode, verifies the current artifact digest and exact
launcher target, then removes only those owned files and the manifest; mismatch returns
`install_ownership_mismatch` and removes nothing. Because installation never edited `PATH`, uninstall has no
PATH entry to reclaim. The data home is preserved by default;
`--purge-data --yes` is the only noninteractive deletion route. Hooks/tests never purge data.

## Machine-readable Success Contracts

### `init --json`

```json
{
  "schemaVersion": 1,
  "command": "init",
  "exitCode": 0,
  "result": "created",
  "dataHome": "/example-user-home/.ferret",
  "databasePath": "/example-user-home/.ferret/ferret.sqlite3",
  "schemaNumber": 1,
  "installationId": "00000000-0000-4000-8000-000000000002",
  "retentionDays": 30,
  "permissionsState": "private"
}
```

`result` is `created` or `already_initialized`. Repeated initialization preserves the identity/key.

### `capture --json`

```json
{
  "schemaVersion": 1,
  "command": "capture",
  "exitCode": 0,
  "result": "stored",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "eventHash": "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c"
}
```

`result` is `stored` or `duplicate`; a duplicate requires the same recomputed hash. Same ID/different hash is
`idempotency_conflict`.

### `capture-hook`

This command has no public JSON response. Direct invocation and wrappers always produce empty stdout/stderr
and exit zero. Tests inspect SQLite/evidence fixtures, never process output.

### `status --json`

```json
{
  "schemaVersion": 1,
  "command": "status",
  "exitCode": 0,
  "runtime": {
    "ferretVersion": "0.1.0",
    "interpreterPath": "/example-user-home/.local/bin/python3.14",
    "interpreterVersion": "3.14.7",
    "interpreterState": "supported"
  },
  "databaseState": "healthy",
  "dataHome": "/example-user-home/.ferret",
  "databasePath": "/example-user-home/.ferret/ferret.sqlite3",
  "schemaNumber": 1,
  "integrityState": "ok",
  "permissionsState": "private",
  "eventCount": 42,
  "capabilitySnapshotCount": 3,
  "oldestCapturedAt": "2026-09-01T00:00:00.000Z",
  "nearExpiryCount": 3,
  "logicallyExpiredCount": 0,
  "databaseBytes": 65536,
  "walBytes": 0,
  "freelistBytes": 4096,
  "highWaterBytes": 65536,
  "expiredLocalTotal": 7,
  "expiredBeforeAckTotal": 0,
  "lastMaintenanceAt": "2026-09-18T07:00:00.000Z",
  "maintenanceDue": false,
  "backend": { "state": "not_available_in_this_version" },
  "adapters": [
    {
      "harness": "claude_code",
      "platformSupport": "supported",
      "configurationState": "configured",
      "latestSnapshotId": null,
      "latestSnapshotHash": null,
      "snapshotCapturedAt": null,
      "capabilities": []
    },
    {
      "harness": "codex",
      "platformSupport": "supported",
      "configurationState": "configured",
      "latestSnapshotId": "00000000-0000-4000-8000-000000000004",
      "latestSnapshotHash": "6d3ccc88afa715385e7b04aa0056e1455ae679906354d18bc5d0113c474a6590",
      "snapshotCapturedAt": "2026-09-18T08:00:00.000Z",
      "capabilities": [
        { "name": "session_lifecycle", "state": "observed", "source": "official_hook" },
        { "name": "skill_invocation", "state": "unknown", "source": "unavailable" }
      ]
    },
    {
      "harness": "opencode",
      "platformSupport": "probe_required",
      "configurationState": "not_configured",
      "latestSnapshotId": null,
      "latestSnapshotHash": null,
      "snapshotCapturedAt": null,
      "capabilities": []
    }
  ]
}
```

`runtime.interpreterState` is `supported`, `unsupported_version`, or `unresolved`. FERRET ships as a zipapp and
therefore depends on a Python interpreter the host provides. A missing or wrong interpreter makes every adapter
fail open, which loses telemetry silently, so `status` always reports the interpreter it actually resolved and
its version. `unresolved` and `unsupported_version` are reported states, never zero usage; the same rule that
forbids synthesizing a zero-invocation row forbids presenting a runtime gap as an empty result.

`databaseState` is `healthy`, `uninitialized`, or `unavailable`; `integrityState` is `ok` or `failed`;
`platformSupport` is `supported`, `probe_required`, or `unsupported_platform`; `configurationState` is
`configured`, `not_configured`, or `not_applicable`. Every supported platform reports `supported` or
`probe_required`; `unsupported_platform` is reserved for a platform this plan ships no adapter for.

### `events list --json`

```json
{
  "schemaVersion": 1,
  "command": "events.list",
  "exitCode": 0,
  "items": [],
  "nextCursor": null
}
```

Items are full canonical Event objects. Ordering is descending `(occurredAt,eventId)`. `nextCursor` is null or
base64url without padding of compact canonical JSON in this exact order:

```json
{
  "version": 1,
  "occurredAt": "2026-09-18T08:15:30.123Z",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "filterDigest": "4a6316b0c1bfc5fe97b3ee7992eef191d2b2774a0d5426dbe2f58ec3b74d8481"
}
```

The digest input is compact UTF-8 JSON ordered
`from,to,harness,workspace,eventType,agent,skill,tool,outcome,limit`; absent scalar filters are JSON null and
normalized timestamps are used. SHA-256 lowercase hex is the digest. A cursor is invalid if decode/schema
fails, the referenced row is logically expired, or any filter/limit differs. Local pagination is keyset based,
not snapshot isolated; qualifying concurrent inserts may appear by ordering.

The fixed default-filter digest input, digest, and cursor are:

```text
{"from":"2026-09-11T08:15:30.130Z","to":"2026-09-18T08:15:30.130Z","harness":null,"workspace":null,"eventType":null,"agent":null,"skill":null,"tool":null,"outcome":null,"limit":100}
4a6316b0c1bfc5fe97b3ee7992eef191d2b2774a0d5426dbe2f58ec3b74d8481
eyJ2ZXJzaW9uIjoxLCJvY2N1cnJlZEF0IjoiMjAyNi0wOS0xOFQwODoxNTozMC4xMjNaIiwiZXZlbnRJZCI6IjAwMDAwMDAwLTAwMDAtNDAwMC04MDAwLTAwMDAwMDAwMDAwMSIsImZpbHRlckRpZ2VzdCI6IjRhNjMxNmIwYzFiZmM1ZmU5N2IzZWU3OTkyZWVmMTkxZDJiMjc3NGEwZDU0MjZkYmUyZjU4ZWMzYjc0ZDg0ODEifQ
```

### `events export --format jsonl`

Writes only full canonical Event objects oldest-first by `(occurredAt,eventId)`. Empty result is zero bytes.
It never exports configuration, identity/key, maintenance state, capability snapshot, raw payload, or delivery
state. Normal completion is exit 0; because stdout is the data stream there is no wrapper success object.

### `usage --json`

```json
{
  "schemaVersion": 1,
  "command": "usage",
  "exitCode": 0,
  "groupBy": ["harness", "skill"],
  "rows": [
    {
      "dimensions": [
        { "name": "harness", "value": "claude_code" },
        { "name": "skill", "value": null }
      ],
      "eventCount": 2,
      "observedSubjectCount": 0,
      "derivedSubjectCount": 0,
      "unknownSubjectCount": 2
    }
  ],
  "interpretation": "Operational usage only; unknown subject visibility is not zero usage."
}
```

### `outcomes --json`

Plan 01 owns this standalone shape; Plan 02 must preserve it.

```json
{
  "schemaVersion": 1,
  "command": "outcomes",
  "exitCode": 0,
  "groupBy": ["harness", "tool"],
  "rows": [
    {
      "dimensions": [
        { "name": "harness", "value": "claude_code" },
        { "name": "tool", "value": "Read" }
      ],
      "eventCount": 4,
      "successCount": 2,
      "failureCount": 1,
      "cancelledCount": 0,
      "unknownOutcomeCount": 1,
      "observedOutcomeCount": 3,
      "derivedOutcomeCount": 0,
      "durationSampleCount": 2,
      "durationTotalMs": 37,
      "durationMinMs": 10,
      "durationMaxMs": 27
    }
  ],
  "interpretation": "Operational correlation only; this is not semantic quality or causal attribution."
}
```

All duration values are null when `durationSampleCount=0`. Only observed/derived non-null durations contribute.
`not_applicable` outcomes do not contribute to terminal outcome counts.

### `maintenance --json`

```json
{
  "schemaVersion": 1,
  "command": "maintenance",
  "exitCode": 0,
  "result": "completed",
  "expiredEventCount": 4,
  "expiredWorkspaceCount": 1,
  "expiredCapabilitySnapshotCount": 1,
  "expiredLocalTotal": 7,
  "expiredBeforeAckTotal": 0,
  "databaseBytesBefore": 131072,
  "databaseBytesAfter": 98304,
  "walBytesAfter": 0,
  "freelistBytesAfter": 0,
  "highWaterBytes": 131072
}
```

`--if-due` may return `result=not_due` with all expired counts zero and measured byte fields still present.
There is no scheduler. Every command first applies the logical expiry predicate. The first subsequent FERRET
operation after maintenance becomes due attempts a separate prune transaction before its main operation. It
deletes at most 100 rows and consumes at most 100 ms measured by a monotonic clock, stopping at the first limit.
Lock acquisition consumes the budget. Lock failure/timeout rolls back, skips pruning, leaves the last-maintenance
marker unchanged, and allows the main operation—including capture—to proceed within its existing deadline. A
partial committed prune also leaves the marker unchanged while expired rows remain. Explicit `maintenance`
repeats the same numeric transactions until none remain. An inactive machine can retain expired physical bytes,
but no later read can observe expired telemetry.

Each prune transaction atomically increments `expiredLocalTotal` by its deleted Event plus capability-snapshot
count; cascade-deleted items/workspaces do not count. Rollback changes neither data nor counter. A separate final
transaction advances the last-maintenance marker only after observing no expired Event/snapshot. Restart after a
partial commit therefore neither loses nor double-counts expiry.

`expiredLocalTotal` counts Plan 01 rows physically removed after expiring while never having a backend delivery
state. `expiredBeforeAckTotal` is exactly zero in Plan 01. Plan 02 begins counting only rows whose migrated
delivery state is `pending`, `leased`, or `rejected` when they expire; migration never reclassifies earlier
`expiredLocalTotal` history.

Plan 02's backend enable/reconfigure operation must use the same configuration lock as capture. Capture reads
one immutable config version while holding that lock and, when delivery is enabled, inserts the Event and its
initial `pending` state in the same SQLite transaction. Reconfigure atomically replaces the complete config and
waits for an in-flight capture to release the lock. Therefore a capture commits wholly under the old local-only
state or wholly under the new backend-enabled state; a row with mixed/missing delivery state is impossible.

### `self install --target user --json`

```json
{
  "schemaVersion": 1,
  "command": "self.install",
  "exitCode": 0,
  "result": "installed",
  "version": "0.1.0",
  "artifactPath": "/example-user-home/.local/share/ferret/0.1.0/ferret.pyz",
  "launcherPath": "/example-user-home/.local/bin/ferret",
  "manifestPath": "/example-user-home/.local/share/ferret/install.json",
  "pathAction": "none",
  "replacedOwnedVersion": null
}
```

`result` is `installed` or `already_installed`; `pathAction` is `none` or `add_home_local_bin`.
`replacedOwnedVersion` is null or a version.

### `self uninstall --json`

```json
{
  "schemaVersion": 1,
  "command": "self.uninstall",
  "exitCode": 0,
  "result": "uninstalled",
  "removedPaths": [
    "/example-user-home/.local/bin/ferret",
    "/example-user-home/.local/share/ferret/0.1.0/ferret.pyz",
    "/example-user-home/.local/share/ferret/install.json"
  ],
  "pathAction": "none",
  "dataAction": "kept"
}
```

`result` is `uninstalled` or `not_installed`; `pathAction` is always `none` because uninstall removes only
manifest-owned files and does not claim unrecorded PATH ownership. `dataAction` is `kept` unless the explicit
`--purge-data --yes` route succeeds, when it is `deleted`. `removedPaths` are sorted absolute paths and include
the owned manifest.

## Human Output Contract

Human output uses the following literal line order; angle-bracket tokens are the corresponding JSON scalar,
null renders `-`, booleans render `yes`/`no`, and every output ends LF:

```text
FERRET init: <result>
Data home: <dataHome>
Database: <databasePath>
Schema: <schemaNumber>
Installation: <installationId>
Retention days: <retentionDays>
Permissions: <permissionsState>

FERRET capture: <result>
Event: <eventId>
Hash: <eventHash>

FERRET status: <databaseState>
Version: <runtime.ferretVersion>
Interpreter: <runtime.interpreterState> <runtime.interpreterVersion> <runtime.interpreterPath>
Data home: <dataHome>
Database: <databasePath>
Schema: <schemaNumber>
Integrity: <integrityState>
Permissions: <permissionsState>
Events: <eventCount>
Capability snapshots: <capabilitySnapshotCount>
Oldest capture: <oldestCapturedAt>
Near expiry: <nearExpiryCount>
Logical expiry: <logicallyExpiredCount>
Physical bytes: database=<databaseBytes> wal=<walBytes> freelist=<freelistBytes> high-water=<highWaterBytes>
Expired local: <expiredLocalTotal>
Expired before ACK: <expiredBeforeAckTotal>
Maintenance: last=<lastMaintenanceAt> due=<maintenanceDue>
Backend: <backend.state>
Adapter claude_code: <platformSupport>/<configurationState>/<latestSnapshotId>
Adapter codex: <platformSupport>/<configurationState>/<latestSnapshotId>
Adapter opencode: <platformSupport>/<configurationState>/<latestSnapshotId>

FERRET maintenance: <result>
Expired: events=<expiredEventCount> workspaces=<expiredWorkspaceCount> snapshots=<expiredCapabilitySnapshotCount>
Counters: local=<expiredLocalTotal> before-ack=<expiredBeforeAckTotal>
Physical bytes: before=<databaseBytesBefore> after=<databaseBytesAfter> wal=<walBytesAfter> freelist=<freelistBytesAfter> high-water=<highWaterBytes>

FERRET self.install: <result>
Version: <version>
Artifact: <artifactPath>
Launcher: <launcherPath>
Manifest: <manifestPath>
PATH action: <pathAction>
Replaced version: <replacedOwnedVersion>

FERRET self.uninstall: <result>
Removed: <removedPaths joined by comma-space, or ->
PATH action: <pathAction>
Data action: <dataAction>
```

`events list` uses a tab-separated header
`occurredAt eventId harness workspaceId eventType agentName skillName toolName outcome subjectVisibility outcomeVisibility durationVisibility`
and one row per Event; an empty page prints `No rows.` to stderr and leaves stdout empty. `usage` and `outcomes` use caller-ordered dimension
names followed by their JSON row metric names, also tab-separated; empty results print `No rows.` to
stderr and leave stdout empty. Export stays
JSON Lines and has no human variant. `capture-hook` stays empty. Human failures are exactly
`FERRET error [<code>]: <safe message>` on stderr with no rejected/raw value.

## Closed Failure Contract

```json
{
  "schemaVersion": 1,
  "command": "capture",
  "exitCode": 2,
  "error": { "code": "invalid_event", "field": "toolName", "retryable": false }
}
```

`field` is a safe schema field or null. Closed codes and exits:

| Code                         | Exit | Commands                          |
| ---------------------------- | ---: | --------------------------------- |
| `invalid_arguments`          |    2 | all                               |
| `invalid_filter`             |    2 | list/export/usage/outcomes        |
| `invalid_cursor`             |    2 | list                              |
| `invalid_event`              |    2 | capture                           |
| `idempotency_conflict`       |    2 | capture                           |
| `confirmation_required`      |    2 | uninstall                         |
| `uninitialized`              |    3 | all except init/install/uninstall |
| `unsafe_storage`             |    3 | all persistent commands           |
| `storage_unavailable`        |    3 | all persistent commands           |
| `install_collision`          |    3 | install                           |
| `install_ownership_mismatch` |    3 | uninstall                         |
| `integrity_failure`          |    4 | status/read/capture/maintenance   |

Unknown internal failures map to `storage_unavailable`, never expose paths beyond the resolved data home, and
are retryable only for lock/busy/unavailable conditions. `capture-hook` remains the fail-open exception: empty
streams and exit zero for every internal result.

## Contract Proof Map

| Contract                          | Unit                             | Integration                                   | E2E                                   |
| --------------------------------- | -------------------------------- | --------------------------------------------- | ------------------------------------- |
| Grammar, JSON/text, closed errors | parser and golden serializers    | temp env/std streams                          | every built zipapp command            |
| Event fields/provenance/hash      | fixed and negative vectors       | lossless SQLite round-trip                    | canonical stdin/export                |
| Raw privacy boundary              | three mapper fixture suites      | bounded stdin/no raw persistence              | POSIX wrapper and OpenCode simulation |
| Identity/permissions/install      | resolver and mode policy         | real POSIX temp objects                       | macOS and Linux user journeys         |
| Cursor/filter/grouping            | digest and aggregation functions | indexed keyset queries                        | multipage and invalid-cursor journeys |
| Capability snapshots              | schema/composite identity        | multi-snapshot round-trip/duplicate rejection | status and adapter capture            |
| Retention/counters                | fixed-clock policy               | logical exclusion then 100-row/100-ms prune   | inactive-clock and migration fixture  |
