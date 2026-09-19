---
description: "Lists required CLI tools (crane-cli, tesseract, jq), install/verify commands, and the crane check-all aggregator with its large-PDF fallback."
when_to_use: "Use when setting up the toolchain for this workflow or diagnosing a missing-tool failure."
---

# Tool Dependencies

Build crane-cli and add to PATH:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run crane-cli:build
export PATH="$PWD/apps/crane-cli/bin/Release/net10.0:$PATH"
crane --version                                      # prints assembly version, exits 0
crane --help                                         # lists every subcommand
```

Install system dependencies:

```bash
brew install tesseract     # OCR for image-only PDFs
brew install jq            # JSON parsing for crane output
```

Verify:

```bash
crane --version
crane --help
tesseract --version
jq --version
```

**Aggregator entry point**: `crane check-all <pdf> <md>` runs the six core check dimensions in one
process with a single shared PDF extraction. Prefer this over invoking each dimension separately.
Add `--cache-dir <dir>` to persist PDF extractions keyed by SHA256 of the PDF bytes; subsequent
runs against the same PDF read the cached extraction instead of re-parsing. The cache is opt-in.

**Large-PDF fallback**: `crane check-all` may exceed practical completion time on documents larger
than ~200 pages (text-completeness is the dominant cost). When the aggregator times out or produces
empty output, the checker MAY fall back to per-dimension subcommands (`crane text`, `crane heading`,
`crane nesting`, `crane table`, `crane figure`, `crane mermaid`, `crane ocr`). If the fallback
samples rather than exhausts a dimension (e.g. text-completeness checked on a subset of pages), the
checker MUST disclose the sampling scope in the audit report's footer under a `## Workflow
Deviations` section so downstream readers know which dimensions have full coverage versus sampling
coverage.
