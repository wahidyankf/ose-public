---
description: Worked PASS and FAIL examples of the binding rules — Tier-1 with no committed file, Tier-2 generated pointers, thin pointers, and the failure modes each rule prevents.
when_to_use: Read this when you need a concrete pattern to check a specific binding decision against, or when explaining why a proposed binding file was rejected.
---

# Multi-Harness Binding: Examples

Worked pass/fail scenarios for the [Multi-Harness Binding Convention](../multi-harness-binding.md)'s
rules.

## PASS: Tier-1 binding with no committed file

A harness reads `AGENTS.md` natively. The catalog entry records `AGENTS.md (read natively)` as the
root instruction file and notes "no committed binding file required". No file is created.

## PASS: Tier-2 bridge — generated pointer

A harness does not read `AGENTS.md` natively. The CLI tooling generates a bridge file whose content
is a single sentence pointing contributors to `AGENTS.md` plus the glob that causes the harness to
load it. The parity guard re-derives this file on every commit and pull request and asserts byte-equality with the
committed version.

## PASS: Approved thin pointer for a Tier-1 harness

A Tier-1 harness also reads a supplementary instruction file when present. The team decides a thin
pointer adds discovery value. The CLI tooling generates a one-line import directive pointing to
`AGENTS.md`. The catalog entry records the justification. The parity guard covers the file.

## FAIL: Hand-maintained bridge file

A bridge file was created manually and not wired to the generator. After three `AGENTS.md` edits the
bridge is stale. The parity guard fails the commit. **Fix**: wire the bridge to the generator,
re-generate, commit.

## FAIL: Higher-precedence file with divergent content

A harness-specific file ranked above `AGENTS.md` by that harness contains additional instructions
not in `AGENTS.md`. Contributors using other harnesses never see those instructions. **Fix**: remove
the independent prose and replace the file with a pure pointer to `AGENTS.md`, or remove the file
entirely if the native `AGENTS.md` read is sufficient.

## FAIL: Committed binding directory with no catalog entry

A new binding directory appears in the repository but `docs/reference/platform-bindings.md` has no
row for it. The parity guard flags the missing catalog entry. **Fix**: add the catalog row, commit
alongside the binding files.
