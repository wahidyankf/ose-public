---
description: How In-the-Field tutorials adapt the general tutorial structure, plus the inherited and specialized requirements they must follow.
when_to_use: Use when structuring a new In-the-Field guide or verifying it inherits the right general-tutorial requirements.
---

# Structure Integration with General Tutorial Standards

In-the-field tutorials adapt the general [Tutorial Convention](../general.md) structure for production implementation learning:

## Adaptation of General Structure

**Traditional Tutorial Structure** (from [Tutorials Convention](../general.md)):

- Introduction → Prerequisites → Objectives → Content Sections → Challenges → Summary → Next Steps

**In-the-Field Structure Adaptation**:

1. **overview.md** (serves as introduction):
   - Hook and motivation (why this topic matters in production)
   - Prerequisites (requires by-example and/or by-concept completion)
   - Learning approach explanation (standard library → production frameworks)
   - Comparison to by-example/by-concept (foundation vs production)
   - Links to prerequisite tutorials

2. **Topic-specific guides** (replace sequential examples/concepts):
   - 20-40 production implementation guides covering real-world scenarios
   - Each guide addresses a specific production pattern or practice
   - Topics progress from fundamentals (standard library) to production frameworks
   - Coverage: Specific production scenarios, not comprehensive language coverage

3. **Hands-on elements integrated into guides**:
   - Production-grade code examples with framework integration
   - Code is production-ready, not simplified for learning
   - Includes error handling, logging, security practices
   - Integration testing examples

4. **Summary and next steps** (included in overview.md):
   - Links to related production topics
   - Framework selection guidance
   - Production deployment considerations

## Inherited Requirements from General Tutorial Convention

In-the-field tutorials MUST follow these general tutorial standards:

- PASS: **Learning-oriented approach** (Diátaxis framework): Teach production practices through experience
- PASS: **Progressive Disclosure**: Complexity increases from standard library to frameworks
- PASS: **Visual completeness**: Diagrams for architecture, flow, and integration patterns
- PASS: **Hands-on elements**: Production-ready code examples
- PASS: **Accessibility**: Color-blind friendly diagrams, clear structure
- PASS: **Real-world relevance**: All examples from production contexts

## Specialized Requirements for In-the-Field

Beyond general tutorial standards, in-the-field adds:

- PASS: **Production readiness**: Code includes error handling, logging, security
- PASS: **Framework introduction**: External frameworks/libraries permitted and encouraged
- PASS: **Standard library first**: Teach fundamentals before frameworks
- PASS: **Problem-solution format**: Show why standard library insufficient, then introduce framework
- PASS: **Integration focus**: Demonstrate combining multiple concepts and tools
- PASS: **Enterprise patterns**: Professional practices from industry
