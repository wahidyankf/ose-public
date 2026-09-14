# Trunk-Based Development — Keeping Branches Short-Lived

## What TBD Actually Forbids

TBD forbids **long-lived** branches, not branches. A plan branch that opens, integrates, and is
deleted within a day or two is fully consistent with TBD; a branch that accumulates weeks of work is
the anti-pattern. Under the `worktree-to-pr` default, each branch is single-purpose and disposable —
one branch, one PR, deleted at the cleanup gate. The worktree itself is a coarser, per-repository
resource — capped at one per repo per plan and reused across every branch/PR the plan lands there,
not deleted until every such delivery unit has landed.

Branch lifespan discipline still applies with full force:

**1. Experimental Work (High Risk)**

- **Definition**: Unproven ideas, may be abandoned
- **Duration**: A day or two, like any plan branch
- **Example**: Exploring new framework, prototyping radical redesign
- **Note**: an experimental branch is still short-lived — abandon or land it, do not let it drift

**2. External Contributions**

- **Definition**: Pull requests from external contributors
- **Duration**: Until review complete
- **Example**: Open source PR from community member
- **Note**: fork + PR is the only external path; maintainers review it like any other PR

**3. Compliance/Audit Requirements**

- **Definition**: Regulatory need for branch-based approval
- **Duration**: Until approval granted
- **Example**: Financial system change requiring dual approval
- **Note**: this is the case where a plan legitimately opts into a `[HUMAN]` merge gate

**4. Environment Branches**

- **Definition**: A branch tracking what is deployed to one environment
- **Duration**: Ongoing
- **Example**: A production branch that receives each release from `main`
- **Note**: the one sanctioned long-lived exception; it only receives from the trunk and is never
  developed on. Releases are tagged commits on `main`, never release branches

## Declaring the Delivery Mode

A plan branch needs no justification — it is the default. What a plan **must** declare is its
Delivery Mode, which determines where the work lands:

```yaml
delivery-mode: worktree-to-pr # or worktree-to-origin-main | main-to-origin-main | main-to-pr
worktree: "worktrees/[plan-identifier]"
branch: "[plan-identifier]"
```

For the categories above that go beyond an ordinary plan branch (experimental, compliance), state the
expected lifespan and the landing strategy alongside the mode, since those are the cases where a
branch risks outliving its plan. An environment branch is not a plan branch and never carries a plan's
work.

## ❌ NOT Justified Reasons to Let a Branch Live Long

A plan branch is expected. What is **not** justified is letting one run long — these reasons do not
excuse a branch that outlives its plan:

- **"Feature in progress"** → Merge only an internally complete increment behind a temporary
  production-disabled feature flag, with both paths tested and its lifecycle recorded
- **"Might break things"** → Use automated tests and the PR quality gates
- **"Working on it for a week"** → Cut the remaining work into the fewest short-lived natural-seam
  units; each merged `main` state must be immediately production-deployable
- **"Multiple people on feature"** → Split into independent DAG nodes, one branch each
- **"Want to keep it separate"** → Preference is not justification

**Key principle**: branches are short-lived and single-purpose. Integration frequency is what TBD
protects — the PR is a review buffer, never a parking space. Split PRs at natural cohesive seams,
not LOC or file counts, and integrate each production-deployable unit promptly.
