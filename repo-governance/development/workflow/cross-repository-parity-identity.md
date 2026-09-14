---
description: Keep corresponding worktree and short-lived branch identities aligned across repositories for one parity objective.
when_to_use: Use before mutating more than one repository for a declared parity objective.
---

# Cross-Repository Parity Identity

One declared parity objective uses one traceable delivery identity across its repositories.

## Rule

Before the first mutation, record an objective slug and the corresponding identities:

```markdown
### Cross-Repository Parity Identity

- Objective slug: `<objective-slug>`
- Worktree basename: `<shared-basename>`

| Repository | Corresponding short-lived branch |
| ---------- | -------------------------------- |
| `<repo-a>` | `<shared-branch-name>`           |
| `<repo-b>` | `<shared-branch-name>`           |
```

For each repository in the objective:

- When it uses a worktree, use the same basename under that repository's own `worktrees/` directory.
- When a corresponding delivery unit uses a short-lived branch, use the same branch name.
- If the intended identity is unavailable in any repository, verify whether the existing identity
  belongs to this same delivery. Reuse it only with that proof; otherwise choose one available common
  alternative for every repository before mutation.
- Never silently diverge, commandeer a foreign worktree or branch, or rename another actor's identity.
- A repository-only delivery unit and a mode with no worktree or short-lived branch do not fabricate
  missing identities. Record `not applicable` with the mode or repo-only reason.

The basename aligns identity, not absolute paths: each repository owns its own
`<repo-root>/worktrees/<shared-basename>/`. The branch mapping may contain `not applicable` for a
direct-main unit, but all corresponding short-lived branches use the same non-empty value.

Shared identity is a traceability rule, not a synchronized-merge gate. Each repository's parity PR
merges as soon as its own hardened prerequisites and merge opportunity permit; never hold a ready
PR solely to align its merge time with a sibling. Until convergence, record the unfinished
counterpart as a sibling obligation.

## Preflight and Final Assertions

Preflight passes only when every intended path and branch has been probed and the common record is
written. Finalization compares actual worktree basenames and branch names with the record and reports
every deliberate `not applicable` entry. A mismatch stops further parity mutation until reconciled.

## Enforcement Disposition

**Unenforced by decision.** Identity availability and “same delivery” ownership require cross-repo
and operational evidence that a repository-local deterministic check cannot reliably observe. The
preflight record and final assertions make the judgment auditable.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**:
  Corresponding repositories declare one shared delivery identity before mutation.
- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Preflight
  proves identity ownership and availability instead of assuming that a matching name is safe.

## Conventions Implemented/Respected

- **[Worktree Path](../../conventions/structure/worktree-path.md)**: Each repository keeps its own
  conventional worktree root while sharing the delivery basename.
- **[Worktree Specification](../../conventions/structure/plans/worktree-specification.md)**: Plans
  record the common identity, lifecycle, and justified `not applicable` entries.

## Related Documentation

- [Worktree Specification](../../conventions/structure/plans/worktree-specification.md) — plan-level
  worktree identity and lifecycle.
- [Plan Multi-Repo Parity Planning](../../workflows/plan/plan-multi-repo-parity-planning.md) — records
  and propagates parity identity into plans.
- [Rules Propagation](../../workflows/rules/rules-propagation.md) — one-repo runs that preserve the
  same identity in the sibling obligation.
- [PRs Open at Delivery Boundaries](../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules-5-to-7.md)
  — repositories merge ready parity PRs independently and record the unfinished counterpart.
