---
description: >-
  The tools, numeric thresholds, and markers the PDF-to-Markdown quality gate and its propagation use in this
  repository, beside the generic fidelity rules the gate states.
when_to_use: >-
  Use when running the PDF-to-Markdown quality gate or its propagation here, or when setting up the conversion check
  tools.
---

# PDF to Markdown Gate Adapter

**Configures:** the [PDF to Markdown Quality Gate](../../../workflows/quality/pdf-to-md-quality-gate.md) and
[PDF to Markdown Propagation](../../../workflows/quality/pdf-to-md-propagation.md). The gate's seven dimensions and its
criticality rules stay generic; this adapter adds only what this repository decides.

## Tools

The checker reads the PDF through the `crane` command-line tool (`apps/crane-cli`), plus `tesseract` for image-only
pages and `jq` for `crane` output. Build and put `crane` on the path through HIPPO (the project's `build` target, then
the `bin/Release/net10.0` output directory); install `tesseract` and `jq` with the system package manager.

- `crane check-all <pdf> <md>` runs the core dimensions with one shared extraction; prefer it. `--cache-dir <dir>`
  caches extractions by the PDF's SHA-256.
- On a PDF over about 200 pages, `check-all` may not finish. The checker may fall back to `crane text`, `heading`,
  `nesting`, `table`, `figure`, `mermaid`, and `ocr` one dimension at a time, and `pdftotext -layout` in 50-page
  chunks. A dimension sampled rather than exhausted is recorded with its pages in the verdict block, as the gate
  requires.
- `crane skiplist` and `crane report` support the ledger; `mmdc` is optional for parsing diagrams.

These are checker aids, not a declared gate: their output is evidence for a finding, never a finding by itself.

## Thresholds

- **OCR error rate.** Above 10% is CRITICAL, 5% to 10% HIGH, and 2% to 5% MEDIUM, alongside the gate's judgement of error
  patterns and spread.
- **Wide-scope downgrade.** The fixer downgrades a HIGH-confidence repair to `needs-decision` when it would change more
  than 10 occurrences of one structural pattern, besides the gate's other downgrade cases.

## Markers

- Every page read through OCR carries `<!-- OCR: page N -->` at its start.
- The verdict block states page coverage and the counts of tables, figures, and Mermaid blocks.

## Related Documentation

- [Gate Adapters](README.md) — every adapter in this repository.
- The `docs-converting-pdf-to-markdown` skill holds the conversion and checking procedures.
