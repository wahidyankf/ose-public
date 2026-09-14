---
description: Requires a Parallelization Model naming concurrent vs. serial delivery nodes.
when_to_use: Use when writing a plan's Parallelization Model.
---

# Delivery Checklists Express a DAG (HARD RULE)

`delivery.md` expresses its phases and steps as a **dependency DAG**, not merely as a top-to-bottom
list. Nodes are phases and checklist items; edges are `blocks` / `blockedBy`. Independent nodes may
run in parallel; dependent nodes serialize.

Every non-trivial plan carries a **`## Parallelization Model`** section, placed before the first
phase, stating:

- **Which nodes are concurrent and which are serial**, and why — a serial spine exists because each
  phase builds the source of truth the next one needs, not because the list happens to be ordered.
- **The plan's chosen N** (see the [Agent Workflow Orchestration Convention](../../../development/agents/agent-workflow-orchestration.md)
  for the N+1 model), and any reason it differs from the default.
- **The cross-repository resource schedule**, when the plan spans repositories. Classify every
  compute-bearing node under
  [Resource-Aware Development](../../../development/practice/resource-aware-development.md), and
  identify dependency, shared-output, byte-identity, transactional, or documented correctness
  edges. Independent nodes enter HIPPO concurrently and execute only when their complete
  reservations are admitted; the plan does not invent a manual live-capacity exception.
- **Cleanup as the terminal node**, depending on every delivery node — so the cleanup gate can never
  remove a worktree, branch, or artifact that an in-flight node still needs. The node references the
  [Dev Artifact Clean-Up workflow](../../../workflows/dev-artifact-clean-up.md); an inlined copy
  drifts and no gate reads it.

The distinction that makes this worth writing down: **sequence is not dependency**. A checklist is
necessarily written in some order, but only some of that order is load-bearing. Stating the DAG
separates the two, so an executor knows which items may fan out and which must wait — rather than
inferring it from list position and serializing work that never needed to be serial, or parallelizing
work that did.

Two nodes are independent only when neither reads what the other writes. A shared output file, a
shared branch, or an ordering constraint makes them dependent however separable they look.

**A declaration belongs to the delivery unit that makes it resolvable, not to the unit that wants
it.** Cross-references are reads: a Markdown link to a project, an adapter entry naming a test
driver, a config key pointing at a surface. Writing one in an earlier unit than its target creates a
backwards edge that no merge conflict reveals — it surfaces as a red gate on a diff that is
internally correct. Two mechanisms make it unavoidable rather than merely likely. A gate declared
`scope: all-file-type` reads the whole working tree, so preparing a later unit's files in the same
worktree puts them on the current unit's critical path. And a validator reads a declaration
literally, so an adapter naming a driver the plan has not built yet fails on a true statement about
the present. The remedy is never to silence the validator with an exemption, a tag, or a dropped
target: name the thing in prose now and add the reference in the unit that creates its referent.

**Enforcement**: `plan-checker` flags a non-trivial plan lacking a `## Parallelization Model` section
as **MEDIUM**, flags a declared-parallel node set with a genuine write conflict as **HIGH**, and for
a multi-repository plan verifies that every compute node has a guard/class and that every declared
serial edge names a logical or correctness reason. `plan-execution-checker` verifies delivery
evidence against that schedule, including HIPPO admission/deferral evidence and preserved serial
edges. Live host capacity remains **unenforced by decision** because a repository-local check cannot
authenticate it. The resolvability rule is likewise **unenforced by decision** at plan
time: whether a reference resolves depends on the state of `main` when its unit lands, which a
plan-time check cannot evaluate. It surfaces at push, in the all-file-type gates themselves.

See [Delivery Checklists Express a DAG — Delivery Units and Planning Granularity](./delivery-units-and-planning-granularity.md) for how DAG nodes map to natural units and mode-specific integration.
