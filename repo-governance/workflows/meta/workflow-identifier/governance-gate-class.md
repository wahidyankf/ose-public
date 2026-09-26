---
description: The second, permanent quality-gate class — bounded, ledger-driven, terminal-verdict gates — and the rule for choosing between it and the *-check-fix class.
when_to_use: Use when authoring a new quality gate, or when deciding which of the two gate classes an existing one belongs to.
---

# Governance Gate Class

This repository has **two permanent quality-gate classes**. Neither is deprecated, and the
`*-check-fix` majority is not migration debt awaiting conversion.

## The two classes

| Aspect        | Governance gate                                                                                           | `*-check-fix` gate                                  |
| ------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Members       | `plan-quality-gate`, `rules-quality-gate`, `docs-quality-gate` — these three only                         | Every other quality gate                            |
| Finding model | Binary admission test; no severity, no confidence                                                         | Criticality × confidence, `P0`–`P4`                 |
| Threshold     | None; a `mode` input is forbidden                                                                         | `lax`/`normal`/`strict`/`ocd`                       |
| Convergence   | Frozen ledger, one repair pass, one stabilization cycle; docs: re-audit to double-clean, default 7 audits | Iterate to double-clean, `max-iterations` default 7 |
| Result        | One terminal verdict (`PASS` / `BLOCKED_*` / `PASS_*`); docs: `pass`/`partial`/`input-changed`/`fail`     | `pass` / `partial` / `fail`                         |
| Authorization | Explicit user naming, or one enumerated caller                                                            | Invoked freely by composing workflows               |
| Report        | Frozen ledger table in `local-tmp/`                                                                       | UUID-chained, progressively streamed audit report   |

## Choosing a class

Author a **governance gate** only when all four hold:

1. its subject is a normative surface — a repository rule, or a plan that will direct execution — or
   a document set whose sole writer is a propagation workflow;
2. an edit to that subject fans out to mirrors, budgets, indexes, or parity manifests, so a
   mid-audit write would invalidate the audit's own snapshot;
3. every admitted finding must be fixed, making a severity threshold meaningless; and
4. running it is expensive enough that reflexive invocation is itself a cost.

Otherwise author a [`*-check-fix` gate](./check-fix-pattern-characteristics.md). Content, UI, CI,
specs, API, and harness gates all sit there, and belong there: their findings genuinely differ
in severity, their subjects have no fan-out, and iterating to a clean state is the point.

A governance gate never starts another gate run itself (the docs gate's caller runs each re-audit),
and never both audits and writes the same surface its sole writer owns.

## Related Documents

- [\*-check-fix Pattern — Characteristics](./check-fix-pattern-characteristics.md) — the other class.
- [Plan Quality Gate](../../plan/plan-quality-gate.md) — governance-gate member.
- [Rules Quality Gate](../../rules/rules-quality-gate.md) — governance-gate member.
- [Docs Quality Gate](../../docs/docs-quality-gate.md) — governance-gate member.
