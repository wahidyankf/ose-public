---
description: "Exercises a running API through one discovery, an optional fix, and one scoped live verification."
when_to_use: "Read this index to find the right API Quality Gate Workflow child document."
---

# API Quality Gate Workflow

- [Shape: Tester-Driven, Not Checker/Fixer](./shape-tester-driven-not-checker-fixer.md) — Explains why the API gate uses a tester and language-matched developer in a bounded run. Use when selecting agents.
- [Execution Mode](./execution-mode.md) — Preferred and fallback execution modes for the API quality gate, and example invocations. Use when starting the API quality gate, to decide between Agent Delegation and Manual Orchestration.
- [Preconditions](./preconditions.md) — The three preconditions that must hold before the API quality gate can run — reachable service, identified contract, non-destructive scope. Use when confirming a service is ready to be exercised by the API quality gate.
- [Step 1: Discovery (Agent Delegation)](./step-1-discovery.md) — How the gate invokes api-exploratory-tester for one full live API sweep. Use when starting the gate.
- [Step 2: Triage Against Mode](./step-2-triage-against-mode.md) — How AET findings' ISTQB severity ratings map onto the gate's CRITICAL/HIGH/MEDIUM/LOW mode threshold. Use when deciding which findings from the tester block termination under the current mode.
- [Step 3: Fix (Agent Delegation)](./step-3-fix.md) — How in-threshold findings are routed to swe-code-maker and what every fix must ship with. Use when applying fixes for findings surfaced by the API quality gate tester.
- [Step 4: Verification](./step-4-verification.md) — How one rebuild/redeployment precedes verification of original findings and a smoke test of affected API behaviour. Use after Step 3.
- [Step 5: Finalization](./step-5-finalization.md) — The pass, partial, fail, and separate lifecycle outcomes. Use when closing the bounded run.
- [Success Criteria](./success-criteria.md) — Clean-discovery, verified-fix, partial, and lifecycle
  scenarios. Use when validating the bounded API quality gate's observable behaviour.
- [Relationship to Other Gates](./relationship-to-other-gates.md) — How surface-conditional applicability and merge-blocking status relate to the UI gates and PR merge protocol. Use when determining whether a plan must run the API gate, UI gates, both, or neither.
- [Related Documentation](./related-documentation.md) — Cross-references from the API quality gate to the workflows index, the UI gate, and related quality conventions. Use when looking for documentation related to the API quality gate.
