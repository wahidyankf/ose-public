# Finding Requirements Hard Rules

Every finding this agent posts MUST carry all of the following. A finding missing any element is not ready to post.

1. **In this PR's scope** — the finding addresses the problem the PR body states under `## Why`,
   is not excluded by a declared non-goal under `## Scope`, and respects any linked plan or issue.
   A finding whose only remedy is work this PR never set out to do is an adjacent improvement, not
   a defect here; do not raise it. A defect **this PR introduces** is always in scope, however far
   from the stated problem. When scope is absent, vague, or contradicted by the diff, raise that
   as a finding against the body rather than inferring a boundary. See
   [Scope Guard](../../../../repo-governance/development/quality/pr-review-disciplines/scope-guard.md).
1. **Legible to a junior engineer** — state the **consequence** in plain terms (what breaks, for
   whom) alongside the evidence, paraphrase any rule you cite rather than only linking it, and
   define or avoid terms of art. Critique the change, never its author (rule 7). One
   sentence of consequence, not an essay. See
   [Review as Teaching](../../../../repo-governance/development/quality/pr-review-disciplines/review-as-teaching.md).
1. **Numeric confidence score, 0-100** — how directly the evidence supports the finding.
   **Findings scoring below 80 are hard-dropped and never posted.** When in doubt, do not post rather than post a low-confidence guess.
1. **Refutation clause** — one line naming the **specific, checkable evidence that would prove this
   finding wrong**. "I am confident" is not one; "if `rg -F 'X' path/f` returns a hit, this
   finding is void" is. Write it as one of the
   [invocation shapes the fixer may execute](../../pr-review-fixer-resolution/reference/refutation-clause-execution.md),
   and one this repo's own hooks will let you
   [post](../../pr-review-fixer-resolution/reference/refutation-clause-postability.md). A clause
   outside the shapes is repaired or dropped by the coordinator, never posted as written.
   Two further rules govern the clause you write: [its outcome must follow from the finding, and
   what to do when the subject is not a tracked file](./refutation-clause-authoring.md). A finding whose author cannot name what would refute it is a suspicion, not a finding, and
   is not posted. Measured reason: across this repo's 94 findings on PRs #225/#226/#227/#232
   confidence did not predict acceptance (91.5 accepted vs 93.0 not), so the score alone leaves the
   fixer nothing independent to check.
1. **Severity** — exactly one of `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`, per the repo's
   [Criticality Levels Convention](../../../../repo-governance/development/quality/criticality-levels.md).
   See the agent file's own Discipline Charter for this discipline's severity definitions.
1. **Concrete evidence** — the exact `file:line` (or a blob URL + the pinned SHA + line range)
   the finding refers to, and, where the finding cites a repo convention, a link to that specific
   `repo-governance/` rule the change violates. Never a vague "somewhere in this file" reference.
1. **Anti-sycophantic framing** — state what is wrong plainly. Do not soften, hedge, or omit a
   real finding to seem agreeable or to keep the review short. Correctness takes priority over
   pleasantness.
