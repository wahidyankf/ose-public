---
description: "Explains how By-Concept tutorials adapt the general tutorial structure into introduction, concept sections, hands-on elements, and summary/next-steps."
when_to_use: "Read when mapping general tutorial structure requirements onto a By-Concept tutorial's four-part layout."
---

# Structure Integration with General Tutorial Standards

By-concept tutorials adapt the general [Tutorial Convention](../general.md) structure for narrative-driven learning:

## Adaptation of General Structure

**Traditional Tutorial Structure** (from [Tutorials Convention](../general.md)):

- Introduction → Prerequisites → Objectives → Content Sections → Challenges → Summary → Next Steps

**By-Concept Structure Adaptation**:

1. **Introduction section** (serves as motivation):
   - Hook and motivation (why this language/framework matters)
   - Prerequisites (programming experience level)
   - Learning path diagram (visual roadmap)
   - Coverage explanation (0-40% beginner, 40-75% intermediate, 75-95% advanced)
   - Links to by-example path for code-first alternative

2. **Concept sections** (replace sequential examples):
   - 15-25 concept sections per level (beginner/intermediate/advanced)
   - Each section teaches one major concept through narrative + annotated code
   - Concepts build progressively from fundamentals to advanced patterns
   - Coverage: beginner (0-40%), intermediate (40-75%), advanced (75-95%)

3. **Hands-on elements integrated into sections**:
   - Code examples within each concept section
   - Exercises at 4 difficulty levels (Basic, Intermediate, Advanced, Expert)
   - Learners can copy, run, and modify code while reading explanations

4. **Summary and next steps** (at end of each level):
   - Links to by-example path for code-first learning
   - Links to related frameworks/tools
   - Production application guidance

## Inherited Requirements from General Tutorial Convention

By-concept tutorials MUST follow these general tutorial standards:

- PASS: **Learning-oriented approach** (Diátaxis framework): Teach through understanding, not just reference
- PASS: **Progressive Disclosure**: Complexity increases gradually (beginner → intermediate → advanced)
- PASS: **Visual completeness**: Diagrams when appropriate (30-50 diagrams total)
- PASS: **Hands-on elements**: Every section has runnable code examples
- PASS: **Accessibility**: Color-blind friendly diagrams, clear structure
- PASS: **Real-world relevance**: Connect concepts to production use cases

## Specialized Requirements for By-Concept

Beyond general tutorial standards, by-concept adds:

- PASS: **Annotation density**: 1.0-2.25 comment lines per code line (same as by-example)
- PASS: **Narrative structure**: Concepts explained before showing code
- PASS: **Section count**: 40-60 sections total achieving 95% coverage
- PASS: **Diagram density**: 30-50 diagrams total (same as by-example)
- PASS: **Concept-first approach**: Explain concepts, then illustrate with annotated code
