---
name: agent-developing-agents
description: AI agent development standards including frontmatter structure, naming conventions, tool access patterns, model selection, and reference documentation structure
---

# Developing AI Agents

Comprehensive guidance for creating AI agents following repository conventions.

## Core Requirements

- Frontmatter: name, description, tools, model, color, skills
- Name must match filename exactly
- Non-empty skills field required

## File Operations in Binding Directories

Use normal file-editing tools only on paths that `repo-config.yml` classifies as `source` or
`vendored`. Platform authorization permits access; it does not override ownership. Never hand-edit
a `generated` path or generated delimited region. Bulk substitution is appropriate only for
mechanical changes within editable paths.

Canonical agent and skill sources live under `.claude/agents/` and `.agents/skills/`. After editing
them, run `npm run generate:bindings`; every changed mirror MUST land in the **same commit** as its
source. Verify with `npm run harness:bindings-validation`, which covers all registered harnesses.
Edit a vendored path in place only when the registry assigns that class; see
[the two vendored subclasses](../../../repo-governance/glossary/vendored-exception-subclasses.md).
See also [File-Touch Discipline](../../../repo-governance/development/practice/file-touch-discipline.md).

## References

[AI Agents Convention](../../../repo-governance/development/agents/ai-agents.md)

## Tool Usage Documentation

Agents with 4+ tools, unusual tool combinations, or non-obvious tool choices should document a "Tools Usage" section listing each tool and its purpose, placed after the core responsibility and before detailed workflow sections. See [Tool Usage Documentation](./reference/tool-usage-documentation.md) for the pattern and worked examples by agent family (checker/fixer/maker).

## When to Use This Agent

Agents with overlapping scope or that users might confuse should include a "When to Use This Agent" section with "Use when" / "Do NOT use for" subsections, placed early in the file. See [When to Use This Agent Pattern](./reference/when-to-use-this-agent-pattern.md) for the pattern, worked examples by agent family, and placement guidance.

## Documenting Agent References

All agents SHOULD include a standardized "Reference Documentation" section near the end (before appendices), with four subsections: Project Guidance, Related Agents, Related Conventions, Skills. See [Documenting Agent References](./reference/documenting-agent-references.md) for the section template and subsection-by-subsection guidance, and [Reference Documentation Placement and Examples](./reference/documenting-agent-references-examples.md) for file placement and worked examples across the docs/readme/plan agent families.

## Selecting AI Models for Agents

Four grades, each declared explicitly — there is no blank-`model` grade:

| Grade     | `model:` | `effort:` | For                                                                |
| --------- | -------- | --------- | ------------------------------------------------------------------ |
| ultra     | `fable`  | `high`    | Frontier reasoning. No members; admission needs recorded evidence  |
| planning  | `opus`   | `high`    | Creative reasoning, code generation, architectural decisions       |
| execution | `sonnet` | `xhigh`   | Rule-based validation, applying validated fixes, structured makers |
| fast      | `haiku`  | `xhigh`   | Purely mechanical work with no reasoning required                  |

Argue past each grade from the bottom rather than assuming one, and record the argument in a
`**Model Selection Justification**` block near the top of the agent file. `harness claude validate`
fails any agent whose body omits that block, whose `model` is outside the vocabulary, or whose
`effort` contradicts its grade.

Effort belongs to the grade, not the agent: a weaker model is compensated with more reasoning
effort, so never pick an effort per agent.

The [Model Selection Convention](../../../repo-governance/development/agents/model-selection/README.md)
is authoritative — it owns the decision tree, the per-grade criteria and agent examples, the cost
multipliers, the ultra admission bar, and the justification-block format. Do not restate them here;
a second copy is what let this section teach a two-grade vocabulary long after the repository had
four.
