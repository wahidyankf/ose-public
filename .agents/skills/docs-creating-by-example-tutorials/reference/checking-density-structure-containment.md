# Checking By-Example Format — Count, Density, Structure, Self-Containment

Validation checklist for `tutorial-by-example-checker`.

## 1. Example Count

Minimum 75 annotated code examples, target 75-85. Each example follows the five-part structure.

## 2. Annotation Density

**CRITICAL**: 1.0-2.25 comment lines per code line PER EXAMPLE (not tutorial-wide average).
Comments explain WHY, not WHAT. Flag if density <1.0 (under-annotated) or >2.5 (over-annotated).

**Formula direction** (critical to get right):

```python
# CORRECT
density = comment_lines / code_lines
# Example: 10 comments / 5 code lines = 2.0 -> PASS (within 1.0-2.25)

# WRONG — inverted
density = code_lines / comment_lines  # 5 / 10 = 0.5 would incorrectly flag as FAIL
```

**Counting rules**: code lines are actual executable code (excluding blank and full-comment-only
lines); comment lines contain annotation markers (`// =>`, `# =>`, `-- =>`, `;; =>`), counting both
inline and full-line comments plus multi-line `// =>` continuations as separate lines; density is
calculated per example individually, never as a file average.

## 3. Structure

Five-part structure for each example: (1) Brief Explanation (2-3 sentences), (2) Mermaid Diagram
(when appropriate), (3) Heavily Annotated Code (1.0-2.5 density), (4) Key Takeaway (1-2 sentences),
(5) Why It Matters (50-100 words; flag if >100).

## 4. Self-Containment

Examples runnable within chapter scope (copy-paste-runnable), full imports present, helper
functions included in-place, no external references required, self-contained even while building
on earlier concepts.
