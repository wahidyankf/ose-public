# Changelog

All notable changes to FERRET are recorded here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html), and released tags are immutable — a published release is
never rebuilt or replaced.

Entries describe what a consumer can observe: commands, flags, exit codes, error codes, configuration, and output.
They are not a commit list. For the commits behind any release, see its
[comparison on GitHub](https://github.com/wahidyankf/ose-public/releases).

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
