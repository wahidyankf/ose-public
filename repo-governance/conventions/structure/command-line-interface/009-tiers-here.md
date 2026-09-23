---
description: >-
  Records which of this repository's own command-line tools sits at which tier of the convention, and how FERRET
  harness capture reaches this repository.
when_to_use: >-
  Use when adding, reviewing, or retiring a command-line tool here, or when checking where this repository's FERRET
  capture registration lives.
---

# Tiers Here

The convention asks each adopter to record which of its own tools sits at which tier. Several command-line products are
built here, and they meet the full bar; everything that merely runs from a shell is at the floor:

| Surface                                               | Tier     | Why                                                  |
| ----------------------------------------------------- | -------- | ---------------------------------------------------- |
| `ferret-cli`, `crane-cli`, `ose-cli`, `ayokoding-cli` | Full bar | Product surfaces a person and a script call directly |
| `./hippo` and `./rhino`                               | Floor    | Wrappers; each `exec`s the tool it installs          |
| `.husky/commit-msg`, `pre-commit`, `pre-push`         | Floor    | Git invokes them and branches on what they return    |
| `scripts/*.sh` and `.github/scripts/*.sh`             | Floor    | Shipped scripts a gate, a hook, or a workflow calls  |

FERRET records coding-agent harness activity. This repository builds it and carries its own capture registration under
`.claude/hooks/`, `.codex/`, and `.opencode/plugins/`; a user-level registration steps aside here, so a session is
recorded once. Query the local record with the installed `ferret status --json`.

There is no `./ferret` here by decision, not by omission: FERRET is built in this repository, so pinning a released
copy of it would run a different build than the one under change. The same holds for the other products above.

The wrappers start the tool they install and return `125` when they refuse.

## Related Documents

- [Command-Line Interface](../command-line-interface.md) — the convention whose tiers this record applies.
