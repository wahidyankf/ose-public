# crane-cli

Crane helps turn PDFs into dependable Markdown evidence. It is a local F# command-line tool for
checking extraction quality, headings, tables, figures, OCR, and report inputs in a repeatable way.
🪶

## Start with the command help

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run crane-cli:run -- --help
```

Run
`./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run crane-cli:run -- <command> --help`
to explore a specific operation. The main groups are `pdf`, `text`, `heading`, `nesting`, `table`,
`figure`, `mermaid`, `ocr`, `report`, `skiplist`, and `check-all`.

## Local prerequisites

Most checks run with the repository toolchain. OCR additionally needs Tesseract and Poppler:

| Platform      | Install command                                                                      |
| ------------- | ------------------------------------------------------------------------------------ |
| macOS         | `brew install tesseract poppler`                                                     |
| Ubuntu/Debian | `sudo apt-get install tesseract-ocr libleptonica-dev libtesseract-dev poppler-utils` |

Point `TESSDATA_PREFIX` at your local Tesseract data directory when your installation needs it.

## Build and verify

```bash
npm exec nx -- run crane-cli:build
npm exec nx -- run crane-cli:test:quick
npm exec nx -- run crane-cli:test:e2e
```

The executable is written to `apps/crane-cli/dist/` by the build target. Its behaviour specifications
live in [the Crane Gherkin suite](../../specs/apps/crane/cli/behaviours/README.md).

## Code map

- `src/Adapters/In/` — command-line parsing and dispatch
- [`../../libs/fsharp-crane-core/src/Core/`](../../libs/fsharp-crane-core/src/Core/) — shared domain
  types, ports, and checking logic
- [`../../libs/fsharp-crane-core/src/Adapters/Out/`](../../libs/fsharp-crane-core/src/Adapters/Out/) —
  shared PDF and OCR integrations
- `Program.fs` — local composition root

The shape is deliberately ports-and-adapters: the checking logic can stay understandable while file
and OCR integrations remain at the edge.

## BDD and Testing

The canonical corpus is `specs/apps/crane/cli/behaviours/`. `test:unit` runs in-process adapters
with injected boundary doubles, and `test:e2e` exercises the built CLI through its public process
boundary. Matching `test:coverage:unit`, `test:coverage:e2e`, `test:coverage:behaviour`, and
aggregate `test:coverage` validate closure statically. Integration is omitted because the CLI owns
the public process adapter while fsharp-crane-core owns and tests the non-networked local-resource
boundary separately.
