---
title: "Content Preservation Convention"
description: Principles and processes for preserving knowledge when condensing files and extracting duplications
category: explanation
subcategory: development
tags:
  - content-preservation
  - condensation
  - offload
  - zero-loss
  - documentation
created: 2025-12-14
updated: 2025-12-14
---

# Content Preservation Convention

This convention defines the principles and processes for preserving knowledge when condensing files and extracting duplications. It ensures zero content loss when reducing file sizes or eliminating duplication across the repository.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Content offload process explicitly moves content to convention documents with clear links. No hidden assumptions about where knowledge lives - every condensation creates documented references to comprehensive sources.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Single source of truth for each topic in convention docs. Brief summaries in AGENTS.md link to comprehensive references. Eliminates duplication and maintains simple, flat information architecture.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Convention Writing Convention](../../conventions/writing/conventions.md)**: Content offload targets (convention and development docs) follow the structure and quality standards defined in this convention.

- **[Linking Convention](../../conventions/formatting/linking.md)**: All offload summaries include relative links with .md extension to comprehensive convention documents, ensuring GitHub-compatible navigation.

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: New convention and development documents created during offload use plain kebab-case filenames (e.g., `file-naming.md`, `content-preservation.md`), with directory hierarchy encoding the category.

## Purpose

When files become too large (AGENTS.md approaching 40k character limit, agent files exceeding size tiers, duplicated documentation), content must be condensed. This convention ensures condensation preserves knowledge by **moving content to convention documents, NOT deleting it**.

## Scope

This convention applies to:

- **AGENTS.md condensation** - Reducing main guidance file size
- **Agent file condensation** - Keeping agent prompts within size tiers
- **Documentation deduplication** - Eliminating cross-file duplication
- **Convention extraction** - Moving shared patterns to convention docs

## The Fundamental Principle: MOVE, NOT DELETE

**CRITICAL REQUIREMENT:** All condensation must preserve content by moving it to convention or development documents. Zero content loss is non-negotiable.

### Why This Matters

**Problem:** Simply deleting content to reduce file size causes:

- Loss of valuable knowledge and context
- Need to recreate documentation later
- Inconsistent coverage across repository
- Erosion of institutional knowledge

**Solution:** Offload content to appropriate convention or development documents where it becomes:

- Permanent, comprehensive reference
- Source of truth for the topic
- Discoverable through index files
- Maintainable in one canonical location

### Content Offload vs Content Deletion

**PASS: Content Offload (CORRECT):**

```markdown
Before (AGENTS.md - 500 lines on file naming):

## File Naming Convention

Files must use lowercase kebab-case basenames with a standard extension...

[... 500 lines of detailed examples, rules, edge cases ...]

After (AGENTS.md - 3 lines):

## File Naming Convention

Files use lowercase kebab-case basenames (e.g., `file-naming.md`), with directory hierarchy encoding the category. See [File Naming Convention](../../conventions/structure/file-naming.md) for complete details.

Result: Content preserved in file-naming.md (comprehensive)
```

**FAIL: Content Deletion (WRONG):**

```markdown
Before (AGENTS.md - 500 lines):

## File Naming Convention

[... 500 lines of detailed guidance ...]

After (AGENTS.md - 0 lines):

[Section completely removed]

Result: Knowledge lost, need to recreate later
```

## Choosing Between conventions/ and development/

When offloading content, you must choose the appropriate destination folder. Both are valid offload targets with distinct purposes.

### governance/conventions/ - Content and Format Standards

**Focus:** How to write and format documentation

**Examples:**

- File naming, linking, emoji usage
- Diagram formats, color accessibility
- Content quality, mathematical notation
- Hugo content, tutorials, acceptance criteria
- Documentation organization (Diátaxis)
- Timestamp format

### governance/development/ - Development Processes and Workflows

**Focus:** How to work and process

**Examples:**

- AI agent standards and guidelines
- Commit message conventions
- Git workflow (Trunk Based Development)
- Code review processes
- Testing strategies
- Release management
- CI/CD workflows

### Decision Rule

- **Conventions** = "How to write and format"
- **Development** = "How to work and process"
- **If unclear**, ask: "Is this primarily about content or process?"

## The Offload Decision Tree

When condensing content, ask these questions:

```
Is this content unique and valuable?
 │
 ├─ YES → Offload to convention OR development doc
 │   │
 │   ├─ Is this about HOW we write/format?
 │   │   └─> governance/conventions/
 │   │
 │   ├─ Is this about HOW we work/process?
 │   │   └─> governance/development/
 │   │
 │   ├─ Does convention/development doc exist?
 │   │   ├─ YES → Option B: Merge into existing doc
 │   │   └─ NO → Option A: Create new doc
 │   │
 │   └─ Is this pattern shared across multiple files?
 │       ├─ YES → Option C: Extract common pattern to shared doc
 │       └─ NO → Option D: Add to appropriate folder (conventions/ or development/)
 │
 ├─ NO (duplicated from conventions/development) → Link instead of duplicate
 │
 └─ UNSURE (agent-specific implementation) → Keep in agent file
```

## Four Offload Options

### Option A: Create New Convention Document

**When to use:** Content represents a new convention or standard not yet documented.

**Process:**

1. Identify the convention topic (e.g., "acceptance criteria format")
2. Use `docs-maker` to create new convention doc in `governance/conventions/` or `governance/development/`
3. Move ALL relevant content to new convention (comprehensive detail)
4. Replace original content with 2-5 line summary + link
5. Update appropriate index (`governance/conventions/README.md` or `governance/development/README.md`)
6. Verify all cross-references work

**Example:**

- **Before:** Gherkin acceptance criteria details in `plan-maker.md` (500 lines)
- **After:**
  - New file: `governance/development/infra/acceptance-criteria.md` (comprehensive)
  - `plan-maker.md`: "Use Gherkin format. See [Acceptance Criteria Convention](../infra/acceptance-criteria.md)" (3 lines)
  - Savings: 497 lines

### Option B: Merge into Existing Convention

**When to use:** Content expands or clarifies an existing convention.

**Process:**

1. Identify the most relevant existing convention doc
2. Read convention doc to understand current content
3. Add new content to appropriate section (maintain structure)
4. Update frontmatter (`updated` date)
5. Replace original content with summary + link
6. Verify convention doc is indexed

**Example:**

- **Before:** TBD workflow details duplicated in `plan-maker.md` and `plan-executor.md`
- **After:**
  - Updated: `governance/development/workflow/trunk-based-development.md` (comprehensive)
  - `plan-maker.md`: "Follow TBD workflow. See [TBD Convention](../workflow/trunk-based-development.md)" (2 lines)
  - `plan-executor.md`: "Default to main branch per TBD. See [TBD Convention](../workflow/trunk-based-development.md)" (2 lines)
  - Savings: Duplication eliminated

### Option C: Extract Common Pattern to Shared Convention

**When to use:** Multiple agents share the same detailed content (cross-file duplication).

**Process:**

1. Identify files with overlapping content (>50% similarity)
2. Determine if pattern represents a convention or standard
3. Create new convention doc OR expand existing one
4. Move shared pattern to convention (single source of truth)
5. Update all affected files with summary + link
6. Update convention index
7. Verify zero content loss

**Example - Content Format Standard:**

- **Before:** Diagram standards duplicated in `docs-maker.md`, `plan-maker.md`
- **After:**
  - New file: `governance/conventions/formatting/diagrams.md` (comprehensive)
  - All agents: "Use Mermaid diagrams. See [Diagram Convention](../../conventions/formatting/diagrams.md)" (2 lines each)
  - Savings: Eliminated duplication
- **Why Conventions Folder:** Diagrams are a content format standard, not development process

**Example - Development Process Standard:**

- **Before:** Testing strategy duplicated across multiple agents
- **After:**
  - New file: `governance/development/quality/testing-strategy.md` (comprehensive)
  - All agents: "See `testing-strategy.md` for comprehensive testing guidelines" (2 lines each)
  - Savings: Eliminated duplication
- **Why Development Folder:** Testing is a development process, not content format

### Option D: Add to Development Conventions

**When to use:** Content relates to development processes, workflows, or team practices.

**Destination:** `governance/development/`

**Examples of development content:**

- Code review checklists → `quality/code-review.md`
- Testing strategies → `quality/testing-strategy.md`
- Release process → `workflow/release-process.md`
- CI/CD workflows → `infra/cicd-workflow.md`
- Git workflows → `workflow/trunk-based-development.md`
- Commit conventions → `workflow/commit-messages.md`
- Agent standards → `agents/ai-agents.md`

**Existing development docs:**

- `agents/ai-agents.md` (AI agent standards)
- `workflow/commit-messages.md` (commit conventions)
- `workflow/trunk-based-development.md` (git workflow)

**Process:**

1. Determine if it's a development practice (git, commits, CI/CD, testing, code review, etc.)
2. Create new doc OR expand existing in `governance/development/`
3. Use lowercase kebab-case filenames; place in the appropriate subdirectory so the hierarchy encodes the category
4. Move content to development convention (comprehensive detail)
5. Replace original with 2-5 line summary + link
6. Update development index (`governance/development/README.md`)
7. Verify all cross-references work

**Example:**

- **Before:** Commit granularity examples in `plan-executor.md`
- **After:**
  - Updated: `governance/development/workflow/commit-messages.md` (comprehensive)
  - `plan-executor.md`: "Split commits logically. See [Commit Messages Convention](../workflow/commit-messages.md)" (2 lines)
  - Savings: 100+ lines

## Offload Process Workflow

Follow this systematic process when offloading content:

### Step 1: Identify Content to Condense

- Read the file completely
- Identify verbose sections with detailed explanations
- Look for duplicated content across files
- Check if content is unique or already in conventions

### Step 2: Determine Offload Destination

- Is this a new convention? → Option A
- Expands existing convention? → Option B
- Shared across multiple files? → Option C
- Development practice? → Option D

### Step 3: Create or Update Convention Document

- Use `docs-maker` for new files
- Use `Edit` tool for updating existing
- Move ALL relevant content (be comprehensive)
- Add examples, rationale, anti-patterns
- Update frontmatter (`updated` date)

### Step 4: Replace Original Content

- Write 2-5 line summary
- Add link to convention doc
- Remove verbose details
- Maintain readability and context

### Step 5: Update Index Files

- Add new conventions to `governance/conventions/README.md`
- Add new development docs to `governance/development/README.md`
- Maintain alphabetical ordering

### Step 6: Verify All Cross-References

- Use Glob to verify convention doc exists
- Test all links point to correct files
- Verify links include `.md` extension
- Check bidirectional references where appropriate

### Step 7: Confirm Zero Content Loss

- Read original content
- Read convention doc
- Verify all information preserved
- Confirm no unique details lost
- Document any intentional omissions

### Step 8: Update Related Files

- Search for references to condensed topic
- Update other files to link to convention
- Eliminate duplication across repository
- Maintain consistent terminology

## Verification Checklist

Before completing a content offload, verify:

### Content Preservation

- [ ] All unique content moved to convention doc
- [ ] No valuable information deleted
- [ ] Examples preserved or improved
- [ ] Rationale and context maintained
- [ ] Anti-patterns documented

### Convention Document Quality

- [ ] Convention doc is comprehensive
- [ ] Frontmatter complete and accurate
- [ ] Updated date reflects changes
- [ ] Structure follows convention patterns (see [Convention Writing Convention](../../conventions/writing/conventions.md))
- [ ] Examples include PASS: good and FAIL: bad

### Original File Updates

- [ ] Replaced with 2-5 line summary
- [ ] Link to convention doc included
- [ ] Link uses correct relative path
- [ ] Link includes `.md` extension
- [ ] Summary maintains context

### Index and Navigation

- [ ] Convention indexed in README.md
- [ ] Alphabetical ordering maintained
- [ ] Category correct (conventions vs development)
- [ ] No broken links introduced

### Cross-Reference Integrity

- [ ] All links verified with Glob
- [ ] Link targets exist
- [ ] Relative paths correct
- [ ] Bidirectional references maintained

### Zero Content Loss

- [ ] Read original content completely
- [ ] Read convention doc completely
- [ ] Verified all information present
- [ ] No unique details lost
- [ ] Document any intentional omissions

### Consistency Across Repository

- [ ] Same terminology used everywhere
- [ ] No contradictions introduced
- [ ] Duplication eliminated
- [ ] Single source of truth established

### Correct Folder Choice

- [ ] Content offloaded to appropriate folder (conventions/ or development/)
- [ ] Content/format standards → conventions/
- [ ] Process/workflow standards → development/

**Verify Correct Folder Choice:**

**For governance/conventions/** (content/format):

- File naming, linking, emoji, diagrams, colors
- Content quality, mathematical notation
- Hugo content, tutorials, acceptance criteria
- Documentation organization

**For governance/development/** (process/workflow):

- AI agent standards
- Commit messages, git workflow
- Code review, testing, release processes
- CI/CD, deployment strategies

**Red Flags:**

- Testing strategy in conventions/ (should be development/)
- File naming in development/ (should be conventions/)
- Git workflow in conventions/ (should be development/)
- Diagram format in development/ (should be conventions/)

## When NOT to Offload

**Keep content in the original file when:**

1. **Agent-specific implementation details** - How THIS agent applies a convention
2. **Agent-unique workflows** - Process specific to this agent's task
3. **Agent decision logic** - Internal reasoning not applicable elsewhere
4. **Minimal content** - Section is already 3-5 lines
5. **Context-dependent** - Content only makes sense in this specific context

**Example of content to keep:**

```markdown
## File Naming Convention

You MUST follow the [File Naming Convention](../../conventions/structure/file-naming.md).

When creating documentation files:

1. Read the target directory path
2. Choose a lowercase kebab-case basename describing the content
3. Let the directory hierarchy encode the category
```

**Why keep:** This is agent-specific application (how docs-maker uses the convention), not the convention itself.

## Understanding the Governance Folder Structure

**governance/** contains two main subfolders for offloading content:

### 1. conventions/

- **Focus:** Content creation and formatting standards
- **Examples:**
  - `structure/file-naming.md` (how to name files)
  - `formatting/diagrams.md` (how to create diagrams)
  - `writing/quality.md` (how to ensure content quality)
- **When to use:** "How should we write/format this?"

### 2. development/

- **Focus:** Development processes and team workflows
- **Examples:**
  - `agents/ai-agents.md` (how to create agents)
  - `workflow/commit-messages.md` (how to write commits)
  - `workflow/trunk-based-development.md` (how to manage git workflow)
  - `quality/testing-strategy.md` (how to test code)
- **When to use:** "How should we do/manage this?"

**Both are valid offload destinations. Choose based on content nature:**

- Content/format standards → conventions/
- Process/workflow standards → development/

## Common Anti-Patterns

### FAIL: Anti-Pattern 1: Deleting Content Without Offload

```markdown
Before: AGENTS.md has 500 lines on file naming
Action: Delete section to reduce size
After: File naming knowledge lost

Problem: Need to recreate later, knowledge erosion
```

**PASS: Correct Approach:** Offload to `governance/conventions/structure/file-naming.md`, link from AGENTS.md

### FAIL: Anti-Pattern 2: Incomplete Offload

```markdown
Before: Agent has 300 lines on testing
Action: Move 100 lines to convention, delete 200 lines
After: Partial knowledge preserved

Problem: Lost unique details, incomplete documentation
```

**PASS: Correct Approach:** Move ALL 300 lines to convention, comprehensive documentation

### FAIL: Anti-Pattern 3: Wrong Folder Choice

```markdown
Before: Testing strategy duplicated across agents
Action: Create `conventions/writing/testing-strategy.md`
After: Wrong location (testing is process, not content format)

Problem: Violates convention/development separation
```

**PASS: Correct Approach:** Create `governance/development/quality/testing-strategy.md`

### FAIL: Anti-Pattern 4: Offloading Agent-Specific Logic

```markdown
Before: Agent has workflow for applying file naming convention
Action: Move workflow to `conventions/structure/file-naming.md`
After: Convention doc contains agent-specific logic

Problem: Convention polluted with implementation details
```

**PASS: Correct Approach:** Keep agent-specific workflow in agent, reference convention for rules

## References

- [Convention Writing Convention](../../conventions/writing/conventions.md) - How to write convention documents (target for offloaded content)
- [AI Agents Convention](../agents/ai-agents.md) - Agent standards (agents apply content preservation principles)
- [Trunk Based Development Convention](../workflow/trunk-based-development.md) - Git workflow example of development convention
- [File Naming Convention](../../conventions/structure/file-naming.md) - Example of content convention

## Agent Usage

### repo-rules-maker

When condensing files or extracting duplications, `repo-rules-maker` must:

1. Follow the offload decision tree
2. Choose appropriate option (A/B/C/D)
3. Use correct folder (conventions/ or development/)
4. Complete all verification checklist items
5. Confirm zero content loss

### repo-rules-checker

When validating condensation, `repo-rules-checker` must verify:

- Content was MOVED (not deleted)
- Target convention/development doc exists and is indexed
- Links are correct with `.md` extension
- Correct folder choice (conventions/ vs development/)
- No unique content lost

### docs-maker

When creating new convention or development documents during offload, `docs-maker` must:

- Place files in the correct subdirectory (`conventions/` or `development/`) with lowercase kebab-case filenames
- Include comprehensive content from source
- Add frontmatter with appropriate subcategory
- Update index files

## Related Conventions

- [AI Agents Convention](../agents/ai-agents.md) - Agent file size tiers and condensation
- [Convention Writing Convention](../../conventions/writing/conventions.md) - How to structure convention documents
