---
description: "Places newly-stated rules on the correct surface — instruction surface first, governance layers below — de-conflicting, deduplicating, arming enforcement."
when_to_use: "Read this index to find the right Repository Rules Propagation Workflow child document."
---

# Repository Rules Propagation Workflow

- [Purpose and Scope](./purpose-and-scope.md) — What this workflow places, what it refuses to place, and where its authority to rewrite existing rules begins and ends. Use when checking whether a stated rule is in scope for propagation, or whether the workflow may touch a given surface.
- [Execution Mode](./execution-mode.md) — How the propagation run is driven — agent delegation, the N+1 concurrency model, dry-run behaviour, and invocation. Use when starting a propagation run and deciding how to delegate its steps.
- [Step 0: Intake and Normalization](./step-0-intake-and-normalization.md) — Turning free prose into a falsifiable rule statement, and the halt condition when a rule cannot be made falsifiable. Use at the start of a propagation run, before any classification or placement decision.
- [Step 1: Working Tree and Branch](./step-1-worktree-and-branch.md) — Where a propagation run does its work — the current tree by default — and the ledger and staging discipline that make working alongside unrelated changes safe. Use after intake succeeds and before any file is written.
- [Step 2: Classification](./step-2-classification.md) — Determining a rule's subject, audience, vendor-neutrality, and governance layer before any placement decision is made. Use after normalization, to establish the four facts every later step depends on.
- [Step 3: Conflict Scan](./step-3-conflict-scan.md) — The pre-write contradiction check and the layer-aware precedence rule that decides whether a new rule supersedes an existing one or yields to it. Use after classification and before placement.
- [Step 4: Placement Decision](./step-4-placement-decision.md) — The instruction-surface admission test, the fallback to a governance layer, and the rule that a threshold is never raised to make a placement fit. Use after the conflict scan clears.
- [Step 5: Eviction Protocol](./step-5-eviction-protocol.md) — How the workflow frees room on a full instruction surface by relocating a resident entry into a governance layer, in the same delivery as the admission. Use when a rule passed the necessity condition but the destination has no headroom.
- [Step 6: Write and Subject-Scoped Tidy](./step-6-write-and-tidy.md) — Writing the rule, classifying every subject surface, then consolidating and reindexing it around a surviving canonical home. Use once placement is decided.
- [Step 7: Enforcement Disposition](./step-7-enforcement-disposition.md) — The mandatory three-way outcome every propagated rule must carry before delivery. Use after the rule is written, before verification.
- [Step 8: Verification](./step-8-verification.md) — Regenerating derived surfaces, running deterministic gates, performing subject-local semantic closure, and reconciling the file-touch ledger. Use after every rule is written and dispositioned.
- [Step 9: Delivery and Sibling Obligation](./step-9-delivery-and-sibling-obligation.md) — Committing the ledger's paths, opening the PR, and recording the propagation obligation the sibling repository now carries. Use once verification is clean.
- [Termination Criteria](./termination-criteria.md) — The four terminal states — no-op, landed, halted, partial — and the conditions that produce each. Use when deciding whether a propagation run is finished.
- [Success Criteria](./success-criteria.md) — Gherkin scenarios covering placement, admission, eviction, precedence, enforcement disposition, and the sibling obligation. Use when validating that a run behaved correctly.
- [Safety Features](./safety-features.md) — The guards bounding a run's authority to rewrite, relocate, and delete existing rules. Use when reviewing a propagation run's diff.
- [Example Usage](./example-usage.md) — Worked invocations — a single rule, a batch, a dry run, and a rule that supersedes an existing one. Use when invoking the workflow and choosing inputs.
- [Related Workflows](./related-workflows.md) — What runs before this workflow, its independent quality-gate boundary, and what follows it. Use when deciding whether propagation is the right workflow.
- [Principles Implemented/Respected](./principles-implemented-respected.md) — Which governance principles this workflow implements and which it must not violate while running. Use when tracing a step upward to the principle that justifies it.
- [Conventions Implemented/Respected](./conventions-implemented-respected.md) — Which repository conventions this workflow enforces during a run and which it must not breach while placing a rule. Use when tracing a step to the convention that constrains it.
