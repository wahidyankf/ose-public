# Workflow Structure

The [Workflow Structure](../../../../repo-governance/workflows/meta/workflow-identifier/workflow-structure.md)
convention owns the full template. This reference covers what authors most often get wrong in it.

## Frontmatter: Exactly Two Keys

```yaml
---
description: "Workflow name: one sentence on what this workflow does"
when_to_use: Use when the specific scenario this workflow serves applies.
---
```

Frontmatter carries `description` and `when_to_use` and nothing else, as for every file under
`repo-governance/` — see
[Governance Frontmatter](../../../../repo-governance/conventions/structure/governance-frontmatter.md).

`name`, `goal`, `termination`, `inputs`, and `outputs` are never frontmatter keys. The metadata schema is
closed, so they fail validation, and a contract in frontmatter is hidden from anyone reading the document. The
workflow's identifier is its filename stem.

**Critical YAML Syntax**: Values containing a colon followed by a space must be quoted.

✅ **Good**:

```yaml
description: "Workflow name: detailed description here"
```

❌ **Bad** (breaks YAML parsing):

```yaml
description: Workflow name: detailed description
```

## The Contract Lives in the Body

The body carries the contract, in this order:

1. `# Workflow Name`, then a one-sentence **Purpose**.
2. `## Goal and Termination` — what the workflow achieves, and its success and failure criteria.
3. `## Inputs` — each input with its type, `required` or `optional`, and a `default` when optional. Most
   workflows declare `max-concurrency` (number, optional, default `3`): background agents run concurrently, the
   N in the N+1 model (1 main thread + N background agents = N+1 total).
4. `## Outputs` — each output with its type, and a `pattern` for `file` or `file-list` outputs.
5. `## Steps` — numbered `### N. Step Name (Sequential | Parallel | Conditional)` steps, each naming its agent,
   nested workflow, or procedure, with args, output, dependencies, condition, success criteria, and what happens
   on failure.
6. `## Termination Criteria` — PASS, Partial, and FAIL conditions.
7. `## Example Usage` — a concrete invocation that runs as written.
8. `## Related Workflows` — workflows that compose with this one.

Types are `string`, `number`, `boolean`, `file`, `file-list`, and `enum`; an enum lists its values inline.
