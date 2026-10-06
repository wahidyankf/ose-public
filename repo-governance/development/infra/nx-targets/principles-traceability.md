---
description: Maps each major Nx target design decision to the software-engineering principle it implements.
when_to_use: Use when writing a rationale section that needs to cite which principle a target-design decision satisfies.
---

# Principles Traceability

| Decision                                                                                                                                                    | Principle                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Consistent target names across all projects                                                                                                                 | [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) |
| Affected `test:quick` runs Unit plus all applicable static coverage in the PR quality gate; higher-layer runtime remains manual-impacted and scheduled-full | [Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md) |
| Applicable real-target rule prevents an omitted boundary from reporting false success                                                                       | [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) |
| Nx selects only projects that expose a target; no-op symmetry is unnecessary                                                                                | [Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)      |
| `outputs` required for cacheable targets                                                                                                                    | [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) |
| Four-dimension tag scheme with controlled vocabulary declared in every `project.json`                                                                       | [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) |
