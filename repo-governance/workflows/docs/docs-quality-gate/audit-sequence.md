---
description: "The six steps of each read-only docs-quality-gate audit, the six decisions made about each document, and the ledger's admission test."
when_to_use: "Use while running the docs quality gate."
---

# Audit Sequence

1. **Freeze the snapshot:** scope, revision, and uncommitted paths. A material change other than
   propagation's repairs ends the run as `input-changed`, never restarting it.
2. **Bound the audit.** Under `change`, the documents the change touches and every document citing
   what it changed; under `all`, the whole document set
   [Docs Propagation](../docs-propagation.md#document-set) defines.
3. **Audit without editing.** Decide for each document whether:
   1. every claim is true to the implementation, per
      [Factual Validation](../../../conventions/writing/factual-validation.md), and every command
      shown was run or is marked not exercised;
   2. it still describes something the repository has; if not, it is obsolete and its resolution
      is removal;
   3. each fact has one home, a summary sits above its detail per
      [Progressive Disclosure](../../../principles/content/progressive-disclosure.md), and a page
      serves one mode per [Diátaxis](../../../conventions/structure/diataxis-framework.md);
   4. a newcomer learns from the opening what it is and why it matters, and finds the next step,
      per [README Quality](../../../conventions/writing/readme-quality.md) and
      [Content Quality](../../../conventions/writing/quality.md), judged by reading, never by a
      score;
   5. under `all`, or when setup changed, a reader with no prior context can follow the setup
      exactly as written from a clean checkout, each step marked smooth, frustrating, or blocking;
      and
   6. it agrees with its specification, which is canonical.
4. **Record a finite ledger** at the path the gate's outputs declare, per
   [Temporary Files](../../../development/infra/temporary-files.md). Each row names the document,
   the gap, the required resolution — update, move, or remove — the evidence, and a status: open,
   resolved, not applicable with evidence, or blocked. Admit only a document that is wrong,
   obsolete, unreachable, or unusable by a newcomer; wording preference is not a finding, per the
   [Minimal Sufficiency Test](../../../principles/general/simplicity-over-complexity/minimal-sufficiency-test.md).
5. **Leave machine checks to their tools.** Formatting, links, indexes, and budgets belong to
   deterministic checks, per
   [Deterministic vs AI Validation Split](../../../conventions/structure/deterministic-vs-ai-validation-split.md);
   the audit consumes their result instead of repeating them.
6. **Hand over or count a clean audit.** A clear ledger with the repository's checks passing is a
   clean audit. Otherwise the gate hands its ledger to [Docs Propagation](../docs-propagation.md),
   and the next audit follows per the gate's
   [Terminal Contract](../docs-quality-gate.md#terminal-contract). A finding only the owner can
   decide, such as a specification that disagrees with the implementation, is asked through
   [Grill Me](../../../../.agents/skills/grill-me/SKILL.md).

## Delegation

The reading in step 3 may be delegated to the repository's read-only documentation checkers —
`docs-checker`, `docs-tutorial-checker`, `docs-link-checker`, and `readme-checker` — whose reports
feed the ledger. No fixer runs inside the gate.

## Related Documents

- [Docs Quality Gate](../docs-quality-gate.md) — the gate's authorization, contract, and recorded
  decision.
