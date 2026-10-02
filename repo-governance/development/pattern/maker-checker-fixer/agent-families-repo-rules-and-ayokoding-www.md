---
description: "Two agent families using this pattern."
when_to_use: "Use for repo-wide rules or ayokoding-www content."
---

# Agent Families — repo-rules and ayokoding-www

## 1. repo-rules-\* (Repository Consistency)

**Domain**: Repository-wide consistency across agents, conventions, AGENTS.md, and documentation

**Agents**:

- **rules-maker** (🟦 Maker) - Propagates rule changes across multiple files
- **rules-checker** (🟩 Checker) - Validates consistency, generates audit reports
- **rules-propagation** (workflow, not an agent) - Sole writer of every rule edit

**Use Case**: Maintaining consistency when adding/modifying conventions or standards

**Example**:

```
1. rules-maker: Add new emoji usage rule to convention doc + update AGENTS.md + update agents
2. rules-checker: Validate all files comply with new rule
3. rules-propagation: Write every fix for non-compliant files found in the audit
```

## 2. apps-ayokoding-www-\* (Next.js 16 Content for ayokoding-www)

**Domain**: Next.js 16 content for ayokoding-www (App Router, TypeScript, tRPC) - learning content, blog posts, by-example tutorials

**Agents (General/By-Example/In-the-Field)**:

- **apps-ayokoding-www-general-maker** (🟦 Maker) - Creates general Next.js learning content following conventions
- **apps-ayokoding-www-by-example-maker** (🟦 Maker) - Creates by-example tutorials with annotated code
- **content-checker** (🟩 Checker) - Validates general Next.js content (frontmatter, links, quality)
- **tutorial-by-example-checker** (🟩 Checker) - Validates by-example tutorial quality (coverage, annotations)
- **content-fixer** (🟨 Fixer) - Fixes general Next.js content issues
- **tutorial-by-example-fixer** (🟨 Fixer) - Fixes by-example tutorial issues
- **apps-ayokoding-www-in-the-field-maker** (🟦 Maker) - Creates in-the-field tutorials from real-world experiences
- **tutorial-in-the-field-checker** (🟩 Checker) - Validates in-the-field tutorial quality
- **tutorial-in-the-field-fixer** (🟨 Fixer) - Applies validated fixes to in-the-field tutorials

**Agents (Factual Accuracy)**:

- **content-checker** (🟩 Checker) - Validates factual accuracy of ayokoding-www content using WebSearch/WebFetch. Verifies command syntax, versions, code examples, external references with confidence classification
- **content-fixer** (🟨 Fixer) - Applies validated fixes from facts-checker audit reports

**Agents (Link Validation)**:

- **apps-ayokoding-www-link-checker** (🟩 Checker) - Validates links in ayokoding-www content following absolute path convention (/docs/path without .md). Checks internal and external links
- **apps-ayokoding-www-link-fixer** (🟨 Fixer) - Applies validated fixes from link-checker audit reports

**Use Case**: Creating and validating educational content for ayokoding-www

**Example (General Content)**:

```
1. apps-ayokoding-www-general-maker: Create TypeScript tutorial with bilingual content
2. content-checker: Validate frontmatter, links, navigation, weight ordering
3. content-fixer: Apply validated fixes from audit
```

**Example (By-Example Tutorial)**:

```
1. apps-ayokoding-www-by-example-maker: Create Golang by-example with 75-90 annotated examples
2. tutorial-by-example-checker: Validate 95% coverage, annotations, self-containment
3. tutorial-by-example-fixer: Apply validated fixes from audit
```
