---
description: Why a CONFLICTING state after green CI is not necessarily a PR defect, and why a generated-file conflict is resolved at its source.
when_to_use: Use when a PR shows a merge conflict against the target branch, especially inside a generated or marker-owned file.
---

# Resolving Merge Conflicts in Generated Files

Precondition (c) requires resolving any conflict against the target branch before merging. A
`CONFLICTING` state after an otherwise-green PR run does not mean the PR's own work is
wrong — it can be pure divergence from unrelated concurrent activity on the target branch,
resolvable by a normal rebase or merge.

When the conflicting hunk falls inside a **marker-owned or generated file** (a block regenerated
by a registry/codegen command — e.g. a harness adapter emitted by `./rhino harness adapters
generate` from the canonical `.agents/` source, or any other file a `validate`/`sync` command checks
for drift),
resolve the conflict at the **source** the generator reads from, then regenerate — never hand-resolve
directly in the generated artifact. A hand-resolution can satisfy `git` while still drifting from
what the generator would actually produce, and the repo's own drift-detection command
(`harness adapters validate` or the equivalent) exists specifically to catch that class of silent divergence. Re-run the generator,
confirm the regenerated file is byte-identical to the hand-resolution (or replaces it), then re-run
the drift check before proceeding.
