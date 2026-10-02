# Scope Guard

**The loop never widens the PR it reviews.** Scope is the problem the body states under `## Why`
**and the non-goals it declares** under `## Scope`, plus the linked plan or issue — both halves,
so the guard has something falsifiable to test against. The test: does fixing this finding serve
that problem, or add a second one, or grow the PR into something the body declared out? The second and the third are both scope creep — drop them in the reasonableness filter, and never manufacture
new scope during synthesis. A defect this PR itself introduces is always in scope, and a declared
non-goal never suppresses one. See
[Scope Guard](../../../../repo-governance/development/quality/pr-review-disciplines/scope-guard.md).
