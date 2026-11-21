---
description: >-
  Indexes the test and gate contract copied from the shared catalog and records how each of its seven modules applies
  to this repository.
when_to_use: >-
  Use when checking which test and gate contract module governs a rule here, or whether a module is adopted, adapted, or
  not applicable.
---

# Quality Checks

Checks are rules a repository runs or verifies mechanically: which gates run on each surface, which test levels exist,
and how coverage is read. This directory holds the test and gate contract, copied from the shared catalog at one pinned
commit.

## Documents

- [Test and Gate Contract](./test-and-gate-contract.md) — the entrypoint and the index of rules C1 to C24. Use when a
  rule for a surface, target, or coverage gate is needed.
- [Test and Gate Contract Modules](./test-and-gate-contract/README.md) — the seven ordered modules that hold each rule in
  full. Use when a module's complete statement is needed.

## Adoption Status

Each module is adopted, adapted, or not applicable. Adopted means copied with its links adapted only. Adapted means
copied with a recorded wording or structural difference. Not applicable means not adopted, with the reason. Every module
is adopted or adapted; none is not applicable.

| Module                      | Status  | Reason                                                                         |
| --------------------------- | ------- | ------------------------------------------------------------------------------ |
| 001 Registry and Dispatch   | adopted | `repo-config.yml` declares the gates, and `rhino gate run` dispatches them     |
| 002 Surface Placement       | adopted | pre-commit, commit-msg, pre-push, and pull-request surfaces match the registry |
| 003 Pull-Request Scope      | adapted | one wording difference in the scope table, recorded in the module              |
| 004 Test Levels and Targets | adopted | targets follow the Nx target standards, and the linked lint standard exists    |
| 005 Behaviour Corpus        | adopted | text only; corpus bindings (C13) are enforced by a later change                |
| 006 Coverage Floor          | adopted | text only; the 99% unit floor (C15) is enforced by a later change              |
| 007 Conformance Record      | adopted | links resolve locally; the required check (C22) is applied by a later change   |

Local rules that contradicted the contract were amended in place to match it.
