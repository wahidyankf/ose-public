---
description: Universal markdown content quality standards applicable to all repository markdown contexts
when_to_use: Read this before writing or reviewing any markdown content in this repository.
---

# Content Quality Principles

This convention establishes universal content quality standards for **ALL markdown content** in this repository.

## Contents

- [Purpose, Scope, and Principles](./quality/purpose-scope-and-principles.md) — why this convention exists, its accessibility/no-time-estimates principles, and what it covers.
- [Writing Style: Active Voice and Professional Tone](./quality/writing-style-active-voice-and-tone.md) — active vs passive voice and professional-yet-approachable tone.
- [Writing Style: Clarity, Conciseness, and Audience Awareness](./quality/writing-style-clarity-and-audience.md) — writing clearly with minimal words and adjusting for audience level.
- [Heading Hierarchy: Descriptive Headings, Semantic Structure, and Machine Enforcement](./quality/heading-hierarchy-descriptive-and-enforcement.md) — descriptive heading text, headings-for-structure-only, and the automated enforcement allowlist.
- [Accessibility: Alt Text and Semantic HTML](./quality/accessibility-alt-text-and-semantic-html.md) — descriptive image alt text and semantic markdown elements.
- [Accessibility: ARIA, Color Contrast, and Screen Readers](./quality/accessibility-aria-contrast-and-screen-readers.md) — ARIA labels, color-contrast ratios, and screen-reader structuring.
- [Code Block and Text Formatting](./quality/code-block-and-text-formatting.md) — code block indentation standards and bold/italic/inline-code/strikethrough usage.
- [List and Blockquote Formatting](./quality/list-and-blockquote-formatting.md) — unordered/ordered/nested/checklist lists and blockquote/callout formatting.
- [Table Formatting, Line Length, and Paragraph Structure](./quality/table-formatting-line-length-and-paragraphs.md) — table syntax, prose line length, and paragraph structuring.
- [No Time Estimates](./quality/no-time-estimates.md) — the rule permitting labelled time estimates in documentation; plan documents stay banned.
- [Quality Checklist, Related Conventions, and References](./quality/quality-checklist-and-references.md) — the pre-commit checklist and links to related conventions.

## Heading Hierarchy: Single H1 Rule and Nesting

### Single H1 Rule

**Every markdown file MUST have exactly ONE H1 heading** - the document title.

PASS: **Correct (Single H1)**:

```markdown
# User Authentication Guide

## Overview

This guide covers authentication implementation.

## Setup

Follow these steps to set up authentication...
```

FAIL: **Incorrect (Multiple H1s)**:

```markdown
# User Authentication Guide

# Overview

This guide covers authentication implementation.

# Setup

Follow these steps...
```

**Why**: Single H1 provides clear document hierarchy for screen readers and SEO.

### Proper Heading Nesting

**Headings MUST follow semantic hierarchy** - don't skip levels.

PASS: **Correct Nesting**:

```markdown
# Document Title (H1)

## Section (H2)

## Subsection (H3)

#### Detail (H4)

## Another Section (H2)

## Another Subsection (H3)
```

FAIL: **Incorrect (Skipped Levels)**:

```markdown
# Document Title (H1)

## Subsection (H3) <!-- WRONG! Skipped H2 -->

##### Detail (H5) <!-- WRONG! Skipped H4 -->
```

**Why**: Proper nesting creates logical structure for screen readers and document outlines.
