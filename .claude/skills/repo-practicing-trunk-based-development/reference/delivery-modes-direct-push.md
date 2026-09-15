# Trunk-Based Development — Delivery Modes: Direct Push

## When a Direct-Push Mode Is Appropriate

`worktree-to-origin-main` and `main-to-origin-main` push straight to `main` with no PR. `main`
is branch-protected against direct pushes, including for admins, in `ose-public` — neither mode
has an executable path there, regardless of how small or well-understood the change is.
`worktree-to-origin-main` is also unavailable in the private sibling. Only explicitly declared
`main-to-origin-main` remains, and only for exactly two categories:

1. **Stateful IaC** — Terraform, Ansible, or equivalent state-changing infrastructure work needing
   the primary checkout's real secrets or local state.
2. **CI-IaC self-validation circularity** — work changing the repository's own pipeline, runner, or
   toolchain provisioning where PR self-validation would be circular.

Within either eligible private-sibling category, select `main-to-origin-main` only for changes that
are also small, well-understood, and safe to integrate immediately:

- **Small bug fixes** where the failure and the fix are both obvious
- **Small, safe refactors** with existing test coverage
- **Documentation** and **configuration** touch-ups
- **Dependency updates** that pass the full gate locally

**Key principle**: direct push trades review for speed, and this topology offers it only through
the private sibling's `main-to-origin-main` in the two categories above. Choose it only when the change
is small enough that the trade is obviously worth it — and declare the mode explicitly in the plan,
since it is a deliberate departure from the `worktree-to-pr` default rather than the assumed path.
