---
description: "Three agent families using this pattern."
when_to_use: "Use for tutorials, ose-www content, or READMEs."
---

# Agent Families — docs-tutorial, ose-www-content, and readme

## 3. docs-tutorial-\* (Tutorial Quality)

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

## 4. apps-ose-www-content-\* (Next.js 16 Content for ose-www)

**Domain**: Next.js 16 content for ose-www (App Router, TypeScript, tRPC) - platform updates, about pages

**Agents**:

- **apps-ose-www-content-maker** (🟦 Maker) - Creates platform content (updates, about)
- **content-checker** (🟩 Checker) - Validates content structure, formatting
- **content-fixer** (🟨 Fixer) - Applies validated fixes from content-checker audit reports

**Use Case**: Creating and validating professional English content for platform landing page

**Example**:

```
1. apps-ose-www-content-maker: Create beta release announcement post
2. content-checker: Validate frontmatter, links, cover images
3. content-fixer: Apply validated fixes from audit
```

## 5. readme-\* (README Quality)

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
