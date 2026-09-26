---
description: "Universal vs domain-specific confidence criteria."
when_to_use: "Use when writing confidence criteria for a new fixer."
---

# Domain-Specific vs Universal Criteria

## What's Universal

These criteria apply across ALL fixer agents:

**HIGH Confidence Universal Criteria:**

- Issue is objective and verifiable
- Re-validation confirms issue exists
- Fix is straightforward and safe
- No context-dependent judgment required

**MEDIUM Confidence Universal Criteria:**

- Issue is subjective or context-dependent
- Multiple valid interpretations exist
- Requires human judgment or creativity
- Fix could harm quality in certain contexts

**FALSE_POSITIVE Universal Criteria:**

- Re-validation clearly disproves issue
- Checker's detection logic was flawed
- Content is actually compliant

## What Varies by Domain

Each fixer agent has domain-specific validation checks:

**repo-workflow-fixer:**

- Frontmatter field validation for agent files
- File naming convention compliance
- Structural consistency across repository

**apps-ayokoding-www-general-fixer:**

- Next.js/MDX frontmatter for ayokoding-www
- Bilingual content validation (en/id)
- Learning content specific rules (overview/ikhtisar, weight ordering)
- Navigation link format (absolute paths with language prefix)

**docs-tutorial-fixer:**

- Tutorial-specific structure (Introduction, Prerequisites, Learning Objectives)
- LaTeX notation compliance
- Tutorial naming patterns by type

**apps-ose-www-content-fixer:**

- Next.js/MDX frontmatter for ose-www
- English-only content validation
- Cover image alt text requirements
- Heading hierarchy (single H1 rule)

**readme-fixer:**

- README-specific quality standards
- Paragraph length limits (≤5 lines)
- Acronym context requirements
- Plain language preferences (with technical section exceptions)

**Key Point:** While validation checks differ, the confidence level criteria remain universal.
