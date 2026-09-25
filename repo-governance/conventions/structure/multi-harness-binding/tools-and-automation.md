---
description: The Rhino subcommands and npm scripts that generate and validate platform bindings, and the file-touch-discipline rule for committing generated mirrors alongside their source.
when_to_use: Read this when you need the exact command to generate or validate binding artifacts, or when deciding which commit a regenerated mirror file belongs in.
---

# Multi-Harness Binding: Tools and Automation

The commands that implement the [Multi-Harness Binding Convention](../multi-harness-binding.md), and
the commit-discipline rule for their output.

## Tools and Automation

- **`./rhino harness adapters generate`** — generator subcommand; emits all platform-binding
  artifacts (generated agent mirrors and Tier-2 bridge files) from the canonical `.agents/` source
  in a single invocation (AD4). Run it directly whenever binding sources change; there is no npm
  script wrapper.
- **`./rhino harness adapters validate`** — deterministic subcommand (AD7); re-derives each
  generated binding in memory, asserts byte-equality, asserts catalog completeness, and asserts that
  every file in a generated agent directory still resolves to a source agent. Exits non-zero on
  any mismatch.
  - The orphan assertion exists because byte-equality alone is blind in one direction: it compares
    the mirrors a source produces, never the mirrors a source no longer produces. Renaming an agent
    therefore left the old mirror in place, and generation does not remove it — the emitter writes
    the files it can derive and never deletes the ones it cannot.
  - A file the entry's own `ownership:` list declares `vendored` is exempt: a hand-maintained
    tooling agent living inside a generated directory has no source by design. The exemption is a
    declaration, never an inference — an undeclared file with no source is still an orphan.
- Neither command runs automatically: no hook, registry gate, or CI workflow invokes either one, so
  run `validate` yourself before committing a binding change.
- **`harness-compatibility-checker`** / **`harness-compatibility-fixer`** agents — run on
  demand or on a schedule; use web research to detect external upstream convention drift (distinct
  from the deterministic parity guard above).

**Generated bindings ship in their source's commit.** Editing one primary-binding source file
mechanically rewrites its mirror in every secondary binding directory, so a single logical change
spans several files — most of which the author never opened. Those mirrors are still the author's
changes: they belong on the touched-file ledger
([File-Touch Discipline](../../../development/practice/file-touch-discipline.md)) and in the **same
commit** as the source that produced them.

Splitting them into a follow-up "sync" commit publishes an intermediate tree in which a source and
its generated mirror disagree — a state that fails the byte-equality guard above for anyone who
checks out that revision, for reasons unrelated to their own work. The pre-commit hook regenerates
and auto-stages the mirrors precisely so this happens by default; bypassing the hook, or staging
narrowly and reconciling afterwards, defeats it.
