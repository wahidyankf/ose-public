# Learnings: Scout-First Tiering, Cycle-Number Visibility, and a Type-Soundness Discipline

Knowledge Capture per the
[Knowledge Capture Convention](../../../repo-governance/development/quality/knowledge-capture.md),
triaged across all four repo tracks' Phases 0-5 (`ose-public` PR #139, `ose-primer` PR #19,
the private sibling's PR #21, `beaver-nest` PR #3) before Phase 7 finalization.

## Learning: a stale-terminology fix scoped to only the cited occurrences leaves self-contradicting duplicates behind

- **Context**: the `eight`→`nine discipline specialists` terminology bump (from adding the ninth,
  type-soundness discipline) touched dozens of files across all four repos. In `ose-public`, two
  files (`repo-governance/workflows/README.md` and `plan-execution.md`) each had a **second**,
  un-swept `eight specialists` occurrence that self-contradicted an already-fixed occurrence in the
  same file. This exact defect was named-and-deferred as "routing only, not a finding" in cycle 1's
  own posted review and survived a second full fixer cycle before finally being caught and fixed in
  cycle 3 — three dogfood cycles to fully converge on one bulk terminology change.
- **Observation**: `pr-review-fixer`'s Fix Path had no instruction to grep the _old_ term repo-wide
  before replying `Fixed`; a fix scoped to only the finding's cited file/lines reliably misses a
  second instance the citing specialist did not happen to read in full.
- **Why it might generalize**: any future terminology or count bump (discipline count, agent count,
  file count cited in prose) is exactly this failure shape — partial fixes converge slowly across
  cycles instead of catching the whole class on the first pass.

**Routing**: `.claude/agents/pr-review-fixer.md` (non-code, small) — routed INLINE in this plan's
Phase 6 closing commit. Added an explicit instruction under the Fix Path: a stale-count/terminology
finding is fixed by a repo-wide grep for the old term, not just the cited occurrences. Regenerated
mirrors via `npm run generate:bindings && npm run validate:sync` (95/95 passed) in the same commit.

## Learning: hardened merge precondition (b) did not reconcile with the fixer's own defer-with-reason disposition

- **Context**: `ose-primer`'s cycle 3 merge-precondition check found precondition (b) ("0
  CRITICAL+HIGH outstanding") technically had 1 unresolved HIGH thread in raw GraphQL terms — but
  that thread's disposition was `defer-with-reason` (F5, `pr-review-fixer`'s own sanctioned 4-way
  triage outcome), independently re-endorsed as legitimate across all three of that repo's dogfood
  cycles rather than rubber-stamped once.
- **Observation**: `pr-review-quality-gate.md`'s hardened-merge-preconditions section stated
  precondition (b) as a flat outstanding-count check with no cross-reference to the fixer's own
  4-way triage, forcing an ad-hoc interpretive judgment call at merge time (recorded explicitly by
  the executing agent rather than silently decided) instead of following a documented rule.
- **Why it might generalize**: the fixer's `defer` path exists precisely so a HIGH finding can be
  legitimately deferred without becoming a permanent merge-blocker; without an explicit
  reconciliation, every future merge hits the same ambiguity.

**Routing**: `repo-governance/workflows/pr/pr-review-quality-gate.md` (non-code, small) — routed
INLINE in this plan's Phase 6 closing commit. Added a clarifying sentence to precondition (b): a
`defer-with-reason` disposition, recorded and re-affirmed rather than silently carried, does not
count as "outstanding" against the precondition.

## Learning: the per-repo merge-commit convention cannot be assumed even within one repo family

- **Context**: this plan's `tech-docs.md`/dispatch prompts assumed `gh pr merge --merge` (matching
  `ose-public`'s own history) as the default across all four tracks. `ose-primer`'s track checked its
  own last 5 merged PRs before merging and found the repo's actual convention is **squash**, not
  merge — despite `ose-public`, the private sibling, and `beaver-nest` all using real 2-parent merge
  commits. Both `ose-primer` (Track B) and the private sibling (Track C, whose own history was itself mixed)
  independently ran the parent-count check before merging and used the correct flag as a result.
- **Observation**: this verify-before-merging discipline was ad-hoc executor judgment, not backed by
  any written instruction in the workflow doc that actually governs the merge step.
- **Why it might generalize**: assuming one repo's convention applies to a sibling repo in the same
  governed family is exactly the trap this plan's own tracks fell into and self-corrected from twice;
  a future merge actor without that hard-won context would repeat the mistake.

**Routing**: `repo-governance/workflows/pr/pr-review-quality-gate.md` (non-code, small) — routed
INLINE in this plan's Phase 6 closing commit. Added a "Merge-command mechanics are per-repo, never
assumed" paragraph after the hardened-merge-preconditions section, naming the parent-count
verification command directly.

## Learning: a downstream track's own template-adaptation "fix" did not indicate an ose-public defect

- **Context**: the private sibling's Track C report described "catching and fixing two pre-existing bugs
  from `ose-public`'s own template" (a dangling `D5` citation and a missing `Cycle`-field wiring)
  during Phase 1-4 adaptation, before its dogfood cycles began.
- **Observation**: verified directly against `ose-public`'s merged `origin/main` — the `D5` reference
  in `pr-review-synthesis-maker.md` resolves to a real, intact maintainer-decision citation, and the
  `**Cycle**: N of {total}` field is present and correctly wired. No defect exists in `ose-public`'s
  actual merged state; Track C's fixes were most likely against its own in-progress local copy during
  adaptation, not an inherited defect.
- **Litmus**: fails — the described issue does not reproduce against the actual durable artifact
  (`ose-public`'s `origin/main`), so no home would catch anything by routing this.

**Routing**: discard — not generalizable; verified non-issue, no gap found in `ose-public`.

## Learning: a fixer-introduced instruction-size-budget regression was caught by the existing CI gate, not a new mechanism

- **Context**: `beaver-nest`'s cycle 3 specialists caught that a cycle-2 fixer commit had
  inadvertently pushed `AGENTS.md` to within 338 bytes of its hard-fail budget by naming the new
  scout agent in prose instead of the committed single-word terminology swap (violating this plan's
  own `DD-6` decision).
- **Observation**: the regression was caught and reverted within the same dogfood process — by the
  next cycle's fresh specialist pass plus the CI instruction-size-budget gate, both of which already
  exist and worked exactly as designed.
- **Litmus**: fails — the system already caught this automatically, via existing durable surfaces
  (the CI gate + the next fresh dogfood cycle). Nothing further would change behavior by routing it.

**Routing**: discard — not generalizable; existing gates already cover this, no gap found.

## Learning: no scout tier-misclassification or trivial-tier handoff surprise occurred

- **Context**: `delivery.md`'s Phase 6 candidate-learnings list specifically flagged watching for
  scout misclassifying a tier or the trivial-tier handoff behaving unexpectedly.
- **Observation**: across all four repos' dogfood cycles (11 total cycles, all fresh scout passes),
  every cycle was classified `full` tier with 7-of-9 specialists fanned out (DD-10 skipping
  `types-maker`/`integrity-maker` as designed); no misclassification or trivial-tier edge case
  surfaced in any track's report.
- **Litmus**: fails — nothing was observed to route; this entry exists to record that the candidate
  was actively watched for and not found, per this convention's explicit-over-silent principle.

**Routing**: discard — watched for, not observed; no action needed.

## Summary

Two governance-doc clarifications and one fixer-instruction strengthening were routed inline and
landed in this plan's own Phase 6 closing commit on `ose-public`'s local `main`:
`.claude/agents/pr-review-fixer.md`, `repo-governance/workflows/pr/pr-review-quality-gate.md` (two
edits). Zero code-homed learnings; zero `plans/backlog/` follow-ups required. Both hard safety gates
(secret/sensitivity, repo-relevance) were applied to every surviving entry — none contained sensitive
material, and none was infra-private content misrouted to a public repo.
