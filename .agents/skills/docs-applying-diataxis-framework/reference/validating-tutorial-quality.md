# Validating Tutorial Quality

Step-by-step execution guidance for `docs-tutorial-checker`, which validates pedagogical
structure, narrative flow, visual completeness, and hands-on elements against the
[Tutorial Convention](../../../repo-governance/conventions/tutorials/general.md) and
[Tutorial Naming Convention](../../../repo-governance/conventions/tutorials/naming.md).

## Validation Steps

**Step 1 — Read and understand**: read the tutorial completely, note the topic/audience/type
(Initial Setup, Quick Start, Beginner, Intermediate, Advanced, Cookbook, By Example), and read
referenced docs for consistency.

**Step 2 — Structural validation**: check tutorial-type compliance (title pattern, coverage
percentage, prerequisites, content depth all match the stated type), required sections present (title, description, learning
objectives, prerequisites, main content, next steps), and logical section progression.

**Step 3 — Narrative analysis**: evaluate writing style (engaging vs. dry, explanatory vs.
list-heavy), check flow (hooking introduction, progressive concept-building, smooth transitions,
closing conclusion), and flag narrative breaks (sudden complexity jumps, missing explanations,
forward references).

**Step 4 — Visual completeness**: identify where diagrams would help (complex concepts, workflows,
architecture), evaluate existing diagrams for sufficiency/integration/readability, and validate
color accessibility per [Color Accessibility Convention](../../../repo-governance/conventions/formatting/color-accessibility.md)
— accessible palette (blue #0173B2, orange #DE8F05, teal #029E73, purple #CC78BC, brown #CA9161),
never red/green/yellow, black (#000000) borders, WCAG AA 4.5:1 contrast, shape differentiation (not
color alone), documented color-scheme comment. Also validate diagram splitting per
[Diagram Size and Splitting](../../../repo-governance/conventions/formatting/diagrams/diagram-size-and-splitting-why-and-when.md):
no subgraphs (HIGH — breaks mobile rendering), ≤4-5 branches per node (MEDIUM), one concept per
diagram (MEDIUM), descriptive headers between diagrams (LOW).

**Step 5 — Hands-on assessment**: evaluate example completeness/clarity/progression, check
actionability (clear steps, checkpoints), and assess practice elements (exercises,
troubleshooting).

**Step 6 — Finalize**: update report status to Complete, add summary statistics. All findings from
Steps 1-5 must already be written progressively — never buffered.

## Critical LaTeX Check

Single `$` only for inline math (same line as text); display equations and `\begin{aligned}` blocks
must use `$$`; multi-line equations use `\begin{aligned}...\end{aligned}` (not `\begin{align}`) for
KaTeX compatibility.

## Report Structure

Executive Summary (0-10 quality score, key strengths, critical issues, publish/minor-revision/
major-revision recommendation), Detailed Findings by the six validation categories (Structure,
Narrative, Content Balance, Visual, Hands-On, Overall Completeness), Specific Issues with line
numbers + severity + recommendation, Positive Findings, and Prioritized Recommendations.

## Anti-Patterns

See [Tutorial Convention — Anti-Patterns](../../../repo-governance/conventions/tutorials/general.md)
for the full list of 12; the most common: reference material disguised as tutorial,
goal-oriented instead of learning-oriented, missing prerequisites/visual aids, incorrect LaTeX
delimiters, sudden difficulty jumps without scaffolding, solutions without explanations.
