# crane-cli Rust Migration

Port `apps/crane-cli/` from F# (net10.0 / Argu / PdfPig) to Rust (Cargo / clap / lopdf).
Preserves all 11 subcommands, elevates OCR from a placeholder stub to a real tesseract pipeline,
and archives the F# source to `archived/crane-cli/`.

## Navigation

- [Business Rationale](brd.md)
- [Product Requirements](prd.md)
- [Technical Approach](tech-docs.md)
- [Delivery Checklist](delivery.md)

## Status: Not Started

## Approach Summary

Replace the F# / .NET 10 toolchain dependency (currently only used by crane-cli) with the
standard Rust toolchain already shared by rhino-cli, organiclever-be, ose-cli, ayokoding-cli,
and libs/rust-commons. The F# OCR implementation was always a placeholder stub; the Rust port
implements real tesseract-based OCR via pdftoppm page rasterization. All other checkers are
direct behavioral ports using idiomatic Rust equivalents with identical JSON output shape.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
