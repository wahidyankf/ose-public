# Workflow and Quality Requirements

## Tutorial-Specific Quality Requirements

Beyond general content quality (`docs-applying-content-quality`):

**Step-by-Step Clarity**: each step has a clear action verb (Create, Configure, Install, Test);
steps are sequential and build on each other; no circular dependencies (Step 3 can't require Step
5 completion); each step is verifiable.

**Code Example Quality**: all code examples tested and working; complete examples, not fragments
(unless teaching composition); show both code and expected output; syntax highlighting for all
code blocks; explain error cases and how to handle them.

**Learning Outcome Focus**: each tutorial has a clear, measurable outcome achievable by following
the steps; the Validation section verifies the outcome; Next Steps connects to related learning.

**Beginner Friendliness**: define technical terms on first use; explain WHY before HOW;
anticipate common mistakes and address them; provide context for commands and configurations;
link to prerequisites rather than assuming knowledge.

## Workflow: Creating a New Tutorial

1. Determine tutorial type and coverage level (Initial Setup, Quick Start, Beginner,
   Intermediate, Advanced, Cookbook, or By Example)
2. Create file structure — filename `tu-[content-identifier].md`, location
   `docs/tutorials/[category]/`, all required frontmatter fields
3. Write introduction — what you'll learn, why it's useful, expected outcome
4. Define prerequisites — required knowledge, tools/software, links to prerequisite tutorials
5. Structure tutorial steps — start with simplest working example, add complexity
   progressively, H2 for main steps / H3 for substeps, code + output + explanation per step
6. Add validation section — concrete verification steps, commands with expected outputs, success
   criteria
7. Write Next Steps — link to the logical next tutorial, related how-to guides, deeper
   explanations
8. Add troubleshooting if needed — common problems, clear symptoms/causes/solutions
9. Review against the checklist — all required sections present, steps sequential and complete,
   code examples work and are explained, links valid, quality standards met, diagrams
   accessible, any time estimate labelled as an estimate

## Workflow: Updating an Existing Tutorial

1. Read the existing tutorial — understand current structure and content, identify sections to
   update, note quality issues
2. Make targeted updates — update outdated information, add missing sections, improve clarity
   and examples, fix broken links
3. Maintain consistency — keep existing structure unless restructuring is needed, match writing
   style and tone, preserve working examples, update validation steps if needed
4. Verify changes — test updated code examples, check updated links, ensure quality standards
   still met
