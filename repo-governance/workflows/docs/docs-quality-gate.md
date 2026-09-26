---
description: "Audits human-facing documents on explicit request for stale, obsolete, misplaced, and unreadable documents, handing every finding to Docs Propagation and auditing again until two consecutive audits are clean or the ceiling is reached."
when_to_use: "Use when someone explicitly asks for a documentation review, before a release, or to sweep a whole repository."
---

# Docs Quality Gate

**Purpose**: Judge whether documents are still true, still needed, and still readable, and hand
every finding to [Docs Propagation](./docs-propagation.md), the sole writer.

A [governance gate](../meta/workflow-identifier/governance-gate-class.md), not a `*-check-fix`
workflow: it never edits a document and never starts another gate run itself; its caller runs
propagation and each re-audit.

## Authorization

Someone explicitly names this gate or directs its audit, or a release process runs it with scope
`all` before publishing. A change or a propagation run never authorizes it alone; propagation
already refreshes each change.

## Goal and Termination

**Goal**: Two consecutive clean read-only audits of the documents in scope, every repair made by Docs Propagation

**Termination**: `pass`, `partial`, `input-changed`, or `fail`, per the [Terminal Contract](#terminal-contract); the gate never repairs or reruns itself

## Inputs

- **`scope`** (enum: change, all, required) — The documents one change affects, or the whole document set Docs Propagation defines
- **`change`** (string, optional) — The revision range or working-tree change; required when `scope` is `change`
- **`max-iterations`** (number, optional, default `7`) — The ceiling on audits, the same default the `*-check-fix` gates use

## Outputs

- **`final-status`** (enum: pass, partial, input-changed, fail) — Terminal state of the run
- **`audits-completed`** (number) — Audits run, the confirming clean audit included
- **`ledger`** (file, pattern `local-tmp/docs/docs-quality-gate__*__ledger.md`) — Each audit's frozen finding ledger handed to propagation, and the owner of every finding left at the end

## Contents

- [Audit Sequence](./docs-quality-gate/audit-sequence.md) — the six steps of each audit, the six
  decisions per document, and the ledger's admission test.

## Terminal Contract

An audit that admits a finding hands its ledger to [Docs Propagation](./docs-propagation.md), the
sole writer. The handoff is not a blocked result: without another request, the caller runs
propagation and then the next audit, with the same scope and a fresh snapshot.

- **`pass`**: two consecutive clean audits.
- **`partial`**: the loop continues only while open findings strictly decrease. When they stop
  decreasing, or after `max-iterations` audits, the run ends, and every remaining finding gets a
  durable owner: fixed, filed as an idea or backlog item, or asked through
  [Grill Me](../../../.agents/skills/grill-me/SKILL.md).
- **`input-changed`**: a material change other than propagation's repairs ends the run with its
  ledger kept.
- **`fail`**: an audit or propagation that cannot run.

A result authorizes no commit or push.

## Recorded Decision: After a Finding

| Option                  | What happens                                                                          | Trade-off                                                    |
| ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| verdict only            | the caller reports propagation's result, and the gate does not run again              | one audit per request; a second audit needs a second request |
| repair to zero findings | propagation repairs, then the gate audits again while open findings strictly decrease | ends on a clean audit; costs repeated audits and a ceiling   |

This repository records **repair to zero findings**, bounded by `max-iterations`.
[Rules Quality Gate](../rules/rules-quality-gate.md) keeps its own terminal contract. Either way the
gate never edits a document.

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
