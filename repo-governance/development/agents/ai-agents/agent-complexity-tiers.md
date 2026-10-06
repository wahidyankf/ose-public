---
description: "Defines the three agent complexity tiers by scope and reasoning depth; file size is governed solely by the word budget."
when_to_use: Use when deciding which complexity tier a new or existing agent belongs to.
---

# Agent Complexity Tiers

## Tiers by Agent Complexity

Agent files are organized into **three complexity tiers**. The tiers describe scope and reasoning
depth, not file size: every agent definition is held to the same limit by the
[Governance Word-Budget Convention](../../../conventions/structure/governance-word-budget.md),
whose thresholds live in `repo-config.yml` and are checked on demand by `./rhino governance word-budget validate`.

**Rationale**: Research shows LLMs follow ~150-200 instructions reliably, with quality degrading as count increases. While agents are only loaded when spawned (unlike AGENTS.md which is universally included), keeping them focused improves effectiveness.

### Tier 1: Simple Agents (Deployers, Specialized Operations)

**Characteristics**:

- Single, straightforward responsibility
- Minimal decision logic
- Limited tool usage (typically Bash only for deployers)
- Few edge cases to handle
- Direct, linear workflows

**Examples**:

- social-linkedin-post-maker (single-purpose content generation)
- repo-workflow-maker (workflow document creation)

**When to use this tier**:

- Agent performs one specific operation repeatedly
- Minimal validation or error handling needed
- Clear success/failure conditions
- No complex orchestration

### Tier 2: Standard Agents (Makers, Checkers, Validators)

**Characteristics**:

- Moderate complexity with clear domain
- Multiple related responsibilities
- Comprehensive validation or creation logic
- Moderate edge case handling
- Structured workflows with phases

**Examples**:

- docs-maker (documentation creation)
- docs-checker (factual verification)
- docs-tutorial-checker (tutorial quality validation)
- docs-file-manager (file organization, relative path calculation, link updates)
- agent-maker (agent creation automation)
- apps-ayokoding-www-general-maker (general Next.js content creation for ayokoding-www)
- apps-ayokoding-www-by-example-maker (by-example tutorial creation)
- apps-ose-www-content-maker (Next.js content creation for ose-www)

**When to use this tier**:

- Agent creates or validates content
- Requires moderate decision-making
- Follows established patterns
- Handles multiple related tasks within a domain

### Tier 3: Complex Agents (Planners, Orchestrators, Comprehensive Validators)

**Characteristics**:

- High complexity with multiple interconnected concerns
- Advanced reasoning and pattern recognition
- Multi-step orchestration
- Extensive edge case handling
- Complex validation or planning logic
- Cross-cutting concerns

**Examples**:

- plan-maker (comprehensive project planning)
- plan-checker (pre-implementation validation)
- rules-maker (cascading updates across files)
- rules-checker (comprehensive consistency validation)
- docs-link-checker (external/internal link validation with caching)

**When to use this tier**:

- Agent orchestrates multiple phases or agents
- Requires advanced reasoning
- Handles complex dependencies
- Manages cascading impacts
- Performs comprehensive validation
