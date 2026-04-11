---
title: "Programming Language Content Standard"
description: "Universal content architecture for programming language education on ayokoding-web with mandatory structure, coverage model, and quality benchmarks"
category: explanation
subcategory: conventions
tags:
  - programming-languages
  - ayokoding
  - tutorials
  - education
  - content-standards
created: 2025-12-18
updated: 2025-12-23
---

# Programming Language Content Standard

**Defines the universal content architecture for programming language education on ayokoding-web.**

All programming language content on ayokoding-web follows a standardized **Full Set Tutorial Package** architecture: 5 mandatory components (foundational tutorials, by-concept track, by-example track, cookbook, plus supporting documentation) providing complete language education from 0% to 95% coverage through multiple learning modalities.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Progressive Disclosure](../../principles/content/progressive-disclosure.md)**: Coverage levels (0-5%, 5-30%, 0-60%, 60-85%, 85-95%) implement gradual complexity layering, allowing learners to build knowledge incrementally without overwhelming them with advanced concepts too early.
- **[Accessibility First](../../principles/content/accessibility-first.md)**: Standardized structure aids diverse learners with predictable navigation, color-blind friendly palettes in all diagrams, and WCAG-compliant content formatting.
- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Flat directory structure with consistent file naming across all languages, avoiding nested hierarchies that add cognitive overhead.
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Clear coverage percentages define scope boundaries, explicit quality metrics provide objective benchmarks, and documented standards eliminate guesswork.

## Purpose

This convention ensures:

- **Consistency**: Learners encounter familiar structure across all languages
- **Completeness**: Clear definition of what "done" means for a language
- **Quality**: Measurable standards for content depth and pedagogical effectiveness
- **Scalability**: Proven template works across paradigms (procedural, OOP, functional, concurrent)
- **Predictability**: Teams can estimate effort for new language additions

## Scope

This convention applies to:

- **All programming language tutorial content** across the repository:
  - **ayokoding-web** (`apps/ayokoding-web/content/[lang]/learn/swe/programming-languages/[language]/`) - canonical location
  - **Any other location** where programming language tutorials exist
- Includes: tutorials (foundational, by-concept, by-example, cookbook), how-to guides, best practices, anti-patterns
- Enforced by: `apps-ayokoding-web-general-checker`, `apps-ayokoding-web-by-example-checker`, `apps-ayokoding-web-general-maker`, `apps-ayokoding-web-by-example-maker`, `apps-ayokoding-web-facts-checker` agents

**Implementation Notes**: While the Full Set Tutorial Package architecture applies universally, Hugo-specific implementation details (frontmatter, weight values, navigation) are covered in [Hugo conventions](../hugo/README.md)

## Universal Directory Structure

Every programming language MUST follow this structure:

```
[language]/                                    # Level 5 folder (e.g., /en/learn/swe/programming-languages/golang/)
├── _index.md                                  # Folder (weight: 10002, level 5 - represents the folder)
├── overview.md                                # Content (weight: 100000, level 6 - content inside level 5 folder)
├── tutorials/                                 # Folder (weight: 100002, level 6 - represents the folder)
│   ├── _index.md                             # Folder (weight: 100002, level 6 - represents the folder)
│   ├── by-example/                           # COMPONENT 3: Code-first path (Level 7 folder) - PRIORITY
│   │   ├── _index.md                         # Folder (weight: 1000000, level 7 - represents the folder)
│   │   ├── overview.md                       # Content (weight: 10000000, level 8 - content inside level 7 folder)
│   │   ├── beginner.md                       # Content (weight: 10000001, level 8 - Examples 1-25)
│   │   ├── intermediate.md                   # Content (weight: 10000002, level 8 - Examples 26-50)
│   │   └── advanced.md                       # Content (weight: 10000003, level 8 - Examples 51-75)
│   ├── by-concept/                           # COMPONENT 4: Narrative-driven path (Level 7 folder)
│   │   ├── _index.md                         # Folder (weight: 1000001, level 7 - represents the folder)
│   │   ├── overview.md                       # Content (weight: 10000000, level 8 - content inside level 7 folder)
│   │   ├── beginner.md                       # Content (weight: 10000001, level 8 - 0-40% coverage)
│   │   ├── intermediate.md                   # Content (weight: 10000002, level 8 - 40-75% coverage)
│   │   └── advanced.md                       # Content (weight: 10000003, level 8 - 75-95% coverage)
│   ├── cookbook/                             # COMPONENT 5: Practical recipes (Level 7 folder)
│   │   └── _index.md                         # Folder (weight: 1000002, level 7 - represents the folder)
│   ├── initial-setup.md                      # COMPONENT 1: Foundational (0-5%, weight: 1000003, level 7)
│   └── quick-start.md                        # COMPONENT 2: Foundational (5-30%, weight: 1000004, level 7)
├── how-to/                                    # Folder (weight: 100003, level 6 - represents the folder)
│   ├── _index.md                             # Folder (weight: 100003, level 6 - represents the folder)
│   ├── overview.md                           # Content (weight: 1000000, level 7 - content inside level 6 folder)
│   ├── best-practices.md                     # Content (weight: 1000001, level 7 - MOVED UP from position 3)
│   └── [12-18 problem-solving guides]        # Content (weight: 1000002+, level 7)
├── explanation/                               # Folder (weight: 100004, level 6 - represents the folder)
│   ├── _index.md                             # Folder (weight: 100004, level 6 - represents the folder)
│   ├── overview.md                           # Content (weight: 1000000, level 7 - content inside level 6 folder)
│   ├── best-practices.md                     # Content (weight: 1000001, level 7)
│   └── anti-patterns.md                      # Content (weight: 1000002, level 7)
└── reference/                                 # Folder (weight: 100005, level 6 - represents the folder)
    ├── _index.md                             # Folder (weight: 100005, level 6 - represents the folder)
    └── overview.md                           # Content (weight: 1000000, level 7 - content inside level 6 folder)
```

**Weight System Explanation:**

Programming language folders (e.g., `golang/`, `python/`, `java/`) are at **level 5** in the directory hierarchy:

```
/en/ (level 1) → /learn/ (level 2) → /swe/ (level 3) → /programming-languages/ (level 4) → /golang/ (level 5)
```

**Understanding Levels and Weights:**

The level-based weight system uses a two-part rule:

1. **Folder's `_index.md`** represents the folder itself at level N → uses level N weight
2. **Content INSIDE the folder** is one level deeper → uses level N+1 base weight

**Why This Design?**

- `_index.md` IS the folder (navigation hub) → uses the folder's own level
- Regular content files LIVE INSIDE the folder → one level deeper in hierarchy
- Hugo compares siblings only → weights reset independently per parent

**Detailed Weight Calculation:**

- **Level 5 folder** (`golang/`, `python/`, `java/`):
  - These folders exist at level 5 in the directory tree
  - Each folder's `_index.md` represents the folder at level 5 → **weight: 10002** (level 5 range: 10000-99999)
  - Why 10002? Because golang/ might be the 3rd language among siblings (first is 10000, second is 10001, third is 10002)

- **Level 6 content** (files INSIDE the level 5 language folder):
  - Content inside a level 5 folder is one level deeper → uses **level 6 base: 100000** (level 6 range: 100000-999999)
  - `overview.md`: **100000** (first content file, uses level 6 base)
  - `tutorials/_index.md`: **100002** (represents the tutorials folder at level 6, 3rd sibling among category folders)
  - `how-to/_index.md`: **100003** (represents the how-to folder at level 6, 4th sibling)
  - `explanation/_index.md`: **100004** (represents the explanation folder at level 6, 5th sibling)
  - `reference/_index.md`: **100005** (represents the reference folder at level 6, 6th sibling)

- **Level 7 content** (files INSIDE the level 6 category folders):
  - Content inside level 6 folders is one level deeper → uses **level 7 base: 1000000** (level 7 range: 1000000-9999999)
  - **CRITICAL: Weights RESET per parent** - Each category folder's children independently start at 1000000
  - `tutorials/by-example/`: **1000000** (first folder in tutorials/, Component 3 - PRIORITY)
  - `tutorials/by-concept/`: **1000001** (second folder in tutorials/, Component 4)
  - `tutorials/cookbook/`: **1000002** (third folder in tutorials/, Component 5)
  - `tutorials/initial-setup.md`: **1000003** (fourth item, Component 1)
  - `tutorials/quick-start.md`: **1000004** (fifth item, Component 2)
  - `how-to/overview.md`: **1000000** (RESET - different parent, content inside how-to/ folder)
  - `explanation/overview.md`: **1000000** (RESET - different parent, content inside explanation/ folder)
  - `reference/overview.md`: **1000000** (RESET - different parent, content inside reference/ folder)

**Key Insight: "Level" Has Two Meanings**

1. **Directory depth** (counting from /en/): golang/ is 5 steps from root
2. **Weight range** (powers of 10): level 5 uses 10000-99999, level 6 uses 100000-999999

The rule connects them: folder at directory depth N uses weight range N, content inside uses weight range N+1.

For complete details on the level-based weight system, see [Hugo Content Convention - ayokoding](../hugo/ayokoding.md).

**Notes:**

- File names are FIXED (do not rename `beginner.md` to `basics.md`)
- Reference directory is placeholder for future API documentation
- All directories require `_index.md` and `overview.md`
- Weights follow powers of 10 progression: 10, 100, 1000, 10000, 100000, 1000000...

### Cookbook Location Change

**CRITICAL UPDATE (2026-01-30):** Cookbook has **MOVED** from `how-to/cookbook.md` to `tutorials/cookbook/` folder as **Component 5** of the Full Set Tutorial Package.

**Old Location (DEPRECATED):** `how-to/cookbook.md` at position 3 (weight: 1000001)
**New Location:** `tutorials/cookbook/` folder (weight: 1000002)

**Rationale for Move:**

1. **Part of Complete Educational Package**: Cookbook complements both learning tracks (by-concept and by-example)
2. **Used Alongside Tutorials**: Learners reference cookbook while studying tutorials, not as separate how-to guide
3. **Practical Learning Component**: Bridges theory (tutorials) with real-world problem-solving
4. **Consistent Organization**: All tutorial-related content in one location

**Migration Impact**: Languages currently with `how-to/cookbook.md` need migration to `tutorials/cookbook/` folder.

**New Cookbook Structure:**

```
# PASS: GOOD: Cookbook in tutorials/ folder as Component 5
tutorials/
├── _index.md           (100002) ← Level 6 (represents tutorials folder)
├── by-example/         (1000000) ← Level 7 (Component 3 - PRIORITY)
├── by-concept/         (1000001) ← Level 7 (Component 4)
├── cookbook/           (1000002) ← Level 7 (Component 5, NEW LOCATION)
│   ├── _index.md       (1000002) ← Represents cookbook folder
│   └── (recipes)       (10000000+) ← Level 8 content
├── initial-setup.md    (1000003) ← Level 7 (Component 1)
└── quick-start.md      (1000004) ← Level 7 (Component 2)
```

**Weight Calculation:**

Path: `/en/` (1) → `/learn/` (2) → `/swe/` (3) → `/programming-languages/` (4) → `/[language]/` (5) → `/tutorials/` (6) → `/cookbook/` (7)

- `cookbook/` is a **level 7 folder** (child of tutorials/)
- `cookbook/_index.md` represents the folder at level 7 → **weight: 1000002** (3rd child in tutorials/)
- Recipe files inside cookbook/ → **weight: 10000000+** (level 8 content)

**Understanding Weight Resets Across Sibling Folders:**

```
# PASS: GOOD: Category folders at level 6, content inside at level 7 with resets
tutorials/
├── _index.md           (100002) ← Level 6 (represents tutorials folder, 3rd sibling)
├── overview.md         (1000000) ← Level 7 base (content inside tutorials/)

how-to/
├── _index.md           (100003) ← Level 6 (represents how-to folder, 4th sibling)
├── overview.md         (1000000) ← Level 7 base RESET (different parent, content inside how-to/)

explanation/
├── _index.md           (100004) ← Level 6 (represents explanation folder, 5th sibling)
├── overview.md         (1000000) ← Level 7 base RESET (different parent, content inside explanation/)

reference/
├── _index.md           (100005) ← Level 6 (represents reference folder, 6th sibling)
├── overview.md         (1000000) ← Level 7 base RESET (different parent, content inside reference/)
```

**RESET Explanation:** Different parent folders independently use the same base weight (1000000) for their children. Hugo only compares siblings (files with the same parent), so `tutorials/overview.md` (1000000) and `how-to/overview.md` (1000000) never conflict - they have different parents and appear in different navigation contexts.

**Weight System Summary:**

- **Level 5** (language folder): Language folder's `_index.md` at 10002
- **Level 6** (content inside language folder): `overview.md` at 100000, category folders' `_index.md` at 100002, 100003, 100004...
- **Level 7** (content inside category folders): 1000000, 1000001, 1000002... (resets per category parent)
- Follows ayokoding-web's level-based system: folder at level N has `_index.md` at level N, content inside at level N+1

## Coverage Philosophy

### The 0-95% Proficiency Scale

Each tutorial level targets a specific knowledge coverage range:

| Component                | Coverage  | Purpose                                          | Length            |
| ------------------------ | --------- | ------------------------------------------------ | ----------------- |
| **FULL SET PACKAGE**     | **0-95%** | **Complete language education**                  | **13K-18K lines** |
| ↳ Foundational (2 files) | 0-30%     | Prerequisites for all learning                   | 900-1,400 lines   |
| ↳ By-Example (3 files)   | 95%       | **PRIORITY:** Code-first, move fast (75-85 ex's) | 3,500-4,500 lines |
| ↳ By-Concept (3 files)   | 95%       | Narrative-driven, learn deep                     | 3,200-5,500 lines |
| ↳ Cookbook (1+ files)    | Practical | Problem-solving recipes                          | 4,000-5,500 lines |

**Critical Understanding:**

- Coverage percentages measure **knowledge depth**, NOT time investment
- Different learners progress at different speeds (respects No Time Estimates principle)
- Percentages provide **scope boundaries** for content creators
- "95%" is the ceiling - no tutorial claims 100% coverage (humility principle)

### Coverage Level Details

#### Initial Setup (0-5%)

**Goal:** Get the language working on the learner's system.

**Mandatory topics:**

- Installation instructions (platform-specific)
- Version verification
- First "Hello, World!" program
- Basic tool setup (compiler/interpreter, package manager)

**Success criteria:** Learner can run a simple program.

#### Quick Start (5-30%)

**Goal:** Learn enough to explore the language independently.

**Structure:** Touchpoints approach - one concept, one example

- 8-12 core concepts in order of importance
- Mermaid learning path diagram
- Runnable code for each touchpoint
- Links to Beginner tutorial for depth

**Topics pattern:**

1. Variables and types
2. Control flow
3. Functions
4. Data structures (language-specific)
5. Error handling
6. Language-specific feature (e.g., Go: goroutines, Python: comprehensions)
7. Modules/packages
8. Testing basics

**Success criteria:** Learner can read code and write simple programs.

#### Beginner (0-60%)

**Goal:** Build a solid foundation for real applications.

**Structure:** Comprehensive coverage with progressive exercises

- 10-15 major sections
- 4 difficulty levels for exercises
- Working code examples for every concept
- Cross-references to How-To guides

**Mandatory topics:**

- Complete type system coverage
- Functions and methods
- Data structures (arrays, lists, maps, sets)
- Object-oriented or functional paradigm basics
- Error handling patterns
- File I/O
- Testing fundamentals
- Package/module system
- Common standard library patterns

**Success criteria:** Learner can build complete programs independently.

#### Intermediate (60-85%)

**Goal:** Build production-grade systems.

**Structure:** Professional techniques and patterns

- 8-12 major sections
- Real-world scenarios
- Architecture patterns
- Performance considerations

**Mandatory topics:**

- Advanced language features (generics, metaprogramming, etc.)
- Concurrency/parallelism patterns
- Design patterns
- Testing strategies (integration, mocking, benchmarks)
- Performance profiling and optimization
- Database integration
- API development (REST/GraphQL)
- Configuration management
- Security best practices
- Deployment patterns

**Success criteria:** Learner can build production-ready applications.

#### Advanced (85-95%)

**Goal:** Achieve expert-level mastery.

**Structure:** Deep internals and optimization

- 6-10 major sections
- Runtime internals
- Advanced optimization
- System design patterns

**Mandatory topics:**

- Language runtime internals (VM, compiler, interpreter)
- Memory management and garbage collection
- Advanced concurrency (lock-free, async internals)
- Reflection and metaprogramming
- Performance optimization techniques
- Advanced type system features
- Debugging strategies
- Tooling and ecosystem

**Success criteria:** Learner understands language internals and can optimize critical code.

#### Cookbook (Parallel Track)

**Goal:** Provide copy-paste-ready solutions for common problems.

**Structure:** 30-40 recipes organized by category

- Each recipe: Problem → Solution → How It Works → Use Cases
- Runnable code with minimal dependencies
- Cross-references to relevant tutorials

**Mandatory categories:**

- Data structures and algorithms
- Concurrency patterns
- Error handling recipes
- Design patterns implementations
- Web development patterns
- Database patterns
- Testing patterns
- Performance optimization

**Success criteria:** Learner can solve common problems quickly.

#### By Example (Parallel Track)

**Goal:** Quick language pickup for experienced developers through annotated code examples.

**Structure:** 60+ examples organized into 3 level-based files

- **beginner.md**: Examples 1-15 (Basics) - fundamental syntax, variables, control flow, functions
- **intermediate.md**: Examples 16-35 (Intermediate) - data structures, OOP/functional patterns, error handling, modules
- **advanced.md**: Examples 36-60 (Advanced) - concurrency, metaprogramming, internals, optimization

**Format per example:**

1. **Concept Name and Brief Explanation** (2-3 sentences)
2. **Mermaid Diagram** (when helpful for concept relationships)
3. **Heavily Commented Code:**
   - What each line does
   - Expected output (as comments)
   - Intermediate values for variables/processes
4. **Key Takeaway** (1-2 sentences summarizing the concept)

**Mandatory coverage areas:**

- Core syntax (variables, types, operators)
- Control flow (conditionals, loops, pattern matching)
- Functions and methods
- Data structures (arrays, lists, maps, sets, structs/classes)
- Error handling patterns
- Modules and packages
- Testing basics
- Concurrency primitives
- Common standard library patterns
- Language-specific features (e.g., Go channels, Python comprehensions, Rust ownership)

**Success criteria:** Experienced developer can read language code fluently and write basic programs after studying all 60+ examples.

**Target audience:** Experienced developers (seasonal programmers or software engineers) who:

- Already know at least one programming language well
- Want to quickly pick up a new language without extensive narrative
- Prefer learning through working code examples
- Need 90% language coverage efficiently

**Relationship to other tutorials:**

- **NOT a replacement** for Beginner tutorial (which provides deep explanations for complete beginners)
- **NOT a replacement** for Quick Start (which is 5-30% coverage touchpoints)
- **NOT a replacement** for Cookbook (which is problem-solving oriented, not learning-oriented)
- **Complements** the Full Set by providing an alternative learning path for experienced developers

## Pedagogical Requirements

### Mandatory Patterns for All Tutorials

Every tutorial MUST include:

1. **Front Hook** (first paragraph)
   - Format: "**Want to [achieve outcome]?** This [tutorial type] [value proposition]."
   - Example: "**Want to get productive with Python fast?** This Quick Start teaches you the essential syntax and core patterns you need to read Python code and try simple examples independently."

2. **Learning Path Visualization**
   - Mermaid diagram showing concept progression
   - Use color-blind friendly palette: Blue (#0173B2), Orange (#DE8F05), Teal (#029E73)
   - Example structure: Concept A → Concept B → Concept C → Ready!

3. **Prerequisites Section**
   - Clear entry requirements
   - Links to prerequisite tutorials
   - Tool/version requirements

4. **Coverage Declaration**
   - State coverage explicitly: "This covers X-Y% of [language] knowledge"
   - Explain what coverage means (scope, not time)

5. **Progressive Disclosure**
   - Start simple, increase complexity gradually
   - One concept per section
   - Build on previous concepts

6. **Runnable Code Examples**
   - Every concept has working code
   - Code includes comments explaining key points
   - Examples are complete (not fragments)

7. **Hands-On Exercises**
   - Multiple difficulty levels (Level 1-4 or similar)
   - Clear objectives for each exercise
   - Progressive challenge

8. **Cross-References**
   - Link to related How-To guides
   - Reference Cookbook for practical patterns
   - Point to next tutorial level

9. **No Time Estimates**
   - Never suggest duration ("this takes 30 minutes")
   - Everyone learns at different speeds
   - Focus on outcomes, not time

### Mandatory Patterns for How-To Guides

Every how-to guide MUST include:

1. **Problem Statement**
   - Clear description of the problem being solved
   - When you'd encounter this problem

2. **Solution**
   - Step-by-step instructions
   - Complete, runnable code

3. **How It Works**
   - Explanation of the solution
   - Key concepts involved

4. **Variations**
   - Alternative approaches
   - Trade-offs between approaches

5. **Common Pitfalls**
   - What can go wrong
   - How to avoid mistakes

6. **Related Patterns**
   - Links to similar how-to guides
   - References to relevant tutorial sections

### Mandatory Patterns for Explanation Documents

Best practices and anti-patterns MUST include:

1. **Organized by Category**
   - Group related practices together
   - Clear section headings

2. **Pattern Format**
   - **Principle/Pattern name**
   - **Why it matters** (rationale)
   - **Good example** (code showing correct approach)
   - **Bad example** (code showing what to avoid)
   - **Exceptions** (when rule doesn't apply)

3. **Philosophy Section**
   - "What Makes [Language] Special"
   - Core language philosophy
   - Design principles

## Content Completeness Criteria

A programming language has a **Full Set Tutorial Package** (complete) when all 5 mandatory components exist:

**Component 1-2: Foundational Tutorials** ✅ Mandatory

- PASS: initial-setup.md (0-5% coverage, 300-500 lines)
- PASS: quick-start.md (5-30% coverage, 600-900 lines)

**Component 3: By-Example Track** ✅ Mandatory - **PRIORITY for fast learning**

- PASS: by-example/ folder with 3 files containing 75-85 annotated examples:
  - beginner.md (0-40% coverage, 1,000-1,400 lines, examples 1-25)
  - intermediate.md (40-75% coverage, 1,400-1,800 lines, examples 26-50)
  - advanced.md (75-95% coverage, 1,100-1,700 lines, examples 51-75)
- PASS: by-example/overview.md explaining code-first approach
- PASS: by-example/\_index.md for navigation

**Component 4: By-Concept Track** ✅ Mandatory

- PASS: by-concept/ folder with 3 files:
  - beginner.md (0-40% coverage, 1,200-2,300 lines)
  - intermediate.md (40-75% coverage, 1,000-1,700 lines)
  - advanced.md (75-95% coverage, 1,000-1,500 lines)
- PASS: by-concept/overview.md explaining narrative-driven approach
- PASS: by-concept/\_index.md for navigation

**Component 5: Cookbook** ✅ Mandatory (NEW LOCATION)

- PASS: cookbook/ folder with 30+ recipes (4,000-5,500 lines total)
- PASS: cookbook/\_index.md for navigation
- PASS: Organized by category (can be single file or multiple files)
- PASS: Positioned at weight 1000002 (after by-example, before initial-setup)

**Supporting Documentation** (Mandatory):

- PASS: 12+ how-to guides covering language-specific patterns
- PASS: Best practices document (500+ lines)
- PASS: Anti-patterns document (500+ lines)
- PASS: All \_index.md files for navigation

**Status**: Language is NOT complete if any of the 5 components are missing. A language can be production-ready with subset of components but needs all 5 for Full Set completeness.

This provides value while allowing iterative expansion.

## Quality Metrics

### Quantitative Benchmarks

Based on Golang, Python, and Java implementations:

| Metric                    | Minimum     | Target      | Exceptional |
| ------------------------- | ----------- | ----------- | ----------- |
| **Tutorials**             |
| Initial Setup             | 300 lines   | 400 lines   | 500 lines   |
| Quick Start               | 600 lines   | 750 lines   | 900 lines   |
| Beginner                  | 1,200 lines | 1,700 lines | 2,300 lines |
| Intermediate              | 1,000 lines | 1,350 lines | 1,700 lines |
| Advanced                  | 1,000 lines | 1,250 lines | 1,500 lines |
| **By Example**            |
| Beginner examples         | 1,000 lines | 1,200 lines | 1,400 lines |
| Intermediate examples     | 1,400 lines | 1,600 lines | 1,800 lines |
| Advanced examples         | 1,100 lines | 1,400 lines | 1,700 lines |
| Total examples            | 60          | 65          | 70+         |
| Mermaid diagrams          | 3           | 5           | 8+          |
| **How-To Guides**         |
| Total count               | 12          | 15          | 18+         |
| Per guide                 | 200 lines   | 350 lines   | 500 lines   |
| Cookbook                  | 4,000 lines | 4,700 lines | 5,500 lines |
| **Explanation**           |
| Best practices            | 500 lines   | 650 lines   | 750 lines   |
| Anti-patterns             | 500 lines   | 650 lines   | 750 lines   |
| **Quality**               |
| Mermaid diagrams/tutorial | 3 minimum   | 5+          | 8+          |
| Cross-references/tutorial | 10          | 15          | 20+         |
| Code examples/tutorial    | 15          | 25          | 35+         |

### Qualitative Requirements

All content MUST meet:

- PASS: **Color-blind friendly**: Only use approved palette (#0173B2, #DE8F05, #029E73, #CC78BC, #CA9161)
- PASS: **Factually accurate**: All commands, syntax, versions verified
- PASS: **Runnable code**: Examples work as-is (copy-paste ready)
- PASS: **Progressive disclosure**: Simple → complex ordering
- PASS: **Active voice**: Direct, engaging writing
- PASS: **Single H1**: Only one top-level heading per file
- PASS: **Proper heading nesting**: No skipped levels (H2 → H4)
- PASS: **No time estimates**: Focus on outcomes, not duration
- PASS: **Cross-platform**: Consider Windows, macOS, Linux where relevant

## Language-Agnostic vs. Language-Specific

### Universal Elements (Same Across All Languages)

These MUST be identical:

- Directory structure and file names
- Coverage percentages (0-5%, 5-30%, 0-60%, 60-85%, 85-95%)
- Diátaxis categorization (tutorials, how-to, explanation, reference)
- Pedagogical patterns (front hook, learning path, prerequisites)
- Quality requirements (color palette, no time estimates, runnable code)
- Weight numbering (level-based system: level 5 folder uses 10002, level 6 content uses 100000+, level 7 content uses 1000000+ with resets per parent)
- Frontmatter structure (title, date, draft, description, weight)

### Customizable Elements (Adapt Per Language)

These vary by language:

- **Number of how-to guides**: 12-18 based on language complexity
- **Specific topics**:
  - Go: goroutines, channels, interfaces
  - Python: GIL, decorators, comprehensions
  - Java: JVM, threads, generics
  - Rust: ownership, lifetimes, borrowing
  - TypeScript: type system, generics, decorators
- **Philosophy sections**: Language design principles
- **Ecosystem tools**:
  - Go: modules, go fmt
  - Python: pip, venv, poetry
  - Java: Maven, Gradle, JUnit
- **Paradigm emphasis**:
  - Go: concurrent programming
  - Python: multi-paradigm flexibility
  - Java: object-oriented design
  - Rust: memory safety
  - Clojure: functional programming

## Content Density Patterns

From benchmark analysis:

- **Quick Start = 40-50% of Beginner length**: Enables rapid exploration without overwhelming
- **Intermediate = 60-80% of Beginner length**: Assumes foundation, focuses on production patterns
- **Cookbook = 2-3x Beginner length**: Comprehensive reference with many recipes
- **How-to guides average 300-400 lines**: Focused, actionable solutions
- **Best practices ≈ Anti-patterns length**: Balanced positive/negative examples

**Rationale:** These ratios have proven effective across three languages with different complexities.

## Validation Process

### During Creation

Content creators MUST:

1. **Use apps-ayokoding-web-general-maker or apps-ayokoding-web-by-example-maker agent** for initial content creation
2. **Follow this standard exactly** (don't improvise structure)
3. **Test all code examples** (ensure they run)
4. **Verify factual accuracy** (check documentation, official sources)
5. **Use color-blind friendly palette** (never red/green/yellow)

### Before Publishing

Content MUST pass:

1. **apps-ayokoding-web-general-checker** or **apps-ayokoding-web-by-example-checker** validation (Hugo conventions, quality principles)
2. **apps-ayokoding-web-facts-checker** verification (factual correctness)
3. **apps-ayokoding-web-link-checker** validation (all links work)
4. **Manual review** (pedagogical effectiveness, clarity)

### Post-Publishing

Monitor and maintain:

1. **Quarterly fact checks** (verify versions, syntax still current)
2. **User feedback** (address confusion, gaps)
3. **Update for language evolution** (new versions, deprecated features)

## Replication Formula

To add a new programming language:

1. **Clone structure** from reference language (Golang, Python, or Java)
2. **Adapt coverage levels** to language paradigm
3. **Map touchpoints** to language-specific concepts
4. **Write 5 tutorials** following pedagogical patterns
5. **Identify 12-18 common problems** for how-to guides
6. **Create cookbook** with 30+ recipes
7. **Document philosophy** in best-practices and anti-patterns
8. **Add Mermaid diagrams** with approved color palette
9. **Validate against metrics** (line counts, cross-references, code examples)
10. **Run validation agents** (content-checker, facts-checker, link-checker)

See [How to Add a Programming Language](../../../docs/how-to/add-programming-language.md) for detailed step-by-step instructions.

## Examples from Benchmark Languages

### Golang (Reference Implementation)

**Location:** `apps/ayokoding-web/content/en/learn/swe/programming-languages/golang/`

**Characteristics:**

- Emphasizes concurrency (goroutines, channels)
- Simple, explicit syntax
- Strong opinions (go fmt)
- 16 how-to guides
- 5,169-line cookbook (40+ recipes)

**Use as reference for:** Concurrent programming languages, compiled languages with simple syntax

### Python (Reference Implementation)

**Location:** `apps/ayokoding-web/content/en/learn/swe/programming-languages/python/`

**Characteristics:**

- Emphasizes readability and multi-paradigm flexibility
- Dynamic typing with type hints
- Batteries-included philosophy
- 18 how-to guides
- 4,351-line cookbook (35+ recipes)

**Use as reference for:** Dynamic languages, scripting languages, multi-paradigm languages

### Java (Reference Implementation)

**Location:** `apps/ayokoding-web/content/en/learn/swe/programming-languages/java/`

**Characteristics:**

- Emphasizes object-oriented design
- Strong typing, verbose syntax
- Enterprise patterns and tooling
- 14 how-to guides
- 5,369-line cookbook (30+ recipes)

**Use as reference for:** OOP languages, strongly-typed languages, enterprise-focused languages

## Highest Standards Reference

Following comprehensive analysis of all 6 programming languages (Python, Golang, Java, Kotlin, Rust, Elixir) in December 2025, **Elixir** has been identified as the highest standard reference implementation for most content types.

**Key Finding:** Elixir, being the most recently added language (December 2024), most closely follows this Programming Language Content Standard and serves as the reference implementation for:

- **All 5 Tutorials** (initial-setup, quick-start, beginner, intermediate, advanced)
- **Cookbook** (5625 lines, weight 1000001, 52 cross-references)
- **Best Practices** (1075 lines, 98 code examples)
- **Anti-Patterns** (1054 lines, 76 code examples)

**Alternative Excellence:**

- **Cheat Sheet:** Golang (1404 lines) - most comprehensive syntax reference
- **Glossary:** Java (1873 lines, 128 code examples) - most comprehensive terminology
- **Resources:** Java (879 lines) - most comprehensive external links
- **Diagram Usage:** Golang beginner tutorial (6 diagrams) - visual learning reference

**Complete Reference Table:** Detailed metrics (line counts, code blocks, diagrams, links) for all 11 content types are available in the prog-lang-parity plan documentation.

**Usage Guidance:**

- **When creating new language content:** Use Elixir tutorials as templates for structure, depth, and code example patterns
- **When improving existing content:** Compare to Elixir benchmarks (should be within 20% of line counts for same content type)
- **For diagram patterns:** Reference Golang beginner tutorial (6 diagrams showing concept progression)
- **For cross-references:** Reference Elixir cookbook (52 links) as target for learning path integration

**Quality Gaps Identified (Even in Highest Standards):**

Even Elixir, the highest standard, has gaps:

1. **Front Hooks:** Missing in all 30 tutorials across all 6 languages (0% compliance)
2. **Cross-References in Tutorials:** Elixir tutorials have 0-5 links (target: 10+ per tutorial)
3. **Color Violations:** Elixir has 8 color violations that need fixing

**Implication:** Achieving complete parity requires going beyond current highest standards in pedagogical patterns (front hooks, cross-references) and color compliance.

**Analysis Report:** Complete parity analysis with detailed gap identification available in `plans/in-progress/2025-12-21__prog-lang-parity/analysis-report.md`

## Related Conventions

- [Hugo Content Convention - Shared](../hugo/shared.md) - Base Hugo content rules
- [Hugo Content Convention - ayokoding](../hugo/ayokoding.md) - Hextra theme specifics
- [Tutorial Naming Convention](./naming.md) - Tutorial level definitions
- [Content Quality Principles](../writing/quality.md) - Quality standards
- [Diátaxis Framework](../structure/diataxis-framework.md) - Documentation categorization
- [Color Accessibility Convention](../formatting/color-accessibility.md) - Approved color palette
- [Diagrams Convention](../formatting/diagrams.md) - Mermaid diagram standards
- [Factual Validation Convention](../writing/factual-validation.md) - Fact-checking methodology

## Related How-To Guides

- [How to Add a Programming Language](../../../docs/how-to/add-programming-language.md) - Step-by-step implementation guide

## Version History

- **v1.0** (2025-12-18): Initial standard based on Golang, Python, Java benchmark analysis
