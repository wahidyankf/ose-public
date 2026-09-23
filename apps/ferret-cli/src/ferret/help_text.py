"""Help text for every command. It is a tested surface, so each block is a literal."""

ROOT_USAGE = "usage: ferret <command> [options]\n"

ROOT_HELP = """\
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
  help                show this help and exit

options:
  -h, --help          show this help and exit
  -V, --version       show the version and exit
  --output <text|json>
                      render the result as text or JSON; defaults to text
  --json              shorthand for --output json

exit codes:
  0                   the command ran and the answer was affirmative
  1                   the command ran and a query matched nothing
  2                   FERRET could not run: the invocation, the environment,
                      or the stored data was unusable; see error.code
  126                 an interpreter was found and could not be started
  128+N               ended by signal N; 130 is an interrupt, 141 a closed pipe

Telemetry older than 30 days is never returned. Scripts should use --json.
Run 'ferret <command> --help' for a command's options.
"""

COMMAND_HELP: dict[tuple[str, ...], str] = {
    ("events",): """\
usage: ferret events <list|export> [options]

Read retained events.

commands:
  list    list retained events, newest first
  export  write retained events to stdout as JSON Lines

options:
  -h, --help  show this help and exit

Run 'ferret events <command> --help' for a command's options.
""",
    ("self",): """\
usage: ferret self <install|uninstall> [options]

Install or remove the FERRET artifact for the current user.

commands:
  install    install the artifact for the current user
  uninstall  remove the artifact; data is kept unless purged

options:
  -h, --help  show this help and exit

Run 'ferret self <command> --help' for a command's options.
""",
    ("version",): """\
usage: ferret version

Print the version and exit.

options:
  -h, --help  show this help and exit
""",
    ("init",): """\
usage: ferret init [--json]

Create the private data home, installation identity, and current schema. Running it
again changes nothing: an initialized store is reported as already_initialized.

options:
  -h, --help           show this help and exit
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("capture",): """\
usage: ferret capture [--json]

Store one canonical event read from stdin: a single UTF-8 JSON object of at most 16 KiB.

options:
  -h, --help           show this help and exit
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("capture-hook",): """\
usage: ferret capture-hook --harness <harness-slug> --event <registered-event>

Map one raw harness JSON object read from stdin (at most 64 MiB) to a metadata-only
event and store it. Always fails open: it writes nothing to stdout or stderr and exits 0
whatever happens, so it can never block a harness. It has no --output or --json form.

options:
  -h, --help                show this help and exit
  --harness <harness-slug>  harness that produced the payload
  --event <registered-event>
                            registered event type of the payload
""",
    ("status",): """\
usage: ferret status [--json]

Report paths, runtime, storage, health, and adapters.

options:
  -h, --help           show this help and exit
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("events", "list"): """\
usage: ferret events list [filters] [--limit 1..200] [--cursor <opaque>] [--json]

List retained events, newest first, one page at a time. Telemetry older than 30 days
is never returned.

options:
  -h, --help           show this help and exit
  --limit <1..200>     page size; defaults to 100
  --cursor <opaque>    resume after the nextCursor of the previous --json page; repeat the same
                       filters and limit, and use --all-time or --from/--to so the window holds
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
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("events", "export"): """\
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
""",
    ("usage",): """\
usage: ferret usage [filters] --group-by <dimension>[,<dimension>...] [--json]

Count observed activity by one to three unique dimensions. Counts never substitute zero
for unknown data.

options:
  -h, --help           show this help and exit
  --group-by <dimension>[,<dimension>...]
                       harness, event_type, agent, skill, tool, subject_visibility
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
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("outcomes",): """\
usage: ferret outcomes [filters] --group-by <dimension>[,<dimension>...] [--json]

Summarise operational outcomes by one to three unique dimensions. Outcomes that could
not be observed are reported as unknown, never as success. The numbers are an operational
proxy, not a semantic quality or causal evaluation.

options:
  -h, --help           show this help and exit
  --group-by <dimension>[,<dimension>...]
                       harness, event_type, agent, skill, tool, outcome, outcome_visibility
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
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("maintenance",): """\
usage: ferret maintenance [--if-due] [--json]

Apply retention, checkpoint the write-ahead log when it is safe, and measure space.

options:
  -h, --help           show this help and exit
  --if-due             do nothing unless maintenance is due
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("self", "install"): """\
usage: ferret self install --target user [--json]

Install the artifact and its launcher for the current user. Shell startup files and
PATH are never edited.

options:
  -h, --help           show this help and exit
  --target user        installation target; user is the only accepted value
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
    ("self", "uninstall"): """\
usage: ferret self uninstall [--purge-data] [--yes] [--json]

Remove the installed artifact, launcher, and manifest. The data home is kept unless
--purge-data --yes is given.

options:
  -h, --help           show this help and exit
  --purge-data         also delete the data home; requires --yes
  --yes                confirm deletion without prompting
  --output <text|json>
                       render the result as text or JSON; defaults to text
  --json               shorthand for --output json
""",
}
