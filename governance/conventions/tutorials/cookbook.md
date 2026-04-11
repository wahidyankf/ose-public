---
title: Cookbook Tutorial Convention
description: Standards for creating problem-focused cookbook tutorials with practical, copy-paste ready recipes organized by problem type
category: explanation
subcategory: conventions
tags:
  - convention
  - tutorial
  - cookbook
  - education
  - problem-solving
  - recipes
created: 2026-01-30
updated: 2026-01-30
---

# Cookbook Tutorial Convention

## Purpose

This convention **extends the [Tutorials Convention](./general.md) for the Cookbook tutorial type**, defining specialized standards for problem-focused learning through practical, copy-paste ready recipes organized by problem type rather than difficulty level.

**Base requirements**: Cookbook tutorials inherit general tutorial standards (learning-oriented approach, visual completeness, hands-on elements from [Tutorials Convention](./general.md)) and add recipe-specific specializations defined below.

**Target audience**: Developers at any level (beginner to advanced) seeking practical solutions to specific real-world problems. Unlike sequential learning paths, cookbook recipes can be consumed in any order based on current needs.

## Structure Integration with General Tutorial Standards

Cookbook tutorials adapt the general [Tutorial Convention](./general.md) structure for problem-solving:

### Adaptation of General Structure

**Traditional Tutorial Structure** (from [Tutorials Convention](./general.md)):

- Introduction → Prerequisites → Objectives → Content Sections → Challenges → Summary → Next Steps

**Cookbook Structure Adaptation**:

1. **Cookbook overview** (serves as introduction):
   - Purpose and scope of cookbook
   - How to use cookbook effectively
   - Organization by problem category
   - Cross-references to by-concept and by-example tracks

2. **Recipe organization** (replaces sequential sections):
   - Organized by problem category (not difficulty level)
   - Each recipe solves one specific problem
   - Recipes are self-contained and independent
   - 30+ recipes across multiple categories

3. **Recipe structure** (replaces traditional content sections):
   - Problem statement (what needs to be solved)
   - Solution code (copy-paste ready with annotations)
   - Explanation (how it works, why this approach)
   - Common pitfalls (what to avoid)
   - Related recipes (cross-references)

4. **No sequential progression**:
   - Recipes can be read in any order
   - Same recipe may be useful at different skill levels
   - Problem-focused, not learning-path focused

### Inherited Requirements from General Tutorial Convention

Cookbook tutorials MUST follow these general tutorial standards:

- PASS: **Learning-oriented approach** (Diátaxis framework): Teach through solving real problems
- PASS: **Visual completeness**: Diagrams when helpful for understanding solutions
- PASS: **Hands-on elements**: Every recipe has runnable, copy-paste ready code
- PASS: **No time estimates**: Focus on problem solved, not time to implement
- PASS: **Accessibility**: Color-blind friendly diagrams, clear structure
- PASS: **Real-world relevance**: Every recipe solves an actual production problem

### Specialized Requirements for Cookbook

Beyond general tutorial standards, cookbook adds:

- PASS: **Problem-focused organization**: By problem type, not difficulty level
- PASS: **Copy-paste readiness**: Code works as-is with minimal modification
- PASS: **Recipe independence**: Each recipe self-contained, no required reading order
- PASS: **Cross-level applicability**: Same recipe useful for beginner and advanced developers
- PASS: **Practical emphasis**: Minimal theory, maximum working code
- PASS: **Recipe count**: 30+ recipes covering common problem domains

## Core Characteristics

### 1. Problem-Focused Approach

**Philosophy**: Organize by "what problem does this solve" not "what topic does this teach".

Recipes prioritize:

- Specific problem statements over broad topics
- Working solutions over educational explanations
- Practical utility over theoretical completeness
- Copy-paste readiness over step-by-step guidance

### 2. Coverage Target: Practical Problem Domains

**What "30+ recipes" means**: Breadth across common problem categories developers encounter in production.

**Problem categories to cover**:

- **Setup and Configuration** - Environment setup, tool configuration, dependency management
- **Data Manipulation** - Parsing, transforming, validating, serializing data
- **File Operations** - Reading, writing, processing files (CSV, JSON, XML, etc.)
- **Network and HTTP** - API calls, request handling, error handling, authentication
- **Concurrency and Parallelism** - Async operations, threading, race conditions
- **Testing and Debugging** - Test setup, mocking, debugging techniques
- **Performance Optimization** - Profiling, caching, optimization patterns
- **Error Handling** - Exception patterns, error recovery, logging
- **Security** - Input validation, authentication, authorization patterns
- **Database Operations** - CRUD operations, transactions, query optimization

**Not included** (covered elsewhere):

- Comprehensive language features (that's by-concept)
- Sequential learning examples (that's by-example)
- Project-specific implementations (that's how-to guides)

### 3. Recipe Independence

**What independence means**: Each recipe can be understood and used without reading other recipes.

**Self-containment rules**:

- Recipe includes all necessary imports/dependencies
- Problem context is stated clearly upfront
- No assumptions about prior recipe reading
- Cross-references are optional, not required

**Different from by-example**:

- By-example: Sequential examples building on each other (1→85)
- Cookbook: Independent recipes in any order

### 4. Cross-Level Applicability

**What cross-level means**: Same recipe useful regardless of developer skill level.

A beginner might use a recipe to solve an immediate problem.
An intermediate developer might study the recipe to understand the pattern.
An advanced developer might reference the recipe for syntax or edge cases.

**Different from by-concept**:

- By-concept: Separate beginner/intermediate/advanced files
- Cookbook: Single recipe serves all levels (problem is the organizing principle)

## Recipe Structure Standards

Each cookbook recipe MUST follow this structure:

### 1. Recipe Title

**Format**: `## Recipe: [Problem Statement]`

**Examples**:

- `## Recipe: Read CSV File with Headers`
- `## Recipe: Retry Failed API Calls with Exponential Backoff`
- `## Recipe: Parse JSON with Unknown Schema`

**Requirements**:

- Clear problem statement (what this solves)
- Action-oriented (verb + object)
- Specific enough to be searchable
- No difficulty indicators (not "Beginner: Read CSV")

### 2. Problem Statement

**Format**: 1-3 sentences describing the specific problem.

**Example**:

```markdown
### Problem

You need to read a CSV file with headers into a list of objects, handling missing values and type conversions automatically. The CSV may have inconsistent formatting (extra spaces, quoted fields).
```

**Requirements**:

- State the problem clearly and specifically
- Include constraints or edge cases
- Mention common pain points
- Keep focused (one problem per recipe)

### 3. Solution

**Format**: Annotated code with `// =>` or `# =>` notation showing the complete solution.

**Example**:

```go
package main

import (
    "encoding/csv"     // => Standard library CSV parser
    "os"               // => For file operations
    "strings"          // => For trimming whitespace
)

func readCSV(filepath string) ([]map[string]string, error) {
    file, err := os.Open(filepath)  // => Open file for reading
    if err != nil {
        return nil, err             // => Return error if file doesn't exist
    }
    defer file.Close()              // => Ensure file is closed when done

    reader := csv.NewReader(file)   // => Create CSV reader
    reader.TrimLeadingSpace = true  // => Remove extra spaces automatically

    headers, err := reader.Read()   // => Read first row as headers
    if err != nil {
        return nil, err
    }

    var records []map[string]string // => Store results as key-value maps
    for {
        row, err := reader.Read()   // => Read each subsequent row
        if err == io.EOF {          // => End of file reached
            break
        }
        if err != nil {
            return nil, err         // => Handle malformed CSV
        }

        record := make(map[string]string)
        for i, value := range row {
            if i < len(headers) {   // => Prevent index out of bounds
                record[headers[i]] = value
            }
        }
        records = append(records, record)
    }

    return records, nil
}
```

**Requirements**:

- Complete, runnable code (not pseudocode)
- Copy-paste ready with all imports
- Annotations using `// =>` or `# =>` notation
- Annotation density: 0.5-1.5 lines per code line (lighter than by-example's 1-2.25)
- Focus annotations on "what this does" not "why we need this"

### 4. How It Works

**Format**: 2-4 paragraphs explaining the solution approach.

**Example**:

```markdown
### How It Works

This solution uses Go's standard library `encoding/csv` package which handles most edge cases automatically. The key insight is treating the first row as headers and mapping subsequent rows to key-value pairs.

The `TrimLeadingSpace` option handles inconsistent formatting without manual preprocessing. By reading one row at a time, this approach works efficiently even with large CSV files.

The error handling covers three cases: file not found, malformed headers, and malformed data rows. Each error is returned immediately rather than collecting errors, following Go's fail-fast philosophy.
```

**Requirements**:

- Explain the approach, not the syntax
- Highlight key insights or patterns
- Mention why this approach works well
- Keep concise (don't duplicate code comments)

### 5. Common Pitfalls

**Format**: Bulleted list of mistakes to avoid.

**Example**:

```markdown
### Common Pitfalls

- **Not checking header length**: If a row has more columns than headers, indexing fails. Always validate `i < len(headers)`.
- **Forgetting to close file**: Without `defer file.Close()`, files stay open until program exits.
- **Assuming consistent encoding**: CSV files may use different encodings (UTF-8, Latin-1). Use `golang.org/x/text/encoding` for non-UTF-8 files.
- **Not handling quoted fields**: Fields containing commas must be quoted. The standard `csv.Reader` handles this, but custom parsers often don't.
```

**Requirements**:

- 3-5 common mistakes
- Each with brief explanation
- Actionable (what to do instead)
- Based on real production errors

### 6. Related Recipes

**Format**: Bulleted list linking to related recipes.

**Example**:

```markdown
### Related Recipes

- **Write CSV with Custom Headers** - Reverse operation, writing data to CSV
- **Parse JSON with Schema Validation** - Similar problem for JSON instead of CSV
- **Handle Large Files with Streaming** - Memory-efficient approach for huge CSV files
```

**Requirements**:

- 2-4 related recipes
- Brief description of relationship
- Links when recipes exist
- Helps readers discover related solutions

### 7. Learn More (Optional)

**Format**: Links to related learning content in by-concept or by-example.

**Example**:

```markdown
### Learn More

- **By-Concept: File I/O** - Comprehensive coverage of file operations and error handling patterns
- **By-Example: Example 23** - More CSV parsing examples with different formats
```

**Requirements**:

- Optional (include when helpful)
- Links to comprehensive learning paths
- Helps readers deepen understanding beyond immediate problem

## Recipe Organization and Naming

### Directory Structure

```
cookbook/
├── _index.md                          # Cookbook overview and navigation
├── setup/                             # Setup and configuration recipes
│   ├── recipe-01-install-dependencies.md
│   ├── recipe-02-configure-environment.md
│   └── ...
├── data/                              # Data manipulation recipes
│   ├── recipe-01-parse-csv.md
│   ├── recipe-02-parse-json.md
│   └── ...
├── network/                           # Network and HTTP recipes
├── concurrency/                       # Concurrency recipes
├── testing/                           # Testing recipes
├── performance/                       # Performance recipes
├── errors/                            # Error handling recipes
├── security/                          # Security recipes
└── database/                          # Database recipes
```

### Recipe Naming Convention

**Pattern**: `recipe-[NN]-[problem-identifier].md`

**Examples**:

- `recipe-01-read-csv-with-headers.md`
- `recipe-02-retry-failed-api-calls.md`
- `recipe-03-parse-json-unknown-schema.md`

**Requirements**:

- Sequential numbering within category (01, 02, 03...)
- Kebab-case problem identifier
- Descriptive enough to search
- No difficulty indicators in name

### Category Organization

**Each category should have**:

- 3-5 recipes minimum
- Clear category scope
- `_index.md` with category overview
- Logical grouping by problem domain

**Category selection criteria**:

- Common enough to warrant 3+ recipes
- Distinct from other categories
- Aligned with production problem domains
- Searchable/discoverable

## Quality Standards

### Recipe Completeness Checklist

Each recipe MUST have:

- ✅ Clear problem statement (1-3 sentences)
- ✅ Complete solution code (copy-paste ready)
- ✅ Code annotations (0.5-1.5 per line)
- ✅ How It Works explanation (2-4 paragraphs)
- ✅ Common Pitfalls list (3-5 items)
- ✅ Related Recipes links (2-4 items)
- ✅ Self-contained (all imports, no external dependencies on other recipes)

### Code Quality Standards

- **Runnable**: Code must work as-is (not pseudocode)
- **Production-ready**: Use real error handling, not TODO comments
- **Idiomatic**: Follow language conventions and best practices
- **Minimal**: Solve the problem without extra complexity
- **Annotated**: Use `// =>` or `# =>` for state/output annotations

### Annotation Density

**Target**: 0.5-1.5 comment lines per code line

**Rationale**: Cookbook code is copy-paste oriented, so annotations focus on "what this does" rather than educational "why we need this". Lighter annotation than by-example (1-2.25) but still helpful.

**Examples**:

```go
// GOOD: Concise annotation focused on action
file, err := os.Open(filepath)  // => Open file for reading
```

```go
// TOO MUCH: Over-explaining (by-example style, not cookbook style)
file, err := os.Open(filepath)  // => Open file for reading
                                // => os.Open returns (*File, error)
                                // => File is a handle to the opened file
                                // => We'll use this to create a CSV reader
```

```go
// TOO LITTLE: No annotation (reader must infer)
file, err := os.Open(filepath)
```

## Cookbook vs Other Tutorial Types

### Cookbook vs By-Example

| Aspect             | Cookbook                     | By-Example                           |
| ------------------ | ---------------------------- | ------------------------------------ |
| **Organization**   | By problem type              | Sequential (1-85)                    |
| **Reading order**  | Any order                    | Sequential recommended               |
| **Goal**           | Solve specific problem       | Learn language comprehensively       |
| **Coverage**       | Problem domains              | 95% language features                |
| **Code style**     | Copy-paste ready             | Educational with heavy annotations   |
| **Annotations**    | 0.5-1.5 per line (what)      | 1-2.25 per line (what + why)         |
| **Audience**       | Anyone with specific problem | Experienced devs switching languages |
| **Use case**       | "I need to parse CSV now"    | "I want to learn this language"      |
| **Self-contained** | Each recipe independent      | Examples build on each other         |

### Cookbook vs How-To Guides

| Aspect          | Cookbook (Tutorial)          | How-To Guide                        |
| --------------- | ---------------------------- | ----------------------------------- |
| **Nature**      | Learning-oriented            | Goal-oriented                       |
| **Scope**       | General problem + solution   | Specific task in specific context   |
| **Code**        | Complete, runnable example   | Steps to achieve goal               |
| **Location**    | `tutorials/cookbook/`        | `how-to/`                           |
| **Reusability** | Reusable pattern             | Specific to project/context         |
| **Explanation** | How solution works generally | Steps to achieve this specific goal |
| **Example**     | Recipe: Parse any CSV        | How to parse users.csv in this app  |

**Decision criteria**:

- **Cookbook recipe** if: General problem, reusable solution, educational value, applies across projects
- **How-to guide** if: Specific task, project-specific context, goal-oriented steps, one-time setup

### Cookbook vs By-Concept

| Aspect           | Cookbook              | By-Concept                         |
| ---------------- | --------------------- | ---------------------------------- |
| **Organization** | By problem type       | By concept hierarchy               |
| **Structure**    | Problem → Solution    | Concept → Examples → Exercises     |
| **Depth**        | Solve one problem     | Comprehensive concept coverage     |
| **Theory**       | Minimal (just enough) | Extensive (deep understanding)     |
| **Use case**     | "How do I solve X?"   | "I want to understand Y deeply"    |
| **Progression**  | No required order     | Beginner → Intermediate → Advanced |

## Validation and Quality Metrics

### Coverage Metrics

**Recipe count by category**:

- Setup and Configuration: 3-5 recipes
- Data Manipulation: 5-8 recipes
- File Operations: 3-5 recipes
- Network and HTTP: 4-6 recipes
- Concurrency: 3-5 recipes
- Testing: 3-4 recipes
- Performance: 2-4 recipes
- Error Handling: 3-5 recipes
- Security: 3-5 recipes
- Database: 3-5 recipes

**Total**: 30+ recipes (minimum for complete cookbook)

### Quality Validation

**Automated checks** (by apps-ayokoding-web-general-checker):

- ✅ Recipe has all required sections
- ✅ Code is properly annotated (0.5-1.5 ratio)
- ✅ Problem statement is clear and specific
- ✅ Common Pitfalls section has 3-5 items
- ✅ Related Recipes has 2-4 links
- ✅ Code includes all necessary imports
- ✅ Recipe is in correct category folder

**Manual review checks**:

- ✅ Code actually runs (copy-paste test)
- ✅ Solution solves stated problem
- ✅ Pitfalls are realistic and common
- ✅ Explanation is clear and concise
- ✅ Recipe is self-contained

## Principles Implemented/Respected

This convention implements and respects:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Automated validation via apps-ayokoding-web-general-checker agent
- **[Progressive Disclosure](../../principles/content/progressive-disclosure.md)**: Recipes organized by problem complexity within categories
- **[No Time Estimates](../../principles/content/no-time-estimates.md)**: Focus on problem solved, not time to implement
- **[Accessibility First](../../principles/content/accessibility-first.md)**: Color-blind friendly diagrams and accessible formatting
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Clear problem statements and complete, runnable code

## Scope

**Universal Application**: This convention applies to **all cookbook tutorial content** across the repository:

- **apps/ayokoding-web/content/** - Canonical location for programming language cookbooks (Java, Golang, Python, etc.)
- **apps/oseplatform-web/content/** - Platform cookbooks using recipe approach
- **Any other location** - Cookbook tutorials regardless of directory

**Implementation Notes**: While these standards apply universally, Hugo-specific details (frontmatter, weights, navigation) are covered in [Hugo conventions](../hugo/README.md)

### What This Convention Covers

- **Cookbook tutorial structure** - Problem-focused recipes organized by category
- **Target audience** - Developers at any level seeking practical solutions
- **Recipe format** - Problem → Solution → Explanation → Pitfalls → Related
- **Recipe organization** - By problem type (not difficulty level)
- **Recipe count** - 30+ recipes across problem domains
- **Code quality** - Copy-paste ready, annotated at 0.5-1.5 density
- **Independence** - Each recipe self-contained and usable in any order

### What This Convention Does NOT Cover

- **General tutorial standards** - Covered in [Tutorials Convention](./general.md)
- **Tutorial naming** - Covered in [Tutorial Naming Convention](./naming.md)
- **Hugo-specific implementation** - Covered in [Hugo conventions](../hugo/README.md)
- **How-to guides** - Goal-oriented guides in how-to/ directory (different from cookbook)
- **By-example tutorials** - Sequential learning examples (different structure)
- **By-concept tutorials** - Comprehensive concept coverage (different organization)

## Related Documentation

- **[Tutorial Naming Convention](./naming.md)**: Cookbook as Component 5 of Full Set Tutorial Package
- **[Tutorial Convention](./general.md)**: Base tutorial standards that cookbook inherits
- **[Programming Language Structure](./programming-language-structure.md)**: Where cookbook/ folder fits in directory structure
- **[Programming Language Content](./programming-language-content.md)**: Cookbook as mandatory component for complete language content
- **[By-Example Tutorial](./by-example.md)**: Comparison with code-first learning path
- **[By-Concept Tutorial](./by-concept.md)**: Comparison with narrative-driven learning path

---

**Last Updated**: 2026-01-30
