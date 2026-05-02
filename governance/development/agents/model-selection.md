---
title: "AI Agent Model Selection Convention"
description: Standards for selecting the appropriate model tier (opus, sonnet, haiku) for AI agents based on task complexity
category: explanation
subcategory: development
tags:
  - ai-agents
  - model-selection
  - standards
  - development
created: 2026-04-03
---

# AI Agent Model Selection Convention

This document defines the standards for selecting the appropriate model tier when creating or updating AI agents. The governing principle is **match model capability to task complexity** -- use the most capable model only when the task demands it, and use lighter models for structured or mechanical work.

## Principles Implemented/Respected

This practice implements the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Select the simplest model that can accomplish the task. Avoid using opus-tier reasoning for tasks that follow fixed patterns or templates. Simpler models reduce latency and resource consumption without sacrificing quality on structured work.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Every agent MUST declare its model tier in frontmatter and include a `Model Selection Justification` comment explaining why that tier was chosen. No implicit defaults -- the reasoning is transparent and auditable.

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Model selection requires deliberate analysis of what cognitive capabilities the task demands. Agents should not default to the highest tier "just in case" -- each selection reflects a considered judgment about the task's actual requirements.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Agent frontmatter and model justification comments follow active voice and clarity standards.

## Purpose

Model selection directly affects agent quality, latency, and resource efficiency. Selecting too powerful a model wastes resources on simple tasks; selecting too weak a model produces poor results on complex work. This convention establishes clear criteria for matching model tiers to task types, ensuring consistent and justified model assignments across all agents.

## Scope

### What This Convention Covers

- Model tier definitions and their cognitive capabilities
- Decision criteria for selecting each tier
- Task-to-tier mapping with concrete examples
- Justification requirements for model selection

### What This Convention Does NOT Cover

- Tool permission selection (see [AI Agents Convention](./ai-agents.md))
- Agent color categorization (see [AI Agents Convention](./ai-agents.md))
- Agent naming and file structure (see [AI Agents Convention](./ai-agents.md))
- Workflow orchestration (see [Agent Workflow Orchestration](./agent-workflow-orchestration.md))

## Model Tiers

### Opus (Inherit / No Model Specified)

**When to use**: Tasks requiring creative reasoning, architectural decisions, code generation, multi-step judgment calls, or nuanced content creation.

**Cognitive profile**: Deep analytical reasoning, novel problem-solving, multi-step planning, creative synthesis across domains, nuanced judgment under ambiguity.

**Task characteristics**:

- Open-ended problems without a single correct answer
- Architectural decisions requiring trade-off analysis
- Code generation across multiple languages and paradigms
- Content creation requiring domain expertise and originality
- Multi-step planning with conditional branching
- Tasks where the agent must invent approaches, not follow templates

**Agent examples**:

- **SWE developers** (all language-specific agents) -- generate and refactor production code across diverse language ecosystems, requiring deep understanding of idioms, patterns, and trade-offs
- **plan-maker** -- creates project plans requiring scope analysis, dependency mapping, and strategic sequencing
- **docs-tutorial-maker** -- produces tutorial content requiring pedagogical reasoning, narrative flow, and learning progression design
- **swe-ui-maker** -- creates UI components requiring CVA variants, Radix composition, accessibility, tests, and stories in one pass

**Frontmatter**: Omit the `model` field. This is intentional — the agent inherits the
session's active model.

```yaml
---
name: swe-typescript-dev
description: Expert TypeScript/Node.js developer...
tools: [Read, Write, Edit, Glob, Grep, Bash]
color: purple
---
```

**Budget-Adaptive Inheritance**: Omitting `model` is a deliberate design choice, not an
oversight. The agent inherits the calling session's model, which adapts to the user's
account tier and token budget:

| Session plan               | Inherited model   | Output quality |
| -------------------------- | ----------------- | -------------- |
| Max / Team Premium         | Claude Opus 4.7   | Highest        |
| Pro / Standard / API       | Claude Sonnet 4.6 | High           |
| Bedrock / Vertex / Foundry | Claude Sonnet 4.5 | High           |

This means a Max-plan user gets Opus-quality plans, architecture, and code generation,
while a Pro-plan user gets Sonnet-quality output — proportional to their purchasing
decision. Do NOT add `model: opus` to these agents. Doing so overrides budget-adaptive
behavior and forces Opus API charges regardless of the user's account tier (see Common
Mistakes).

### Sonnet

**When to use**: Rule-based validation, applying validated fixes from audit reports, template-driven output, and structured pattern-following tasks.

**Cognitive profile**: Strong pattern recognition, reliable rule application, structured output generation, systematic validation against defined criteria.

**Task characteristics**:

- Validating content against a defined checklist or ruleset
- Applying fixes identified by a prior audit (checker output drives fixer input)
- Generating output from templates with variable substitution
- Following a documented procedure step-by-step
- Tasks where correctness means conforming to explicit rules, not inventing solutions

**Agent examples**:

- **All checkers** -- validate content against conventions using defined rulesets and produce structured audit reports (docs-checker, docs-tutorial-checker, docs-software-engineering-separation-checker, readme-checker, specs-checker, repo-rules-checker, repo-workflow-checker, plan-checker, plan-execution-checker, swe-code-checker, swe-ui-checker, ci-checker, apps-\*-checker)
- **Most fixers** -- apply corrections from checker audit reports following documented fix procedures (docs-fixer, docs-tutorial-fixer, docs-software-engineering-separation-fixer, readme-fixer, specs-fixer, repo-rules-fixer, repo-workflow-fixer, plan-fixer, swe-ui-fixer, ci-fixer, apps-\*-fixer)
- **social-linkedin-post-maker** -- generates social media posts following a defined template and tone guidelines
- **Structured makers** -- makers with tight, well-defined skills that pin down most decisions, making them rule-following rather than open-ended creation (docs-maker, readme-maker, agent-maker, specs-maker, repo-workflow-maker, apps-oseplatform-web-content-maker, apps-ayokoding-web-by-example-maker, apps-ayokoding-web-general-maker, apps-ayokoding-web-in-the-field-maker, repo-rules-maker, repo-ose-primer-adoption-maker, repo-ose-primer-propagation-maker)
- **swe-e2e-dev** -- writes Playwright E2E tests following a dedicated skill with defined patterns (locators, fixtures, waits); lower stakes than production code written by language developer agents

**Frontmatter**: Specify `model: sonnet` explicitly.

```yaml
---
name: docs-checker
description: Expert documentation validator...
tools: [Read, Glob, Grep, Write, Bash]
model: sonnet
color: green
---
```

### Haiku

**When to use**: Purely mechanical tasks with no reasoning required -- simple automation, URL validation, deployment scripts, and straightforward command execution.

**Cognitive profile**: Fast execution of simple, well-defined operations. No analytical reasoning needed. Input-output mapping is deterministic or near-deterministic.

**Task characteristics**:

- Running predefined shell commands in sequence
- Validating URLs against HTTP status codes
- Executing deployment scripts with known parameters
- Simple file existence or format checks
- Tasks where the entire procedure is a fixed script with no branching logic

**Agent examples**:

- **Deployers** (apps-ayokoding-web-deployer, apps-oseplatform-web-deployer, apps-organiclever-web-deployer, apps-wahidyankf-web-deployer) -- execute git branch operations and deployment commands following a fixed procedure
- **Link checkers** (docs-link-checker, apps-ayokoding-web-link-checker) -- validate URLs by checking HTTP status codes and managing cache files
- **apps-ayokoding-web-link-fixer** -- applies checker-identified broken links via deterministic URL replacement; no independent analysis required
- **docs-file-manager** -- performs deterministic file operations (move, rename, delete) with `git mv`, kebab-case pattern matching, and mechanical link updates; no judgment calls required

**Frontmatter**: Specify `model: haiku` explicitly.

```yaml
---
name: apps-ayokoding-web-deployer
description: Expert deployment orchestrator...
tools: [Bash, Read, Glob, Grep]
model: haiku
color: purple
---
```

## Model Selection Decision Tree

```
Start: Choosing Agent Model
    |
    +-- Does the task require creative reasoning, code generation,
    |   architectural decisions, or nuanced content creation?
    |   |
    |   +-- Yes --> Opus (omit model field)
    |   |
    |   +-- No --> Does the task require applying rules, validating
    |              against checklists, or following structured procedures?
    |              |
    |              +-- Yes --> Sonnet (model: sonnet)
    |              |
    |              +-- No --> Is the task purely mechanical with
    |                         no reasoning required?
    |                         |
    |                         +-- Yes --> Haiku (model: haiku)
    |                         |
    |                         +-- No --> Default to Sonnet
    |                                    (safer than haiku for
    |                                     ambiguous cases)
```

## Justification Requirement

Every agent MUST include a **Model Selection Justification** block in its markdown body explaining why the chosen tier is appropriate. This block appears near the top of the agent file, after the frontmatter metadata section.

**Format**:

```markdown
**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- [Capability 1] to [accomplish task aspect]
- [Capability 2] to [accomplish task aspect]
```

**Examples**:

For a checker agent:

> **Model Selection Justification**: This agent uses `model: sonnet` because it requires:
>
> - Systematic rule application to validate content against defined checklists
> - Structured report generation following the audit report template
> - Pattern recognition to identify convention violations across files

For a developer agent (omit model field — inherits opus):

> **Model Selection Justification**: This agent uses inherited `model: opus` (omit model field) because it requires:
>
> - Advanced reasoning to generate idiomatic code across language paradigms
> - Multi-step problem decomposition for complex refactoring tasks
> - Creative synthesis to design APIs and data models

For a deployer agent:

> **Model Selection Justification**: This agent uses `model: haiku` because it requires:
>
> - Execution of predefined git and deployment commands
> - No analytical reasoning beyond following a fixed procedure

## Tier Comparison Summary

| Dimension              | Opus (inherit)                                                                                        | Sonnet                                                                                                  | Haiku                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Reasoning depth**    | Deep, multi-step                                                                                      | Moderate, rule-based                                                                                    | Minimal, mechanical                                                                                    |
| **Creativity**         | High (novel solutions)                                                                                | Low (follows templates)                                                                                 | None (fixed procedures)                                                                                |
| **Task ambiguity**     | Handles open-ended problems                                                                           | Handles structured problems                                                                             | Requires deterministic flow                                                                            |
| **Output originality** | Creates new content/code                                                                              | Transforms per rules                                                                                    | Executes predefined steps                                                                              |
| **Error recovery**     | Adapts to unexpected states                                                                           | Follows fallback rules                                                                                  | Fails or retries                                                                                       |
| **Typical agents**     | Creative makers, developers                                                                           | Checkers, fixers, structured makers                                                                     | Deployers, link checkers, file manager                                                                 |
| **SWE-bench Verified** | [87.6%](../../../docs/reference/ai-model-benchmarks.md#claude-opus-47) (Verified, Anthropic Apr 2026) | [79.6%](../../../docs/reference/ai-model-benchmarks.md#claude-sonnet-46) (Verified, Anthropic Feb 2026) | [73.3%](../../../docs/reference/ai-model-benchmarks.md#claude-haiku-45) (Verified, Anthropic Oct 2025) |

## Common Mistakes

| Mistake                                   | Problem                                                                                       | Correction                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Using opus for validation tasks           | Wastes resources; opus may over-interpret instead of checking                                 | Use sonnet for checkers and fixers                          |
| Using haiku for content creation          | Haiku lacks reasoning depth for original content                                              | Use opus (inherit) for makers and developers                |
| Using sonnet for deployment scripts       | Sonnet is overqualified for deterministic command sequences                                   | Use haiku for deployers and link checkers                   |
| Omitting model justification              | Future maintainers cannot assess whether the tier is appropriate                              | Always include Model Selection Justification block          |
| Defaulting to opus "just in case"         | Violates Simplicity Over Complexity principle                                                 | Analyze task requirements; use the simplest adequate tier   |
| Using haiku for tasks with error handling | Haiku cannot reason about unexpected states                                                   | Use sonnet or opus depending on error complexity            |
| Adding `model: opus` to opus-tier agents  | Bypasses budget-adaptive inheritance; forces Opus charges on users regardless of account tier | Omit the field — inherit session model to match user's tier |

## Current Model Versions (April 2026)

| Claude Code alias | Model ID                    | Context     | Notes                      | Benchmark                                                                     |
| ----------------- | --------------------------- | ----------- | -------------------------- | ----------------------------------------------------------------------------- |
| `opus` (inherit)  | `claude-opus-4-7`           | 1M tokens   | Current top tier           | [Benchmarks](../../../docs/reference/ai-model-benchmarks.md#claude-opus-47)   |
| `sonnet`          | `claude-sonnet-4-6`         | 1M tokens   | Daily driver               | [Benchmarks](../../../docs/reference/ai-model-benchmarks.md#claude-sonnet-46) |
| `haiku`           | `claude-haiku-4-5-20251001` | 200k tokens | Haiku 3 retired 2026-04-19 | [Benchmarks](../../../docs/reference/ai-model-benchmarks.md#claude-haiku-45)  |

Aliases (`opus`, `sonnet`, `haiku`) automatically track future model versions within each
tier. The model IDs above are current as of April 2026.

## OpenCode / GLM Equivalents

Agents in `.claude/agents/` are auto-synced to `.opencode/agents/` by rhino-cli
(`npm run sync:claude-to-opencode`). The sync translates Claude model aliases to
Zhipu AI (Z.ai) GLM model IDs.

### Model ID Mapping

| Claude Code              | OpenCode                      | Capability notes                                      |
| ------------------------ | ----------------------------- | ----------------------------------------------------- |
| omit (opus-tier inherit) | `zai-coding-plan/glm-5.1`     | 744B MoE; SWE-Bench Pro 58.4; ≈ Opus 4.6 class        |
| `model: sonnet`          | `zai-coding-plan/glm-5.1`     | Same GLM model as opus-tier (no separate sonnet tier) |
| `model: haiku`           | `zai-coding-plan/glm-5-turbo` | Purpose-built for agentic tool-calling and throughput |

**Note**: GLM-5-turbo has no published standard benchmark scores (no SWE-bench, GPQA, or HumanEval). See [benchmark reference](../../../docs/reference/ai-model-benchmarks.md#glm-5-turbo) for details.

### 3-to-2 Tier Collapse

Claude Code has three tiers (Opus 4.7 > Sonnet 4.6 > Haiku 4.5). GLM Coding Plan has
two: `glm-5.1` (top) and `glm-5-turbo` (fast/agentic). Opus-tier and sonnet-tier agents
both use `glm-5.1` in OpenCode because GLM-5.1 is the single best available option.

This collapse is an acceptable platform-level constraint. Claude Code tier assignments
govern behavior in Claude sessions (the primary runtime). OpenCode uses the best available
GLM model for all non-haiku work.

### Why No Separate GLM Opus Tier

GLM-5.1 benchmarks at SWE-Bench Pro 58.4, comparable to Claude Opus 4.6 (57.3) but below
Opus 4.7. No GLM model currently exceeds Opus 4.7 capability. Using `glm-5.1` for
opus-tier agents is the best available option, not a perfect equivalence.

## Special Considerations

### Borderline Cases

Some agents straddle tier boundaries. When uncertain:

1. **Analyze the core loop** -- what does the agent do repeatedly? If the core loop is rule application, use sonnet even if setup requires some reasoning.
2. **Consider the failure mode** -- if the agent picks a wrong approach, how bad is the outcome? Higher-stakes failures justify a higher tier.
3. **Start lower, promote if needed** -- begin with sonnet; promote to opus only if quality issues emerge in practice.

### Link Checkers as Haiku

Link checker agents (docs-link-checker, apps-ayokoding-web-link-checker) use haiku despite being categorized as checkers (green). This is because their validation is purely mechanical (HTTP status code checking), not rule-based reasoning. The checker color reflects their role in the maker-checker-fixer workflow, while the model reflects their cognitive requirements.

### Social Media Maker as Sonnet

The social-linkedin-post-maker uses sonnet despite being a "maker" agent. This is because LinkedIn post generation follows a rigid template and tone guide, making it a structured pattern-following task rather than creative content creation.

### Structured Makers as Sonnet

Several maker agents use sonnet because their output is structured by tight skills with well-defined rubrics (docs-maker, readme-maker, agent-maker, specs-maker, repo-workflow-maker, apps-oseplatform-web-content-maker, apps-ayokoding-web-by-example-maker, apps-ayokoding-web-general-maker, apps-ayokoding-web-in-the-field-maker, repo-rules-maker, repo-ose-primer-adoption-maker, repo-ose-primer-propagation-maker). Each has a sonnet checker and sonnet fixer in its maker-checker-fixer trio, and the skill pins down most decisions. Contrast with opus-tier makers (plan-maker, docs-tutorial-maker, swe-ui-maker) where the creative work is open-ended, pedagogically demanding, or multi-concern.

### E2E Test Developer as Sonnet

The swe-e2e-dev uses sonnet despite the other 12 language developer agents being opus. Playwright E2E tests are pattern-driven (locators, fixtures, waits) with a dedicated skill, and test code regressions surface fast in CI. Production application code written by the language developers has higher stakes and unforgiving idioms, justifying their continued opus tier.

### File Manager as Haiku

The docs-file-manager uses haiku despite being categorized as a fixer (yellow). This is because its operations are deterministic file manipulation (`git mv`, `git rm`, find-and-replace link updates) with no judgment calls. The `agent-developing-agents` skill cites it as the canonical haiku example.

### Link Fixer as Haiku

The apps-ayokoding-web-link-fixer uses haiku despite being a fixer (yellow) — previously sonnet. Its work is deterministic URL replacement driven entirely by a checker audit report: no independent link analysis, no content reasoning, just old-URL → new-URL substitution followed by an HTTP status re-check. Haiku 4.5 (73.3% SWE-bench Verified — [benchmark reference](../../../docs/reference/ai-model-benchmarks.md#claude-haiku-45)) is fully sufficient and costs 5× less per token than Sonnet. This is the fixer analogue of the Link Checkers as Haiku rule above.

## Tools and Automation

The following agents enforce or assist with model selection:

- **agent-maker** -- applies these guidelines when creating new agents
- **repo-rules-checker** -- validates that all agents have model justification blocks and appropriate tier assignments
- **repo-rules-fixer** -- corrects model selection issues identified by the checker

## References

**Related Development Practices:**

- [AI Agents Convention](./ai-agents.md) -- Complete agent standards including frontmatter, naming, and tool permissions
- [Best Practices](./best-practices.md) -- Recommended agent development patterns
- [Anti-Patterns](./anti-patterns.md) -- Common agent development mistakes

**Related Principles:**

- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) -- Use the simplest model that works
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) -- Justify model selection transparently
- [Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md) -- Analyze task requirements before selecting

**Related Conventions:**

- [Content Quality Principles](../../conventions/writing/quality.md) -- Quality standards for justification text

**Agents:**

- `agent-maker` -- Creates agents following these model selection standards
- `repo-rules-checker` -- Validates model selection compliance
- `repo-rules-fixer` -- Fixes model selection issues
