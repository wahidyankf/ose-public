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
- links to its promotion branch and pull request when they exist.

Write the full set with every member initially classified before promoting the first member. After
each remote transition, apply the canonical
[Promotion Recovery](../../../conventions/structure/plans/starting-work-promotion-recovery.md)
classifier, then append that member's next schema-valid transition. Do not infer completion from a
missing backlog path or rewrite the immutable header.

On resume, the caller supplies or confirms the run identifier. Reload the stored set and states,
but admit the issue and each body edit or transition only after the API identifies its actor and
that actor's repository write permission. Verify the schema bindings against the current remote,
reconcile the admitted states against `origin`, show the issue, immutable plan set, and proposed
next mutations, then require caller confirmation. Never re-expand `all-backlog`, `all-in-progress`,
or `all` for that run: new plans are outside its frozen scope, and promoted members remain inside
it. A missing actor, failed permission/provenance check, schema or binding mismatch, edit to an
immutable field, duplicate transition, or conflicting record stops the run before scheduling or
mutation.

The issue is execution state, not a plan-document delivery unit. Keep secrets out of it, retain it
as the durable recovery and audit record, and link it from every promotion pull request created by
the run.
