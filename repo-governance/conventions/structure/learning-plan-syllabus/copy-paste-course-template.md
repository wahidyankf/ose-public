---
description: The three-tier (REQUIRED/RECOMMENDED/OPTIONAL) copy-paste markdown skeleton for authoring a new syllabus course file, matching the measured section tiering.
when_to_use: Read this when starting a new syllabus/courses/<course-id>.md file — copy the REQUIRED skeleton, then add RECOMMENDED and OPTIONAL sections as they apply.
---

# Copy-Paste Course Template

Part of the [Learning-Plan `syllabus/` Folder Convention](../learning-plan-syllabus.md). Every
course file follows the same three-tier shape as the
[measured sections](./corpus-census-section-tiering.md): a REQUIRED skeleton every course
carries, a RECOMMENDED skeleton nearly every course carries, and OPTIONAL sections a course
includes only when it genuinely has that content.

## REQUIRED Sections

```markdown
# <Course Title> (<Format: By Example|Annotated-Concept|...>)

**Course ID**: `<course-id>` · **Format**: <By Example|Annotated-Concept|...>.

**Scope note**: <one to three sentences precisely bounding what this course covers and, just as
importantly, what it explicitly excludes — name the adjacent course(s) that own the excluded
material>.

## Why this exists · the big idea

- **The problem before the solution**: <why a reader needs this before anything downstream makes
  sense>.
- **Keep-this-if-you-forget-everything**: <the single sentence a reader should retain if nothing
  else survives>.

## Prerequisites

- **Prior courses**: <course-id, course-id, or "none">.
- **Assumed knowledge**: <baseline knowledge assumed without a prior course>.

## Accuracy notes

- <fact-by-fact provenance for every non-obvious claim in this file, e.g.
  `stable, non-dynamic domain fact`, `repository: <file>`, or
  `<source URL>, accessed YYYY-MM-DD`, written as plain provenance with no inline confidence label>.

## Concepts

- **co-01 · <concept-slug>** — <one-line definition a reader can act on>.
- **co-02 · <concept-slug>** — <one-line definition a reader can act on>.

## In which paths

- `<path-id>` — Stage <N> · <one-line placement rationale>.
```

## RECOMMENDED Sections

Place these immediately after the REQUIRED skeleton above, before `## In which paths`, following the
measured house order (`**Short summary**` line near the top, `## Worked examples` and
`## Read more` after `## Concepts`):

```markdown
**Short summary**: <one or two sentences, back-cover-style, distinct from the Scope note above>.

## Worked examples

### Beginner

- **ex-01 · <exercise-slug>** — <task> — verify <observable check>. (co-01, co-02)

### Intermediate

- **ex-02 · <exercise-slug>** — <task> — verify <observable check>. (co-01)

### Advanced

- **ex-03 · <exercise-slug>** — <task> — verify <observable check>. (co-01–co-02)

## Read more

- **<Title>** — <Author> (<Publisher>). <One-line note on why it's cited>.
```

## OPTIONAL Sections

Include only when the course genuinely has this content — a course with neither a build-worthy
synthesis nor a real historical lineage should omit these rather than pad them:

```markdown
## Capstone spec

<a full runnable per-course capstone, when the course's applied synthesis is a build exercise>

## Tensions & trade-offs

- **<tension-name>** — <the two positions in genuine tension, and why neither dominates>.

## Lineage

- <where this course's content and structure were mined from, and what changed in the mining — for
  example a prior narrative in `legacy/<path>` or a predecessor plan's syllabus>.
```
