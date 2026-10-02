---
description: "Lists what the checker agent automatically validates and production validation results, the quality-gate workflow, and how by-example relates to other tutorial types."
when_to_use: "Read when you need to know exactly what the automated checker validates, how the quality-gate workflow runs, or how by-example compares to other tutorial types."
---

# Validation and Enforcement, and Relationship to Other Tutorial Types

## Validation and Enforcement

### Automated Validation

The **tutorial-by-example-checker** agent validates:

- **Coverage percentage**: 95% target achieved
- **Example count**: 75-85 total (beginner: 27-30, intermediate: 20-30, advanced: 25-28)
- **Self-containment**: All imports present, code runnable within chapter scope
- **Annotation density**: 1.0-2.25 comment lines per code line PER EXAMPLE (not file average)
- **Annotation quality**: `// =>` or `# =>` notation used, explains WHY not just WHAT
- **Diagram frequency**: 30-50 total diagrams (7-11 beginner, 8-17 intermediate, 10-24 advanced)
- **Color-blind palette**: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- **Five-part structure**: Brief explanation, diagram (when appropriate), annotated code, key takeaway, why it matters
- **Frontmatter completeness**: Title, date, weight, description, tags present

**Production validation results** (ayokoding-www languages):

- Golang: ✅ 85 examples, 33 diagrams, 2.1 avg density
- Python: ✅ 80 examples, 34 diagrams, 2.0 avg density
- Rust: ✅ 85 examples, 37 diagrams, 1.9 avg density
- Java: ✅ 75 examples, 30 diagrams, 2.2 avg density
- Kotlin: ✅ 81 examples, 48 diagrams, 2.1 avg density
- Elixir: ✅ 85 examples, 46 diagrams, 2.0 avg density
- Clojure: ✅ 80 examples, 32 diagrams, 1.8 avg density

### Quality Gate Workflow

The **by-example-quality-gate** workflow orchestrates:

1. **apps-ayokoding-www-by-example-maker**: Creates/updates examples
2. **tutorial-by-example-checker**: Validates against standards
3. **User review**: Reviews audit report
4. **tutorial-by-example-fixer**: Applies validated fixes

## Relationship to Other Tutorial Types

By-example tutorials complement other learning approaches:

| Type              | Coverage         | Example Count | Approach                | Target Audience            |
| ----------------- | ---------------- | ------------- | ----------------------- | -------------------------- |
| **Initial Setup** | 0-5%             | 1-3           | Environment setup       | All users                  |
| **Quick Start**   | 5-30%            | 5-10          | Project-based           | Newcomers                  |
| **Beginner**      | 0-60%            | 15-25         | Narrative explanations  | Complete beginners         |
| **By Example**    | **95%**          | **75-85**     | **Code-first examples** | **Experienced developers** |
| **Intermediate**  | 60-85%           | 20-30         | Production patterns     | Past basics                |
| **Advanced**      | 85-95%           | 15-25         | Expert topics           | Experienced users          |
| **Cookbook**      | Problem-specific | Varies        | Recipe solutions        | All levels                 |

**Key distinction**: By-example achieves 95% coverage through 75-85 heavily annotated examples while beginner achieves 60% through ~20 narrative-driven examples. Advanced tutorials reach 85-95% through ~20 deep dives into specialized topics. By-example's higher example count (75-85 vs 15-25) enables comprehensive reference while maintaining code-first learning approach.
