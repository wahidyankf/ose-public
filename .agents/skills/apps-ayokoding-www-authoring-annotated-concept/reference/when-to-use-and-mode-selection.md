# When to Use, Mode Selection, and Requirements

## When to Use This Agent

Use this agent when:

- Creating new Annotated-concept tutorials for subject topics that are concept-centric rather than
  language-syntax-centric (e.g., computer science foundations, software architecture, system design,
  security, engineering practice topics)
- Authoring a leadership/governance topic in the no-code sub-mode (e.g., project management,
  technical communication, engineering management, governance/risk/compliance topics)
- Adding worked examples or scenarios to an existing Annotated-concept tutorial

**Do NOT use for:**

- By Example tutorials (language-syntax-centric; use `apps-ayokoding-www-by-example-maker`)
- Primer ("Just Enough X") language/tool on-ramps (use `apps-ayokoding-www-primer-maker`)
- Validation (use `tutorial-annotated-concept-checker`)
- Fixing issues (use `tutorial-annotated-concept-fixer`)

**Note**: Annotated-concept is a distinct format from the pre-existing narrative "By-Concept"
tutorial type documented in
[By-Concept Tutorial Convention](../../../../repo-governance/conventions/tutorials/by-concept.md)
(that convention targets 95% narrative coverage of a subject; Annotated-concept targets 45-60
concept-centric worked examples at equal density). Do not conflate the two when reading related
conventions.

## Mode Selection (Determine First, Before Authoring)

Every Annotated-concept topic is authored in exactly one of two modes. Determine the mode from the
topic's format designation (the content plan or syllabus states this explicitly — look for a
leadership/no-code marker, commonly written as a `‡` glyph or an explicit "no-code" label) before
writing any content:

**Standard mode** (concept-centric, code-bearing):

- The topic teaches concepts that are demonstrable in code, pseudocode, config, or diagrams
- Produces a `code/` directory with colocated runnable source files for every code-bearing worked
  example
- Target: **45-60 worked examples**

**No-code sub-mode** (leadership/governance topics):

- The topic teaches judgment, process, or organizational concepts with **zero code**
- Produces **no** `code/` directory and **no** runnable files
- Worked examples are replaced by **worked scenarios / decision artifacts** (decision records,
  governance matrices, runbooks, prioritization frameworks) — still following an annotated,
  reasoning-transparent structure
- Target: **20-30 worked scenarios**
- Diagrams (decision trees, process flows, org/escalation structures) remain welcome and follow the
  same accessible-palette standard as standard mode

This is a validated **sub-mode of the same trio**, not a separate agent — the maker, checker, and
fixer all branch on mode internally rather than routing to different agents.
