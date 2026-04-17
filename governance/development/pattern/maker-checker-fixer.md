---
title: "Maker-Checker-Fixer Pattern Convention"
description: Three-stage content quality workflow pattern used across multiple agent families for systematic content creation, validation, and remediation
category: explanation
subcategory: development
tags:
  - maker-checker-fixer
  - workflow
  - content-quality
  - agent-patterns
  - validation
  - automation
created: 2025-12-14
updated: 2025-12-24
---

# Maker-Checker-Fixer Pattern Convention

This document defines the **maker-checker-fixer pattern**, a three-stage content quality workflow used across multiple agent families in this repository. The pattern ensures high-quality content through systematic creation, validation, and remediation cycles.

## Principles Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices back to foundational values.

This practice respects the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Checker agents automatically validate content against conventions. Fixer agents apply validated fixes without manual intervention. Human effort focuses on content creation and subjective improvements, not mechanical validation.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Three clear stages (make, check, fix) instead of complex, multi-phase workflows. Each agent has single, well-defined responsibility. Separation of concerns keeps the workflow simple and predictable.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Criticality Levels Convention](../quality/criticality-levels.md)**: Checker agents categorize findings by criticality (CRITICAL/HIGH/MEDIUM/LOW) to indicate importance/urgency. Fixer agents combine criticality with confidence to determine fix priority (P0-P4).

- **[Fixer Confidence Levels Convention](../quality/fixer-confidence-levels.md)**: Fixer agents assess confidence (HIGH/MEDIUM/FALSE_POSITIVE) for each finding. Only HIGH confidence fixes applied automatically. Criticality and confidence work orthogonally to determine priority.

- **[Temporary Files Convention](../infra/temporary-files.md)**: All checker agents MUST write validation/audit reports to `generated-reports/` directory using pattern `{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__{type}.md`. Fixer agents write fix reports to same directory with `__fix.md` suffix. Progressive writing requirement ensures audit history survives context compaction.

- **[Timestamp Format Convention](../../conventions/formatting/timestamp.md)**: Report filenames use UTC+7 timestamps in format `YYYY-MM-DD--HH-MM` (hyphen-separated for filesystem compatibility).

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Checker agents validate content against quality standards (active voice, heading hierarchy, alt text, WCAG compliance). Fixer agents apply quality improvements when findings have HIGH confidence.

## Overview

### What is the Maker-Checker-Fixer Pattern?

The maker-checker-fixer pattern is a **quality control workflow** consisting of three specialized agent roles:

1. **Maker** - Creates or updates content comprehensively
2. **Checker** - Validates content against conventions and standards
3. **Fixer** - Applies validated fixes from checker audit reports

Each role is implemented as a separate agent with specific responsibilities and tool permissions, enabling a robust separation of concerns for content quality management.

### Why This Pattern Exists

**Without this pattern:**

- FAIL: Quality issues discovered after content creation
- FAIL: Manual validation is time-consuming and error-prone
- FAIL: No systematic remediation process
- FAIL: Inconsistent content quality across the repository

**With this pattern:**

- PASS: Systematic validation of all content
- PASS: Automated detection of convention violations
- PASS: Safe, validated fix application
- PASS: Iterative quality improvement
- PASS: Audit trail for all changes

### Scope

This pattern is used across multiple agent families. See [AI Agents Index](../../../.claude/agents/README.md) for the complete list of agent families using this pattern. Key families include:

1. **repo-governance-\*** - Repository-wide consistency
2. **apps-ayokoding-web-\*** - Next.js 16 content for ayokoding-web
3. **docs-tutorial-\*** - Tutorial quality validation
4. **apps-oseplatform-web-content-\*** - Next.js 16 content for oseplatform-web
5. **readme-\*** - README quality standards
6. **docs-\*** - Documentation factual accuracy
7. **plan-\*** - Plan completeness and structure
8. **docs-software-engineering-separation-\*** - SE documentation separation
9. **repo-workflow-\*** - Workflow documentation completeness

## The Three Stages

### Stage 1: Maker (Comprehensive Content Management)

**Role**: Creates NEW content and updates EXISTING content with all dependencies

**Characteristics**:

- **User-driven operation** - Responds to user requests for content creation/modification
- **Comprehensive scope** - Creates target content AND updates all related files
- **Cascading changes** - Adjusts indices, cross-references, and dependencies
- **Proactive management** - Anticipates what needs updating beyond the immediate request

**Tool Pattern**: `Write`, `Edit` (content modification tools)

**Color**: 🟦 Blue (Writer agents) or 🟨 Yellow (repo-rules-maker uses bash)

**Examples**:

| Agent                               | Creates/Updates                                    | Also Manages                                      | Tools Used            |
| ----------------------------------- | -------------------------------------------------- | ------------------------------------------------- | --------------------- |
| repo-rules-maker                    | Convention docs, AGENTS.md sections, agent prompts | Cross-references, indices, related documentation  | Bash (not Edit/Write) |
| apps-ayokoding-web-general-maker    | General Next.js learning content, blog posts       | Navigation files, overview pages, indices         | Write, Edit           |
| apps-ayokoding-web-by-example-maker | By-example tutorials with annotated code           | 75-90 examples, diagrams, educational annotations | Write, Edit           |
| docs-tutorial-maker                 | Tutorial content with narrative flow               | Learning objectives, diagrams, code examples      | Write, Edit           |
| apps-oseplatform-web-content-maker  | Platform update posts, about pages                 | Navigation, asset references                      | Write, Edit           |
| readme-maker                        | README sections with engaging content              | Links to detailed docs, cross-references          | Write, Edit           |

**Note**: `repo-rules-maker` is a special case that uses bash commands (cat, sed, awk) instead of Edit/Write tools for file operations.

**Key Responsibilities**:

- PASS: Create new content from scratch
- PASS: Update existing content when requested
- PASS: Adjust ALL dependencies (indices, cross-refs, navigation)
- PASS: Follow all conventions during creation
- PASS: Provide complete, production-ready content

**When to Use**: User wants to **create or update content** (not validate or fix)

**Example Workflow**:

```markdown
User: "Add a new tutorial to ayokoding-web about TypeScript generics"

Maker Agent (apps-ayokoding-web-general-maker):

1. Creates content/en/learn/swe/programming-languages/typescript/generics.md
2. Creates content/id/belajar/swe/programming-languages/typescript/generics.md (bilingual)
3. Updates content/en/learn/swe/programming-languages/typescript/\_index.md (navigation)
4. Updates content/id/belajar/swe/programming-languages/typescript/\_index.md (navigation)
5. Ensures overview.md/ikhtisar.md links are correct
6. Follows weight ordering convention (level-based)
7. Uses accessible colors in diagrams
8. Validates all internal links
9. Delivers complete, ready-to-publish content
```

### Stage 2: Checker (Validation)

**Role**: Validates content against conventions and generates audit reports

**Characteristics**:

- **Validation-driven** - Analyzes existing content for compliance
- **Non-destructive** - Does NOT modify files being checked
- **Comprehensive reporting** - Generates detailed audit reports in `generated-reports/`
- **Evidence-based** - Re-validates findings to prevent false positives (in fixer stage)

**Tool Pattern**: `Read`, `Glob`, `Grep`, `Write`, `Bash` (read-only + report generation)

- `Write` needed for audit report files
- `Bash` needed for UTC+7 timestamps in report filenames

**Color**: 🟩 Green (Checker agents)

**Examples**:

| Agent                                 | Validates                                       | Generates Report                                                |
| ------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| repo-rules-checker                    | AGENTS.md, agents, conventions, documentation   | `repo-rules__{uuid-chain}__{timestamp}__audit.md`               |
| apps-ayokoding-web-general-checker    | General Next.js content (frontmatter, links)    | `ayokoding-web__{uuid-chain}__{timestamp}__audit.md`            |
| apps-ayokoding-web-by-example-checker | By-example tutorials (coverage, annotations)    | `ayokoding-web-by-example__{uuid-chain}__{timestamp}__audit.md` |
| docs-tutorial-checker                 | Tutorial pedagogy, narrative flow, visual aids  | `docs-tutorial__{uuid-chain}__{timestamp}__audit.md`            |
| apps-oseplatform-web-content-checker  | Platform content (structure, formatting, links) | `oseplatform-web__{uuid-chain}__{timestamp}__audit.md`          |
| readme-checker                        | README engagement, accessibility, jargon        | `readme__{uuid-chain}__{timestamp}__audit.md`                   |

**Note on Report File Naming**: The `__` (double underscore) in report filenames (e.g., `readme__{timestamp}__audit.md`) is the **report file naming separator** defined in the [Temporary Files Convention](../infra/temporary-files.md), separating agent-family prefix, UUID chain, and timestamp. This is NOT an old agent name - it is the standard 4-part pattern: `{agent-family}__{uuid-chain}__{timestamp}__{type}.md`.

**Key Responsibilities**:

- PASS: Validate content against conventions
- PASS: Generate audit reports with specific line numbers
- PASS: Categorize issues by criticality (CRITICAL/HIGH/MEDIUM/LOW)
- PASS: Provide actionable recommendations
- PASS: Do NOT modify files being checked

**Criticality Categorization** (see [Criticality Levels Convention](../quality/criticality-levels.md)):

Checkers categorize findings by **importance/urgency**:

- **CRITICAL** - Breaks functionality, blocks users (must fix before publication)
- **HIGH** - Significant quality degradation, convention violations (should fix)
- **MEDIUM** - Minor quality issues, style inconsistencies (fix when convenient)
- **LOW** - Suggestions, optional improvements (consider for future)

**Report Format**: Findings grouped by criticality in standardized sections with emoji indicators for accessibility.

**When to Use**: Need to **validate content quality** before publication or after maker changes

**Example Workflow**:

```markdown
User: "Check the new TypeScript tutorial for quality issues"

Checker Agent (apps-ayokoding-web-general-checker):

1. Reads content/en/learn/swe/programming-languages/typescript/generics.md
2. Validates frontmatter (date format, required fields, weight ordering)
3. Checks content structure (heading hierarchy, link format)
4. Validates Next.js content conventions (link format, frontmatter)
5. Checks content quality (alt text, accessible colors, etc.)
6. Generates audit report: generated-reports/ayokoding-web**2025-12-14--20-45**audit.md
7. Reports findings in conversation (summary only)
8. Does NOT modify the tutorial file
```

### Stage 3: Fixer (Remediation)

**Role**: Applies validated fixes from checker audit reports

**Characteristics**:

- **Validation-driven** - Works from checker audit reports (not user requests)
- **Re-validation before fixing** - Confirms issues still exist (prevents false positives)
- **Confidence-based** - Only applies HIGH confidence fixes automatically
- **Safe application** - Skips MEDIUM (manual review) and FALSE_POSITIVE findings
- **Audit trail** - Generates fix reports for transparency

**Tool Pattern**: `Read`, `Edit`, `Glob`, `Grep`, `Write`, `Bash` (modification + report generation)

- `Edit` for applying fixes (NOT `Write` which creates new files)
- `Write` for fix report generation
- `Bash` for timestamps

**Color**: 🟨 Yellow (Fixer agents) - Applies validated fixes

**Examples**:

| Agent                               | Fixes                                               | Generates Report                                              | Tools Used            |
| ----------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- | --------------------- |
| repo-rules-fixer                    | Convention violations from repo-rules-checker       | `repo-rules__{uuid-chain}__{timestamp}__fix.md`               | Bash (not Edit/Write) |
| apps-ayokoding-web-general-fixer    | General Next.js content issues from general-checker | `ayokoding-web__{uuid-chain}__{timestamp}__fix.md`            | Edit, Write, Bash     |
| apps-ayokoding-web-by-example-fixer | By-example tutorial issues from by-example-checker  | `ayokoding-web-by-example__{uuid-chain}__{timestamp}__fix.md` | Edit, Write, Bash     |
| readme-fixer                        | README quality issues from readme-checker           | `readme__{uuid-chain}__{timestamp}__fix.md`                   | Edit, Write, Bash     |

**Note**: `repo-rules-fixer` is a special case that uses bash commands (sed, awk, cat) instead of Edit/Write tools for file modifications. It still needs bash for report generation and timestamps.

**Key Responsibilities**:

- PASS: Read audit reports from checker agents
- PASS: Re-validate each finding before applying fix
- PASS: Apply HIGH confidence fixes automatically (priority-based)
- PASS: Skip MEDIUM confidence (needs manual review)
- PASS: Report FALSE_POSITIVE findings for checker improvement
- PASS: Generate comprehensive fix reports

**Priority-Based Execution** (see [Fixer Confidence Levels Convention - Integration](../quality/fixer-confidence-levels.md#integration-with-criticality-levels)):

Fixers combine **criticality** (importance) with **confidence** (certainty) to determine priority:

| Priority         | Criticality × Confidence         | Action                               |
| ---------------- | -------------------------------- | ------------------------------------ |
| **P0** (Blocker) | CRITICAL + HIGH                  | Auto-fix immediately, block if fails |
| **P1** (Urgent)  | HIGH + HIGH OR CRITICAL + MEDIUM | Auto-fix or urgent review            |
| **P2** (Normal)  | MEDIUM + HIGH OR HIGH + MEDIUM   | Auto-fix (if approved) or review     |
| **P3-P4** (Low)  | LOW combinations                 | Suggestions only                     |

**Execution Order**: P0 → P1 → P2 → P3-P4 ensures critical issues fixed before deployment proceeds.

**When to Use**: After checker identifies issues and user approves fixing them

**Example Workflow**:

```markdown
User: "Apply fixes from the latest ayokoding-web audit report"

Fixer Agent (apps-ayokoding-web-general-fixer):

1. Auto-detects latest: generated-reports/ayokoding-web**2025-12-14--20-45**audit.md
2. Parses findings (25 issues found)
3. Re-validates each finding:
   - 18 findings → HIGH confidence (apply fixes)
   - 4 findings → MEDIUM confidence (skip, flag for manual review)
   - 3 findings → FALSE_POSITIVE (skip, report to improve checker)
4. Applies 18 fixes (missing fields, wrong values, format errors)
5. Generates fix report: generated-reports/ayokoding-web**2025-12-14--20-45**fix.md
6. Reports summary: 18 fixed, 4 manual review needed, 3 false positives detected
```

## Common Workflows

### Basic Workflow: Create → Validate → Fix

**Scenario**: Creating new content from scratch

```
1. User Request: "Create new tutorial about X"
   ↓
2. Maker: Creates content + all dependencies
   ↓
3. User: Reviews content, looks good
   ↓
4. Checker: Validates content, finds minor issues
   ↓
5. User: Reviews audit report, approves fixes
   ↓
6. Fixer: Applies validated fixes
   ↓
7. Done: Content is production-ready
```

**Example**:

```bash
# Step 1: Create content
User: "Create TypeScript generics tutorial for ayokoding-web"
Agent: apps-ayokoding-web-general-maker (creates tutorial + navigation updates)

# Step 2: Validate
User: "Check the new tutorial"
Agent: apps-ayokoding-web-general-checker (generates audit report)

# Step 3: Fix
User: "Apply the fixes"
Agent: apps-ayokoding-web-general-fixer (applies validated fixes from audit)
```

### Iterative Workflow: Maker → Checker → Fixer → Checker

**Scenario**: Major content update requiring validation of fixes

```
1. User Request: "Update existing content X"
   ↓
2. Maker: Updates content + dependencies
   ↓
3. Checker: Validates, finds issues
   ↓
4. User: Reviews audit, approves fixes
   ↓
5. Fixer: Applies fixes
   ↓
6. Checker: Re-validates to confirm fixes worked
   ↓
7. Done: Content verified clean
```

**When to use**: Critical content, major refactoring, or when fixer confidence is uncertain

### Update Workflow: Maker (update mode) → Checker

**Scenario**: Updating existing content that's already high quality

```
1. User Request: "Add section Y to existing content X"
   ↓
2. Maker: Updates content (already validated during creation)
   ↓
3. Checker: Quick validation (optional, for confirmation)
   ↓
4. Done: High-quality content remains high-quality
```

**When to use**: Minor updates to well-maintained content

## Agent Categorization by Color

The maker-checker-fixer pattern aligns with the agent color categorization system:

| Color         | Role     | Stage   | Tool Pattern                                 | Examples                                                                                  |
| ------------- | -------- | ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 🟦 **Blue**   | Writers  | Maker   | Has `Write` (creates new files)              | apps-ayokoding-web-general-maker, apps-ayokoding-web-by-example-maker, readme-maker       |
| 🟩 **Green**  | Checkers | Checker | Has `Write`, `Bash` (no `Edit`)              | apps-ayokoding-web-general-checker, apps-ayokoding-web-by-example-checker, readme-checker |
| 🟨 **Yellow** | Fixers   | Fixer   | Has `Edit` + `Write` (for report generation) | repo-rules-fixer                                                                          |

**Note**: Purple (🟪 Implementors) agents execute plans and use all tools, falling outside the maker-checker-fixer pattern.

See [AI Agents Convention - Agent Color Categorization](../agents/ai-agents.md#agent-color-categorization) for complete details.

## Agent Families

### 1. repo-governance-\* (Repository Consistency)

**Domain**: Repository-wide consistency across agents, conventions, AGENTS.md, and documentation

**Note**: The execution scope identifier for this family is `repo-rules` (used in `EXECUTION_SCOPE=repo-rules`), while the agent file names use the prefix `repo-governance-`. This naming difference is intentional: "repo-rules" describes the scope of concern (repository rules), while "repo-governance" describes the agent purpose (governance enforcement).

**Agents**:

- **repo-rules-maker** (🟦 Maker) - Propagates rule changes across multiple files
- **repo-rules-checker** (🟩 Checker) - Validates consistency, generates audit reports
- **repo-rules-fixer** (🟨 Fixer) - Applies validated fixes from audit reports

**Use Case**: Maintaining consistency when adding/modifying conventions or standards

**Example**:

```
1. repo-rules-maker: Add new emoji usage rule to convention doc + update AGENTS.md + update agents
2. repo-rules-checker: Validate all files comply with new rule
3. repo-rules-fixer: Fix non-compliant files found in audit
```

### 2. apps-ayokoding-web-\* (Next.js 16 Content for ayokoding-web)

**Domain**: Next.js 16 content for ayokoding-web (App Router, TypeScript, tRPC) - learning content, blog posts, by-example tutorials

**Agents (General/By-Example/In-the-Field)**:

- **apps-ayokoding-web-general-maker** (🟦 Maker) - Creates general Next.js learning content following conventions
- **apps-ayokoding-web-by-example-maker** (🟦 Maker) - Creates by-example tutorials with annotated code
- **apps-ayokoding-web-general-checker** (🟩 Checker) - Validates general Next.js content (frontmatter, links, quality)
- **apps-ayokoding-web-by-example-checker** (🟩 Checker) - Validates by-example tutorial quality (coverage, annotations)
- **apps-ayokoding-web-general-fixer** (🟨 Fixer) - Fixes general Next.js content issues
- **apps-ayokoding-web-by-example-fixer** (🟨 Fixer) - Fixes by-example tutorial issues
- **apps-ayokoding-web-in-the-field-maker** (🟦 Maker) - Creates in-the-field tutorials from real-world experiences
- **apps-ayokoding-web-in-the-field-checker** (🟩 Checker) - Validates in-the-field tutorial quality
- **apps-ayokoding-web-in-the-field-fixer** (🟨 Fixer) - Applies validated fixes to in-the-field tutorials

**Agents (Factual Accuracy)**:

- **apps-ayokoding-web-facts-checker** (🟩 Checker) - Validates factual accuracy of ayokoding-web content using WebSearch/WebFetch. Verifies command syntax, versions, code examples, external references with confidence classification
- **apps-ayokoding-web-facts-fixer** (🟨 Fixer) - Applies validated fixes from facts-checker audit reports

**Agents (Link Validation)**:

- **apps-ayokoding-web-link-checker** (🟩 Checker) - Validates links in ayokoding-web content following absolute path convention (/docs/path without .md). Checks internal and external links
- **apps-ayokoding-web-link-fixer** (🟨 Fixer) - Applies validated fixes from link-checker audit reports

**Use Case**: Creating and validating educational content for ayokoding-web

**Example (General Content)**:

```
1. apps-ayokoding-web-general-maker: Create TypeScript tutorial with bilingual content
2. apps-ayokoding-web-general-checker: Validate frontmatter, links, navigation, weight ordering
3. apps-ayokoding-web-general-fixer: Apply validated fixes from audit
```

**Example (By-Example Tutorial)**:

```
1. apps-ayokoding-web-by-example-maker: Create Golang by-example with 75-90 annotated examples
2. apps-ayokoding-web-by-example-checker: Validate 95% coverage, annotations, self-containment
3. apps-ayokoding-web-by-example-fixer: Apply validated fixes from audit
```

### 3. docs-tutorial-\* (Tutorial Quality)

**Domain**: Tutorial pedagogy, narrative flow, visual completeness, hands-on elements

**Agents**:

- **docs-tutorial-maker** (🟦 Maker) - Creates tutorials with narrative flow and scaffolding
- **docs-tutorial-checker** (🟩 Checker) - Validates tutorial quality (pedagogy, visuals, exercises)
- **docs-tutorial-fixer** (🟨 Fixer) - Applies validated fixes from docs-tutorial-checker audit reports

**Use Case**: Creating high-quality learning-oriented tutorials

**Example**:

```
1. docs-tutorial-maker: Create RAG tutorial with progressive scaffolding, diagrams, code examples
2. docs-tutorial-checker: Validate narrative flow, visual completeness, hands-on elements
3. docs-tutorial-fixer: Apply validated fixes for objective/mechanical issues (subjective quality improvements remain manual)
```

**Note**: docs-tutorial-fixer applies objective/mechanical fixes (missing sections, format violations) automatically. Subjective narrative quality improvements (flow, engagement, tone) require human judgment and manual review.

### 4. apps-oseplatform-web-content-\* (Next.js 16 Content for oseplatform-web)

**Domain**: Next.js 16 content for oseplatform-web (App Router, TypeScript, tRPC) - platform updates, about pages

**Agents**:

- **apps-oseplatform-web-content-maker** (🟦 Maker) - Creates platform content (updates, about)
- **apps-oseplatform-web-content-checker** (🟩 Checker) - Validates content structure, formatting
- **apps-oseplatform-web-content-fixer** (🟨 Fixer) - Applies validated fixes from apps-oseplatform-web-content-checker audit reports

**Use Case**: Creating and validating professional English content for platform landing page

**Example**:

```
1. apps-oseplatform-web-content-maker: Create beta release announcement post
2. apps-oseplatform-web-content-checker: Validate frontmatter, links, cover images
3. apps-oseplatform-web-content-fixer: Apply validated fixes from audit
```

### 5. readme-\* (README Quality)

**Domain**: README engagement, accessibility, scannability, jargon elimination

**Agents**:

- **readme-maker** (🟦 Maker) - Creates README content following quality standards
- **readme-checker** (🟩 Checker) - Validates engagement, accessibility, paragraph length
- **readme-fixer** (🟨 Fixer) - Applies validated fixes from readme-checker audit reports

**Use Case**: Maintaining high-quality, welcoming README files

**Example**:

```
1. readme-maker: Add Security section with problem-solution hook
2. readme-checker: Validate paragraph length, jargon, acronym context
3. readme-fixer: Apply validated fixes from audit
```

### 6. docs-\* (Documentation Factual Accuracy)

**Domain**: Documentation factual correctness, technical accuracy, code examples, contradictions

**Agents**:

- **docs-maker** (🟦 Maker) - Creates and edits documentation following conventions
- **docs-checker** (🟩 Checker) - Validates factual accuracy using WebSearch/WebFetch
- **docs-fixer** (🟨 Fixer) - Applies validated factual accuracy fixes

**Use Case**: Ensuring documentation is technically accurate and current

**Example**:

```
1. docs-maker: Create API documentation with code examples
2. docs-checker: Validate command syntax, version numbers, API methods against authoritative sources
3. docs-fixer: Fix incorrect command flags, update outdated versions, correct broken links
```

**Note**: docs-fixer distinguishes objective factual errors (command syntax, version numbers - apply automatically) from subjective improvements (narrative quality, terminology - manual review)

### 7. plan-\* (Plan Completeness and Structure)

**Domain**: Project plan structure, completeness, codebase alignment, technical accuracy

**Agents**:

- **plan-maker** (🟦 Maker) - Creates project planning documents
- **plan-checker** (🟩 Checker) - Validates plan readiness for implementation
- **plan-fixer** (🟨 Fixer) - Applies validated structural/format fixes

**Use Case**: Ensuring plans are complete and accurate before implementation

**Example**:

```
1. plan-maker: Create project plan with requirements, tech-docs, delivery checklist
2. plan-checker: Validate required sections exist, verify codebase assumptions, check technology choices
3. plan-fixer: Add missing sections, fix broken file references, correct format violations
```

**Note**: plan-fixer distinguishes structural/format issues (missing sections, broken links - apply automatically) from strategic decisions (technology choices, scope, architecture - manual review)

### 8. docs-software-engineering-separation-\* (SE Doc Separation)

**Domain**: Software engineering documentation separation between language-agnostic and language-specific content

**Agents**:

- **docs-software-engineering-separation-checker** (🟩 Checker) - Validates separation of SE content by language specificity
- **docs-software-engineering-separation-fixer** (🟨 Fixer) - Applies validated fixes to SE doc separation issues

**Use Case**: Ensuring programming language tutorials are properly separated between general SE concepts and language-specific implementations

**Example**:

```
1. docs-software-engineering-separation-checker: Validate docs/explanation/software-engineering/ separation
2. docs-software-engineering-separation-fixer: Move language-specific content to correct location
```

### 9. repo-workflow-\* (Workflow Documentation)

**Domain**: Workflow documentation in `governance/workflows/` — completeness, agent references, trigger conditions

**Agents**:

- **repo-workflow-maker** (🟦 Maker) - Creates workflow documentation following workflow pattern convention
- **repo-workflow-checker** (🟩 Checker) - Validates workflow documentation quality and compliance with workflow pattern convention
- **repo-workflow-fixer** (🟨 Fixer) - Applies validated fixes from workflow-checker audit reports

**Use Case**: Maintaining accurate and complete governance workflow documentation

**Example**:

```
1. repo-workflow-maker: Create new maker-checker-fixer workflow document
2. repo-workflow-checker: Validate completeness, agent references, trigger conditions
3. repo-workflow-fixer: Apply validated fixes to workflow documentation
```

## When to Use Each Stage

### When to Use Maker vs Fixer

**Use Maker when:**

- PASS: User explicitly requests content creation or updates
- PASS: Creating NEW content from scratch
- PASS: Making significant changes to EXISTING content
- PASS: Need comprehensive dependency management (indices, cross-refs)
- PASS: **User-driven workflow** (user says "create" or "update")

**Use Fixer when:**

- PASS: Checker has generated an audit report
- PASS: Issues are convention violations (not content gaps)
- PASS: Fixes are mechanical (field values, formatting, etc.)
- PASS: **Validation-driven workflow** (checker found issues)

**Example Distinction**:

```markdown
User: "Add a new tutorial about Docker" → Use MAKER (user-driven creation)
User: "Fix issues from the latest audit report" → Use FIXER (validation-driven fixes)
```

### When Checker is Optional vs Required

**Checker is OPTIONAL when:**

- Small, trivial updates (fixing typo, adding sentence)
- Content created by experienced maker (high confidence in quality)
- Time-sensitive changes (can validate later)

**Checker is REQUIRED when:**

- PASS: New content created from scratch
- PASS: Major refactoring or updates
- PASS: Before publishing to production
- PASS: Complex content (tutorials, Next.js web content)
- PASS: Critical files (AGENTS.md, convention docs)

**Best Practice**: When in doubt, run the checker. Validation is fast and prevents issues.

### When to Skip Fixer (Manual Fixes Preferred)

**Skip Fixer when:**

- FAIL: Issues require human judgment (narrative quality, engagement)
- FAIL: Fixes are context-dependent (different solutions for different cases)
- FAIL: Checker reports are unclear or ambiguous
- FAIL: User prefers manual control over changes

**Use Fixer when:**

- PASS: Issues are mechanical (missing fields, wrong values)
- PASS: Fixes are unambiguous (clear right answer)
- PASS: Many repetitive fixes needed (efficiency gain)
- PASS: Audit report has HIGH confidence findings

**Example**:

```markdown
# Use Fixer (mechanical fixes)

- Missing frontmatter fields → Fixer
- Wrong date format → Fixer
- Broken internal links → Fixer

# Manual fixes (human judgment required)

- Paragraph too long → Manual (needs content restructuring)
- Engaging hook missing → Manual (creative writing)
- Jargon detected → Manual (context-dependent rewording)
```

## Benefits of the Pattern

### 1. Separation of Concerns

Each agent has a **single, clear responsibility**:

- Maker focuses on **content creation** (not validation)
- Checker focuses on **validation** (not fixing)
- Fixer focuses on **remediation** (not detection)

**Result**: Agents are simpler, more maintainable, and less error-prone.

### 2. Safety Through Validation

**Problem without pattern**: Automated fixes might introduce new issues or break existing content.

**Solution with pattern**: Fixer re-validates findings before applying changes, categorizes by confidence level, and skips uncertain fixes.

**Result**: Safe, reliable automated remediation.

### 3. Audit Trail

Every validation and fix is **documented in generated-reports/**:

- Audit reports show what was checked and what was found
- Fix reports show what was changed and why
- Users can review history and understand changes

**Result**: Transparency and accountability.

### 4. Iterative Improvement

**False Positive Feedback Loop**:

```
Checker: Flags issue (potential false positive)
   ↓
Fixer: Re-validates, detects FALSE_POSITIVE
   ↓
Fixer: Reports false positive with suggestion for checker improvement
   ↓
User: Updates checker logic based on feedback
   ↓
Checker: Improved accuracy in future runs
```

**Result**: Pattern enables continuous improvement of validation logic.

### 5. Scalability

Pattern scales across **multiple domains** without reinventing the workflow:

- Same pattern for repo rules, Next.js web content, tutorials, READMEs
- Consistent user experience across all content types
- New families can adopt pattern easily

**Result**: Standardized quality control across entire repository.

## Integration with Conventions

The maker-checker-fixer pattern integrates with repository conventions:

| Convention                                                                  | How Pattern Uses It                                             |
| --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [AI Agents Convention](../agents/ai-agents.md)                              | Defines agent structure, tool permissions, color coding         |
| [Criticality Levels Convention](../quality/criticality-levels.md)           | Checkers categorize by criticality, fixers use for priority     |
| [Fixer Confidence Levels Convention](../quality/fixer-confidence-levels.md) | Fixers assess confidence, combine with criticality for priority |
| [Repository Validation Methodology](../quality/repository-validation.md)    | Standard validation patterns used by checker/fixer              |
| [Content Quality Principles](../../conventions/writing/quality.md)          | What checkers validate (quality standards)                      |
| [Hugo Content Convention](../../conventions/hugo/shared.md)                 | Historical Hugo standards (both sites now on Next.js 16)        |
| [Tutorial Convention](../../conventions/tutorials/general.md)               | What docs-tutorial-maker/checker enforce                        |
| [README Quality Convention](../../conventions/writing/readme-quality.md)    | What readme-maker/checker enforce                               |
| [Temporary Files Convention](../infra/temporary-files.md)                   | Where checker/fixer reports are stored                          |

**Key Point**: The pattern is a **workflow framework**. The conventions define **what** to validate/enforce.

## Preventing Iteration Loops

Without explicit mechanisms to track accepted decisions, checker-fixer workflows can enter infinite or very long iteration loops. This section defines the three structural safeguards that prevent runaway iterations.

### 1. FALSE_POSITIVE Persistence (`.known-false-positives.md`)

**Problem**: Checker re-flags the same accepted FALSE_POSITIVE findings on every iteration because it has no memory of previous decisions.

**Solution**: Fixer writes all accepted FALSE_POSITIVE findings to `generated-reports/.known-false-positives.md`. Checker reads this file at the start of every run and skips any matching entries.

**Key format**: `[category] | [file] | [brief-description]` — stable across runs.

**Checker behavior**: When a finding matches the skip list, log as `[PREVIOUSLY ACCEPTED FALSE_POSITIVE — skipped]` in the informational section. Do NOT count in findings total.

**Fixer behavior**: At end of every fix report, append each FALSE_POSITIVE to `.known-false-positives.md` and include an `## Accepted FALSE_POSITIVE Findings` section in the fix report.

### 2. Scoped Re-validation (Changed Files Only)

**Problem**: Full-repo scan on every iteration re-validates all ~265 software documentation files even when the fixer only changed 3-4 agent files.

**Solution**: Fixer captures `git diff --name-only HEAD` after applying fixes and includes the list in the fix report under `## Changed Files (for Scoped Re-validation)`. Checker in re-validation mode (identified by multi-part UUID chain like `abc123_def456`) focuses Step 8 validation only on the listed changed files.

**Result**: Subsequent iterations are 10-50x faster, reducing unnecessary work on unchanged content.

### 3. Self-Verification After Bash Edits

**Problem**: Fixer logs "fixed" after a `sed -i` command even when the pattern didn't match (`sed` exits 0 regardless). This causes garbled file content and infinite loops (checker re-flags, fixer "fixes" again with no effect).

**Solution**: After every bash or sed edit, immediately verify with grep:

```bash
sed -i 's/old-pattern/new-pattern/' file.md
grep -q "new-pattern" file.md || echo "WARNING: sed pattern did not match — fix NOT applied"
```

If verification fails, log the fix as FAILED (not applied). Do NOT log as "fixed".

**For multi-line reformatting**: Use Python, not sed. `sed` is line-oriented and silently fails on multi-line patterns. Python's string replacement is explicit and predictable.

### 4. Escalation After 2+ Iteration Disagreements

**Problem**: Checker and fixer disagree on the same finding for 2 or more iterations (checker flags, fixer marks FALSE_POSITIVE, checker re-flags after accepting the FALSE_POSITIVE was wrong).

**Solution**: If the `.known-false-positives.md` skip list is loaded but checker still flags the same item (meaning the skip key didn't match), this indicates the skip key format is inconsistent. Escalate to maker for governance decision:

1. Fixer marks the finding as `ESCALATED` in the fix report (not FALSE_POSITIVE, not applied)
2. Fixer notifies user: "This finding has been re-flagged after a FALSE_POSITIVE acceptance. Manual review required."
3. Maker updates the relevant convention or agent to resolve the root ambiguity

**Goal**: The workflow should converge in 1-3 iterations. If it hasn't converged after 5 iterations, stop and escalate to maker.

## Related Documentation

**Pattern Implementation**:

- [AI Agents Convention](../agents/ai-agents.md) - Agent structure and tool permissions
- [Repository Validation Methodology](../quality/repository-validation.md) - Validation patterns and techniques
- [Temporary Files Convention](../infra/temporary-files.md) - Report storage and naming

**Workflow Orchestration**:

- [Workflow Pattern Convention](../../workflows/meta/workflow-identifier.md) - How workflows orchestrate agents

**Domain-Specific Standards**:

- [Content Quality Principles](../../conventions/writing/quality.md) - Universal content standards
- [Hugo Content Convention - Shared](../../conventions/hugo/shared.md) - Historical Hugo standards (DEPRECATED — both sites migrated to Next.js 16)
- [Hugo Content Convention - ayokoding](../../conventions/hugo/ayokoding.md) - Historical ayokoding-web Hugo specifics (DEPRECATED)
- [Hugo Content Convention - OSE Platform](../../conventions/hugo/ose-platform.md) - Historical oseplatform-web Hugo specifics (DEPRECATED)
- [Tutorial Convention](../../conventions/tutorials/general.md) - Tutorial quality standards
- [README Quality Convention](../../conventions/writing/readme-quality.md) - README standards

**Agent Examples**:

- `.claude/agents/repo-rules-maker.md` - Example maker agent
- `.claude/agents/repo-rules-checker.md` - Example checker agent
- `.claude/agents/repo-rules-fixer.md` - Example fixer agent
- `.claude/agents/apps-ayokoding-web-general-maker.md` - General Next.js content maker
- `.claude/agents/apps-ayokoding-web-by-example-maker.md` - By-example tutorial maker
- `.claude/agents/apps-ayokoding-web-general-checker.md` - General Next.js content checker
- `.claude/agents/apps-ayokoding-web-by-example-checker.md` - By-example tutorial checker
- `.claude/agents/apps-ayokoding-web-general-fixer.md` - General Next.js content fixer
- `.claude/agents/apps-ayokoding-web-by-example-fixer.md` - By-example tutorial fixer

---

This pattern provides a **systematic, scalable, and safe approach** to content quality management across multiple domains. By separating creation, validation, and remediation into distinct stages, we achieve high-quality content through iterative improvement and automated safeguards.
