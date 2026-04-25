---
title: How to Create a New Skill
description: Guide for creating a new Skill in .claude/skills/ for Claude Code's Skills auto-loading feature
category: how-to
tags:
  - skills
  - ai-agents
  - claude-code
created: 2026-02-01
---

# How to Create a New Skill

This guide explains how to create a new Skill in `.claude/skills/` for Claude Code's Skills auto-loading feature.

## Prerequisites

- Familiarity with [AI Agents Convention](../../governance/development/agents/ai-agents.md) (Skills field requirements)
- Understanding of [Repository Architecture](../../governance/repository-governance-architecture.md) (Skills as Layer 2 delivery infrastructure)
- Review existing Skills in `.claude/skills/` for reference

## When to Create a Skill

Create a new Skill when you need to:

- **Encode complex conventions** that are referenced by multiple agents (inline mode)
- **Provide reusable knowledge** across different agent workflows (inline mode)
- **Reduce agent file sizes** by extracting common knowledge (inline mode)
- **Enable progressive disclosure** (Skills auto-load only when relevant) (inline mode)
- **Compose knowledge** (agents can reference multiple Skills) (inline mode)
- **Delegate specialized tasks** to focused agents in isolated contexts (fork mode)

**Skill Modes**:

- **Inline Skills** (default) - Inject knowledge into current conversation
- **Fork Skills** (`context: fork`) - Spawn isolated agent contexts for focused work

**Do NOT create a Skill when**:

- Information belongs in a convention document (Skills reference conventions, not replace them)
- Knowledge is specific to a single agent (keep it in the agent file)
- Content is simple enough for CLAUDE.md (Skills are for complex, detailed knowledge)
- Task can be handled in main conversation (no need for fork skill)

## Decision: Single-File vs Multi-File Structure

### Single-File Structure (TEMPLATE.md)

Use when:

- Total content < 1,000 lines
- Knowledge is cohesive and doesn't naturally split
- Primarily conceptual (minimal code examples or tables)
- Quick reference is the primary use case

**Example Skills**:

- `wow__applying-maker-checker-fixer` (workflow knowledge)
- `wow__practicing-trunk-based-development` (git workflow)
- `plan__writing-gherkin-criteria` (BDD syntax)

### Multi-File Structure (MULTI-FILE-TEMPLATE/)

Use when:

- Total content exceeds ~1,000 lines
- Knowledge naturally splits into conceptual vs. reference vs. examples
- Detailed tables/matrices needed
- Multiple working code examples needed
- Progressive disclosure benefits users (concepts → specifications → examples)

**Example Skills**:

- `docs__creating-accessible-diagrams` (SKILL.md + examples.md)
- `wow__understanding-repository-architecture` (SKILL.md + reference.md)

## Step-by-Step: Create Single-File Skill

### Step 1: Copy Template

```bash
cp .claude/skills/TEMPLATE.md .claude/skills/your-skill-name.md
```

Rename `your-skill-name.md` to `SKILL.md` inside a new directory:

```bash
mkdir .claude/skills/your-skill-name
mv .claude/skills/your-skill-name.md .claude/skills/your-skill-name/SKILL.md
```

### Step 2: Write Frontmatter

Update the frontmatter with accurate information:

**For Inline Skills (default - knowledge injection)**:

```yaml
---
name: domain__your-skill-name
description: Clear, action-oriented description for auto-loading. CRITICAL - must be specific enough to trigger when relevant tasks are described, unique across all Skills. Example - "Provides comprehensive guide for creating maker-checker-fixer workflows. Auto-loads when task mentions content quality validation, audit reports, three-stage workflows, or implementing checker/fixer agents."
context: inline # Optional - this is the default
allowed-tools: [Read, Grep] # Optional - specify if Skill needs specific tools
model: sonnet # Optional - specify if Skill requires specific model
---
```

**For Fork Skills (task delegation)**:

```yaml
---
name: domain__your-research-skill
description: Research-focused description that triggers for deep analysis tasks
context: fork # Required for delegation mode
agent: Explore # Required - specifies which agent type to spawn
---
```

**Frontmatter Guidelines**:

- **name**: Must use domain prefix pattern `[domain]__[skill-name]` (e.g., `docs__`, `repo__`, `plan__`), descriptive, unique
- **description**: Action-oriented, specific triggers, comprehensive (150-250 words recommended)
- **context**: Optional for inline (default), required `fork` for delegation mode
- **agent**: Required when `context: fork` - specifies agent type (Explore, custom agents, etc.)
- **allowed-tools**: Only if Skill examples require specific tools (inline mode only)
- **model**: Only if Skill requires advanced reasoning (sonnet for complex workflows, opus for specialized tasks)

### Step 3: Write Core Content

Follow the template structure:

1. **Purpose** - When to use this Skill, what knowledge it provides
2. **Key Concepts** - Core knowledge with detailed explanations
3. **Best Practices** - Action-oriented guidance (numbered list)
4. **Common Patterns** - Reusable templates or code samples
5. **Common Mistakes** - Anti-patterns with explanations
6. **References** - Links to convention/development documents (authoritative sources)
7. **Related Skills** - Other Skills that complement this one

### Step 4: Validate Content Quality

Ensure your Skill follows [Content Quality Principles](../../governance/conventions/writing/quality.md):

- [ ] Active voice throughout
- [ ] Clear, specific description for auto-loading
- [ ] Proper heading hierarchy (H1 title, H2 sections, H3+ subsections)
- [ ] All links validated (relative paths to conventions/development docs)
- [ ] No time estimates (avoid "this takes 2-3 hours" language)
- [ ] Accessible formatting (no reliance on color alone for meaning)
- [ ] References point to authoritative sources (convention/development docs)

### Step 5: Test Description Auto-Loading

Verify your description triggers auto-loading:

1. Create a test task mentioning key concepts from your Skill
2. Invoke an agent that references your Skill
3. Confirm the Skill loads automatically
4. Iterate on description if auto-loading is unreliable

**Description Writing Tips**:

- Include specific terminology users will mention in tasks
- List concrete triggers ("when task mentions X, Y, or Z")
- Be comprehensive but specific (150-250 words)
- Avoid generic language ("helps with development")
- Use action-oriented phrasing ("provides guide for", "auto-loads when")

## Step-by-Step: Create Multi-File Skill

### Step 1: Copy Template Directory

```bash
cp -r .claude/skills/wow__multi-file-template .claude/skills/domain__your-skill-name
```

### Step 2: Update SKILL.md

Edit `your-skill-name/SKILL.md`:

1. **Write frontmatter** (same guidelines as single-file)
2. **Write overview** explaining multi-file structure
3. **Create quick reference table** for fast lookup
4. **Write core concepts** (brief, link to reference.md for details)
5. **Add best practices** (action-oriented list)
6. **List common mistakes** (link to examples.md for corrections)
7. **Document file organization** (guide users through the files)
8. **Add references** to convention/development docs
9. **List related Skills**

**Target**: 200-500 lines for SKILL.md

### Step 3: Populate reference.md

Edit `your-skill-name/reference.md`:

1. **Detailed specifications** - Complete rules with all edge cases
2. **Comprehensive tables** - Matrices, reference data
3. **Deep-dive explanations** - Complex topics fully explained
4. **Validation criteria** - Checklists for correct application
5. **Decision trees** - When to use pattern A vs B
6. **Related conventions** - Mapping to specific convention sections

**Target**: 500-1,500+ lines for reference.md

### Step 4: Populate examples.md

Edit `your-skill-name/examples.md`:

1. **Basic examples** - Fundamental patterns with code
2. **Advanced examples** - Complex integrations
3. **Anti-pattern corrections** - Wrong approach vs. right approach with explanations
4. **Quick-start templates** - Copy-paste starting points
5. **Domain-specific patterns** - Common use cases for this domain
6. **Comparison examples** - Approach A vs B with decision criteria
7. **Testing examples** - How to test the patterns

**Target**: 500-1,000+ lines for examples.md

### Step 5: Ensure Cross-Linking

Verify navigation links work:

- SKILL.md links to `./reference.md#section-name` for details
- SKILL.md links to `./examples.md#example-name` for code samples
- reference.md has navigation footer: `[← Back to SKILL.md](../../.opencode/skill/plan-writing-gherkin-criteria/SKILL.md) | [→ See Examples](./examples.md)`
- examples.md has navigation footer: `[← Back to SKILL.md](../../.opencode/skill/plan-writing-gherkin-criteria/SKILL.md) | [← See Reference](./reference.md)`

### Step 6: Update README.md (Optional)

If your multi-file Skill benefits from usage instructions, create `your-skill-name/README.md` explaining:

- When to read each file
- Recommended reading order
- Quick navigation guide

### Step 7: Validate Content Quality

Apply the same validation checklist as single-file Skills (Step 4 above).

## Adding Skill to Agent

After creating your Skill, update agents to reference it:

### Update Agent Frontmatter

Edit agent file (e.g., `.claude/agents/agent-name.md`):

```yaml
---
name: agent-name
description: Agent description
tools: [Read, Write]
model: sonnet
color: blue
skills: [domain__your-skill-name] # Add your Skill here
---
```

**Guidelines**:

- Skills field can be empty `[]` (backward compatible)
- Add 1-3 Skills per agent (avoid overloading)
- Choose Skills that directly support the agent's core responsibilities
- Skills composition works (multiple Skills auto-load together)

## Best Practices

### Description Writing

1. **Be specific**: Include exact terminology users will mention
2. **List triggers**: Explicitly state "when task mentions X, Y, Z"
3. **Be comprehensive**: 150-250 words, cover all use cases
4. **Avoid generic**: Don't say "helps with documentation" - say "provides Mermaid diagram accessibility standards with color-blind friendly palette"
5. **Test thoroughly**: Iterate based on actual auto-loading behavior

### Content Organization

1. **Start simple**: Begin with single-file, split only if content exceeds 1,000 lines
2. **Progressive disclosure**: SKILL.md for concepts, reference.md for details, examples.md for code
3. **Cross-link effectively**: Link from concepts to specifications to examples
4. **Keep authoritative**: Skills **reference** conventions, not replace them
5. **Update together**: When convention changes, update Skill to maintain accuracy

### Validation

1. **Test auto-loading**: Verify Skill loads when expected, doesn't load when irrelevant
2. **Validate links**: All references must point to existing convention/development docs
3. **Check quality**: Apply [Content Quality Principles](../../governance/conventions/writing/quality.md)
4. **Run wow\_\_rules-checker**: Validates Skills structure, frontmatter, references
5. **Update Skills index**: Ensure `.claude/skills/README.md` includes your Skill

## Common Mistakes

### ❌ Mistake 1: Duplicating Convention Content

**Wrong**: Copying entire convention document into Skill

**Right**: Skill provides quick reference and practical patterns, links to convention for authoritative details

**Why**: Conventions are the source of truth. Skills encode knowledge for AI agents, but must reference conventions to maintain consistency.

### ❌ Mistake 2: Generic Description

**Wrong**: `description: "Helps with documentation tasks"`

**Right**: `description: "Provides comprehensive guide for creating content on ayokoding-web, a Next.js 16 fullstack content platform. Auto-loads when task mentions bilingual content, by-example tutorials, programming language tutorials, or ayokoding-web site development."`

**Why**: Generic descriptions won't trigger auto-loading reliably. Be specific about terminology and use cases.

### ❌ Mistake 3: Single File Too Large

**Wrong**: Creating 2,000-line single SKILL.md file

**Right**: Split into SKILL.md (concepts), reference.md (specifications), examples.md (code samples)

**Why**: Large single files are hard to navigate. Multi-file structure enables progressive disclosure and better organization.

### ❌ Mistake 4: Missing Cross-Links

**Wrong**: Multi-file Skill with no links between SKILL.md, reference.md, examples.md

**Right**: SKILL.md links to sections in reference.md and examples.md, reference.md/examples.md link back to SKILL.md

**Why**: Users need navigation to find related information quickly. Cross-links enable efficient knowledge discovery.

### ❌ Mistake 5: No Testing

**Wrong**: Creating Skill and immediately committing without testing auto-loading

**Right**: Test auto-loading with realistic tasks, iterate on description, verify backward compatibility

**Why**: Auto-loading behavior is critical. Untested Skills may not load when needed or may load when irrelevant.

## Examples

### Example 1: Simple Workflow Skill (Single-File)

**Skill**: `wow__practicing-trunk-based-development`

**Structure**:

```
wow__practicing-trunk-based-development/
└── SKILL.md (640 lines)
```

**Content**:

- Purpose: Git workflow for this repository
- Concepts: Main branch by default, 1% justified branches, feature flags
- Patterns: Multi-day features, experimental work, external contributions
- Mistakes: Creating branches without justification, committing to environment branches

**Why Single-File**: Cohesive workflow knowledge, no extensive tables or code examples

### Example 2: Complex Technical Skill (Multi-File)

**Skill**: `docs__creating-accessible-diagrams`

**Structure**:

```
docs__creating-accessible-diagrams/
├── SKILL.md (450 lines) - Core concepts, palette summary, best practices
└── examples.md (800 lines) - Complete Mermaid examples, corrections, templates
```

**Content**:

- SKILL.md: Accessible color palette, Mermaid principles, common mistakes
- examples.md: Working diagrams (flowchart, sequence, state), anti-pattern corrections, quick-start templates

**Why Multi-File**: Extensive code examples warrant separate file, but no complex specification tables needed (so no reference.md)

### Example 3: Comprehensive Architecture Skill (Multi-File)

**Skill**: `wow__understanding-repository-architecture`

**Structure**:

```
wow__understanding-repository-architecture/
├── SKILL.md (500 lines) - Overview, quick reference, layer descriptions
└── reference.md (1,200 lines) - Detailed matrices, governance rules, traceability requirements
```

**Content**:

- SKILL.md: Six-layer overview, quick reference table, traceability examples
- reference.md: Layer characteristics matrix, governance relationships, detailed criteria

**Why Multi-File**: Extensive specifications and tables warrant reference.md, primarily conceptual so no examples.md needed

## Troubleshooting

### Problem: Skill Doesn't Auto-Load

**Diagnosis**: Description not specific enough or doesn't match task terminology

**Solution**:

1. Review task description user provided
2. Identify key terms that should trigger auto-load
3. Update Skill description to explicitly include those terms
4. Test again with similar tasks
5. Iterate until auto-loading is reliable

### Problem: Skill Loads for Irrelevant Tasks

**Diagnosis**: Description too broad or generic

**Solution**:

1. Make description more specific
2. Add qualifiers ("when task mentions X AND Y")
3. Narrow the scope to prevent over-triggering
4. Test with edge-case tasks to verify it doesn't load inappropriately

### Problem: Agent Behavior Changed After Adding Skill

**Diagnosis**: Skill content conflicts with agent's inline knowledge

**Solution**:

1. Review Skill content for accuracy
2. Check agent prompt for conflicting instructions
3. Remove redundant content from agent (let Skill provide it)
4. Ensure Skill references authoritative conventions
5. Test agent with and without Skill to isolate issue

### Problem: Multiple Skills Conflict

**Diagnosis**: Skills provide contradictory guidance

**Solution**:

1. Review both Skills for consistency
2. Update Skills to align with conventions (source of truth)
3. Add "Related Skills" sections noting potential conflicts
4. Document which Skill takes precedence in what scenarios
5. Consider consolidating if Skills overlap too much

## References

- [AI Agents Convention](../../governance/development/agents/ai-agents.md) - Skills field requirements
- [Repository Architecture](../../governance/repository-governance-architecture.md) - Skills as Layer 2 infrastructure
- [Content Quality Principles](../../governance/conventions/writing/quality.md) - Quality standards
- [Skills Directory README](./README.md) - Skills overview and index

## Related How-To Guides

- [How to Add a New App](./add-new-app.md) - Creating apps that use Skills-powered agents
- [AI Agents Convention](../../governance/development/agents/ai-agents.md) - Creating agents that reference Skills

---

**Note**: Skills are delivery infrastructure serving agents, not a governance layer. They operate in two modes:

- **Inline skills** - Inject knowledge from conventions into current conversation
- **Fork skills** - Delegate specialized tasks to agents in isolated contexts

Skills serve agents but don't govern them (service relationship, not governance). Conventions remain the authoritative source.
