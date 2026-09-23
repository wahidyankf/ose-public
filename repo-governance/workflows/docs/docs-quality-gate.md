---
description: "Audits human-facing documents on explicit request and returns a verdict with a finite ledger of stale, obsolete, misplaced, and unreadable documents, handing every finding to Docs Propagation instead of editing."
when_to_use: "Use when someone explicitly asks for a documentation review, before a release, or to sweep a whole repository."
---

# Docs Quality Gate

**Purpose**: Judge whether documents are still true, still needed, and still readable, and hand
every finding to [Docs Propagation](./docs-propagation.md), the sole writer.

A [governance gate](../meta/workflow-identifier/governance-gate-class.md), not a `*-check-fix`
workflow: it never edits a document and never starts another gate run.

## Authorization

Someone explicitly names this gate or directs its audit, or a release process runs it with scope
`all` before publishing. A change or a propagation run never authorizes it alone; propagation
already refreshes each change.

## Goal and Termination

**Goal**: One read-only verdict with a finite ledger for the documents in scope

**Termination**: `pass`, `needs-propagation`, or `input-changed`; the gate never repairs or reruns itself

## Inputs

- **`scope`** (enum: change, all, required) — The documents one change affects, or the whole document set Docs Propagation defines
- **`change`** (string, optional) — The revision range or working-tree change; required when `scope` is `change`

## Outputs

- **`verdict`** (enum: pass, needs-propagation, input-changed) — The gate's single result
- **`ledger`** (file, pattern `local-tmp/docs/docs-quality-gate__*__ledger.md`) — The frozen finding ledger handed to propagation

## Contents

- [Audit Sequence](./docs-quality-gate/audit-sequence.md) — the six steps, the six decisions per
  document, and the ledger's admission test.

## Terminal Contract

`needs-propagation` is a handoff, not a blocked result: the caller runs
[Docs Propagation](./docs-propagation.md) with the ledger without another request. Partial outcome:
an input change ends the audit with its ledger kept. A verdict authorizes no commit or push.

## Recorded Decision: After a Finding

| Option                  | What happens                                                                          | Trade-off                                                    |
| ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| verdict only            | the caller reports propagation's result, and the gate does not run again              | one audit per request; a second audit needs a second request |
| repair to zero findings | propagation repairs, then the gate audits again while open findings strictly decrease | ends on a clean audit; costs repeated audits and a ceiling   |

This repository records **verdict only**, matching the terminal contract of
[Rules Quality Gate](../rules/rules-quality-gate.md). Either way the gate never edits a document.

## Example Usage

```text
Run docs-quality-gate with scope all.
Run docs-quality-gate with scope change for the current branch.
```

## Related Workflows

- [Docs Propagation](./docs-propagation.md) repairs every finding, removals included.
- [Software Engineering Documentation Separation Quality Gate](./docs-software-engineering-separation-quality-gate.md)
  keeps its own domain check.

## Why It Runs on Request

Judging whether a document is still true, still needed, and still readable is a reading task. Wired
into every change, it produces noise nobody reads or a pass nobody earned; propagation already
refreshes each change. See the
[Minimal Sufficiency Test](../../principles/general/simplicity-over-complexity/minimal-sufficiency-test.md).
