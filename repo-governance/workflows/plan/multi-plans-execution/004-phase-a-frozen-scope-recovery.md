---
description: "Persists a multi-plan run's enumerated scope and promotion states so resume cannot silently redefine the run."
when_to_use: "Use after resolving multi-plan scope and before promoting any backlog member, or when resuming that run."
---

# Phase A — Frozen Scope Recovery

Before the first promotion mutation, authenticate the current GitHub caller and confirm it has
write permission in the repository resolved from `origin`. Create one durable, caller-visible run
record in that repository's issue tracker. Local task lists, reports, conversation state, and
lifecycle-folder enumeration are insufficient because they can disappear or change during
promotion.

The record uses a versioned, closed schema: reject missing, duplicate, or unknown fields. Its
immutable header binds the repository owner/name, stable run identifier, enumeration
`origin/main` SHA, original selector and exclusions, and ordered plan-identifier set. Its
transition entries store:

- each member's observed lifecycle path and promotion state; and
- links to its promotion pull request (or direct commit) and later work branch when they exist.

Write the full set with every member initially classified before promoting the first member. After
each remote transition, apply the canonical
[Promotion Recovery](../../../conventions/structure/plans/starting-work-promotion-recovery.md)
classifier, then append that member's next schema-valid transition. Do not infer completion from a
missing backlog path or rewrite the immutable header.

**Run claim (on the existing remote; no new platform).** Creating that issue **is** the claim.
Before promoting or scheduling, list open run records: if a live claim's set overlaps, the
earlier-created claim wins and this run stops before mutating, naming its holder (run-id, machine,
session, harness). Live means heartbeat-fresh. Coordination uses only `origin/main`,
branches, PRs, and this issue. `local-tmp`/HIPPO stay local, never a global lock. Without a remote,
concurrent multi-machine runs are unsafe; do not attempt them.

**Lease per plan.** The claim leases **each plan** to its run-id (machine, session, harness) at
lease **generation `1`**. Renew at each heartbeat and node transition. After **two missed
heartbeats**, takeover needs explicit user confirmation plus full reconciliation. While live, no
other run on any machine schedules, promotes, or cleans that plan.

**User override (the only early takeover).** Before expiry, **only the user** may order a takeover —
never the waiting orchestrator, never on capacity or age alone. The waiting run stops, reports the
holder and its last heartbeat, and asks. On the user's explicit order, the new orchestrator first
appends an override entry to the issue raising that plan's lease generation by one (old holder, new
holder, plan, reason), then reconciles fully before scheduling. The old holder re-reads the issue at
every node start and heartbeat: on seeing its generation superseded it **stops at once** — no
commit, push, or cleanup — retains its worktree for reconciliation, and reports handed-over. Without
this generation check, override is forbidden, because two machines would both believe they own the
plan.

On resume or takeover, the caller supplies the run with **`run-issue: <number>`** (the GitHub Issue
number of the existing run record). Reload that issue's stored set and states;
but admit the issue and each body edit or transition only after the API identifies its actor and
that actor's repository write permission. Verify the schema bindings against the current remote,
reconcile the admitted states against `origin`, show the issue, immutable plan set, and proposed
next mutations, then require caller confirmation. Never re-expand `all-backlog`, `all-in-progress`,
or `all` for that run: new plans are outside its frozen scope, and promoted members remain inside
it. A missing actor, failed permission/provenance check, schema or binding mismatch, edit to an
immutable field, duplicate transition, or conflicting record stops the run before scheduling or
mutation.

The issue is execution state, not a plan-document delivery unit. Keep secrets out of it, retain it
as the durable recovery and audit record, and link it from every promotion pull request the run opens.

**Progress ledger (`local-tmp`, mirrored to the issue).** Maintain one progress file per run at
`local-tmp/multi-plans-execution/multi-plans-execution__<run-id>__progress.md`: frozen set, DAG
confirmation, node states with plan/phase, weighted progress, worktrees/branches/PRs, cleanups,
blockers, decisions, next `[HUMAN]` timing. Update after **every** transition, boundary, cleanup,
and heartbeat, mirroring each update to the issue at once. Cross-machine takeover trusts the issue;
the file is only a cache. Chat-only progress fails this rule.

**Takeover entry.** Never guess the run: match the caller's `run-issue` in the tracker (or sole local
ledger naming the plans), verify the issue and `origin/main` SHA still bind the set, show ledger and
next mutations for confirmation, then reconcile against `delivery.md`, git status, worktrees, and
`origin` (disk wins). No match or mismatch stops before mutating.
