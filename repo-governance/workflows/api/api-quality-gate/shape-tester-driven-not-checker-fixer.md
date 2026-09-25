---
description: Explains why the API quality gate has no checker/fixer pair and instead uses a tester-driven bounded run.
when_to_use: Use when orchestrating the API quality gate, to confirm which agents to invoke and in what order.
---

# Shape: Tester-Driven, Not Checker/Fixer

There is deliberately **no `api-checker` / `api-fixer` agent pair**, and this workflow must never be
read as though there were. The bounded run is:

1. [`api-exploratory-tester`](../../../../.agents/agents/api-exploratory-tester.md) drives the live API
   and emits `AET-###` findings.
2. `swe-code-maker` — loading the stack packs of the service under test from the repository
   adapter — fixes each finding.
3. The tester verifies the original findings and smoke-tests affected API behaviour against the
   rebuilt/redeployed service.

Run each step at most once. An unresolved original finding or regression produces `partial`; it does
not restart the run. Naming a non-existent `api-checker` or `api-fixer` agent is anti-pattern
**AP-7** (citing an agent that does not exist).
