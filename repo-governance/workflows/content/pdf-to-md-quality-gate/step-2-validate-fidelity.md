---
description: "Step 2: invokes pdf-to-md-checker to validate the generated Markdown against the source PDF across all fidelity dimensions."
when_to_use: "Use when implementing or debugging the fidelity-validation step of the quality gate."
---

# 2. Validate Fidelity (Sequential)

## 0. Lifecycle Validation Filter

Apply [Lifecycle Validation Ownership](../../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md)
before composing checker prompts. Pass the resulting exact gate IDs as
`delegated-gate-ids` and `lifecycle-evidence`; delegated Markdown mechanics cannot become fidelity
findings.

Validate the Markdown file against the source PDF across all dimensions.

**Agent**: `pdf-to-md-checker`

- **Args**: `pdf-file: {input.pdf-file}, md-file: {input.md-file}, EXECUTION_SCOPE: pdf-to-md,
delegated-gate-ids: {step0.outputs.delegated-gate-ids},
lifecycle-evidence: {step0.outputs.lifecycle-evidence}`
- **Output**: `{pdf-to-md-report-N}` — fidelity audit report

**Success criteria**: Checker completes and generates audit report.

**On failure**: Terminate workflow with status `fail`.

**Validation dimensions**:

- **Text completeness** — no PDF passages missing from Markdown
- **Text accuracy** — no words changed or incorrectly transcribed
- **Heading level accuracy** — `#` depth of every heading matches the PDF visual hierarchy
  (title = H1, chapter/part = H2, section = H3, subsection = H4, sub-subsection = H5); derived
  from font-size heuristics and section-numbering depth in `pdftotext -layout` output
- **Content nesting accuracy** — list nesting depth and indented block elements match PDF
  structure; nested bullets and numbered lists carry the correct level into Markdown
- **Table integrity** — all tables present with correct data
- **Figure coverage** — every figure has Mermaid or placeholder
- **Mermaid fidelity** — Mermaid figures remain complete, faithful, and syntactically valid; the
  `md-mermaid` gate does not parse syntax, so its delegation never removes this check
- **OCR quality** — image-only pages have acceptable error rate (<10%)
- **Structural order** — sections appear in PDF reading order

**Notes**:

- Processes PDF in 50-page chunks for large documents
- Loads `local-tmp/.known-false-positives.md` skip list before validating
