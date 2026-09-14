---
description: "The full machine-readable parameter contract for mode, max-concurrency, and push-target, plus every declared output (plan-path, findings counts, final-status)."
when_to_use: "Use when you need the exact type/required/default contract for these three inputs or any output, rather than the prose summary in Inputs at a Glance."
---

# Inputs Reference — Part 2, and Outputs

Continued from [Inputs Reference — Part 1](./inputs-reference-parameter-contract.md).

This child holds the full parameter contract for the workflow's remaining three inputs and
every declared output. See
[Inputs at a Glance and Grilling](./inputs-at-a-glance-and-grilling.md) for the readable
quick-reference table covering every input.

## Inputs

- **`max-concurrency`** (number, optional, default `1`) — Maximum agents run in parallel. Default 1: the three testers run SEQUENTIALLY by design (exploratory → integrate → usability → integrate → design → integrate) so each result set is folded into the plan before the next runs, and because all three testers are sonnet-tier the staged order keeps each pass's full context available during its integration. This 1 is a genuine DAG serialization point, NOT a stale concurrency cap: each tester reads the plan the previous tester wrote, so the nodes are dependent by the standard independence test (two nodes are independent only when neither reads what the other writes). The DAG governs — never force parallelism onto dependent nodes. Raising this to the N+1 model's default N would produce three testers racing on one plan file, which is why this workflow is deliberately exempt from that default.
- **`push-target`** (string, optional, default `origin main`) — Git push destination for the finished plan. Default: origin main.

## Outputs

- **`plan-path`** (string) — Path to the created or updated plan under plans/in-progress/<identifier>/
- **`exploratory-findings-count`** (number) — Number of EWT-### findings carried into the combined plan
- **`usability-findings-count`** (number) — Number of UWT-### findings carried into the combined plan
- **`design-findings-count`** (number) — Number of DWT-### findings carried into the combined plan
- **`final-status`** (enum: pass, partial, fail) — Final status after the plan's quality gate
