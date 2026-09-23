# Changelog

All notable changes to FERRET are recorded here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html), and released tags are immutable — a published release is
never rebuilt or replaced.

Entries describe what a consumer can observe: commands, flags, exit codes, error codes, configuration, and output.
They are not a commit list. For the commits behind any release, see its
[comparison on GitHub](https://github.com/wahidyankf/ose-public/releases).

## [v0.3.1] — 2026-09-23

A tool call whose result is an image is now recorded when it completes. The version moves in the patch position:
nothing a caller relies on changed, and FERRET now accepts input it used to refuse.

### Fixed

- `ferret capture-hook` records the completion of a tool that returns an image. A hook payload carries the whole tool
  result, and an image arrives as base64 inside it: every Codex `view_image` completion runs to 0.4-1.4 MB, so the
  256 KiB raw limit refused each one as `ferret.event.invalid` and only its `tool.started` event was ever stored. The
  raw limit is now 64 MiB, which bounds one call's memory and time rather than the size of a result, and the image is
  still discarded with the rest of the payload: only the allowlisted metadata is kept. `capture-hook --help` states
  the new limit, and the OpenCode plugin forwards a document up to the same size instead of dropping one over 256 KiB.

## [v0.3.0] — 2026-09-23

FERRET's diagnostics now take the form the coding standards for command-line programs fix, and an interrupt ends the
process without a traceback. The version moves in the minor position because the text of every diagnostic changed, and
in `0.x` that is where a breaking change goes.

### Changed — breaking

- A diagnostic is `ferret: [<code>] <message>`, not `FERRET error [<code>]: <message>`. The established form is
  `program: message`, and the tool's name comes first so a line lifted out of a log, a hook, or a wrapped invocation is
  attributable without knowing what ran. A caller matching the old prefix must be updated; a caller reading
  `error.code` from the machine-readable body is unaffected, and that body did not change.
- Advice has moved out of the message and onto a following line of its own. `ferret.args.invalid` reads
  `unrecognized or incomplete arguments`, followed by `ferret: try 'ferret --help' for usage`; `ferret.storage.uninitialized`
  reads `FERRET is not initialized`, followed by `ferret: try 'ferret init'`. A diagnostic states what is wrong; what to
  do about it is separate, so a caller matching on the message is never matching on a suggestion. `error.message` in the
  machine-readable body now carries the diagnosis alone, without the advice.

### Fixed

- An interrupt during a blocking read no longer prints a `KeyboardInterrupt` traceback from the zipapp. The entry point
  restores the default disposition and re-raises the signal, so the process dies of `SIGINT` as it always reported it
  did — `128+2`, with nothing on stderr.

## [v0.2.0] — 2026-09-22

FERRET now reports from one closed status vocabulary and one closed, namespaced error-code vocabulary, and stores its
data where the XDG Base Directory Specification says it belongs. The version moves in the minor position because
FERRET is in `0.x`, where that is where a breaking change goes.

### Changed — breaking

- The exit vocabulary is `0`, `1`, `2`, `126`, and `128+N`, and nothing else. `3` (an unusable environment) and `4` (a
  failed integrity check) are gone: both are now `2`, and the precise reason is the `error.code` in the body, which is
  where a caller should have been reading it. Nothing anywhere was found to branch on `3` or `4`.
- `1` now means _the command ran and a query matched nothing_. `events list`, `events export`, `usage`, and `outcomes`
  returned `0` for an empty answer, so a caller could not tell an empty result from a satisfied one. A script that
  treated any non-zero status as a failure now sees an empty query as one, and should test for `1` explicitly.
- Error codes are namespaced `ferret.area.reason` — `ferret.args.invalid` rather than `invalid_arguments`,
  `ferret.storage.uninitialized` rather than `uninitialized`, and so on for all thirteen. A caller matching the old
  strings must be updated.
- The data home is `$XDG_DATA_HOME/ferret`, and `$HOME/.local/share/ferret` when that variable is unset or empty;
  `FERRET_DATA_HOME` still relocates it outright. An existing `$HOME/.ferret` is moved into the new location once, on
  the first run that finds it, so an upgrade keeps its history without any action.

### Added

- `error.message`, a one-line human sentence, sits beside `error.code` in every machine-readable failure body. A
  caller that cannot interpret the code now has something to show a person.
- `help` is a command as well as a flag: `ferret help`, `ferret help status`, and `ferret help events list` answer the
  same text as `--help`. FERRET has a subcommand tree, and a caller who has just met one tries the word first.
- `ferret --help` publishes the exit statuses FERRET returns, so the vocabulary is discoverable from the tool rather
  than only from this repository.
- `ferret capture-hook` records the failures it swallows. It is still silent and still exits `0` whatever happens —
  that is what a fail-open harness callback is for — but each loss is now written to `hook-failures.log` in the data
  home, and `ferret status` reports `hookFailureCount` and `lastHookFailureAt`. A maintainer can learn the callback is
  losing events instead of inferring it from telemetry that stopped arriving.
- `126` for an interpreter that was found and could not be started, in place of an `OSError` traceback out of the
  relaunch the version guard performs.

### Fixed

- `ferret capture-hook` no longer speaks on a usage mistake. A missing or misspelled option was rejected by argument
  parsing before the fail-open handler was reached, so the one command that must never write to a conversation exited
  `2` with a diagnostic on stderr. The failure is now silent and recorded.
- An uncaught exception anywhere is reported as `2` with one value-free line, from both the module entry point and the
  zipapp's, rather than as a traceback — or, after the `1` above, as an answer of _nothing found_.
- A data home whose parent does not exist yet is created rather than refused, which `$HOME/.local/share` needs on a
  host that has never held one.

## [v0.1.1] and earlier

Not recorded here; this file begins at `v0.2.0`.
