---
description: Workflows for creating, converting, and validating content in various formats
when_to_use: Use when routing to a workflow that converts a source document to Markdown or validates conversion fidelity.
---

# Content Workflows

Use these workflows when a source document must become a trustworthy repository artifact. They cover
conversion and fidelity checks, so a reader can rely on the resulting Markdown rather than guessing
what changed.

## Workflows in This Family

- [pdf-to-md-quality-gate](pdf-to-md-quality-gate.md) — Converts a PDF to verbatim Markdown and validates fidelity via Maker-Checker-Fixer until convergence. Use when converting a PDF to Markdown, or revalidating an existing PDF-derived Markdown file.

## When to Use These Workflows

- After receiving a new PDF source document that needs Markdown archival
- To verify an existing PDF-to-Markdown conversion for completeness
- Before using a Markdown file for cross-referencing (quality gate)
- When a PDF has been updated and the Markdown needs revalidation

## Agents Used

- **[pdf-to-md-maker](../../../.claude/agents/pdf-to-md/pdf-to-md-maker.md)** — Converts PDF to verbatim Markdown (text-based and image-only via OCR)
- **[pdf-to-md-checker](../../../.claude/agents/pdf-to-md/pdf-to-md-checker.md)** — Validates Markdown fidelity against source PDF
- **[pdf-to-md-fixer](../../../.claude/agents/pdf-to-md/pdf-to-md-fixer.md)** — Applies validated fixes from checker audit

## Default Behaviour

By default, the PDF and Markdown file share the same directory and filename, differing only in extension:

```
docs/reference/security/frameworks/nist-sp-800-53-rev5.pdf
docs/reference/security/frameworks/nist-sp-800-53-rev5.md  ← output
```

## Related Workflows

- [docs-propagation](../docs/docs-propagation.md) — Carry newly created Markdown into every index and document that should cite it
