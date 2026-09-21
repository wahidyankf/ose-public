# FERRET — Overview

Audience: product managers, engineers, and anyone deciding whether to trust FERRET on their machine.

## What it is

Coding-agent harnesses — Claude Code, Codex, and OpenCode today — run agents, skills, and tools on a developer's
behalf, and the developer has no durable, honest view of which of those ran or how they ended. FERRET records that
view. It keeps one private local store of lifecycle events, answers questions about them from the command line, and
never sends anything anywhere.

## The privacy promise

FERRET stores **metadata only**. It never stores prompts, responses, tool arguments, transcripts, file contents,
paths, or environment values. A raw hook payload is reduced to a closed set of named fields at the moment it is read
and the rest is discarded before anything reaches disk; a field that could carry content is rejected rather than
sanitized. Workspaces and sessions appear only as opaque identifiers derived with a per-installation secret that never
leaves the data home.

## What a person can do

| Outcome                                            | How                                                  |
| -------------------------------------------------- | ---------------------------------------------------- |
| Start recording, once, on one machine              | `ferret init`, then wire a harness to `capture-hook` |
| See which agents, skills, and tools ran            | `ferret usage --group-by ...`                        |
| See how they ended, without false certainty        | `ferret outcomes --group-by ...`                     |
| Inspect or export the raw retained events          | `ferret events list`, `ferret events export`         |
| Check that recording is healthy and space is bound | `ferret status`, `ferret maintenance`                |
| Remove FERRET without breaking a harness           | `ferret self uninstall`                              |

## Honest by construction

- **Unknown stays unknown.** When a harness does not expose a subject, an outcome, or a duration, FERRET records that
  it is unknown and reports it that way. It never substitutes zero, success, or a guess.
- **A harness is never slowed or broken.** Every harness adapter fails open: a missing tool, a locked database, or a
  slow start ends quietly within a fixed deadline and the harness carries on.
- **Old telemetry is gone.** Anything older than 30 days is never returned and is physically removed, so the store
  stays small.
- **No network, no account.** Every command works with no backend present.

## Where to go next

The [FERRET CLI](./cli/README.md) corpus holds the architecture and the behaviours that make these promises testable.
