# Crane CLI — Architecture

The current, as-built system. A change that alters an actor, a container, a component
responsibility, a relationship, or a boundary updates this document in the same delivery unit.

## Scope

`crane-cli` turns a PDF into dependable Markdown evidence. It extracts text, tables, figures, and
OCR output, then checks headings, nesting, Mermaid syntax, and OCR quality, and records the result
in a report. Everything runs locally against files on disk; the tool never reaches the network.

## System Context

```mermaid
flowchart LR
    accTitle: System Context
    accDescr: Repository contributor leads to crane-cli; pdf-to-md agents leads to crane-cli; Quality-gate workflow leads to crane-cli; crane-cli leads to PDF and Markdown files; crane-cli leads to Report and skiplist files; and 1 more links.
    DEV[Repository<br/>contributor] --> CLI[crane-cli]
    AGENT[pdf-to-md agents] --> CLI
    GATE[Quality-gate<br/>workflow] --> CLI
    CLI --> PDF[(PDF and Markdown<br/>files)]
    CLI --> REPORT[(Report and skiplist<br/>files)]
    CLI --> TESS[Tesseract language<br/>data<br/>apps/crane-cli/<br/>tessdata]
```

Three callers share one argv grammar and one JSON output shape. The agents are the reason the
output is JSON rather than prose: a caller parses it, so a field name is part of the contract.

## Containers

| Container                 | What it is                                 | How it is reached                   |
| ------------------------- | ------------------------------------------ | ----------------------------------- |
| `crane-cli`               | one .NET 10 executable                     | `nx run crane-cli:run -- <command>` |
| `apps/crane-cli/tessdata` | Tesseract language data the OCR path loads | read from disk at OCR time          |

## Components

Crane is ports-and-adapters. The executable owns its inbound command adapter and composition root;
`fsharp-crane-core` owns the rules, outbound adapters, and local-resource managers.

```mermaid
flowchart TD
    accTitle: Components
    accDescr: crane-cli Adapters/In/CliAdapter leads to fsharp-crane-core Core/Logic; fsharp-crane-core Core/Logic leads to fsharp-crane-core Core/Domain; fsharp-crane-core Core/Logic leads to fsharp-crane-core Adapters/Out.
    IN[crane-cli<br/>Adapters/In/<br/>CliAdapter] --> LOGIC[fsharp-crane-core<br/>Core/Logic]
    LOGIC --> DOMAIN[fsharp-crane-core<br/>Core/Domain]
    LOGIC --> OUT[fsharp-crane-core<br/>Adapters/Out]
```

| Component      | Responsibility                                                                               |
| -------------- | -------------------------------------------------------------------------------------------- |
| `Core/Domain`  | the finding, the PDF metadata record, and the report — the vocabulary every check reports in |
| `Core/Logic`   | one module per check: text, heading, nesting, table, figure, Mermaid, OCR, report, skiplist  |
| `Adapters/In`  | the argv surface — parsing, dispatch, and JSON rendering                                     |
| `Adapters/Out` | PDF extraction and OCR, the two places a real external tool is invoked                       |

`PdfExtractionCache` sits in `Core/Logic` rather than in the PDF adapter: extraction is expensive
and several checks read the same document, so the cache is a rule about how often the adapter is
called, not part of the adapter itself.

## Constraints

**JSON output is a contract.** A command's stdout shape is consumed by agents. Renaming or removing
a field is a breaking change and needs a scenario change in the same delivery unit.

**Unit proof stays in process.** Report and skiplist logic accepts injected file, clock, ID, and
environment dependencies; Unit scenarios use deterministic in-memory implementations. The library's
real report, skiplist, and extraction-cache filesystem paths run only in Integration or through the
public CLI process.

**No network.** Extraction, OCR, and validation are entirely local; a machine without connectivity
runs the whole tool.

## Related

- [Behaviours](./behaviours/README.md) — the scenarios this system must satisfy.
- [`apps/crane-cli/README.md`](../../../../apps/crane-cli/README.md) — the implementing project.
