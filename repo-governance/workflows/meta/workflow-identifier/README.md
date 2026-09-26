---
description: "Standards for creating orchestrated multi-step processes that compose agents, procedures, and/or other workflows"
when_to_use: "Read this index to find the right Workflow Pattern Convention child document."
---

# Workflow Pattern Convention

- [Repository Hierarchy](./repository-hierarchy.md) — Shows where Workflows sit in the six-layer governance hierarchy, from Vision down through Principles, Conventions, Development, Agents, to Workflows.
- [What Workflows Are](./what-workflows-are.md) — Lists the seven things a workflow definition specifies — sequences, looping, goals, termination criteria, input/output contracts, state management, and error handling.
- [What Workflows Are NOT](./what-workflows-are-not.md) — Four boundary statements distinguishing a workflow from an agent, an ad-hoc script, a project plan, and a new conceptual layer.
- [When to Create a Workflow](./when-to-create-a-workflow.md) — Seven positive signals for creating a workflow and three negative signals for not creating one.
- [Workflow Structure](./workflow-structure.md) — The Markdown template every workflow document follows — the two-key frontmatter, the body sections carrying the goal, termination, inputs, and outputs contract, and the step skeleton.
- [YAML Syntax Requirements](./yaml-syntax-requirements.md) — Which characters require quoting in workflow YAML frontmatter, with good/bad examples, to avoid breaking some YAML parsers.
- [File Naming Convention](./file-naming-convention.md) — Workflow files use plain kebab-case names (no prefix) in the subdirectory that encodes their category.
- [Step Execution Patterns](./step-execution-patterns.md) — The three step execution patterns — Sequential, Parallel, Conditional — with examples, plus how max-concurrency controls parallel fan-out.
- [State Management](./state-management.md) — How workflows pass data between steps using {input.name}, {stepN.outputs.name}, {stepN.status}, and {stepN.user-approved} references.
- [Human Checkpoints](./human-checkpoints.md) — How workflows pause for human approval using the AskUserQuestion tool, with an example checkpoint block.
- [Error Handling](./error-handling.md) — How each workflow step defines failure behaviour, and the five common error-handling patterns (fail fast, continue, retry, user intervention, fallback).
- [Validation](./validation.md) — The six checks a workflow document must pass before execution — frontmatter schema, agent references, input/output types, dependencies, state references, and file naming.
- [Relationship to Other Layers](./relationship-to-other-layers.md) — How workflows relate to principles, conventions, development practices, agents, other workflows, and plans.
- [Composability](./composability.md) — A workflow step can itself be another workflow, an agent, or a procedure, in any combination — shown with mixed-composition and output-chaining examples.
- [Governance Gate Class](./governance-gate-class.md) — The second permanent quality-gate class (`plan-quality-gate`, `rules-quality-gate`, and `docs-quality-gate` only): binary admission, frozen ledger, one stabilization cycle or, for the docs gate, a bounded re-audit loop, terminal verdicts, and explicit authorization, plus the four-part test for choosing between it and the \*-check-fix class. Use when authoring a new quality gate or classifying an existing one.
- [\*-check-fix Workflow Pattern — Pattern Characteristics](./check-fix-pattern-characteristics.md) — Introduces the \*-check-fix pattern that achieves perfect quality by fixing ALL findings and iterating to zero, and lists when to use it and its key differentiators.
- [\*-check-fix Workflow Pattern — Standard Structure](./check-fix-standard-structure.md) — The standard Inputs and Outputs body sections every \*-check-fix workflow uses — mode, max-concurrency, min-iterations, max-iterations, and their outputs.
- [\*-check-fix Workflow Pattern — Required Steps](./check-fix-required-steps.md) — The five required steps of a \*-check-fix workflow — Initial Validation, Check for Findings, Apply Fixes, Re-validate, Iteration Control.
- [\*-check-fix Workflow Pattern — Termination Criteria (Mandatory)](./check-fix-termination-criteria.md) — The mandatory success/partial/failure termination criteria every \*-check-fix workflow must use, by mode level.
- [\*-check-fix Workflow Pattern — Consecutive Pass Requirement](./check-fix-consecutive-pass-requirement.md) — Why every \*-check-fix workflow requires two consecutive zero-finding validations before declaring success, and its mechanism and iteration-budget impact.
- [\*-check-fix Workflow Pattern — Safety Features and Strictness Parameter](./check-fix-safety-and-strictness.md) — The mandatory infinite-loop and false-positive safety features, plus how the mode parameter's four levels (lax/normal/strict/ocd) control fix scope.
- [\*-check-fix Workflow Pattern — Example Implementation and Key Differences](./check-fix-example-and-differences.md) — Points to the canonical \*-check-fix implementation and tabulates how it differs from a basic single-pass validation workflow.
- [\*-quality-gate Lifecycle Validation Ownership](./check-fix-lifecycle-validation-ownership.md) — Defines Step 0 registry filtering, delegated evidence states, and selective invalidation.
- [Example Workflow Structure](./example-workflow-structure.md) — A worked, simplified example of a full multi-step content-validation workflow document, frontmatter through Termination Criteria.
- [Documentation Requirements](./documentation-requirements.md) — The seven sections every workflow document must include — Purpose, When to use, Steps, Agent references, Success/failure criteria, Example usage, Related workflows.
- [Future Enhancements](./future-enhancements.md) — Not-yet-implemented workflow features under consideration — retry policies, timeouts, rollback, metrics, visualization, and testing.
- [Token Budget Philosophy](./token-budget-philosophy.md) — States that workflow orchestration should not economize on tokens — reliable compaction handles context, so focus on correct thorough execution.
- [Principles Implemented/Respected](./principles-implemented-respected.md) — Traces this convention's workflow-pattern design back to the foundational principles it respects.
- [Conventions Implemented/Respected](./conventions-implemented-respected.md) — Traces this convention's design back to the File Naming, AI Agents, and Linking conventions it implements.
