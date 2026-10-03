---
description: "Worked examples of the nine-discipline review pipeline."
when_to_use: "Use for a concrete example of this review pipeline."
---

# Examples

## PASS: Routing a naming-format finding to governance

A specialist notices a new file does not follow the documented kebab-case naming pattern. Per
ruling (b), this is mechanical naming/structure conformance — the specialist routes it to
`pr-review-governance-checker`'s charter rather than raising it as an architecture concern, because a
documented, mechanically-checkable rule already covers it (tie-breaker step 1).

## PASS: Routing a hot-path regression to performance, not architecture

A specialist notices a change that adds an O(n²) loop inside a request handler already known to
run on a hot path. Per ruling (e), this is a concrete/likely measured regression — it routes to
`pr-review-performance-checker`, not `swe-architect` in Lens mode, because no new tradeoff judgment
is being made; the regression is a fact about the code, not a design decision.

## FAIL: A specialist raising a finding outside its `SUPPRESS` block

A specialist flags a style nit already enforced by the repo's markdownlint gate. This violates the
`SUPPRESS` block every specialist carries — style already enforced by a mechanical gate must never
be raised at all, regardless of which discipline would otherwise plausibly own it.

## FAIL: Re-raising a human-dismissed finding

A specialist re-raises, in cycle 2, a finding a human explicitly marked "won't fix" in cycle 1's
thread. This violates the human-dismissal-respect rule — the scout (`pr-review-scout`) should
have surfaced the prior dismissal before fanning out, and the specialist should not have
re-litigated a settled thread.
