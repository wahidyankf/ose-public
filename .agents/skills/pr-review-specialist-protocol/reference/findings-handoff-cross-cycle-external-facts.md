# Findings Handoff, Cross-Cycle Behaviour, and External Fact Verification

## Findings Handoff — No Direct Posting

This specialist is a **finding producer, not a poster**. It **never** writes to the PR: no
GitHub review, no review comment, no `gh pr comment`, no `gh api` review-create call, no thread
resolution. Posting is the one monolith responsibility that is **not** inherited — it is
coordinator-exclusive.

- **Emit** structured, line-anchored findings as this agent's return value for the coordinator to
  consume, each carrying every element
  [finding-requirements-hard-rules.md](./finding-requirements-hard-rules.md) requires — that module
  owns the finding's shape, and a finding missing any element is not ready to hand off. Findings
  below confidence 80 are hard-dropped before handoff.
- **Hand off** those raw findings to `pr-review-checker`, the **sole poster of record**:
  it dedups across all nine disciplines, re-categorizes arch↔correctness ownership,
  reasonableness-filters, tool-verifies, and posts exactly **one consolidated review per cycle**
  via the GitHub Reviews API. There is never one review per specialist.
- **No PR write scope**: this agent needs only read access to the diff and repo; it performs no
  post/reply/resolve operation against the PR.
- Carry blocking status in the finding's **severity label** (`CRITICAL`/`HIGH`); the coordinator
  surfaces that blocking status in the single consolidated review. The
  `REQUEST_CHANGES`-vs-`COMMENT` posting posture and any AI-attribution footer are the
  coordinator's concern, not this agent's.

## Cross-Cycle Behaviour

Each cycle, re-review the **full PR** within this discipline's scope — not just the delta —
while deduplicating against prior findings fed to you. Re-check the fixer's newly-pushed commits
from the previous cycle for fix-induced regressions specific to this discipline (a fix that
resolves one finding can quietly introduce a new problem within this discipline's charter).

**Human-dismissal respect (sharpened rule)**. The coordinator supplies the prior cycle's
resolution/dismissal context alongside the findings it feeds you. A human's explicit "won't fix"
/ "I disagree" reply on a consolidated-review thread **resolves** that finding for future
cycles, exactly like `pr-review-fixer`'s own reasoned-reject. Do **not** re-raise a finding a
human — or the fixer — has explicitly dismissed, even if your own re-review would otherwise flag
it again. A fixer rejection carrying `effect: stale-cycle-only` is not a dismissal: independently
evaluate the claim on the fresh head and re-raise it when it still applies.

## External Fact Verification

You may call the `web-researcher` agent for external fact verification while reviewing — for
example, confirming a claimed pattern's current best-practice status or a library's documented
behaviour relevant to this discipline. Use in-context `WebFetch`/`WebSearch` only for single-shot
verification against a known authoritative URL; delegate to `web-researcher` for anything
requiring multi-page research, per the
[Web Research Delegation Convention](../../../../repo-governance/conventions/writing/web-research-delegation.md).
