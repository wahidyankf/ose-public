---
title: "Convention Writing Convention"
description: Meta-convention defining how to write and organize convention documents in the conventions/ directory
category: explanation
subcategory: conventions
tags:
  - meta
  - conventions
  - standards
  - documentation
created: 2025-12-07
updated: 2025-12-24
---

# Convention Writing Convention

This meta-convention defines how to write convention documents in the `governance/conventions/` directory. It ensures consistency, clarity, and completeness across all convention documentation.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Required sections, clear scope boundaries, and explicit content structure for all conventions. No guessing about what belongs in conventions/ vs development/ - decision criteria are documented.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Standardized convention structure reduces cognitive load. Same sections in same order across all conventions - readers know what to expect.

## Purpose

Convention documents define **how to write and format documentation** in this repository. They establish standards for markdown syntax, content organization, visual elements, and content quality. This meta-convention ensures all convention documents follow consistent structure and quality standards.

## Scope

### What Belongs in conventions/

**PASS: Documentation writing and formatting standards:**

- Markdown syntax and formatting (linking, file naming, indentation)
- Content organization frameworks (Diátaxis, tutorials, plans)
- Visual elements in documentation (diagrams, colors, emojis, mathematical notation)
- Content quality and accessibility standards
- Specific documentation types (tutorials, plans, READMEs, Hugo content)
- Documentation file formats and structures

### What Does NOT Belong in conventions/

**FAIL: Software development practices** (use `governance/development/` instead):

- Development workflows (git, commits, testing, BDD)
- Build processes and tooling
- Hugo theme/layout development (HTML templates, asset pipeline)
- Development infrastructure (temporary files, build artifacts)
- AI agent development standards
- Code quality and testing practices

### Decision Tree

```
Does this define HOW TO WRITE OR FORMAT DOCUMENTATION?
├─ Yes → conventions/ (this directory)
└─ No → Is it about software development processes/quality?
    ├─ Yes → development/
    └─ No → Might belong elsewhere (reference/, how-to/, etc.)
```

### Examples of Scope Boundaries

| Topic                                             | Location                                        | Reasoning                            |
| ------------------------------------------------- | ----------------------------------------------- | ------------------------------------ |
| How to write Hugo content (frontmatter, markdown) | `conventions/hugo/hugo-content-ose-platform.md` | About **writing** content            |
| How to develop Hugo themes (layouts, templates)   | `development/hugo/development.md`               | About **building** infrastructure    |
| How to format tutorials                           | `conventions/tutorials/general.md`              | About **writing** tutorials          |
| How to write acceptance criteria                  | `development/infra/acceptance-criteria.md`      | About **software quality** process   |
| How to name files                                 | `conventions/structure/file-naming.md`          | About **documentation** organization |
| How to write commit messages                      | `development/workflow/commit-messages.md`       | About **git workflow**               |

## Convention Document Structure

All convention documents SHOULD follow this structure:

### Required Sections

#### 1. Frontmatter (YAML)

```yaml
---
title: "Convention Name"
description: Brief description of what this convention covers
category: explanation
subcategory: conventions
tags:
  - relevant
  - tags
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Requirements:**

- Title uses Title Case and includes "Convention" for clarity
- Description is 1-2 sentences explaining the convention's purpose
- Category is always `explanation`
- Subcategory is always `conventions`
- Tags help with discoverability (3-5 tags)
- Dates use `YYYY-MM-DD` format (date-only, not full timestamp)

#### 2. Introduction (H1 + opening paragraph)

```markdown
# Convention Name

Brief overview explaining what this convention covers and why it exists.
1-3 paragraphs maximum.
```

**Purpose:** Immediately orient readers to the convention's scope and value.

#### 3. Principles Implemented/Respected Section (H2)

```markdown
## Principles Implemented/Respected

This convention implements/respects the following core principles:

- **[Principle Name](../../principles/[category]/[name].md)**: Brief explanation of HOW this convention implements or respects this principle. What specific aspect of the principle does this convention embody?
- **[Another Principle](../../principles/[category]/[name].md)**: Another explanation.
```

**Purpose:** Explicit traceability from documentation standards back to foundational values. Makes governance hierarchy visible and verifiable.

**Requirements:**

- List ALL principles this convention implements or respects
- Include working link to each principle document
- Explain HOW the convention embodies each principle (not just listing names)
- Use relative paths: `../principles/[category]/[name].md`

**Note:** This section is MANDATORY for all convention documents. It enables traceability validation and ensures conventions trace back to foundational values.

#### 4. Purpose Section (H2)

```markdown
## Purpose

Clearly state WHY this convention exists and what problems it solves.
Include the intended audience and use cases.
```

#### 5. Scope Section (H2)

```markdown
## Scope

### What This Convention Covers

- Bulleted list of included topics

### What This Convention Does NOT Cover

- Bulleted list of excluded topics (with references to appropriate conventions)
```

**Note:** Explicit exclusions prevent scope creep and guide readers to related conventions.

#### 6. Standards/Rules Section (H2)

```markdown
## Standards

Detailed requirements, rules, or guidelines. Use subsections (H3) to organize.

### Subsection 1

Content with examples

### Subsection 2

Content with examples
```

**Tips:**

- Break complex topics into digestible subsections
- Use clear, imperative language ("Use X", "Never do Y")
- Provide rationale for non-obvious rules

### Recommended Sections

#### 7. Examples Section (H2)

```markdown
## Examples

### Good Examples

Concrete examples showing correct usage

### Bad Examples

Concrete examples showing what to avoid (with explanations)
```

**Value:** Examples make abstract rules concrete and immediately actionable.

#### 8. Comparison Tables

Use tables to contrast approaches:

```markdown
| Scenario  | PASS: Correct | FAIL: Incorrect | Why         |
| --------- | ------------- | --------------- | ----------- |
| Example 1 | Good way      | Bad way         | Explanation |
```

#### 9. Edge Cases / Special Considerations (H2)

```markdown
## Special Considerations

Address nuanced scenarios, exceptions, or edge cases.
```

#### 10. Tools and Automation (H2)

```markdown
## Tools and Automation

Reference agents or tools that enforce or assist with this convention:

- **agent-name** - What it does related to this convention
```

#### 11. References Section (H2)

```markdown
## References

**Related Conventions:**

- [Convention Name](./convention-file.md) - How it relates

**External Resources:**

- [Resource Name](https://example.com) - Why it's relevant

**Agents:**

- `agent-name` - How it uses this convention
```

**Purpose:** Help readers discover related content and understand the convention's ecosystem.

### Optional Sections

- **Quick Reference** - Checklists or TL;DR summaries
- **Migration Guide** - How to adopt this convention in existing content
- **FAQ** - Common questions (use sparingly; prefer clear standards)
- **Rationale** - Deeper explanation of design decisions (for complex conventions)

## Quality Checklist

Before publishing a convention document, verify:

### Completeness

- [ ] Has all required sections (frontmatter, introduction, Principles Implemented/Respected, purpose, scope, standards)
- [ ] Principles Implemented/Respected section lists ALL relevant principles with links and explanations
- [ ] Includes concrete examples (not just abstract rules)
- [ ] Cross-references related conventions
- [ ] Specifies what is OUT of scope (prevents confusion)

### Clarity

- [ ] Uses clear, imperative language ("Use X", not "You could use X")
- [ ] Defines all technical terms or links to definitions
- [ ] Examples show both correct PASS: and incorrect FAIL: usage
- [ ] Rationale provided for non-obvious rules

### Usability

- [ ] Scannable structure (headings, lists, tables)
- [ ] Code blocks use proper syntax highlighting
- [ ] Tables formatted correctly
- [ ] Links work and use relative paths with `.md` extension

### Convention Compliance

- [ ] Follows [File Naming Convention](../formatting/linking.md) - Relative paths with `.md`
- [ ] Follows [Content Quality Principles](./quality.md) - Active voice, single H1, etc.
- [ ] YAML frontmatter uses 2 spaces for indentation

### Integration

- [ ] Referenced in `governance/conventions/README.md`
- [ ] Mentioned in AGENTS.md if it affects agent behavior
- [ ] Used by at least one agent OR enforced in a hook/process
- [ ] Cross-referenced by related conventions

### Accessibility

- [ ] Diagrams use color-blind friendly palette ([Color Accessibility Convention](../formatting/color-accessibility.md))
- [ ] Images have alt text
- [ ] Acronyms defined on first use
- [ ] Clear hierarchy (proper heading nesting)

## When to Create New vs Update Existing

### Create a NEW convention when

- PASS: Topic addresses a distinct concern not covered by existing conventions
- PASS: Scope is clearly defined and non-overlapping
- PASS: Convention will be referenced by multiple documents or agents
- PASS: Topic requires >500 words of unique content

### Update EXISTING convention when

- PASS: Topic extends or clarifies existing convention's scope
- PASS: New content fits naturally into existing structure
- PASS: Overlap with existing convention is >60%
- PASS: Addition is <500 words and doesn't warrant separate doc

### Consider MERGING when

- PASS: Two conventions overlap significantly (>60% shared scope)
- PASS: Conventions are always referenced together
- PASS: Separation causes confusion about which to follow
- PASS: Combined length would still be <3000 lines

### Decision Process

1. **Search existing conventions** - Check `governance/conventions/README.md` for related topics
2. **Assess overlap** - Read related conventions to understand current coverage
3. **Define unique scope** - Articulate what the new convention would cover that existing ones don't
4. **Estimate length** - Will this be >500 words? Multiple sections?
5. **Check references** - Will this be used by multiple agents/docs/processes?
6. **Decide:** New, update, or merge based on above criteria

## Length Guidelines

Convention documents vary in length based on complexity:

### Short Conventions (< 500 lines)

**Examples:** Timestamp Format, Mathematical Notation, Emoji Usage

**When appropriate:**

- Simple, focused topic
- Clear rules with few exceptions
- Limited number of examples needed

### Medium Conventions (500-1500 lines)

**Examples:** File Naming, Linking, Tutorial Naming, README Quality

**When appropriate:**

- Moderate complexity
- Multiple subsections or categories
- Balanced examples and rules

### Long Conventions (1500+ lines)

**Examples:** Hugo Content, Diátaxis Framework, Tutorials, Content Quality

**When appropriate:**

- Complex topic with multiple dimensions
- Comprehensive examples needed
- Covers multiple related subtopics
- High reference value (frequently consulted)

**Warning signs:** If approaching 3000 lines, consider:

- Splitting into multiple focused conventions
- Moving detailed examples to separate reference docs
- Creating "overview + detailed guides" structure

## Naming Convention

Convention files follow the [File Naming Convention](../structure/file-naming.md):

**Pattern:** Lowercase kebab-case basename under the appropriate `governance/conventions/` subdirectory. The directory hierarchy encodes the category — no filename prefix is needed.

**Examples:**

- `governance/conventions/structure/file-naming.md`
- `governance/conventions/formatting/diagrams.md`
- `governance/conventions/writing/quality.md`
- `governance/conventions/writing/conventions.md` (this file)

**Title vs Filename:**

- Filename: `conventions.md` (plain kebab-case)
- Frontmatter title: `"Convention Writing Convention"` (Title Case + "Convention")
- H1 heading: `# Convention Writing Convention` (matches title)

## Maintenance and Updates

### Regular Review

- Review conventions annually or when underlying tools/practices change
- Update examples if they become outdated
- Add new sections for emerging patterns

### Version Control

- Update `updated` field in frontmatter when making changes
- Significant changes should update AGENTS.md if they affect agent behavior
- Use `repo-governance-maker` to propagate changes across related files

### Deprecation

If a convention becomes obsolete:

1. Add deprecation notice at top of document
2. Provide migration path to replacement convention
3. Keep file for 6 months before considering deletion
4. Update all references in other docs and AGENTS.md

## Example Conventions

Looking for inspiration? These conventions exemplify different structural approaches:

- **[Color Accessibility Convention](../formatting/color-accessibility.md)** - Comprehensive reference convention with detailed palette specifications, contrast ratios, and tool-specific guidance
- **[Tutorial Naming Convention](../tutorials/naming.md)** - Decision-tree convention with structured types, coverage percentages, and clear selection criteria
- **[Indentation Convention](../formatting/indentation.md)** - Simple, focused convention addressing a single technical standard with clear examples

## Examples

### Good Convention Document Structure

```markdown
---
title: "Example Convention"
description: Brief, clear description
category: explanation
subcategory: conventions
tags:
  - example
  - standard
created: 2025-01-15
updated: 2025-01-15
---

# Example Convention

Clear, concise introduction explaining what and why.

## Purpose

Why this convention exists and what problems it solves.

## Scope

### What This Convention Covers

- Specific topic A
- Specific topic B

### What This Convention Does NOT Cover

- Out-of-scope topic (see [Other Convention](./other.md))

## Standards

### Rule Category 1

Clear, imperative guidance with examples.

### Rule Category 2

More guidance with concrete examples.

## Examples

### Good Examples

Showing correct usage.

### Bad Examples

Showing what to avoid and why.

## References

**Related Conventions:**

- [Related Convention](./related.md)

**Agents:**

- `example-agent` - Uses this convention for validation
```

### Bad Convention Document Structure

```markdown
# Some Topic

This is about some stuff.

Here are some rules:

- Do this
- Don't do that

The end.
```

**Problems:**

- FAIL: No frontmatter
- FAIL: No clear purpose or scope
- FAIL: No examples
- FAIL: No references
- FAIL: Vague, unconvincing content
- FAIL: No rationale for rules

## Common Mistakes to Avoid

| Mistake                 | FAIL: Problem                                       | PASS: Solution                                      |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------- |
| **Scope creep**         | Convention tries to cover too many unrelated topics | Define clear scope; split if needed                 |
| **No examples**         | Only abstract rules, no concrete demonstrations     | Add good PASS: and bad FAIL: examples               |
| **Missing rationale**   | Rules without explanation of "why"                  | Explain reasoning, especially for non-obvious rules |
| **Orphaned convention** | Not referenced anywhere, not used by agents         | Ensure integration with agents or processes         |
| **Overlapping scope**   | Duplicates content from other conventions           | Consolidate or clearly delineate boundaries         |
| **Too prescriptive**    | Overly detailed rules for simple topics             | Match detail level to topic complexity              |
| **No cross-references** | Doesn't link to related conventions                 | Add References section with related docs            |

## Integration with Agents

Conventions are most effective when enforced or assisted by agents:

### Agents That Create Conventions

- **docs-maker** - Creates convention documents following this meta-convention
- **repo-governance-maker** - Propagates convention changes across repository

### Agents That Use Conventions

- **docs-checker** - Validates documentation follows conventions
- **docs-link-general-checker** - Enforces linking convention
- **apps-ayokoding-web-general-checker** - Validates general Hugo content conventions
- **apps-ayokoding-web-by-example-checker** - Validates by-example tutorial conventions
- **repo-governance-checker** - Audits convention compliance

### Agent Integration Checklist

When creating a convention:

- [ ] Identify which agents should reference this convention
- [ ] Update agent prompts if needed to reference new convention
- [ ] Add convention to agent's "References" section
- [ ] Test that agents correctly apply the convention

## References

**Related Meta-Documentation:**

- [Content Quality Principles](./quality.md) - Universal quality standards for all markdown content
- [Diátaxis Framework](../structure/diataxis-framework.md) - Four-category documentation organization framework

**File Conventions:**

- [File Naming Convention](../structure/file-naming.md) - Kebab-case file naming rules
- [Linking Convention](../formatting/linking.md) - How to link between documentation files

**Development Practices:**

- [AI Agents Convention](../../development/agents/ai-agents.md) - How to create AI agents (parallel meta-doc for development/)

**Repository Guidance:**

- [AGENTS.md](../../../AGENTS.md) - Project-wide guidance for AI agents
- [Conventions Index](../README.md) - Index of all convention documents

**Agents:**

- `docs-maker` - Creates convention documents following this structure
- `repo-governance-maker` - Propagates convention changes
- `repo-governance-checker` - Validates convention compliance

---

**Last Updated**: 2025-12-24
