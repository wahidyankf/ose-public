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

## File Operations in .claude/ and .opencode/ Directories

Use the normal `Write` / `Edit` tools to create and modify files under `.claude/` and `.opencode/`. Both paths are pre-authorized in `.claude/settings.json` (`Write(.claude/**)`, `Edit(.claude/**)`, `Write(.opencode/**)`, `Edit(.opencode/**)`), so no approval prompts fire. `Bash` heredoc and `sed` remain appropriate for bulk mechanical substitutions across many files, but there is no restriction on direct edits.

This applies to:

- `.claude/agents/*.md` — agent definitions
- `.claude/skills/*/SKILL.md` — skill files
- `.claude/skills/*/reference/*.md` — skill reference modules
- `.opencode/agent/*.md` — OpenCode agent mirrors
- `.opencode/skill/*/SKILL.md` — OpenCode skill mirrors

After editing `.claude/` sources, run `npm run sync:claude-to-opencode` so the `.opencode/` mirrors stay aligned. The pre-commit hook validates both formats.

## References

[AI Agents Convention](../../../governance/development/agents/ai-agents.md)

## Tool Usage Documentation

Agents should document which tools they use and why, helping users understand capabilities and maintainers understand dependencies.

### Tool Documentation Pattern

Add "Tools Usage" section (optional but recommended) listing each tool with its purpose:

```markdown
## Tools Usage

- **Read**: Read files to validate/create/fix
- **Glob**: Find files by pattern in directories
- **Grep**: Extract content patterns (code blocks, commands, etc.)
- **Write**: Create/update files and reports
- **Bash**: Generate UUIDs, timestamps, file operations
- **Edit**: Apply fixes to existing files
- **WebFetch**: Access official documentation URLs
- **WebSearch**: Find authoritative sources, verify claims
```

### When to Document Tools

**Recommended for**:

- Agents with 4+ tools (helps users understand capabilities)
- Agents where tool selection isn't obvious
- Agents with unusual tool combinations
- Reference documentation for complex agents

**Optional for**:

- Simple agents with 2-3 obvious tools
- Agents following standard patterns

### Tool Documentation Examples

**Checker Agents** (Read, Glob, Grep, Write, Bash, WebFetch, WebSearch):

```markdown
## Tools Usage

- **Read**: Read documentation files to validate
- **Glob**: Find markdown files in directories
- **Grep**: Extract code blocks, commands, version numbers
- **Write**: Generate audit reports to generated-reports/
- **Bash**: Generate UUIDs, timestamps for reports
- **WebFetch**: Access official documentation URLs
- **WebSearch**: Find versions, verify tools, fallback for 403s
```

**Fixer Agents** (Read, Edit, Bash, Write):

```markdown
## Tools Usage

- **Read**: Read audit reports and files to fix
- **Edit**: Apply fixes to docs/, governance/, `.claude/`, and `.opencode/` files
- **Bash**: Run shell commands, bulk sed substitutions across many files, timestamp/UUID generation
- **Write**: Generate fix reports to generated-reports/
```

**Maker Agents** (Read, Write, Glob, Grep, Bash):

```markdown
## Tools Usage

- **Read**: Read existing files for context
- **Write**: Create new documentation, agent, and skill files (including under `.claude/` and `.opencode/`)
- **Glob**: Find related files for cross-references
- **Grep**: Extract patterns for consistency
- **Bash**: Run shell commands, bulk text substitutions, directory creation
```

### Placement

Add "Tools Usage" section:

- After "Core Responsibility" or main description
- Before detailed workflow sections
- Near top for quick reference

## When to Use This Agent

Agents should include guidance on when to use them vs other agents, improving discoverability and preventing misuse.

### When to Use Pattern

Add "When to Use This Agent" section with two subsections:

```markdown
## When to Use This Agent

**Use when**:

- [Primary use case 1]
- [Primary use case 2]
- [Primary use case 3]
- [Specific scenario that fits]

**Do NOT use for**:

- [Anti-pattern 1] (use [other-agent] instead)
- [Anti-pattern 2] (use [alternative-tool/approach])
- [Edge case that doesn't fit]
- [Common misuse scenario]
```

### When to Include

**Highly Recommended for**:

- Agents with overlapping scopes (e.g., multiple checkers)
- Agents that users might confuse (e.g., maker vs editor)
- Agents with specific prerequisites (e.g., needs audit report)
- Specialized agents with narrow focus

**Examples by Agent Type**:

**Checker Agents**:

```markdown
## When to Use This Agent

**Use when**:

- Validating [domain] content before release
- Checking [domain] after updates
- Reviewing community contributions
- Auditing [domain] for compliance

**Do NOT use for**:

- Link checking (use [link-checker] instead)
- File naming/structure (use [rules-checker])
- Creating new content (use [maker-agent])
- Fixing issues (use [fixer-agent] after review)
```

**Fixer Agents**:

```markdown
## When to Use This Agent

**Use when**:

- After running [checker-agent] - You have an audit report
- Issues found and reviewed - You've reviewed checker's findings
- Automated fixing needed - You want validated issues fixed
- Safety is critical - You need re-validation before changes

**Do NOT use for**:

- Initial validation (use [checker-agent])
- Content creation (use [maker-agent])
- Manual fixes (use Edit tool directly)
- When no audit report exists
```

**Maker Agents**:

```markdown
## When to Use This Agent

**Use when**:

- Creating new [domain] content
- Need standardized structure/format
- Following [domain] conventions
- Building content from templates

**Do NOT use for**:

- Validating existing content (use [checker-agent])
- Fixing issues (use [fixer-agent])
- Bulk updates (use Edit tool for simple changes)
- Content outside [domain] scope
```

### Placement

Add "When to Use This Agent" section:

- After agent description or core responsibility
- Before detailed workflow/process sections
- Early in file for quick reference

### Benefits

✅ Improves agent discoverability
✅ Prevents misuse and confusion
✅ Clarifies agent boundaries
✅ Guides users to appropriate alternatives
✅ Reduces trial-and-error

## Updated References

[AI Agents Convention - Complete specification](../../../governance/development/agents/ai-agents.md)
[Agent Documenting References Skill](./SKILL.md)
[Agent Selecting Models Skill](./SKILL.md)

---

# Documenting Agent References

Standard structure for "Reference Documentation" sections in agent files to ensure consistent navigation and discoverability.

## When This Skill Loads

This Skill auto-loads when implementing agents or updating agent documentation sections.

## Reference Documentation Section

All agents SHOULD include a "Reference Documentation" section near the end (before any appendices) with standardized subsections.

### Section Template

```markdown
## Reference Documentation

**Project Guidance**:

- [AGENTS.md](../../../CLAUDE.md) - Primary guidance for OpenCode
- [Agent-specific convention](path/to/convention.md) - Domain-specific standards

**Related Agents**:

- `maker-agent` - Creates content for this domain
- `checker-agent` - Validates content (upstream dependency)
- `fixer-agent` - Fixes issues found by checker
- `related-domain-agent` - Related functionality

**Related Conventions**:

- [Primary Convention](path/to/convention.md) - Main standards this agent implements
- [Secondary Convention](path/to/convention.md) - Additional relevant standards

**Skills**:

- `primary-skill` - Main Skill for domain knowledge
- `wow-assessing-criticality-confidence` - Criticality assessment (if applicable)
- `wow-generating-validation-reports` - Report generation (if applicable)
```

### Subsection Details

#### Project Guidance

**Purpose**: Link to primary project instructions and domain-specific conventions.

**Always Include**:

- AGENTS.md.\*primary guidance for all agents)

**Conditionally Include**:

- Domain-specific conventions (e.g., README Quality Convention for readme-agents)
- Framework-specific guidance (e.g., Next.js guide for ayokoding-web-agents)
- Special standards relevant to agent's scope

**Pattern**:

```markdown
**Project Guidance**:

- [AGENTS.md](../../../CLAUDE.md) - Primary guidance
- [Specific Convention](path/to/convention.md) - Domain standards
```

#### Related Agents

**Purpose**: Help users understand agent ecosystem and workflow relationships.

**Include**:

- **Upstream agents**: Agents this agent depends on (e.g., checker for fixer)
- **Downstream agents**: Agents that depend on this one (e.g., fixer for checker)
- **Parallel agents**: Agents in same family/domain (e.g., other checkers)
- **Complementary agents**: Agents with related functionality

**Organize by Relationship**:

```markdown
**Related Agents**:

- `upstream-agent` - Description of relationship
- `downstream-agent` - Description of relationship
- `parallel-agent` - Description of functionality
```

**Examples by Agent Type**:

**Maker Agents**:

```markdown
- `checker-agent` - Validates content created by this maker
- `related-maker` - Creates content in related domain
```

**Checker Agents**:

```markdown
- `maker-agent` - Creates content this checker validates
- `fixer-agent` - Fixes issues found by this checker
- `related-checker` - Validates related aspects
```

**Fixer Agents**:

```markdown
- `checker-agent` - Generates audit reports this fixer processes
- `maker-agent` - Updates content after fixes applied
```

#### Related Conventions

**Purpose**: Link to conventions and development practices the agent implements.

**Include**:

- Primary convention agent implements
- Secondary conventions relevant to agent's scope
- Development practices agent follows (e.g., AI Agents Convention)
- Standards agent enforces (for checkers)

**Pattern**:

```markdown
**Related Conventions**:

- [Primary Convention](path/to/convention.md) - Main standards
- [Secondary Convention](path/to/convention.md) - Additional standards
- [Development Practice](path/to/practice.md) - Implementation guidance
```

**Checkers Should List**:

- Conventions they validate against
- Quality standards they enforce

**Makers Should List**:

- Conventions they follow when creating content
- Formatting standards they apply

#### Skills

**Purpose**: Reference Skills the agent uses for domain knowledge and patterns.

**Include**:

- All Skills listed in agent's `skills:` frontmatter field
- Skills should be listed without path (just skill name)
- Brief description of what each Skill provides

**Pattern**:

```markdown
**Skills**:

- `domain-skill` - Domain-specific knowledge
- `wow-skill` - Cross-cutting pattern or workflow
- `agent-skill` - Agent development guidance
```

**Note**: Skills section duplicates frontmatter `skills:` field for documentation visibility.

## Placement in Agent Files

**Recommended Location**: Near end of agent file, before any appendices or examples.

**Typical Structure**:

```markdown
# Agent Name

## Agent Metadata

- **Role**: [Maker (blue) / Checker (green) / Fixer (yellow) / Implementor (purple)]
- **Created**: YYYY-MM-DD
- **Last Updated**: YYYY-MM-DD

[Agent description]

## Core Responsibility

[What agent does]

## Main Content Sections

[Detailed agent instructions]

## Reference Documentation

[Reference sections using template above]

## Appendices (Optional)

[Additional examples, edge cases, etc.]
```

## Examples by Agent Family

### docs-family Agents

```markdown
## Reference Documentation

**Project Guidance**:

- [AGENTS.md](../../../CLAUDE.md) - Primary guidance
- [Content Quality Principles](../../../governance/conventions/writing/quality.md)
- [Diátaxis Framework](../../../governance/conventions/structure/diataxis-framework.md)

**Related Agents**:

- `docs-maker` - Creates documentation
- `docs-checker` - Validates documentation
- `docs-fixer` - Fixes documentation issues
- `docs-tutorial-checker` - Specialized tutorial validation

**Related Conventions**:

- [Content Quality Principles](../../../governance/conventions/writing/quality.md)
- [Factual Validation Convention](../../../governance/conventions/writing/factual-validation.md)
- [Linking Convention](../../../governance/conventions/formatting/linking.md)

**Skills**:

- `docs-applying-content-quality` - Content quality standards
- `docs-validating-factual-accuracy` - Fact-checking methodology
- `wow-assessing-criticality-confidence` - Criticality assessment
- `wow-generating-validation-reports` - Report generation
```

### readme-family Agents

```markdown
## Reference Documentation

**Project Guidance**:

- [AGENTS.md](../../../CLAUDE.md) - Primary guidance
- [README Quality Convention](../../../governance/conventions/writing/readme-quality.md)

**Related Agents**:

- `readme-maker` - Creates README content
- `readme-checker` - Validates README quality
- `readme-fixer` - Fixes README issues
- `docs-checker` - Validates other documentation

**Related Conventions**:

- [README Quality Convention](../../../governance/conventions/writing/readme-quality.md)
- [Content Quality Principles](../../../governance/conventions/writing/quality.md)

**Skills**:

- `readme-writing-readme-files` - README-specific standards
- `wow-assessing-criticality-confidence` - Criticality assessment
- `wow-generating-validation-reports` - Report generation
```

### plan-family Agents

```markdown
## Reference Documentation

**Project Guidance**:

- [AGENTS.md](../../../CLAUDE.md) - Primary guidance
- [Plans Organization Convention](../../../governance/conventions/structure/plans.md)

**Related Agents**:

- `plan-maker` - Creates project plans
- `plan-checker` - Validates plan quality
- `plan-executor` - Executes plans
- `plan-execution-checker` - Validates completed work
- `plan-fixer` - Fixes plan issues

**Related Conventions**:

- [Plans Organization Convention](../../../governance/conventions/structure/plans.md)
- [Gherkin Acceptance Criteria](../../../governance/development/infra/acceptance-criteria.md)

**Skills**:

- `plan-creating-project-plans` - Plan structure and organization
- `plan-writing-gherkin-criteria` - Acceptance criteria patterns
- `wow-assessing-criticality-confidence` - Criticality assessment
```

## Benefits of Standardization

✅ **Improved Discoverability**: Users can quickly find related agents and conventions  
✅ **Consistent Navigation**: Same structure across all agents  
✅ **Clear Relationships**: Understand agent dependencies and workflows  
✅ **Better Maintainability**: Easy to update references across agents  
✅ **Enhanced Documentation**: Skills and conventions properly referenced

## Best Practices

1. **Keep Links Current**: Update when conventions move or rename
2. **Be Selective**: Only include truly relevant references
3. **Describe Relationships**: Explain how related agents connect
4. **Match Frontmatter**: Ensure Skills section matches `skills:` field
5. **Use Relative Paths**: Make links work from agent file location
6. **Group Logically**: Keep subsections organized and scannable

## Key Takeaways

- **Standard structure**: Use consistent subsections across all agents
- **Four subsections**: Project Guidance, Related Agents, Related Conventions, Skills
- **Clear relationships**: Help users understand agent ecosystem
- **Proper placement**: Near end of agent file before appendices
- **Keep current**: Update references when files move or change
- **Match frontmatter**: Skills section mirrors `skills:` field

This standardization improves agent documentation consistency and helps users navigate the agent ecosystem effectively.

---

# Selecting AI Models for Agents

Guidelines for choosing between sonnet and haiku models based on agent capabilities and task requirements.

## When This Skill Loads

This Skill auto-loads when implementing agents or documenting model selection rationale.

## Available Models

### Sonnet (claude-sonnet-4-5)

**Characteristics**:

- Advanced reasoning capabilities
- Complex decision-making
- Deep pattern recognition
- Sophisticated analysis
- Multi-step orchestration
- Higher cost, slower performance

**Use for**: Complex, reasoning-intensive tasks

### Haiku (claude-haiku-3-5)

**Characteristics**:

- Fast execution
- Straightforward tasks
- Pattern matching
- Simple decision-making
- Cost-effective
- Lower cost, faster performance

**Use for**: Simple, well-defined tasks

## Decision Framework

### Use Sonnet When Task Requires

✅ **Advanced Reasoning**

- Analyzing technical claims for subtle contradictions
- Distinguishing objective errors from subjective improvements
- Detecting false positives in validation findings
- Context-dependent decision-making
- Inferring user intent from ambiguous requests

✅ **Complex Pattern Recognition**

- Cross-referencing multiple documentation files
- Identifying conceptual duplications (not just verbatim)
- Detecting inconsistencies across architectural layers
- Understanding domain-specific patterns
- Recognizing semantic similarities

✅ **Sophisticated Analysis**

- Verifying factual accuracy against authoritative sources
- Assessing confidence levels (HIGH/MEDIUM/FALSE_POSITIVE)
- Evaluating code quality and architectural decisions
- Analyzing narrative flow and pedagogical structure
- Determining fix safety and impact

✅ **Multi-Step Orchestration**

- Coordinating complex validation workflows
- Managing dependencies between validation steps
- Iterative refinement processes
- Dynamic workflow adaptation
- Error recovery and retry logic

✅ **Deep Web Research**

- Finding and evaluating authoritative sources
- Comparing claims against official documentation
- Version verification across multiple registries
- API correctness validation
- Detecting outdated information

### Use Haiku When Task Is

✅ **Pattern Matching**

- Extracting URLs from markdown files
- Finding code blocks by language
- Matching file naming patterns
- Regular expression searches
- Simple syntax validation

✅ **Sequential Execution**

- File existence checks
- URL accessibility validation
- Cache file reading/writing
- Date comparisons
- Status reporting

✅ **Straightforward Validation**

- Checking if files exist
- Verifying link format (contains `.md`)
- Counting lines or characters
- Comparing timestamps
- Simple YAML/JSON parsing

✅ **No Complex Reasoning**

- Tasks with clear pass/fail criteria
- No ambiguity or judgment required
- Deterministic outcomes
- No context analysis needed
- No trade-off decisions

✅ **High-Volume Processing**

- Checking hundreds of links
- Validating many files
- Batch operations
- Performance-critical tasks
- Cost-sensitive operations

## Model Selection Matrix

| Task Type          | Complexity  | Reasoning Required          | Recommended Model |
| ------------------ | ----------- | --------------------------- | ----------------- |
| Content creation   | High        | Yes (narrative, structure)  | **Sonnet**        |
| Factual validation | High        | Yes (source evaluation)     | **Sonnet**        |
| Quality assessment | High        | Yes (subjective judgment)   | **Sonnet**        |
| Fix application    | Medium-High | Yes (confidence assessment) | **Sonnet**        |
| Link checking      | Low         | No (exists/accessible)      | **Haiku**         |
| File operations    | Low         | No (read/write/move)        | **Haiku**         |
| Pattern extraction | Low         | No (regex matching)         | **Haiku**         |
| Cache management   | Low         | No (read/write/compare)     | **Haiku**         |

## Agent-Specific Examples

### Sonnet Examples

**docs-checker** (Complex validation):

```yaml
model: sonnet
```

**Reasoning**:

- Analyzes technical claims for contradictions
- Deep web research for fact verification
- Pattern recognition across multiple files
- Complex decision-making for criticality levels
- Multi-step validation orchestration

**docs-fixer** (Sophisticated analysis):

```yaml
model: sonnet
```

**Reasoning**:

- Re-validates findings to detect false positives
- Distinguishes objective errors from subjective improvements
- Assesses confidence levels (HIGH/MEDIUM/FALSE_POSITIVE)
- Complex decision-making for fix safety
- Trust model analysis (when to trust checker)

**docs-tutorial-checker** (Pedagogical analysis):

```yaml
model: sonnet
```

**Reasoning**:

- Evaluates narrative flow and learning progression
- Assesses hands-on element quality
- Analyzes visual completeness
- Determines tutorial type compliance
- Sophisticated quality judgment

### Haiku Examples

**docs-link-general-checker** (Straightforward validation):

```yaml
model: haiku
```

**Reasoning**:

- Pattern matching to extract URLs
- Sequential URL validation via requests
- File existence checks for internal references
- Cache management (read/write YAML, compare dates)
- Simple status reporting (working/broken/redirected)
- No complex reasoning required

**docs-file-manager** (File operations):

```yaml
model: haiku
```

**Reasoning**:

- Straightforward file operations (move, rename, delete)
- Simple path manipulation
- Git history preservation (scripted commands)
- No complex decision-making
- Deterministic outcomes

## Documenting Model Selection

### Model Selection Justification Pattern

Include in agent documentation to explain model choice:

**For Sonnet Agents**:

```markdown
**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- [Reasoning capability 1 - e.g., "Advanced reasoning to analyze technical claims"]
- [Reasoning capability 2 - e.g., "Deep web research to verify facts"]
- [Reasoning capability 3 - e.g., "Pattern recognition across multiple files"]
- [Decision-making type - e.g., "Complex decision-making for criticality levels"]
- [Orchestration need - e.g., "Multi-step validation workflow orchestration"]
```

**For Haiku Agents**:

```markdown
**Model Selection Justification**: This agent uses `model: haiku` because it performs straightforward tasks:

- [Simple task 1 - e.g., "Pattern matching to extract URLs"]
- [Simple task 2 - e.g., "Sequential URL validation via web requests"]
- [Simple task 3 - e.g., "File existence checks"]
- [Simple task 4 - e.g., "Cache management (read/write/compare)"]
- [Simple task 5 - e.g., "Simple status reporting"]
- No complex reasoning or content generation required
```

### Placement in Agent Files

Add justification near the top of agent file, after agent description:

```markdown
---
name: example-agent
description: Agent description here
model: sonnet
---

# Agent Name

## Agent Metadata

- **Role**: [Role description]
- **Created**: YYYY-MM-DD
- **Last Updated**: YYYY-MM-DD

**Model Selection Justification**: [justification here]

[Rest of agent documentation]
```

## Cost and Performance Considerations

### Sonnet Trade-offs

**Costs**:

- Higher per-token cost (~10x haiku)
- Slower response time
- More resource-intensive

**Benefits**:

- Higher quality reasoning
- Better context understanding
- More accurate decisions
- Handles ambiguity well

**Use when**: Quality and accuracy more important than cost/speed

### Haiku Trade-offs

**Benefits**:

- Lower per-token cost (~10x cheaper)
- Faster response time
- Efficient for high-volume tasks

**Limitations**:

- Less sophisticated reasoning
- May struggle with ambiguity
- Better for deterministic tasks

**Use when**: Cost and speed more important than complex reasoning

## Decision Checklist

Before selecting a model, ask:

1. **Does the task require judgment calls?**
   - Yes → Sonnet
   - No → Haiku

2. **Are there multiple valid interpretations?**
   - Yes → Sonnet
   - No → Haiku

3. **Does it need deep analysis of context?**
   - Yes → Sonnet
   - No → Haiku

4. **Will it make complex decisions?**
   - Yes → Sonnet
   - No → Haiku

5. **Is it high-volume, low-complexity?**
   - Yes → Haiku
   - No → Sonnet

6. **Does cost matter more than quality?**
   - Yes → Haiku
   - No → Sonnet

## Common Mistakes

❌ **Using Sonnet for Simple Tasks**:

```yaml
# Overkill - use haiku
model: sonnet # Just checking if files exist
```

❌ **Using Haiku for Complex Analysis**:

```yaml
# Insufficient - use sonnet
model: haiku # Analyzing code quality and architecture
```

✅ **Match Model to Task Complexity**:

```yaml
# Simple pattern matching
model: haiku

# Complex reasoning
model: sonnet
```

## Key Takeaways

- **Sonnet** = Complex reasoning, sophisticated analysis, multi-step orchestration
- **Haiku** = Simple tasks, pattern matching, straightforward validation
- **Document rationale** = Include model selection justification in agent files
- **Consider trade-offs** = Balance cost/speed vs quality/capability
- **Match complexity** = Use appropriate model for task requirements
- **When in doubt** = Choose sonnet for quality, haiku for speed/cost

Proper model selection ensures optimal performance, cost-effectiveness, and task completion quality.
