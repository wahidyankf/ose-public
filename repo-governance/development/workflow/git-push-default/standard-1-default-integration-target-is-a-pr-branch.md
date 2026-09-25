---
description: The default worktree-to-pr workflow, the situations it applies to, and the Phase 0 exception where no PR is opened at all.
when_to_use: Use when confirming the default push behaviour for a delivery, or when checking whether Phase 0 of a plan should push or open a PR.
---

# Standard 1: Default Integration Target Is a PR Branch

Absent an explicit override, every delivery uses `worktree-to-pr`: work happens on a plan-scoped branch
inside a disposable worktree, and the integration target is a draft PR opened against `main`.

```bash
# Default workflow — worktree-to-pr
git worktree add worktrees/<plan-id> -b <plan-id>
cd worktrees/<plan-id>
git add <files>
git commit -m "feat(scope): description"
git push origin <plan-id>
gh pr create --draft --base main --title "feat(scope): description"
```

This is the correct behaviour in all of the following situations, absent an explicit mode override:

- General development work.
- Plan creation, plan quality-gate runs, and plan archival.
- Governance convention and workflow authoring.
- Agent definition updates under `.agents/agents/`.
- Any other change not explicitly assigned a direct-push mode.

**The one exception inside a plan: Phase 0 pushes nothing and opens no PR.** A plan's Phase 0 is
Environment Setup and Baseline — guarded `npm install`, read-only `npm run doctor` (provisioning
only on reported drift), a recorded baseline, and preexisting-failure resolution. It produces no reviewable change, so it has no integration target at
all: no `git push origin <plan-id>`, no `gh pr create`, no PR CI or semantic review, no merge. The sequence above
begins at **Phase 1**, which is the earliest phase that may open a PR under `*-to-pr`; any evidence
file Phase 0 wrote lands through the first change-producing unit's mode-specific integration. This
is not a mode override — the no-integration rule holds under every one of the four delivery
modes. See
[Plans Organization Convention §Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).
