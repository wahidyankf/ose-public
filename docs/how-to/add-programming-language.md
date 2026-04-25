---
title: "How to Add a Programming Language"
description: "Step-by-step guide for adding programming languages to ayokoding-web following the Programming Language Content Standard"
category: how-to
tags:
  - programming-languages
  - ayokoding
  - content-creation
  - tutorials
  - implementation
created: 2025-12-18
---

# How to Add a Programming Language

> **Note**: This guide was written when ayokoding-web was a Hugo static site. ayokoding-web has since migrated to Next.js 16. The content structure and tutorial standards remain applicable, but Hugo-specific instructions (frontmatter weights, `_index.md` navigation files, Hugo build commands, Hextra shortcodes) no longer apply. Content now lives at `apps/ayokoding-web/content/`.

**Step-by-step guide for adding a new programming language to ayokoding-web following the Programming Language Content Standard.**

This guide walks you through the complete process of adding a new programming language (e.g., Kotlin, TypeScript, Rust, Clojure) to ayokoding-web. Follow these steps to ensure your content meets quality standards and integrates seamlessly with existing content.

## Prerequisites

Before starting, ensure you have:

- [ ] **Deep expertise** in the target language (5+ years experience recommended)
- [ ] **Access to repository** with write permissions to `apps/ayokoding-web/`
- [ ] **Familiarity with conventions**:
  - [Programming Language Content Standard](../../governance/conventions/tutorials/programming-language-content.md)
  - [Hugo Content Convention - ayokoding](../../governance/conventions/hugo/ayokoding.md)
  - [Content Quality Principles](../../governance/conventions/writing/quality.md)
- [ ] **AI agents available**:
  - `ayokoding-web-general-maker` (general content creation)
  - `ayokoding-web-by-example-maker` (by-example tutorial creation)
  - `ayokoding-web-general-checker` (general quality validation)
  - `ayokoding-web-by-example-checker` (by-example tutorial validation)
  - `ayokoding-web-facts-checker` (factual verification)
  - `ayokoding-web-link-checker` (link validation)
- [ ] **Reference implementations** studied (review Golang, Python, or Java content)

**Time Investment:** Adding a complete programming language requires creating 12,000-15,000 lines of high-quality content. Plan accordingly.

## Phase 1: Planning

### Step 1.1: Choose Language and Validate Demand

**Why:** Ensure the language addition provides value to ayokoding-web users.

**Actions:**

1. **Identify the language**: Kotlin, TypeScript, Rust, Clojure, etc.
2. **Validate demand**: Check if there's user interest (surveys, requests, market research)
3. **Assess uniqueness**: What does this language offer that existing languages don't?
4. **Determine paradigm fit**: How does it compare to existing languages?
   - Golang: Concurrent, compiled, simple
   - Python: Dynamic, multi-paradigm, beginner-friendly
   - Java: OOP, strongly-typed, enterprise
   - **Your language**: [Define key characteristics]

**Deliverable:** Brief justification document (can be internal notes)

### Step 1.2: Select Reference Implementation

**Why:** Leverage existing structure to accelerate content creation.

**Actions:**

1. **Choose closest match** from benchmark languages:
   - **Golang**: If your language emphasizes concurrency, compiled performance, or simplicity
   - **Python**: If your language is dynamic, multi-paradigm, or beginner-friendly
   - **Java**: If your language emphasizes OOP, strong typing, or enterprise patterns
2. **Note structural similarities**: What concepts map directly?
3. **Identify unique aspects**: What topics are language-specific?

**Deliverable:** Reference language choice and customization notes

### Step 1.3: Plan Content Scope

**Why:** Define what "done" means before starting.

**Actions:**

1. **Decide on completeness level**:
   - **Full implementation**: All 5 tutorials + 15 how-to guides + cookbook (recommended)
   - **Minimum viable**: Initial Setup + Quick Start + Beginner + 8 how-to guides + cookbook
2. **Map coverage levels** to language complexity:
   - What goes in 0-5% (Installation)?
   - What goes in 5-30% (Touchpoints)?
   - What goes in 0-60% (Fundamentals)?
   - What goes in 60-85% (Production)?
   - What goes in 85-95% (Expert)?
3. **Identify how-to topics** (12-18 language-specific problems)
4. **Plan cookbook categories** (30+ recipes)

**Deliverable:** Content outline with topics mapped to coverage levels

## Phase 2: Setup

### Step 2.1: Create Directory Structure

**Why:** Establish the foundation for all content.

**Actions:**

1. Navigate to ayokoding-web content directory:

   ```bash
   cd apps/ayokoding-web/content/en/learn/swe/programming-languages/
   ```

2. Create language directory (use lowercase, no special characters):

   ```bash
   mkdir [language-name]  # e.g., kotlin, typescript, rust
   cd [language-name]
   ```

3. Create standard subdirectories:

   ```bash
   mkdir tutorials how-to explanation reference
   ```

4. Create tutorial files:

   ```bash
   touch tutorials/_index.md
   touch tutorials/overview.md
   touch tutorials/initial-setup.md
   touch tutorials/quick-start.md
   touch tutorials/beginner.md
   touch tutorials/intermediate.md
   touch tutorials/advanced.md
   ```

5. Create how-to files:

   ```bash
   touch how-to/_index.md
   touch how-to/overview.md
   touch how-to/cookbook.md
   # Add 12-18 specific how-to guides based on your plan
   ```

6. Create explanation files:

   ```bash
   touch explanation/_index.md
   touch explanation/overview.md
   touch explanation/best-practices.md
   touch explanation/anti-patterns.md
   ```

7. Create reference files:

   ```bash
   touch reference/_index.md
   touch reference/overview.md
   ```

8. Create main index and overview:

   ```bash
   cd ..  # Back to [language-name]/ directory
   touch _index.md
   touch overview.md
   ```

**Deliverable:** Complete directory structure with empty files

### Step 2.2: Set Up Navigation Files

**Why:** Enable Hugo navigation and establish content hierarchy.

**Actions:**

1. **Create `_index.md` (navigation hub)**:

   ```yaml
   ---
   title: [Language Name]  # e.g., "Kotlin"
   date: YYYY-MM-DDTHH:MM:SS+07:00
   draft: false
   description: Complete learning path from installation to expert mastery - organized using the Diátaxis framework
   weight: 10002  # Level 5 (represents the language folder)
   type: docs
   layout: list
   ---

   - [Overview](/en/learn/swe/programming-languages/[language]/overview)
   - [Tutorials](/en/learn/swe/programming-languages/[language]/tutorials)
     - [Overview](/en/learn/swe/programming-languages/[language]/tutorials/overview)
     - [Initial Setup](/en/learn/swe/programming-languages/[language]/tutorials/initial-setup)
     - [Quick Start](/en/learn/swe/programming-languages/[language]/tutorials/quick-start)
     - [Beginner](/en/learn/swe/programming-languages/[language]/tutorials/beginner)
     - [Intermediate](/en/learn/swe/programming-languages/[language]/tutorials/intermediate)
     - [Advanced](/en/learn/swe/programming-languages/[language]/tutorials/advanced)
   - [How-To Guides](/en/learn/swe/programming-languages/[language]/how-to)
     - [Overview](/en/learn/swe/programming-languages/[language]/how-to/overview)
     - [Cookbook](/en/learn/swe/programming-languages/[language]/how-to/cookbook)
     - [... add your 12-18 how-to guides here ...]
   - [Reference](/en/learn/swe/programming-languages/[language]/reference)
     - [Overview](/en/learn/swe/programming-languages/[language]/reference/overview)
   - [Explanation](/en/learn/swe/programming-languages/[language]/explanation)
     - [Overview](/en/learn/swe/programming-languages/[language]/explanation/overview)
     - [Best Practices and Idioms](/en/learn/swe/programming-languages/[language]/explanation/best-practices)
     - [Anti-Patterns](/en/learn/swe/programming-languages/[language]/explanation/anti-patterns)
   ```

   **Note**: Programming language folders are at level 5 (`/en/learn/swe/programming-languages/[language]/`). The folder's `_index.md` uses level 5 weight (10002 to position among other languages), while content INSIDE the folder (like `overview.md`, `tutorials/`, etc.) uses level 6 weights starting at 100000.

2. **Create `overview.md` (learning path guide)**:
   - See [Golang overview.md](../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/overview.md) as template
   - Include: Full Set description, learning path table, tutorial structure, topics covered

**Deliverable:** Navigation files with proper frontmatter and structure

## Phase 3: Content Creation

### Step 3.1: Create Initial Setup Tutorial (0-5%)

**Why:** Get learners up and running quickly.

**Actions:**

1. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Initial Setup tutorial for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/tutorials/initial-setup.md

   Coverage: 0-5% (Installation and verification)
   Topics: Installation (Windows/macOS/Linux), version verification, first Hello World program, basic tool setup
   Reference: [Link to reference language initial-setup.md]"
   ```

2. **Required sections**:
   - Installation instructions (platform-specific)
   - Version verification
   - First program (Hello, World!)
   - Tool setup (IDE, compiler/interpreter, package manager)
   - Troubleshooting common issues

3. **Quality checklist**:
   - [ ] Runnable code examples (tested on all platforms)
   - [ ] Screenshot or output examples
   - [ ] Links to official installation guides
   - [ ] Version recommendations (specific version numbers)
   - [ ] Clear success criteria

**Target length:** 300-500 lines

**Deliverable:** Complete initial-setup.md file

### Step 3.2: Create Quick Start Tutorial (5-30%)

**Why:** Enable rapid exploration for experienced developers.

**Actions:**

1. **Identify 8-12 touchpoints** in order of importance:
   - Variables and types
   - Control flow
   - Functions
   - Data structures (language-specific)
   - Error handling
   - Language-specific key feature
   - Modules/packages
   - Testing basics

2. **Create Mermaid learning path diagram**:
   - Use color-blind friendly palette (#0173B2, #DE8F05, #029E73)
   - Show progression: Concept A → Concept B → ... → Ready!

3. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Quick Start tutorial for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/tutorials/quick-start.md

   Coverage: 5-30% (Touchpoints and core concepts)
   Touchpoints: [Your 8-12 concepts]
   Format: One concept, one example per section
   Include: Mermaid diagram with approved color palette
   Reference: [Link to reference language quick-start.md]"
   ```

4. **Quality checklist**:
   - [ ] Mermaid diagram with approved colors
   - [ ] One working example per touchpoint
   - [ ] No time estimates
   - [ ] Links to Beginner tutorial for depth
   - [ ] Prerequisites section

**Target length:** 600-900 lines

**Deliverable:** Complete quick-start.md file

### Step 3.3: Create Beginner Tutorial (0-60%)

**Why:** Build comprehensive foundation for learners.

**Actions:**

1. **Map fundamental topics** (10-15 major sections):
   - Complete type system
   - Functions and methods
   - Data structures (arrays, lists, maps, sets)
   - OOP or functional paradigm basics
   - Error handling patterns
   - File I/O
   - Testing fundamentals
   - Package/module system
   - Standard library essentials

2. **Design progressive exercises** (4 difficulty levels):
   - Level 1: Direct application
   - Level 2: Minor variations
   - Level 3: Combine concepts
   - Level 4: Problem-solving challenges

3. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Beginner tutorial for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/tutorials/beginner.md

   Coverage: 0-60% (Comprehensive fundamentals)
   Topics: [Your 10-15 major sections]
   Include: 4 difficulty levels for exercises, working code examples, cross-references to how-to guides
   Reference: [Link to reference language beginner.md]"
   ```

4. **Quality checklist**:
   - [ ] 10-15 major sections
   - [ ] Progressive exercises (4 levels)
   - [ ] Working code for every concept
   - [ ] Cross-references to relevant how-to guides
   - [ ] Clear learning objectives

**Target length:** 1,200-2,300 lines

**Deliverable:** Complete beginner.md file

### Step 3.4: Create Intermediate Tutorial (60-85%)

**Why:** Teach production-grade techniques.

**Actions:**

1. **Map production topics** (8-12 major sections):
   - Advanced language features
   - Concurrency/parallelism patterns
   - Design patterns
   - Testing strategies (integration, mocking, benchmarks)
   - Performance profiling and optimization
   - Database integration
   - API development
   - Configuration management
   - Security best practices
   - Deployment patterns

2. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Intermediate tutorial for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/tutorials/intermediate.md

   Coverage: 60-85% (Production-grade techniques)
   Topics: [Your 8-12 production topics]
   Include: Real-world scenarios, architecture patterns, performance considerations
   Reference: [Link to reference language intermediate.md]"
   ```

3. **Quality checklist**:
   - [ ] 8-12 major sections
   - [ ] Real-world scenarios
   - [ ] Production-ready code examples
   - [ ] Performance profiling examples
   - [ ] Security best practices

**Target length:** 1,000-1,700 lines

**Deliverable:** Complete intermediate.md file

### Step 3.5: Create Advanced Tutorial (85-95%)

**Why:** Enable expert-level mastery.

**Actions:**

1. **Map expert topics** (6-10 major sections):
   - Language runtime internals
   - Memory management and GC
   - Advanced concurrency
   - Reflection and metaprogramming
   - Performance optimization techniques
   - Advanced type system features
   - Debugging strategies
   - Tooling and ecosystem

2. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Advanced tutorial for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/tutorials/advanced.md

   Coverage: 85-95% (Expert mastery)
   Topics: [Your 6-10 expert topics]
   Include: Deep internals, optimization techniques, system design patterns
   Reference: [Link to reference language advanced.md]"
   ```

3. **Quality checklist**:
   - [ ] 6-10 major sections
   - [ ] Runtime internals explained
   - [ ] Advanced optimization examples
   - [ ] Debugging strategies
   - [ ] Links to language specification

**Target length:** 1,000-1,500 lines

**Deliverable:** Complete advanced.md file

### Step 3.6: Create Cookbook (Parallel Track)

**Why:** Provide practical, copy-paste solutions.

**Actions:**

1. **Identify 30-40 recipes** organized by category:
   - Data structures and algorithms (5-8 recipes)
   - Concurrency patterns (4-6 recipes)
   - Error handling (3-5 recipes)
   - Design patterns (5-8 recipes)
   - Web development (5-8 recipes)
   - Database patterns (3-5 recipes)
   - Testing patterns (3-5 recipes)
   - Performance optimization (3-5 recipes)

2. **Recipe format** (use for each):

   ````markdown
   ### Recipe: [Descriptive Name]

   **Problem:** [What problem does this solve?]

   **Solution:**

   ```[language]
   // Working, runnable code
   ```
   ````

   **How It Works:** [Explanation]

   **Use Cases:** [When to use this pattern]

   **Variations:** [Alternative approaches]

   ```

   ```

3. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Cookbook for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/how-to/cookbook.md

   Include: 30-40 recipes organized by category
   Format: Problem → Solution → How It Works → Use Cases for each recipe
   Categories: [Your 8 recipe categories]
   Reference: [Link to reference language cookbook.md]"
   ```

4. **Quality checklist**:
   - [ ] 30+ recipes
   - [ ] All code is runnable
   - [ ] Organized by clear categories
   - [ ] Cross-references to tutorials
   - [ ] Prerequisites noted (requires Beginner knowledge)

**Target length:** 4,000-5,500 lines

**Deliverable:** Complete cookbook.md file

### Step 3.7: Create How-To Guides (12-18 guides)

**Why:** Solve specific, common problems.

**Actions:**

1. **Identify language-specific problems** (examples):
   - Common language pitfalls (e.g., "How to Avoid [Language-Specific Error]")
   - Core feature usage (e.g., "How to Use [Key Feature] Effectively")
   - Architecture patterns (e.g., "How to Organize [Language] Packages")
   - Testing strategies (e.g., "How to Write Effective Tests")
   - Performance (e.g., "How to Handle Concurrency Properly")
   - Standard tasks (e.g., "How to Handle Files and Resources")

2. **Use consistent naming**: `how-to/[verb-phrase].md`
   - avoid-\* (pitfalls)
   - use-\* (features)
   - handle-\* (common tasks)
   - write-\* (code quality)
   - build-\* (applications)
   - manage-\* (configuration, dependencies)

3. **Create each guide** (can parallelize with agent):

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create how-to guide: [Guide Title] for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/how-to/[filename].md

   Include: Problem statement, solution (step-by-step), how it works, variations, common pitfalls
   Reference: [Link to similar guide in reference language]"
   ```

4. **Quality checklist per guide**:
   - [ ] Clear problem statement
   - [ ] Step-by-step solution
   - [ ] Working code example
   - [ ] Explanation of how it works
   - [ ] Common pitfalls section
   - [ ] Links to related tutorials/cookbook

**Target length per guide:** 200-500 lines

**Deliverable:** 12-18 complete how-to guides

### Step 3.8: Create Best Practices Document

**Why:** Teach idiomatic language usage.

**Actions:**

1. **Organize by category**:
   - Code organization
   - Naming conventions
   - Error handling
   - Performance
   - Security
   - Testing
   - Documentation
   - Language-specific idioms

2. **Use pattern format** for each practice:
   - **Principle name**
   - **Why it matters** (rationale)
   - **Good example** (code)
   - **Bad example** (code showing what to avoid)
   - **Exceptions** (when rule doesn't apply)

3. **Include "What Makes [Language] Special" section**

4. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Best Practices document for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/explanation/best-practices.md

   Include: Language philosophy, idiomatic patterns, good/bad examples, category organization
   Reference: [Link to reference language best-practices.md]"
   ```

**Target length:** 500-750 lines

**Deliverable:** Complete best-practices.md file

### Step 3.9: Create Anti-Patterns Document

**Why:** Help learners avoid common mistakes.

**Actions:**

1. **Identify common mistakes** from:
   - Your experience
   - Stack Overflow questions
   - Code review feedback
   - Language migration pitfalls (e.g., Java → Kotlin)

2. **Use anti-pattern format** for each:
   - **Anti-pattern name**
   - **Why it's problematic**
   - **Bad example** (code showing the mistake)
   - **Better approach** (corrected code)
   - **When you might see this** (context)

3. **Organize by severity**:
   - Critical (causes bugs, security issues)
   - Major (performance, maintainability)
   - Minor (style, idioms)

4. **Use ayokoding-web-general-maker agent**:

   ```
   Spawn ayokoding-web-general-maker agent:
   "Create Anti-Patterns document for [Language] at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/explanation/anti-patterns.md

   Include: Common mistakes, bad/better examples, severity categorization
   Reference: [Link to reference language anti-patterns.md]"
   ```

**Target length:** 500-750 lines

**Deliverable:** Complete anti-patterns.md file

### Step 3.10: Create Tutorial Overview

**Why:** Guide learners through the full learning path.

**Actions:**

1. **Explain the Full Set** (5 tutorials + cookbook)
2. **Provide learning path table** (experience level → recommended path)
3. **Describe tutorial structure** (Diátaxis principles, coverage levels)
4. **List topics covered** across all tutorials
5. **Include "What Makes [Language] Special"** section

**Use tutorials/overview.md from reference language as template**

**Target length:** 100-200 lines

**Deliverable:** Complete tutorials/overview.md file

## Phase 4: Validation

### Step 4.1: Run Content Quality Checks

**Why:** Ensure content meets Hugo and quality standards.

**Actions:**

1. **Run ayokoding-web-general-checker**:

   ```
   Spawn ayokoding-web-general-checker agent:
   "Validate all [Language] content at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/

   Check: Hugo conventions, content quality principles, structure compliance"
   ```

2. **Review audit report** in `generated-reports/`

3. **Fix any issues** found

4. **Re-run checker** until audit is clean

**Deliverable:** Clean content-checker audit

### Step 4.2: Run Factual Accuracy Checks

**Why:** Verify technical correctness of all code and claims.

**Actions:**

1. **Run ayokoding-web-facts-checker**:

   ```
   Spawn ayokoding-web-facts-checker agent:
   "Verify factual accuracy for [Language] content at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/

   Validate: Code examples, command syntax, version numbers, external references, technical claims"
   ```

2. **Review audit report** in `generated-reports/`

3. **Fix any factual errors** (update code, fix commands, correct versions)

4. **Re-run checker** until all facts verified

**Deliverable:** Clean facts-checker audit with ✅ Verified confidence

### Step 4.3: Run Link Validation

**Why:** Ensure all internal and external links work.

**Actions:**

1. **Run ayokoding-web-link-checker**:

   ```
   Spawn ayokoding-web-link-checker agent:
   "Validate links in [Language] content at apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/

   Check: Internal links, external URLs, cross-references"
   ```

2. **Review link status** (reported in conversation)

3. **Fix broken links**

4. **Re-run checker** until all links valid

**Deliverable:** All links validated (200 OK or redirects noted)

### Step 4.4: Manual Quality Review

**Why:** Verify pedagogical effectiveness and clarity.

**Actions:**

1. **Check pedagogical flow**:
   - [ ] Concepts build progressively
   - [ ] Examples are clear and relevant
   - [ ] Exercises match difficulty level
   - [ ] Cross-references are helpful

2. **Verify completeness**:
   - [ ] All 5 tutorials complete
   - [ ] 12+ how-to guides
   - [ ] 30+ cookbook recipes
   - [ ] Best practices + anti-patterns

3. **Test code examples**:
   - [ ] All code runs as-is
   - [ ] Output matches expectations
   - [ ] No missing imports/dependencies

4. **Check consistency**:
   - [ ] Terminology consistent across docs
   - [ ] Code style consistent
   - [ ] Voice and tone consistent

**Deliverable:** Manual review checklist completed

## Phase 5: Publishing

### Step 5.1: Create Pull Request (If Using Feature Branch)

**Note:** This repository uses Trunk Based Development - work happens on `main` branch. Only create PR if you used a feature branch.

**Actions:**

1. If on feature branch, create PR to `main`
2. Request review from team
3. Address feedback
4. Merge to `main`

### Step 5.2: Deploy to Production

**Why:** Make content available to ayokoding-web users.

**Actions:**

1. **Verify on main branch**: Ensure all changes are committed to `main`

2. **Run ayokoding-web-deployer**:

   ```
   Spawn ayokoding-web-deployer agent:
   "Deploy ayokoding-web to production (ayokoding.com)

   This will sync prod-ayokoding-web branch with main and trigger Vercel deployment."
   ```

3. **Verify deployment**:
   - Check Vercel deployment status
   - Visit <../../apps/ayokoding-web/content/en/learn/swe/programming-languages/[language]/>
   - Navigate through tutorials
   - Test a few code examples

**Deliverable:** Live content on ayokoding.com

### Step 5.3: Announce Launch

**Why:** Let users know new content is available.

**Actions:**

1. **Create announcement** (blog post, social media, newsletter)
2. **Highlight unique features** of the language
3. **Link to overview page**
4. **Encourage feedback**

**Deliverable:** Public announcement

## Post-Launch Maintenance

### Ongoing Tasks

1. **Quarterly fact checks**: Verify versions, syntax still current
2. **Monitor feedback**: Address user questions, confusion
3. **Update for language evolution**: New versions, deprecated features
4. **Fix broken links**: External URLs may change
5. **Expand content**: Add more how-to guides, cookbook recipes as needed

### Update Process

1. Make updates on `main` branch (Trunk Based Development)
2. Run validation agents (content-checker, facts-checker, link-checker)
3. Deploy via ayokoding-web-deployer
4. No need for feature branches for small updates

## Troubleshooting

### Common Issues

**Issue:** ayokoding-web-general-checker reports Hugo convention violations

**Solution:** Review [Hugo Content Convention - ayokoding](../../governance/conventions/hugo/ayokoding.md) and fix violations. Common issues:

- Missing frontmatter fields
- Incorrect weight values (use level-based system with correct levels)
- Wrong link format (use absolute paths with language prefix)

**Weight System Quick Reference:**

- **Programming language folder** (e.g., `/golang/`) is at **level 5**
  - Folder's `_index.md`: weight **10002** (level 5 - represents the folder)
- **Content inside language folder** (`overview.md`, category folders) is at **level 6**
  - `overview.md`: weight **100000** (level 6 base)
  - `tutorials/` folder's `_index.md`: weight **100002** (level 6 - represents the folder)
  - Other category folders: **100003**, **100004**, **100005**...
- **Content inside category folders** (tutorial files, how-to files) is at **level 7**
  - Use base **1000000** (resets per parent category)
  - `tutorials/overview.md`: **1000000** (level 7)
  - `how-to/overview.md`: **1000000** (RESET - different parent)

**Issue:** ayokoding-web-facts-checker reports ❌ Error or 📅 Outdated

**Solution:** Update technical claims with current information:

- Check official language documentation
- Verify version numbers
- Test code examples with latest version
- Update external references

**Issue:** Code examples don't run

**Solution:**

- Test examples in fresh environment
- Include all necessary imports/dependencies
- Verify syntax for target language version
- Add prerequisites section if needed

**Issue:** Content feels inconsistent with other languages

**Solution:** Review benchmark implementations (Golang, Python, Java):

- Check structure alignment
- Verify pedagogical patterns match
- Ensure similar depth/breadth
- Maintain voice and tone consistency

## Checklist: Language Addition Complete

Use this final checklist to verify completion:

### Structure

- [ ] All required directories created (tutorials/, how-to/, explanation/, reference/)
- [ ] All \_index.md files present
- [ ] All overview.md files present

### Tutorials

- [ ] Initial Setup (0-5%) complete and tested
- [ ] Quick Start (5-30%) complete with Mermaid diagram
- [ ] Beginner (0-60%) complete with exercises
- [ ] Intermediate (60-85%) complete with production patterns
- [ ] Advanced (85-95%) complete with internals
- [ ] Tutorial overview.md complete with learning paths

### How-To Guides

- [ ] Cookbook with 30+ recipes
- [ ] 12+ problem-solving guides
- [ ] All guides follow problem/solution/explanation format

### Explanation

- [ ] Best practices document (500+ lines)
- [ ] Anti-patterns document (500+ lines)
- [ ] Philosophy section included

### Quality

- [ ] ayokoding-web-general-checker audit clean
- [ ] ayokoding-web-facts-checker audit clean (✅ Verified)
- [ ] ayokoding-web-link-checker validation passed
- [ ] Manual quality review complete
- [ ] All code examples tested and runnable
- [ ] Mermaid diagrams use approved color palette
- [ ] No time estimates in content

### Publishing

- [ ] Content committed to main branch
- [ ] Deployed to production via ayokoding-web-deployer
- [ ] Verified live on ayokoding.com
- [ ] Announcement published

### Metrics (Target Values)

- [ ] Total content: 12,000-15,000 lines
- [ ] Beginner tutorial: 1,200-2,300 lines
- [ ] Intermediate tutorial: 1,000-1,700 lines
- [ ] Cookbook: 4,000-5,500 lines
- [ ] Cross-references: 15+ per tutorial
- [ ] Code examples: 25+ per major tutorial

**Congratulations!** You've successfully added a new programming language to ayokoding-web following the Programming Language Content Standard. Your content is now part of a consistent, high-quality educational platform.

## Related Documentation

- [Programming Language Content Standard](../../governance/conventions/tutorials/programming-language-content.md) - Complete standard definition
- [Hugo Content Convention - ayokoding](../../governance/conventions/hugo/ayokoding.md) - Hextra theme specifics
- [Content Quality Principles](../../governance/conventions/writing/quality.md) - Quality requirements
- [Tutorial Naming Convention](../../governance/conventions/tutorials/naming.md) - Tutorial level definitions
- [Factual Validation Convention](../../governance/conventions/writing/factual-validation.md) - Fact-checking methodology
- [Color Accessibility Convention](../../governance/conventions/formatting/color-accessibility.md) - Approved color palette
