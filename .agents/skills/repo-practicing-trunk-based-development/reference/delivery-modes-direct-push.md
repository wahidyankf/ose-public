# Trunk-Based Development — Delivery Modes: Direct Push

## When a Direct-Push Mode Is Appropriate

`worktree-to-origin-main` and `main-to-origin-main` push straight to `main` with no PR. `main`
is branch-protected against direct pushes, including for admins, in `ose-public` — neither mode
has an executable path there, regardless of how small or well-understood the change is. The answer
here is therefore never: every change goes through a `worktree-to-pr` branch, including small bug
fixes, small safe refactors, documentation and configuration touch-ups, and dependency updates that
pass the full gate locally.

**Key principle**: direct push trades review for speed, and this repository offers no path for that
trade. A plan declares no direct-push mode; `worktree-to-pr` is the only available mode.
