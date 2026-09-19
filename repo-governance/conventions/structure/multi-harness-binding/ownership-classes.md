---
description: Rule 8 — every tracked file under a binding directory carries exactly one declared ownership class (generated, vendored, or source), with no fourth class and no unclassified residue.
when_to_use: Read this when adding a file to a binding directory, when deciding whether a third-party payload belongs in the repository, or when `harness ownership validate` names a file you did not expect.
---

# Rule 8 — Total Ownership of Binding Files

Every tracked file under a binding directory carries **exactly one declared ownership class**. There
are three classes, there is no fourth, and there is no unclassified residue.

| Class       | Meaning                                                      | Enforcement                                                             |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `generated` | Emitted from canonical source by `harness adapters generate` | must reproduce byte-for-byte; a hand edit fails validation              |
| `vendored`  | Third-party payload with no in-repo source                   | no byte guard; must survive regeneration untouched; requires a `reason` |
| `source`    | Hand-authored canonical input                                | the emitter refuses to write to it                                      |

## Why the rule exists

`.opencode/skills/` sat in a binding directory for months owned by nobody: generated from nothing,
declared vendored nowhere, excluded from the word budget by a comment. No check could tell it apart
from a file someone meant to keep, so its silence read as approval.

## How it is declared

Classes live in the `harness[].ownership` list in `repo-config.yml`, one line per path with the
reason inline. Classification is **declared, never inferred**: inferring that "a file with no source
counterpart must be stale" would delete a committed third-party payload rather than report it.

A `vendored` declaration must carry a non-empty `reason`, because an exemption whose justification is
blank is indistinguishable from an oversight someone silenced. `repo-config validate` rejects it.

## How it is enforced

`./rhino harness adapters validate` enumerates every tracked file under every declared binding
directory **from the git index** — so a local scratch file is not a failure — and fails naming any it
cannot classify. The longest matching declaration wins, so a broad tree declaration cannot mask a
narrower one beneath it.

The `harness-ownership` gate is path-gated on the binding trees, the root instruction files, and
`repo-config.yml`: its verdict genuinely depends on which paths changed.

## Partial ownership

A file may be **vendored with a delimited generated region**. `.codex/config.toml` is the case:
tooling maintains its `mcp_servers`, `features`, and `ci-monitor-subagent` tables, the emitter owns
only the region between its markers, and the byte guard covers that region alone. Half-ownership is
stated explicitly, never left implicit.

## Related

- [Platform Bindings Catalog](../../../../docs/reference/platform-bindings.md) — every path and its class
- [Rules 4-5](./rules-4-to-5.md) — the generation and parity guard this rule builds on
