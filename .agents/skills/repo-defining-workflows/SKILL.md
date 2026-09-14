---
name: repo-defining-workflows
description: Workflow pattern standards for creating multi-agent orchestrations including two-key frontmatter with the goal, termination, inputs and outputs contract in body sections, execution phases (sequential/parallel/conditional), agent coordination patterns, and success criteria. Essential for defining reusable, validated workflow processes.
---

# Defining Workflows

## Purpose

Guidance for **defining workflows**: reusable, validated multi-agent orchestrations with sequential,
parallel, or conditional coordination.

**When to use this Skill:**

- Creating new workflow documents
- Defining multi-agent coordination patterns
- Structuring sequential or parallel agent execution
- Writing workflow acceptance criteria
- Documenting workflow parameters and inputs

## Workflow Structure

See [Workflow Structure](./reference/workflow-structure.md) for the two-key frontmatter (`description`, `when_to_use`), the YAML colon-quoting rule, and the body sections that carry the contract (Goal and Termination, Inputs, Outputs, Steps, Termination Criteria, Example Usage, Related Workflows). The contract never goes in frontmatter: the metadata schema is closed, and a body contract is readable without a YAML parser.

## Execution Patterns

See [Execution Patterns](./reference/execution-patterns.md) for worked Sequential, Parallel, Conditional, and Mixed execution examples.

## Standard Input Parameters

Most workflows support:

- **max-concurrency** (number, default: 3): Background agents run concurrently — the N in the N+1 model (`1 main thread + N background agents = N+1 total`). The DAG governs the actual fan-out; N only caps it. Never self-promoted beyond the declared value
- **dry-run** (boolean, default: false): Preview without executing
- **verbose** (boolean, default: false): Detailed logging

## Common Mistakes

### ❌ Mistake 1: Unquoted colons in YAML

**Wrong**:

```yaml
description: Workflow name: detailed description
```

**Right**:

```yaml
description: "Workflow name: detailed description"
```

### ❌ Mistake 2: Contract fields in frontmatter

**Wrong**: `name`, `goal`, `termination`, `inputs`, or `outputs` as frontmatter keys — they fail the closed
metadata schema and hide the contract from readers
**Right**: exactly `description` and `when_to_use` in frontmatter; the contract in the body sections

### ❌ Mistake 3: Missing agent dependencies

**Wrong**: Parallel execution when agent-2 needs agent-1 output
**Right**: Sequential execution with explicit dependency

### ❌ Mistake 4: No success criteria

**Wrong**: Workflow without Gherkin validation criteria
**Right**: Clear Gherkin scenarios for success validation

### ❌ Mistake 5: Missing parameters documentation

**Wrong**: Undocumented parameters that users must guess
**Right**: Table with all parameters, types, defaults, descriptions

## Workflow File Naming

**Convention**: `[workflow-name].md`. Shards are plain-named; a step keeps its own number —
[Ordinal Prefixes](../../../repo-governance/conventions/structure/ordinal-filename-prefixes.md).

**Examples**:

- `plan-quality-gate.md` - Plan quality gate workflow
- `rules-quality-gate.md` - Repo rules quality gate workflow

## Quality Checklist

Before publishing workflow:

- [ ] Frontmatter carries exactly `description` and `when_to_use` (colons quoted); the identifier is the filename stem
- [ ] Goal and Termination section: goal is clear and concise, success/failure criteria defined
- [ ] Inputs section documents every input (type, required or optional, default)
- [ ] Outputs section documents every output (type, pattern for file outputs)
- [ ] Every `*-quality-gate` applies lifecycle ownership Step 0 and emits `lifecycle-status`
- [ ] Execution phases clearly defined
- [ ] Dependencies explicit (sequential vs parallel)
- [ ] Success criteria in Gherkin format
- [ ] Example usage provided
- [ ] Related workflows linked

## References

**Primary Convention**: [Workflow Pattern Convention](../../../repo-governance/workflows/meta/workflow-identifier.md)

**Related Conventions**:

- [Maker-Checker-Fixer Pattern](../../../repo-governance/development/pattern/maker-checker-fixer.md) - Three-stage workflow pattern
- [Acceptance Criteria Convention](../../../repo-governance/development/infra/acceptance-criteria.md) - Gherkin format

**Related Skills**:

- `repo-applying-maker-checker-fixer` - MCF workflow pattern
- `plan-writing-gherkin-criteria` - Success criteria format

---

This Skill packages workflow definition standards for creating reusable multi-agent orchestrations with clear coordination patterns. For comprehensive details, consult the primary convention document.
