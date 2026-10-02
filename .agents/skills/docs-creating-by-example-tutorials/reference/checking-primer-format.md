# Checking Primer ("Just Enough X") Format

Validation checklist for `tutorial-primer-checker`. The mechanical density/structure
criteria are shared with By Example (see SKILL.md); this module covers Primer-specific checks.

## 1. Example Count

Minimum 75 annotated code examples, target 75-85. **Floor, not a cap**: flag ONLY when the count is
below 75. Never flag for exceeding 85 — additional depth within scope is acceptable. Each example
follows the five-part structure.

## 2. Annotation Density

**CRITICAL**: 1.0-2.25 comment lines per code line PER EXAMPLE, same formula and counting rules as
By Example (`density = comment_lines ÷ code_lines`, never inverted). Flag if density < 1.0
(under-annotated) or > 2.5 (over-annotated).

## 3. Structure

Five-part structure for each example: (1) Brief Explanation (2-3 sentences), (2) Mermaid Diagram
(when appropriate), (3) Heavily Annotated Code, (4) Key Takeaway (1-2 sentences), (5) Why It
Matters (50-100 words; flag if >100).

## 4. Self-Containment

Examples runnable within the primer's scope (copy-paste-runnable), full imports present (no "assume
this is imported"), helper functions included in-place, no external references required to run code.

## 5. Scope Discipline (CRITICAL — Primer-specific)

`overview.md` states the "just enough to be productive here" scope explicitly, plus which later
topics depend on this primer. Every example serves that stated scope — flag examples that drift into
comprehensive-language-reference territory (niche standard-library corners, advanced features no
consuming topic needs) as scope creep; this is what distinguishes a Primer from a full By Example
tutorial. Flag a missing scope statement in `overview.md` as CRITICAL (the defining constraint of
this format is otherwise unverifiable).

## 6. Example Grouping

Thematic grouping within the scoped surface, progressive complexity within groups, clear group
headers.

## 7. Capstone Type

The intra-topic capstone is a **light consolidation exercise** (a short program using the
just-learned scoped features together), not a full runnable project. Flag a full-project-scale
capstone as scope creep — it belongs in a By Example tutorial instead.

## 8. ayokoding-web Compliance

Per `apps-ayokoding-www-developing-content`: bilingual content (id/en), content structure and
metadata, linking conventions.

## 9. Diagram Count

Color palette: Blue `#0173B2`, Orange `#DE8F05`, Teal `#029E73`, Purple `#CC78BC`, Brown `#CA9161`.
Appropriate usage: only for complex concepts (data flow, state machines, syntax relationships).
