---
description: "Examples for plans, README, workflows, by-example checkers."
when_to_use: "Use for a domain example in these checkers."
---

# Domain-Specific Examples: Plans through By-Example Tutorials

## Plans (plan-checker, plan-execution-checker)

**CRITICAL**:

- Missing required sections (Goal, Approach, Deliverables)
- Contradictory requirements (implementation impossible)
- Broken link to critical dependency

**HIGH**:

- Missing acceptance criteria
- Incomplete deliverables checklist
- Ambiguous requirements needing clarification

**MEDIUM**:

- Missing optional risk section
- Suboptimal organization
- Minor formatting issue

**LOW**:

- Suggest additional context
- Consider alternative approach
- Potential refinement

## README (readme-checker)

**CRITICAL**:

- Broken quick start instructions (commands fail)
- Incorrect installation command (verified incorrect)
- Missing navigation structure (users lost)

**HIGH**:

- Jargon without explanation (accessibility issue)
- Paragraph >5 lines (scannability violation)
- Missing problem-solution hook
- Acronym without context

**MEDIUM**:

- Paragraph at 4-5 lines (approaching limit)
- Slightly verbose explanation
- Minor structural improvement needed

**LOW**:

- Suggest adding visual elements
- Consider adding badges
- Potential rewording for clarity

## Workflows (repo-workflow-checker)

**CRITICAL**:

- Missing the workflow's `Goal and Termination` body section
- Invalid step dependency reference (execution breaks)
- Contradictory termination criteria

**HIGH**:

- Missing success criteria for step
- Ambiguous agent invocation pattern
- Incomplete error handling specification

**MEDIUM**:

- Missing optional example usage
- Suboptimal step ordering
- Minor formatting inconsistency

**LOW**:

- Suggest additional examples
- Consider alternative agent selection
- Potential optimization

## By-Example Tutorials (tutorial-by-example-checker)

**CRITICAL**:

- Code example won't run (syntax error verified)
- Missing critical example for core concept
- Coverage <95% (below requirement)

**HIGH**:

- Example missing educational annotation
- Missing diagram for complex concept
- Code example incomplete (missing imports)

**MEDIUM**:

- Annotation could be more detailed
- Alternative approach not shown
- Minor code style inconsistency

**LOW**:

- Suggest additional edge case
- Consider showing optimization
- Potential alternative syntax

---
