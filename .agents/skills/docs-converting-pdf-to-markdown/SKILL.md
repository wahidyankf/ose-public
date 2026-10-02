---
name: docs-converting-pdf-to-markdown
description: PDF-to-Markdown conversion fidelity — the crane CLI, criticality levels, and workflow steps shared by the pdf-to-md maker/checker/fixer family
---

# Converting PDF to Markdown

A Markdown file converted from a PDF must be a verbatim, complete representation of its source:
every passage, table, heading level, list-nesting depth, figure, and diagram preserved.

## When This Skill Loads

Auto-loads for `pdf-to-md-maker`, `pdf-to-md-checker`, and `pdf-to-md-fixer`.

## Lifecycle Delegation

Under a quality gate, never report or fix a property the gate's Deterministic Boundary lists; its declared tool
owns it, per the [Quality Gate Contract](../../../repo-governance/development/workflow/quality-gate-contract.md). PDF/source fidelity
remains authoritative.

## Reference Modules

- [checking-fidelity-criticality-and-format.md](./reference/checking-fidelity-criticality-and-format.md)
  and [checking-fidelity-workflow.md](./reference/checking-fidelity-workflow.md) — the
  checker's seven-dimension validation workflow, `crane check-*` commands, criticality table, and
  audit report format.
- [making-conversions-detect-and-extract.md](./reference/making-conversions-detect-and-extract.md)
  and [making-conversions-assemble-and-write.md](./reference/making-conversions-assemble-and-write.md) —
  the maker's PDF-type detection, text/OCR extraction, chunk-to-Markdown conversion, assembly, and
  output steps.
- [fixing-conversions-confidence-and-priority.md](./reference/fixing-conversions-confidence-and-priority.md)
  and [fixing-conversions-operations-and-report.md](./reference/fixing-conversions-operations-and-report.md) —
  the fixer's confidence assessment, priority order, per-finding fix operations, and fix report
  format.

## Tools Usage

- **Bash**: `crane` (pdf/text/heading/nesting/table/figure/mermaid/ocr/report/skiplist commands),
  `diff` for comparison
- **Read**: source Markdown and temporary extracted text files
- **Glob**: locate the MD file when path not specified
- **Grep**: search MD for text segments, count figures, find Mermaid blocks
- **Write**: progressive audit/fix reports to `local-tmp/pdf-to-md/`

## Reference Documentation

- [pdf-to-md-quality-gate workflow](../../../repo-governance/workflows/quality/pdf-to-md-quality-gate.md)
