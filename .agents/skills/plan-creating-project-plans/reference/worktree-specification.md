# Work Location Specification (Mandatory — Applies to ALL Plans)

Resolve the delivery mode and declare its work location before the checklist begins. For a worktree
mode, provision the worktree **before** defining the plan and author there by default. For a main
mode, declare `Worktree: not applicable — <mode> uses the primary checkout` and provision none. The only
authoring exception is when this plan artifact is itself a deliverable inside another existing
worktree that the user explicitly required the session to keep using, and it depends on unlanded
work there. In that case, declare the matching execution worktree with `Provisioning status:
pending`, the authoring worktree, and the user constraint; omit its identity/inventory until Step 0.
Convenience alone is not an exception, and no implementation may begin while status is pending.

This is enforced by `plan-checker` and the
[plan-execution workflow Step 0 hard gate](../../../../repo-governance/workflows/plan/plan-execution.md).
For a worktree mode, the executor enters or provisions the declared matching worktree, syncs with `origin/main`, and—per
the [Worktree Cap HARD RULE](../../../../repo-governance/conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule)—reuses
at most one worktree per repository across every delivery unit. A main mode syncs the primary checkout instead.

**Where to declare**:

- **Multi-file plans**: top-level `## Worktree` section in `delivery.md`, placed before any phase heading.
- **Existing pre-contract single-file plans and bug-fix plans**: top-level `## Worktree` section in
  `README.md`, before `## Delivery Checklist`. This never authorizes any other new single-file formal
  plan.

**Worktree-mode path format**: `worktrees/<plan-identifier>/` where `<plan-identifier>` matches the plan-folder identifier (strip the `YYYY-MM-DD__` date prefix). Examples:

- Folder `2026-05-15__auth-rewrite/` → worktree path `worktrees/auth-rewrite/`
- Folder `2026-03-01__add-user-search/` → worktree path `worktrees/add-user-search/`

**Required worktree-mode template** (insert verbatim, replacing `<plan-identifier>`):

````markdown
## Worktree

Worktree path: `worktrees/<plan-identifier>/`

Provisioned before this plan was written (run from repo root):

```bash
claude --worktree <plan-identifier>
```

The plan-execution Step 0 gate enters this worktree by default: it auto-provisions from the latest `origin/main` when missing, syncs with `origin/main` before implementing, and — capped at one per repository per plan and reused across every delivery unit landed there — is removed immediately once the plan is done using this repo, not deferred to archival.

### Provisioned Worktree Identity

- Declared repository-relative route: `worktrees/<plan-identifier>/`
- Initial branch: `<plan-identifier>-base`
- Created by: `<executor identity or session>`
- Created at: `<ISO-8601 UTC timestamp>`

### Delivery Branch Inventory

| Branch                   | Mode          | Lifecycle state | Proof                                            |
| ------------------------ | ------------- | --------------- | ------------------------------------------------ |
| `<plan-identifier>-base` | `provisioned` | `active`        | `git worktree add` at `<ISO-8601 UTC timestamp>` |

The plan must not record an absolute, home, tool-prefix, drive, UNC, or other host-specific path.
Resolve its declared route only at runtime against the selected repository root; retain any resolved
path only in ignored runtime evidence after reconciliation with `git worktree list --porcelain`.

Append every plan-created delivery branch before use. A `*-to-pr` entry records its merged PR and
40-character reviewed-head SHA; direct push records its verified `origin/main` commit. Before
removal, classify every entry as delivered, unused, or retained/escalated; active or unrecorded
branches block cleanup.

See [Worktree Path Convention](../../../../repo-governance/conventions/structure/worktree-path.md) and [Plans Organization Convention §Worktree Specification](../../../../repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification).
````

For a main mode, use this compact alternative and omit worktree identity and branch inventory:

```markdown
## Worktree

Worktree: not applicable — `<main-mode>` uses the primary checkout.
```

**This applies to all newly created formal plans regardless of size** — pure-docs plans included.
