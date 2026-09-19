# `md mermaid validate` passes syntactically broken diagrams

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: `./rhino md mermaid validate` is wired into pre-commit, pre-push and CI and is
routinely cited as the Mermaid-correctness gate — but it does **not** parse diagram syntax, so a
diagram that no renderer can draw sails through it clean.

> Found 2026-07-22 by a quality-gate agent that deliberately corrupted a diagram to test its own
> tooling, and independently reproduced before filing.

## Problem / context

A file containing this block:

```text
flowchart TD
    A[Good node] --> B[Also good]
    C[[[malformed shape --> D
    E{{unclosed --> F
```

produces `Found 0 violation(s) and 0 warning(s) in 1 file(s) (1 block(s) scanned)`. The block **was**
scanned — the counter says so — and passed. A control run against a known-good diagram returns the
same verdict, so the two are indistinguishable by this tool.

The validator does real work on other axes: it enforces node-label length caps (roughly 30 characters
per `<br/>` segment, bounded segment count) and colour-blind-friendly palette rules, and it has caught
genuine problems repeatedly — several plans this week fixed label-length violations it reported. The
defect is not that it does nothing. **It is that its name and its position in the toolchain promise
syntax validation it never performs**, and it is cited in plan documents as the check that Mermaid
is correct.

This is the vacuous-gate pattern: a check whose green result is read as evidence of a property it
does not test. It is worse than no check, because no check would prompt someone to look.

## Why now

Three independent forces make this the moment:

- Mermaid diagrams are **mandated** by convention across `docs/`, `plans/` and `repo-governance/`, so
  the exposed surface is the whole repository, not one app.
- The repo is in the middle of a broad sweep against exactly this failure class — acceptance clauses
  that pass without measuring what they claim. Several were fixed this week in plan documents; this
  one is in the tooling those documents call.
- A remediation backlog already exists (`ayokoding-mermaid-diagram-remediation`, 636 violations
  exposed when a `detect_kind` fix landed). If that work is validated with this tool, a syntactically
  broken diagram can be "remediated" to green.

## Prior art / precedents

- **The Mermaid parser itself** — `mermaid@11.15.0` is already a repo dependency and can parse a
  diagram string directly, which is how the finding was independently confirmed.
  [mermaid.js.org](https://mermaid.js.org/)
- **`@mermaid-js/mermaid-cli`** — the maintained headless CLI whose whole purpose is rendering/parsing
  diagrams outside a browser. [github.com/mermaid-js/mermaid-cli](https://github.com/mermaid-js/mermaid-cli)
- **The repo's own `md links validate`** — the counterexample worth copying: it actually resolves each
  target and fails on a dead one, which is why a moved corpus is a hard push failure today.
- **`ayokoding-mermaid-diagram-remediation`** ([idea brief](../q2-not-urgent-important/ayokoding-mermaid-diagram-remediation.md))
  — the downstream consumer that would be validated by this gate.
- **`doc-command-existence-validation`** ([idea brief](../q2-not-urgent-important/doc-command-existence-validation.md)) — the
  same shape of gap (a documented thing asserted but never verified), already captured.

## Proposed direction (sketch)

- Add a **parse** stage to the existing validator, distinct from its current style/accessibility rules,
  so the two failure classes stay separately reportable.
- Use the real parser rather than reimplementing one — `mermaid` is already a dependency, so a
  syntax check need not invent grammar knowledge that will drift from upstream.
- Keep the current label-length and palette rules exactly as they are; they work and are relied upon.
- Decide the failure severity deliberately: an unparseable diagram is arguably CRITICAL, since it
  renders as an error box in GitHub.

## Rough scope & non-goals

In scope: the parse stage, its wiring into the existing hook and CI invocations, and a corpus sweep to
find diagrams already broken and currently passing (count unknown until the check exists — do not
guess it).

Out of scope: changing the current style rules; re-litigating the label-length caps; the
`ayokoding-mermaid-diagram-remediation` backlog itself, which is separate work that this would make
verifiable. Also out of scope: rendering diagrams to images in CI — parse-only is the cheap 90%.

## Risks & open questions

- **How many existing diagrams fail a real parse?** Unknown, and deliberately not estimated here. If
  the number is large, this becomes a remediation programme rather than a tooling fix, and it should
  probably merge with the existing mermaid remediation brief instead of standing alone. (open)
- Invoking the real parser means a Node dependency inside a Rust CLI's validation path; whether that
  belongs in `rhino-cli` or in a separate target is a genuine design question, given `rhino-cli` must
  stay byte-identical across three repos. (open)
- Any diagram currently passing that the parser rejects will fail the pre-push hook the moment this
  lands, so sequencing matters — measure first, then gate. (open)
- Whether other `md * validate` subcommands have the same name-versus-behaviour gap is unexamined, and
  the same probe technique would answer it cheaply. (open)

## What success looks like + promotion signal

Success: a deliberately corrupted diagram fails the gate, a well-formed one passes, and no plan can
cite Mermaid validation for a property the tool does not test.

Promotion signal: ripe once someone has run a real parse across the corpus and knows the failure
count — that single number decides whether this is a small tooling fix or a remediation programme,
and it is cheap to obtain now that the gap is known.
