# ferret-cli

FERRET keeps a private, local record of what coding-agent harnesses do: which agents, skills, and tools ran, and how
they ended. It stores metadata only — never prompts, responses, tool arguments, transcripts, or environment values —
and nothing leaves the machine. `ferret` is a standard-library-only Python 3.14 command-line tool shipped as one
zipapp.

## Start with the command help

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ferret-cli:run -- --help
```

Run `ferret <command> --help`, or `ferret help <command>`, for one command. The commands are `init`, `capture`,
`capture-hook`, `status`, `events list`, `events export`, `usage`, `outcomes`, `maintenance`, `self install`,
`self uninstall`, `help`, and `version`. Commands with a machine form accept `--json` (shorthand for
`--output json`); scripts should always use it.

Every exit status FERRET returns is one of these, and `ferret --help` publishes the same list:

| Status  | Meaning                                                                                |
| ------- | -------------------------------------------------------------------------------------- |
| `0`     | the command ran and the answer was affirmative                                         |
| `1`     | the command ran and a query matched nothing                                            |
| `2`     | FERRET could not run: the invocation, the environment, or the stored data was unusable |
| `126`   | an interpreter was found and could not be started                                      |
| `128+N` | ended by signal N; `130` is an interrupt and `141` a closed pipe                       |

A failure names its precise reason in the machine-readable body's `error.code`, a namespaced `ferret.area.reason`
value, alongside an `error.message` for a person. Requested help and version go to stdout with exit `0`; a usage
mistake goes to stderr with exit `2` and leaves stdout empty.

## Use it

```bash
ferret init                        # create the private data home and store, once
ferret self install --target user  # copy the artifact under ~/.local/share/ferret and link ~/.local/bin/ferret
ferret status --json               # is recording healthy, and how much space does it use
ferret usage --group-by skill --json
```

The harness registrations in this repository forward every hook payload to `ferret capture-hook`, which reduces it to
a closed set of metadata fields, writes nothing to stdout or stderr, and always exits 0 so a harness is never
disturbed. A payload carries the whole tool result, so an image a tool returns arrives as megabytes of base64; FERRET
reads up to 64 MiB and keeps none of it. Only a payload over 64 MiB is refused, and that one call loses its completion
event. What each harness can and cannot report is in
[Platform Bindings](../../docs/reference/platform-bindings.md#ferret-lifecycle-registrations).

## Install a published release

Every `ferret-cli/vX.Y.Z` tag publishes one platform-independent zipapp and its digest.

```bash
BASE=https://github.com/wahidyankf/ose-public/releases/download/ferret-cli/v0.3.2
curl -fLO "$BASE/ferret-cli_v0.3.2.pyz" && curl -fLO "$BASE/checksums.txt"
shasum -a 256 -c checksums.txt
python3 ferret-cli_v0.3.2.pyz self install --target user
```

Verify the digest before running it.

FERRET needs Python 3.14 or newer, and most hosts still answer `python3` with something older. You do not have to
find the right one: the artifact looks for a `python3.14` or newer on `PATH` and in the usual install locations,
and restarts itself there. `self install` then pins whichever interpreter it ended up on into
`~/.local/bin/ferret`, so later runs and every harness hook start on it directly with no second interpreter.

If no suitable interpreter can be found, FERRET writes one line to standard error and exits `2` rather than a
traceback; an interpreter that is found but cannot be started is `126`. Set `FERRET_PYTHON` to an absolute path and
it uses that one outright.

## Where the data lives, and how long

The data home is `$XDG_DATA_HOME/ferret`, and `$HOME/.local/share/ferret` when that variable is unset or empty;
`FERRET_DATA_HOME` relocates it outright (an absolute, normalized path on a local disk). An earlier `$HOME/.ferret`
from a release before `v0.2.0` is moved into the new location once, on the first run that finds it. The data home
holds the installation key, identity, config, and `ferret.sqlite3`, all private to the user.

- Anything older than 30 days is never returned by any command. The next operation after maintenance becomes due
  deletes at most 100 expired rows within 100 monotonic milliseconds and skips the attempt when the write lock is
  held, so it can never delay a harness. `ferret maintenance` removes every expired row, folds the log into the
  database, and rewrites the file only when it is over 16 MiB with at least 25% free.
- A stored event weighs about 0.9 KiB (919.5 bytes measured at 100,000 events), which is roughly 130 MiB for a
  30-day store at 5,000 events a day.
- `events list`, `events export`, `usage`, and `outcomes` read the last seven days unless given `--all-time` or
  `--from`/`--to`. A page cursor is bound to its filters, limit, and window, and the default window ends at each
  call's own clock, so paging across calls needs `--all-time` or explicit bounds.

## Contributing

Local prerequisites, the build and verify commands, the code map, BDD and testing, and the manual evidence helpers
are in [CONTRIBUTING.md](CONTRIBUTING.md).
