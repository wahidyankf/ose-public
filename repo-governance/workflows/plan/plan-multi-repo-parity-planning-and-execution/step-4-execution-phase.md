---
description: Runs plan-execution in full for each repo's gated plan, inheriting its Delivery Mode resolution, worktree gate, Task list expansion, Iron Rules, and archival.
when_to_use: Use when executing the composite's per-repo execution step and needing the exact plan-execution rules that apply.
---

# Step 4 — Execution Phase (Concurrent DAG, Nested Per-Repo Workflow)

For every ready repository node in the confirmed DAG, run
[plan-execution](../plan-execution.md) in FULL for `plans/in-progress/<objective-slug>/` in that
repo. Independent nodes may overlap within the shared N=3 agent-slot budget, and every
compute-bearing child enters the shared HIPPO admission domain under its declared workload class:

- **Args**: `plan-path: plans/in-progress/<objective-slug>/, max-iterations:
{input.max-iterations}, max-concurrency: {input.max-concurrency}`

Every plan-execution rule applies unchanged, including:

- **Per-repo Delivery Mode resolution**: each repo's plan resolves its own
  [`## Delivery Mode`](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) independently, via the
  standard three-tier precedence (invocation argument > plan field > `worktree-to-pr` default) —
  distinct from this composite's own `mode` input, which governs only the planning-phase delivery
  of the plan **documents** (Step 1). A repo whose plan resolves to a `*-to-pr` delivery mode
  additionally requires exact-head/base PR CI, one clean current-head
  [`pr-leak-review`](../../pr/pr-leak-review.md), and applicable finite surface gates before that
  repo's merge — its "done" is a green, archival-included PR, not a direct push to `origin main`.
  See [plan-execution.md Step 8](../plan-execution.md).
- **Step 0 worktree gate**: enter the plan's designated worktree (provision from the latest
  `origin/main` if missing), sync it with `origin/main` before any implementation.
- **Task list expansion**: append the repo's delivery checklist to the live Task list as
  flattened tasks per the [Granular Task List Contract](./execution-mode-and-task-list-contract.md#granular-task-list-contract-composite-wide-non-negotiable)
  above, then keep it in sync via the Atomic Sync Ritual for every item.
- **Iron Rules**: granular 1:1 tracking, never stop before all done (except `[HUMAN]` gates),
  fix ALL issues including preexisting, sacred delivery.md, local quality gates before push,
  post-push CI verification, thematic commits, manual behavioural assertions, progress streaming,
  disk-is-truth reconciliation.
- **Validation loop**: `plan-execution-checker` to zero findings (CRITICAL through LOW).
- **Knowledge Capture pre-archival gate**: each repo's plan-execution phase blocks its own archival
  until every `learnings.md` entry is routed inline, recorded in a literal user-authorized
  `plans/ideas/` brief after an overlap scan, marked `Reported without plan authorization`, or
  discarded with reason and both safety gates pass, per the
  [Knowledge Capture Convention](../../../development/quality/knowledge-capture.md) — an attention
  point per repo, not a composite-wide one.
- **Archival and terminal proof**: after the preliminary audit and all pre-archival gates pass,
  resolve `rtk date +%F` once as `<completion-date>`, move the plan to
  `plans/done/<completion-date>__<objective-slug>/`, update indexes, deliver the archival change,
  and require replacement exact-head proof where applicable. After merge or delivery confirmation,
  record the workflow-owned terminal audit in `{final-report}`; only then assign `pass`.
- **Immediate worktree and artifact cleanup after `pass`**: run the full three-class cleanup gate
  in the same session after terminal proof, identity, clean/idle, and no-unpushed proof. Preserve
  diagnostics, purge only plan-local regenerable build output, apply the
  bare-repository branch-order exception when needed, and use non-force exact-path removal with no
  extra prompt. Never use ancestry as a squash-merge proxy; retain, evidence, and escalate if any
  precondition fails.

**Scheduling rule**: admit a node only when all of its declared predecessors have reached their
required terminal state and both an N=3 agent slot and HIPPO capacity are available. Preserve
public-to-private/Rhino propagation, dependency, writer-reader/shared-output,
transactional/destructive, service/port, and documented correctness edges. A preferred sequence or
temporary capacity shortage is not an edge; independent ready nodes remain eligible to overlap.

Under the default stop-on-failure policy, freeze new admissions as soon as any node becomes
`partial`/`fail`. Request cooperative cancellation of restartable ephemeral or service work only at
a safe boundary; never interrupt a transactional/destructive mutation, delivery critical section,
or cleanup that must complete to leave durable state valid. Let such in-flight work settle, retain
its evidence, and keep downstream nodes blocked. Continue-on-failure may resume scheduling only for
nodes proven independent of the failed node and its outputs.

**Continues in** [Step 4 — Execution Phase (Continued)](./step-4-execution-phase-propagation-and-delivery.md).
