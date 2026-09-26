---
description: "Explains how Cookbook tutorials adapt the general tutorial structure into an overview, independent recipes, and recipe-level structure."
when_to_use: "Read when mapping general tutorial structure requirements onto a Cookbook tutorial's problem-focused layout."
---

# Structure Integration with General Tutorial Standards

Cookbook tutorials adapt the general [Tutorial Convention](../general.md) structure for problem-solving:

## Adaptation of General Structure

**Traditional Tutorial Structure** (from [Tutorials Convention](../general.md)):

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

## Inherited Requirements from General Tutorial Convention

Cookbook tutorials MUST follow these general tutorial standards:

- PASS: **Learning-oriented approach** (Diátaxis framework): Teach through solving real problems
- PASS: **Visual completeness**: Diagrams when helpful for understanding solutions
- PASS: **Hands-on elements**: Every recipe has runnable, copy-paste ready code
- PASS: **Accessibility**: Color-blind friendly diagrams, clear structure
- PASS: **Real-world relevance**: Every recipe solves an actual production problem

## Specialized Requirements for Cookbook

Beyond general tutorial standards, cookbook adds:

- PASS: **Problem-focused organization**: By problem type, not difficulty level
- PASS: **Copy-paste readiness**: Code works as-is with minimal modification
- PASS: **Recipe independence**: Each recipe self-contained, no required reading order
- PASS: **Cross-level applicability**: Same recipe useful for beginner and advanced developers
- PASS: **Practical emphasis**: Minimal theory, maximum working code
- PASS: **Recipe count**: 30+ recipes covering common problem domains
