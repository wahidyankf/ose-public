---
description: Defines DAG-first ordering bounded by the one-worktree-per-repo lock and HIPPO admission, and mode-specific delivery-unit integration shape.
when_to_use: Use when planning overlap or mapping delivery units to the resolved delivery mode's work location and integration mechanism.
---

# Fan-Out, Ordering, and Delivery Shape

**There is no thread-count model.** Overlap is bounded by two things only: the **worktree lock**
and **HIPPO admission** for compute. The orchestrator stays responsive by delegating item work; it
never counts threads or promotes a numeric ceiling. See the
[Agent Workflow Orchestration Convention](../../../development/agents/agent-workflow-orchestration.md).

**Worktree caps (defaults `1` and `1`; only the user may raise them).** A plan holds at most
`max-worktrees-per-plan-repo` worktrees per repository (**default `1`**, reused for every unit) and
at most `max-active-worktrees` active at once for that plan (**default `1`**). Raise either only when
the **user's invocation explicitly says so** — never on the orchestrator's own judgement, capacity,
or budget. Beyond the effective cap, `git worktree add` is a defect. Branches/PRs stay per-unit.
See
[Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).

**Ordering is DAG-first**: the plan's `## Parallelization Model` declares which nodes are
independent. Independent nodes in **different** worktrees (or with no worktree) may overlap when
HIPPO admits their compute; nodes sharing a worktree serialize; **sequence is not dependency**.
For a multi-repository plan, resource-heavy worktree provisioning, toolchain setup, builds, and
validation are compute nodes admitted by HIPPO under their declared workload class. Independent
nodes overlap when their complete reservations are admitted; a deferral changes timing, never
dependency order.

**How to call HIPPO (worktree root, that worktree's `./hippo`)**: one outer boundary per
compute-bearing node — `rtk ./hippo run --class <transactional|ephemeral> --resource-tier
<light|standard|heavy> --disk-path . -- <command>`. `transactional` for writers (`npm install`,
provision), `ephemeral` for checks, tests, builds; choose the tier per the link below.
`npm run <script>` is already guarded — never re-wrap it; `npm install`/`npm exec` do take the
boundary; `rtk npm run doctor` guards itself.

**Read pressure from HIPPO; never guess.** Before heavy work, read `./hippo status`
(`state`/`reason`, memory, CPU, owners, waiters); on deferral, `./hippo history`. **If HIPPO is
full, queue — never give up and never bypass.** Keep the node queued, serialize worktree work, and
retry the same guarded command until HIPPO admits it. A `capacity-deferred` result is never a
failure and never licenses a bare command; it changes timing only, never dependency order. See
[Guarded Admission and Parallelism](../../../development/practice/resource-aware-development/guarded-admission-and-parallelism.md).

**Delivery follows the resolved mode at one natural seam per unit**: each independent DAG node
**that produces changes** is one delivery unit. Under `*-to-pr`, it gets one branch and one PR,
opened and merged at its boundary. Under a permitted direct mode, it reaches one direct integration
checkpoint. A worktree mode provisions at most one worktree per repo and reuses it across units;
a main mode uses the primary checkout and provisions none
([§Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule)).
A **delivery unit** is the contiguous run of phases ending at a boundary; the plan's `### Delivery
Boundaries` table names which phase reaches the mode-specific integration opportunity, and
intermediate phases pass their own gate without integrating
([§PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule)).
Each unit follows one natural cohesive seam, keeps all artifacts required for internal consistency,
and leaves `main` immediately safe to deploy to production. LOC and file counts never create,
erase, or force the boundary. Incomplete behaviour requires a temporary production-disabled flag,
tests for both paths, and rollout/rollback/removal evidence. Integrate a ready unit promptly rather
than holding it to batch; independent units land in any order, serializing under HIPPO
pressure, each refreshed with its gates re-run, per
[Delivery Seams and Ownership](../../../development/agents/planning-capabilities/005-delivery-seams-and-ownership.md).
Cleanup is the terminal DAG node, so a provisioned worktree is removed only once **every** delivery
unit that used it has landed and no in-flight node still needs it — not when the first one does.
**Phase 0 is not a delivery node** — it is setup and baseline only, so it opens no PR under any
delivery mode and the earliest PR belongs to Phase 1
([§Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule)).

**Git stays non-destructive and self-scoped**: others share this disk and object store. Never
discard another actor's work or remove a worktree or branch you did not create. See
[No Destructive Git Operations](../../../development/workflow/no-destructive-git-operations.md) and
[Worktree and Artifact Cleanup](../../../development/workflow/worktree-and-artifact-cleanup.md).

**Status cadence**: ordinary foreground work uses meaningful milestone updates. Independently, send
the five-line heartbeat from [Safety Features](./047-safety-features-and-plan-specific-validation.md)
at least every **20 minutes** without being asked. CI keeps its separate **2-minute polling
cadence** and gains no user-report timer. See
[Subagent Orchestration §Standard 5](../../../development/agents/subagent-orchestration/standard-5-status-update-cadence.md)
and [CI Monitoring](../../../development/workflow/ci-monitoring.md).
